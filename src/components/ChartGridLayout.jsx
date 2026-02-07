import React from 'react';
import ChartWrapper from './ChartWrapper';
import { cn } from '@/lib/utils';

const ChartGridLayout = ({
  symbols,
  timeframe,
  activeIndicators,
  liquidationSettings,
  onChartReady,
  onRemoveSymbol,
  onMaximizeSymbol
}) => {
  // Determine grid columns based on number of symbols
  const getGridClass = (count) => {
      if (count === 1) return "grid-cols-1";
      if (count === 2) return "grid-cols-1 md:grid-cols-2";
      if (count <= 4) return "grid-cols-1 md:grid-cols-2";
      return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
  };

  return (
    <div className={cn("grid gap-4 w-full h-full min-h-0", getGridClass(symbols.length))}>
      {symbols.map(symbol => (
        <div key={symbol} className="min-h-[300px] h-full overflow-hidden">
            <ChartWrapper
                symbol={symbol}
                timeframe={timeframe}
                activeIndicators={activeIndicators}
                liquidationSettings={liquidationSettings}
                onChartReady={onChartReady}
                onClose={() => onRemoveSymbol(symbol)}
                onMaximize={() => onMaximizeSymbol(symbol)}
                isSingleView={symbols.length === 1}
            />
        </div>
      ))}
    </div>
  );
};

export default ChartGridLayout;