import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Activity, Target, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const ProgressBar = ({ current, target, colorClass, active }) => {
  const percentage = Math.min((current / target) * 100, 100);
  const segments = Array.from({ length: Math.max(target, 1) });
  
  return (
    <div className="flex gap-1 w-full h-3">
      {segments.map((_, i) => (
        <div 
          key={i} 
          className={cn(
            "flex-1 rounded-sm transition-all duration-300",
            i < current ? colorClass : "bg-[#2a2a2a]",
            active && i === current ? "animate-pulse brightness-150" : ""
          )} 
        />
      ))}
    </div>
  );
};

const MonitorSection = ({ 
  type, 
  count, 
  target, 
  label 
}) => {
  const isGreen = type === 'green';
  const colorText = isGreen ? 'text-emerald-400' : 'text-red-400';
  const bgBadge = isGreen ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20';
  const barColor = isGreen ? 'bg-emerald-500' : 'bg-red-500';
  const icon = isGreen ? <Activity size={16} /> : <Flame size={16} />;
  const isTargetReached = count >= target && target > 0;

  return (
    <div className="flex flex-col bg-[#151515] border border-[#2a2a2a] rounded-xl p-4 w-full relative overflow-hidden group h-full justify-between">
      {/* Background Gradient Effect */}
      <div className={cn(
        "absolute inset-0 opacity-5 pointer-events-none transition-opacity duration-500",
        isGreen ? "bg-gradient-to-r from-emerald-500/20 to-transparent" : "bg-gradient-to-r from-red-500/20 to-transparent"
      )} />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 relative z-10">
        <div className="flex items-center gap-3">
           <div className={cn("p-2 rounded-lg border", bgBadge)}>
              {icon}
           </div>
           <div>
              <div className="flex items-center gap-2">
                 <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">DETECTION PROGRESS</h3>
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                 <span className="text-xl font-black text-white">{count} <span className="text-gray-600 text-sm">/ {target}</span></span>
                 <span className={cn("text-xs font-bold", colorText)}>{label}</span>
              </div>
           </div>
        </div>

        <div className="flex items-center gap-4">
            {isTargetReached ? (
                 <div className={cn("px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-2 animate-pulse shadow-[0_0_15px_rgba(0,0,0,0.3)]", bgBadge)}>
                    <Target size={14} />
                    TRIGGERED!
                 </div>
            ) : (
                 <div className="px-3 py-1.5 rounded-lg border border-[#333] bg-[#222] text-xs font-bold flex items-center gap-2 text-gray-400">
                    <Zap size={12} className={cn("animate-pulse", isGreen ? "text-emerald-500" : "text-red-500")} />
                    Monitoring...
                 </div>
            )}
        </div>
      </div>

      <div className="relative z-10 mt-auto">
        <ProgressBar 
            current={count} 
            target={target} 
            colorClass={barColor} 
            active={true}
        />
      </div>
    </div>
  );
};

const CandleMonitorPanel = ({ 
  greenCount = 0, 
  redCount = 0, 
  targetCount = 3,
  direction = 'Auto (Follow Color)'
}) => {
  const showGreen = direction === 'Green Candles' || direction === 'Auto (Follow Color)' || !direction;
  const showRed = direction === 'Red Candles' || direction === 'Auto (Follow Color)' || !direction;

  return (
    <div className={cn(
        "grid gap-4 w-full",
        showGreen && showRed ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
    )}>
       {showGreen && (
           <MonitorSection 
              type="green"
              count={greenCount}
              target={targetCount}
              label="GREEN CANDLES"
           />
       )}
       {showRed && (
           <MonitorSection 
              type="red"
              count={redCount}
              target={targetCount}
              label="RED CANDLES"
           />
       )}
    </div>
  );
};

export default CandleMonitorPanel;