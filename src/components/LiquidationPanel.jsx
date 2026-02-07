import React, { useState, useEffect } from 'react';
import { Flame, RefreshCcw, Filter, Eye, EyeOff, TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { generateLiquidationData, calculateLiquidationStats } from '@/utils/liquidationDataManager';
import { theme } from '@/utils/cyberpunkTheme';

const LiquidationPanel = ({ showLiquidations, toggleShowLiquidations, currentPrice }) => {
  const [data, setData] = useState([]);
  const [filter, setFilter] = useState('all'); // all, short, long
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const refreshData = () => {
    setLoading(true);
    // Simulate API delay
    setTimeout(() => {
        const newData = generateLiquidationData(currentPrice || 65000);
        setData(newData);
        setStats(calculateLiquidationStats(newData));
        setLoading(false);
    }, 600);
  };

  useEffect(() => {
    refreshData();
  }, [currentPrice]);

  const filteredData = data.filter(d => {
      if (filter === 'all') return true;
      return d.type === filter;
  });

  // Since visibility is now controlled by the parent conditional rendering for "Separate Panel" mode,
  // we just render the content. The showLiquidations prop can be ignored or used for internal toggles if needed,
  // but for the specific fix requested, we ensure it renders if mounted.
  
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-[#2a2a2a] bg-[#1f1f1f] flex justify-between items-center">
        <div className="flex items-center gap-2">
            <Flame size={16} className="text-orange-500 animate-pulse" />
            <span className="font-bold text-white text-sm">Liq. Separate Panel</span>
        </div>
        <div className="flex items-center gap-2">
            <button 
                onClick={refreshData}
                disabled={loading}
                className={cn("p-1.5 rounded hover:bg-[#333] text-gray-400 transition-colors", loading && "animate-spin")}
            >
                <RefreshCcw size={14} />
            </button>
        </div>
      </div>

      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-2 border-b border-[#2a2a2a] bg-[#151515]">
            <div className="p-2 border-r border-[#2a2a2a]">
                <span className="text-[10px] text-gray-500 uppercase block">Short Liqs</span>
                <span className="text-xs font-mono font-bold text-red-400">${(stats.shortVolume / 1000000).toFixed(1)}M</span>
            </div>
            <div className="p-2">
                <span className="text-[10px] text-gray-500 uppercase block">Long Liqs</span>
                <span className="text-xs font-mono font-bold text-green-400">${(stats.longVolume / 1000000).toFixed(1)}M</span>
            </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex p-1 gap-1 bg-[#121212] border-b border-[#2a2a2a]">
         {['all', 'short', 'long'].map(f => (
             <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                    "flex-1 py-1 text-[10px] font-bold uppercase rounded transition-colors",
                    filter === f 
                        ? "bg-[#2a2a2a] text-white" 
                        : "text-gray-500 hover:text-gray-300"
                )}
             >
                 {f}
             </button>
         ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
          <table className="w-full text-left border-collapse">
              <thead className="bg-[#1f1f1f] sticky top-0 z-10">
                  <tr>
                      <th className="p-2 text-[10px] text-gray-500 font-bold uppercase">Price</th>
                      <th className="p-2 text-[10px] text-gray-500 font-bold uppercase text-right">Vol</th>
                      <th className="p-2 text-[10px] text-gray-500 font-bold uppercase text-right">Lev</th>
                  </tr>
              </thead>
              <tbody>
                  {filteredData.map((item) => (
                      <tr key={item.id} className="border-b border-[#2a2a2a]/50 hover:bg-[#1f1f1f] group transition-colors">
                          <td className="p-2 font-mono text-xs text-white group-hover:text-blue-400 transition-colors">
                              {item.price.toFixed(0)}
                          </td>
                          <td className={cn(
                              "p-2 font-mono text-xs text-right",
                              item.type === 'short' ? "text-green-400" : "text-red-400" 
                          )}>
                              {(item.volume / 1000).toFixed(0)}k
                          </td>
                          <td className="p-2 font-mono text-[10px] text-gray-500 text-right">
                              {item.leverage}
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
          {filteredData.length === 0 && (
              <div className="p-4 text-center text-xs text-gray-500">No data available</div>
          )}
      </div>
    </div>
  );
};

export default LiquidationPanel;