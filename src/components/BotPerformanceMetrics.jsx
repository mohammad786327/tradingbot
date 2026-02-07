import React from 'react';
import { Zap, Trophy, Clock } from 'lucide-react';
import { theme } from '@/utils/cyberpunkTheme';

const MetricCard = ({ icon: Icon, label, value, color }) => (
    <div className="bg-[#151515] border border-[#2a2a2a] p-3 rounded-xl flex items-center gap-3">
        <div className={`p-2 rounded-lg bg-${color}-500/10 text-${color}-500`}>
            <Icon size={18} />
        </div>
        <div>
            <div className="text-xs text-gray-500 font-bold uppercase">{label}</div>
            <div className="text-lg font-bold text-white font-mono">{value}</div>
        </div>
    </div>
);

const BotPerformanceMetrics = () => {
  return (
    <div className={`${theme.colors.card} p-6 rounded-2xl`}>
       <h3 className="text-lg font-bold text-white mb-4">Performance Metrics</h3>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
           <MetricCard icon={Trophy} label="Win Rate" value="68.4%" color="green" />
           <MetricCard icon={Zap} label="Profit Factor" value="2.14" color="yellow" />
           <MetricCard icon={Clock} label="Avg Duration" value="4h 12m" color="blue" />
           <MetricCard icon={Zap} label="Active Bots" value="5/8" color="purple" />
       </div>
       
       <div>
           <h4 className="text-xs text-gray-500 font-bold uppercase mb-2">Equity Curve (7d)</h4>
           <div className="h-16 flex items-end gap-1">
               {[40, 45, 42, 50, 55, 53, 60, 65, 62, 70, 75, 80].map((h, i) => (
                   <div key={i} className="flex-1 bg-gradient-to-t from-blue-600 to-cyan-400 rounded-t-sm opacity-80 hover:opacity-100 transition-opacity" style={{ height: `${h}%` }} />
               ))}
           </div>
       </div>
    </div>
  );
};

export default BotPerformanceMetrics;