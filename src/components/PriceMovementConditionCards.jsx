import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const PriceMovementConditionCards = ({ dollarMovement, timeframe, direction }) => {
  const amount = dollarMovement || '0';
  const time = timeframe || '1m';
  const isLong = direction === 'Long';
  const isShort = direction === 'Short';

  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      {/* Long Condition Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          scale: isLong ? 1.02 : 1,
          borderColor: isLong ? 'rgba(34, 197, 94, 0.5)' : 'rgba(34, 197, 94, 0.1)' 
        }}
        className={cn(
          "relative overflow-hidden rounded-xl bg-gradient-to-br transition-all duration-300 border",
          isLong 
            ? "from-[#0f0f0f] to-[#1a1a1a] shadow-[0_0_15px_rgba(34,197,94,0.15)]" 
            : "from-[#0f0f0f] to-[#1a1a1a] border-green-500/10 opacity-60 grayscale-[0.5]"
        )}
      >
        <div className={cn(
          "absolute inset-0 transition-colors duration-300",
          isLong ? "bg-green-500/10" : "bg-transparent"
        )} />
        
        <div className="relative p-4 flex flex-col items-center text-center space-y-2">
          <div className={cn(
            "p-2 rounded-full mb-1 transition-colors duration-300",
            isLong ? "bg-green-500/20 text-green-400" : "bg-green-500/5 text-green-700"
          )}>
            <TrendingUp size={20} />
          </div>
          
          <div className="space-y-1">
            <h3 className={cn("text-xs font-bold uppercase tracking-wider", isLong ? "text-green-400" : "text-gray-500")}>Long Condition</h3>
            <p className="text-sm font-medium text-white leading-tight">
              Needs <span className={cn("font-bold", isLong ? "text-green-400" : "text-gray-400")}>+{amount} USDT</span>
              <br />
              <span className="text-xs text-gray-500">within {time}</span>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Short Condition Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          scale: isShort ? 1.02 : 1,
          borderColor: isShort ? 'rgba(239, 68, 68, 0.5)' : 'rgba(239, 68, 68, 0.1)'
        }}
        transition={{ delay: 0.1 }}
        className={cn(
          "relative overflow-hidden rounded-xl bg-gradient-to-br transition-all duration-300 border",
          isShort 
            ? "from-[#0f0f0f] to-[#1a1a1a] shadow-[0_0_15px_rgba(239,68,68,0.15)]" 
            : "from-[#0f0f0f] to-[#1a1a1a] border-red-500/10 opacity-60 grayscale-[0.5]"
        )}
      >
        <div className={cn(
          "absolute inset-0 transition-colors duration-300",
          isShort ? "bg-red-500/10" : "bg-transparent"
        )} />
        
        <div className="relative p-4 flex flex-col items-center text-center space-y-2">
          <div className={cn(
            "p-2 rounded-full mb-1 transition-colors duration-300",
            isShort ? "bg-red-500/20 text-red-400" : "bg-red-500/5 text-red-700"
          )}>
            <TrendingDown size={20} />
          </div>
          
          <div className="space-y-1">
            <h3 className={cn("text-xs font-bold uppercase tracking-wider", isShort ? "text-red-400" : "text-gray-500")}>Short Condition</h3>
            <p className="text-sm font-medium text-white leading-tight">
              Needs <span className={cn("font-bold", isShort ? "text-red-400" : "text-gray-400")}>-{amount} USDT</span>
              <br />
              <span className="text-xs text-gray-500">within {time}</span>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PriceMovementConditionCards;