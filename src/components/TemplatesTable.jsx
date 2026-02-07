
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Edit, Trash2, Play, Search, Wallet, CheckSquare, Square } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { useExchangeAccounts } from '@/context/ExchangeAccountsContext';
import { binanceWS } from '@/utils/binanceWebSocket';
import DeleteConfirmationModal from './DeleteConfirmationModal';

const TemplatesTable = ({ templates = [], onEdit, onDelete, onUpdateTemplates, filterMode, selectedAccountId }) => {
  const { toast } = useToast();
  const { accounts } = useExchangeAccounts();
  const [showDeleted, setShowDeleted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [livePrices, setLivePrices] = useState({});
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState([]);

  // Collect all unique symbols from all templates to subscribe
  const allSymbols = useMemo(() => {
    const symbols = new Set();
    templates.forEach(t => {
      if (t.symbols && Array.isArray(t.symbols)) {
        t.symbols.forEach(s => symbols.add(s));
      }
    });
    return Array.from(symbols);
  }, [templates]);

  // Subscribe to live prices
  useEffect(() => {
    if (allSymbols.length === 0) return;

    const subscription = binanceWS.subscribe(allSymbols, 'ticker', '1m', (data) => {
      if (data.e === '24hrTicker') {
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
  }, [allSymbols]);

  // Apply filters
  let filteredTemplates = templates.filter(t => showDeleted ? t.deleted : !t.deleted);
  
  if (selectedAccountId) {
      filteredTemplates = filteredTemplates.filter(t => 
        t.exchangeAccountId === selectedAccountId || !t.exchangeAccountId
      );
  }

  filteredTemplates = filteredTemplates.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.symbols.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const toggleSelectAll = () => {
    if (selectedItems.size === filteredTemplates.length && filteredTemplates.length > 0) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredTemplates.map(t => t.id)));
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
      setItemsToDelete(filteredTemplates.map(t => t.id));
    }
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    let updatedTemplates;

    if (showDeleted) {
       // Permanently Delete
       updatedTemplates = templates.filter(t => !itemsToDelete.includes(t.id));
    } else {
       // Move to Trash (Soft Delete)
       updatedTemplates = templates.map(t => itemsToDelete.includes(t.id) ? { ...t, deleted: true } : t);
    }

    if (onUpdateTemplates) {
        onUpdateTemplates(updatedTemplates);
    } else if (onDelete) {
        // Fallback to single calls if update prop missing
        itemsToDelete.forEach(id => onDelete(id));
    }

    // Direct localStorage update to ensure persistence
    localStorage.setItem('tradingTemplates', JSON.stringify(updatedTemplates));

    setSelectedItems(new Set());
    setItemsToDelete([]);
    
    toast({
      title: "Deleted successfully",
      description: `${itemsToDelete.length} template(s) ${showDeleted ? 'permanently removed' : 'moved to trash'}.`,
      className: "bg-green-500 border-green-600 text-white"
    });
  };
  
  const getAccountName = (accId) => {
      if (!accId) return "Global / All";
      const acc = accounts.find(a => a.id === accId);
      return acc ? acc.name : "Unknown Account";
  };

  const getRiskDisplay = (enabled, mode, percent, price, amount, legacyVal) => {
      const isLegacyActive = enabled === undefined && !!legacyVal;
      const isActive = enabled || isLegacyActive;

      if (!isActive) return { text: '---', type: 'none' };
      if (isLegacyActive) return { text: `${legacyVal}%`, type: 'percent' };

      switch (mode) {
          case 'Price': return { text: `$${parseFloat(price || 0).toLocaleString()}`, type: 'price' };
          case 'Amount': return { text: `$${parseFloat(amount || 0).toLocaleString()}`, type: 'amount' };
          case 'Percent': default: return { text: `${percent || 0}%`, type: 'percent' };
      }
  };

  const allSelected = filteredTemplates.length > 0 && selectedItems.size === filteredTemplates.length;

  return (
    <>
      <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] overflow-hidden flex flex-col h-full shadow-lg">
        {/* Header Toolbar */}
        <div className="p-6 border-b border-[#2a2a2a] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowDeleted(false); setSelectedItems(new Set()); }}
              className={cn(
                "px-4 py-2 text-sm font-bold rounded-lg transition-colors border",
                !showDeleted 
                  ? "bg-blue-600 text-white border-blue-500" 
                  : "text-gray-400 hover:text-white bg-[#0f0f0f] border-[#2a2a2a]"
              )}
            >
              Active
            </button>
            <button
              onClick={() => { setShowDeleted(true); setSelectedItems(new Set()); }}
              className={cn(
                "px-4 py-2 text-sm font-bold rounded-lg transition-colors border",
                showDeleted 
                  ? "bg-red-600 text-white border-red-500" 
                  : "text-gray-400 hover:text-white bg-[#0f0f0f] border-[#2a2a2a]"
              )}
            >
              Trashed
            </button>
          </div>

          <div className="flex items-center gap-3 flex-1 justify-end">
            <button
                onClick={handleBulkDeleteClick}
                disabled={filteredTemplates.length === 0}
                className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border",
                filteredTemplates.length === 0 
                    ? "text-gray-600 bg-[#222] border-transparent cursor-not-allowed" 
                    : "text-red-400 bg-red-500/10 hover:bg-red-500/20 border-red-500/20"
                )}
            >
                <Trash2 size={16} />
                {selectedItems.size > 0 ? `Delete Selected (${selectedItems.size})` : 'Delete All'}
            </button>
            
            <div className="relative w-full max-w-xs">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search templates..."
                    className="w-full pl-11 pr-4 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl text-sm font-medium text-white placeholder-gray-500 focus:border-blue-500 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto flex-1 custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#0f0f0f] text-sm uppercase text-gray-400 sticky top-0 z-10 font-bold tracking-wider">
              <tr>
                <th className="px-4 py-4 w-[50px] text-center">
                  <button onClick={toggleSelectAll} className="hover:text-white transition-colors">
                    {allSelected ? <CheckSquare size={16} className="text-blue-500" /> : <Square size={16} />}
                  </button>
                </th>
                <th className="px-6 py-4">Name & Status</th>
                <th className="px-6 py-4">Account</th>
                <th className="px-6 py-4">Symbols & Price</th>
                <th className="px-6 py-4">Positions</th>
                <th className="px-6 py-4">Risk Mgmt</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2a2a]">
              {filteredTemplates.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500 text-base">
                    No items to display.
                  </td>
                </tr>
              ) : (
                filteredTemplates.map((template) => {
                    const tpDisplay = getRiskDisplay(template.takeProfitEnabled, template.takeProfitMode, template.takeProfitPercent, template.takeProfitPrice, template.takeProfitAmount, template.takeProfit);
                    const slDisplay = getRiskDisplay(template.stopLossEnabled, template.stopLossMode, template.stopLossPercent, template.stopLossPrice, template.stopLossAmount, template.stopLoss);
                    const isSelected = selectedItems.has(template.id);
                    
                    // Extract values for Positions column
                    const marginValue = template.margin || template.marginAmount || template.initialMargin || template.investment || template.entryAmount;
                    const margin = marginValue ? parseFloat(marginValue) : null;
                    
                    const leverageValue = template.leverage || template.leverageMultiplier;
                    const leverage = leverageValue ? parseFloat(leverageValue) : null;
                    
                    const rawDirection = template.direction || 'Long';
                    const isLong = rawDirection.toString().toLowerCase() === 'long';
                    const positionType = isLong ? 'LONG' : 'SHORT';

                    return (
                      <motion.tr
                        key={template.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={cn("group hover:bg-[#202020] transition-colors", isSelected && "bg-[#202020]")}
                      >
                        <td className="px-4 py-4 text-center">
                            <button onClick={() => toggleSelect(template.id)} className="text-gray-500 hover:text-white">
                                {isSelected ? <CheckSquare size={16} className="text-blue-500" /> : <Square size={16} />}
                            </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-white text-base mb-1">{template.name}</div>
                          <span className={cn(
                            "text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider inline-block",
                            template.status === 'Active' 
                              ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                              : template.status === 'Direct Activate'
                                  ? 'bg-[#333] text-gray-400 border border-gray-600'
                                  : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                          )}>
                            {template.status || 'Direct Activate'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-sm text-gray-300">
                                <Wallet size={14} className="text-gray-500" />
                                <span className="truncate max-w-[120px]" title={getAccountName(template.exchangeAccountId)}>
                                    {getAccountName(template.exchangeAccountId)}
                                </span>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5 max-w-[250px]">
                            {template.symbols.slice(0, 3).map(s => (
                              <div key={s} className="flex items-center justify-between gap-2 px-2 py-1 bg-[#2a2a2a] rounded-md border border-[#3a3a3a]">
                                <span className="text-gray-200 text-xs font-bold">{s}</span>
                                <span className="text-blue-400 text-xs font-mono">
                                  {livePrices[s] ? `$${livePrices[s].toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}` : '$---'}
                                </span>
                              </div>
                            ))}
                            {template.symbols.length > 3 && (
                              <span className="px-2 py-1 bg-[#151515] text-gray-500 rounded-md text-xs font-bold border border-[#2a2a2a] w-fit">
                                +{template.symbols.length - 3} more
                              </span>
                            )}
                          </div>
                        </td>
                        
                        {/* Positions Column (Strategy Details) */}
                        <td className="px-6 py-4">
                           <div className="flex flex-col gap-1">
                               <span className="text-xs text-gray-400 whitespace-nowrap">
                                   Margin: <span className="text-white font-medium">{margin !== null ? `$${margin.toLocaleString()}` : '-'}</span>
                               </span>
                               <span className={cn(
                                   "text-xs font-bold uppercase",
                                   isLong ? "text-green-400" : "text-red-400"
                               )}>
                                   {positionType} {leverage !== null ? `${leverage}x` : '-'}
                               </span>
                           </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium space-y-1.5">
                            <div className="flex justify-between w-32 items-center">
                              <span className="text-gray-500 text-xs uppercase font-bold">TP</span>
                              <span className={cn("font-mono font-medium", tpDisplay.type === 'none' ? "text-gray-600" : "text-green-400")}>{tpDisplay.text}</span>
                            </div>
                            <div className="flex justify-between w-32 items-center">
                              <span className="text-gray-500 text-xs uppercase font-bold">SL</span>
                              <span className={cn("font-mono font-medium", slDisplay.type === 'none' ? "text-gray-600" : "text-red-400")}>{slDisplay.text}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!template.deleted && (
                              <>
                                <button className="p-2 text-green-400 border border-transparent hover:border-green-500/50 hover:bg-green-500/10 rounded-full transition-all"><Play size={18} /></button>
                                <button onClick={() => onEdit(template)} className="p-2 text-blue-400 border border-transparent hover:border-blue-500/50 hover:bg-blue-500/10 rounded-full transition-all"><Edit size={18} /></button>
                              </>
                            )}
                            <button
                              onClick={() => handleDeleteClick(template.id)}
                              className="p-2 text-red-400 border border-transparent hover:border-red-500/50 hover:bg-red-500/10 rounded-full transition-all"
                              title={template.deleted ? "Delete Forever" : "Trash"}
                            >
                              <Trash2 size={18} />
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
        itemType="templates"
        count={itemsToDelete.length}
      />
    </>
  );
};

export default TemplatesTable;
