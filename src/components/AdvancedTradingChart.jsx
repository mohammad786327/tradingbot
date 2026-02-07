
import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { createChart, CrosshairMode } from 'lightweight-charts';
import { binanceWS } from '@/utils/binanceWebSocket';
import { ChartDataCache } from '@/utils/chartDataCache';
import { Loader2, AlertTriangle } from 'lucide-react';
import { calculateSMA, calculateEMA, calculateBollingerBands } from '@/utils/technicalIndicators';
import { updateLiquidationVisualizations } from '@/utils/liquidationVisualizationManager';
import { executeCustomIndicator } from '@/utils/customIndicatorExecutor';

const AdvancedTradingChart = forwardRef(({ 
  symbol, 
  timeframe, 
  indicators = [], 
  onDataUpdate,
  liquidationSettings,
  liquidationData,
  onChartReady, 
}, ref) => {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const indicatorSeriesRefs = useRef({});

  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useImperativeHandle(ref, () => ({
    getChart: () => chartRef.current,
    getData: () => chartData
  }));

  // 1. Initialize Chart
  useEffect(() => {
    if (!containerRef.current) return;

    try {
      const chart = createChart(containerRef.current, {
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
        layout: {
          background: { color: '#0f0f0f' },
          textColor: '#6b7280',
        },
        grid: {
          vertLines: { color: '#1f2937' },
          horzLines: { color: '#1f2937' },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
        },
        rightPriceScale: {
          borderColor: '#2a2a2a',
        },
        timeScale: {
          borderColor: '#2a2a2a',
          timeVisible: true,
        },
      });

      const candleSeries = chart.addCandlestickSeries({
        upColor: '#10b981',
        downColor: '#ef4444',
        borderVisible: false,
        wickUpColor: '#10b981',
        wickDownColor: '#ef4444',
      });

      chartRef.current = chart;
      candleSeriesRef.current = candleSeries;

      if (onChartReady) {
          onChartReady(chart);
      }

      const handleResize = () => {
        if (containerRef.current && chartRef.current) {
          try {
             chartRef.current.applyOptions({ 
                width: containerRef.current.clientWidth,
                height: containerRef.current.clientHeight 
             });
          } catch(e) { console.warn("Chart resize failed", e); }
        }
      };

      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
        if (chartRef.current) {
            try { chartRef.current.remove(); } catch(e) { console.warn("Chart dispose failed", e); }
            chartRef.current = null;
            candleSeriesRef.current = null;
            indicatorSeriesRefs.current = {};
        }
      };
    } catch (err) {
      console.error("Failed to initialize main chart", err);
      setError("Failed to initialize chart engine.");
    }
  }, []); 

  useEffect(() => {
     if(chartRef.current && containerRef.current) {
         try {
             chartRef.current.applyOptions({
                 width: containerRef.current.clientWidth,
                 height: containerRef.current.clientHeight
             });
         } catch(e) { console.warn("Apply options failed", e); }
     }
  });

  // 2. Fetch Data & Realtime Updates
  useEffect(() => {
    if (!symbol || !timeframe) return;

    setLoading(true);
    setError(null);
    const cached = ChartDataCache.get(symbol, timeframe);

    let sub = null;
    let isMounted = true;

    const loadData = async () => {
      let data = [];
      if (cached) {
        data = cached;
      } else {
        try {
            const res = await fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${timeframe}&limit=500`);
            if (!res.ok) throw new Error(`Binance API Error: ${res.statusText}`);
            const json = await res.json();
            
            if (!Array.isArray(json)) throw new Error("Invalid data format from API");

            data = json.map(d => ({
                time: Math.floor(d[0] / 1000),
                open: parseFloat(d[1]),
                high: parseFloat(d[2]),
                low: parseFloat(d[3]),
                close: parseFloat(d[4]),
                volume: parseFloat(d[5]),
            })).sort((a,b) => a.time - b.time);
            
            ChartDataCache.set(symbol, timeframe, data);
        } catch (err) {
            console.error("Failed to load chart data", err);
            if (isMounted) setError(`Failed to load data for ${symbol}. Please check connection.`);
        }
      }

      if (isMounted && data.length > 0) {
          setChartData(data);
          if (candleSeriesRef.current && chartRef.current) {
            try {
                candleSeriesRef.current.setData(data);
                if (onDataUpdate) onDataUpdate(data); 
            } catch(e) { console.error("SetData failed", e); }
          }
      }
      if (isMounted) setLoading(false);
    };

    loadData();

    try {
        sub = binanceWS.subscribe([symbol], 'kline', timeframe, (klineData) => {
            if (!isMounted || !chartRef.current) return;

            if (klineData.k) { 
                const k = klineData.k;
                const candle = {
                    time: Math.floor(k.t / 1000),
                    open: parseFloat(k.o),
                    high: parseFloat(k.h),
                    low: parseFloat(k.l),
                    close: parseFloat(k.c),
                    volume: parseFloat(k.v)
                };
                
                if (candleSeriesRef.current) {
                     try { candleSeriesRef.current.update(candle); } catch(e) {}
                }
                
                setChartData(prev => {
                    if (!prev || prev.length === 0) return [candle];
                    const last = prev[prev.length - 1];
                    let newData;
                    if (last && last.time === candle.time) {
                        newData = [...prev];
                        newData[prev.length - 1] = candle;
                    } else {
                        newData = [...prev, candle];
                    }
                    
                    if (onDataUpdate) onDataUpdate(newData); 
                    return newData;
                });
            }
        });
    } catch(e) { console.error("WS subscribe failed", e); }

    return () => {
        isMounted = false;
        if (sub) binanceWS.unsubscribe(sub);
    };
  }, [symbol, timeframe]);

  // 3. Handle Indicators (Overlays)
  useEffect(() => {
    if (!chartRef.current || !chartData || chartData.length === 0) return;

    // Cleanup old series
    Object.values(indicatorSeriesRefs.current).forEach(series => {
        try { chartRef.current.removeSeries(series); } catch(e) { console.warn("Remove series failed", e); }
    });
    indicatorSeriesRefs.current = {};

    indicators.forEach(ind => {
        if (!ind.enabled) return;

        try {
            // Custom Overlay Handling
            if (ind.isCustom) {
                const data = executeCustomIndicator(ind.code, chartData);
                if (data && data.length > 0) {
                     const lineSeries = chartRef.current.addLineSeries({ 
                         color: ind.color || '#e879f9', 
                         lineWidth: 2, 
                         title: ind.name 
                     });
                     lineSeries.setData(data);
                     indicatorSeriesRefs.current[`CUSTOM-${ind.id}`] = lineSeries;
                }
                return;
            }

            // Standard Indicators
            if (ind.type === 'SMA') {
                const smaData = calculateSMA(chartData, ind.period || 20);
                const lineSeries = chartRef.current.addLineSeries({ color: ind.color || '#fbbf24', lineWidth: 2, title: `SMA ${ind.period}` });
                lineSeries.setData(smaData.filter(d => !isNaN(d.value)));
                indicatorSeriesRefs.current[`SMA-${ind.id}`] = lineSeries;
            }

            if (ind.type === 'EMA') {
                const emaData = calculateEMA(chartData, ind.period || 20);
                const lineSeries = chartRef.current.addLineSeries({ color: ind.color || '#3b82f6', lineWidth: 2, title: `EMA ${ind.period}` });
                lineSeries.setData(emaData.filter(d => !isNaN(d.value)));
                indicatorSeriesRefs.current[`EMA-${ind.id}`] = lineSeries;
            }

            if (ind.type === 'Bollinger') {
                const bbData = calculateBollingerBands(chartData, ind.period || 20, ind.stdDev || 2);
                const upper = chartRef.current.addLineSeries({ color: ind.color || '#a78bfa', lineWidth: 1, title: 'BB Upper' });
                const lower = chartRef.current.addLineSeries({ color: ind.color || '#a78bfa', lineWidth: 1, title: 'BB Lower' });
                upper.setData(bbData.map(d => ({ time: d.time, value: d.upper })).filter(d => !isNaN(d.value)));
                lower.setData(bbData.map(d => ({ time: d.time, value: d.lower })).filter(d => !isNaN(d.value)));
                indicatorSeriesRefs.current[`BB-U-${ind.id}`] = upper;
                indicatorSeriesRefs.current[`BB-L-${ind.id}`] = lower;
            }
        } catch (indErr) {
            console.error(`Failed to render indicator ${ind.name}`, indErr);
        }
    });

  }, [chartData, indicators]);

  // 4. Handle Liquidation Visualization
  useEffect(() => {
      if (!chartRef.current) return;
      try {
          updateLiquidationVisualizations(
              chartRef.current,
              candleSeriesRef.current,
              liquidationSettings,
              liquidationData,
              chartData
          );
      } catch (e) { console.error("Liquidation visual update failed", e); }
  }, [liquidationSettings, liquidationData, chartData]);

  return (
    <div className="relative w-full h-full bg-[#1a1a1a] rounded-xl overflow-hidden border border-[#2a2a2a]">
      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-sm">
             <Loader2 className="animate-spin text-blue-500" size={32} />
        </div>
      )}
      {error && (
         <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#1a1a1a] text-red-500 p-4 text-center">
             <AlertTriangle size={32} className="mb-2" />
             <p className="text-sm font-bold">{error}</p>
         </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
});

export default AdvancedTradingChart;
