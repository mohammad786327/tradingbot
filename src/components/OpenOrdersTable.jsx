import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Edit, 
  Trash2,
  Filter,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

const OpenOrdersTable = ({ orders, onCancelOrder, onEditOrder }) => {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all'); // all, buy, sell

    // Filter logic
    const filteredOrders = orders.filter(order => {
        const matchesSearch = order.symbol.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || order.side.toLowerCase() === filterType.toLowerCase();
        return matchesSearch && matchesType;
    });

    const getStatusBadge = (status) => {
        const s = status.toLowerCase();
        if (s === 'active') return <span className="text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 w-fit"><CheckCircle2 size={10} /> Active</span>;
        if (s === 'pending') return <span className="text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 w-fit"><Clock size={10} /> Pending</span>;
        if (s === 'filled') return <span className="text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 w-fit"><CheckCircle2 size={10} /> Filled</span>;
        return <span className="text-gray-400 bg-gray-500/10 border border-gray-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide w-fit">{status}</span>;
    };

    return (
        <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] shadow-lg overflow-hidden flex flex-col h-full min-h-[400px]">
            {/* Header */}
            <div className="p-4 border-b border-[#2a2a2a] flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#1f1f1f]">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-500">
                        <Clock size={18} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white leading-none">Open Orders</h3>
                        <p className="text-xs text-gray-500 mt-1">Manage active limit and stop orders</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-48">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input 
                            type="text" 
                            placeholder="Filter symbol..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#111] border border-[#333] rounded-lg py-1.5 pl-9 pr-3 text-sm text-white focus:border-blue-500 outline-none transition-colors placeholder-gray-600"
                        />
                    </div>
                    <div className="flex bg-[#111] p-1 rounded-lg border border-[#333]">
                        {['all', 'buy', 'sell'].map(type => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                className={cn(
                                    "px-3 py-1 text-xs font-bold rounded-md capitalize transition-colors",
                                    filterType === type ? "bg-[#2a2a2a] text-white shadow-sm" : "text-gray-500 hover:text-gray-300"
                                )}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto flex-1 custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead className="bg-[#151515] text-[10px] uppercase text-gray-500 font-bold tracking-wider sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-3 border-b border-[#2a2a2a]">Symbol</th>
                            <th className="px-6 py-3 border-b border-[#2a2a2a]">Type</th>
                            <th className="px-6 py-3 border-b border-[#2a2a2a]">Entry Price</th>
                            <th className="px-6 py-3 border-b border-[#2a2a2a]">Mark Price</th>
                            <th className="px-6 py-3 border-b border-[#2a2a2a]">Quantity</th>
                            <th className="px-6 py-3 border-b border-[#2a2a2a]">Unrealized PnL</th>
                            <th className="px-6 py-3 border-b border-[#2a2a2a]">Status</th>
                            <th className="px-6 py-3 border-b border-[#2a2a2a] text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a2a2a]">
                        <AnimatePresence>
                            {filteredOrders.length > 0 ? (
                                filteredOrders.map((order) => (
                                    <motion.tr 
                                        key={order.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="group hover:bg-[#202020] transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-white text-sm">{order.symbol}</span>
                                                <span className="text-[10px] bg-[#2a2a2a] px-1.5 py-0.5 rounded text-gray-400">{order.marginType || 'Spot'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={cn(
                                                "flex items-center gap-1 text-xs font-bold",
                                                order.side === 'Buy' || order.side === 'Long' ? "text-green-400" : "text-red-400"
                                            )}>
                                                {order.side === 'Buy' || order.side === 'Long' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                                {order.side}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-sm text-gray-300">
                                            ${parseFloat(order.price).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-sm text-gray-400">
                                            ${parseFloat(order.currentPrice).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-sm text-gray-300">
                                            {order.quantity}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={cn(
                                                "font-mono text-sm font-bold",
                                                parseFloat(order.pnl) >= 0 ? "text-green-400" : "text-red-400"
                                            )}>
                                                {parseFloat(order.pnl) >= 0 ? '+' : ''}{order.pnl}
                                                <span className="text-[10px] opacity-70 ml-1">
                                                    ({order.pnlPercent}%)
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(order.status)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => onEditOrder(order)}
                                                    className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                                                >
                                                    <Edit size={14} />
                                                </button>
                                                <button 
                                                    onClick={() => onCancelOrder(order.id)}
                                                    className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3 text-gray-500">
                                            <Clock size={40} className="opacity-20" />
                                            <p className="text-sm font-medium">No active orders found matching filters.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default OpenOrdersTable;