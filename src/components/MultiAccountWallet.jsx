import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Server, Plus, ShieldCheck } from 'lucide-react';
import { storageManager } from '@/utils/storageManager';
import { theme, formatCurrency } from '@/utils/cyberpunkTheme';

const MultiAccountWallet = () => {
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    setAccounts(storageManager.getAccounts() || []);
  }, []);

  const totalEquity = accounts.reduce((sum, acc) => sum + (acc.equity || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Wallet className="text-purple-400" size={20} /> Connected Wallets
        </h3>
        <button className="p-1.5 rounded-lg bg-[#252525] hover:bg-[#333] text-gray-400 hover:text-white transition-colors">
          <Plus size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {accounts.map((account, idx) => (
          <motion.div
            key={account.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`${theme.colors.card} p-4 rounded-xl relative overflow-hidden group`}
          >
             <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
             
             <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${account.status === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                  <span className="font-bold text-white text-sm">{account.name}</span>
                </div>
                <Server size={14} className="text-gray-600" />
             </div>

             <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Equity</span>
                  <span className="text-white font-mono">{formatCurrency(account.equity)}</span>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Margin Used</span>
                    <span>{((account.usedMargin / account.equity) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(account.usedMargin / account.equity) * 100}%` }}
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-400"
                    />
                  </div>
                </div>
             </div>
          </motion.div>
        ))}
        
        <div className="mt-2 pt-2 border-t border-[#2a2a2a] flex justify-between items-center px-2">
           <span className="text-xs text-gray-500 uppercase font-bold">Total Equity</span>
           <span className="text-lg font-bold text-white font-mono">{formatCurrency(totalEquity)}</span>
        </div>
      </div>
    </div>
  );
};

export default MultiAccountWallet;