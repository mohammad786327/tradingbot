import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, X, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { binanceWS } from '@/utils/binanceWebSocket';

// Internal component for displaying live price
const LivePriceTicker = ({ symbol, large = false }) => {
  const [price, setPrice] = useState('---');
  const [prevPrice, setPrevPrice] = useState(null);

  useEffect(() => {
    if (!symbol) return;

    const handlePrice = (data) => {
      if (data && data.c) {
        setPrice(prev => {
          setPrevPrice(parseFloat(prev));
          return parseFloat(data.c);
        });
      }
    };

    const sub = binanceWS.subscribe([symbol], 'ticker', null, handlePrice);
    return () => binanceWS.unsubscribe(sub);
  }, [symbol]);

  const colorClass = !prevPrice || price === prevPrice 
    ? 'text-gray-300' 
    : price > prevPrice 
      ? 'text-green-400' 
      : 'text-red-400';

  return (
    <span className={cn(
      "font-mono font-bold transition-colors duration-300", 
      colorClass,
      large ? "text-lg" : "text-xs"
    )}>
      {typeof price === 'number' ? price.toFixed(2) : price}
    </span>
  );
};

const FollowSymbolPanel = ({ 
  isEnabled, 
  onToggle, 
  selectedSymbol, 
  onSymbolSelect, 
  templateSymbols = [] 
}) => {
  const [customSymbols, setCustomSymbols] = useState(() => {
    const saved = localStorage.getItem('custom_watchlist');
    return saved ? JSON.parse(saved) : ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT'];
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [newSymbolInput, setNewSymbolInput] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('custom_watchlist', JSON.stringify(customSymbols));
  }, [customSymbols]);

  const handleAddSymbol = (e) => {
    e.preventDefault();
    if (newSymbolInput && !customSymbols.includes(newSymbolInput.toUpperCase())) {
      const formatted = newSymbolInput.toUpperCase();
      const updated = [...customSymbols, formatted];
      setCustomSymbols(updated);
      onSymbolSelect(formatted);
      setNewSymbolInput('');
    }
  };

  const handleRemoveSymbol = (e, sym) => {
    e.stopPropagation();
    const updated = customSymbols.filter(s => s !== sym);
    setCustomSymbols(updated);
    if (selectedSymbol === sym && updated.length > 0) {
      onSymbolSelect(updated[0]);
    }
  };

  const filteredSymbols = customSymbols.filter(s => 
    s.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-[#0f0f0f]/50 rounded-xl border border-[#2a2a2a] overflow-visible relative mb-6 z-40">
      {/* Header & Toggle */}
      <div className="p-4 border-b border-[#2a2a2a] flex items-center justify-between bg-[#0f0f0f] rounded-t-xl">
        <div className="flex items-center gap-2">
          <Eye size={16} className={isEnabled ? "text-cyan-400" : "text-gray-400"} />
          <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wide">Target Symbol</h3>
        </div>
        
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <span className="text-[10px] font-bold text-gray-500 uppercase mr-1">
            {isEnabled ? 'Custom' : 'Template'}
          </span>
          <div className="relative">
            <input 
              type="checkbox" 
              className="sr-only" 
              checked={isEnabled} 
              onChange={(e) => onToggle(e.target.checked)} 
            />
            <div className={cn(
              "w-10 h-5 rounded-full shadow-inner transition-colors duration-300",
              isEnabled ? "bg-cyan-500" : "bg-gray-700"
            )}></div>
            <div className={cn(
              "absolute top-1 left-1 bg-white w-3 h-3 rounded-full shadow-md transition-transform duration-300",
              isEnabled ? "translate-x-5" : "translate-x-0"
            )}></div>
          </div>
        </label>
      </div>

      <div className="p-4">
        {/* Template Mode Display */}
        {!isEnabled && (
          <div className="space-y-3">
             <p className="text-[10px] text-gray-500 font-medium mb-2 uppercase tracking-wider">Following Template Symbols:</p>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {templateSymbols.length > 0 ? (
                  templateSymbols.slice(0, 6).map(sym => (
                    <div 
                      key={sym} 
                      className="flex items-center justify-between bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 hover:border-gray-600 transition-colors"
                    >
                      <div className="flex flex-col items-start">
                         <span className="text-[10px] text-gray-500 font-bold uppercase">Symbol</span>
                         <span className="text-sm font-bold text-white">{sym}</span>
                      </div>
                      <div className="text-right">
                         <span className="text-[10px] text-gray-500 font-bold uppercase block">Price</span>
                         <LivePriceTicker symbol={sym} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-6 text-xs text-gray-500 italic border border-dashed border-[#2a2a2a] rounded-xl bg-[#1a1a1a]/50">
                    No symbols in selected template
                  </div>
                )}
                {templateSymbols.length > 6 && (
                  <div className="col-span-2 text-center text-[10px] text-gray-500 pt-1 font-medium bg-[#1a1a1a] py-2 rounded-lg border border-[#2a2a2a]">
                    +{templateSymbols.length - 6} more symbols active
                  </div>
                )}
             </div>
          </div>
        )}

        {/* Custom Mode Display */}
        {isEnabled && (
          <div className="space-y-3 relative z-50">
             <div className="relative">
               <button 
                 type="button"
                 onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                 className="w-full flex items-center justify-between bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 hover:border-cyan-500/50 transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
               >
                 <div className="flex flex-col items-start">
                    <span className="text-[10px] text-gray-500 font-bold uppercase">Selected Symbol</span>
                    <span className="text-lg font-bold text-white">{selectedSymbol || 'Select Symbol'}</span>
                 </div>
                 <div className="text-right">
                    <span className="text-[10px] text-gray-500 font-bold uppercase block">Current Price</span>
                    <LivePriceTicker symbol={selectedSymbol} large />
                 </div>
               </button>

               <AnimatePresence>
                 {isDropdownOpen && (
                   <motion.div 
                     initial={{ opacity: 0, y: 10, scale: 0.95 }}
                     animate={{ opacity: 1, y: 0, scale: 1 }}
                     exit={{ opacity: 0, y: 10, scale: 0.95 }}
                     transition={{ duration: 0.15 }}
                     className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-[#333] rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] z-[100] overflow-hidden"
                   >
                      <div className="p-3 border-b border-[#333]">
                        <div className="relative">
                          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                          <input 
                            type="text"
                            placeholder="Search symbol..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onClick={(e) => e.stopPropagation()} 
                            autoFocus
                            className="w-full bg-[#0f0f0f] text-sm text-white rounded-lg pl-9 pr-3 py-2 border border-[#2a2a2a] focus:border-cyan-500 outline-none placeholder:text-gray-600"
                          />
                        </div>
                      </div>
                      
                      <div className="max-h-[240px] overflow-y-auto custom-scrollbar p-2 space-y-1">
                        {filteredSymbols.map(sym => (
                          <div 
                            key={sym}
                            onClick={() => {
                              onSymbolSelect(sym);
                              setIsDropdownOpen(false);
                            }}
                            className={cn(
                              "flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer group transition-all",
                              selectedSymbol === sym ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "hover:bg-[#2a2a2a] text-gray-300 border border-transparent"
                            )}
                          >
                            <span className="text-sm font-bold">{sym}</span>
                            <div className="flex items-center gap-3">
                               <LivePriceTicker symbol={sym} />
                               <button 
                                 onClick={(e) => handleRemoveSymbol(e, sym)}
                                 className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-500/10"
                               >
                                 <X size={14} />
                               </button>
                            </div>
                          </div>
                        ))}
                        {filteredSymbols.length === 0 && (
                          <div className="text-center py-8 text-xs text-gray-500 flex flex-col items-center gap-2">
                             <Search size={24} className="text-gray-700" />
                             <p>No symbols found</p>
                          </div>
                        )}
                      </div>

                      <div className="p-3 border-t border-[#333] bg-[#0f0f0f]">
                         <form onSubmit={handleAddSymbol} className="flex gap-2">
                           <input 
                             type="text" 
                             placeholder="Add eg. DOGEUSDT"
                             value={newSymbolInput}
                             onChange={(e) => setNewSymbolInput(e.target.value)}
                             onClick={(e) => e.stopPropagation()}
                             className="flex-1 bg-[#1a1a1a] text-xs text-white px-3 py-2 rounded-lg border border-[#2a2a2a] focus:border-cyan-500 outline-none uppercase placeholder:text-gray-600"
                           />
                           <button 
                             type="submit"
                             className="bg-cyan-500 hover:bg-cyan-400 text-black px-3 py-2 rounded-lg transition-colors flex items-center justify-center"
                           >
                             <Plus size={16} />
                           </button>
                         </form>
                      </div>
                   </motion.div>
                 )}
               </AnimatePresence>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FollowSymbolPanel;