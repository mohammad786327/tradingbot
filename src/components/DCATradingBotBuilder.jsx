import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Settings, PieChart, Layers, Plus, RotateCcw, X, Zap } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useNotifications } from '@/context/NotificationContext';
import { NOTIFICATION_TYPES } from '@/utils/notificationTypes';
import { cn } from '@/lib/utils';

const DCATradingBotBuilder = ({ templates, onCreateBot, onPreviewDCA, currentPrice = 67500 }) => {
  const { toast } = useToast();
  const { addNotification } = useNotifications();
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({
    mode: 'Auto', // DCA Logic: Auto (ASAP) vs Custom
    maxOrders: '5',
    initialQtyPercent: '1.0',
    stepScale: '1.0', // % drop per level
    volumeScale: '1.5', // multiplier for volume
    riskProfile: 'Conservative' // Conservative vs Aggressive
  });

  // Custom Logic State
  const [customSteps, setCustomSteps] = useState([
    { id: '1', dev: '1.0', size: '100' },
    { id: '2', dev: '2.0', size: '150' },
    { id: '3', dev: '3.5', size: '250' }
  ]);
  const [takeProfit, setTakeProfit] = useState('1.5');

  // Effect to preview DCA lines (Auto Mode)
  useEffect(() => {
    if (onPreviewDCA && formData.mode === 'Auto') {
        onPreviewDCA({
            maxOrders: formData.maxOrders,
            stepScale: formData.stepScale,
            volumeScale: formData.volumeScale,
            riskProfile: formData.riskProfile
        });
    }
  }, [formData, onPreviewDCA]);

  const handleTemplateChange = (e) => {
      const newTemplateId = e.target.value;
      setSelectedTemplateId(newTemplateId);
      
      if (newTemplateId && newTemplateId !== 'manual') {
          const template = templates.find(t => t.id === newTemplateId);
          if (template) {
              toast({
                  title: "Template Loaded",
                  description: `Loaded settings from ${template.name}`
              });
          }
      }
  };

  // Custom Steps Handlers
  const addCustomStep = () => {
    const lastStep = customSteps[customSteps.length - 1];
    const nextDev = lastStep ? (parseFloat(lastStep.dev) + 1.0).toFixed(1) : '1.0';
    const nextSize = lastStep ? (parseFloat(lastStep.size) * 1.5).toFixed(0) : '100';
    
    setCustomSteps([
      ...customSteps, 
      { id: Date.now().toString(), dev: nextDev, size: nextSize }
    ]);
  };

  const removeCustomStep = (id) => {
    setCustomSteps(customSteps.filter(step => step.id !== id));
  };

  const updateCustomStep = (id, field, value) => {
    setCustomSteps(customSteps.map(step => 
      step.id === id ? { ...step, [field]: value } : step
    ));
  };

  const resetCustomSteps = () => {
    setCustomSteps([]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (formData.mode === 'Auto') {
      if (parseInt(formData.maxOrders) < 1) {
          toast({ title: "Validation Error", description: "Max orders must be at least 1.", variant: "destructive" });
          return;
      }
      if (parseFloat(formData.stepScale) <= 0) {
          toast({ title: "Validation Error", description: "Step scale must be positive.", variant: "destructive" });
          return;
      }
    } else {
      if (customSteps.length === 0) {
        toast({ title: "Validation Error", description: "Please add at least one step for Custom DCA.", variant: "destructive" });
        return;
      }
    }

    const template = templates.find(t => t.id === selectedTemplateId);
    const symbols = template?.symbols || ['BTCUSDT'];
    
    // Master Config
    const botConfig = {
        id: Date.now().toString(),
        templateId: selectedTemplateId,
        templateName: template?.name || 'Manual DCA',
        symbols: symbols,
        ...formData,
        customSteps: formData.mode === 'Custom' ? customSteps : null,
        takeProfit: formData.mode === 'Custom' ? takeProfit : null,
        status: 'ACTIVE',
        createdAt: new Date().toISOString()
    };

    // Individual Bots
    const timestamp = Date.now();
    const newBots = symbols.map((sym, index) => ({
        id: `${timestamp}_${index}`,
        symbol: sym,
        mode: formData.mode,
        maxOrders: formData.mode === 'Custom' ? customSteps.length : parseInt(formData.maxOrders),
        ordersExecuted: 0,
        initialQtyPercent: parseFloat(formData.initialQtyPercent),
        stepScale: parseFloat(formData.stepScale),
        volumeScale: parseFloat(formData.volumeScale),
        avgPrice: 0, 
        currentPrice: 0,
        totalInvested: 0,
        pnl: 0,
        pnlPercent: 0,
        status: 'ACTIVE',
        riskProfile: formData.riskProfile,
        configId: botConfig.id
    }));

    onCreateBot(botConfig, newBots);
    
    // Trigger notification
    addNotification(
        NOTIFICATION_TYPES.BOT_STARTED,
        "DCA Bot Started",
        `Strategies deployed for ${symbols.length} symbol(s). Mode: ${formData.mode}.`,
        { botId: botConfig.id, strategy: 'DCA' }
    );

    toast({
        title: "DCA Bot Started",
        description: `Launched DCA strategy for ${symbols.length} symbol(s) in ${formData.mode} mode.`,
        className: "bg-purple-500 border-purple-600 text-white"
    });
  };

  // Reusable Toggle Component
  const TwoWayToggle = ({ options, value, onChange, id, activeColor = "bg-purple-600" }) => {
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

  // Calculate Target Price
  const targetPriceVal = currentPrice * (1 + (parseFloat(takeProfit) || 0) / 100);

  return (
    <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] h-full overflow-y-auto custom-scrollbar flex flex-col">
       <div className="p-5 border-b border-[#2a2a2a]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <PieChart className="text-purple-500" size={20} />
            DCA Trading Bot
          </h2>
          <p className="text-xs text-gray-500 mt-1">Dollar Cost Averaging strategy automation.</p>
       </div>

       <form onSubmit={handleSubmit} className="p-5 space-y-6 flex-1">
          {/* Template Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">Select Template</label>
            <div className="relative">
                <select
                    value={selectedTemplateId}
                    onChange={handleTemplateChange}
                    className="w-full appearance-none bg-[#0f0f0f] border border-[#2a2a2a] text-white text-sm rounded-xl px-4 py-3 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors"
                >
                    <option value="" disabled>Choose a strategy template...</option>
                    <option value="manual">Manual Configuration</option>
                    {templates.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.symbols?.length || 1} Pairs)</option>
                    ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
            </div>
          </div>

          {/* DCA Logic Settings */}
          <div className="bg-[#0f0f0f]/50 rounded-xl border border-[#2a2a2a] overflow-hidden">
             <div className="bg-[#0f0f0f] px-4 py-3 border-b border-[#2a2a2a] flex items-center gap-2">
                <Settings size={16} className="text-purple-400" />
                <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wide">Strategy Settings</h3>
             </div>
             
             <div className="p-4 space-y-4">
                <div>
                   <label className="block text-gray-500 text-[10px] font-bold mb-1.5">DCA Logic</label>
                   <TwoWayToggle 
                      options={['Auto', 'Custom']}
                      value={formData.mode}
                      onChange={(val) => setFormData({...formData, mode: val})}
                      id="dcaMode"
                      activeColor="bg-purple-600"
                   />
                </div>

                <AnimatePresence mode="wait">
                  {formData.mode === 'Auto' ? (
                    <motion.div 
                      key="auto-settings"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 mb-1.5">Max Orders</label>
                                <input 
                                    type="number" 
                                    min="1"
                                    max="50"
                                    value={formData.maxOrders}
                                    onChange={(e) => setFormData({...formData, maxOrders: e.target.value})}
                                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white text-sm font-bold rounded-lg px-3 py-2 focus:border-purple-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 mb-1.5">Initial Qty (%)</label>
                                <input 
                                    type="number" 
                                    step="0.1"
                                    min="0.1"
                                    value={formData.initialQtyPercent}
                                    onChange={(e) => setFormData({...formData, initialQtyPercent: e.target.value})}
                                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white text-sm font-bold rounded-lg px-3 py-2 focus:border-purple-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 mb-1.5">Step Scale (%)</label>
                                <input 
                                    type="number" 
                                    step="0.1"
                                    value={formData.stepScale}
                                    onChange={(e) => setFormData({...formData, stepScale: e.target.value})}
                                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white text-sm font-bold rounded-lg px-3 py-2 focus:border-purple-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 mb-1.5">Volume Scale</label>
                                <input 
                                    type="number" 
                                    step="0.1"
                                    value={formData.volumeScale}
                                    onChange={(e) => setFormData({...formData, volumeScale: e.target.value})}
                                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white text-sm font-bold rounded-lg px-3 py-2 focus:border-purple-500 outline-none"
                                />
                            </div>
                        </div>
                        
                        <div>
                          <label className="block text-gray-500 text-[10px] font-bold mb-1.5">Risk Profile</label>
                          <TwoWayToggle 
                              options={['Conservative', 'Aggressive']}
                              value={formData.riskProfile}
                              onChange={(val) => setFormData({...formData, riskProfile: val})}
                              id="riskProfile"
                              activeColor="bg-pink-600"
                          />
                        </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="custom-settings"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      {/* Steps Table - Fixed Layout */}
                      <div className="border border-[#2a2a2a] rounded-xl overflow-hidden bg-[#1a1a1a]">
                          <div className="grid grid-cols-[30px_1fr_1fr_30px] gap-1 px-2 py-2 bg-[#252525] border-b border-[#2a2a2a] text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">
                              <div>#</div>
                              <div>Dev %</div>
                              <div>Size $</div>
                              <div></div>
                          </div>
                          
                          <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                              <AnimatePresence initial={false}>
                                {customSteps.map((step, index) => (
                                    <motion.div 
                                      key={step.id}
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                                      className="grid grid-cols-[30px_1fr_1fr_30px] gap-1 px-2 py-2 border-b border-[#2a2a2a] last:border-0 items-center hover:bg-[#202020] transition-colors"
                                    >
                                        <div className="text-gray-500 text-xs font-mono text-center">{index + 1}</div>
                                        <input 
                                            type="number" 
                                            value={step.dev}
                                            onChange={(e) => updateCustomStep(step.id, 'dev', e.target.value)}
                                            className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded px-1.5 py-1 text-xs text-white text-center focus:border-purple-500 outline-none min-w-0"
                                        />
                                        <input 
                                            type="number" 
                                            value={step.size}
                                            onChange={(e) => updateCustomStep(step.id, 'size', e.target.value)}
                                            className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded px-1.5 py-1 text-xs text-white text-center focus:border-purple-500 outline-none min-w-0"
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => removeCustomStep(step.id)}
                                            className="flex items-center justify-center text-gray-600 hover:text-red-400 transition-colors w-full"
                                        >
                                            <X size={14} />
                                        </button>
                                    </motion.div>
                                ))}
                              </AnimatePresence>
                              {customSteps.length === 0 && (
                                <div className="p-4 text-center text-xs text-gray-600 italic">
                                  No steps added.
                                </div>
                              )}
                          </div>
                      </div>

                      {/* Step Actions */}
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={addCustomStep}
                          className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg border border-dashed border-[#3a3a3a] bg-[#1a1a1a] hover:bg-[#252525] hover:border-purple-500/50 text-xs font-bold text-gray-300 hover:text-purple-400 transition-all"
                        >
                           <Plus size={14} />
                           Add Step
                        </button>
                        <button
                          type="button"
                          onClick={resetCustomSteps}
                          className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg border border-dashed border-[#3a3a3a] bg-[#1a1a1a] hover:bg-[#252525] hover:border-red-500/50 text-xs font-bold text-gray-300 hover:text-red-400 transition-all"
                        >
                           <RotateCcw size={14} />
                           Reset
                        </button>
                      </div>

                      {/* Take Profit Target */}
                      <div className="pt-2 border-t border-[#2a2a2a]">
                        <label className="flex items-center gap-2 text-xs font-bold text-emerald-500 mb-2">
                            <Zap size={14} />
                            Take Profit Target
                        </label>
                        <div className="relative">
                            <input 
                                type="number" 
                                value={takeProfit}
                                onChange={(e) => setTakeProfit(e.target.value)}
                                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white text-lg font-bold focus:border-emerald-500 outline-none"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">%</span>
                        </div>
                        <div className="flex justify-end mt-1">
                            <span className="text-[10px] text-gray-500 font-mono">
                                Target Price: <span className="text-emerald-400 font-bold">${targetPriceVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full py-4 mt-4 bg-transparent border-2 border-purple-500/50 hover:border-purple-400 rounded-full text-white font-bold text-base hover:bg-purple-500/10 transition-all flex items-center justify-center gap-2 shadow-none"
          >
             <Layers size={20} className="fill-current" />
             <span>Create DCA Bot{templates.find(t => t.id === selectedTemplateId)?.symbols?.length > 1 ? 's' : ''}</span>
          </motion.button>
       </form>
    </div>
  );
};

export default DCATradingBotBuilder;