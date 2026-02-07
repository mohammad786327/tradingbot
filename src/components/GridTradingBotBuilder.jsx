import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, AlertTriangle, Zap, Grid, Settings, Lock } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useNotifications } from '@/context/NotificationContext';
import { NOTIFICATION_TYPES } from '@/utils/notificationTypes';
import { cn } from '@/lib/utils';

const GridTradingBotBuilder = ({ templates, onCreateBot, onPreviewGrid }) => {
  const { toast } = useToast();
  const { addNotification } = useNotifications();
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [isSafetyOpen, setIsSafetyOpen] = useState(true);
  
  const [formData, setFormData] = useState({
    gridType: 'Spot',
    lowerPrice: '60000',
    upperPrice: '70000',
    numGrids: '10',
    gridSpacingType: 'Fixed',
    gridSpacingValue: '1000', 
    cooldown: '30',
    cooldownUnit: 'Sec',
    oneTradeAtTime: true,
    maxTradesEnabled: true,
    maxTradesPerDay: '10'
  });

  // Effect to preview grid lines
  useEffect(() => {
    if (onPreviewGrid) {
        onPreviewGrid({
            lowerPrice: formData.lowerPrice,
            upperPrice: formData.upperPrice,
            numGrids: formData.numGrids,
            gridSpacingType: formData.gridSpacingType,
            gridSpacingValue: formData.gridSpacingValue
        });
    }
  }, [formData.lowerPrice, formData.upperPrice, formData.numGrids, formData.gridSpacingType, formData.gridSpacingValue, onPreviewGrid]);

  // Helper to check if template is valid for Grid Bot (Only Market Order allowed)
  const isTemplateValid = (template) => {
      if (!template) return false;
      // Check orderType (primary) or type (legacy)
      const type = (template.orderType || template.type || '').toLowerCase();
      return type === 'market';
  };

  const handleTemplateChange = (e) => {
      const newTemplateId = e.target.value;
      setSelectedTemplateId(newTemplateId);
      
      if (newTemplateId && newTemplateId !== 'manual') {
          const template = templates.find(t => t.id === newTemplateId);
          if (template) {
              // Only load if valid type for Grid Bot
              if (isTemplateValid(template)) {
                  toast({
                      title: "Template Loaded",
                      description: `Loaded settings from ${template.name}`
                  });
                  
                  // Populate form data from template
                  setFormData(prev => ({
                      ...prev,
                      gridType: template.marketType || 'Spot',
                      lowerPrice: template.lowerPrice || prev.lowerPrice,
                      upperPrice: template.upperPrice || prev.upperPrice,
                  }));
              } else {
                  toast({
                      title: "Incompatible Template",
                      description: "This template is not compatible with Grid Trading Bot.",
                      variant: "destructive"
                  });
              }
          }
      }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (parseFloat(formData.lowerPrice) >= parseFloat(formData.upperPrice)) {
         toast({
            title: "Validation Error",
            description: "Lower Price must be less than Upper Price.",
            variant: "destructive"
        });
        return;
    }
    
    if (parseInt(formData.numGrids) < 2) {
         toast({
            title: "Validation Error",
            description: "Number of grids must be at least 2.",
            variant: "destructive"
        });
        return;
    }

    const template = templates.find(t => t.id === selectedTemplateId);
    
    // Determine symbols to trade - default to BTCUSDT if manual, or use template symbols
    const symbols = template?.symbols || ['BTCUSDT'];
    
    // Create the "Master" config object (the instruction)
    const botConfig = {
        id: Date.now().toString(),
        templateId: selectedTemplateId,
        templateName: template?.name || 'Manual Grid',
        symbols: symbols,
        ...formData,
        status: 'ACTIVE',
        createdAt: new Date().toISOString()
    };

    // Create individual Position objects for each symbol
    // This allows us to track PnL and status for each symbol independently
    const timestamp = Date.now();
    const newPositions = symbols.map((sym, index) => ({
        id: `${timestamp}_${index}`, // Unique ID for each position
        symbol: sym,
        gridType: formData.gridType,
        numGrids: parseInt(formData.numGrids),
        lowerPrice: parseFloat(formData.lowerPrice),
        upperPrice: parseFloat(formData.upperPrice),
        // Approximation for init, in real app this would come from price feed or API
        currentPrice: (parseFloat(formData.lowerPrice) + parseFloat(formData.upperPrice)) / 2, 
        status: 'ACTIVE',
        gridProfit: 0,
        unrealizedPnl: 0,
        pnlPercentage: 0,
        gridSpacingType: formData.gridSpacingType,
        gridSpacingValue: parseFloat(formData.gridSpacingValue),
        createdAt: new Date().toISOString(),
        configId: botConfig.id // Reference to the parent config
    }));

    // Pass both the config and the generated positions to the parent handler
    onCreateBot(botConfig, newPositions);
    
    // Trigger notification
    addNotification(
        NOTIFICATION_TYPES.BOT_STARTED,
        "Grid Bot Started",
        `Running ${formData.numGrids} grids for ${symbols.length} symbol(s).`,
        { botId: botConfig.id, strategy: 'Grid' }
    );

    toast({
        title: "Grid Bots Created",
        description: `Successfully started ${newPositions.length} grid bot${newPositions.length > 1 ? 's' : ''}.`,
        className: "bg-green-500 border-green-600 text-white"
    });
  };

  const TwoWayToggle = ({ options, value, onChange, id, activeColor = "bg-blue-600" }) => {
     const selectedIndex = options.indexOf(value);
     return (
       <div className="flex bg-[#1a1a1a] p-1 rounded-full border border-[#2a2a2a] relative overflow-hidden h-[42px] items-center">
          <motion.div
             className={cn("absolute top-1 bottom-1 rounded-full shadow-sm z-0", activeColor)}
             layoutId={id}
             initial={false}
             transition={{ type: "spring", stiffness: 500, damping: 30 }}
             style={{
                width: 'calc(50% - 4px)',
                left: selectedIndex === 0 ? '4px' : 'calc(50%)'
             }}
          />
          {options.map((opt) => (
             <button
                key={opt}
                type="button"
                onClick={() => onChange(opt)}
                className={cn(
                   "flex-1 py-2 text-xs font-bold rounded-full transition-colors relative z-10 h-full flex items-center justify-center",
                   value === opt ? "text-white" : "text-gray-400 hover:text-white"
                )}
             >
                {opt}
             </button>
          ))}
       </div>
     );
  };

  return (
    <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] h-full overflow-y-auto custom-scrollbar flex flex-col">
       <div className="p-5 border-b border-[#2a2a2a]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Grid className="text-blue-500" size={20} />
            Grid Trading Bot
          </h2>
          <p className="text-xs text-gray-500 mt-1">Automate buy low & sell high strategies.</p>
       </div>

       <form onSubmit={handleSubmit} className="p-5 space-y-6 flex-1">
          {/* Template Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">Select Template</label>
            <div className="relative">
                <select
                    value={selectedTemplateId}
                    onChange={handleTemplateChange}
                    className="w-full appearance-none bg-[#0f0f0f] border border-[#2a2a2a] text-white text-sm rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                >
                    <option value="" disabled>Choose a strategy template...</option>
                    <option value="manual">Manual Configuration</option>
                    {templates.map(t => {
                        const isValid = isTemplateValid(t);
                        const typeLabel = t.orderType || t.type || 'Unknown';
                        // Show symbol count if > 1
                        const symbolCount = t.symbols && t.symbols.length > 1 ? ` (${t.symbols.length} Symbols)` : '';
                        
                        return (
                            <option 
                                key={t.id} 
                                value={t.id} 
                                disabled={!isValid}
                                className={!isValid ? "text-gray-500 bg-[#151515]" : ""}
                            >
                                {t.name}{symbolCount} ({typeLabel} Order{isValid ? "" : " - Disabled"})
                            </option>
                        );
                    })}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
            </div>
            <div className="mt-2 text-[10px] text-gray-500 flex items-center gap-1">
                <Lock size={10} />
                <span>Only "Market Order" templates are compatible with Grid Bots.</span>
            </div>
          </div>

          {/* Grid Settings */}
          <div className="bg-[#0f0f0f]/50 rounded-xl border border-[#2a2a2a] overflow-hidden">
             <div className="bg-[#0f0f0f] px-4 py-3 border-b border-[#2a2a2a] flex items-center gap-2">
                <Settings size={16} className="text-blue-400" />
                <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wide">Grid Settings</h3>
             </div>
             
             <div className="p-4 space-y-4">
                <div>
                   <label className="block text-gray-500 text-[10px] font-bold mb-1.5">Grid Type</label>
                   <TwoWayToggle 
                      options={['Spot', 'Futures']}
                      value={formData.gridType}
                      onChange={(val) => setFormData({...formData, gridType: val})}
                      id="gridType"
                      activeColor="bg-blue-600"
                   />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1.5">Lower Price (USDT)</label>
                        <input 
                            type="number" 
                            value={formData.lowerPrice}
                            onChange={(e) => setFormData({...formData, lowerPrice: e.target.value})}
                            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white text-sm font-bold rounded-lg px-3 py-2 focus:border-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1.5">Upper Price (USDT)</label>
                        <input 
                            type="number" 
                            value={formData.upperPrice}
                            onChange={(e) => setFormData({...formData, upperPrice: e.target.value})}
                            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white text-sm font-bold rounded-lg px-3 py-2 focus:border-blue-500 outline-none"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1.5">Number of Grids</label>
                        <input 
                            type="number" 
                            min="2"
                            max="100"
                            value={formData.numGrids}
                            onChange={(e) => setFormData({...formData, numGrids: e.target.value})}
                            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white text-sm font-bold rounded-lg px-3 py-2 focus:border-blue-500 outline-none"
                        />
                     </div>
                     <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1.5">Grid Spacing</label>
                         <TwoWayToggle 
                            options={['Fixed', 'Percentage']}
                            value={formData.gridSpacingType}
                            onChange={(val) => setFormData({...formData, gridSpacingType: val})}
                            id="gridSpacing"
                            activeColor="bg-purple-600"
                         />
                     </div>
                </div>
                
                {formData.gridSpacingType === 'Fixed' ? (
                     <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1.5">Est. Profit/Grid (USDT)</label>
                        <div className="text-xs text-gray-400 italic">Auto-calculated based on range & count</div>
                     </div>
                ) : (
                     <div>
                         <label className="block text-[10px] font-bold text-gray-500 mb-1.5">Spacing Percentage (%)</label>
                         <input 
                            type="number" 
                            value={formData.gridSpacingValue}
                            onChange={(e) => setFormData({...formData, gridSpacingValue: e.target.value})}
                            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white text-sm font-bold rounded-lg px-3 py-2 focus:border-blue-500 outline-none"
                            placeholder="e.g. 0.5"
                        />
                     </div>
                )}
             </div>
          </div>

          <div className="border border-[#2a2a2a] rounded-xl overflow-hidden">
             <button 
                type="button"
                onClick={() => setIsSafetyOpen(!isSafetyOpen)}
                className="w-full flex items-center justify-between p-4 bg-[#0f0f0f] hover:bg-[#151515] transition-colors"
             >
                <div className="flex items-center gap-2">
                    <AlertTriangle size={16} className="text-gray-400" />
                    <span className="text-xs font-bold text-gray-300 uppercase tracking-wide">Safety Settings</span>
                </div>
                {isSafetyOpen ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
             </button>
             
             <AnimatePresence>
                {isSafetyOpen && (
                    <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        className="overflow-hidden bg-[#0f0f0f]/50"
                    >
                        <div className="p-4 space-y-4 border-t border-[#2a2a2a]">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 mb-1.5">Cooldown</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="number" 
                                        value={formData.cooldown}
                                        onChange={(e) => setFormData({...formData, cooldown: e.target.value})}
                                        className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] text-white text-sm rounded-lg px-3 py-2 focus:border-blue-500 outline-none"
                                    />
                                    <div className="relative w-24">
                                        <select 
                                            value={formData.cooldownUnit}
                                            onChange={(e) => setFormData({...formData, cooldownUnit: e.target.value})}
                                            className="w-full h-full appearance-none bg-[#1a1a1a] border border-[#2a2a2a] text-white text-xs font-bold rounded-lg px-2 focus:border-blue-500 outline-none"
                                        >
                                            <option value="Sec">Sec</option>
                                            <option value="Min">Min</option>
                                            <option value="Hour">Hour</option>
                                        </select>
                                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={12} />
                                    </div>
                                </div>
                            </div>

                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className={cn("w-5 h-5 rounded border flex items-center justify-center transition-colors", formData.oneTradeAtTime ? "bg-green-600 border-green-600" : "bg-[#1a1a1a] border-[#2a2a2a] group-hover:border-gray-500")}>
                                    {formData.oneTradeAtTime && <motion.svg initial={{scale: 0}} animate={{scale: 1}} className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></motion.svg>}
                                </div>
                                <input 
                                    type="checkbox" 
                                    className="hidden"
                                    checked={formData.oneTradeAtTime}
                                    onChange={() => setFormData({...formData, oneTradeAtTime: !formData.oneTradeAtTime})}
                                />
                                <span className="text-xs font-medium text-gray-300">One trade at a time</span>
                            </label>

                            <div className="space-y-2">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className={cn("w-5 h-5 rounded border flex items-center justify-center transition-colors", formData.maxTradesEnabled ? "bg-green-600 border-green-600" : "bg-[#1a1a1a] border-[#2a2a2a] group-hover:border-gray-500")}>
                                        {formData.maxTradesEnabled && <motion.svg initial={{scale: 0}} animate={{scale: 1}} className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></motion.svg>}
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        className="hidden"
                                        checked={formData.maxTradesEnabled}
                                        onChange={() => setFormData({...formData, maxTradesEnabled: !formData.maxTradesEnabled})}
                                    />
                                    <span className="text-xs font-medium text-gray-300">Max Trades Per Day</span>
                                </label>

                                <AnimatePresence>
                                    {formData.maxTradesEnabled && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden pl-8"
                                        >
                                            <input 
                                                type="number"
                                                value={formData.maxTradesPerDay}
                                                onChange={(e) => setFormData({...formData, maxTradesPerDay: e.target.value})}
                                                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white text-sm rounded-lg px-3 py-2 focus:border-blue-500 outline-none"
                                                placeholder="10"
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>
                )}
             </AnimatePresence>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full py-4 mt-4 bg-transparent border-2 border-teal-500/50 hover:border-teal-400 rounded-full text-white font-bold text-base hover:bg-teal-500/10 transition-all flex items-center justify-center gap-2 shadow-none"
          >
             <Zap size={20} className="fill-current" />
             <span>Create Grid Bot{templates.find(t => t.id === selectedTemplateId)?.symbols?.length > 1 ? 's' : ''}</span>
          </motion.button>
       </form>
    </div>
  );
};

export default GridTradingBotBuilder;