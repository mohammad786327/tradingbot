import React, { useState, useEffect, useRef } from 'react';
import { binanceWS } from '@/utils/binanceWebSocket';
import { TrendingUp, TrendingDown, Activity, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const LivePriceTicker = ({ symbols = [] }) => {
  const [prices, setPrices] = useState({});
  const [priceDirections, setPriceDirections] = useState({});
  
  // Drag to scroll refs
  const scrollContainerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  useEffect(() => {
    if (!symbols || symbols.length === 0) return;

    const subscription = binanceWS.subscribe(symbols, 'ticker', '1m', (data) => {
      if (data.e === '24hrTicker') {
        const symbol = data.s;
        const currentPrice = parseFloat(data.c);
        const priceChangePercent = parseFloat(data.P);
        
        setPrices(prev => {
            const prevPrice = prev[symbol]?.price;
            let direction = 'same';
            if (prevPrice) {
                if (currentPrice > prevPrice) direction = 'up';
                else if (currentPrice < prevPrice) direction = 'down';
            }
            
            if (direction !== 'same' || !prev[symbol]) {
                 setPriceDirections(pd => ({ ...pd, [symbol]: direction }));
            }
            
            return {
                ...prev,
                [symbol]: {
                    price: currentPrice,
                    change: priceChangePercent,
                    direction: direction
                }
            };
        });
      }
    });

    return () => {
      if (subscription) {
        binanceWS.unsubscribe(subscription);
      }
    };
  }, [symbols]);

  // Drag handlers
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll multiplier
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  if (!symbols.length) return null;

  return (
    <div className="relative group">
      <div 
        ref={scrollContainerRef}
        className="flex items-center gap-4 overflow-x-auto pb-2 cursor-grab active:cursor-grabbing select-none"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} // Hide scrollbar Firefox/IE
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
      >
        {/* Hide scrollbar Webkit */}
        <style>{`
          .overflow-x-auto::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        
         {symbols.map(symbol => {
             const data = prices[symbol];
             const direction = priceDirections[symbol] || 'same';
             
             return (
                 <div key={symbol} className="flex items-center gap-3 bg-[#0f0f0f] border border-[#2a2a2a] px-3 py-2 rounded-lg min-w-[160px] shrink-0 transition-colors hover:border-[#3a3a3a]">
                     <div className="flex flex-col">
                         <span className="text-xs font-bold text-gray-400">{symbol}</span>
                         <div className="flex items-center gap-1.5">
                             <span className={cn(
                                 "text-sm font-mono font-bold transition-colors duration-300",
                                 direction === 'up' ? "text-green-400" : direction === 'down' ? "text-red-400" : "text-white"
                             )}>
                                 ${data?.price?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '---'}
                             </span>
                         </div>
                     </div>
                     
                     <div className="ml-auto flex flex-col items-end">
                         {data ? (
                             <>
                                 <span className={cn(
                                     "text-xs font-bold flex items-center gap-0.5",
                                     data.change >= 0 ? "text-green-500" : "text-red-500"
                                 )}>
                                     {data.change >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                     {Math.abs(data.change).toFixed(2)}%
                                 </span>
                             </>
                         ) : (
                             <Activity size={14} className="text-gray-600 animate-pulse" />
                         )}
                     </div>
                 </div>
             );
         })}
      </div>
      
      {/* Visual indicator for more content */}
      <div className="absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-[#1a1a1a] to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end pr-1">
          <ChevronRight size={16} className="text-gray-500" />
      </div>
    </div>
  );
};

export default LivePriceTicker;