import React, { useState, useEffect } from 'react';
import { ChevronDown, DollarSign, Wallet, Settings2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import AdvancedTradingOptions from './AdvancedTradingOptions';

const SpotTradePanel = ({ symbol: propSymbol, onSymbolChange, onValuesChange, compact = false }) => {
  const { toast } = useToast();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [formData, setFormData] = useState({
    symbol: propSymbol || 'BTCUSDT',
    orderType: 'Limit',
    price: '',
    quantity: '',
    stopLoss: '',
    takeProfit: '',
  });
  
  const [advancedOptions, setAdvancedOptions] = useState({
    timeInForce: 'GTC',
    postOnly: false,
    reduceOnly: false,
    trailingStop: { enabled: false, value: '', type: 'percentage' },
    goodTillDate: null
  });

  const [activePercentage, setActivePercentage] = useState(null);

  // Mock available balance for demo purposes
  const availableBalance = 10000.00; // USDT

  // Update internal state if prop changes
  // Prevents infinite loop by checking if value actually changed
  useEffect(() => {
    if (propSymbol && propSymbol !== formData.symbol) {
        setFormData(prev => ({ ...prev, symbol: propSymbol }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propSymbol]); 

  // Notify parent of changes for chart lines
  // IMPORTANT: Removed onValuesChange from dependency array to prevent infinite loop
  // caused by parent component re-creating the callback function on every render
  useEffect(() => {
    if (onValuesChange) {
        onValuesChange({
            price: formData.price,
            stopLoss: formData.stopLoss,
            takeProfit: formData.takeProfit
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.price, formData.stopLoss, formData.takeProfit]);

  // Notify parent of symbol change
  // IMPORTANT: Removed onSymbolChange from dependency array to prevent infinite loop
  useEffect(() => {
    if (onSymbolChange) {
        onSymbolChange(formData.symbol);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.symbol]);

  const validateNumberInput = (value) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      return true;
    }
    return false;
  };

  const handleInputChange = (field, value) => {
    if (field === 'price' || field === 'quantity' || field === 'stopLoss' || field === 'takeProfit') {
      if (!validateNumberInput(value)) return;
    }
    
    if (field === 'quantity') {
      setActivePercentage(null);
    }

    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePercentageClick = (percentage) => {
    setActivePercentage(percentage);
    
    let price = parseFloat(formData.price);
    
    if (!price && formData.orderType === 'Limit') {
        toast({
            title: "Price required",
            description: "Please enter a price to calculate quantity by percentage.",
            variant: "destructive"
        });
        return;
    }

    if (formData.orderType === 'Market') {
        price = 65000; 
    }

    if (price > 0) {
        const amountToSpend = availableBalance * (percentage / 100);
        const quantity = (amountToSpend / price).toFixed(6);
        setFormData(prev => ({ ...prev, quantity: quantity.toString() }));
    }
  };

  const calculateTotal = () => {
    const price = parseFloat(formData.price) || 0;
    const qty = parseFloat(formData.quantity) || 0;
    return (price * qty).toFixed(2);
  };

  const handleOrder = (side) => {
      toast({
          title: `${side} Order Placed`,
          description: `${side} ${formData.quantity || 0} ${formData.symbol.replace('USDT','')} at ${formData.orderType === 'Market' ? 'Market Price' : '$'+formData.price}`,
          variant: side === 'Buy' ? 'success' : 'destructive'
      });
  };

  const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'ADAUSDT', 'XRPUSDT', 'DOGEUSDT', 'DOTUSDT'];

  return (
    <div className={cn("space-y-4", compact ? "text-sm" : "space-y-6")}>
      <div className="flex justify-between items-center">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Spot Trading</label>
        <button 
          onClick={() => setShowAdvanced(true)}
          className="px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-md flex items-center gap-1.5 transition-colors text-xs font-bold"
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

      {/* Symbol Selection */}
      <div className="relative">
          <select
            value={formData.symbol}
            onChange={(e) => handleInputChange('symbol', e.target.value)}
            className="w-full appearance-none bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white font-bold focus:border-blue-500 outline-none transition-colors"
          >
            {symbols.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
      </div>

      {/* Order Type */}
      <div className="grid grid-cols-2 gap-2">
            {['Limit', 'Market'].map(type => (
                <button
                    key={type}
                    onClick={() => handleInputChange('orderType', type)}
                    className={cn(
                        "py-2 px-3 rounded-lg text-xs font-bold border transition-all",
                        formData.orderType === type 
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/30 shadow-[0_0_10px_-3px_rgba(59,130,246,0.3)]" 
                            : "bg-[#0f0f0f] text-gray-500 border-[#2a2a2a] hover:border-gray-600 hover:text-gray-300"
                    )}
                >
                    {type}
                </button>
            ))}
      </div>

      {/* Price Input */}
      {formData.orderType !== 'Market' && (
        <div className="space-y-2">
           <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Price (USDT)</label>
           <div className="relative group">
               <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
               <input 
                   type="text" 
                   inputMode="decimal"
                   value={formData.price}
                   onChange={(e) => handleInputChange('price', e.target.value)}
                   placeholder="0.00"
                   className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl py-3 pl-9 pr-4 text-white font-mono focus:border-blue-500 outline-none transition-colors"
               />
           </div>
        </div>
      )}

      {/* Quantity Input */}
      <div className="space-y-2">
           <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Quantity</label>
           <div className="relative group">
               <Wallet size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
               <input 
                   type="text" 
                   inputMode="decimal"
                   value={formData.quantity}
                   onChange={(e) => handleInputChange('quantity', e.target.value)}
                   placeholder="0.00"
                   className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl py-3 pl-9 pr-4 text-white font-mono focus:border-blue-500 outline-none transition-colors"
               />
           </div>
      </div>

      {/* Percentage Buttons */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide flex justify-between">
          <span>% of Balance</span>
          <span className="text-gray-400">{availableBalance.toLocaleString()} USDT Avail.</span>
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
                      ? "bg-blue-500/20 text-blue-400 border-blue-500/40"
                      : "bg-[#2a2a2a] border-transparent hover:bg-[#333] text-gray-400"
                  )}
                >
                    {pct}%
                </button>
            ))}
        </div>
      </div>

      {/* TP/SL Inputs */}
      <div className="grid grid-cols-2 gap-3 pt-2">
         <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block mb-1">Take Profit</label>
            <input 
                type="text"
                inputMode="decimal"
                value={formData.takeProfit}
                onChange={(e) => handleInputChange('takeProfit', e.target.value)}
                placeholder="Optional"
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg py-2 px-3 text-white text-xs font-mono focus:border-blue-500 outline-none transition-colors"
            />
         </div>
         <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block mb-1">Stop Loss</label>
            <input 
                type="text"
                inputMode="decimal"
                value={formData.stopLoss}
                onChange={(e) => handleInputChange('stopLoss', e.target.value)}
                placeholder="Optional"
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg py-2 px-3 text-white text-xs font-mono focus:border-blue-500 outline-none transition-colors"
            />
         </div>
      </div>

      {/* Total Display */}
      <div className="flex items-center justify-between p-3 bg-[#0f0f0f] rounded-xl border border-[#2a2a2a]">
          <span className="text-xs font-bold text-gray-400">Total Value</span>
          <div className="text-right">
              <div className="text-sm font-bold text-white font-mono">{calculateTotal()} <span className="text-[10px] text-gray-500">USDT</span></div>
          </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 pt-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleOrder('Buy')}
            className="py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold shadow-lg shadow-green-900/20 transition-all text-sm"
          >
              Buy
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleOrder('Sell')}
            className="py-3 rounded-xl bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-bold shadow-lg shadow-red-900/20 transition-all text-sm"
          >
              Sell
          </motion.button>
      </div>
    </div>
  );
};

export default SpotTradePanel;