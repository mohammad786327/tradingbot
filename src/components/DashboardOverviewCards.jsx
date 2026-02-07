
import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Wallet, TrendingUp, BarChart3, Zap, DollarSign, ArrowUp, ArrowDown } from 'lucide-react';
import { formatCurrency } from '@/utils/cyberpunkTheme';

const Card = ({ title, value, subtext, icon: Icon, trend, colorClass, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-[#1a1a1a]/80 backdrop-blur-md border border-[#2a2a2a] p-4 rounded-xl shadow-lg relative overflow-hidden group hover:border-white/10 transition-colors"
  >
    <div className={`absolute -right-4 -top-4 w-20 h-20 bg-gradient-to-br ${colorClass} opacity-10 rounded-full blur-xl group-hover:opacity-20 transition-opacity`} />
    
    <div className="flex justify-between items-start mb-2 relative z-10">
      <div className={`p-2 rounded-lg bg-white/5 ${colorClass.replace('from-', 'text-').split(' ')[0]}`}>
        <Icon size={20} />
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-bold ${trend === 'up' ? 'text-green-400' : 'text-red-400'} bg-white/5 px-2 py-1 rounded-full`}>
          {trend === 'up' ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
          <span>2.4%</span>
        </div>
      )}
    </div>
    
    <div className="relative z-10">
      <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{title}</h3>
      <div className="text-2xl font-bold text-white font-mono">{value}</div>
      {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
    </div>
  </motion.div>
);

const DashboardOverviewCards = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <Card 
        title="Active Bots" 
        value={metrics.totalActiveBots} 
        subtext="Across 5 strategies"
        icon={Zap} 
        colorClass="from-yellow-400 to-orange-500" 
        delay={0}
      />
      <Card 
        title="Active Positions" 
        value={metrics.totalActivePositions} 
        subtext="Live trades"
        icon={Activity} 
        colorClass="from-blue-400 to-cyan-500" 
        delay={0.1}
      />
      <Card 
        title="Portfolio Value" 
        value={formatCurrency(metrics.totalPortfolioValue)} 
        subtext="Unrealized + Margin"
        icon={Wallet} 
        colorClass="from-purple-400 to-pink-500" 
        trend="up"
        delay={0.2}
      />
      <Card 
        title="Total PnL" 
        value={(metrics.totalPnL > 0 ? '+' : '') + formatCurrency(metrics.totalPnL)} 
        subtext="Realized + Unrealized"
        icon={DollarSign} 
        colorClass={metrics.totalPnL >= 0 ? "from-green-400 to-emerald-500" : "from-red-400 to-rose-500"} 
        trend={metrics.totalPnL >= 0 ? 'up' : 'down'}
        delay={0.3}
      />
      <Card 
        title="Win Rate" 
        value={`${metrics.winRate}%`} 
        subtext={`${metrics.winCount}W / ${metrics.lossCount}L`}
        icon={TrendingUp} 
        colorClass="from-teal-400 to-green-500" 
        delay={0.4}
      />
      <Card 
        title="Volume Traded" 
        value={formatCurrency(metrics.totalVolume)} 
        subtext="Total notional"
        icon={BarChart3} 
        colorClass="from-indigo-400 to-violet-500" 
        delay={0.5}
      />
    </div>
  );
};

export default DashboardOverviewCards;
