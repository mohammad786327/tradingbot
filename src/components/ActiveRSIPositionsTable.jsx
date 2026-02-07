
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, CheckSquare, Square, RefreshCw, AlertCircle, Edit, Activity, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { binanceWS } from '@/utils/binanceWebSocket';
import { calculateRSI } from '@/utils/indicators';
import { getAllBotTemplates } from '@/utils/botTemplateDataManager';

const ActiveRSIPositionsTable = ({ positions = [], onUpdatePositions }) => {
  const { toast } = useToast();
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState([]);
  const [liveRSIMap, setLiveRSIMap] = useState({});
  const [livePriceMap, setLivePriceMap] = useState({});
  const [loadingMap, setLoadingMap] = useState({});
  const [filter, setFilter] = useState('All'); 
  const [templateMap, setTemplateMap] = useState({});

  // 0. Load Templates for Margin/Leverage lookup
  useEffect(() => {
    setTemplateMap(getAllBotTemplates());
  }, [positions.length]);

  // 1. Subscribe to WS for Price and RSI
  useEffect(() => {
    if (positions.length === 0) return;

    // Ensure we only use valid symbols
    const activeSymbols = [...new Set(positions.map(p => p.symbol).filter(s => s && s !== 'UNKNOWN'))];
    if (activeSymbols.length === 0) return;

    const histories = {}; // symbol -> array of candles

    // Initial Fetch
    const fetchHistories = async () => {
        for (const sym of activeSymbols) {
            if (loadingMap[sym]) continue;
            setLoadingMap(prev => ({ ...prev, [sym]: true }));
            try {
                // Kline for RSI
                const res = await fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=${sym}&interval=1m&limit=100`);
                const data = await res.json();
                if (Array.isArray(data)) {
                    histories[sym] = data.map(d => ({
                        time: d[0], close: parseFloat(d[4])
                    }));
                    const currentPrice = histories[sym][histories[sym].length - 1].close;
                    const rsi = calculateRSI(histories[sym].map(c => c.close), 14).pop();
                    
                    setLiveRSIMap(prev => ({ ...prev, [sym]: rsi }));
                    setLivePriceMap(prev => ({ ...prev, [sym]: currentPrice }));
                }
            } catch (e) {
                console.error("Failed to fetch history", sym);
            }
            setLoadingMap(prev => ({ ...prev, [sym]: false }));
        }
    };
    
    fetchHistories();

    // WS Handler
    const handleWS = (data) => {
        if (data.e === 'kline') {
            const sym = data.s;
            const k = data.k;
            const candle = { time: k.t, close: parseFloat(k.c) };
            
            // Update Price
            setLivePriceMap(prev => ({ ...prev, [sym]: candle.close }));

            // Update History & RSI
            if (!histories[sym]) histories[sym] = [];
            
            // Only push if time is newer or update last if same time
            const last = histories[sym][histories[sym].length - 1];
            if (last && last.time === candle.time) {
                histories[sym][histories[sym].length - 1] = candle;
            } else {
                histories[sym].push(candle);
                if (histories[sym].length > 150) histories[sym].shift();
            }

            const rsiVal = calculateRSI(histories[sym].map(c => c.close), 14).pop();
            setLiveRSIMap(prev => ({ ...prev, [sym]: rsiVal }));
        }
    };

    const sub = binanceWS.subscribe(activeSymbols, 'kline', '1m', handleWS);
    return () => binanceWS.unsubscribe(sub);
  }, [positions.length, JSON.stringify(positions.map(p => p.symbol))]);

  // 2. Monitor Triggers (Waiting -> Active) & Lock Entry Price
  useEffect(() => {
    let updates = false;
    const updatedPositions = positions.map(pos => {
        // Only check WAITING bots or Active Bots without locked entry
        if ((!pos.status || pos.status === 'WAITING' || (pos.status === 'ACTIVE' && !pos.isEntryPriceLocked))) {
            
            // Trigger check for Waiting
            let shouldActivate = false;
            if (pos.status !== 'ACTIVE' && liveRSIMap[pos.symbol]) {
                 const currentRSI = liveRSIMap[pos.symbol];
                 const targetRSI = parseFloat(pos.rsiValue || 30);
                 if (currentRSI <= targetRSI) {
                     shouldActivate = true;
                 }
            }
            
            // If ALREADY active but not locked, lock it now
            const isAlreadyActiveButUnlocked = pos.status === 'ACTIVE' && !pos.isEntryPriceLocked;

            if ((shouldActivate || isAlreadyActiveButUnlocked) && livePriceMap[pos.symbol]) {
                const capturedPrice = livePriceMap[pos.symbol];
                
                updates = true;
                return {
                    ...pos,
                    status: 'ACTIVE',
                    triggered_at: pos.triggered_at || new Date().toISOString(),
                    trigger_snapshot_rsi: liveRSIMap[pos.symbol] || pos.trigger_snapshot_rsi,
                    entryPrice: capturedPrice, // Lock entry price
                    isEntryPriceLocked: true,
                    entryPriceLockedAt: new Date().toISOString(),
                    currentPrice: capturedPrice, // Init current price
                    positions: 1, 
                    pnl: 0,
                    pnlPercent: 0
                };
            }
        }
        return pos;
    });

    if (updates && onUpdatePositions) {
        onUpdatePositions(updatedPositions);
        toast({
            title: "RSI Bot Triggered!",
            description: "A bot has entered a position and entry price is now locked.",
            className: "bg-green-500 border-green-600 text-white"
        });
    }
  }, [liveRSIMap, livePriceMap]); 

  // Filtering
  const filteredPositions = useMemo(() => {
      if (filter === 'All') return positions;
      return positions.filter(p => (p.status || 'WAITING').toUpperCase() === filter.toUpperCase());
  }, [positions, filter]);

  // Selection Logic
  const toggleSelectAll = () => {
    if (selectedItems.size === filteredPositions.length && filteredPositions.length > 0) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredPositions.map(p => p.id)));
    }
  };

  const toggleSelect = (id) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedItems(newSelected);
  };

  const handleDeleteClick = (id) => {
    setItemsToDelete([id]);
    setIsDeleteModalOpen(true);
  };

  const handleBulkDeleteClick = () => {
    setItemsToDelete(selectedItems.size > 0 ? Array.from(selectedItems) : positions.map(p => p.id));
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    const updated = positions.filter(p => !itemsToDelete.includes(p.id));
    if (onUpdatePositions) onUpdatePositions(updated);
    setSelectedItems(new Set());
    setItemsToDelete([]);
    toast({ title: "Deleted", description: "RSI positions removed.", className: "bg-green-500 text-white" });
  };

  const getStatusBadge = (status) => {
      const s = (status || 'WAITING').toUpperCase();
      const styles = {
          ACTIVE: "bg-green-500/10 text-green-500 border-green-500/20",
          WAITING: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
          CLOSED: "bg-gray-500/10 text-gray-400 border-gray-500/20",
          ERROR: "bg-red-500/10 text-red-500 border-red-500/20"
      };
      return (
          <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider", styles[s] || styles.CLOSED)}>
              {s}
          </span>
      );
  };

  return (
    <>
      <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] overflow-hidden flex flex-col h-full shadow-lg">
        {/* Header with Tabs */}
        <div className="px-6 py-4 border-b border-[#2a2a2a] flex flex-col md:flex-row justify-between items-start md:items-center bg-[#151515] gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
                <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wide">RSI POSITIONS</h3>
                <span className="px-2 py-0.5 rounded-full bg-[#2a2a2a] text-xs font-bold text-gray-400 border border-[#333]">
                  {filteredPositions.length}
                </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
            {/* Filter Tabs */}
            <div className="flex p-1 bg-[#111] rounded-lg border border-[#222]">
                {['All', 'Waiting', 'Active', 'Closed'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setFilter(tab)}
                        className={cn(
                            "px-3 py-1 text-xs font-bold rounded-md transition-all",
                            filter === tab 
                                ? "bg-[#2a2a2a] text-white shadow-sm border border-[#333]" 
                                : "text-gray-500 hover:text-gray-300"
                        )}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <button
                onClick={handleBulkDeleteClick}
                disabled={positions.length === 0}
                className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                positions.length === 0 
                    ? "text-gray-600 bg-[#222] cursor-not-allowed" 
                    : "text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20"
                )}
            >
                <Trash2 size={14} />
                <span className="hidden sm:inline">Delete</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto custom-scrollbar">
           <table className="w-full text-left border-collapse min-w-[1000px]">
             <thead className="bg-[#0f0f0f] text-xs uppercase text-gray-500 font-bold tracking-wider sticky top-0 z-10">
               <tr>
                 <th className="px-4 py-4 w-[50px] text-center">
                    <button onClick={toggleSelectAll} className="hover:text-white transition-colors">
                        {filteredPositions.length > 0 && selectedItems.size === filteredPositions.length ? 
                          <CheckSquare size={16} className="text-purple-500" /> : <Square size={16} />
                        }
                    </button>
                 </th>
                 <th className="px-4 py-4 font-bold text-gray-400">Symbol</th>
                 <th className="px-4 py-4 font-bold text-gray-400">Position</th>
                 <th className="px-4 py-4 font-bold text-gray-400">Timeframe</th>
                 <th className="px-4 py-4 font-bold text-gray-400">Entry / Current</th>
                 <th className="px-4 py-4 font-bold text-gray-400">Progress / Prices</th>
                 <th className="px-4 py-4 font-bold text-gray-400">RSI Config</th>
                 <th className="px-4 py-4 font-bold text-gray-400">Live RSI</th>
                 <th className="px-4 py-4 font-bold text-gray-400">Status</th>
                 <th className="px-4 py-4 font-bold text-gray-400">PnL</th>
                 <th className="px-4 py-4 font-bold text-gray-400 text-right">Actions</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-[#2a2a2a]">
               {filteredPositions.length === 0 ? (
                 <tr>
                    <td colSpan="11" className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
                            <Activity className="text-gray-600" size={32} />
                            <p className="text-gray-500 font-medium">No positions found for "{filter}" filter.</p>
                        </div>
                    </td>
                 </tr>
               ) : (
                 filteredPositions.map((pos) => {
                    const isSelected = selectedItems.has(pos.id);
                    const liveRSI = liveRSIMap[pos.symbol];
                    const livePrice = livePriceMap[pos.symbol];
                    
                    const status = pos.status || 'WAITING';
                    const isWaiting = status === 'WAITING';
                    
                    // Display Data
                    const entryPrice = isWaiting ? 0 : parseFloat(pos.entryPrice || 0);
                    // Current price is live if available, else fallback
                    const currentPrice = livePrice || parseFloat(pos.currentPrice || entryPrice);

                    const pnl = isWaiting ? 0 : parseFloat(pos.pnl || 0);
                    const pnlPercent = isWaiting ? 0 : parseFloat(pos.pnlPercent || 0);
                    const targetRSI = pos.rsiValue || 30;

                    // Retrieve Template Info for Position Column
                    const template = templateMap[pos.botId] || {};
                    const margin = parseFloat(pos.investment || pos.margin || template.investment || template.margin || 0);
                    const leverage = parseFloat(pos.leverage || template.leverage || 1);
                    
                    let direction = (pos.direction || pos.side || template.direction || template.strategy || 'LONG').toUpperCase();
                    if (direction.includes('SHORT') || direction.includes('SELL')) direction = 'SHORT';
                    else direction = 'LONG';

                    return (
                       <motion.tr
                          key={pos.id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className={cn("group hover:bg-[#202020] transition-colors", isSelected && "bg-[#252525]")}
                       >
                          {/* 1. Checkbox */}
                          <td className="px-4 py-4 text-center">
                             <button onClick={() => toggleSelect(pos.id)} className="text-gray-500 hover:text-white">
                                {isSelected ? <CheckSquare size={16} className="text-purple-500" /> : <Square size={16} />}
                             </button>
                          </td>

                          {/* 2. Symbol */}
                          <td className="px-4 py-4">
                               <span className="font-bold text-white text-sm block">{pos.symbol || 'UNKNOWN'}</span>
                          </td>
                          
                          {/* 3. Position Info (NEW) */}
                          <td className="px-4 py-4">
                              <div className="flex flex-col gap-1.5">
                                  <span className="text-xs text-gray-500 whitespace-nowrap">
                                      Margin: <span className="text-white font-bold">${margin.toFixed(2)}</span>
                                  </span>
                                  <div className="flex items-center gap-2">
                                      <span className={cn(
                                          "px-1.5 py-0.5 rounded text-[10px] font-bold border",
                                          direction === 'LONG' 
                                              ? "bg-green-500/10 text-green-500 border-green-500/20" 
                                              : "bg-red-500/10 text-red-500 border-red-500/20"
                                      )}>
                                          {direction}
                                      </span>
                                      <span className={cn("text-xs font-bold", direction === 'LONG' ? "text-green-500" : "text-red-500")}>
                                          {leverage}x
                                      </span>
                                  </div>
                              </div>
                          </td>

                          {/* 4. Timeframe */}
                          <td className="px-4 py-4">
                               <span className="text-xs text-gray-400 font-mono font-medium">{pos.timeframe || '1m'}</span>
                          </td>

                          {/* 5. Entry / Current */}
                          <td className="px-4 py-4">
                              <div className="flex flex-col gap-1">
                                 <div className="text-xs font-medium whitespace-nowrap">
                                    <span className="text-gray-500 mr-1.5 inline-block w-[34px]">Entry:</span>
                                    <span className="text-white font-mono">{isWaiting ? '---' : `$${entryPrice.toLocaleString()}`}</span>
                                 </div>
                                 <div className="text-xs font-medium whitespace-nowrap">
                                    <span className="text-gray-500 mr-1.5 inline-block w-[34px]">Curr:</span>
                                    <span className={cn(
                                        "font-bold font-mono",
                                        !isWaiting && currentPrice > entryPrice ? "text-green-400" : 
                                        !isWaiting && currentPrice < entryPrice ? "text-red-400" : "text-gray-300"
                                    )}>
                                        ${currentPrice ? currentPrice.toLocaleString() : '...'}
                                    </span>
                                 </div>
                              </div>
                          </td>

                          {/* 6. Prices / Trigger Progress */}
                          <td className="px-4 py-4">
                              {isWaiting ? (
                                  <div className="flex flex-col gap-1">
                                      <div className="flex items-center gap-1.5 text-xs text-yellow-500/80 font-medium">
                                          <Clock size={12} />
                                          <span>Waiting for Trigger</span>
                                      </div>
                                      <span className="text-[10px] text-gray-500">
                                          Target RSI: &lt; {targetRSI}
                                      </span>
                                  </div>
                              ) : (
                                  <div className="flex flex-col gap-1 text-[11px] font-mono text-gray-500">
                                      <span className="whitespace-nowrap">TP: <span className="text-gray-300">${pos.takeProfit || '---'}</span></span>
                                      <span className="whitespace-nowrap">SL: <span className="text-gray-300">${pos.stopLoss || '---'}</span></span>
                                      {pos.triggered_at && (
                                        <span className="text-[10px] text-green-500/70 mt-0.5">
                                            Trig @ RSI {pos.trigger_snapshot_rsi?.toFixed(1)}
                                        </span>
                                      )}
                                  </div>
                              )}
                          </td>

                          {/* 7. RSI Config */}
                          <td className="px-4 py-4">
                             <div className="flex flex-col gap-0.5">
                               <span className="text-xs text-gray-300 font-medium whitespace-nowrap">
                                 Target: <span className="text-purple-400 font-bold">{targetRSI}</span>
                               </span>
                               <span className="text-[10px] text-gray-500">
                                 Len: 14 | Mode: Touch
                               </span>
                             </div>
                          </td>

                          {/* 8. Live RSI */}
                          <td className="px-4 py-4">
                             {loadingMap[pos.symbol] ? (
                                <RefreshCw size={14} className="animate-spin text-purple-500" />
                             ) : (
                                <div className={cn(
                                    "font-mono font-bold text-sm flex items-center gap-1",
                                    liveRSI && liveRSI < targetRSI ? "text-green-400" : "text-gray-400"
                                )}>
                                   {liveRSI ? liveRSI.toFixed(2) : '--'}
                                   {isWaiting && liveRSI && liveRSI < targetRSI && (
                                       <Activity size={12} className="text-green-500 animate-pulse" />
                                   )}
                                </div>
                             )}
                          </td>

                          {/* 9. Status */}
                          <td className="px-4 py-4">
                              {getStatusBadge(status)}
                          </td>

                          {/* 10. PnL */}
                          <td className="px-4 py-4">
                              {isWaiting ? (
                                  <span className="text-gray-600 font-mono">-</span>
                              ) : (
                                  <div className="flex flex-col">
                                      <span className={cn(
                                        "text-sm font-bold", 
                                        pnl > 0 ? "text-green-400" : pnl < 0 ? "text-red-400" : "text-gray-400"
                                      )}>
                                          {pnl > 0 ? '+' : ''}{pnl.toFixed(2)}
                                      </span>
                                      <span className="text-[10px] text-gray-500 font-medium mt-0.5">
                                          {pnlPercent > 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                                      </span>
                                  </div>
                              )}
                          </td>

                          {/* 11. Actions */}
                          <td className="px-4 py-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button 
                                     onClick={() => toast({ title: "Opening Edit Modal", description: "Edit functionality coming soon." })} 
                                     className="text-gray-500 hover:text-blue-400 hover:bg-blue-400/10 p-1.5 rounded-lg transition-all"
                                  >
                                     <Edit size={14} />
                                </button>
                                <button 
                                   onClick={() => handleDeleteClick(pos.id)} 
                                   className="text-gray-500 hover:text-red-400 hover:bg-red-400/10 p-1.5 rounded-lg transition-all"
                                >
                                   <Trash2 size={14} />
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

      <DeleteConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        itemType="RSI positions"
        count={itemsToDelete.length}
      />
    </>
  );
};

export default ActiveRSIPositionsTable;
