import React from 'react';
import { theme } from '@/utils/cyberpunkTheme';

const OrderBookVisualization = () => {
  return (
    <div className={`${theme.colors.card} p-4 rounded-2xl h-full flex flex-col`}>
       <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Order Book Depth</h3>
       <div className="flex-1 flex items-end justify-center gap-1 min-h-[150px]">
          {/* Mock Bars */}
          {[...Array(20)].map((_, i) => {
              const isBid = i < 10;
              const height = Math.random() * 80 + 20;
              return (
                  <div 
                    key={i}
                    className={`flex-1 rounded-t-sm transition-all duration-500 ${isBid ? 'bg-green-500/30 hover:bg-green-500/60' : 'bg-red-500/30 hover:bg-red-500/60'}`}
                    style={{ height: `${height}%` }}
                  />
              )
          })}
       </div>
       <div className="flex justify-between text-xs text-gray-500 mt-2 font-mono">
           <span>41,800.00</span>
           <span className="text-white font-bold">42,000.00</span>
           <span>42,200.00</span>
       </div>
    </div>
  );
};

export default OrderBookVisualization;