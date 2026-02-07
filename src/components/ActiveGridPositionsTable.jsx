
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit, XCircle, RefreshCw, PlayCircle, Trash2, CheckSquare, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import DeleteConfirmationModal from './DeleteConfirmationModal';

const ActiveGridPositionsTable = ({ positions = [], onPositionSelect, filterMode, onUpdatePositions, onEditPosition }) => {
  const { toast } = useToast();
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState([]);

  let filteredPositions = positions || [];
  if (filterMode) {
      if (filterMode === 'active') {
          filteredPositions = filteredPositions.filter(p => p.status === 'ACTIVE');
      } else if (filterMode === 'pending') {
          filteredPositions = filteredPositions.filter(p => p.status === 'PENDING');
      } else if (filterMode === 'profit') {
          filteredPositions = filteredPositions.filter(p => (p.unrealizedPnl || 0) > 0);
      } else if (filterMode === 'loss') {
          filteredPositions = filteredPositions.filter(p => (p.unrealizedPnl || 0) < 0);
      }
  }

  const toggleSelectAll = () => {
    if (selectedItems.size === filteredPositions.length && filteredPositions.length > 0) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredPositions.map(p => p.id)));
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
      setItemsToDelete(filteredPositions.map(p => p.id));
    }
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    // We filter from original 'positions', not 'filteredPositions' to maintain integrity of hidden items
    const updatedPositions = positions.filter(p => !itemsToDelete.includes(p.id));
    
    if (onUpdatePositions) {
        onUpdatePositions(updatedPositions);
    }
    
    // Safety fallback for immediate persistence if parent doesn't handle it
    localStorage.setItem('gridPositions', JSON.stringify(updatedPositions));

    setSelectedItems(new Set());
    setItemsToDelete([]);
    
    toast({
      title: "Deleted successfully",
      description: `${itemsToDelete.length} grid bot(s) removed.`,
      className: "bg-green-500 border-green-600 text-white"
    });
  };

  const handleClosePosition = (e, position) => {
    e.stopPropagation();
    toast({
      title: "Stopping Grid Bot",
      description: `Stopping grid bot for ${position.symbol}...`
    });
    if (onUpdatePositions) {
        // Change status to CLOSED/STOPPED rather than deleting from list immediately
        const updated = positions.map(p => p.id === position.id ? { ...p, status: 'STOPPED' } : p);
        onUpdatePositions(updated);
    }
  };

  const handleEditBot = (e, position) => {
    e.stopPropagation();
    if (onEditPosition) onEditPosition(position);
  };

  const handlePayPlay = (e, position) => {
    e.stopPropagation();
    toast({ title: "Pay/Play Action", description: `Triggered manual execution for ${position.symbol}.` });
  };

  const allSelected = filteredPositions.length > 0 && selectedItems.size === filteredPositions.length;

  return (
    <>
      <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] overflow-hidden flex flex-col h-full shadow-lg">
        <div className="p-4 sm:p-6 border-b border-[#2a2a2a] flex justify-between items-center">
          <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <h3 className="text-lg font-bold text-white uppercase tracking-wide">Active Grid Positions</h3>
              <span className="px-2 py-0.5 bg-[#2a2a2a] rounded-md text-xs font-mono text-gray-400 border border-[#3a3a3a]">
                  Total: {filteredPositions.length}
              </span>
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
                <th className="px-6 py-4">Symbol / Type</th>
                <th className="px-6 py-4">Range & Grids</th>
                <th className="px-6 py-4">Prices</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Progress / Profit</th>
                <th className="px-6 py-4">Total PnL</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2a2a]">
              {filteredPositions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500 text-sm">
                    No items to display.
                  </td>
                </tr>
              ) : (
                filteredPositions.map((pos) => {
                  const isSelected = selectedItems.has(pos.id);
                  
                  // Defensive checks for numeric values
                  const currentPrice = pos.currentPrice ?? 0;
                  const lowerPrice = pos.lowerPrice ?? 0;
                  const upperPrice = pos.upperPrice ?? 0;
                  const gridProfit = pos.gridProfit ?? 0;
                  const unrealizedPnl = pos.unrealizedPnl ?? 0;
                  const pnlPercentage = pos.pnlPercentage ?? 0;
                  
                  const inRange = currentPrice > lowerPrice && currentPrice < upperPrice;

                  return (
                    <motion.tr
                      key={pos.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => onPositionSelect && onPositionSelect(pos)}
                      className={cn("group hover:bg-[#202020] transition-colors cursor-pointer", isSelected && "bg-[#202020]")}
                    >
                      <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => toggleSelect(pos.id)} className="text-gray-500 hover:text-white">
                            {isSelected ? <CheckSquare size={16} className="text-blue-500" /> : <Square size={16} />}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                            <span className="text-base font-bold text-white">{pos.symbol}</span>
                            <div className="flex flex-col items-center px-2 py-0.5 rounded border text-[10px] font-bold leading-tight min-w-[40px] bg-blue-500/10 text-blue-400 border-blue-500/20">
                                <span>{pos.gridType?.toUpperCase() || 'SPOT'}</span>
                            </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                            <div className="text-sm font-bold text-white">{pos.numGrids || 0} Grids</div>
                            <div className="text-xs text-gray-500">{lowerPrice} - {upperPrice}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="grid grid-cols-[40px_1fr] gap-x-2 text-xs font-mono">
                            <span className="text-gray-500">Last:</span>
                            <span className="text-white font-bold">${currentPrice.toLocaleString()}</span>
                            <span className="text-gray-500">Range:</span>
                            <span className="text-gray-400">{inRange ? 'In Range' : 'Out of Range'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                            "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border",
                            pos.status === 'ACTIVE' 
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                                : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                        )}>
                            <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5", pos.status === 'ACTIVE' ? "bg-emerald-400" : "bg-yellow-400")}></span>
                            {pos.status || 'UNKNOWN'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-full max-w-[120px]">
                          <div className="text-xs font-bold text-green-400 mb-1">+{gridProfit} USDT</div>
                          <div className="text-[10px] text-gray-400">Grid Profit</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={cn(
                            "font-mono font-medium text-sm",
                            unrealizedPnl >= 0 ? "text-green-400" : "text-red-400"
                        )}>
                            <div className="font-bold">{unrealizedPnl >= 0 ? '+' : ''}{unrealizedPnl.toFixed(2)}</div>
                            <div className="text-xs opacity-80">{pnlPercentage.toFixed(2)}%</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={(e) => handlePayPlay(e, pos)}
                                className="p-1.5 text-green-400 hover:bg-green-500/10 rounded transition-colors"
                                title="Pay/Play"
                            >
                                <PlayCircle size={16} />
                            </button>
                            <button 
                                onClick={(e) => handleEditBot(e, pos)}
                                className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                                title="Edit Bot"
                            >
                                <Edit size={16} />
                            </button>
                            <button 
                                onClick={(e) => handleClosePosition(e, pos)}
                                className="p-1.5 text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                title="Stop Bot"
                            >
                                <XCircle size={16} />
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteClick(pos.id); }}
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
        itemType="grid positions"
        count={itemsToDelete.length}
      />
    </>
  );
};

export default ActiveGridPositionsTable;
