
import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import { binanceWS } from '@/utils/binanceWebSocket';
import { calculateRSI } from '@/utils/indicators';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const RSIStrategyPreviewChart = ({ 
  symbol = 'BTCUSDT', 
  timeframe = '1m', 
  rsiValue = 30, 
  limit = 14 
}) => {
  const containerRef = useRef(null);
  const chartContainerRef = useRef(null);
  const rsiContainerRef = useRef(null);
  
  const chartRef = useRef(null);
  const rsiChartRef = useRef(null);
  
  const [currentPrice, setCurrentPrice] = useState(0);
  const [currentRSI, setCurrentRSI] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const historyRef = useRef([]);

  // Resize Observer Effect
  useEffect(() => {
    if (!containerRef.current || !chartRef.current || !rsiChartRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        
        // Calculate heights: 70% for Candle, 30% for RSI
        const candleHeight = Math.floor(height * 0.7);
        const rsiHeight = Math.floor(height * 0.3);

        // Apply new dimensions
        if (chartRef.current) {
          chartRef.current.applyOptions({ width, height: candleHeight });
          chartRef.current.timeScale().fitContent();
        }
        
        if (rsiChartRef.current) {
          rsiChartRef.current.applyOptions({ width, height: rsiHeight });
          rsiChartRef.current.timeScale().fitContent();
        }
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Initialization Effect
  useEffect(() => {
    if (!chartContainerRef.current || !rsiContainerRef.current) return;

    setLoading(true);
    let isMounted = true;

    // --- 1. Create Main Price Chart ---
    const chart = createChart(chartContainerRef.current, {
      layout: { background: { color: '#131313' }, textColor: '#666' },
      grid: { vertLines: { visible: false }, horzLines: { color: '#222' } },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight, // Initial height
      timeScale: { visible: false }, // Hide time on top chart
      rightPriceScale: { borderVisible: false, scaleMargins: { top: 0.1, bottom: 0.1 } },
      crosshair: { vertLine: { visible: true, labelVisible: false }, horzLine: { visible: true, labelVisible: true } },
    });
    
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#22c55e', downColor: '#ef4444',
      borderVisible: false, wickUpColor: '#22c55e', wickDownColor: '#ef4444'
    });

    // --- 2. Create RSI Chart ---
    const rsiChart = createChart(rsiContainerRef.current, {
      layout: { background: { color: '#131313' }, textColor: '#666' },
      grid: { vertLines: { visible: false }, horzLines: { color: '#222' } },
      width: rsiContainerRef.current.clientWidth,
      height: rsiContainerRef.current.clientHeight, // Initial height
      timeScale: { visible: true, borderColor: '#222', timeVisible: true },
      rightPriceScale: { borderVisible: false, scaleMargins: { top: 0.1, bottom: 0.1 } },
      crosshair: { vertLine: { visible: true, labelVisible: true }, horzLine: { visible: true, labelVisible: true } },
    });

    const rsiSeries = rsiChart.addLineSeries({ 
      color: '#a855f7', 
      lineWidth: 2,
      priceScaleId: 'right' 
    });
    
    // Add Threshold Line
    const thresholdLine = rsiSeries.createPriceLine({
       price: parseFloat(rsiValue),
       color: '#f59e0b', // Amber/Yellow for trigger
       lineWidth: 1,
       lineStyle: 2, // Dashed
       axisLabelVisible: true,
       title: 'Trigger',
    });

    // Sync References
    chartRef.current = chart;
    rsiChartRef.current = rsiChart;

    // Fetch Initial Data
    const fetchData = async () => {
       try {
         const res = await fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${timeframe}&limit=100`);
         const data = await res.json();
         const formatted = data.map(d => ({
            time: Math.floor(d[0]/1000),
            open: parseFloat(d[1]), high: parseFloat(d[2]),
            low: parseFloat(d[3]), close: parseFloat(d[4])
         }));
         
         if (isMounted && chartRef.current && rsiChartRef.current) {
             historyRef.current = formatted;
             candleSeries.setData(formatted);
             
             const closes = formatted.map(c => c.close);
             const rsiVals = calculateRSI(closes, parseInt(limit));
             
             // Align RSI data with timestamps
             // calculateRSI returns array same length or shorter depending on implementation. 
             // Assuming it handles leading periods by returning fewer or nulls.
             // Usually calculateRSI returns array of valid values.
             // We need to map them back to the end of the timeline.
             
             const diff = formatted.length - rsiVals.length;
             const rsiData = rsiVals.map((val, i) => ({
                 time: formatted[i + diff].time,
                 value: val
             }));
             
             rsiSeries.setData(rsiData);
             
             if (formatted.length) {
                setCurrentPrice(formatted[formatted.length-1].close);
                if(rsiData.length) setCurrentRSI(rsiData[rsiData.length-1].value);
             }
             
             chart.timeScale().fitContent();
             rsiChart.timeScale().fitContent();
             setLoading(false);
         }
       } catch (e) {
         console.error(e);
         if (isMounted) setLoading(false);
       }
    };

    fetchData();

    // WS Update
    const handleWS = (data) => {
       if (!isMounted || !chartRef.current || !rsiChartRef.current) return;

       if (data.e === 'kline') {
          const k = data.k;
          const candle = {
             time: Math.floor(k.t/1000),
             open: parseFloat(k.o), high: parseFloat(k.h),
             low: parseFloat(k.l), close: parseFloat(k.c)
          };
          
          try {
              candleSeries.update(candle);
              setCurrentPrice(candle.close);

              // Update history for RSI
              const last = historyRef.current[historyRef.current.length-1];
              if (last && last.time === candle.time) {
                 historyRef.current[historyRef.current.length-1] = candle;
              } else {
                 historyRef.current.push(candle);
                 if (historyRef.current.length > 200) historyRef.current.shift();
              }

              // Recalc RSI on every update (simplified for consistency)
              const rsiVals = calculateRSI(historyRef.current.map(c => c.close), parseInt(limit));
              const lastRSI = rsiVals[rsiVals.length-1];
              
              if (!isNaN(lastRSI)) {
                 rsiSeries.update({ time: candle.time, value: lastRSI });
                 setCurrentRSI(lastRSI);
              }
          } catch(e) {
            // silent fail for update collisions
          }
       }
    };

    const sub = binanceWS.subscribe([symbol], 'kline', timeframe, handleWS);
    
    // Cleanup
    return () => {
       isMounted = false;
       binanceWS.unsubscribe(sub);
       if(chartRef.current) { try { chartRef.current.remove(); } catch(e) {} chartRef.current = null; }
       if(rsiChartRef.current) { try { rsiChartRef.current.remove(); } catch(e) {} rsiChartRef.current = null; }
    };

  }, [symbol, timeframe, rsiValue, limit]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full min-h-[520px] bg-[#131313] rounded-xl overflow-hidden border border-[#2a2a2a] relative flex flex-col"
    >
       {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#131313]/80 backdrop-blur-sm">
             <Loader2 className="animate-spin text-purple-500 w-10 h-10" />
          </div>
       )}
       
       {/* Price Chart Section - 70% Height */}
       <div className="flex-[0.7] relative w-full min-h-0">
           <div ref={chartContainerRef} className="w-full h-full" />
           
           {/* Price Overlay */}
           <div className="absolute top-2 left-3 z-10 pointer-events-none bg-[#131313]/50 px-2 py-1 rounded border border-white/5 backdrop-blur-md">
               <span className="text-white font-bold text-sm">{symbol}</span>
               <span className="text-gray-400 text-xs ml-2">${currentPrice.toLocaleString()}</span>
           </div>
       </div>

       {/* RSI Chart Section - 30% Height */}
       <div className="flex-[0.3] relative w-full border-t border-[#222] min-h-0">
           <div ref={rsiContainerRef} className="w-full h-full" />
           
           {/* RSI Overlay */}
           <div className="absolute top-2 left-3 z-10 pointer-events-none flex items-center gap-2 bg-[#131313]/50 px-2 py-1 rounded border border-white/5 backdrop-blur-md">
               <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">RSI ({limit})</span>
               <span className={cn(
                   "text-[10px] font-mono font-bold px-1.5 py-0.5 rounded transition-colors",
                   currentRSI <= rsiValue ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-[#222] text-gray-300 border border-[#333]"
               )}>
                   {currentRSI.toFixed(2)}
               </span>
           </div>
       </div>
    </div>
  );
};

export default RSIStrategyPreviewChart;
