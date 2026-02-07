import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const ActiveCoinsDisplay = ({ activeCoins = [], hasMapping = true }) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide flex items-center gap-2">
          <Layers size={14} className="text-blue-500" />
          Active Coins (Will Trade These)
        </h3>
        <span className={cn(
          "text-[10px] font-mono px-2 py-0.5 rounded border",
          activeCoins.length > 0 
            ? "bg-blue-500/10 text-blue-400 border-blue-500/20" 
            : "bg-gray-800 text-gray-500 border-gray-700"
        )}>
          Active: {activeCoins.length}
        </span>
      </div>

      <div className="min-h-[60px] bg-[#0f0f0f] rounded-xl border border-[#2a2a2a] p-3 flex items-center relative overflow-hidden">
        {!hasMapping ? (
           <div className="flex items-center gap-2 text-red-400 text-xs font-medium w-full justify-center">
             <AlertCircle size={14} />
             <span>No coin mapping available for this combination.</span>
           </div>
        ) : activeCoins.length === 0 ? (
           <div className="text-gray-600 text-xs italic w-full text-center">
             Select a template and movement coin to view execution targets.
           </div>
        ) : (
          <div className="flex flex-wrap gap-2 w-full">
            <AnimatePresence>
              {activeCoins.map((coin, index) => (
                <motion.div
                  key={coin}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: index * 0.05 }}
                  className="px-3 py-1.5 rounded-lg bg-[#1a1a1a] border border-[#333] text-xs font-bold text-gray-200 shadow-sm flex items-center gap-1.5 hover:border-blue-500/50 hover:bg-[#222] transition-colors cursor-default group"
                >
                   <span className="w-1.5 h-1.5 rounded-full bg-blue-500 group-hover:shadow-[0_0_5px_rgba(59,130,246,0.8)] transition-all" />
                   {coin}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveCoinsDisplay;