
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { MoreVertical, Trash2, XCircle, Clock, ArrowUpRight, ArrowDownRight, CheckSquare, Square, Zap, Grid, Layers, Flame, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DeleteConfirmationModal from './DeleteConfirmationModal';
import PositionStatusBadge from './PositionStatusBadge';
import { useToast } from '@/components/ui/use-toast';
import { getAllBotTemplates } from '@/utils/botTemplateDataManager';

const TradesTable = ({ trades = [], onAction }) => {
  const { toast } = useToast();
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState([]);
  const [botTemplates, setBotTemplates] = useState({});

  // Fetch templates once or when trades list changes significantly
  useEffect(() => {
    const templates = getAllBotTemplates();
    setBotTemplates(templates);
  }, [trades.length]); // Refresh templates if number of trades changes (likely new bot added)

  const toggleSelectAll = () => {
    if (selectedItems.size === trades.length && trades.length > 0) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(trades.map(t => t.id)));
    }
  };

  const toggleSelect = (id) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const handleDeleteClick = (id) => {
    setItemsToDelete([id]);
    setIsDeleteModalOpen(true);
  };

  const handleBulkDeleteClick = () => {
    if (selectedItems.size > 0) {
      setItemsToDelete(Array.from(selectedItems));
    } else {
      setItemsToDelete(trades.map(t => t.id));
    }
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (onAction) {
        onAction('bulk_delete', itemsToDelete);
    }
    
    setSelectedItems(new Set());
    setItemsToDelete([]);
  };

  const allSelected = trades.length > 0 && selectedItems.size === trades.length;

  const getBotIcon = (type, isBotTrade) => {
      // Prioritize explicit flags
      if (type === 'RSI_BOT') return <Activity size={16} className="text-amber-500" />;
      if (type === 'STRIKE' || type === 'Candle Strike') return <Flame size={16} className="text-orange-500 fill-orange-500/20" />;
      if (isBotTrade) return <Zap size={16} className="text-blue-400" />;
      
      if (type && type.includes('Grid')) return <Grid size={16} className="text-blue-400" />;
      if (type && type.includes('DCA')) return <Layers size={16} className="text-purple-400" />;
      if (type && (type.includes('Price') || type.includes('Momentum'))) return <Zap size={16} className="text-yellow-400" />;
      return <Zap size={16} className="text-gray-400" />;
  };

  if (!trades || trades.length === 0) {
    return (
      <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-12 flex flex-col items-center justify-center text-center shadow-lg">
         <div className="w-16 h-16 bg-[#252525] rounded-full flex items-center justify-center mb-4 border border-[#333]">
             <Zap className="text-gray-600" size={32} />
         </div>
         <h3 className="text-xl font-bold text-white mb-2">No active positions</h3>
         <p className="text-gray-400 max-w-sm text-sm">
           Active positions from all your bots (Grid, DCA, RSI, Candle Strike) will appear here automatically.
         </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] overflow-hidden shadow-lg flex flex-col min-h-[500px]">
        <div className="p-4 border-b border-[#2a2a2a] flex justify-between items-center bg-[#1a1a1a] sticky top-0 z-20">
            <div className="flex items-center gap-3">
                <h3 className="text-white font-bold uppercase text-xs tracking-wide">Unified Positions</h3>
                <span className="bg-[#252525] text-gray-400 px-2 py-0.5 rounded text-[10px] font-mono border border-[#333]">
                    {trades.length} Total
                </span>
            </div>
            <button
                onClick={handleBulkDeleteClick}
                className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                selectedItems.size === 0 
                    ? "hidden" 
                    : "text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20"
                )}
            >
                <Trash2 size={14} />
                Delete Selected ({selectedItems.size})
            </button>
        </div>
        <div className="overflow-x-auto custom-scrollbar flex-1 bg-[#0f0f0f]">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead className="bg-[#111] text-xs uppercase text-gray-500 font-bold tracking-wider border-b border-[#2a2a2a] sticky top-0 z-10">
              <tr>
                <th className="px-4 py-4 w-[50px] text-center bg-[#111]">
                  <button onClick={toggleSelectAll} className="hover:text-white transition-colors">
                    {allSelected ? <CheckSquare size={16} className="text-blue-500" /> : <Square size={16} />}
                  </button>
                </th>
                <th className="px-6 py-4 bg-[#111]">Bot / Strategy</th>
                <th className="px-6 py-4 bg-[#111]">Symbol</th>
                <th className="px-6 py-4 bg-[#111]">Status</th>
                <th className="px-6 py-4 bg-[#111]">Prices (Entry/Mark)</th>
                <th className="px-6 py-4 bg-[#111]">Size / Margin</th>
                <th className="px-6 py-4 bg-[#111]">PnL</th>
                <th className="px-6 py-4 bg-[#111] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f1f1f]">
              {trades.map((trade) => {
                const isLong = trade.direction?.toUpperCase() === 'LONG';
                const pnlValue = parseFloat(trade.pnl || 0);
                const pnlPercent = parseFloat(trade.pnlPercent || 0);
                const pnlColor = pnlValue >= 0 ? 'text-green-400' : 'text-red-400';
                const pnlBg = pnlValue >= 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20';
                const isSelected = selectedItems.has(trade.id);
                
                const isStrikeBot = trade.botType === 'STRIKE' || trade.botType === 'Candle Strike';
                const isRsiBot = trade.botType === 'RSI_BOT';
                const isBotTrade = isStrikeBot || isRsiBot;

                const entryPrice = parseFloat(trade.entryPrice || 0);
                const currentPrice = parseFloat(trade.currentPrice || entryPrice);

                // Template Lookup logic
                const template = botTemplates[trade.botId || trade.id];
                
                // Prioritize template data, fallback to trade data
                const margin = template 
                    ? parseFloat(template.margin || template.investment || template.amount || 0) 
                    : parseFloat(trade.amount || 0);
                    
                const leverage = template 
                    ? parseFloat(template.leverage || 1) 
                    : parseFloat(trade.leverage || 1);
                
                return (
                  <motion.tr
                    key={trade.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={cn(
                      "hover:bg-[#181818] transition-colors group", 
                      isSelected && "bg-[#1c1c1c]",
                      isStrikeBot && !isSelected && "hover:bg-orange-500/5",
                      isRsiBot && !isSelected && "hover:bg-amber-500/5"
                    )}
                  >
                    <td className="px-4 py-4 text-center">
                        <button onClick={() => toggleSelect(trade.id)} className="text-gray-500 hover:text-white">
                            {isSelected ? <CheckSquare size={16} className="text-blue-500" /> : <Square size={16} />}
                        </button>
                    </td>
                    
                    {/* Bot Type */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                         <div className={cn(
                           "w-8 h-8 rounded-lg border flex items-center justify-center transition-colors",
                           isStrikeBot ? "bg-orange-500/10 border-orange-500/20" : 
                           isRsiBot ? "bg-amber-500/10 border-amber-500/20" :
                           "bg-[#252525] border-[#333]"
                         )}>
                            {getBotIcon(trade.botType, isBotTrade)}
                         </div>
                         <div>
                            <div className="flex items-center gap-2">
                                <span className={cn(
                                    "font-bold text-sm", 
                                    isStrikeBot ? "text-orange-400" : 
                                    isRsiBot ? "text-amber-400" :
                                    "text-white"
                                )}>
                                    {trade.botType === 'RSI_BOT' ? 'RSI Bot' : trade.botType}
                                </span>
                                {isStrikeBot && (
                                  <span className="text-[9px] bg-orange-500 text-black px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                    Strike
                                  </span>
                                )}
                                {isRsiBot && (
                                  <span className="text-[9px] bg-amber-500 text-black px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                    RSI
                                  </span>
                                )}
                            </div>
                            <div className="text-[10px] text-gray-500 flex items-center gap-1">
                                <Clock size={10} />
                                {trade.timeActivated ? format(new Date(trade.timeActivated), 'MMM dd HH:mm') : 'Just now'}
                            </div>
                         </div>
                      </div>
                    </td>

                    {/* Symbol */}
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                             <div className={cn("p-1 rounded bg-[#252525]", isLong ? "text-green-500" : "text-red-500")}>
                                {isLong ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                             </div>
                             <div>
                                 <div className="font-bold text-white text-sm">
                                     {trade.symbol}
                                 </div>
                                 <div className={cn("text-[10px] font-bold uppercase", isLong ? "text-green-500" : "text-red-500")}>
                                     {trade.direction} {leverage > 1 && <span className="text-gray-500 font-mono">x{leverage}</span>}
                                 </div>
                             </div>
                        </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                       <PositionStatusBadge status={trade.status} />
                    </td>

                    {/* Prices */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex justify-between w-32 text-xs">
                           <span className="text-gray-500 w-[40px]">Entry</span>
                           <span className="font-mono text-gray-300">
                               {entryPrice > 0 ? `$${entryPrice.toLocaleString()}` : '---'}
                           </span>
                        </div>
                        <div className="flex justify-between w-32 text-xs">
                           <span className="text-gray-500 w-[40px]">Current</span>
                           <span className={cn(
                               "font-mono font-bold", 
                               isBotTrade ? "text-orange-300" : (currentPrice > entryPrice ? "text-green-400" : "text-red-400")
                           )}>
                               ${currentPrice.toLocaleString()}
                           </span>
                        </div>
                      </div>
                    </td>

                    {/* Size / Margin (Template Data) */}
                    <td className="px-6 py-4">
                       <div className="space-y-1">
                           <div className="text-sm text-white font-bold font-mono">
                               {margin > 0 ? `$${margin.toLocaleString()}` : '-'}
                           </div>
                           <div className="text-[10px] text-gray-500">Margin</div>
                       </div>
                    </td>

                    {/* PnL */}
                    <td className="px-6 py-4">
                       <div className={cn("font-mono font-medium rounded px-2.5 py-1.5 w-fit border min-w-[100px]", pnlBg)}>
                          <div className={cn("text-sm font-bold flex items-center justify-between", pnlColor)}>
                             <span>{pnlValue >= 0 ? '+' : ''}{pnlValue.toFixed(2)}</span>
                             <span className="text-[10px] opacity-75">USDT</span>
                          </div>
                          <div className={cn("text-xs font-bold mt-0.5", pnlColor)}>
                              {pnlPercent.toFixed(2)}%
                          </div>
                       </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                       <div className="flex justify-end gap-1">
                         <button
                            onClick={() => onAction && onAction('close', trade)}
                            className="p-2 text-gray-400 hover:text-white hover:bg-[#333] rounded-lg transition-colors"
                            title="Force Close / Stop"
                         >
                            <XCircle size={18} />
                         </button>
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="p-2 text-gray-400 hover:text-white hover:bg-[#333] rounded-lg transition-colors">
                                    <MoreVertical size={18} />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-[#1a1a1a] border-[#333] text-white w-48" align="end">
                              <DropdownMenuLabel>Position Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator className="bg-[#333]" />
                              <DropdownMenuItem onClick={() => onAction && onAction('close', trade)} className="cursor-pointer hover:bg-[#252525] focus:bg-[#252525] text-yellow-500">
                                 <XCircle className="mr-2 h-4 w-4" /> Close Position
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-[#333]" />
                              <DropdownMenuItem onClick={() => handleDeleteClick(trade.id)} className="cursor-pointer hover:bg-red-500/10 focus:bg-red-500/10 text-red-400">
                                 <Trash2 className="mr-2 h-4 w-4" /> Delete Record
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                       </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <DeleteConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        itemType="positions"
        count={itemsToDelete.length}
      />
    </>
  );
};

export default TradesTable;
