import React, { useState } from 'react';
import DCAChartPanel from './DCAChartPanel';
import { Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DCAChartGrid = ({ symbols, selectedBot, dcaSettings, previewMode, previewSymbol }) => {
  const [timeframe, setTimeframe] = useState('15m');
  const timeframeOptions = ['1m', '5m', '15m', '30m', '1h', '4h', '1d'];

  const TimeframeSelector = () => (
    <div className="flex bg-[#0f0f0f] p-1 rounded-xl border border-[#2a2a2a] scale-90 sm:scale-100 origin-right">
      {timeframeOptions.map(tf => (
        <button
          key={tf}
          onClick={() => setTimeframe(tf)}
          className={`px-3 py-1 sm:px-4 sm:py-1.5 text-xs sm:text-sm font-bold rounded-lg transition-all ${
            timeframe === tf
              ? 'bg-[#2a2a2a] text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          {tf}
        </button>
      ))}
    </div>
  );

  const activeSymbol = selectedBot ? selectedBot.symbol : (previewMode ? previewSymbol : null);

  // Single Chart Mode
  if (activeSymbol) {
      return (
        <div className="h-full flex flex-col bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] p-4 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 px-2 gap-4 sm:gap-0">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                    {previewMode && !selectedBot ? 'DCA Strategy Preview' : `Monitoring Bot: ${activeSymbol}`}
                </h3>
                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                    <TimeframeSelector />
                    <div className="flex items-center gap-2 shrink-0">
                        <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                        <span className="text-xs text-purple-500 font-mono">Connected</span>
                    </div>
                </div>
            </div>
            <div className="h-full min-h-[400px] relative">
                 <DCAChartPanel 
                    key={activeSymbol}
                    symbol={activeSymbol} 
                    timeframe={timeframe} 
                    dcaSettings={dcaSettings} 
                />
            </div>
        </div>
      );
  }

  // Overview Mode
  const displaySymbols = symbols && symbols.length > 0 ? symbols : [];

  if (displaySymbols.length === 0) {
    return (
      <div className="bg-[#1a1a1a] rounded-2xl p-8 border border-[#2a2a2a] h-full min-h-[500px] flex items-center justify-center">
        <div className="text-center">
          <Activity size={48} className="text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">
            No active DCA bots. <br/>Configure a bot in the panel to see a preview.
          </p>
        </div>
      </div>
    );
  }

  const getGridClass = (count) => {
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-1 md:grid-cols-2';
    if (count <= 4) return 'grid-cols-1 md:grid-cols-2';
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
  };

  return (
    <div className="h-full flex flex-col bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] p-4 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 px-2 gap-4 sm:gap-0">
         <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
           Live DCA Market Overview
         </h3>
         <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
            <TimeframeSelector />
            <div className="flex items-center gap-2 shrink-0">
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                <span className="text-xs text-purple-500 font-mono">Connected</span>
            </div>
         </div>
      </div>
      
      <div className={`grid ${getGridClass(displaySymbols.length)} gap-4 h-full min-h-[400px] auto-rows-fr transition-all duration-500 ease-in-out`}>
        <AnimatePresence mode="popLayout">
          {displaySymbols.map(symbol => (
            <motion.div 
              key={symbol} 
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="min-h-[300px] h-full relative"
            >
              <DCAChartPanel 
                  symbol={symbol} 
                  timeframe={timeframe} 
                  dcaSettings={null} 
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DCAChartGrid;