import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Info, Shield, TrendingUp, AlertCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useNotifications } from '@/context/NotificationContext';
import { NOTIFICATION_TYPES } from '@/utils/notificationTypes';
import { binanceWS } from '@/utils/binanceWebSocket';
import SymbolSelector from './SymbolSelector';
import { useExchangeAccounts } from '@/context/ExchangeAccountsContext';
import { cn } from '@/lib/utils';

const Toggle = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={cn(
      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#1a1a1a]",
      checked ? "bg-blue-600" : "bg-[#2a2a2a]"
    )}
  >
    <span
      className={cn(
        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
        checked ? "translate-x-6" : "translate-x-1"
      )}
    />
  </button>
);

const BookingModeSelector = ({ modes, selectedMode, onModeChange, colorClass }) => {
  return (
    <div className="flex gap-2 mb-3">
      {modes.map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => onModeChange(mode)}
          className={cn(
            "flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all border",
            selectedMode === mode
              ? `${colorClass} shadow-sm`
              : "text-gray-500 bg-[#1a1a1a] border-[#2a2a2a] hover:bg-[#252525]"
          )}
        >
          {mode}
        </button>
      ))}
    </div>
  );
};

const TemplateBuilder = ({ onSave, editingTemplate, onCancelEdit, onSymbolsChange, selectedAccountId }) => {
  const { toast } = useToast();
  const { addNotification } = useNotifications();
  const { accounts } = useExchangeAccounts();
  
  // Find current account details
  const currentAccount = accounts.find(a => a.id === selectedAccountId);
  
  const [formData, setFormData] = useState({
    name: '',
    symbols: [],
    orderType: 'Market',
    direction: 'Long',
    positionMode: 'Isolated',
    leverage: 10,
    entryAmount: '',
    trailingProfit: '',
    // Take Profit
    takeProfitEnabled: false,
    takeProfitMode: 'Percent',
    takeProfitPercent: '',
    takeProfitPrice: '',
    takeProfitAmount: '',
    // Stop Loss
    stopLossEnabled: false,
    stopLossMode: 'Percent',
    stopLossPercent: '',
    stopLossPrice: '',
    stopLossAmount: '',
  });
  
  const [symbolPrices, setSymbolPrices] = useState({});
  const [limitPrices, setLimitPrices] = useState({});

  useEffect(() => {
    if (editingTemplate) {
      // Handle backward compatibility with old template format
      const template = editingTemplate;
      setFormData({
        ...template,
        // Take Profit - handle old format
        takeProfitEnabled: template.takeProfitEnabled ?? (!!template.takeProfit && template.takeProfit !== ''),
        takeProfitMode: template.takeProfitMode || 'Percent',
        takeProfitPercent: template.takeProfitPercent || template.takeProfit || '',
        takeProfitPrice: template.takeProfitPrice || '',
        takeProfitAmount: template.takeProfitAmount || '',
        // Stop Loss - handle old format
        stopLossEnabled: template.stopLossEnabled ?? (!!template.stopLoss && template.stopLoss !== ''),
        stopLossMode: template.stopLossMode || 'Percent',
        stopLossPercent: template.stopLossPercent || template.stopLoss || '',
        stopLossPrice: template.stopLossPrice || '',
        stopLossAmount: template.stopLossAmount || '',
      });
      setLimitPrices(editingTemplate.limitPrices || {});
    }
  }, [editingTemplate]);

  useEffect(() => {
    if (formData.symbols.length === 0) return;

    let subscription = null;

    if (formData.orderType === 'Market') {
      try {
        subscription = binanceWS.subscribe(formData.symbols, 'ticker', '1m', (data) => {
          if (data.e === '24hrTicker') {
            // Direct parsing of WebSocket data
            const symbol = data.s;
            const price = parseFloat(data.c);
            
            setSymbolPrices(prev => ({
              ...prev,
              [symbol]: price
            }));
          }
        });
      } catch (error) {
        console.error("Failed to subscribe to ticker updates:", error);
      }
    }

    return () => {
      if (subscription) {
        try {
          binanceWS.unsubscribe(subscription);
        } catch (e) {
          console.error("Error unsubscribing from ticker updates:", e);
        }
      }
    };
  }, [formData.symbols, formData.orderType]);

  const handleSymbolsChange = (newSymbols) => {
    setFormData(prev => ({ ...prev, symbols: newSymbols }));
    if (onSymbolsChange) onSymbolsChange(newSymbols);
    setLimitPrices(prev => {
      const newPrices = { ...prev };
      Object.keys(newPrices).forEach(sym => {
        if (!newSymbols.includes(sym)) delete newPrices[sym];
      });
      return newPrices;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedAccountId) {
        toast({
            title: 'No Account Selected',
            description: 'Please select an exchange account before saving.',
            variant: 'destructive'
        });
        return;
    }

    if (!formData.name || formData.symbols.length === 0 || !formData.entryAmount) {
      toast({
        title: 'Validation Error',
        description: 'Please fill name, symbols, and entry amount.',
        variant: 'destructive'
      });
      return;
    }

    // Determine initial status: preserve existing status if editing, otherwise 'Direct Activate'
    const status = editingTemplate?.status || 'Direct Activate';

    const template = {
      ...formData,
      limitPrices: formData.orderType === 'Limit' ? limitPrices : {},
      id: editingTemplate?.id || Date.now().toString(),
      status: status,
      createdAt: editingTemplate?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      exchangeAccountId: selectedAccountId
    };

    onSave(template);
    
    // Trigger notification
    addNotification(
        editingTemplate ? NOTIFICATION_TYPES.TEMPLATE_UPDATED : NOTIFICATION_TYPES.TEMPLATE_CREATED,
        editingTemplate ? "Template Updated" : "Template Created",
        `Strategy "${template.name}" ${editingTemplate ? 'updated' : 'saved'} successfully as ${status}.`,
        { templateId: template.id }
    );

    if (!editingTemplate) {
      setFormData({
        name: '',
        symbols: [],
        orderType: 'Market',
        direction: 'Long',
        positionMode: 'Isolated',
        leverage: 10,
        entryAmount: '',
        trailingProfit: '',
        takeProfitEnabled: false,
        takeProfitMode: 'Percent',
        takeProfitPercent: '',
        takeProfitPrice: '',
        takeProfitAmount: '',
        stopLossEnabled: false,
        stopLossMode: 'Percent',
        stopLossPercent: '',
        stopLossPrice: '',
        stopLossAmount: '',
      });
      setLimitPrices({});
      if (onSymbolsChange) onSymbolsChange([]);
    }

    toast({
      title: 'Success',
      description: editingTemplate ? 'Template updated' : 'Template created'
    });
  };

  const bookingModes = ['Percent', 'Price', 'Amount'];

  return (
    <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a] h-full overflow-y-auto custom-scrollbar flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          {editingTemplate ? 'Edit Template' : 'Template Builder'}
        </h3>
        {editingTemplate && (
          <button 
            onClick={onCancelEdit}
            className="text-sm bg-[#252525] hover:bg-[#303030] text-gray-300 px-3 py-1.5 rounded-lg transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Account Context Badge */}
      <div className="mb-6 p-3 bg-[#252525] border border-[#333] rounded-xl flex items-center justify-between">
         <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">For:</span>
            {currentAccount ? (
                <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-white">{currentAccount.name}</span>
                    <span className="text-[10px] bg-[#333] px-1.5 py-0.5 rounded text-gray-400">{currentAccount.exchange}</span>
                </div>
            ) : (
                <span className="text-sm text-yellow-500 font-medium flex items-center gap-1">
                    <AlertTriangle size={12} /> No account selected
                </span>
            )}
         </div>
         {currentAccount && (
             <div className="flex items-center gap-1.5">
                 <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                 <span className="text-[10px] text-green-500 font-medium">Ready</span>
             </div>
         )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 flex-1">
        {/* Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">Template Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl text-base text-white focus:border-blue-500 transition-colors focus:ring-1 focus:ring-blue-500 outline-none"
            placeholder="My Strategy"
          />
        </div>

        {/* Symbols */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">Symbols</label>
          <SymbolSelector 
            selectedSymbols={formData.symbols}
            onSymbolsChange={handleSymbolsChange}
          />
        </div>

        {/* Order Type & Direction Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Order Type</label>
            <div className="flex bg-[#0f0f0f] p-1.5 rounded-full border border-[#2a2a2a] relative overflow-hidden">
               {/* Background Slider */}
               <motion.div 
                 className="absolute top-1.5 bottom-1.5 rounded-full bg-blue-600 shadow-sm z-0"
                 layoutId="orderTypeBackground"
                 initial={false}
                 transition={{ type: "spring", stiffness: 300, damping: 30 }}
                 style={{ 
                   width: 'calc(50% - 6px)',
                   left: formData.orderType === 'Market' ? '6px' : 'calc(50%)'
                 }}
               />
              {['Market', 'Limit'].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, orderType: type })}
                  className={cn(
                    "flex-1 py-2 text-sm font-bold rounded-full transition-colors relative z-10",
                    formData.orderType === type ? "text-white" : "text-gray-400 hover:text-white"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Direction</label>
            <div className="flex bg-[#0f0f0f] p-1.5 rounded-full border border-[#2a2a2a] relative overflow-hidden">
              {/* Background Slider */}
               <motion.div 
                 className={cn(
                   "absolute top-1.5 bottom-1.5 rounded-full shadow-sm z-0",
                   formData.direction === 'Long' ? 'bg-green-600' : 'bg-red-600'
                 )}
                 layoutId="directionBackground"
                 initial={false}
                 transition={{ type: "spring", stiffness: 300, damping: 30 }}
                 style={{ 
                   width: 'calc(50% - 6px)',
                   left: formData.direction === 'Long' ? '6px' : 'calc(50%)'
                 }}
               />
              {['Long', 'Short'].map(dir => (
                <button
                  key={dir}
                  type="button"
                  onClick={() => setFormData({ ...formData, direction: dir })}
                  className={cn(
                    "flex-1 py-2 text-sm font-bold rounded-full transition-colors relative z-10",
                    formData.direction === dir ? "text-white" : "text-gray-400 hover:text-white"
                  )}
                >
                  {dir}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Prices / Limit Inputs */}
        {formData.symbols.length > 0 && (
          <div className="bg-[#0f0f0f] rounded-xl p-4 border border-[#2a2a2a] space-y-3 max-h-48 overflow-y-auto custom-scrollbar">
            <div className="flex justify-between text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">
              <span>Symbol</span>
              <span>{formData.orderType === 'Market' ? 'Market Price' : 'Limit Price'}</span>
            </div>
            {formData.symbols.map(symbol => (
              <div key={symbol} className="flex items-center justify-between py-1 border-b border-[#2a2a2a]/50 last:border-0">
                <span className="text-base font-medium text-white">{symbol}</span>
                {formData.orderType === 'Market' ? (
                  <span className="text-base font-mono text-green-400 font-medium">
                    ${symbolPrices[symbol]?.toLocaleString(undefined, {minimumFractionDigits: 2}) || '---'}
                  </span>
                ) : (
                  <input
                    type="number"
                    step="0.01"
                    value={limitPrices[symbol] || ''}
                    onChange={(e) => setLimitPrices({ ...limitPrices, [symbol]: e.target.value })}
                    className="w-32 px-3 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-sm text-white text-right focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Price"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Leverage & Mode */}
        <div className="space-y-4 pt-4 border-t border-[#2a2a2a]">
           <div className="flex items-center justify-between mb-2">
             <label className="text-sm font-semibold text-gray-300">Position Mode</label>
             <div className="flex gap-2">
                {['Isolated', 'Cross'].map(mode => (
                  <label key={mode} className="flex items-center cursor-pointer group">
                    <input 
                      type="radio" 
                      name="posMode"
                      className="hidden"
                      checked={formData.positionMode === mode}
                      onChange={() => setFormData({...formData, positionMode: mode})}
                    />
                    <span className={cn(
                      "text-xs font-bold px-3 py-1.5 rounded-lg transition-all border",
                      formData.positionMode === mode 
                        ? "text-blue-400 bg-blue-500/10 border-blue-500/20 shadow-sm" 
                        : "text-gray-500 border-transparent hover:bg-[#252525]"
                    )}>
                      {mode}
                    </span>
                  </label>
                ))}
             </div>
           </div>

           <div className="bg-[#0f0f0f] rounded-xl p-4 border border-[#2a2a2a]">
             <div className="flex justify-between text-sm mb-3">
               <span className="text-gray-400 font-medium">Leverage</span>
               <span className="text-blue-400 font-bold font-mono text-lg">{formData.leverage}x</span>
             </div>
             <input
                type="range"
                min="1"
                max="125"
                value={formData.leverage}
                onChange={(e) => setFormData({ ...formData, leverage: parseInt(e.target.value) })}
                className="w-full h-3 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-colors"
              />
              <div className="flex justify-between text-[10px] text-gray-600 mt-2 font-mono">
                <span>1x</span>
                <span>25x</span>
                <span>50x</span>
                <span>75x</span>
                <span>100x</span>
                <span>125x</span>
              </div>
           </div>
        </div>

        {/* Entry Amount & Trailing Profit */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#2a2a2a]">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-wide">Entry Amount ($)</label>
            <input
              type="number"
              value={formData.entryAmount}
              onChange={(e) => setFormData({ ...formData, entryAmount: e.target.value })}
              className="w-full px-4 py-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl text-base text-white focus:border-blue-500 font-mono transition-colors focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="100"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-wide">Trailing Profit (%)</label>
            <div className="relative">
              <input
                type="number"
                value={formData.trailingProfit}
                onChange={(e) => setFormData({ ...formData, trailingProfit: e.target.value })}
                className="w-full pl-4 pr-8 py-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl text-base text-white focus:border-blue-500 font-mono transition-colors focus:ring-1 focus:ring-blue-500 outline-none"
                placeholder="1.5"
              />
              <span className="absolute right-3 top-3.5 text-sm text-gray-500">%</span>
            </div>
          </div>
        </div>

        {/* Risk Management Section */}
        <div className="pt-4 mt-4 border-t border-[#2a2a2a]">
           <div className="flex items-center gap-2 mb-4">
             <Shield size={16} className="text-blue-400" />
             <span className="text-sm font-bold text-gray-300 uppercase tracking-wider">Risk Management</span>
           </div>
           
           <div className="space-y-4">
             {/* Take Profit */}
             <div className={cn(
               "rounded-xl border transition-all duration-300",
               formData.takeProfitEnabled ? "bg-[#0f0f0f] border-[#2a2a2a] shadow-sm" : "bg-[#0f0f0f]/30 border-[#2a2a2a]/30"
             )}>
                <div className="flex items-center justify-between p-4">
                   <div className="flex items-center gap-3">
                     <div className={cn("p-1.5 rounded-lg", formData.takeProfitEnabled ? "bg-green-500/10" : "bg-gray-800")}>
                        <TrendingUp size={18} className={formData.takeProfitEnabled ? "text-green-500" : "text-gray-600"} />
                     </div>
                     <span className={cn("text-sm font-bold", formData.takeProfitEnabled ? "text-white" : "text-gray-500")}>Take Profit</span>
                   </div>
                   <Toggle checked={formData.takeProfitEnabled} onChange={(v) => setFormData({...formData, takeProfitEnabled: v})} />
                </div>
                <AnimatePresence>
                  {formData.takeProfitEnabled && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-0">
                        {/* Booking Mode Selector */}
                        <BookingModeSelector
                          modes={bookingModes}
                          selectedMode={formData.takeProfitMode}
                          onModeChange={(mode) => setFormData({...formData, takeProfitMode: mode})}
                          colorClass="text-green-400 bg-green-500/10 border-green-500/30"
                        />
                        
                        {/* Input Field based on selected mode */}
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={formData.takeProfitMode}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.15 }}
                          >
                            <label className="block text-[10px] text-gray-500 uppercase font-bold mb-2 tracking-wide">
                              {formData.takeProfitMode === 'Percent' && 'Percentage Value (%)'}
                              {formData.takeProfitMode === 'Price' && 'Target Price ($)'}
                              {formData.takeProfitMode === 'Amount' && 'Profit Amount ($)'}
                            </label>
                            <div className="relative">
                              {formData.takeProfitMode === 'Percent' && (
                                <>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={formData.takeProfitPercent}
                                    onChange={(e) => setFormData({ ...formData, takeProfitPercent: e.target.value })}
                                    className="w-full pl-4 pr-10 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-base text-white focus:border-green-500 transition-colors font-mono focus:ring-1 focus:ring-green-500 outline-none"
                                    placeholder="10.00"
                                  />
                                  <span className="absolute right-4 top-3.5 text-sm text-gray-500">%</span>
                                </>
                              )}
                              {formData.takeProfitMode === 'Price' && (
                                <>
                                  <span className="absolute left-4 top-3.5 text-sm text-gray-500">$</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={formData.takeProfitPrice}
                                    onChange={(e) => setFormData({ ...formData, takeProfitPrice: e.target.value })}
                                    className="w-full pl-8 pr-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-base text-white focus:border-green-500 transition-colors font-mono focus:ring-1 focus:ring-green-500 outline-none"
                                    placeholder="50000.00"
                                  />
                                </>
                              )}
                              {formData.takeProfitMode === 'Amount' && (
                                <>
                                  <span className="absolute left-4 top-3.5 text-sm text-gray-500">$</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={formData.takeProfitAmount}
                                    onChange={(e) => setFormData({ ...formData, takeProfitAmount: e.target.value })}
                                    className="w-full pl-8 pr-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-base text-white focus:border-green-500 transition-colors font-mono focus:ring-1 focus:ring-green-500 outline-none"
                                    placeholder="100.00"
                                  />
                                </>
                              )}
                            </div>
                          </motion.div>
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>

             {/* Stop Loss */}
             <div className={cn(
               "rounded-xl border transition-all duration-300",
               formData.stopLossEnabled ? "bg-[#0f0f0f] border-[#2a2a2a] shadow-sm" : "bg-[#0f0f0f]/30 border-[#2a2a2a]/30"
             )}>
                <div className="flex items-center justify-between p-4">
                   <div className="flex items-center gap-3">
                     <div className={cn("p-1.5 rounded-lg", formData.stopLossEnabled ? "bg-red-500/10" : "bg-gray-800")}>
                        <AlertCircle size={18} className={formData.stopLossEnabled ? "text-red-500" : "text-gray-600"} />
                     </div>
                     <span className={cn("text-sm font-bold", formData.stopLossEnabled ? "text-white" : "text-gray-500")}>Stop Loss</span>
                   </div>
                   <Toggle checked={formData.stopLossEnabled} onChange={(v) => setFormData({...formData, stopLossEnabled: v})} />
                </div>
                <AnimatePresence>
                  {formData.stopLossEnabled && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-0">
                        {/* Booking Mode Selector */}
                        <BookingModeSelector
                          modes={bookingModes}
                          selectedMode={formData.stopLossMode}
                          onModeChange={(mode) => setFormData({...formData, stopLossMode: mode})}
                          colorClass="text-red-400 bg-red-500/10 border-red-500/30"
                        />
                        
                        {/* Input Field based on selected mode */}
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={formData.stopLossMode}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.15 }}
                          >
                            <label className="block text-[10px] text-gray-500 uppercase font-bold mb-2 tracking-wide">
                              {formData.stopLossMode === 'Percent' && 'Percentage Value (%)'}
                              {formData.stopLossMode === 'Price' && 'Stop Price ($)'}
                              {formData.stopLossMode === 'Amount' && 'Max Loss Amount ($)'}
                            </label>
                            <div className="relative">
                              {formData.stopLossMode === 'Percent' && (
                                <>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={formData.stopLossPercent}
                                    onChange={(e) => setFormData({ ...formData, stopLossPercent: e.target.value })}
                                    className="w-full pl-4 pr-10 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-base text-white focus:border-red-500 transition-colors font-mono focus:ring-1 focus:ring-red-500 outline-none"
                                    placeholder="5.00"
                                  />
                                  <span className="absolute right-4 top-3.5 text-sm text-gray-500">%</span>
                                </>
                              )}
                              {formData.stopLossMode === 'Price' && (
                                <>
                                  <span className="absolute left-4 top-3.5 text-sm text-gray-500">$</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={formData.stopLossPrice}
                                    onChange={(e) => setFormData({ ...formData, stopLossPrice: e.target.value })}
                                    className="w-full pl-8 pr-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-base text-white focus:border-red-500 transition-colors font-mono focus:ring-1 focus:ring-red-500 outline-none"
                                    placeholder="40000.00"
                                  />
                                </>
                              )}
                              {formData.stopLossMode === 'Amount' && (
                                <>
                                  <span className="absolute left-4 top-3.5 text-sm text-gray-500">$</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={formData.stopLossAmount}
                                    onChange={(e) => setFormData({ ...formData, stopLossAmount: e.target.value })}
                                    className="w-full pl-8 pr-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-base text-white focus:border-red-500 transition-colors font-mono focus:ring-1 focus:ring-red-500 outline-none"
                                    placeholder="50.00"
                                  />
                                </>
                              )}
                            </div>
                          </motion.div>
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>
           </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          className="w-full py-4 mt-4 bg-transparent border-2 border-teal-500/50 hover:border-teal-400 rounded-full text-white font-bold text-base hover:bg-teal-500/10 transition-all flex items-center justify-center gap-2 shadow-none"
        >
          <Save size={20} />
          <span>{editingTemplate ? 'Update Strategy' : 'Save Strategy'}</span>
        </motion.button>
      </form>
    </div>
  );
};

export default TemplateBuilder;