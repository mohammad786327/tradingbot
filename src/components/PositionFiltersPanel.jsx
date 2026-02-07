
import React from 'react';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';

const PositionFiltersPanel = ({ filters, setFilters, onReset }) => {
  const sources = ['All', 'Regular Trades', 'Bot Trades', 'RSI Bot', 'CandleStrike', 'PriceMovement', 'Grid', 'DCA'];
  const statuses = ['All', 'Active', 'Waiting', 'Pending Order', 'Limit Order', 'Closed'];
  const sortOptions = [
    { label: 'Newest First', value: 'time_desc' },
    { label: 'Oldest First', value: 'time_asc' },
    { label: 'Highest PNL', value: 'pnl_desc' },
    { label: 'Lowest PNL', value: 'pnl_asc' },
  ];

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 mb-6">
       <div className="flex flex-col lg:flex-row gap-4 justify-between">
          
          {/* Search */}
          <div className="relative flex-1 max-w-md">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
             <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search coin or bot..."
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] text-white text-sm rounded-lg pl-10 pr-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
             />
          </div>

          {/* Filters Group */}
          <div className="flex flex-wrap items-center gap-3">
             
             {/* Status Filter */}
             <div className="relative group">
                <div className="flex items-center gap-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2.5 min-w-[140px]">
                   <span className="text-gray-500 text-xs font-bold uppercase">Status:</span>
                   <select
                      value={filters.status}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                      className="bg-transparent text-white text-sm font-medium focus:outline-none w-full appearance-none cursor-pointer"
                   >
                      {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                   </select>
                </div>
             </div>

             {/* Source Filter */}
             <div className="relative group">
                <div className="flex items-center gap-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2.5 min-w-[140px]">
                   <span className="text-gray-500 text-xs font-bold uppercase">Source:</span>
                   <select
                      value={filters.source}
                      onChange={(e) => setFilters({ ...filters, source: e.target.value })}
                      className="bg-transparent text-white text-sm font-medium focus:outline-none w-full appearance-none cursor-pointer"
                   >
                      {sources.map(s => <option key={s} value={s}>{s}</option>)}
                   </select>
                </div>
             </div>

             {/* Sort */}
             <div className="relative group">
                <div className="flex items-center gap-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2.5 min-w-[140px]">
                   <SlidersHorizontal size={14} className="text-gray-500" />
                   <select
                      value={filters.sort}
                      onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
                      className="bg-transparent text-white text-sm font-medium focus:outline-none w-full appearance-none cursor-pointer"
                   >
                      {sortOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                   </select>
                </div>
             </div>

             {/* Reset Button */}
             <button 
               onClick={onReset}
               className="p-2.5 bg-[#252525] hover:bg-[#303030] text-gray-400 hover:text-white rounded-lg transition-colors border border-transparent hover:border-[#3a3a3a]"
               title="Reset Filters"
             >
                <Filter size={16} className="rotate-45" />
             </button>
          </div>
       </div>
    </div>
  );
};

export default PositionFiltersPanel;
