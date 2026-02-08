
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  XCircle, 
  Trash2, 
  History, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Clock,
  MoreHorizontal,
  CheckSquare,
  Square
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { useToast } from '@/components/ui/use-toast';

const ActivePositionsTablePriceMovement = ({ 
  positions = [], 
  isLoading, 
  onClosePosition, 
  onDeletePosition, 
  onUpdatePositions,
  onViewHistory 
}) => {
  const { toast } = useToast();
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState([]);

  // Clear selection if positions change significantly (optional, keeping it simple)
  useEffect(() => {
    // If items are removed externally, clean up selection
    if (selectedItems.size > 0) {
      const currentIds = new Set(positions.map(p => p.id));
      const validSelection = new Set([...selectedItems].filter(id => currentIds.has(id)));
      if (validSelection.size !== selectedItems.size) {
        setSelectedItems(validSelection);
      }
    }
  }, [positions]);

  const toggleSelectAll = () => {
    if (selectedItems.size === positions.length && positions.length > 0) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(positions.map(p => p.id)));
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
      setItemsToDelete(positions.map(p => p.id));
    }
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    const updatedPositions = positions.filter(p => !itemsToDelete.includes(p.id));
    
    // Update state via prop
    if (onUpdatePositions) {
      onUpdatePositions(updatedPositions);
    } else {
        // Fallback to single delete prop if available (less efficient)
        itemsToDelete.forEach(id => {
            const pos = positions.find(p => p.id === id);
            if (pos && onDeletePosition) onDeletePosition(pos);
        });
    }

    // Update Local Storage
    localStorage.setItem('activePositions', JSON.stringify(updatedPositions));

    // Clear selection
    setSelectedItems(new Set());
    setItemsToDelete([]);
    
    toast({
      title: "Deleted successfully",
      description: `${itemsToDelete.length} position(s) removed.`,
      className: "bg-green-500 border-green-600 text-white"
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'OPEN':
      case 'ACTIVE':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'PENDING':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'CLOSED':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default:
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
  };

  const getProgressColor = (percent) => {
    if (percent >= 100) return 'from-green-500 to-emerald-600';
    if (percent > 50) return 'from-blue-500 to-purple-600';
    return 'from-purple-600 to-blue-600';
  };

  const allSelected = positions.length > 0 && selectedItems.size === positions.length;

  return (
    <>
      <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] overflow-hidden flex flex-col h-full shadow-lg min-h-[400px]">
        <div className="p-6 border-b border-[#2a2a2a] flex justify-between items-center bg-[#1a1a1a] z-10">
          <div className="flex items-center gap-3">
            <Activity className="text-purple-500" size={20} />
            <h3 className="text-lg font-bold text-white uppercase tracking-wide">Active Positions</h3>
            <span className="px-2 py-0.5 bg-[#2a2a2a] rounded text-xs font-mono text-gray-400 border border-[#333]">
              {positions.length} Live
            </span>
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
            {selectedItems.size > 0 ? `Delete Selected (${selectedItems.size})` : 'Delete All'}
          </button>
        </div>

        <div className="overflow-x-auto custom-scrollbar flex-1 bg-[#0a0a0a]">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="bg-[#111] text-[11px] uppercase text-gray-500 sticky top-0 z-10 font-bold tracking-wider border-b border-[#2a2a2a]">
              <tr>
                <th className="px-4 py-4 w-[50px] text-center">
                  <button onClick={toggleSelectAll} className="hover:text-white transition-colors">
                    {allSelected ? <CheckSquare size={16} className="text-blue-500" /> : <Square size={16} />}
                  </button>
                </th>
                <th className="px-6 py-4">Bot / Source</th>
                <th className="px-6 py-4">Position</th>
                <th className="px-6 py-4">Prices</th>
                <th className="px-6 py-4 text-center">TP/SL</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 w-[20%]">Progress</th>
                <th className="px-6 py-4 text-right">Unrealized PnL</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f1f1f]">
              {isLoading ? (
                <tr><td colSpan="8" className="px-6 py-12 text-center text-gray-500">Loading positions...</td></tr>
              ) : positions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#1a1a1a] border border-[#333] flex items-center justify-center text-gray-600">
                        <Clock size={24} />
                      </div>
                      <h4 className="text-gray-300 font-bold">No items to display</h4>
                      <p className="text-gray-500 text-sm max-w-md">
                        Start a new bot to see live positions here.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                positions.map((pos) => {
                  const isProfit = (pos.unrealizedPnl || 0) >= 0;
                  const progress = Math.min(Math.max(pos.progress || 0, 0), 100);
                  const isSelected = selectedItems.has(pos.id);

                  return (
                    <motion.tr
                      key={pos.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={cn("hover:bg-[#151515] transition-colors group", isSelected && "bg-[#151515]")}
                    >
                      <td className="px-4 py-4 text-center">
                         <button onClick={() => toggleSelect(pos.id)} className="text-gray-500 hover:text-white">
                            {isSelected ? <CheckSquare size={16} className="text-blue-500" /> : <Square size={16} />}
                         </button>
                      </td>
                      {/* Bot / Source */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#222] border border-[#333] flex items-center justify-center text-xs font-bold text-gray-400">
                            {pos.symbol.substring(0,3)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm">{pos.symbol}</span>
                              <span className={cn(
                                "text-[10px] px-1.5 rounded font-mono",
                                (pos.priceChangePercent || 0) >= 0 ? "text-green-500 bg-green-500/10" : "text-red-500 bg-red-500/10"
                              )}>
                                {pos.priceChangePercent > 0 ? '+' : ''}{parseFloat(pos.priceChangePercent || 0).toFixed(2)}%
                              </span>
                            </div>
                            <span className="text-[11px] text-gray-500 font-medium">
                              {pos.botName || 'Manual Trade'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Position */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-gray-300 font-medium flex items-center gap-1">
                            Margin: <span className="font-mono text-white">${parseFloat(pos.margin || 0).toFixed(2)}</span>
                          </span>
                          <div className="flex items-center gap-1">
                              <span className={cn(
                                  "text-[10px] px-1.5 py-0.5 rounded border font-bold uppercase",
                                  pos.direction === 'Short' 
                                      ? "text-red-400 border-red-500/20 bg-red-500/10" 
                                      : "text-green-400 border-green-500/20 bg-green-500/10"
                              )}>
                                  {pos.direction || 'Long'}
                              </span>
                              <span className="text-[10px] text-gray-500 font-mono">
                                  {pos.leverage || '1'}x
                              </span>
                          </div>
                        </div>
                      </td>

                      {/* Prices */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 text-xs">
                          <div className="flex justify-between w-32">
                              <span className="text-gray-500">Entry</span>
                              <span className="text-gray-300 font-mono">${parseFloat(pos.entryPrice || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between w-32">
                              <span className="text-gray-500">Mark</span>
                              <span className={cn(
                                  "font-mono font-bold",
                                  (pos.currentPrice > pos.entryPrice) ? "text-green-400" : "text-red-400"
                              )}>
                                  ${parseFloat(pos.currentPrice || 0).toLocaleString()}
                              </span>
                          </div>
                        </div>
                      </td>

                      {/* TP / SL */}
                      <td className="px-6 py-4 text-center">
                        <div className="text-sm font-medium space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className={"text-red-400"}>{pos?.stopLossAmount ?? '-'}</span>
                            /
                            <span className={"text-green-400"}>{pos?.takeProfitAmount ?? '-'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 text-center">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase inline-flex items-center gap-1.5",
                          getStatusColor(pos.status)
                        )}>
                          <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", 
                              pos.status === 'ACTIVE' || pos.status === 'OPEN' ? "bg-green-500" : "bg-yellow-500"
                          )} />
                          {pos.status}
                        </span>
                      </td>

                      {/* Progress */}
                      <td className="px-6 py-4">
                          <div className="w-full">
                              <div className="flex justify-between text-[10px] mb-1.5">
                                  <span className="text-gray-500 font-medium">Target</span>
                                  <span className="text-purple-400 font-mono font-bold">{progress.toFixed(0)}%</span>
                              </div>
                              <div className="h-1.5 w-full bg-[#222] rounded-full overflow-hidden">
                                  <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${progress}%` }}
                                      transition={{ duration: 0.5 }}
                                      className={cn("h-full rounded-full bg-gradient-to-r", getProgressColor(progress))}
                                  />
                              </div>
                          </div>
                      </td>

                      {/* Unrealized PnL */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end">
                              <span className={cn(
                                  "text-sm font-bold font-mono tracking-tight flex items-center gap-1",
                                  isProfit ? "text-green-400" : "text-red-400"
                              )}>
                                  {isProfit ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                  {isProfit ? '+' : ''}{parseFloat(pos.unrealizedPnl || 0).toFixed(2)} USDT
                              </span>
                              <span className={cn(
                                  "text-[10px] px-1.5 py-0.5 rounded border mt-1 font-mono",
                                  isProfit 
                                      ? "bg-green-500/10 border-green-500/20 text-green-400" 
                                      : "bg-red-500/10 border-red-500/20 text-red-400"
                              )}>
                                  {parseFloat(pos.pnlPercentage || 0).toFixed(2)}%
                              </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-2 hover:bg-[#222] rounded-lg text-gray-500 hover:text-white transition-colors">
                                  <MoreHorizontal size={16} />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-[#333] text-gray-200">
                              <DropdownMenuItem onClick={() => onViewHistory(pos)} className="focus:bg-[#222] focus:text-blue-400 cursor-pointer text-xs font-bold gap-2">
                                  <History size={14} /> View History
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onClosePosition(pos)} className="focus:bg-[#222] focus:text-red-400 cursor-pointer text-xs font-bold gap-2 text-red-400">
                                  <XCircle size={14} /> Close Position
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteClick(pos.id)} className="focus:bg-[#222] focus:text-red-400 cursor-pointer text-xs font-bold gap-2 text-gray-500">
                                  <Trash2 size={14} /> Delete Record
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
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
        itemType="positions"
        count={itemsToDelete.length}
      />
    </>
  );
};

export default ActivePositionsTablePriceMovement;
