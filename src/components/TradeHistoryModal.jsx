
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Calendar, Activity, DollarSign, Clock } from 'lucide-react';
import { format } from 'date-fns';

const TradeHistoryModal = ({ isOpen, onClose, trade }) => {
  if (!isOpen || !trade) return null;

  const handleDownload = () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(trade, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `trade_${trade.id}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-2xl bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-[#2a2a2a] flex justify-between items-center bg-[#1f1f1f]">
            <div>
               <h2 className="text-xl font-bold text-white flex items-center gap-2">
                 Trade History <span className="text-gray-500 text-sm font-normal">#{trade.id.slice(0, 8)}</span>
               </h2>
               <div className="flex items-center gap-2 mt-1">
                 <span className="text-blue-400 font-bold">{trade.coinName}</span>
                 <span className={`text-xs px-2 py-0.5 rounded ${trade.direction === 'Long' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {trade.direction}
                 </span>
               </div>
            </div>
            <div className="flex gap-2">
                <button 
                  onClick={handleDownload}
                  className="p-2 hover:bg-[#2a2a2a] rounded-lg text-gray-400 hover:text-white transition-colors"
                  title="Export Data"
                >
                    <Download size={20} />
                </button>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-[#2a2a2a] rounded-lg text-gray-400 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
             {/* Stats Grid */}
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-[#111] p-3 rounded-xl border border-[#2a2a2a]">
                    <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                        <DollarSign size={12} /> Entry Price
                    </div>
                    <div className="font-mono text-white">${parseFloat(trade.entryPrice).toFixed(4)}</div>
                </div>
                <div className="bg-[#111] p-3 rounded-xl border border-[#2a2a2a]">
                    <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                        <Activity size={12} /> PNL
                    </div>
                    <div className={`font-mono font-bold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {trade.pnl >= 0 ? '+' : ''}{parseFloat(trade.pnl).toFixed(2)}
                    </div>
                </div>
                <div className="bg-[#111] p-3 rounded-xl border border-[#2a2a2a]">
                    <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                        <Calendar size={12} /> Activated
                    </div>
                    <div className="text-white text-xs">
                        {format(new Date(trade.timeActivated), 'MMM dd, HH:mm')}
                    </div>
                </div>
                <div className="bg-[#111] p-3 rounded-xl border border-[#2a2a2a]">
                    <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                        <Clock size={12} /> Duration
                    </div>
                    <div className="text-white text-xs">
                        {/* Mock duration */}
                        2h 15m
                    </div>
                </div>
             </div>

             {/* Timeline */}
             <div>
                <h3 className="text-sm font-bold text-gray-300 mb-4 uppercase tracking-wider">Activity Timeline</h3>
                <div className="relative border-l border-[#333] ml-3 space-y-6">
                    {(trade.history || []).map((event, idx) => (
                        <div key={idx} className="relative pl-6">
                            <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-[#1a1a1a]"></div>
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-white text-sm font-bold">{event.action}</p>
                                    <p className="text-gray-500 text-xs mt-0.5">{event.details}</p>
                                </div>
                                <span className="text-xs text-gray-600 font-mono">
                                    {format(new Date(event.date), 'HH:mm:ss')}
                                </span>
                            </div>
                        </div>
                    ))}
                    {/* Fallback if no history */}
                    {(!trade.history || trade.history.length === 0) && (
                        <div className="relative pl-6">
                             <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-green-500 border-2 border-[#1a1a1a]"></div>
                             <div>
                                <p className="text-white text-sm font-bold">Position Opened</p>
                                <p className="text-gray-500 text-xs mt-0.5">Initial entry at ${parseFloat(trade.entryPrice).toFixed(2)}</p>
                             </div>
                        </div>
                    )}
                </div>
             </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TradeHistoryModal;
