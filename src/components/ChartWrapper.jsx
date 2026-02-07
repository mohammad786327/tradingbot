import React, { useState, useEffect } from 'react';
import AdvancedTradingChart from '@/components/AdvancedTradingChart';
import IndicatorPanelManager from '@/components/IndicatorPanelManager';
import LiquidationPanel from '@/components/LiquidationPanel';
import { getLiquidationData } from '@/utils/liquidationDataManager';
import { X, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Wrapper component that renders a Chart + its associated Indicator Panels
 * Handles data state locally for this specific symbol.
 */
const ChartWrapper = ({
  symbol,
  timeframe,
  activeIndicators,
  liquidationSettings,
  onChartReady,
  onClose,
  isSingleView,
  onMaximize
}) => {
  // Derived indicators
  const activeOverlays = activeIndicators.filter(i => i.isOverlay);
  const activePanels = activeIndicators.filter(i => !i.isOverlay);

  // Local Data State
  const [chartData, setChartData] = useState([]);
  const [lastCandle, setLastCandle] = useState(null);
  const [liquidationData, setLiquidationData] = useState([]);

  // Data Update Handler
  const handleDataUpdate = (data) => {
    if (Array.isArray(data)) {
      setChartData(data);
      setLastCandle(data[data.length - 1]);
    } else {
      // Single candle update
      setLastCandle(data);
      setChartData(prev => {
         const newData = [...prev];
         if (newData.length > 0 && newData[newData.length - 1].time === data.time) {
             newData[newData.length - 1] = data;
         } else {
             newData.push(data);
         }
         return newData;
      });
    }
  };

  // Liquidation Data logic
  useEffect(() => {
    if (liquidationSettings.enabled && lastCandle?.close) {
        const data = getLiquidationData(lastCandle.close);
        setLiquidationData(data);
    } else {
        setLiquidationData([]);
    }
  }, [liquidationSettings.enabled, lastCandle?.close, symbol]);

  const shouldShowSeparateLiqPanel = liquidationSettings.enabled && Object.values(liquidationSettings.types).some(
    t => t.enabled && t.style === 'Separate Panel'
  );

  return (
    <div className="flex flex-col h-full bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] overflow-hidden relative group">
      
      {/* Chart Header / Controls Overlay */}
      <div className="absolute top-3 right-3 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {!isSingleView && onMaximize && (
            <button 
                onClick={onMaximize}
                className="p-1.5 bg-[#0f0f0f]/80 backdrop-blur text-gray-400 hover:text-white rounded-md border border-[#2a2a2a] hover:border-blue-500 transition-colors"
                title="Maximize Chart"
            >
                <Maximize2 size={14} />
            </button>
        )}
        {onClose && (
            <button 
                onClick={onClose}
                className="p-1.5 bg-[#0f0f0f]/80 backdrop-blur text-gray-400 hover:text-red-500 rounded-md border border-[#2a2a2a] hover:border-red-900 transition-colors"
                title="Remove Chart"
            >
                <X size={14} />
            </button>
        )}
      </div>

      {/* Symbol Watermark (optional, helps identify charts in grid) */}
      <div className="absolute top-3 left-3 z-10 pointer-events-none">
         <span className="text-xl font-black text-white/5 select-none">{symbol}</span>
      </div>

      {/* Main Chart */}
      <div className="flex-1 min-h-[200px] relative">
         <AdvancedTradingChart 
            symbol={symbol}
            timeframe={timeframe}
            indicators={activeOverlays}
            onDataUpdate={handleDataUpdate}
            liquidationSettings={liquidationSettings}
            liquidationData={liquidationData}
            onChartReady={(chart) => onChartReady && onChartReady(symbol, chart)}
         />
      </div>
      
      {/* Indicator Panels */}
      <div className="shrink-0 bg-[#151515] border-t border-[#2a2a2a]">
         <IndicatorPanelManager 
            panels={activePanels}
            chartData={chartData}
            onRemovePanel={() => {}} // Panels removed globally via parent settings
            onRegisterSync={(id, chart) => onChartReady && onChartReady(`${symbol}-${id}`, chart)}
            availableHeight={isSingleView ? 400 : 200} 
         />
      </div>
      
      {/* Liquidation Panel */}
      {shouldShowSeparateLiqPanel && (
        <div className="h-48 border-t border-[#2a2a2a] shrink-0">
            <LiquidationPanel 
                showLiquidations={true}
                toggleShowLiquidations={() => {}} 
                currentPrice={lastCandle?.close}
            />
        </div>
      )}
    </div>
  );
};

export default ChartWrapper;