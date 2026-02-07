
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit, RefreshCw, Flame, PlayCircle, Trash2, CheckSquare, Square, Activity, Ban, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { binanceWS } from '@/utils/binanceWebSocket';
import { getAllBotTemplates } from '@/utils/botTemplateDataManager';

/**
 * ActiveCandleStrikeBots
 * Displays list of active/waiting bots.
 * Handles the TRIGGER LOGIC: 
 * 1. Receives updated candle streaks from parent (via props).
 * 2. Monitors real-time prices via WebSocket.
 * 3. Activates bot (WAITING -> ACTIVE) when streaks met target.
 * 4. Locks Entry Price at activation moment.
 */
const ActiveCandleStrikeBots = ({ positions = [], onPositionSelect, filterMode, onUpdatePositions, onEditPosition }) => {
  const { toast } = useToast();
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState([]);
  const [realtimePrices, setRealtimePrices] = useState({});
  const [templateMap, setTemplateMap] = useState({});
  const [wsConnected, setWsConnected] = useState(false);
  
  // Ref to track if we've already logged certain states to avoid console spam
  const debugLogRef = useRef(new Set());
  const logOnce = (key, message, data) => {
      if (!debugLogRef.current.has(key)) {
          console.log(`[CandleStrikeBot] ${message}`, data || '');
          debugLogRef.current.add(key);
          // Clear log cache after 10 seconds to allow re-logging eventually
          setTimeout(() => debugLogRef.current.delete(key), 10000);
      }
  };

  // 0. Load Templates for Margin/Leverage lookup
  useEffect(() => {
    const map = getAllBotTemplates();
    setTemplateMap(map);
    logOnce('templates_loaded', 'Bot templates loaded', Object.keys(map).length);
  }, [positions.length]);

  // Filter logic
  let filteredPositions = positions || [];
  if (filterMode) {
      if (filterMode === 'active') {
          filteredPositions = filteredPositions.filter(p => p.status === 'ACTIVE');
      } else if (filterMode === 'pending') {
          filteredPositions = filteredPositions.filter(p => p.status === 'PENDING' || p.status === 'WAITING');
      } else if (filterMode === 'profit') {
          filteredPositions = filteredPositions.filter(p => (p.unrealizedPnl || 0) > 0);
      } else if (filterMode === 'loss') {
          filteredPositions = filteredPositions.filter(p => (p.unrealizedPnl || 0) < 0);
      }
  }

  // WebSocket Subscription for Real-time Prices
  useEffect(() => {
    const symbols = [...new Set(positions.map(p => p.symbol))];
    if (symbols.length === 0) {
        setWsConnected(false);
        return;
    }

    // console.log('[CandleStrikeBot] Subscribing to prices for:', symbols);

    const handlePriceUpdate = (data) => {
        setWsConnected(true);
        setRealtimePrices(prev => ({
            ...prev,
            [data.s]: parseFloat(data.c)
        }));
    };

    const sub = binanceWS.subscribe(symbols, 'ticker', null, handlePriceUpdate);

    return () => {
        if (sub) binanceWS.unsubscribe(sub);
    };
  }, [positions.length, JSON.stringify(positions.map(p => p.symbol))]);

  // --- TRIGGER & ACTIVATION LOGIC ---
  useEffect(() => {
      if (!onUpdatePositions) return;

      let updates = false;
      let logUpdates = [];

      // Map through positions to check triggers and update states
      const updatedPositions = positions.map(pos => {
          // 1. Calculate Status
          const target = pos.consecutiveCandles || 3;
          const green = pos.currentGreenStreak || 0;
          const red = pos.currentRedStreak || 0;
          const direction = pos.direction;
          
          let displayCount = 0;
          if (direction === 'Green Candles' || direction === 'Long Only') {
              displayCount = green;
          } else if (direction === 'Red Candles' || direction === 'Short Only') {
              displayCount = red;
          } else {
              // Auto
              if (green > red) displayCount = green; else displayCount = red;
          }

          // Trigger Condition
          const isTriggered = displayCount >= target;
          
          // Debug logs for waiting bots that are close to trigger
          if (pos.status === 'WAITING' && displayCount > 0) {
              logOnce(`monitor_${pos.id}`, `Monitoring ${pos.symbol}: ${displayCount}/${target} candles`, { green, red, direction });
          }

          const currentPrice = realtimePrices[pos.symbol];

          // 2. Logic: WAITING -> ACTIVE
          if (pos.status === 'WAITING' && isTriggered) {
             // Only activate if we have a valid price to lock entry
             if (currentPrice) {
                 updates = true;
                 logUpdates.push(`${pos.symbol} TRIGGERED! ${displayCount}/${target} candles. Entry: ${currentPrice}`);
                 
                 return {
                     ...pos,
                     status: 'ACTIVE',
                     entryPrice: currentPrice,
                     currentPrice: currentPrice, // Initialize current price
                     isEntryPriceLocked: true,
                     entryPriceLockedAt: new Date().toISOString(),
                     // Reset/Init PnL
                     unrealizedPnl: 0,
                     pnlPercentage: 0
                 };
             } else {
                 logOnce(`missing_price_${pos.id}`, `Trigger met for ${pos.symbol} but waiting for price update...`);
             }
          }

          // 3. Logic: Ensure Active bots have Locked Entry Price
          // (Fallback if somehow activated without price, or if external update cleared it)
          if (pos.status === 'ACTIVE' && !pos.isEntryPriceLocked && currentPrice) {
              updates = true;
              logUpdates.push(`${pos.symbol} locking entry price at ${currentPrice}`);
              return {
                  ...pos,
                  entryPrice: currentPrice,
                  isEntryPriceLocked: true,
                  entryPriceLockedAt: new Date().toISOString()
              };
          }
          
          // 4. Update Current Price for Active Bots (for UI display)
          // We don't recalculate PnL here to avoid excessive re-renders/looping, 
          // PnL calculation is usually done in the Page component or separate PnL hook.
          // However, updating currentPrice here ensures the table feels responsive.
          if (pos.status === 'ACTIVE' && currentPrice && currentPrice !== pos.currentPrice) {
               // Only update if difference is significant to reduce writes? 
               // For now, update continuously for smooth UI.
               // CAUTION: This causes rapid re-renders if passed to parent. 
               // We only mark 'updates = true' if we want to PERSIST this to parent state.
               
               // Decision: Let's NOT force parent update just for price tick unless it's the Trigger moment.
               // The parent (Page) has its own price subscriber for PnL.
               // We only care about Status Changes here.
          }

          return pos;
      });

      if (updates) {
          console.log('[CandleStrikeBot] Updating Positions:', logUpdates);
          onUpdatePositions(updatedPositions);
      }
  }, [realtimePrices, positions, onUpdatePositions]);


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
    if (selectedItems.size > 0) setItemsToDelete(Array.from(selectedItems));
    else setItemsToDelete(filteredPositions.map(p => p.id));
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    const updatedPositions = positions.filter(p => !itemsToDelete.includes(p.id));
    if (onUpdatePositions) onUpdatePositions(updatedPositions);
    
    // Also update localStorage explicitly to ensure persistence of deletion
    localStorage.setItem('activeCandleStrikeBots', JSON.stringify(updatedPositions));
    
    setSelectedItems(new Set());
    setItemsToDelete([]);
    toast({
      title: "Deleted successfully",
      description: `${itemsToDelete.length} strike bot(s) removed.`,
      className: "bg-green-500 border-green-600 text-white"
    });
  };

  const handleClosePosition = (e, position) => {
    e.stopPropagation();
    toast({ title: "Stopping Bot", description: `Stopping Candle Strike bot for ${position.symbol}...` });
    const updated = positions.map(p => p.id === position.id ? { ...p, status: 'CLOSED' } : p);
    if (onUpdatePositions) onUpdatePositions(updated);
  };

  const handleEditBot = (e, position) => {
    e.stopPropagation();
    if (onEditPosition) onEditPosition(position);
  };

  const handlePayPlay = (e, position) => {
    e.stopPropagation();
    const updated = positions.map(p => p.id === position.id ? { ...p, status: 'ACTIVE' } : p);
    if (onUpdatePositions) onUpdatePositions(updated);
    toast({ title: "Activated", description: `Triggered manual execution for ${position.symbol}. Entry price will be locked at next price update.` });
  };

  const allSelected = filteredPositions.length > 0 && selectedItems.size === filteredPositions.length;

  const getDirectionInfo = (direction) => {
      if (direction === 'Long Only' || direction === 'Green Candles') return { label: 'Green Candles', color: 'text-emerald-400', isGreen: true };
      if (direction === 'Short Only' || direction === 'Red Candles') return { label: 'Red Candles', color: 'text-red-400', isGreen: false };
      return { label: direction, color: 'text-gray-400', isGreen: true };
  };

  const calculateProgress = (pos) => {
      const target = pos.consecutiveCandles || 3;
      const green = pos.currentGreenStreak || 0;
      const red = pos.currentRedStreak || 0;
      const direction = pos.direction;
      
      let displayCount = 0;
      let isGreenTracking = false;

      if (direction === 'Green Candles' || direction === 'Long Only') {
          displayCount = green;
          isGreenTracking = true;
      } else if (direction === 'Red Candles' || direction === 'Short Only') {
          displayCount = red;
          isGreenTracking = false;
      } else {
          if (green > red) { displayCount = green; isGreenTracking = true; } 
          else { displayCount = red; isGreenTracking = false; }
      }
      return { displayCount, target, isGreenTracking };
  };

  const formatCurrency = (val) => {
      if (val === undefined || val === null || val === 0 || val === '0') return '-';
      return `$${parseFloat(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <>
      <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] overflow-hidden flex flex-col h-full shadow-lg">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-[#2a2a2a] flex justify-between items-center bg-[#151515]">
          <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.6)]"></span>
              <h3 className="text-lg font-bold text-white uppercase tracking-wide flex items-center gap-2">
                Candle Strike Bots
                <span className="text-[10px] bg-[#2a2a2a] text-gray-400 px-2 py-0.5 rounded-full border border-[#333]">
                    {filteredPositions.length}
                </span>
              </h3>
              {!wsConnected && filteredPositions.length > 0 && (
                  <span className="flex items-center gap-1 text-[10px] text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">
                      <AlertTriangle size={10} /> Connecting feed...
                  </span>
              )}
          </div>
          <div className="flex items-center gap-2">
            <button
                onClick={handleBulkDeleteClick}
                disabled={filteredPositions.length === 0}
                className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                filteredPositions.length === 0 
                    ? "text-gray-600 bg-[#222] cursor-not-allowed" 
                    : "text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20"
                )}
            >
                <Trash2 size={14} />
                <span className="hidden sm:inline">{selectedItems.size > 0 ? `Delete (${selectedItems.size})` : 'Delete All'}</span>
            </button>
            <button className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors text-gray-400 hover:text-white">
                <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead className="bg-[#0f0f0f] text-xs uppercase text-gray-500 font-bold tracking-wider sticky top-0 z-10">
              <tr>
                <th className="px-4 py-4 w-[50px] text-center">
                  <button onClick={toggleSelectAll} className="hover:text-white transition-colors">
                    {allSelected ? <CheckSquare size={16} className="text-pink-500" /> : <Square size={16} />}
                  </button>
                </th>
                <th className="px-4 py-4">Symbol / Strategy</th>
                <th className="px-4 py-4">Timeframe & Logic</th>
                <th className="px-4 py-4">Candle Progress</th>
                <th className="px-4 py-4">Position</th>
                <th className="px-4 py-4">Entry / Current</th>
                <th className="px-4 py-4">Prices (TP/SL)</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">PnL</th>
                <th className="px-4 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2a2a]">
              <AnimatePresence>
                {filteredPositions.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="px-6 py-20 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-3">
                          <Activity size={32} className="opacity-20" />
                          <p>No active bots found.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPositions.map((pos) => {
                    const isSelected = selectedItems.has(pos.id);
                    const { displayCount, target, isGreenTracking } = calculateProgress(pos);
                    const directionInfo = getDirectionInfo(pos.direction);
                    const isTriggered = pos.status === 'ACTIVE' || displayCount >= target;
                    
                    const livePrice = realtimePrices[pos.symbol];
                    const entryPrice = parseFloat(pos.entryPrice || 0);
                    const currentPrice = livePrice || parseFloat(pos.currentPrice || entryPrice);

                    const takeProfit = parseFloat(pos.takeProfit || 0);
                    const stopLoss = parseFloat(pos.stopLoss || 0);

                    // --- ROBUST DATA EXTRACTION: Margin & Leverage ---
                    let rawMargin = pos.margin ?? pos.investment ?? pos.initialMargin ?? pos.amount;
                    let rawLeverage = pos.leverage;

                    if ((!rawMargin || !rawLeverage) && pos.botId) {
                        const template = templateMap[pos.botId];
                        if (template) {
                            if (!rawMargin) {
                                rawMargin = template.investment ?? template.margin ?? template.amount ?? template.initialMargin;
                            }
                            if (!rawLeverage) {
                                rawLeverage = template.leverage;
                            }
                        }
                    }
                    
                    const margin = parseFloat(rawMargin || 0);
                    const leverage = parseFloat(rawLeverage || 1);
                    // -------------------------------------------------

                    const positionType = directionInfo.isGreen ? 'LONG' : 'SHORT';
                    
                    let pnl = 0;
                    let pnlPercent = 0;
                    let hasPnlData = false;

                    if (pos.status === 'ACTIVE' && entryPrice > 0 && currentPrice > 0) {
                         const priceChangePct = (currentPrice - entryPrice) / entryPrice;
                         const sideMultiplier = directionInfo.isGreen ? 1 : -1;
                         pnlPercent = priceChangePct * sideMultiplier * leverage * 100;
                         // PnL calculated based on the Margin
                         pnl = (pnlPercent / 100) * margin;
                         hasPnlData = true;
                    } else if (pos.unrealizedPnl) {
                        // Fallback to stored PnL if real-time calculation not possible yet
                        pnl = parseFloat(pos.unrealizedPnl);
                        pnlPercent = parseFloat(pos.pnlPercentage || 0);
                        hasPnlData = true;
                    }

                    let currentPriceColor = "text-white";
                    let pnlColor = "text-gray-400";
                    
                    if (hasPnlData) {
                        if (pnl > 0) {
                            currentPriceColor = "text-emerald-400";
                            pnlColor = "text-emerald-400";
                        } else if (pnl < 0) {
                            currentPriceColor = "text-red-400";
                            pnlColor = "text-red-400";
                        }
                    }

                    return (
                      <motion.tr
                        key={pos.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={cn("group hover:bg-[#1f1f1f] transition-colors", isSelected && "bg-[#252525]")}
                      >
                        <td className="px-4 py-4 text-center">
                          <button onClick={() => toggleSelect(pos.id)} className="text-gray-500 hover:text-white">
                             {isSelected ? <CheckSquare size={16} className="text-pink-500" /> : <Square size={16} />}
                          </button>
                        </td>

                        <td className="px-4 py-4">
                           <div className="flex flex-col gap-1.5">
                               <span className="text-sm font-bold text-white leading-none">{pos.symbol}</span>
                               <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-pink-500/10 text-pink-500 border border-pink-500/20 w-fit tracking-wider">
                                   <Flame size={8} className="mr-1" /> STRIKE
                               </span>
                           </div>
                        </td>

                        <td className="px-4 py-4">
                           <div className="flex flex-col gap-1">
                               <span className="text-sm font-bold text-white">{pos.timeframe}</span>
                               <span className={cn("text-[10px] font-medium uppercase", directionInfo.color)}>
                                   {directionInfo.label}
                               </span>
                           </div>
                        </td>

                        <td className="px-4 py-4">
                           <div className="flex flex-col gap-1.5 w-[100px]">
                               <div className="flex justify-between items-center text-[10px] font-mono font-bold">
                                   <span className="text-gray-300">{displayCount}/{target}</span>
                                   <span className={cn(isGreenTracking ? "text-emerald-400" : "text-red-400")}>
                                       {Math.round((displayCount/target)*100)}%
                                   </span>
                               </div>
                               <div className="h-1.5 w-full bg-[#2a2a2a] rounded-full overflow-hidden">
                                   <div 
                                       className={cn("h-full transition-all duration-300", isGreenTracking ? "bg-emerald-500" : "bg-red-500")}
                                       style={{ width: `${Math.min((displayCount/target)*100, 100)}%` }}
                                   />
                               </div>
                           </div>
                        </td>

                        <td className="px-4 py-4">
                           <div className="flex flex-col gap-1">
                               <span className="text-xs text-gray-400 whitespace-nowrap">
                                   Margin: <span className="text-white font-medium">
                                     {margin > 0 ? `$${margin.toLocaleString()}` : '-'}
                                   </span>
                               </span>
                               <span className={cn(
                                   "text-[10px] font-bold uppercase",
                                   positionType === 'LONG' ? "text-emerald-400" : "text-red-400"
                               )}>
                                   {positionType} {leverage}x
                               </span>
                           </div>
                        </td>

                        <td className="px-4 py-4">
                           <div className="flex flex-col gap-1 text-xs">
                               <div className="whitespace-nowrap flex items-center gap-1">
                                   <span className="text-gray-500 w-[35px]">Entry:</span>
                                   <span className="text-white font-mono">
                                       {formatCurrency(entryPrice)}
                                   </span>
                               </div>
                               <div className="whitespace-nowrap flex items-center gap-1">
                                   <span className="text-gray-500 w-[35px]">Curr:</span>
                                   <span className={cn("font-mono font-bold", currentPriceColor)}>
                                       {formatCurrency(currentPrice)}
                                   </span>
                               </div>
                           </div>
                        </td>

                        <td className="px-4 py-4">
                           <div className="flex flex-col gap-1 text-xs font-mono text-gray-500">
                               <span className="whitespace-nowrap">TP: {formatCurrency(takeProfit)}</span>
                               <span className="whitespace-nowrap">SL: {formatCurrency(stopLoss)}</span>
                           </div>
                        </td>

                        <td className="px-4 py-4">
                            {isTriggered ? (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wide">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.8)]"></span>
                                    Active
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 uppercase tracking-wide">
                                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span>
                                    Waiting
                                </span>
                            )}
                        </td>

                        <td className="px-4 py-4">
                           <div className="flex flex-col">
                               <span className={cn(
                                   "text-sm font-bold font-mono",
                                   pnlColor
                               )}>
                                   {hasPnlData ? (pnl > 0 ? `+${pnl.toFixed(2)}` : pnl.toFixed(2)) : '-'}
                               </span>
                               <span className={cn("text-[10px] font-medium mt-0.5", pnlColor)}>
                                   {hasPnlData ? (pnlPercent > 0 ? `+${pnlPercent.toFixed(2)}%` : `${pnlPercent.toFixed(2)}%`) : '-'}
                               </span>
                           </div>
                        </td>

                        <td className="px-4 py-4 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={(e) => handlePayPlay(e, pos)}
                                    className="p-1.5 text-gray-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-md transition-all"
                                    title="Start/Resume"
                                >
                                    <PlayCircle size={14} />
                                </button>
                                <button 
                                    onClick={(e) => handleEditBot(e, pos)}
                                    className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-md transition-all"
                                    title="Edit"
                                >
                                    <Edit size={14} />
                                </button>
                                <button 
                                    onClick={(e) => handleClosePosition(e, pos)}
                                    className="p-1.5 text-gray-400 hover:text-orange-400 hover:bg-orange-400/10 rounded-md transition-all"
                                    title="Stop"
                                >
                                    <Ban size={14} />
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleDeleteClick(pos.id); }}
                                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-all"
                                    title="Delete"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </td>

                      </motion.tr>
                    );
                  })
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
      
      <DeleteConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        itemType="bots"
        count={itemsToDelete.length}
      />
    </>
  );
};

export default ActiveCandleStrikeBots;
