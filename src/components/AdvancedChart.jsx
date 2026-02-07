import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import { theme } from '@/utils/cyberpunkTheme';
import { realtimeManager } from '@/utils/realtimeDataManager';

const AdvancedChart = ({ symbol = 'BTCUSDT' }) => {
  const chartContainerRef = useRef();
  const [currentTimeframe, setCurrentTimeframe] = useState('1h');

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0f0f0f' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: '#1f2937' },
        horzLines: { color: '#1f2937' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#4ade80',
      downColor: '#f87171',
      borderVisible: false,
      wickUpColor: '#4ade80',
      wickDownColor: '#f87171',
    });

    // Mock initial data
    const generateData = () => {
      const res = [];
      let time = Math.floor(Date.now() / 1000) - 1000 * 3600;
      let price = 42000;
      for (let i = 0; i < 100; i++) {
        const volatility = Math.random() * 200 - 100;
        price += volatility;
        res.push({
          time: time + i * 3600,
          open: price,
          high: price + Math.random() * 100,
          low: price - Math.random() * 100,
          close: price + (Math.random() * 100 - 50),
        });
      }
      return res;
    };

    candleSeries.setData(generateData());

    // Resize handler
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [symbol]);

  return (
    <div className={`${theme.colors.card} p-4 rounded-2xl flex flex-col h-full`}>
      <div className="flex justify-between items-center mb-4">
         <div className="flex items-center gap-4">
            <h3 className="font-bold text-white text-lg">{symbol} Chart</h3>
            <div className="flex bg-[#1a1a1a] rounded-lg p-1 gap-1">
                {['1m', '15m', '1h', '4h', '1d'].map(tf => (
                    <button 
                        key={tf}
                        onClick={() => setCurrentTimeframe(tf)}
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${currentTimeframe === tf ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        {tf}
                    </button>
                ))}
            </div>
         </div>
      </div>
      <div ref={chartContainerRef} className="flex-1 w-full min-h-[300px]" />
    </div>
  );
};

export default AdvancedChart;