import React, { useState, useEffect } from 'react';
import { ChevronDown, DollarSign, Wallet, AlertTriangle, Settings2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import AdvancedTradingOptions from './AdvancedTradingOptions';

const FutureTradePanel = ({ symbol: propSymbol, onSymbolChange, onValuesChange, compact = false }) => {
  const { toast } = useToast();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [formData, setFormData] = useState({
    symbol: propSymbol || 'BTCUSDT',
    orderType: 'Limit',
    positionMode: 'One-way',
    marginType: 'Isolated',
    leverage: 20,
    price: '',
    quantity: '',
    takeProfit: '',
    stopLoss: '',
  });

  const [advancedOptions, setAdvancedOptions] = useState({
    timeInForce: 'GTC',
    postOnly: false,
    reduceOnly: false,
    trailingStop: { enabled: false, value: '', type: 'percentage' },
    goodTillDate: null
  });

  const [activePercentage, setActivePercentage] = useState(null);
  
  // Mock margin balance
  const marginBalance = 50000.00; // USDT

  // Update internal state if prop changes
  useEffect(() => {
    if (propSymbol && propSymbol !== formData.symbol) {
        setFormData(prev => ({ ...prev, symbol: propSymbol }));
    }
  }, [propSymbol]);

  // Notify parent of changes for chart lines
  useEffect(() => {
    if (onValuesChange) {
        onValuesChange({
            price: formData.price,
            stopLoss: formData.stopLoss,
            takeProfit: formData.takeProfit
        });
    }
  }, [formData.price, formData.stopLoss, formData.takeProfit, onValuesChange]);

  // Notify parent of symbol change
  useEffect(() => {
    if (onSymbolChange) {
        onSymbolChange(formData.symbol);
    }
  }, [formData.symbol, onSymbolChange]);

  const validateNumberInput = (value) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      return true;
    }
    return false;
  };

  const handleInputChange = (field, value) => {
    if (['price', 'quantity', 'takeProfit', 'stopLoss'].includes(field)) {
        if (!validateNumberInput(value)) return;
    }

    if (field === 'quantity') {
      setActivePercentage(null);
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePercentageClick = (percentage) => {
    setActivePercentage(percentage);
    const maxPositionValue = marginBalance * formData.leverage;
    const quantity = (maxPositionValue * (percentage / 100)).toFixed(2);
    setFormData(prev => ({ ...prev, quantity: quantity.toString() }));
  };

  const calculateLiquidation = (side) => {
     const price = parseFloat(formData.price) || 65000;
     const lev = formData.leverage;
     if (side === 'Long') return (price * (1 - (1/lev) + 0.01)).toFixed(2);
     return (price * (1 + (1/lev) - 0.01)).toFixed(2);
  };

  const handleOrder = (side) => {
      toast({
          title: `${side} Position Opened`,
          description: `${side} ${formData.leverage}x ${formData.symbol} with ${formData.marginType} Margin`,
          variant: side === 'Long' ? 'success' : 'destructive'
      });
  };

  const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'ADAUSDT', 'XRPUSDT', 'MATICUSDT'];

  return (
    <div className={cn("space-y-4", compact ? "text-sm" : "space-y-6")}>
       <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Futures Trading</label>
            <button 
                onClick={() => setShowAdvanced(true)}
                className="px-2 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded-md flex items-center gap-1.5 transition-colors text-xs font-bold"
            >
                <Settings2 size={12} />
                Advanced
            </button>
       </div>

       <AdvancedTradingOptions 
            isOpen={showAdvanced}
            onClose={() => setShowAdvanced(false)}
            onApply={setAdvancedOptions}
            currentOptions={advancedOptions}
       />

       {/* Symbol & Margin Settings */}
       <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <div className="relative">
                <select
                    value={formData.symbol}
                    onChange={(e) => handleInputChange('symbol', e.target.value)}
                    className="w-full appearance-none bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white font-bold focus:border-purple-500 outline-none transition-colors"
                >
                    {symbols.map(s => <option key={s} value={s}>{s} Perp</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
            </div>
          </div>

          <div>
             <button
               onClick={() => handleInputChange('marginType', formData.marginType === 'Isolated' ? 'Cross' : 'Isolated')}
               className="w-full py-2 bg-[#252525] border border-[#3a3a3a] hover:border-gray-500 rounded-lg text-xs font-bold text-white transition-colors"
             >
                {formData.marginType}
             </button>
          </div>
          <div>
             <button
               onClick={() => handleInputChange('positionMode', formData.positionMode === 'One-way' ? 'Hedge' : 'One-way')}
               className="w-full py-2 bg-[#252525] border border-[#3a3a3a] hover:border-gray-500 rounded-lg text-xs font-bold text-white transition-colors"
             >
                {formData.positionMode}
             </button>
          </div>
       </div>

       {/* Leverage Slider */}
       <div className="bg-[#0f0f0f] rounded-xl p-3 border border-[#2a2a2a]">
          <div className="flex justify-between items-center mb-2">
             <span className="text-[10px] font-bold text-gray-400">Leverage</span>
             <span className="text-purple-400 font-bold font-mono text-xs">{formData.leverage}x</span>
          </div>
          <input
             type="range"
             min="1"
             max="125"
             step="1"
             value={formData.leverage}
             onChange={(e) => handleInputChange('leverage', parseInt(e.target.value))}
             className="w-full h-1.5 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400 transition-colors"
          />
       </div>

       {/* Inputs */}
       <div className="space-y-3">
           {/* Price */}
           <div>
               <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-1.5">Entry Price</label>
               <div className="relative group">
                   <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-500 transition-colors" />
                   <input 
                       type="text" 
                       inputMode="decimal"
                       value={formData.price}
                       onChange={(e) => handleInputChange('price', e.target.value)}
                       placeholder="Market Price"
                       className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl py-2.5 pl-9 pr-4 text-white font-mono focus:border-purple-500 outline-none transition-colors text-sm"
                   />
               </div>
           </div>

           {/* Quantity */}
           <div>
               <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-1.5">Size (USDT)</label>
               <div className="relative group">
                   <Wallet size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-500 transition-colors" />
                   <input 
                       type="text" 
                       inputMode="decimal"
                       value={formData.quantity}
                       onChange={(e) => handleInputChange('quantity', e.target.value)}
                       placeholder="0.00"
                       className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl py-2.5 pl-9 pr-4 text-white font-mono focus:border-purple-500 outline-none transition-colors text-sm"
                   />
               </div>
           </div>

           {/* Percentage Buttons */}
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide flex justify-between">
                    <span>% of Balance</span>
                    <span className="text-gray-400">{marginBalance.toLocaleString()} USDT</span>
                </label>
                <div className="flex gap-1">
                    {[25, 50, 75, 100].map(pct => (
                        <button 
                            key={pct}
                            type="button"
                            onClick={() => handlePercentageClick(pct)}
                            className={cn(
                                "flex-1 py-1.5 rounded text-[10px] font-bold transition-colors border",
                                activePercentage === pct
                                ? "bg-purple-500/20 text-purple-400 border-purple-500/40"
                                : "bg-[#2a2a2a] border-transparent hover:bg-[#333] text-gray-400"
                            )}
                        >
                            {pct}%
                        </button>
                    ))}
                </div>
            </div>

            {/* TP / SL */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Take Profit</label>
                    <input 
                       type="text" 
                       inputMode="decimal"
                       value={formData.takeProfit}
                       onChange={(e) => handleInputChange('takeProfit', e.target.value)}
                       placeholder="TP"
                       className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg py-2 px-3 text-white font-mono text-xs focus:border-purple-500 outline-none transition-colors"
                   />
                </div>
                <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Stop Loss</label>
                    <input 
                       type="text" 
                       inputMode="decimal"
                       value={formData.stopLoss}
                       onChange={(e) => handleInputChange('stopLoss', e.target.value)}
                       placeholder="SL"
                       className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg py-2 px-3 text-white font-mono text-xs focus:border-purple-500 outline-none transition-colors"
                   />
                </div>
            </div>
       </div>

       {/* Info Box */}
       <div className="bg-[#2a2a2a]/30 rounded-xl p-3 border border-[#2a2a2a] flex items-start gap-3">
           <AlertTriangle size={16} className="text-yellow-500 mt-0.5 shrink-0" />
           <div className="text-[10px] text-gray-400 leading-tight">
              <p className="mb-1">Est. Liq (L): <span className="text-yellow-500 font-mono font-bold">${calculateLiquidation('Long')}</span></p>
              <p>Est. Liq (S): <span className="text-yellow-500 font-mono font-bold">${calculateLiquidation('Short')}</span></p>
           </div>
       </div>

       {/* Action Buttons */}
       <div className="grid grid-cols-2 gap-3 pt-1">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleOrder('Long')}
            className="py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold shadow-lg shadow-green-900/20 transition-all text-sm"
          >
              Long
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleOrder('Short')}
            className="py-3 rounded-xl bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-bold shadow-lg shadow-red-900/20 transition-all text-sm"
          >
              Short
          </motion.button>
      </div>
    </div>
  );
};

export default FutureTradePanel;