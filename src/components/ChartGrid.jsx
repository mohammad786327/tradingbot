import React from 'react';
import ChartPanel from './ChartPanel';
import { Activity } from 'lucide-react';

const ChartGrid = ({ symbols, timeframe }) => {
  if (!symbols || symbols.length === 0) {
    return (
      <div className="bg-[#1a1a1a] rounded-2xl p-8 border border-[#2a2a2a] h-full min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <Activity size={48} className="text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Select symbols to view live charts</p>
        </div>
      </div>
    );
  }

  const count = symbols.length;

  // Single chart case
  if (count === 1) {
    return (
      <div className="h-full w-full overflow-hidden rounded-2xl">
        <ChartPanel symbol={symbols[0]} timeframe={timeframe} />
      </div>
    );
  }

  // Multi chart split logic: divide charts into two rows
  // Row 1 gets floor(count/2) charts
  // Row 2 gets remaining charts
  // Examples: 2->1+1, 3->1+2, 4->2+2, 5->2+3, 6->3+3, 7->3+4, 8->4+4
  const row1Count = Math.floor(count / 2);
  const row1Symbols = symbols.slice(0, row1Count);
  const row2Symbols = symbols.slice(row1Count);

  return (
    <div className="h-full w-full flex flex-col gap-4 overflow-hidden">
      {/* Top Row */}
      <div 
        className="flex-1 w-full min-h-0 grid gap-4"
        style={{ 
          gridTemplateColumns: `repeat(${row1Symbols.length}, minmax(0, 1fr))` 
        }}
      >
        {row1Symbols.map(symbol => (
          <div key={symbol} className="h-full w-full min-h-0 overflow-hidden rounded-2xl border border-[#2a2a2a] shadow-sm">
            <ChartPanel symbol={symbol} timeframe={timeframe} />
          </div>
        ))}
      </div>

      {/* Bottom Row */}
      <div 
        className="flex-1 w-full min-h-0 grid gap-4"
        style={{ 
          gridTemplateColumns: `repeat(${row2Symbols.length}, minmax(0, 1fr))` 
        }}
      >
        {row2Symbols.map(symbol => (
          <div key={symbol} className="h-full w-full min-h-0 overflow-hidden rounded-2xl border border-[#2a2a2a] shadow-sm">
            <ChartPanel symbol={symbol} timeframe={timeframe} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChartGrid;