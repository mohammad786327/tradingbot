import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, ArrowLeftRight } from 'lucide-react';
import ChartPanel from '@/components/ChartPanel';
import SpotTradePanel from '@/components/SpotTradePanel';
import FutureTradePanel from '@/components/FutureTradePanel';
import SymbolSelector from '@/components/SymbolSelector';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

const MultiSymbolTradePanel = ({ selectedSymbols, onSymbolsChange }) => {
    const { toast } = useToast();
    
    // State to track trade mode for each symbol independently: { 'BTCUSDT': 'Future', 'ETHUSDT': 'Spot' }
    const [symbolModes, setSymbolModes] = useState({});

    // State to track current input values for each symbol to pass to chart
    // Format: { 'BTCUSDT': { price: '65000', stopLoss: '64000', takeProfit: '68000' } }
    const [tradeParams, setTradeParams] = useState({});

    const handleAddSymbol = (newSymbols) => {
        onSymbolsChange(newSymbols);
    };

    const handleRemoveSymbol = (symbolToRemove) => {
        onSymbolsChange(selectedSymbols.filter(s => s !== symbolToRemove));
        const newModes = { ...symbolModes };
        delete newModes[symbolToRemove];
        setSymbolModes(newModes);
        
        const newParams = { ...tradeParams };
        delete newParams[symbolToRemove];
        setTradeParams(newParams);
    };

    const toggleMode = (symbol) => {
        setSymbolModes(prev => ({
            ...prev,
            [symbol]: prev[symbol] === 'Future' ? 'Spot' : 'Future'
        }));
    };

    const handleTradeValuesChange = (symbol, values) => {
        setTradeParams(prev => ({
            ...prev,
            [symbol]: values
        }));
    };

    const getMode = (symbol) => symbolModes[symbol] || 'Spot';

    const currentSymbolCount = selectedSymbols.length;

    const getGridContainerClass = (count) => {
        // Mobile always 1 col
        let base = "grid grid-cols-1 gap-6 w-full ";
        
        if (count === 0) return base; // No items, no grid layout needed
        if (count === 1) return base + "xl:grid-cols-1";
        if (count === 2) return base + "md:grid-cols-2 xl:grid-cols-2";
        // For 3+ items, use 6 columns to allow for 3-item rows (2 cols each) and 2-item rows (3 cols each)
        return base + "md:grid-cols-2 xl:grid-cols-6";
    };

    const getItemSpanClasses = (index, totalCount) => {
        // Mobile: always col-span-1
        let classes = "col-span-1"; 

        if (totalCount === 1) return classes; 
        if (totalCount === 2) return classes; 

        // For totalCount >= 3, container is xl:grid-cols-6
        // Tablet (md:grid-cols-2):
        // If odd total items, last one spans 2
        if (totalCount % 2 !== 0 && index === totalCount - 1) {
             classes += " md:col-span-2";
        } else {
             classes += " md:col-span-1";
        }

        // Desktop (xl:grid-cols-6) logic:
        if (totalCount === 3) {
            // 3 cols needed -> each item spans 2 of 6
            classes += " xl:col-span-2";
        } else if (totalCount === 4) {
            // Row 1: 3 items (span 2 each)
            // Row 2: 1 item (span 6)
            if (index < 3) classes += " xl:col-span-2";
            else classes += " xl:col-span-6";
        } else if (totalCount === 5) {
            // Row 1: 3 items (span 2 each)
            // Row 2: 2 items (span 3 each)
            if (index < 3) classes += " xl:col-span-2";
            else classes += " xl:col-span-3";
        } else { // 6+ items
            // 6 items: 3 per row (span 2 each)
            classes += " xl:col-span-2";
        }
        
        return classes;
    };

    return (
        <div className="space-y-6 w-full">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <h2 className="text-xl font-bold text-white whitespace-nowrap">Active Panels</h2>
                    <div className="flex-1 sm:w-64">
                         <SymbolSelector 
                            selectedSymbols={selectedSymbols} 
                            onSymbolsChange={handleAddSymbol} 
                            maxSelections={6}
                         />
                    </div>
                </div>
                <div className="text-xs text-gray-500 font-medium">
                    {currentSymbolCount} / 6 Active
                </div>
            </div>

            {/* Dynamic Grid */}
            <div className={getGridContainerClass(currentSymbolCount)}>
                <AnimatePresence mode="popLayout">
                    {selectedSymbols.map((symbol, index) => (
                        <motion.div
                            key={symbol}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.3, type: "spring", bounce: 0.2 }}
                            className={cn(
                                "bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl overflow-hidden shadow-xl flex flex-col min-h-[600px]", 
                                getItemSpanClasses(index, currentSymbolCount)
                            )}
                        >
                            {/* Card Header */}
                            <div className="px-4 py-3 bg-[#1f1f1f] border-b border-[#2a2a2a] flex justify-between items-center shrink-0">
                                <div className="flex items-center gap-3">
                                    <span className="text-base font-bold text-white">{symbol}</span>
                                    <button 
                                        onClick={() => toggleMode(symbol)}
                                        className={cn(
                                            "flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border transition-colors",
                                            getMode(symbol) === 'Spot' 
                                                ? "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20" 
                                                : "bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20"
                                        )}
                                    >
                                        <ArrowLeftRight size={10} />
                                        {getMode(symbol)}
                                    </button>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button 
                                        onClick={() => handleRemoveSymbol(symbol)}
                                        className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Chart Section - Fixed height to ensure consistent layout and visible trade panel */}
                            <div className="h-[350px] border-b border-[#2a2a2a] relative shrink-0">
                                <ChartPanel 
                                    symbol={symbol} 
                                    timeframe="15m" 
                                    entryPrice={tradeParams[symbol]?.price}
                                    stopLoss={tradeParams[symbol]?.stopLoss}
                                    takeProfit={tradeParams[symbol]?.takeProfit}
                                />
                            </div>

                            {/* Trade Form Section - overflow-visible to prevent scrolling within the order panel */}
                            <div className="flex-1 p-4 bg-[#1a1a1a] overflow-visible">
                                {getMode(symbol) === 'Spot' ? (
                                    <SpotTradePanel 
                                        symbol={symbol} 
                                        compact={true} 
                                        onValuesChange={(values) => handleTradeValuesChange(symbol, values)}
                                    />
                                ) : (
                                    <FutureTradePanel 
                                        symbol={symbol} 
                                        compact={true}
                                        onValuesChange={(values) => handleTradeValuesChange(symbol, values)}
                                    />
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default MultiSymbolTradePanel;