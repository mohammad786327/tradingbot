
import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';
import { createChart, CrosshairMode } from 'lightweight-charts';
import { X, Settings } from 'lucide-react';
import ErrorIndicatorFallback from './ErrorIndicatorFallback';

const IndicatorPanel = forwardRef(({ 
  title, 
  onRemove, 
  height = 160, 
  onChartReady 
}, ref) => {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);

  useImperativeHandle(ref, () => ({
    getChart: () => chartRef.current,
    getContainer: () => containerRef.current
  }));

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    let chart = null;

    try {
      chart = createChart(containerRef.current, {
        width: containerRef.current.clientWidth,
        height: height - 32, // Subtract header height
        layout: {
          background: { color: '#0f0f0f' },
          textColor: '#6b7280',
        },
        grid: {
          vertLines: { color: '#1f2937' },
          horzLines: { color: '#1f2937' },
        },
        timeScale: {
          timeVisible: true,
          borderColor: '#2a2a2a',
          visible: true,
        },
        rightPriceScale: {
          borderColor: '#2a2a2a',
          autoScale: true,
        },
        crosshair: {
          mode: CrosshairMode.Normal,
        }
      });

      chartRef.current = chart;

      if (onChartReady) {
          onChartReady(chart);
      }

      const handleResize = () => {
        if (chart && containerRef.current && chartRef.current) {
          try {
             chart.applyOptions({ 
                width: containerRef.current.clientWidth 
             });
          } catch(e) {
             console.warn("Resize failed, chart might be disposed", e);
          }
        }
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (chart) {
            try {
                chart.remove();
            } catch (e) {
                console.warn("Chart remove failed", e);
            }
            chartRef.current = null;
        }
      };
    } catch (err) {
      console.error("Failed to initialize indicator chart", err);
      if (isMountedRef.current) {
        setError("Failed to initialize chart engine.");
      }
    }
  }, [height]);

  if (error) {
    return (
        <ErrorIndicatorFallback 
            indicatorName={title} 
            error={error} 
            onRemove={onRemove}
            onRetry={() => setError(null)}
        />
    );
  }

  return (
    <div className="flex flex-col border-t border-[#2a2a2a] bg-[#1a1a1a]">
      {/* Header */}
      <div className="h-8 flex items-center justify-between px-2 bg-[#1f1f1f] border-b border-[#2a2a2a]">
        <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-300">{title}</span>
        </div>
        <div className="flex items-center gap-1">
            <button className="p-1 hover:text-white text-gray-500">
                <Settings size={12} />
            </button>
            <button onClick={onRemove} className="p-1 hover:text-red-500 text-gray-500">
                <X size={12} />
            </button>
        </div>
      </div>
      
      {/* Chart Container */}
      <div ref={containerRef} style={{ height: height - 32 }} className="w-full relative" />
    </div>
  );
});

export default IndicatorPanel;
