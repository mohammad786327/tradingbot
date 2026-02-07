import React from 'react';
import { theme } from '@/utils/cyberpunkTheme';

const RecentTrades = () => {
    const trades = [
        { id: 1, s: 'BTCUSDT', type: 'Long', entry: 41200, exit: 42100, pnl: 450, time: '2h ago' },
        { id: 2, s: 'ETHUSDT', type: 'Short', entry: 2280, exit: 2250, pnl: 120, time: '5h ago' },
        { id: 3, s: 'SOLUSDT', type: 'Long', entry: 92, exit: 91, pnl: -35, time: '8h ago' },
    ];

    return (
        <div className={`${theme.colors.card} rounded-2xl overflow-hidden`}>
            <div className="p-4 border-b border-[#2a2a2a] font-bold text-white">Recent Trade History</div>
            <table className="w-full text-left text-sm">
                <thead className="bg-[#151515] text-gray-500 text-xs uppercase">
                    <tr>
                        <th className="px-4 py-2">Symbol</th>
                        <th className="px-4 py-2">Type</th>
                        <th className="px-4 py-2 text-right">P&L</th>
                        <th className="px-4 py-2 text-right">Time</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#2a2a2a]">
                    {trades.map(t => (
                        <tr key={t.id} className="hover:bg-[#202020]">
                            <td className="px-4 py-3 font-bold text-gray-300">{t.s}</td>
                            <td className={`px-4 py-3 ${t.type === 'Long' ? 'text-green-500' : 'text-red-500'}`}>{t.type}</td>
                            <td className={`px-4 py-3 text-right font-mono ${t.pnl > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {t.pnl > 0 ? '+' : ''}${t.pnl}
                            </td>
                            <td className="px-4 py-3 text-right text-gray-500 text-xs">{t.time}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default RecentTrades;