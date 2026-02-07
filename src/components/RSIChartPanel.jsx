
import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import { binanceWS } from '@/utils/binanceWebSocket';
import { calculateRSI } from '@/utils/indicators';
import { Loader2 } from 'lucide-react';

const RSIChartPanel = ({ symbol, timeframe = '15m', rsiSettings }) => {
  const chartContainerRef = useRef(null);
  const rsiContainerRef = useRef(null);
  const chartRef = useRef(null);
  const rsiChartRef = useRef(null);
  const seriesRef = useRef(null);
  const rsiSeriesRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const historyRef = useRef([]);

  const fetchHistoricalData = async (sym, tf) => {
    try {
      const response = await fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=${sym}&interval=${tf}&limit=200`);
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

  useEffect(() => {
    if (!symbol || !chartContainerRef.current || !rsiContainerRef.current) return;

    setLoading(true);
    let isMounted = true;

    // Initialize Charts
    const initCharts = async () => {
        // Cleanup old charts
        if (chartRef.current) { try { chartRef.current.remove(); } catch(e) {} chartRef.current = null; }
        if (rsiChartRef.current) { try { rsiChartRef.current.remove(); } catch(e) {} rsiChartRef.current = null; }

        if (!isMounted) return;

        // Main Price Chart
        const chart = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
            layout: { background: { color: '#0f0f0f' }, textColor: '#6b7280' },
            grid: { vertLines: { color: '#1f2937' }, horzLines: { color: '#1f2937' } },
            timeScale: { borderColor: '#2a2a2a', timeVisible: true },
            rightPriceScale: { borderColor: '#2a2a2a' },
        });

        const candlestickSeries = chart.addCandlestickSeries({
            upColor: '#10b981', downColor: '#ef4444',
            borderUpColor: '#10b981', borderDownColor: '#ef4444',
            wickUpColor: '#10b981', wickDownColor: '#ef4444',
        });

        chartRef.current = chart;
        seriesRef.current = candlestickSeries;

        // RSI Chart
        const rsiChart = createChart(rsiContainerRef.current, {
            width: rsiContainerRef.current.clientWidth,
            height: rsiContainerRef.current.clientHeight,
            layout: { background: { color: '#0f0f0f' }, textColor: '#6b7280' },
            grid: { vertLines: { color: '#1f2937' }, horzLines: { color: '#1f2937' } },
            timeScale: { visible: true, borderColor: '#2a2a2a', timeVisible: true },
            rightPriceScale: { borderColor: '#2a2a2a' },
        });

        const rsiLineSeries = rsiChart.addLineSeries({
            color: '#d946ef',
            lineWidth: 2,
        });

        const oversold = rsiSettings?.oversold ? parseFloat(rsiSettings.oversold) : 30;
        const overbought = rsiSettings?.overbought ? parseFloat(rsiSettings.overbought) : 70;

        rsiLineSeries.createPriceLine({ price: overbought, color: '#ef4444', lineWidth: 1, lineStyle: 2, axisLabelVisible: false });
        rsiLineSeries.createPriceLine({ price: oversold, color: '#10b981', lineWidth: 1, lineStyle: 2, axisLabelVisible: false });

        rsiChartRef.current = rsiChart;
        rsiSeriesRef.current = rsiLineSeries;

        // Load Data
        const history = await fetchHistoricalData(symbol, timeframe);
        
        if (isMounted && chartRef.current && rsiChartRef.current) {
            historyRef.current = history;

            if (history.length > 0) {
                candlestickSeries.setData(history);
                chart.timeScale().fitContent();

                const closes = history.map(h => h.close);
                const period = rsiSettings?.length ? parseInt(rsiSettings.length) : 14;
                const rsiValues = calculateRSI(closes, period);
                
                const rsiData = history.map((h, i) => ({
                    time: h.time,
                    value: rsiValues[i]
                })).filter(d => !isNaN(d.value));

                rsiLineSeries.setData(rsiData);
                rsiChart.timeScale().fitContent();
                
                // Sync logic would go here
                chart.timeScale().subscribeVisibleTimeRangeChange(range => {
                    if (rsiChartRef.current) {
                        try { rsiChartRef.current.timeScale().setVisibleRange(range); } catch(e) {}
                    }
                });
                rsiChart.timeScale().subscribeVisibleTimeRangeChange(range => {
                    if (chartRef.current) {
                        try { chartRef.current.timeScale().setVisibleRange(range); } catch(e) {}
                    }
                });
            }
            setLoading(false);
        } else {
            try { chart.remove(); } catch(e) {}
            try { rsiChart.remove(); } catch(e) {}
        }
    };

    initCharts();

    // WebSocket Logic
    const handleWebSocketData = (data) => {
        if (!isMounted || !chartRef.current || !rsiChartRef.current) return;

        if (data.e === 'kline' && data.s === symbol) {
            const kline = data.k;
            const candle = {
                time: Math.floor(kline.t / 1000),
                open: parseFloat(kline.o),
                high: parseFloat(kline.h),
                low: parseFloat(kline.l),
                close: parseFloat(kline.c),
            };

            if (seriesRef.current) {
                try { seriesRef.current.update(candle); } catch(e) {}
            }

            // Update history buffer safely
            const lastStored = historyRef.current[historyRef.current.length - 1];
            if (lastStored && lastStored.time === candle.time) {
                historyRef.current[historyRef.current.length - 1] = candle;
            } else {
                historyRef.current.push(candle);
                if (historyRef.current.length > 300) historyRef.current.shift();
            }

            // Recalculate RSI for live update
            const closes = historyRef.current.map(h => h.close);
            const period = rsiSettings?.length ? parseInt(rsiSettings.length) : 14;
            const rsiValues = calculateRSI(closes, period);
            const lastRsi = rsiValues[rsiValues.length - 1];
            
            if (!isNaN(lastRsi) && rsiSeriesRef.current) {
                try { rsiSeriesRef.current.update({ time: candle.time, value: lastRsi }); } catch(e) {}
            }
        }
    };

    const sub = binanceWS.subscribe([symbol], 'kline', timeframe, handleWebSocketData);

    // Resize Observer
    const handleResize = () => {
        if (chartContainerRef.current && chartRef.current) {
            try { chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth, height: chartContainerRef.current.clientHeight }); } catch(e) {}
        }
        if (rsiContainerRef.current && rsiChartRef.current) {
            try { rsiChartRef.current.applyOptions({ width: rsiContainerRef.current.clientWidth, height: rsiContainerRef.current.clientHeight }); } catch(e) {}
        }
    };
    window.addEventListener('resize', handleResize);

    return () => {
        isMounted = false;
        window.removeEventListener('resize', handleResize);
        binanceWS.unsubscribe(sub);
        if (chartRef.current) { try { chartRef.current.remove(); } catch(e) {} chartRef.current = null; }
        if (rsiChartRef.current) { try { rsiChartRef.current.remove(); } catch(e) {} rsiChartRef.current = null; }
    };
  }, [symbol, timeframe, rsiSettings]); // Re-run if settings change

  return (
    <div className="flex flex-col w-full h-full relative">
       {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a1a] z-20">
          <Loader2 size={32} className="text-purple-500 animate-spin" />
        </div>
      )}
      
      <div className="flex-1 w-full relative border-b border-[#2a2a2a] min-h-[250px]">
         <div ref={chartContainerRef} className="w-full h-full" />
         <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-[#0f0f0f]/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-[#2a2a2a]">
            <span className="text-sm font-bold text-white">{symbol}</span>
            <span className="text-xs text-gray-400">{timeframe}</span>
         </div>
      </div>
      
      <div className="h-[150px] w-full relative bg-[#0f0f0f]/50">
         <div ref={rsiContainerRef} className="w-full h-full" />
         <div className="absolute top-2 left-4 z-10 pointer-events-none">
            <span className="text-[10px] font-bold text-purple-400">RSI ({rsiSettings?.length || 14})</span>
         </div>
      </div>
    </div>
  );
};

export default RSIChartPanel;
