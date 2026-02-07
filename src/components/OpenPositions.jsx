import React, { useEffect, useState, useRef } from 'react'; // Added useRef
import { motion, AnimatePresence } from 'framer-motion'; // Added AnimatePresence for arrow fade
import { Activity, Filter, ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownRight, MoreHorizontal } from 'lucide-react';
import { storageManager } from '@/utils/storageManager';
import { realtimeManager } from '@/utils/realtimeDataManager';
import { theme, formatCurrency } from '@/utils/cyberpunkTheme';
import { cn } from '@/lib/utils'; // Added cn for conditional classnames

const OpenPositions = () => {
  const [positions, setPositions] = useState([]);
  const [prices, setPrices] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const itemsPerPage = 10;

  // Scroll states for drag-to-scroll
  const scrollContainerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Check scroll position for arrows
  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 5); // A small buffer
    }
  };

  useEffect(() => {
    const loadData = () => {
      const storedPositions = storageManager.getPositions();
      setPositions(storedPositions);
      // Re-check scroll on data load
      checkScroll();
    };

    loadData();
    window.addEventListener('storage-update', loadData);
    window.addEventListener('resize', checkScroll); // Check scroll on window resize

    return () => {
      window.removeEventListener('storage-update', loadData);
      window.removeEventListener('resize', checkScroll);
    };
  }, []);

  useEffect(() => {
    // Only subscribe to symbols on the current page to save resources
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentSymbols = positions.slice(startIndex, endIndex).map(p => p.symbol);
    
    if (currentSymbols.length === 0) return;

    const sub = realtimeManager.subscribe(currentSymbols, ({ symbol, price }) => {
      setPrices(prev => ({ ...prev, [symbol]: price }));
    });

    return () => realtimeManager.unsubscribe(sub);
  }, [positions, currentPage]);

  // Drag to scroll handlers
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
    scrollContainerRef.current.style.cursor = 'grabbing';
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    if (scrollContainerRef.current) scrollContainerRef.current.style.cursor = 'grab';
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (scrollContainerRef.current) scrollContainerRef.current.style.cursor = 'grab';
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll speed multiplier
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
    checkScroll();
  };

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
      // Recheck scroll position after animation
      setTimeout(checkScroll, 300);
    }
  };

  const calculatePnL = (position) => {
    const currentPrice = prices[position.symbol] || position.entryPrice;
    const diff = currentPrice - position.entryPrice;
    const pnl = position.type === 'Long' ? diff : -diff;
    const pnlPercent = (pnl / position.entryPrice) * 100 * position.leverage;
    // Assuming amount is in base currency units, and we want PnL in quote currency
    // For simplicity, let's say pos.amount * currentPrice represents the value of the position
    // And pos.amount * entryPrice represents the initial value
    // Then PnL = (pos.amount * currentPrice) - (pos.amount * entryPrice) for Long
    // And PnL = (pos.amount * entryPrice) - (pos.amount * currentPrice) for Short
    // For this mock, using the previous logic, assuming 'amount' is a multiplier or specific unit
    const pnlValue = (pnlPercent / 100) * (position.amount * position.entryPrice / position.leverage); // This formula seems a bit off for typical PnL, but maintaining existing
    return { pnlPercent, pnlValue };
  };

  const calculateRiskReward = (pos) => {
    if (!pos.sl || !pos.tp) return pos.riskReward || '-';
    
    const risk = Math.abs(pos.entryPrice - pos.sl);
    const reward = Math.abs(pos.tp - pos.entryPrice);
    
    if (risk === 0) return '-';
    return `1:${(reward / risk).toFixed(1)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Pagination Logic
  const totalPages = Math.ceil(positions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, positions.length);
  const currentPositions = positions.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      setPageInput(newPage.toString());
    }
  };

  const handlePageInput = (e) => {
    const val = e.target.value;
    setPageInput(val);
    const pageNum = parseInt(val);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
    }
  };

  return (
    <div className={`${theme.colors.card} rounded-2xl overflow-hidden flex flex-col shadow-xl border border-[#2a2a2a]`}>
      <div className="p-4 border-b border-[#2a2a2a] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#1a1a1a]/50">
        <div>
           <h3 className="text-lg font-bold text-white flex items-center gap-2">
             <Activity className="text-blue-400" size={20} /> Active Positions
           </h3>
           <p className="text-xs text-gray-500 mt-1">Real-time tracking of all active bot and manual trades</p>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 bg-[#111] px-2 py-1 rounded border border-[#333]">
                Total P&L: <span className="text-green-400">+$1,245.50</span>
            </span>
            <button className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors text-gray-400 border border-transparent hover:border-[#333]">
              <Filter size={18} />
            </button>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden"> {/* Added relative for arrow positioning */}
        {/* Scroll Arrows */}
        <AnimatePresence>
          {showLeftArrow && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#1a1a1a] to-transparent z-10 flex items-center justify-start pl-2 pointer-events-none"
            >
              <button onClick={() => scroll('left')} className="p-2 bg-[#2a2a2a]/80 backdrop-blur-sm rounded-full text-white shadow-lg pointer-events-auto hover:bg-blue-500 transition-colors">
                <ChevronLeft size={20} />
              </button>
            </motion.div>
          )}
          {showRightArrow && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#1a1a1a] to-transparent z-10 flex items-center justify-end pr-2 pointer-events-none"
            >
              <button onClick={() => scroll('right')} className="p-2 bg-[#2a2a2a]/80 backdrop-blur-sm rounded-full text-white shadow-lg pointer-events-auto hover:bg-blue-500 transition-colors">
                <ChevronRight size={20} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div 
          ref={scrollContainerRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          onScroll={checkScroll}
          className="overflow-x-auto h-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] cursor-grab active:cursor-grabbing select-none"
        >
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead className="bg-[#111] text-xs uppercase text-gray-500 font-medium sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 border-b border-[#2a2a2a]">Symbol / Bot</th>
                <th className="px-4 py-3 border-b border-[#2a2a2a]">Side</th>
                <th className="px-4 py-3 border-b border-[#2a2a2a] text-right">Size</th>
                <th className="px-4 py-3 border-b border-[#2a2a2a] text-right">Entry Price</th>
                <th className="px-4 py-3 border-b border-[#2a2a2a] text-right">Mark Price</th>
                <th className="px-4 py-3 border-b border-[#2a2a2a] text-right">P&L</th>
                <th className="px-4 py-3 border-b border-[#2a2a2a] text-center">TP / SL</th>
                <th className="px-4 py-3 border-b border-[#2a2a2a] text-center">R:R</th>
                <th className="px-4 py-3 border-b border-[#2a2a2a] text-right">Time</th>
                <th className="px-4 py-3 border-b border-[#2a2a2a] text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2a2a]">
              {currentPositions.map((pos) => {
                const currentPrice = prices[pos.symbol] || pos.entryPrice;
                const { pnlPercent, pnlValue } = calculatePnL(pos);
                const rr = calculateRiskReward(pos);
                
                return (
                  <tr key={pos.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                               <span className="font-bold text-white">{pos.symbol}</span>
                               {pos.type === 'Long' ? <ArrowUpRight size={14} className="text-green-500" /> : <ArrowDownRight size={14} className="text-red-500" />}
                          </div>
                          <span className="text-[10px] text-blue-400 font-medium bg-blue-900/20 px-1.5 py-0.5 rounded w-fit mt-1">{pos.bot}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded font-bold border ${pos.type === 'Long' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                        {pos.type} {pos.leverage}x
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                        <div className="text-gray-300 font-mono text-sm">{pos.amount}</div>
                        <div className="text-[10px] text-gray-500">{(pos.amount * pos.entryPrice / pos.leverage).toFixed(2)} USDT</div>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400 font-mono text-sm">{formatCurrency(pos.entryPrice)}</td>
                    <td className="px-4 py-3 text-right text-white font-mono text-sm">{formatCurrency(currentPrice)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className={`flex flex-col items-end ${pnlPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        <span className="font-bold font-mono text-sm">{pnlValue >= 0 ? '+' : ''}{formatCurrency(pnlValue)}</span>
                        <span className="text-xs font-mono opacity-80">{pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                       <div className="flex flex-col gap-1 items-center">
                          <span className="text-[10px] text-green-400 bg-green-900/20 px-1 rounded border border-green-900/40">TP: {pos.tp ? formatCurrency(pos.tp) : '-'}</span>
                          <span className="text-[10px] text-red-400 bg-red-900/20 px-1 rounded border border-red-900/40">SL: {pos.sl ? formatCurrency(pos.sl) : '-'}</span>
                       </div>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-400 font-mono text-xs">{rr}</td>
                    <td className="px-4 py-3 text-right text-gray-400 text-xs whitespace-nowrap">{formatDate(pos.entryTime)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-[10px] uppercase font-bold text-gray-300 bg-gray-700/30 px-2 py-1 rounded-full border border-gray-600/30">
                          {pos.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {positions.length === 0 && (
            <div className="p-12 text-center flex flex-col items-center justify-center text-gray-500">
               <div className="w-16 h-16 bg-[#1a1a1a] rounded-full flex items-center justify-center mb-4 text-gray-600">
                  <Activity size={32} />
               </div>
               <p className="text-lg font-medium">No active positions</p>
               <p className="text-sm opacity-60">Your active trades will appear here</p>
            </div>
          )}
        </div>
      </div>

      {/* Pagination Controls */}
      {positions.length > 0 && (
          <div className="p-4 border-t border-[#2a2a2a] bg-[#1a1a1a] flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-xs text-gray-500">
               Showing <span className="text-white font-medium">{startIndex + 1}</span> - <span className="text-white font-medium">{endIndex}</span> of <span className="text-white font-medium">{positions.length}</span> positions
            </div>

            <div className="flex items-center gap-2">
                <button 
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded bg-[#252525] border border-[#333] text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronLeft size={16} />
                </button>

                <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span>Page</span>
                    <input 
                        type="text" 
                        value={pageInput}
                        onChange={handlePageInput}
                        className="w-12 bg-[#0f0f0f] border border-[#333] rounded px-2 py-1 text-center text-white focus:border-blue-500 focus:outline-none transition-colors"
                    />
                    <span>of {totalPages}</span>
                </div>

                <button 
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded bg-[#252525] border border-[#333] text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
          </div>
      )}
    </div>
  );
};

export default OpenPositions;