import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp, TrendingDown, PieChart } from 'lucide-react';
import { storageManager } from '@/utils/storageManager';
import { theme, formatCurrency } from '@/utils/cyberpunkTheme';

const PortfolioOverview = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const loadData = () => setData(storageManager.getPortfolio());
    loadData();
    window.addEventListener('storage-update', loadData);
    return () => window.removeEventListener('storage-update', loadData);
  }, []);

  if (!data) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${theme.colors.card} rounded-2xl p-6 ${theme.colors.cardHover} transition-all duration-300 relative overflow-hidden group`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full -mr-16 -mt-16 transition-all group-hover:bg-blue-500/20" />
      
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">Total Balance</h3>
          <div className="text-4xl font-bold text-white font-mono tracking-tight">
            {formatCurrency(data.totalBalance)}
          </div>
        </div>
        <div className={`px-3 py-1 rounded-lg border ${data.dailyPnL >= 0 ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'} flex items-center gap-1`}>
          {data.dailyPnL >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          <span className="font-bold">{data.dailyPnLPercent}%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm text-gray-500 mb-3 flex items-center gap-2">
            <TrendingUp size={14} /> 24h Profit/Loss
          </h4>
          <p className={`text-xl font-mono ${data.dailyPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {data.dailyPnL >= 0 ? '+' : ''}{formatCurrency(data.dailyPnL)}
          </p>
        </div>
        
        <div className="relative pt-2">
           <h4 className="text-sm text-gray-500 mb-3 flex items-center gap-2">
            <PieChart size={14} /> Allocation
          </h4>
          <div className="flex h-2 w-full rounded-full overflow-hidden bg-gray-800">
            {data.allocation.map((item, i) => (
              <div 
                key={item.name}
                className={`h-full ${['bg-blue-500', 'bg-purple-500', 'bg-cyan-500', 'bg-green-500'][i % 4]}`}
                style={{ width: `${item.value}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            {data.allocation.map((item, i) => (
              <span key={item.name} className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${['bg-blue-500', 'bg-purple-500', 'bg-cyan-500', 'bg-green-500'][i % 4]}`} />
                {item.name} {item.value}%
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PortfolioOverview;