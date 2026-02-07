import React from 'react';
import { ArrowUp, ArrowDown, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

const RealTimeDataPanel = ({ data }) => {
  // Ensure data exists before processing
  if (!data) return (
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 flex items-center justify-center text-gray-500 text-sm">
          Waiting for data...
      </div>
  );

  // Safely extract values with defaults to prevent undefined errors
  // Using Number() ensures we work with numeric values
  const close = Number(data.close) || 0;
  const open = Number(data.open) || 0;
  const high = Number(data.high) || 0;
  const low = Number(data.low) || 0;
  const volume = Number(data.volume) || 0;

  const isUp = close >= open;
  const change = close - open;
  
  // Calculate percentage safely, avoiding division by zero
  const changePercent = open !== 0 ? ((change / open) * 100) : 0;

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4 text-gray-400">
         <Activity size={16} className="text-blue-500" />
         <span className="text-xs font-bold uppercase tracking-wider">Market Data</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
         <div>
             <span className="text-xs text-gray-500 block mb-1">Last Price</span>
             <div className={cn("text-2xl font-mono font-bold", isUp ? "text-green-500" : "text-red-500")}>
                 {close.toFixed(2)}
             </div>
         </div>
         
         <div>
             <span className="text-xs text-gray-500 block mb-1">24h Change</span>
             <div className={cn("text-lg font-mono font-bold flex items-center gap-1", isUp ? "text-green-500" : "text-red-500")}>
                 {isUp ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                 {Math.abs(changePercent).toFixed(2)}%
             </div>
         </div>
      </div>

      <div className="h-px bg-[#2a2a2a] my-4" />

      <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm">
          <div className="flex justify-between">
              <span className="text-gray-500">Open</span>
              <span className="font-mono text-white">{open.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
              <span className="text-gray-500">High</span>
              <span className="font-mono text-white">{high.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
              <span className="text-gray-500">Low</span>
              <span className="font-mono text-white">{low.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
              <span className="text-gray-500">Vol</span>
              <span className="font-mono text-white text-xs self-center">{volume.toFixed(2)}</span>
          </div>
      </div>
    </div>
  );
};

export default RealTimeDataPanel;