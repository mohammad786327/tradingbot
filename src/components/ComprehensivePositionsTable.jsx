
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react';
import PositionStatusBadge from './PositionStatusBadge';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/cyberpunkTheme';

const SortIcon = ({ column, sortConfig }) => {
  if (sortConfig.key !== column) return <div className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-30" />;
  return sortConfig.direction === 'asc' 
    ? <ArrowUp size={12} className="ml-1 text-blue-400" />
    : <ArrowDown size={12} className="ml-1 text-blue-400" />;
};

const ComprehensivePositionsTable = ({ positions = [] }) => {
  const [filterText, setFilterText] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortConfig, setSortConfig] = useState({ key: 'timeActivated', direction: 'desc' });

  // 1. Filter & Search
  const filteredData = useMemo(() => {
    return positions.filter(item => {
      const matchesSearch = 
        item.symbol.toLowerCase().includes(filterText.toLowerCase()) ||
        item.botName.toLowerCase().includes(filterText.toLowerCase()) ||
        item.botType.toLowerCase().includes(filterText.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [positions, filterText, statusFilter]);

  // 2. Sort
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      // Handle nulls/undefined
      if (aVal === undefined) aVal = '';
      if (bVal === undefined) bVal = '';

      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  return (
    <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] flex flex-col shadow-lg overflow-hidden h-[500px]">
      {/* Header Controls */}
      <div className="p-4 border-b border-[#2a2a2a] flex flex-col sm:flex-row justify-between gap-4 bg-[#1a1a1a]">
         <div className="flex items-center gap-2">
            <h3 className="text-white font-bold uppercase text-sm tracking-wide">Live Positions Feed</h3>
            <span className="bg-blue-500/10 text-blue-400 text-xs px-2 py-0.5 rounded border border-blue-500/20 font-mono">
                {positions.length}
            </span>
         </div>
         
         <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
               <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
               <input 
                  type="text" 
                  placeholder="Search symbol, bot..." 
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className="bg-[#111] border border-[#333] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 w-48"
               />
            </div>
            
            <div className="flex bg-[#111] rounded-lg p-1 border border-[#333]">
               {['ALL', 'ACTIVE', 'WAITING', 'CLOSED'].map(status => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={cn(
                        "px-3 py-1 text-[10px] font-bold rounded transition-colors",
                        statusFilter === status ? "bg-[#2a2a2a] text-white" : "text-gray-500 hover:text-gray-300"
                    )}
                  >
                     {status}
                  </button>
               ))}
            </div>
         </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto custom-scrollbar bg-[#0f0f0f]">
        <table className="w-full text-left min-w-[1000px]">
            <thead className="bg-[#111] text-xs uppercase text-gray-500 font-bold sticky top-0 z-10 shadow-sm">
               <tr>
                  {[
                    { key: 'botType', label: 'Strategy' },
                    { key: 'symbol', label: 'Symbol' },
                    { key: 'direction', label: 'Side' },
                    { key: 'entryPrice', label: 'Entry Price' },
                    { key: 'currentPrice', label: 'Market Price' },
                    { key: 'amount', label: 'Margin' },
                    { key: 'pnl', label: 'PnL ($)' },
                    { key: 'pnlPercent', label: 'PnL (%)' },
                    { key: 'status', label: 'Status' },
                    { key: 'timeActivated', label: 'Updated' }
                  ].map(col => (
                     <th 
                        key={col.key}
                        onClick={() => handleSort(col.key)}
                        className="px-4 py-3 cursor-pointer hover:bg-[#1a1a1a] hover:text-white transition-colors group select-none border-b border-[#2a2a2a]"
                     >
                        <div className="flex items-center">
                           {col.label}
                           <SortIcon column={col.key} sortConfig={sortConfig} />
                        </div>
                     </th>
                  ))}
                  <th className="px-4 py-3 border-b border-[#2a2a2a]"></th>
               </tr>
            </thead>
            <tbody className="divide-y divide-[#1f1f1f] text-sm">
               <AnimatePresence>
                  {sortedData.map((pos) => (
                     <motion.tr 
                        key={pos.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-[#161616] group transition-colors"
                     >
                        <td className="px-4 py-3">
                           <div className="flex items-center gap-2">
                              <div className={cn("w-1.5 h-8 rounded-full", 
                                 pos.botType.includes('RSI') ? "bg-amber-500" :
                                 pos.botType.includes('Strike') ? "bg-orange-500" :
                                 pos.botType.includes('Grid') ? "bg-blue-500" :
                                 "bg-gray-500"
                              )} />
                              <div>
                                 <div className="font-bold text-white text-xs">{pos.botName}</div>
                                 <div className="text-[10px] text-gray-500">{pos.botType}</div>
                              </div>
                           </div>
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-gray-300">{pos.symbol}</td>
                        <td className="px-4 py-3">
                           <span className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded border uppercase",
                              pos.direction === 'LONG' 
                                 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" 
                                 : "text-rose-400 bg-rose-500/10 border-rose-500/20"
                           )}>
                              {pos.direction} x{pos.leverage}
                           </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-gray-400">{pos.entryPrice ? formatCurrency(pos.entryPrice) : '-'}</td>
                        <td className="px-4 py-3 font-mono text-white">{pos.currentPrice ? formatCurrency(pos.currentPrice) : '-'}</td>
                        <td className="px-4 py-3 font-mono text-gray-400">{pos.amount ? formatCurrency(pos.amount) : '-'}</td>
                        <td className="px-4 py-3">
                           <span className={cn("font-mono font-bold", pos.pnl >= 0 ? "text-emerald-400" : "text-rose-400")}>
                              {pos.pnl >= 0 ? '+' : ''}{formatCurrency(pos.pnl)}
                           </span>
                        </td>
                        <td className="px-4 py-3">
                           <span className={cn("font-mono text-xs", pos.pnlPercent >= 0 ? "text-emerald-400" : "text-rose-400")}>
                              {pos.pnlPercent >= 0 ? '+' : ''}{pos.pnlPercent?.toFixed(2)}%
                           </span>
                        </td>
                        <td className="px-4 py-3">
                           <PositionStatusBadge status={pos.status} />
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                           {new Date(pos.timeActivated).toLocaleTimeString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                           <button className="p-1.5 rounded hover:bg-[#333] text-gray-500 hover:text-white transition-colors">
                              <ExternalLink size={14} />
                           </button>
                        </td>
                     </motion.tr>
                  ))}
               </AnimatePresence>
               {sortedData.length === 0 && (
                  <tr>
                     <td colSpan="11" className="text-center py-12 text-gray-500">
                        No positions match your filters.
                     </td>
                  </tr>
               )}
            </tbody>
        </table>
      </div>
    </div>
  );
};

export default ComprehensivePositionsTable;
