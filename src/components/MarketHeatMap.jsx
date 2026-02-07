import React from 'react';
import { theme } from '@/utils/cyberpunkTheme';

const COINS = [
  { s: 'BTC', p: 42350, c: 2.5 },
  { s: 'ETH', p: 2250, c: 1.8 },
  { s: 'SOL', p: 98.5, c: 5.2 },
  { s: 'BNB', p: 310, c: -0.5 },
  { s: 'XRP', p: 0.52, c: -1.2 },
  { s: 'ADA', p: 0.55, c: 0.8 },
  { s: 'AVAX', p: 35.2, c: 4.1 },
  { s: 'DOGE', p: 0.08, c: -2.1 },
  { s: 'DOT', p: 7.2, c: 1.1 },
  { s: 'LINK', p: 14.5, c: 3.5 },
];

const MarketHeatMap = () => {
  return (
    <div className={`${theme.colors.card} p-6 rounded-2xl h-full flex flex-col`}>
      <h3 className="text-lg font-bold text-white mb-4">Market Heatmap</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 flex-1">
        {COINS.map((coin) => (
          <div
            key={coin.s}
            className={`rounded-xl p-3 flex flex-col justify-center items-center transition-transform hover:scale-105 cursor-pointer ${
              coin.c >= 0 ? 'bg-green-500/20 border-green-500/30' : 'bg-red-500/20 border-red-500/30'
            } border`}
          >
            <span className="font-bold text-white">{coin.s}</span>
            <span className="text-xs text-gray-300 font-mono my-1">${coin.p.toLocaleString()}</span>
            <span className={`text-sm font-bold ${coin.c >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {coin.c > 0 ? '+' : ''}{coin.c}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarketHeatMap;