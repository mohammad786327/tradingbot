import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

const StatusDisplayBox = ({ 
  type = 'UPWARD', // UPWARD or DOWNWARD
  priceChange = 0,
  dollarNeeded = 0,
  progress = 0,
  target = 50
}) => {
  const isUpward = type === 'UPWARD';
  const colorClass = isUpward ? 'text-emerald-500' : 'text-red-500';
  const bgClass = isUpward ? 'bg-emerald-500' : 'bg-red-500';
  const borderColor = isUpward ? 'border-emerald-500/20' : 'border-red-500/20';
  const Icon = isUpward ? TrendingUp : TrendingDown;
  
  // Format numbers
  const formattedChange = `${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)}`;
  const formattedNeeded = dollarNeeded.toFixed(2);
  const progressPercent = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={cn("flex flex-col p-3 rounded-xl border bg-[#0f0f0f]/80 backdrop-blur-sm", borderColor)}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-1.5">
            <div className={cn("p-1 rounded-md bg-opacity-10", bgClass)}>
                <Icon size={14} className={colorClass} />
            </div>
            <span className={cn("text-[10px] font-bold tracking-wider uppercase opacity-80", colorClass)}>
                {type} MOVE
            </span>
        </div>
        <span className={cn("text-xs font-mono font-bold", colorClass)}>
            {formattedChange}
        </span>
      </div>

      <div className="space-y-1 mb-3">
         <div className="flex justify-between items-end">
            <span className="text-[10px] text-gray-500 font-medium uppercase">Target</span>
            <span className="text-xs font-bold text-gray-300">${target}</span>
         </div>
         <div className="flex justify-between items-end">
            <span className="text-[10px] text-gray-500 font-medium uppercase">Needed</span>
            <span className="text-xs font-bold text-gray-300">${formattedNeeded}</span>
         </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
         <motion.div 
            className={cn("h-full rounded-full", bgClass)}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ type: "spring", stiffness: 60, damping: 15 }}
         />
      </div>
    </div>
  );
};

export default StatusDisplayBox;