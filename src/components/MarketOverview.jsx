import React from 'react';
import { theme } from '@/utils/cyberpunkTheme';

const MarketOverview = () => {
    return (
        <div className={`${theme.colors.card} p-4 rounded-2xl`}>
             <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Market Sentiment</h3>
             <div className="flex items-center gap-4 mb-6">
                 <div className="relative w-16 h-16 rounded-full border-4 border-green-500 flex items-center justify-center">
                     <span className="text-xl font-bold text-white">65</span>
                 </div>
                 <div>
                     <div className="text-green-400 font-bold text-lg">Greed</div>
                     <div className="text-xs text-gray-500">Market is bullish</div>
                 </div>
             </div>
             
             <div className="space-y-4">
                 <div>
                     <div className="flex justify-between text-xs text-gray-400 mb-1">
                         <span>BTC Dominance</span>
                         <span>52.4%</span>
                     </div>
                     <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                         <div className="h-full bg-orange-500 w-[52.4%]"></div>
                     </div>
                 </div>
                 <div>
                     <div className="flex justify-between text-xs text-gray-400 mb-1">
                         <span>ETH Dominance</span>
                         <span>17.1%</span>
                     </div>
                     <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                         <div className="h-full bg-blue-500 w-[17.1%]"></div>
                     </div>
                 </div>
             </div>
        </div>
    );
};

export default MarketOverview;