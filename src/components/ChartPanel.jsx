
import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import { binanceWS } from '@/utils/binanceWebSocket';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const ChartPanel = ({ symbol, timeframe, entryPrice, stopLoss, takeProfit }) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  
  // Refs to store price line objects so we can update/remove them
  const entryLineRef = useRef(null);
  const stopLossLineRef = useRef(null);
  const takeProfitLineRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const subscriptionRef = useRef(null);

  // Initial fetch of historical data
  const fetchHistoricalData = async (sym, tf) => {
    try {
      const response = await fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=${sym}&interval=${tf}&limit=100`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      return data.map(d => ({
        time: Math.floor(d[0] / 1000),
        open: parseFloat(d[1]),
        high: parseFloat(d[2]),
        low: parseFloat(d[3]),
        close: parseFloat(d[4]),
      })).sort((a, b) => a.time - b.time);
    } catch (error) {
      console.error(`Failed to fetch history for ${sym}`, error);
      return [];
    }
  };

  // Helper to update or create a price line
  const updatePriceLine = (lineRef, price, color, title) => {
    // Check if chart and series still exist before updating
    if (!seriesRef.current || !chartRef.current) return;

    // If price is invalid or cleared, remove the line
    if (!price || isNaN(parseFloat(price))) {
      if (lineRef.current) {
        try {
          seriesRef.current.removePriceLine(lineRef.current);
        } catch(e) { /* ignore cleanup errors */ }
        lineRef.current = null;
      }
      return;
    }

    const priceValue = parseFloat(price);

    // If line doesn't exist, create it
    if (!lineRef.current) {
      try {
        lineRef.current = seriesRef.current.createPriceLine({
            price: priceValue,
            color: color,
            lineWidth: 1,
            lineStyle: 2, // Dashed
            axisLabelVisible: true,
            title: title,
        });
      } catch(e) { /* ignore */ }
    } else {
      // Update existing line
      try {
        lineRef.current.applyOptions({
            price: priceValue,
            title: title,
        });
      } catch(e) { /* ignore */ }
    }
  };

  // Effect to handle trade lines updates whenever props change
  useEffect(() => {
    if (chartRef.current) {
        updatePriceLine(entryLineRef, entryPrice, '#3b82f6', 'ENTRY'); // Blue
        updatePriceLine(stopLossLineRef, stopLoss, '#ef4444', 'SL');   // Red
        updatePriceLine(takeProfitLineRef, takeProfit, '#10b981', 'TP'); // Green
    }
  }, [entryPrice, stopLoss, takeProfit]);

  useEffect(() => {
    if (!symbol) {
      setLoading(false);
      return;
    }

    setLoading(true);
    let isMounted = true;

    const initChart = async () => {
      if (!chartContainerRef.current || !isMounted) return;

      // Clean up previous chart if exists
      if (chartRef.current) {
        try {
          chartRef.current.remove();
        } catch(e) { /* ignore */ }
        chartRef.current = null;
        seriesRef.current = null;
      }

      const chart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight,
        layout: {
          background: { color: '#0f0f0f' },
          textColor: '#6b7280',
        },
        grid: {
          vertLines: { color: '#1f2937' },
          horzLines: { color: '#1f2937' },
        },
        timeScale: {
          borderColor: '#2a2a2a',
          timeVisible: true,
          secondsVisible: false,
        },
        rightPriceScale: {
          borderColor: '#2a2a2a',
          scaleMargins: {
            top: 0.1,
            bottom: 0.1,
          },
        },
        crosshair: {
          mode: 1, // Crosshair mode normal
        },
      });

      const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#10b981',
        downColor: '#ef4444',
        borderUpColor: '#10b981',
        borderDownColor: '#ef4444',
        wickUpColor: '#10b981',
        wickDownColor: '#ef4444',
      });

      // Fetch and set historical data
      const history = await fetchHistoricalData(symbol, timeframe);
      
      if (isMounted && chartContainerRef.current) {
          candlestickSeries.setData(history);
          chart.timeScale().fitContent();

          chartRef.current = chart;
          seriesRef.current = candlestickSeries;
          
          // Reset line refs when chart is recreated
          entryLineRef.current = null;
          stopLossLineRef.current = null;
          takeProfitLineRef.current = null;

          // Re-apply lines if props exist
          updatePriceLine(entryLineRef, entryPrice, '#3b82f6', 'ENTRY');
          updatePriceLine(stopLossLineRef, stopLoss, '#ef4444', 'SL');
          updatePriceLine(takeProfitLineRef, takeProfit, '#10b981', 'TP');

          setLoading(false);
      } else {
        // If unmounted before finish, cleanup immediately
        try {
            chart.remove();
        } catch(e) { /* ignore */ }
      }
    };

    initChart();

    // Subscribe to WebSocket with error handling
    try {
      const subscription = binanceWS.subscribe([symbol], 'kline', timeframe, (data) => {
        if (!isMounted || !chartRef.current) return;
        
        if (data.e === 'kline' && data.s === symbol) {
          const kline = data.k;
          const formattedData = {
            time: Math.floor(kline.t / 1000),
            open: parseFloat(kline.o),
            high: parseFloat(kline.h),
            low: parseFloat(kline.l),
            close: parseFloat(kline.c),
          };
          
          if (seriesRef.current) {
            try {
                seriesRef.current.update(formattedData);
            } catch(e) {
                console.warn("Failed to update chart series", e);
            }
          }
        }
      });
      subscriptionRef.current = subscription;
    } catch (error) {
      console.error("Failed to subscribe to WebSocket in ChartPanel:", error);
      if (isMounted) setLoading(false); 
    }

    return () => {
      isMounted = false;
      
      // Cleanup WebSocket
      if (subscriptionRef.current) {
        try {
          binanceWS.unsubscribe(subscriptionRef.current);
          subscriptionRef.current = null;
        } catch (e) {
          console.error("Error unsubscribing from WebSocket:", e);
        }
      }

      // Cleanup Chart
      if (chartRef.current) {
        try {
            chartRef.current.remove();
        } catch(e) { /* ignore */ }
        chartRef.current = null;
        seriesRef.current = null;
      }
    };
  }, [symbol, timeframe]); 

  // Handle resize
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const resizeObserver = new ResizeObserver(entries => {
      if (entries.length === 0 || !entries[0].contentRect) return;
      const { width, height } = entries[0].contentRect;
      if (chartRef.current) {
        try {
            chartRef.current.applyOptions({ width, height });
        } catch(e) { /* ignore */ }
      }
    });

    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] overflow-hidden flex flex-col relative w-full h-full max-w-full max-h-full"
    >
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-[#0f0f0f]/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-[#2a2a2a]">
        <span className="text-sm font-bold text-white">{symbol}</span>
        <span className="text-xs text-gray-400">{timeframe}</span>
      </div>
      
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a1a] z-20">
          <Loader2 size={32} className="text-blue-500 animate-spin" />
        </div>
      )}
      
      <div ref={chartContainerRef} className="flex-1 w-full h-full min-h-0" />
    </motion.div>
  );
};

export default ChartPanel;
