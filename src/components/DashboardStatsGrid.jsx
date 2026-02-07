
import React from 'react';
import { motion } from 'framer-motion';
import { PieChart, Grid as GridIcon, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

const StatCard = ({ title, icon: Icon, children, className }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className={cn("bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5 shadow-lg flex flex-col h-full", className)}
  >
    <div className="flex items-center gap-2 mb-4 border-b border-[#2a2a2a] pb-3">
      <Icon size={18} className="text-gray-400" />
      <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wide">{title}</h3>
    </div>
    <div className="flex-1 flex flex-col justify-center">
      {children}
    </div>
  </motion.div>
);

const ProgressBar = ({ label, value, max, color }) => (
  <div className="mb-3 last:mb-0">
    <div className="flex justify-between text-xs mb-1">
      <span className="text-gray-400">{label}</span>
      <span className="text-white font-mono">{value}</span>
    </div>
    <div className="h-1.5 w-full bg-[#111] rounded-full overflow-hidden">
      <div 
        className={`h-full rounded-full ${color}`} 
        style={{ width: `${Math.min((value / max) * 100, 100)}%` }}
      />
    </div>
  </div>
);

const DashboardStatsGrid = ({ metrics }) => {
  const maxBots = Math.max(...Object.values(metrics.botsByType), 1);
  const totalPositions = metrics.totalActivePositions + metrics.totalClosed || 1;
  const longPct = (metrics.positionsBySide.LONG / (metrics.positionsBySide.LONG + metrics.positionsBySide.SHORT || 1)) * 100;
  const shortPct = 100 - longPct;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* 1. Bots by Type */}
      <StatCard title="Active Bots Distribution" icon={GridIcon}>
        <div className="space-y-1">
           {Object.entries(metrics.botsByType).map(([type, count], idx) => (
             <ProgressBar 
                key={type} 
                label={type} 
                value={count} 
                max={maxBots + 2} // visually scale slightly less than 100%
                color={[
                  'bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-green-500', 'bg-pink-500'
                ][idx % 5]}
             />
           ))}
           {Object.keys(metrics.botsByType).length === 0 && (
             <p className="text-center text-gray-500 text-xs py-4">No active bots</p>
           )}
        </div>
      </StatCard>

      {/* 2. Positions by Status */}
      <StatCard title="Position Status" icon={PieChart}>
        <div className="flex items-center justify-center gap-6">
           <div className="relative w-24 h-24">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                 {/* Simple Donut Chart SVG logic */}
                 <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#111" strokeWidth="3" />
                 {/* Active Segment */}
                 <circle 
                    cx="18" cy="18" r="15.915" fill="transparent" stroke="#10b981" strokeWidth="3" 
                    strokeDasharray={`${(metrics.positionsByStatus.ACTIVE / totalPositions) * 100} ${100 - (metrics.positionsByStatus.ACTIVE / totalPositions) * 100}`}
                    strokeDashoffset="25"
                 />
                 {/* Waiting Segment (offset by active) */}
                 <circle 
                    cx="18" cy="18" r="15.915" fill="transparent" stroke="#eab308" strokeWidth="3" 
                    strokeDasharray={`${(metrics.positionsByStatus.WAITING / totalPositions) * 100} ${100 - (metrics.positionsByStatus.WAITING / totalPositions) * 100}`}
                    strokeDashoffset={100 - ((metrics.positionsByStatus.ACTIVE / totalPositions) * 100) + 25}
                 />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                 <span className="text-xl font-bold text-white">{metrics.totalActivePositions}</span>
                 <span className="text-[9px] text-gray-500 uppercase">Active</span>
              </div>
           </div>
           <div className="flex flex-col gap-2 text-xs">
              <div className="flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                 <span className="text-gray-400">Active</span>
                 <span className="text-white font-bold ml-auto">{metrics.positionsByStatus.ACTIVE}</span>
              </div>
              <div className="flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                 <span className="text-gray-400">Waiting</span>
                 <span className="text-white font-bold ml-auto">{metrics.positionsByStatus.WAITING}</span>
              </div>
              <div className="flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-gray-500"></span>
                 <span className="text-gray-400">Closed</span>
                 <span className="text-white font-bold ml-auto">{metrics.positionsByStatus.CLOSED}</span>
              </div>
           </div>
        </div>
      </StatCard>

      {/* 3. Long vs Short Exposure */}
      <StatCard title="Market Exposure" icon={Layers}>
        <div className="flex flex-col h-full justify-center">
            <div className="flex justify-between text-xs mb-2 font-bold uppercase tracking-wider">
                <span className="text-green-400">Longs {metrics.positionsBySide.LONG}</span>
                <span className="text-red-400">{metrics.positionsBySide.SHORT} Shorts</span>
            </div>
            <div className="h-4 bg-[#111] rounded-full overflow-hidden flex relative">
                <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${longPct}%` }} />
                <div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${shortPct}%` }} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                <div className="bg-green-500/10 rounded-lg py-2 border border-green-500/20">
                    <div className="text-xs text-green-400 uppercase">Long Ratio</div>
                    <div className="text-lg font-bold text-white font-mono">{longPct.toFixed(0)}%</div>
                </div>
                <div className="bg-red-500/10 rounded-lg py-2 border border-red-500/20">
                    <div className="text-xs text-red-400 uppercase">Short Ratio</div>
                    <div className="text-lg font-bold text-white font-mono">{shortPct.toFixed(0)}%</div>
                </div>
            </div>
        </div>
      </StatCard>
    </div>
  );
};

export default DashboardStatsGrid;
