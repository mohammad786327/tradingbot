
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createChart } from 'lightweight-charts';
import { binanceWS } from '@/utils/binanceWebSocket';
import { calculateGridLines } from '@/utils/gridUtils';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const GridChartPanel = ({ symbol, timeframe = '1m', gridSettings }) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const gridLinesRefs = useRef([]); 
  const currentPriceRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const subscriptionRef = useRef(null);

  // Helper to update line colors based on current price
  // Using ref access ensures we don't need to recreate this function when state changes
  const updateGridLineColors = useCallback((price) => {
    if (!seriesRef.current || !chartRef.current || gridLinesRefs.current.length === 0) return;
    
    gridLinesRefs.current.forEach((lineObj, index) => {
      const { priceLine, options } = lineObj;
      const isBuy = options.price < price;
      const newColor = isBuy ? '#10b981' : '#ef4444'; 
      
      // If color needs to change
      if (options.color !== newColor) {
         try {
             seriesRef.current.removePriceLine(priceLine);
             const newOptions = { ...options, color: newColor };
             const newPriceLine = seriesRef.current.createPriceLine(newOptions);
             gridLinesRefs.current[index] = { priceLine: newPriceLine, options: newOptions };
         } catch(e) {}
      }
    });
  }, []);

  // Separate effect for grid lines to prevent chart re-initialization
  useEffect(() => {
    if (!seriesRef.current || !chartRef.current) return;

    // Clear existing lines first
    gridLinesRefs.current.forEach(l => {
        try { seriesRef.current.removePriceLine(l.priceLine); } catch(e) {}
    });
    gridLinesRefs.current = [];

    if (!gridSettings) {
        return;
    }

    const lines = calculateGridLines(
        gridSettings.lowerPrice,
        gridSettings.upperPrice,
        gridSettings.numGrids,
        gridSettings.gridSpacingType,
        gridSettings.gridSpacingValue
    );

    const currentPrice = currentPriceRef.current || 0;

    lines.forEach(lineData => {
        let color = '#3b82f6'; // default blue
        if (currentPrice > 0) {
            color = lineData.price < currentPrice ? '#10b981' : '#ef4444';
        } else {
            color = lineData.type === 'buy' ? '#10b981' : '#ef4444';
        }

        const options = {
            price: lineData.price,
            color: color,
            lineWidth: 1,
            lineStyle: 2, // Dashed
            axisLabelVisible: true,
            title: lineData.label,
        };

        try {
            const priceLine = seriesRef.current.createPriceLine(options);
            gridLinesRefs.current.push({ priceLine, options });
        } catch(e) {}
    });
  }, [gridSettings]); // Only runs when gridSettings changes (and they are stable via useMemo in parent)

  // Initial fetch of historical data
  const fetchHistoricalData = async (sym, tf) => {
    try {
      const response = await fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=${sym}&interval=${tf}&limit=100`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      const formatted = data.map(d => ({
        time: Math.floor(d[0] / 1000),
        open: parseFloat(d[1]),
        high: parseFloat(d[2]),
        low: parseFloat(d[3]),
        close: parseFloat(d[4]),
      })).sort((a, b) => a.time - b.time);
      
      if (formatted.length > 0) {
        currentPriceRef.current = formatted[formatted.length - 1].close;
      }
      return formatted;
    } catch (error) {
      console.error(`Failed to fetch history for ${sym}`, error);
      return [];
    }
  };

  // Main Chart Initialization Effect - Runs only on mount or symbol/timeframe change
  useEffect(() => {
    if (!symbol || !chartContainerRef.current) {
      setLoading(false);
      return;
    }

    setLoading(true);
    let isMounted = true;

    // Initialize Chart
    const initChart = async () => {
      // Clean up previous chart instance if it exists
      if (chartRef.current) {
        try { chartRef.current.remove(); } catch(e) {}
        chartRef.current = null;
        seriesRef.current = null;
        gridLinesRefs.current = [];
      }

      if (!isMounted) return;

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
        },
        crosshair: {
          mode: 0,
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

      chartRef.current = chart;
      seriesRef.current = candlestickSeries;

      const history = await fetchHistoricalData(symbol, timeframe);
      
      // Check if component is still mounted and series exists before setting data
      if (isMounted && chartRef.current && seriesRef.current) {
        seriesRef.current.setData(history);
        chart.timeScale().fitContent();
        setLoading(false);
      } else {
          try { chart.remove(); } catch(e) {}
      }
    };

    initChart();

    // WebSocket Subscription
    const handleWebSocketData = (data) => {
      if (!isMounted || !chartRef.current) return;

      if (data.e === 'kline' && data.s === symbol) {
        const kline = data.k;
        const closePrice = parseFloat(kline.c);
        const formattedData = {
          time: Math.floor(kline.t / 1000),
          open: parseFloat(kline.o),
          high: parseFloat(kline.h),
          low: parseFloat(kline.l),
          close: closePrice,
        };
        
        currentPriceRef.current = closePrice;

        if (seriesRef.current) {
          try {
              seriesRef.current.update(formattedData);
              updateGridLineColors(closePrice);
          } catch(e) {}
        }
      }
    };

    try {
      subscriptionRef.current = binanceWS.subscribe([symbol], 'kline', timeframe, handleWebSocketData);
    } catch (error) {
      console.error("Failed to subscribe to WebSocket in GridChartPanel:", error);
    }

    // Cleanup function
    return () => {
      isMounted = false;
      if (subscriptionRef.current) {
        try {
          binanceWS.unsubscribe(subscriptionRef.current);
          subscriptionRef.current = null;
        } catch (e) {
          console.error("Error unsubscribing from WebSocket:", e);
        }
      }
      
      if (chartRef.current) {
        try { chartRef.current.remove(); } catch(e) {}
        chartRef.current = null;
        seriesRef.current = null;
        gridLinesRefs.current = [];
      }
    };
  }, [symbol, timeframe, updateGridLineColors]); 
  // removed gridSettings from this dependency array to prevent chart recreation
  // gridSettings updates are handled by the separate useEffect above

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        try {
            chartRef.current.applyOptions({
              width: chartContainerRef.current.clientWidth,
              height: chartContainerRef.current.clientHeight,
            });
        } catch(e) {}
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] overflow-hidden flex flex-col relative w-full h-full min-h-[300px]"
    >
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-[#0f0f0f]/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-[#2a2a2a]">
        <span className="text-sm font-bold text-white">{symbol}</span>
        <span className="text-xs text-gray-400">{timeframe}</span>
        {gridSettings && (
          <div className="flex items-center gap-2 ml-2">
            <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 rounded border border-blue-500/30">GRID ACTIVE</span>
            <div className="flex gap-1">
               <span className="w-2 h-2 rounded-full bg-emerald-500" title="Buy Levels"></span>
               <span className="w-2 h-2 rounded-full bg-red-500" title="Sell Levels"></span>
            </div>
          </div>
        )}
      </div>
      
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a1a] z-20">
          <Loader2 size={32} className="text-blue-500 animate-spin" />
        </div>
      )}
      
      <div ref={chartContainerRef} className="flex-1 w-full h-full" />
    </motion.div>
  );
};

export default GridChartPanel;
