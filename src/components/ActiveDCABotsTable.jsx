
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit, XCircle, RefreshCw, PlayCircle, Trash2, CheckSquare, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import DeleteConfirmationModal from './DeleteConfirmationModal';

const ActiveDCABotsTable = ({ bots = [], onBotSelect, filterMode, onUpdateBots, onEditBot }) => {
  const { toast } = useToast();
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState([]);

  let filteredBots = bots || [];
  if (filterMode) {
      if (filterMode === 'active') {
          filteredBots = filteredBots.filter(b => b.status === 'ACTIVE');
      } else if (filterMode === 'pending') {
          filteredBots = filteredBots.filter(b => b.status !== 'ACTIVE');
      } else if (filterMode === 'profit') {
          filteredBots = filteredBots.filter(b => b.pnl > 0);
      } else if (filterMode === 'loss') {
          filteredBots = filteredBots.filter(b => b.pnl < 0);
      }
  }

  const toggleSelectAll = () => {
    if (selectedItems.size === filteredBots.length && filteredBots.length > 0) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredBots.map(b => b.id)));
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
      setItemsToDelete(filteredBots.map(b => b.id));
    }
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    const updatedBots = bots.filter(b => !itemsToDelete.includes(b.id));
    
    if (onUpdateBots) {
        onUpdateBots(updatedBots);
    }

    localStorage.setItem('dcaBots', JSON.stringify(updatedBots));

    setSelectedItems(new Set());
    setItemsToDelete([]);
    
    toast({
      title: "Deleted successfully",
      description: `${itemsToDelete.length} DCA bot(s) removed.`,
      className: "bg-green-500 border-green-600 text-white"
    });
  };

  const handleStopBot = (e, bot) => {
    e.stopPropagation();
    toast({
      title: "Stopping DCA Bot",
      description: `Stopping DCA bot for ${bot.symbol}...`
    });
    if (onUpdateBots) {
        const updated = bots.map(b => b.id === bot.id ? { ...b, status: 'STOPPED' } : b);
        onUpdateBots(updated);
    }
  };

  const handleEditBot = (e, bot) => {
    e.stopPropagation();
    if (onEditBot) onEditBot(bot);
  };

  const handlePayPlay = (e, bot) => {
    e.stopPropagation();
    toast({ title: "Pay/Play Action", description: `Triggered manual execution for ${bot.symbol}.` });
  };

  const allSelected = filteredBots.length > 0 && selectedItems.size === filteredBots.length;
  
  return (
    <>
      <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] overflow-hidden flex flex-col h-full shadow-lg">
        <div className="p-4 sm:p-6 border-b border-[#2a2a2a] flex justify-between items-center">
          <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              <h3 className="text-lg font-bold text-white uppercase tracking-wide">Active DCA Bots</h3>
              <span className="px-2 py-0.5 bg-[#2a2a2a] rounded-md text-xs font-mono text-gray-400 border border-[#3a3a3a]">
                  Total: {filteredBots.length}
              </span>
          </div>
          <div className="flex items-center gap-2">
            <button
                onClick={handleBulkDeleteClick}
                disabled={filteredBots.length === 0}
                className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                filteredBots.length === 0 
                    ? "text-gray-600 bg-[#222] cursor-not-allowed" 
                    : "text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20"
                )}
            >
                <Trash2 size={14} />
                {selectedItems.size > 0 ? `Delete Selected (${selectedItems.size})` : 'Delete All'}
            </button>
            <button className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors text-gray-400 hover:text-white">
                <RefreshCw size={16} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#0f0f0f] text-xs uppercase text-gray-400 sticky top-0 z-10 font-bold tracking-wider">
              <tr>
                <th className="px-4 py-4 w-[50px] text-center">
                  <button onClick={toggleSelectAll} className="hover:text-white transition-colors">
                    {allSelected ? <CheckSquare size={16} className="text-blue-500" /> : <Square size={16} />}
                  </button>
                </th>
                <th className="px-6 py-4">Symbol / Mode</th>
                <th className="px-6 py-4">Orders (Exec/Max)</th>
                <th className="px-6 py-4">Prices</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Total Invested</th>
                <th className="px-6 py-4">Total PnL</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2a2a]">
              {filteredBots.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500 text-sm">
                    No items to display.
                  </td>
                </tr>
              ) : (
                filteredBots.map((bot) => {
                  const isSelected = selectedItems.has(bot.id);
                  return (
                    <motion.tr
                      key={bot.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => onBotSelect && onBotSelect(bot)}
                      className={cn("group hover:bg-[#202020] transition-colors cursor-pointer", isSelected && "bg-[#202020]")}
                    >
                      <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => toggleSelect(bot.id)} className="text-gray-500 hover:text-white">
                            {isSelected ? <CheckSquare size={16} className="text-blue-500" /> : <Square size={16} />}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                            <span className="text-base font-bold text-white">{bot.symbol}</span>
                            <div className="flex flex-col items-center px-2 py-0.5 rounded border text-[10px] font-bold leading-tight min-w-[40px] bg-purple-500/10 text-purple-400 border-purple-500/20">
                                <span>{bot.mode?.toUpperCase() || 'AUTO'}</span>
                            </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                            <div className="text-sm font-bold text-white">{bot.ordersExecuted} / {bot.maxOrders}</div>
                            <div className="w-20 h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-purple-500 rounded-full" 
                                    style={{ width: `${(bot.ordersExecuted / bot.maxOrders) * 100}%` }}
                                />
                            </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="grid grid-cols-[40px_1fr] gap-x-2 text-xs font-mono">
                            <span className="text-gray-500">Avg:</span>
                            <span className="text-white font-bold">${bot.avgPrice?.toLocaleString() || '---'}</span>
                            <span className="text-gray-500">Curr:</span>
                            <span className={cn(
                                bot.currentPrice > bot.avgPrice ? "text-green-400" : "text-red-400"
                            )}>${bot.currentPrice?.toLocaleString() || '---'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                            "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border",
                            bot.status === 'ACTIVE' 
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                                : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                        )}>
                            <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5", bot.status === 'ACTIVE' ? "bg-emerald-400" : "bg-yellow-400")}></span>
                            {bot.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-white">${bot.totalInvested?.toLocaleString()}</div>
                        <div className="text-[10px] text-gray-500">Total Volume</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={cn(
                            "font-mono font-medium text-sm",
                            bot.pnl >= 0 ? "text-green-400" : "text-red-400"
                        )}>
                            <div className="font-bold">{bot.pnl >= 0 ? '+' : ''}{bot.pnl.toFixed(2)}</div>
                            <div className="text-xs opacity-80">{bot.pnlPercent?.toFixed(2) || 0}%</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={(e) => handlePayPlay(e, bot)}
                                className="p-1.5 text-green-400 hover:bg-green-500/10 rounded transition-colors"
                                title="Pay/Play"
                            >
                                <PlayCircle size={16} />
                            </button>
                            <button 
                                onClick={(e) => handleEditBot(e, bot)}
                                className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                                title="Edit Bot"
                            >
                                <Edit size={16} />
                            </button>
                            <button 
                                onClick={(e) => handleStopBot(e, bot)}
                                className="p-1.5 text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                title="Stop Bot"
                            >
                                <XCircle size={16} />
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteClick(bot.id); }}
                                className="p-1.5 text-gray-400 hover:bg-gray-700 rounded transition-colors"
                                title="Delete"
                            >
                                <Trash2 size={16} />
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
        itemType="DCA bots"
        count={itemsToDelete.length}
      />
    </>
  );
};

export default ActiveDCABotsTable;
