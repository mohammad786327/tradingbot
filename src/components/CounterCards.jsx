import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Clock, TrendingUp, TrendingDown, Layers } from 'lucide-react';

const CounterCards = ({ templates, selectedFilter, onSelectFilter }) => {
  const activeTemplates = templates.filter(t => t.status === 'Active' && !t.deleted);
  const pendingTemplates = templates.filter(t => t.status === 'Pending' && !t.deleted);
  const allTemplates = templates.filter(t => !t.deleted);

  const getMostProfitable = () => {
    const withProfit = allTemplates.map(t => ({
      ...t,
      profit: ((parseFloat(t.takeProfit || 0) - parseFloat(t.entryAmount || 0)) / parseFloat(t.entryAmount || 1)) * 100
    }));
    return withProfit.sort((a, b) => b.profit - a.profit)[0] || null;
  };

  const getMostLoss = () => {
    const withLoss = allTemplates.map(t => ({
      ...t,
      loss: ((parseFloat(t.entryAmount || 0) - parseFloat(t.stopLoss || 0)) / parseFloat(t.entryAmount || 1)) * 100
    }));
    return withLoss.sort((a, b) => b.loss - a.loss)[0] || null;
  };

  const mostProfitable = getMostProfitable();
  const mostLoss = getMostLoss();

  const cards = [
    {
      id: 'active',
      icon: FileText,
      label: 'Active Templates',
      value: activeTemplates.length,
      gradient: 'from-green-500 to-emerald-500',
      bg: 'bg-green-500/10',
      border: 'border-green-500/30'
    },
    {
      id: 'pending',
      icon: Clock,
      label: 'Pending Templates',
      value: pendingTemplates.length,
      gradient: 'from-yellow-500 to-orange-500',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30'
    },
    {
      id: 'profitable',
      icon: TrendingUp,
      label: 'Most Profitable',
      value: mostProfitable ? `${mostProfitable.profit.toFixed(2)}%` : '0%',
      subtext: mostProfitable?.name || 'N/A',
      gradient: 'from-blue-500 to-cyan-500',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30'
    },
    {
      id: 'loss',
      icon: TrendingDown,
      label: 'Most Loss',
      value: mostLoss ? `${mostLoss.loss.toFixed(2)}%` : '0%',
      subtext: mostLoss?.name || 'N/A',
      gradient: 'from-red-500 to-pink-500',
      bg: 'bg-red-500/10',
      border: 'border-red-500/30'
    },
    {
      id: 'total',
      icon: Layers,
      label: 'Total Templates',
      value: allTemplates.length,
      gradient: 'from-purple-500 to-indigo-500',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/30'
    }
  ];

  const handleCardClick = (id) => {
    if (selectedFilter === id) {
      onSelectFilter(null); // Deselect if already selected
    } else {
      onSelectFilter(id);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card, index) => {
        const isSelected = selectedFilter === card.id;
        return (
          <motion.div
            key={card.label}
            onClick={() => handleCardClick(card.id)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              scale: isSelected ? 1.03 : 1,
              borderColor: isSelected ? 'rgba(255,255,255,0.5)' : undefined
            }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className={`cursor-pointer ${card.bg} ${card.border} border rounded-2xl p-6 backdrop-blur-sm transition-all duration-200 hover:shadow-lg hover:shadow-${card.gradient.split('-')[1]}-500/20 relative overflow-hidden`}
          >
            {isSelected && (
              <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-10 pointer-events-none`} />
            )}
            <div className="flex items-start justify-between mb-4 relative z-10">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${card.gradient}`}>
                <card.icon size={28} className="text-white" />
              </div>
            </div>
            <div className="relative z-10">
              <p className="text-4xl font-bold text-white mb-2">{card.value}</p>
              <p className="text-base font-medium text-gray-300">{card.label}</p>
              {card.subtext && (
                <p className="text-sm text-gray-400 mt-1 truncate font-medium">{card.subtext}</p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default CounterCards;