
import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import { binanceWS } from '@/utils/binanceWebSocket';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const CandleStrikeChartPanel = ({ 
    symbol, 
    timeframe = '5m', 
    botSettings, 
    onCandleCountUpdate 
}) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const currentPriceRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const subscriptionRef = useRef(null);
  
  // Data ref to hold all candles for calculation without triggering re-renders
  const candleDataRef = useRef([]);

  // Calculation Logic
  const updateStreakCounts = (candles) => {
    if (!candles || candles.length === 0) return;

    let greenStreak = 0;
    let redStreak = 0;
    
    // Start from the last fully closed candle.
    if (candles.length > 1) {
        // Iterate backwards starting from second to last (last closed)
        for (let i = candles.length - 2; i >= 0; i--) {
            const c = candles[i];
            const isGreen = c.close >= c.open;
            
            if (isGreen) {
                if (redStreak > 0) break; // We were counting red, now hit green -> stop
                greenStreak++;
            } else {
                if (greenStreak > 0) break; // We were counting green, now hit red -> stop
                redStreak++;
            }
        }
    }
    
    // Debug log (throttled conceptually, but here we log on change)
    // console.log(`[CandleStrikeChart] ${symbol} Streaks: Green=${greenStreak}, Red=${redStreak}`);
    
    if (onCandleCountUpdate) {
        onCandleCountUpdate({ 
            symbol,
            green: greenStreak, 
            red: redStreak,
            closePrice: candles[candles.length - 1].close
        });
    }
  };

  // Initial fetch of historical data
  const fetchHistoricalData = async (sym, tf) => {
    try {
      // console.log(`[CandleStrikeChart] Fetching history for ${sym} ${tf}`);
      const response = await fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=${sym}&interval=${tf}&limit=200`);
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

  // Main Chart Initialization Effect
  useEffect(() => {
    if (!symbol || !chartContainerRef.current) {
      setLoading(false);
      return;
    }

    setLoading(true);
    let isMounted = true;

    const initChart = async () => {
      // Clean up previous chart instance
      if (chartRef.current) {
        try { chartRef.current.remove(); } catch(e) {}
        chartRef.current = null;
        seriesRef.current = null;
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
      
      if (isMounted && chartRef.current) {
          candleDataRef.current = history; // Store initial history
          updateStreakCounts(history); // Initial calc

          if (seriesRef.current) {
            seriesRef.current.setData(history);
            chart.timeScale().fitContent();
          }
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
        const candleTime = Math.floor(kline.t / 1000);
        const isCandleClosed = kline.x;
        
        const formattedData = {
          time: candleTime,
          open: parseFloat(kline.o),
          high: parseFloat(kline.h),
          low: parseFloat(kline.l),
          close: closePrice,
        };
        
        currentPriceRef.current = closePrice;

        if (seriesRef.current) {
          try { seriesRef.current.update(formattedData); } catch(e) {}
        }

        // Update local data store for streak calc
        const currentData = candleDataRef.current;
        if (currentData.length > 0) {
            const lastCandle = currentData[currentData.length - 1];
            if (lastCandle.time === candleTime) {
                // Update existing candle (forming)
                currentData[currentData.length - 1] = formattedData;
            } else {
                // New candle started
                currentData.push(formattedData);
            }
            
            // Re-calculate streaks. 
            // We should ideally do this on every update to show 'potential' streaks or only on close.
            // Requirement says "Candle Strike" usually implies CLOSED candles. 
            // Our logic in updateStreakCounts() iterates from 'candles.length - 2' (last closed).
            // So calling it continuously is fine, it will stabilize until a new candle closes.
            
            // Only update counts if the candle actually closed OR if we want live feedback
            // Assuming live feedback is desired for chart, but trigger relies on logic inside.
            if (isCandleClosed) {
                console.log(`[CandleStrikeChart] Candle Closed for ${symbol}`);
            }
            updateStreakCounts(currentData);
        }
      }
    };

    try {
      // console.log(`[CandleStrikeChart] Subscribing to WS for ${symbol}`);
      subscriptionRef.current = binanceWS.subscribe([symbol], 'kline', timeframe, handleWebSocketData);
    } catch (error) {
      console.error("Failed to subscribe to WebSocket in CandleStrikeChartPanel:", error);
    }

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
      }
    };
  }, [symbol, timeframe]); // Re-run if symbol or timeframe changes

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
        {botSettings && (
          <div className="flex items-center gap-2 ml-2">
            <span className="text-[10px] bg-pink-500/20 text-pink-400 px-1.5 rounded border border-pink-500/30">CANDLE STRIKE</span>
            <span className="text-[10px] text-gray-500">
                {botSettings.direction === 'Auto (Follow Color)' ? 'AUTO' : botSettings.direction}
            </span>
          </div>
        )}
      </div>
      
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a1a] z-20">
          <Loader2 size={32} className="text-pink-500 animate-spin" />
        </div>
      )}
      
      <div ref={chartContainerRef} className="flex-1 w-full h-full" />
    </motion.div>
  );
};

export default CandleStrikeChartPanel;
