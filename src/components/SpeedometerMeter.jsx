import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const SpeedometerMeter = ({ 
  value = 0, 
  min = -100, 
  max = 100, 
  currentPrice,
  dollarTarget
}) => {
  // Normalize value to clamp within min/max
  const range = max - min;
  const clampedValue = Math.min(Math.max(value, min), max);
  // Calculate percentage (0 to 1)
  const percentage = (clampedValue - min) / range; 
  
  // Angle: 0 = -90deg (left), 1 = 90deg (right)
  // Mapping 0-1 to -90 to +90
  const angle = percentage * 180 - 90;
  
  // Format labels
  const targetVal = dollarTarget || (max > 0 ? max : 100);
  // Ensure we don't display NaN or undefined
  const displayTarget = isNaN(targetVal) ? '0' : Math.abs(targetVal).toString();
  const leftLabel = `-$${displayTarget}`;
  const rightLabel = `+$${displayTarget}`;

  return (
    <div className="flex flex-col items-center">
      {/* Meter SVG */}
      <div className="relative w-48 h-28">
        <svg viewBox="0 0 200 120" className="w-full h-full overflow-visible">
          {/* Definitions for gradients and filters */}
          <defs>
             <linearGradient id="gradNeg" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="1" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0.1" />
             </linearGradient>
             <linearGradient id="gradPos" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="1" />
             </linearGradient>
             <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
             </filter>
             <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000" floodOpacity="0.5"/>
             </filter>
          </defs>

          {/* Background Track */}
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#1f1f1f" strokeWidth="16" strokeLinecap="round" />
          
          {/* Left Half (Short/Negative) */}
          <path d="M 20 100 A 80 80 0 0 1 100 20" fill="none" stroke="url(#gradNeg)" strokeWidth="12" strokeLinecap="butt" className="opacity-80" />
          
          {/* Right Half (Long/Positive) */}
          <path d="M 100 20 A 80 80 0 0 1 180 100" fill="none" stroke="url(#gradPos)" strokeWidth="12" strokeLinecap="butt" className="opacity-80" />

          {/* Center Mark */}
          <line x1="100" y1="10" x2="100" y2="25" stroke="#333" strokeWidth="2" />
          <text x="100" y="38" textAnchor="middle" fill="#666" fontSize="8" fontFamily="monospace">START</text>

          {/* Scale Labels */}
          <text x="20" y="120" textAnchor="middle" fill="#ef4444" fontSize="11" fontWeight="bold">{leftLabel}</text>
          <text x="180" y="120" textAnchor="middle" fill="#10b981" fontSize="11" fontWeight="bold">{rightLabel}</text>

          {/* Needle / Pointer */}
          <motion.g
             initial={{ rotate: -90 }}
             animate={{ rotate: angle }}
             transition={{ type: "spring", stiffness: 40, damping: 10 }}
             style={{ originX: "100px", originY: "100px" }}
          >
             {/* Needle Shape: Triangle pointing up from center */}
             <path 
                d="M 100 25 L 106 100 L 94 100 Z" 
                fill={value >= 0 ? '#10b981' : '#ef4444'} 
                filter="url(#dropShadow)"
                stroke="#fff"
                strokeWidth="1"
             />
             
             {/* Center pivot cap */}
             <circle cx="100" cy="100" r="6" fill="#1a1a1a" stroke="#333" strokeWidth="2" />
             <circle cx="100" cy="100" r="2" fill="#666" />
          </motion.g>
        </svg>
      </div>
      
      {/* Dynamic Price Label - Moved down with positive margin for better spacing */}
      <motion.div 
        className="bg-[#0f0f0f]/95 border border-[#333] px-4 py-2 rounded-xl mt-4 z-10 flex flex-col items-center shadow-xl backdrop-blur-md min-w-[120px]"
        animate={{
            borderColor: value >= 0 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)',
            boxShadow: value >= 0 ? '0 4px 20px -5px rgba(16, 185, 129, 0.2)' : '0 4px 20px -5px rgba(239, 68, 68, 0.2)'
        }}
      >
         <span className="text-white font-bold font-mono text-base tracking-wide">
             {currentPrice ? currentPrice.toFixed(2) : '---'}
         </span>
         <div className="flex gap-4 text-[10px] font-bold uppercase w-full justify-between px-1 mt-1">
             <span className={cn("transition-colors", value < 0 ? 'text-red-500' : 'text-gray-700')}>Short</span>
             <span className={cn("transition-colors", value >= 0 ? 'text-green-500' : 'text-gray-700')}>Long</span>
         </div>
         {/* Display current drift/movement */}
         <div className="w-full border-t border-dashed border-[#333] mt-1 pt-1 text-center">
             <span className={cn("text-[10px] font-mono", value >= 0 ? "text-green-400" : "text-red-400")}>
                {value > 0 ? '+' : ''}{value.toFixed(2)}
             </span>
         </div>
      </motion.div>
    </div>
  );
};

export default SpeedometerMeter;