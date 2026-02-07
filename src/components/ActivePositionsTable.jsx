import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Edit, 
  XCircle, 
  Filter, 
  CheckCircle2, 
  Clock, 
  Search, 
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  History,
  Activity,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { useNotifications } from '@/context/NotificationContext';
import { NOTIFICATION_TYPES } from '@/utils/notificationTypes';
import { useNavigate } from 'react-router-dom';
import { usePositions } from '@/context/PositionContext';
import { POSITION_STATUS } from '@/utils/positionSchema';
import { binanceWS } from '@/utils/binanceWebSocket';
import { generateActivePositions } from '@/utils/positionMockData';

const ActivePositionsTable = ({ onPositionSelect, selectedPosition, filterMode, positions: propPositions }) => {
  const { toast } = useToast();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  const { positions: contextPositions, deletePosition, updatePosition } = usePositions();
  const [showFilters, setShowFilters] = useState(false);
  const [livePrices, setLivePrices] = useState({});
  const [localPositions, setLocalPositions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize data - prioritise props, then context, then mock fallback
  useEffect(() => {
    const initializeData = () => {
      let dataToUse = [];
      
      if (propPositions && propPositions.length > 0) {
        dataToUse = propPositions;
      } else if (contextPositions && contextPositions.length > 0) {
        dataToUse = contextPositions;
      } else {
        // Fallback to mock data if no positions found anywhere
        console.log("Using generated mock active positions");
        dataToUse = generateActivePositions();
      }
      
      setLocalPositions(dataToUse);
      setIsLoading(false);
    };

    initializeData();
  }, [propPositions, contextPositions]);

  // WebSocket Subscription for Real-time Prices
  useEffect(() => {
    if (!localPositions.length) return;

    const symbols = [...new Set(localPositions.map(p => p.symbol))];
    if (symbols.length === 0) return;

    console.log("Subscribing to symbols:", symbols);

    const subscription = binanceWS.subscribe(symbols, 'ticker', '1m', (data) => {
      // data.s = symbol, data.c = current price
      if (data.s && data.c) {
        setLivePrices(prev => ({
          ...prev,
          [data.s]: parseFloat(data.c)
        }));
      }
    });

    return () => {
      if (subscription) {
        binanceWS.unsubscribe(subscription);
      }
    };
  }, [localPositions.length]); // Re-subscribe if list length changes drastically (simple check)

  
  // Filter States
  const [filters, setFilters] = useState({
    search: '',
    status: { active: true, moving: true },
    pnl: 'all' // 'all', 'profit', 'loss'
  });

  // Scroll States (Preserved from previous logic)
  const scrollContainerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [localPositions]);

  // Drag handlers
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
    const walk = (x - startX) * 2;
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
      setTimeout(checkScroll, 300);
    }
  };

  // Actions
  const handleClosePosition = (e, position) => {
    e.stopPropagation();
    const confirmClose = window.confirm(`Are you sure you want to close position ${position.symbol}?`);
    
    if (confirmClose) {
        toast({
            title: "Closing Position",
            description: `Closing position for ${position.symbol} at market price...`
        });
        
        // Use context update if available, otherwise just remove from local state for demo
        if (updatePosition) {
             updatePosition(position.id, { status: POSITION_STATUS.CLOSED });
        } else {
             setLocalPositions(prev => prev.filter(p => p.id !== position.id));
        }

        addNotification(
            NOTIFICATION_TYPES.POSITION_CLOSED,
            "Position Closed",
            `Closed ${position.symbol}. PnL locked.`,
            { positionId: position.id }
        );
    }
  };

  const handleDeletePosition = (e, position) => {
      e.stopPropagation();
      const confirmDelete = window.confirm("Delete this position record permanently?");
      if (confirmDelete) {
          if (deletePosition) deletePosition(position.id);
          else setLocalPositions(prev => prev.filter(p => p.id !== position.id));
          
          toast({ title: "Position Deleted", variant: "destructive" });
      }
  };

  const handleHistoryClick = (e, position) => {
      e.stopPropagation();
      toast({ title: "History", description: "Trade history view not implemented yet." });
  };

  const handleRowClick = (pos) => {
    if (onPositionSelect) {
        if (selectedPosition && selectedPosition.id === pos.id) {
            onPositionSelect(null);
        } else {
            onPositionSelect(pos);
        }
    }
  };

  // Processing Data: Filter + Live Price Updates
  const processedPositions = useMemo(() => {
    return localPositions.map(pos => {
        const livePrice = livePrices[pos.symbol];
        
        // If we have a live price, we need to recalculate stats
        if (livePrice && livePrice !== pos.currentPrice) {
            const isLong = pos.direction === 'LONG' || pos.direction === 'Long';
            const leverage = parseFloat(pos.leverage || 1);
            const margin = parseFloat(pos.margin || 0);
            const entryPrice = parseFloat(pos.entryPrice);
            
            // Calculate percentage change of price itself
            const priceDiffPercent = ((livePrice - entryPrice) / entryPrice);
            
            // Calculate ROE (Return on Equity) / PnL %
            const pnlPercentage = (isLong ? priceDiffPercent : -priceDiffPercent) * 100 * leverage;
            
            // Calculate Unrealized PnL Value
            const unrealizedPnl = (pnlPercentage / 100) * margin;

            return {
                ...pos,
                currentPrice: livePrice,
                unrealizedPnl,
                pnlPercentage,
                priceChangeDirection: livePrice > pos.currentPrice ? 'up' : 'down' // for animation cues
            };
        }
        return pos;
    });
  }, [localPositions, livePrices]);


  // Filtering Logic
  const filteredPositions = processedPositions.filter(pos => {
      // 1. Text Search
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = !filters.search || 
                            pos.symbol?.toLowerCase().includes(searchLower) || 
                            pos.botName?.toLowerCase().includes(searchLower);

      // 2. Status Filter
      // Map incoming status to our filter keys if needed, defaulting to active
      const statusKey = pos.status === 'MOVING' ? 'moving' : 'active';
      const matchesStatus = filters.status[statusKey] !== false;

      // 3. PnL Filter
      const pnl = pos.unrealizedPnl || 0;
      const matchesPnl = filters.pnl === 'all' || 
                         (filters.pnl === 'profit' && pnl > 0) ||
                         (filters.pnl === 'loss' && pnl < 0);

      // 4. External Filter Prop (active/pending from dashboard counters)
      // Since this table is strictly for "Active Positions" usually, we just check if it matches the 'filterMode'
      // If filterMode is 'pending', active table typically shouldn't show anything, but let's be flexible
      let matchesMode = true;
      if (filterMode === 'profit') matchesMode = pnl > 0;
      if (filterMode === 'loss') matchesMode = pnl < 0;
      // if (filterMode === 'active') matchesMode = true; 

      return matchesSearch && matchesStatus && matchesPnl && matchesMode;
  });

  const clearFilters = () => {
    setFilters({
      search: '',
      status: { active: true, moving: true },
      pnl: 'all'
    });
  };

  return (
    <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] overflow-hidden flex flex-col h-full shadow-lg relative min-h-[400px]">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-[#2a2a2a] flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#1a1a1a] z-20 gap-4">
        <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <div>
                <h3 className="text-lg font-bold text-white uppercase tracking-wide leading-none">Live Positions</h3>
                <span className="text-[10px] text-gray-500 font-mono">REAL-TIME MARKET DATA</span>
            </div>
            <span className="ml-2 px-2 py-0.5 bg-[#2a2a2a] rounded-md text-xs font-mono text-blue-400 border border-blue-500/20">
                {filteredPositions.length} Active
            </span>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
             <div className="relative flex-1 sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input 
                    type="text" 
                    placeholder="Filter by Symbol or Bot..." 
                    value={filters.search}
                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                    className="w-full bg-[#111] border border-[#333] rounded-lg py-2 pl-9 pr-3 text-xs text-white focus:border-blue-500 outline-none transition-all focus:ring-1 focus:ring-blue-500/50"
                />
            </div>
            
            <div className="relative">
                <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={cn(
                    "p-2 rounded-lg transition-colors border flex items-center gap-2 h-[34px]",
                    showFilters || filters.pnl !== 'all' 
                        ? "bg-blue-500/20 text-blue-400 border-blue-500/30" 
                        : "bg-[#111] hover:bg-[#2a2a2a] text-gray-400 hover:text-white border-[#333]"
                    )}
                >
                    <Filter size={16} />
                </button>
                 {/* Filter Popover */}
                 <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 top-12 w-64 bg-[#1f1f1f] border border-[#333] rounded-xl shadow-2xl z-50 p-4"
                        >
                            <div className="space-y-4">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase">Filters</h4>
                                    <button onClick={() => setShowFilters(false)} className="text-gray-500 hover:text-white"><X size={14} /></button>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500">PnL Status</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['all', 'profit', 'loss'].map(type => (
                                            <button
                                                key={type}
                                                onClick={() => setFilters({...filters, pnl: type})}
                                                className={cn(
                                                    "px-2 py-1.5 rounded text-[10px] font-bold border uppercase transition-colors",
                                                    filters.pnl === type 
                                                    ? "bg-blue-500 text-white border-blue-500" 
                                                    : "bg-[#111] text-gray-400 border-[#333] hover:bg-[#222]"
                                                )}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <button onClick={clearFilters} className="w-full py-1.5 text-xs text-center text-blue-400 hover:text-blue-300 transition-colors">
                                    Reset All Filters
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden bg-[#0a0a0a]">
        {/* Scroll Arrows */}
        {showLeftArrow && (
           <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#0a0a0a] to-transparent z-10 pointer-events-none flex items-center">
              <ChevronLeft className="text-white/50 ml-2" />
           </div>
        )}
        {showRightArrow && (
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#0a0a0a] to-transparent z-10 pointer-events-none flex items-center justify-end">
               <ChevronRight className="text-white/50 mr-2" />
            </div>
        )}

        <div 
          ref={scrollContainerRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          onScroll={checkScroll}
          className="overflow-x-auto h-full [&::-webkit-scrollbar]:hidden cursor-grab active:cursor-grabbing"
        >
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="bg-[#111] text-[11px] uppercase text-gray-500 sticky top-0 z-10 font-bold tracking-wider border-b border-[#2a2a2a]">
              <tr>
                <th className="px-6 py-4 pointer-events-none w-[200px]">Bot / ID</th>
                <th className="px-6 py-4 pointer-events-none">Symbol</th>
                <th className="px-6 py-4 pointer-events-none">Price Info</th>
                <th className="px-6 py-4 pointer-events-none">Details (SL/TP)</th>
                <th className="px-6 py-4 pointer-events-none text-center">Status</th>
                <th className="px-6 py-4 pointer-events-none text-right">Unrealized PnL</th>
                <th className="px-6 py-4 text-right pointer-events-none">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f1f1f]">
              {isLoading ? (
                  <tr><td colSpan="7" className="px-6 py-12 text-center text-gray-500">Loading market data...</td></tr>
              ) : filteredPositions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-20 text-center">
                     <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-[#1a1a1a] border border-[#333] flex items-center justify-center text-gray-600">
                            <Activity size={24} />
                        </div>
                        <h4 className="text-gray-300 font-bold">No Active Positions</h4>
                        <p className="text-gray-500 text-sm max-w-md">
                            There are no positions matching your current filters. Adjust filters or create a new trading bot to see activity here.
                        </p>
                        <button onClick={clearFilters} className="text-blue-400 text-xs hover:underline mt-2">Clear all filters</button>
                     </div>
                  </td>
                </tr>
              ) : (
                filteredPositions.map((pos, index) => {
                  const isSelected = selectedPosition?.id === pos.id;
                  const isLong = pos.direction === 'LONG' || pos.direction === 'Long';
                  const pnlIsPositive = (pos.unrealizedPnl || 0) >= 0;

                  return (
                    <motion.tr
                      key={pos.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => handleRowClick(pos)}
                      className={cn(
                        "group transition-all cursor-pointer border-l-[3px]",
                        isSelected ? "bg-[#1a1a1a] border-l-blue-500 shadow-inner" : "hover:bg-[#151515] border-l-transparent"
                      )}
                    >
                      {/* Bot / ID */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className={cn("text-sm font-bold truncate max-w-[140px]", isSelected ? "text-blue-400" : "text-gray-200")}>
                             {pos.botName}
                          </span>
                          <span className="text-[10px] text-gray-600 font-mono flex items-center gap-1">
                             ID: {pos.id.slice(-6)}
                             <span className="px-1 py-0.5 rounded bg-[#222] text-gray-400">{pos.strategyType || 'Manual'}</span>
                          </span>
                        </div>
                      </td>

                      {/* Symbol */}
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-2">
                             {/* Coin Icon Placeholder */}
                             <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2a2a2a] to-[#111] border border-[#333] flex items-center justify-center text-[10px] font-bold text-gray-400">
                                {pos.symbol.substring(0,1)}
                             </div>
                             <div>
                                <div className="text-sm font-bold text-white flex items-center gap-1">
                                    {pos.symbol}
                                    {isLong ? 
                                        <span className="text-[10px] bg-green-900/30 text-green-500 px-1 rounded border border-green-500/20">LONG {pos.leverage}x</span> : 
                                        <span className="text-[10px] bg-red-900/30 text-red-500 px-1 rounded border border-red-500/20">SHORT {pos.leverage}x</span>
                                    }
                                </div>
                                <div className={cn("text-xs font-mono flex items-center", (pos.priceChangePercentage || 0) >= 0 ? "text-green-500" : "text-red-500")}>
                                     {(pos.priceChangePercentage || 0) >= 0 ? <TrendingUp size={10} className="mr-1" /> : <TrendingDown size={10} className="mr-1" />}
                                     {Math.abs(pos.priceChangePercentage || 0).toFixed(2)}%
                                </div>
                             </div>
                         </div>
                      </td>

                      {/* Price Info */}
                      <td className="px-6 py-4">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                            <span className="text-gray-500">Entry</span>
                            <span className="text-gray-300 font-mono text-right">${parseFloat(pos.entryPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
                            
                            <span className="text-gray-500">Mark</span>
                            <span className={cn(
                                "font-mono font-bold text-right transition-colors duration-300", 
                                pos.currentPrice > pos.entryPrice ? "text-green-400" : (pos.currentPrice < pos.entryPrice ? "text-red-400" : "text-white")
                            )}>
                                ${parseFloat(pos.currentPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                            </span>
                        </div>
                      </td>

                      {/* Details (SL/TP) */}
                      <td className="px-6 py-4">
                        <div className="space-y-1.5">
                           <div className="flex items-center justify-between text-[11px] gap-3">
                                <span className="text-red-400/80 font-medium">SL</span>
                                <span className="font-mono text-gray-300">
                                    {pos.stopLoss ? `$${pos.stopLoss.toLocaleString()}` : <span className="text-gray-700">-</span>}
                                </span>
                           </div>
                           <div className="flex items-center justify-between text-[11px] gap-3">
                                <span className="text-green-400/80 font-medium">TP</span>
                                <span className="font-mono text-gray-300">
                                    {pos.takeProfit ? `$${pos.takeProfit.toLocaleString()}` : <span className="text-gray-700">-</span>}
                                </span>
                           </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex justify-center">
                            {pos.status === 'MOVING' ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border bg-yellow-500/10 text-yellow-400 border-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.1)]">
                                    <Activity size={10} className="animate-pulse" />
                                    MOVING
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]">
                                    <Activity size={10} />
                                    ACTIVE
                                </span>
                            )}
                        </div>
                      </td>

                      {/* Unrealized PnL */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end">
                            <span className={cn(
                                "text-sm font-bold font-mono tracking-tight",
                                pnlIsPositive ? "text-green-400" : "text-red-400"
                            )}>
                                {pnlIsPositive ? '+' : ''}{parseFloat(pos.unrealizedPnl).toFixed(2)} USDT
                            </span>
                            <span className={cn(
                                "text-xs font-medium px-1.5 py-0.5 rounded border mt-1",
                                pnlIsPositive 
                                    ? "bg-green-500/10 border-green-500/20 text-green-400" 
                                    : "bg-red-500/10 border-red-500/20 text-red-400"
                            )}>
                                {parseFloat(pos.pnlPercentage).toFixed(2)}%
                            </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={(e) => handleClosePosition(e, pos)}
                                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors group/btn relative"
                                title="Close Position"
                            >
                                <XCircle size={16} />
                            </button>
                            <button 
                                onClick={(e) => handleHistoryClick(e, pos)}
                                className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                title="View History"
                            >
                                <History size={16} />
                            </button>
                            <button 
                                onClick={(e) => handleDeletePosition(e, pos)}
                                className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                title="Delete Record"
                            >
                                <AlertTriangle size={16} />
                            </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ActivePositionsTable;