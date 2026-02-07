
import React, { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';
import { motion } from 'framer-motion';
import { TrendingUp, PieChart as PieIcon, BarChart3 } from 'lucide-react';

// Using placeholders since recharts isn't in allowlist and LW-charts is mainly for OHLC
// We will build custom CSS/HTML charts for simple visualizations to keep it strictly frontend/vanilla-ish react

const SimpleBarChart = ({ data }) => {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-2 h-32 pt-4 px-2">
      {data.map((item, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
          <div 
            className="w-full bg-blue-500/20 rounded-t border border-blue-500/30 group-hover:bg-blue-500/40 transition-all relative"
            style={{ height: `${(item.value / maxVal) * 100}%` }}
          >
             <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-[10px] bg-black text-white px-1 rounded transition-opacity whitespace-nowrap z-10">
                 {item.value}
             </div>
          </div>
          <span className="text-[9px] text-gray-500 uppercase rotate-0 sm:-rotate-45 sm:origin-top-left translate-y-2">{item.label}</span>
        </div>
      ))}
    </div>
  );
};

const SimplePieChart = ({ wins, losses }) => {
  const total = wins + losses || 1;
  const winPct = (wins / total) * 100;
  const lossPct = 100 - winPct;
  
  return (
      <div className="flex items-center gap-6 justify-center h-full">
         <div className="relative w-24 h-24 rounded-full border-4 border-[#222]" 
              style={{
                background: `conic-gradient(#10b981 0% ${winPct}%, #ef4444 ${winPct}% 100%)`
              }}
         >
             <div className="absolute inset-2 bg-[#1a1a1a] rounded-full flex flex-col items-center justify-center">
                 <span className="text-xl font-bold text-white">{total}</span>
                 <span className="text-[9px] text-gray-500">Trades</span>
             </div>
         </div>
         <div className="flex flex-col gap-2 text-xs">
             <div className="flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                 <span className="text-gray-400">Wins ({wins})</span>
             </div>
             <div className="flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-red-500"></span>
                 <span className="text-gray-400">Losses ({losses})</span>
             </div>
         </div>
      </div>
  );
};

const BotPerformanceCharts = ({ metrics }) => {
  // Prep Data
  const botTypeData = Object.entries(metrics.botsByType).map(([label, value]) => ({ label: label.replace('Bot','').trim(), value }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
       {/* 1. Bot Comparison Bar Chart */}
       <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 shadow-lg">
           <div className="flex items-center gap-2 mb-2">
               <BarChart3 size={16} className="text-blue-400" />
               <h3 className="text-xs font-bold text-gray-300 uppercase">Active Bots Distribution</h3>
           </div>
           <SimpleBarChart data={botTypeData} />
       </div>

       {/* 2. Win/Loss Distribution */}
       <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 shadow-lg">
           <div className="flex items-center gap-2 mb-2">
               <PieIcon size={16} className="text-emerald-400" />
               <h3 className="text-xs font-bold text-gray-300 uppercase">Win / Loss Ratio</h3>
           </div>
           <SimplePieChart wins={metrics.winCount} losses={metrics.lossCount} />
       </div>

       {/* 3. PnL Stats Text (Simplified due to lack of historical timeseries in memory) */}
       <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 shadow-lg flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-4 self-start">
               <TrendingUp size={16} className="text-purple-400" />
               <h3 className="text-xs font-bold text-gray-300 uppercase">Performance Summary</h3>
           </div>
           
           <div className="space-y-4">
              <div>
                  <div className="text-xs text-gray-500 uppercase mb-1">Total Volume</div>
                  <div className="text-xl font-bold text-white font-mono border-l-2 border-purple-500 pl-3">
                      ${metrics.totalVolume.toLocaleString()}
                  </div>
              </div>
              <div>
                  <div className="text-xs text-gray-500 uppercase mb-1">Win Rate</div>
                  <div className="text-xl font-bold text-white font-mono border-l-2 border-emerald-500 pl-3">
                      {metrics.winRate}%
                  </div>
              </div>
              <div>
                  <div className="text-xs text-gray-500 uppercase mb-1">Closed Trades</div>
                  <div className="text-xl font-bold text-white font-mono border-l-2 border-blue-500 pl-3">
                      {metrics.totalClosed}
                  </div>
              </div>
           </div>
       </div>
    </div>
  );
};

export default BotPerformanceCharts;
