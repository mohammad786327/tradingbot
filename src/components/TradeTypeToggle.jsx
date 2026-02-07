import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const TradeTypeToggle = ({ activeType, onChange }) => {
  return (
    <div className="bg-[#0f0f0f] p-1.5 rounded-xl border border-[#2a2a2a] relative flex items-center mb-6">
      {/* Background Slider */}
      <motion.div
        className="absolute top-1.5 bottom-1.5 rounded-lg bg-[#252525] border border-[#3a3a3a] shadow-md z-0"
        initial={false}
        animate={{
          left: activeType === 'Spot' ? '6px' : '50%',
          width: 'calc(50% - 6px)',
          x: activeType === 'Spot' ? 0 : '0%'
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      />
      
      {['Spot', 'Future'].map((type) => (
        <button
          key={type}
          onClick={() => onChange(type)}
          className={cn(
            "flex-1 py-3 text-sm font-bold rounded-lg transition-colors relative z-10 text-center uppercase tracking-wider",
            activeType === type ? "text-white" : "text-gray-500 hover:text-gray-300"
          )}
        >
          {type} Trading
        </button>
      ))}
    </div>
  );
};

export default TradeTypeToggle;