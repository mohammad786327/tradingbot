
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Check, Search, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const CACHE_KEY = 'binance_symbols_cache';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour
const POPULAR_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'DOGEUSDT', 'ADAUSDT', 'AVAXUSDT', 'MATICUSDT', 'DOTUSDT'];

const SymbolSelector = ({ selectedSymbols = [], onSymbolsChange, maxSelections = 10 }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [allSymbols, setAllSymbols] = useState([]);
  const [prices, setPrices] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Virtual Scroll State
  const [scrollTop, setScrollTop] = useState(0);
  const itemHeight = 44; // Approx height of each row
  const containerHeight = 300;

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch Symbols logic
  useEffect(() => {
    const fetchSymbols = async () => {
      setIsLoading(true);
      try {
        // Check cache
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { timestamp, data } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_DURATION) {
            setAllSymbols(data);
            setIsLoading(false);
            return;
          }
        }

        // Fetch from API
        const response = await fetch('https://api.binance.com/api/v3/exchangeInfo');
        const data = await response.json();
        
        // Filter TRADING pairs
        const tradingSymbols = data.symbols
          .filter(s => s.status === 'TRADING')
          .map(s => ({
             symbol: s.symbol,
             baseAsset: s.baseAsset,
             quoteAsset: s.quoteAsset
          }));

        // Prioritize USDT pairs and Popular pairs for better UX
        const sortedSymbols = tradingSymbols.sort((a, b) => {
             // Popular first
             const aPop = POPULAR_SYMBOLS.includes(a.symbol);
             const bPop = POPULAR_SYMBOLS.includes(b.symbol);
             if (aPop && !bPop) return -1;
             if (!aPop && bPop) return 1;
             return a.symbol.localeCompare(b.symbol);
        });

        const simpleList = sortedSymbols.map(s => s.symbol);

        setAllSymbols(simpleList);
        
        // Save to cache
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          timestamp: Date.now(),
          data: simpleList
        }));

      } catch (error) {
        console.error('Failed to fetch symbols:', error);
        // Fallback to cache even if expired
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
             setAllSymbols(JSON.parse(cached).data);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchSymbols();
  }, []);

  // Fetch Prices when Open
  useEffect(() => {
    if (!isOpen) return;

    const fetchPrices = async () => {
      try {
        const res = await fetch('https://api.binance.com/api/v3/ticker/price');
        const data = await res.json();
        const priceMap = {};
        data.forEach(item => {
          priceMap[item.symbol] = parseFloat(item.price);
        });
        setPrices(priceMap);
      } catch (e) {
        console.error("Failed to fetch prices", e);
      }
    };

    fetchPrices();
    // Refresh prices every 10s while open to keep reasonably fresh without WS overload
    const interval = setInterval(fetchPrices, 10000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Filter Logic
  const filteredSymbols = useMemo(() => {
    if (!searchTerm) return allSymbols;
    const lower = searchTerm.toLowerCase();
    return allSymbols.filter(s => s.toLowerCase().includes(lower));
  }, [allSymbols, searchTerm]);

  // Virtual Scroll Logic
  const totalItems = filteredSymbols.length;
  const startIndex = Math.floor(scrollTop / itemHeight);
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const endIndex = Math.min(totalItems, startIndex + visibleCount + 5); // +5 buffer
  const visibleSymbols = filteredSymbols.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;

  const handleSelect = (symbol) => {
    const isSelected = selectedSymbols.includes(symbol);

    if (isSelected) {
      if (selectedSymbols.length === 1) return;
      onSymbolsChange(selectedSymbols.filter(s => s !== symbol));
    } else {
      if (selectedSymbols.length < maxSelections) {
        onSymbolsChange([...selectedSymbols, symbol]);
        setSearchTerm('');
        inputRef.current?.focus();
      }
    }
  };

  const removeSymbol = (e, symbol) => {
    e.stopPropagation();
    if (selectedSymbols.length > 1) {
      onSymbolsChange(selectedSymbols.filter(s => s !== symbol));
    }
  };

  const onScroll = (e) => {
    setScrollTop(e.target.scrollTop);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Search Bar / Input Area */}
      <div 
        className={cn(
          "w-full min-h-[42px] px-3 py-1.5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white transition-all flex flex-wrap items-center gap-2 cursor-text shadow-sm",
          isOpen ? "border-blue-500 ring-1 ring-blue-500/20" : "hover:border-gray-600"
        )}
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
      >
        <Search size={16} className="text-gray-500 shrink-0 mr-1" />
        
        {selectedSymbols.map(symbol => (
          <span 
            key={symbol} 
            className="flex items-center gap-1.5 bg-blue-900/30 text-blue-300 border border-blue-800/50 text-xs font-bold px-2.5 py-1 rounded-md animate-in fade-in zoom-in duration-200"
          >
            {symbol}
            <button 
              type="button"
              onClick={(e) => removeSymbol(e, symbol)}
              className={cn(
                "hover:text-white rounded-full p-0.5 hover:bg-blue-800/50 transition-colors",
                selectedSymbols.length === 1 && "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-blue-300"
              )}
              disabled={selectedSymbols.length === 1}
            >
              <X size={12} />
            </button>
          </span>
        ))}
        
        <div className="flex-1 min-w-[120px] relative">
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
              setScrollTop(0); // Reset scroll on search
            }}
            onFocus={() => setIsOpen(true)}
            className="w-full bg-transparent border-none outline-none text-sm text-white placeholder-gray-600 h-8"
            placeholder={selectedSymbols.length === 0 ? "Select Pair..." : "Add Symbol..."}
          />
        </div>

        <span className="text-[10px] text-gray-600 font-mono shrink-0">
            {selectedSymbols.length}/{maxSelections}
        </span>
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-2xl overflow-hidden flex flex-col"
            style={{ maxHeight: containerHeight + 40 }} // container + header height
          >
             <div className="flex justify-between px-4 py-2.5 text-[10px] font-bold text-gray-500 bg-[#151515] border-b border-[#2a2a2a] tracking-wider shrink-0">
                 <span>AVAILABLE PAIRS ({filteredSymbols.length})</span>
                 <span>PRICE</span>
             </div>
             
             {isLoading && allSymbols.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500 h-[200px]">
                   <Loader2 size={24} className="animate-spin mb-2 text-blue-500" />
                   <span className="text-xs">Loading markets...</span>
                </div>
             ) : (
                <div 
                    ref={listRef}
                    className="overflow-y-auto custom-scrollbar flex-1 relative"
                    style={{ height: containerHeight }}
                    onScroll={onScroll}
                >
                    {filteredSymbols.length > 0 ? (
                        <div style={{ height: totalItems * itemHeight, position: 'relative' }}>
                            <div style={{ transform: `translateY(${offsetY}px)`, position: 'absolute', top: 0, left: 0, width: '100%' }}>
                                {visibleSymbols.map(symbol => {
                                  const isSelected = selectedSymbols.includes(symbol);
                                  const price = prices[symbol];
                                  const isPopular = POPULAR_SYMBOLS.includes(symbol);

                                  return (
                                    <button
                                      key={symbol}
                                      type="button"
                                      onClick={() => handleSelect(symbol)}
                                      className={cn(
                                        "w-full flex items-center justify-between px-3 py-2.5 text-xs transition-all group border-b border-transparent hover:border-[#2a2a2a]",
                                        isSelected 
                                          ? "bg-blue-600/10 text-blue-400 font-bold" 
                                          : "text-gray-300 hover:bg-[#252525] hover:pl-4"
                                      )}
                                      style={{ height: itemHeight }}
                                    >
                                      <div className="flex items-center gap-3">
                                          <div className={cn("w-4 h-4 rounded-sm flex items-center justify-center border transition-colors shrink-0", isSelected ? "bg-blue-500 border-blue-500" : "border-gray-600 group-hover:border-gray-400")}>
                                              {isSelected && <Check size={12} className="text-white" />}
                                          </div>
                                          <div className="flex flex-col items-start leading-none gap-0.5">
                                             <span className="flex items-center gap-1">
                                                {symbol}
                                                {isPopular && <span className="text-[8px] bg-yellow-500/20 text-yellow-500 px-1 rounded">HOT</span>}
                                             </span>
                                          </div>
                                      </div>
                                      <span className={cn(
                                        "font-mono transition-colors", 
                                        price ? "text-white" : "text-gray-600"
                                      )}>
                                         {price ? `$${price.toLocaleString(undefined, { maximumFractionDigits: 4 })}` : '---'}
                                      </span>
                                    </button>
                                  );
                                })}
                            </div>
                        </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-gray-500 h-full">
                        <Search size={24} className="mb-2 opacity-50" />
                        <span className="text-xs">No symbols match "{searchTerm}"</span>
                      </div>
                    )}
                </div>
             )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SymbolSelector;
