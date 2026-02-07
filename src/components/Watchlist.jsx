import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, TrendingUp, TrendingDown, Plus } from 'lucide-react';
import { storageManager } from '@/utils/storageManager';
import { realtimeManager } from '@/utils/realtimeDataManager';
import { theme } from '@/utils/cyberpunkTheme';

const Watchlist = () => {
  const [symbols, setSymbols] = useState([]);
  const [prices, setPrices] = useState({});

  useEffect(() => {
    const list = storageManager.getWatchlist();
    setSymbols(list);

    const sub = realtimeManager.subscribe(list, ({ symbol, price, change }) => {
      setPrices(prev => ({
        ...prev,
        [symbol]: { price, change }
      }));
    });

    return () => realtimeManager.unsubscribe(sub);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Star className="text-yellow-400 fill-yellow-400/20" size={20} /> Watchlist
        </h3>
        <button className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
          <Plus size={14} /> Add
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {symbols.map((symbol) => {
          const data = prices[symbol] || { price: 0, change: 0 };
          const isUp = data.change >= 0;

          return (
            <motion.div
              key={symbol}
              layout
              className={`${theme.colors.card} p-3 rounded-xl border border-white/5 hover:border-white/20 transition-all cursor-pointer group`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-bold text-white">{symbol}</span>
                <span className={`text-xs ${isUp ? 'text-green-400' : 'text-red-400'} flex items-center`}>
                  {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {Math.abs(data.change).toFixed(2)}%
                </span>
              </div>
              <div className="text-lg font-mono font-medium text-gray-200 group-hover:text-blue-400 transition-colors">
                 ${data.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default Watchlist;