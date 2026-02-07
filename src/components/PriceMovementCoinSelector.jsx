
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Loader2, LineChart } from 'lucide-react';
import { binanceWS } from '@/utils/binanceWebSocket';
import { cn } from '@/lib/utils';
import { AVAILABLE_MOVEMENT_COINS } from '@/utils/TemplateCoinsMapping';

const PriceMovementCoinSelector = ({ selectedCoin, onSelectCoin }) => {
  const [price, setPrice] = useState(0);
  const [loading, setLoading] = useState(true);
  const [prevPrice, setPrevPrice] = useState(0);

  useEffect(() => {
    if (!selectedCoin) return;

    setLoading(true);
    let isMounted = true;

    const handlePriceUpdate = (data) => {
      if (!isMounted || !data.c) return;
      setPrevPrice(prev => {
         const newPrice = parseFloat(data.c);
         return prev === 0 ? newPrice : prev;
      });
      setPrice(parseFloat(data.c));
      setLoading(false);
    };

    // Initial fetch via REST to be instant
    fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${selectedCoin}`)
      .then(res => res.json())
      .then(data => {
        if (isMounted && data.price) {
          setPrice(parseFloat(data.price));
          setPrevPrice(parseFloat(data.price));
          setLoading(false);
        }
      })
      .catch(e => console.error(e));

    // Subscribe to WebSocket
    const sub = binanceWS.subscribe([selectedCoin], 'ticker', null, handlePriceUpdate);

    return () => {
      isMounted = false;
      if (sub) {
        binanceWS.unsubscribe(sub);
      }
    };
  }, [selectedCoin]);

  const priceColor = price > prevPrice ? 'text-green-500' : price < prevPrice ? 'text-red-500' : 'text-gray-200';

  return (
    <div className="bg-[#0f0f0f] rounded-xl border border-[#2a2a2a] p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-inner">
      <div className="w-full md:w-1/2">
        <label className="block text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-wide">
          Trigger Source Coin (Movement)
        </label>
        <div className="relative">
          <select
            value={selectedCoin}
            onChange={(e) => onSelectCoin(e.target.value)}
            className="w-full appearance-none bg-[#1a1a1a] border border-[#333] text-white text-sm font-bold rounded-lg px-4 py-3 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all cursor-pointer hover:bg-[#222]"
          >
            {AVAILABLE_MOVEMENT_COINS.map(coin => (
              <option key={coin} value={coin}>{coin}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
        </div>
      </div>

      <div className="w-full md:w-1/2 bg-[#1a1a1a] rounded-lg border border-[#333] px-4 py-2 flex items-center justify-between relative overflow-hidden group">
        <div className="absolute inset-0 bg-purple-500/5 group-hover:bg-purple-500/10 transition-colors" />
        <div className="relative z-10">
          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wide flex items-center gap-1.5">
            <LineChart size={12} className="text-purple-500" />
            Live Price ({selectedCoin})
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {loading ? (
              <div className="flex items-center gap-2 text-gray-500 py-1">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm font-mono">Fetching...</span>
              </div>
            ) : (
              <motion.div 
                key={price}
                initial={{ opacity: 0.5, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("text-xl font-mono font-bold tracking-tight", priceColor)}
              >
                ${price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </motion.div>
            )}
          </div>
        </div>
        <div className="relative z-10 w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
      </div>
    </div>
  );
};

export default PriceMovementCoinSelector;
