
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createChart } from 'lightweight-charts';
import { binanceWS } from '@/utils/binanceWebSocket';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const DCAChartPanel = ({ symbol, timeframe = '15m', dcaSettings }) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const dcaLinesRefs = useRef([]); 
  const currentPriceRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const subscriptionRef = useRef(null);

  // Helper to calculate DCA levels
  const calculateDCALevels = (basePrice, settings) => {
      if (!settings || !basePrice) return [];
      
      const levels = [];
      const stepPercent = parseFloat(settings.stepScale) || 1.0;
      const maxOrders = parseInt(settings.maxOrders) || 5;
      
      // Target Profit Line (Theoretical)
      levels.push({
          price: basePrice * 1.02, // Assumed 2% take profit for visualization
          color: '#10b981', // Green
          title: 'Target Profit (Est)',
          lineStyle: 0 // Solid
      });

      // Entry Price
      levels.push({
          price: basePrice,
          color: '#3b82f6', // Blue
          title: 'Entry / Base',
          lineStyle: 2 // Dashed
      });

      // Safety Orders
      for (let i = 1; i <= maxOrders; i++) {
          // Simple visualization: each order is stepPercent lower than entry
          // In real DCA, this might be compounding or complex scaling
          const priceLevel = basePrice * (1 - (stepPercent * i / 100));
          levels.push({
              price: priceLevel,
              color: '#ef4444', // Red for buy dips
              title: `Safety Order ${i}`,
              lineStyle: 2 // Dashed
          });
      }
      return levels;
  };

  // Update lines based on current price or settings
  const updateDCALines = useCallback(() => {
    if (!seriesRef.current || !dcaSettings || !chartRef.current) return;

    // Clear existing lines
    dcaLinesRefs.current.forEach(l => {
        try { seriesRef.current.removePriceLine(l); } catch(e) {}
    });
    dcaLinesRefs.current = [];

    const basePrice = currentPriceRef.current;
    if (!basePrice) return;

    const lines = calculateDCALevels(basePrice, dcaSettings);

    lines.forEach(lineData => {
        try {
            const priceLine = seriesRef.current.createPriceLine({
                price: lineData.price,
                color: lineData.color,
                lineWidth: 1,
                lineStyle: lineData.lineStyle,
                axisLabelVisible: true,
                title: lineData.title,
            });
            dcaLinesRefs.current.push(priceLine);
        } catch(e) {}
    });
  }, [dcaSettings]);

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

  // Main Chart Initialization
  useEffect(() => {
    if (!symbol || !chartContainerRef.current) {
      setLoading(false);
      return;
    }

    setLoading(true);
    let isMounted = true;

    const initChart = async () => {
      if (chartRef.current) {
        try { chartRef.current.remove(); } catch(e) {}
        chartRef.current = null;
        seriesRef.current = null;
        dcaLinesRefs.current = [];
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
        upColor: '#8b5cf6', // Purple for DCA context
        downColor: '#ec4899', // Pink for DCA context
        borderUpColor: '#8b5cf6',
        borderDownColor: '#ec4899',
        wickUpColor: '#8b5cf6',
        wickDownColor: '#ec4899',
      });

      chartRef.current = chart;
      seriesRef.current = candlestickSeries;

      const history = await fetchHistoricalData(symbol, timeframe);
      
      if (isMounted && chartRef.current) {
          if (seriesRef.current) {
            seriesRef.current.setData(history);
            chart.timeScale().fitContent();
            // Draw initial lines
            updateDCALines();
          }
          setLoading(false);
      } else {
          try { chart.remove(); } catch(e) {}
      }
    };

    initChart();

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
          try { seriesRef.current.update(formattedData); } catch(e) {}
        }
      }
    };

    try {
      subscriptionRef.current = binanceWS.subscribe([symbol], 'kline', timeframe, handleWebSocketData);
    } catch (error) {
      console.error("Failed to subscribe to WebSocket in DCAChartPanel:", error);
    }

    return () => {
      isMounted = false;
      if (subscriptionRef.current) {
        try {
          binanceWS.unsubscribe(subscriptionRef.current);
          subscriptionRef.current = null;
        } catch (e) {
          console.error("Error unsubscribing:", e);
        }
      }
      
      if (chartRef.current) {
        try { chartRef.current.remove(); } catch(e) {}
        chartRef.current = null;
        seriesRef.current = null;
        dcaLinesRefs.current = [];
      }
    };
  }, [symbol, timeframe]); // removed updateDCALines from dep array to avoid loops, called explicitly

  // Effect to update lines when settings change
  useEffect(() => {
      if (chartRef.current) {
          updateDCALines();
      }
  }, [dcaSettings, updateDCALines]);

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
        {dcaSettings && (
          <div className="flex items-center gap-2 ml-2">
            <span className="text-[10px] bg-purple-500/20 text-purple-400 px-1.5 rounded border border-purple-500/30">DCA ACTIVE</span>
            <div className="flex gap-1">
               <span className="w-2 h-2 rounded-full bg-emerald-500" title="Take Profit"></span>
               <span className="w-2 h-2 rounded-full bg-red-500" title="Safety Orders"></span>
            </div>
          </div>
        )}
      </div>
      
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a1a] z-20">
          <Loader2 size={32} className="text-purple-500 animate-spin" />
        </div>
      )}
      
      <div ref={chartContainerRef} className="flex-1 w-full h-full" />
    </motion.div>
  );
};

export default DCAChartPanel;
