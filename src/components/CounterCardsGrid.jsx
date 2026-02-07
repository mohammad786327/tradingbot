import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Zap, TrendingUp, TrendingDown, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

const CounterCardsGrid = ({ activeCount, pendingCount, totalProfit, totalLoss, totalCount, onCardClick, filterMode }) => {
    
    const CounterCard = ({ id, label, value, subValue, icon: Icon, colorClass, onClick, isActive }) => {
        // Map color names to specific Tailwind classes to ensure they are compiled
        const styles = {
            emerald: {
                bgActive: 'bg-emerald-500/10',
                borderActive: 'border-emerald-500',
                text: 'text-emerald-500',
                borderHover: 'hover:border-emerald-500/50',
                iconBg: 'bg-emerald-500/20',
                subText: 'text-emerald-400'
            },
            yellow: {
                bgActive: 'bg-yellow-500/10',
                borderActive: 'border-yellow-500',
                text: 'text-yellow-500',
                borderHover: 'hover:border-yellow-500/50',
                iconBg: 'bg-yellow-500/20',
                subText: 'text-yellow-400'
            },
            green: {
                bgActive: 'bg-green-500/10',
                borderActive: 'border-green-500',
                text: 'text-green-500',
                borderHover: 'hover:border-green-500/50',
                iconBg: 'bg-green-500/20',
                subText: 'text-green-400'
            },
            red: {
                bgActive: 'bg-red-500/10',
                borderActive: 'border-red-500',
                text: 'text-red-500',
                borderHover: 'hover:border-red-500/50',
                iconBg: 'bg-red-500/20',
                subText: 'text-red-400'
            },
            purple: {
                bgActive: 'bg-purple-500/10',
                borderActive: 'border-purple-500',
                text: 'text-purple-500',
                borderHover: 'hover:border-purple-500/50',
                iconBg: 'bg-purple-500/20',
                subText: 'text-purple-400'
            }
        };

        const style = styles[colorClass];

        return (
            <motion.div
                whileHover={{ y: -5 }}
                onClick={() => onClick(id)}
                className={cn(
                    "p-5 rounded-2xl border cursor-pointer relative overflow-hidden transition-all duration-300 min-h-[140px]",
                    isActive 
                        ? `${style.bgActive} ${style.borderActive}` 
                        : `bg-[#1a1a1a] border-[#2a2a2a] ${style.borderHover}`
                )}
            >
                {/* Background Icon */}
                <div className={`absolute top-0 right-0 p-4 opacity-10 ${style.text}`}>
                    <Icon size={80} strokeWidth={1.5} />
                </div>
                
                <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                        <div className={`w-10 h-10 rounded-lg ${style.iconBg} flex items-center justify-center ${style.text} mb-3`}>
                            <Icon size={20} />
                        </div>
                        <div className="text-3xl font-bold text-white mb-1 tracking-tight">{value}</div>
                    </div>
                    <div>
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</div>
                        {subValue && <div className={`text-xs mt-1 ${style.subText} font-mono`}>{subValue}</div>}
                    </div>
                </div>
            </motion.div>
        );
    };

    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <CounterCard 
                id="active" 
                label="Active Bots" 
                value={activeCount} 
                icon={Zap} 
                colorClass="emerald" 
                onClick={onCardClick} 
                isActive={filterMode === 'active'}
            />
            <CounterCard 
                id="pending" 
                label="Pending" 
                value={pendingCount} 
                icon={Activity} 
                colorClass="yellow" 
                onClick={onCardClick}
                isActive={filterMode === 'pending'}
            />
            <CounterCard 
                id="profit" 
                label="Total Profit" 
                value={`$${totalProfit}`} 
                icon={TrendingUp} 
                colorClass="green" 
                onClick={onCardClick}
                isActive={filterMode === 'profit'}
            />
            <CounterCard 
                id="loss" 
                label="Total Loss" 
                value={`$${totalLoss}`} 
                icon={TrendingDown} 
                colorClass="red" 
                onClick={onCardClick}
                isActive={filterMode === 'loss'}
            />
            <CounterCard 
                id="total" 
                label="Total Positions" 
                value={totalCount} 
                icon={Layers} 
                colorClass="purple" 
                onClick={onCardClick}
                isActive={filterMode === null}
            />
        </div>
    );
};

export default CounterCardsGrid;