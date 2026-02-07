import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Zap, TrendingUp, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const TradingStatsCounters = ({ openOrdersCount, winRate, totalPnL, avgDuration }) => {
    
    const CounterCard = ({ label, value, subValue, icon: Icon, colorClass }) => {
        // Style mapping
        const styles = {
            blue: {
                bg: 'bg-blue-500/10',
                border: 'border-blue-500/30',
                text: 'text-blue-500',
                iconBg: 'bg-blue-500/20',
                shadow: 'shadow-[0_0_15px_-3px_rgba(59,130,246,0.15)]'
            },
            green: {
                bg: 'bg-green-500/10',
                border: 'border-green-500/30',
                text: 'text-green-500',
                iconBg: 'bg-green-500/20',
                shadow: 'shadow-[0_0_15px_-3px_rgba(16,185,129,0.15)]'
            },
            purple: {
                bg: 'bg-purple-500/10',
                border: 'border-purple-500/30',
                text: 'text-purple-500',
                iconBg: 'bg-purple-500/20',
                shadow: 'shadow-[0_0_15px_-3px_rgba(168,85,247,0.15)]'
            },
            orange: {
                bg: 'bg-orange-500/10',
                border: 'border-orange-500/30',
                text: 'text-orange-500',
                iconBg: 'bg-orange-500/20',
                shadow: 'shadow-[0_0_15px_-3px_rgba(249,115,22,0.15)]'
            }
        };

        const style = styles[colorClass];

        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                    "relative overflow-hidden rounded-xl border p-5 transition-all hover:-translate-y-1 hover:shadow-lg",
                    style.bg,
                    style.border,
                    style.shadow
                )}
            >
                {/* Background Icon Watermark */}
                <div className={cn("absolute -right-4 -top-4 opacity-10", style.text)}>
                    <Icon size={90} strokeWidth={1} />
                </div>
                
                <div className="relative z-10 flex items-start justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">{label}</p>
                        <h3 className="text-2xl font-bold text-white tracking-tight">{value}</h3>
                        {subValue && (
                            <p className={cn("text-xs font-mono font-medium mt-1", style.text)}>
                                {subValue}
                            </p>
                        )}
                    </div>
                    <div className={cn("p-2 rounded-lg", style.iconBg, style.text)}>
                        <Icon size={20} />
                    </div>
                </div>
            </motion.div>
        );
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <CounterCard 
                label="Open Orders" 
                value={openOrdersCount} 
                subValue="Active & Pending"
                icon={Activity} 
                colorClass="blue" 
            />
            <CounterCard 
                label="Win Rate" 
                value={`${winRate}%`} 
                subValue="Last 30 Days"
                icon={Zap} 
                colorClass="green" 
            />
            <CounterCard 
                label="Total PnL" 
                value={`${totalPnL >= 0 ? '+' : ''}${totalPnL}`} 
                subValue="Realized Profit"
                icon={TrendingUp} 
                colorClass={parseFloat(totalPnL) >= 0 ? "green" : "orange"} 
            />
            <CounterCard 
                label="Avg Duration" 
                value={avgDuration} 
                subValue="Per Trade"
                icon={Clock} 
                colorClass="purple" 
            />
        </div>
    );
};

export default TradingStatsCounters;