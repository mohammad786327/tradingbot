
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Zap, Activity, Settings, AlertTriangle, ChevronUp, Layers } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useNotifications } from '@/context/NotificationContext';
import { NOTIFICATION_TYPES } from '@/utils/notificationTypes';
import { cn } from '@/lib/utils';
import ActiveCoinsDisplay from './ActiveCoinsDisplay';
import { v4 as uuidv4 } from 'uuid';

const RSITradingBotBuilder = ({ templates = [], onCreateBot, onPreviewRSI }) => {
  const { toast } = useToast();
  const { addNotification } = useNotifications();
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [activeCoins, setActiveCoins] = useState([]);
  const [isSafetyOpen, setIsSafetyOpen] = useState(true);

  const [formData, setFormData] = useState({
    mode: 'Touch', // Touch vs Bounce
    timeframe: '1m',
    rsiValue: 30,
    limit: 14,
    
    // Safety
    cooldown: 60,
    oneTradeAtTime: true,
    maxTradesEnabled: true,
    maxTradesPerDay: 10
  });

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  useEffect(() => {
    if (selectedTemplate) {
        // Assume template has 'symbols' array
        setActiveCoins(selectedTemplate.symbols || []);
    } else {
        setActiveCoins([]);
    }
  }, [selectedTemplate]);

  // Sync preview
  useEffect(() => {
    if (onPreviewRSI) {
        onPreviewRSI({
            rsiValue: formData.rsiValue,
            limit: formData.limit,
            timeframe: formData.timeframe
        });
    }
  }, [formData, onPreviewRSI]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!selectedTemplateId) {
        toast({ title: "Validation Error", description: "Please select a template.", variant: "destructive" });
        return;
    }
    if (formData.rsiValue < 0 || formData.rsiValue > 100) {
        toast({ title: "Validation Error", description: "RSI Value must be between 0 and 100.", variant: "destructive" });
        return;
    }
    if (formData.limit <= 0) {
        toast({ title: "Validation Error", description: "Limit must be greater than 0.", variant: "destructive" });
        return;
    }

    // Payload Construction
    const botConfig = {
        id: uuidv4(),
        templateId: selectedTemplateId,
        templateName: selectedTemplate?.name || 'Unknown',
        activeCoins: activeCoins,
        rsiSettings: {
            mode: formData.mode,
            timeframe: formData.timeframe,
            rsiValue: parseFloat(formData.rsiValue),
            limit: parseInt(formData.limit)
        },
        safetySettings: {
            cooldown: parseInt(formData.cooldown),
            oneTradeAtTime: formData.oneTradeAtTime,
            maxTradesPerDay: formData.maxTradesEnabled ? parseInt(formData.maxTradesPerDay) : null
        },
        status: 'ACTIVE',
        createdAt: new Date().toISOString()
    };

    // Initial Positions (One for each coin)
    const newPositions = activeCoins.map(sym => ({
        id: uuidv4(),
        botId: botConfig.id,
        symbol: sym,
        entryPrice: 0, // Will be filled upon entry
        currentPrice: 0,
        rsiValue: botConfig.rsiSettings.rsiValue,
        limit: botConfig.rsiSettings.limit,
        timeframe: botConfig.rsiSettings.timeframe,
        status: 'ACTIVE', // Waiting for trigger
        pnl: 0,
        pnlPercent: 0,
        createdAt: new Date().toISOString()
    }));

    onCreateBot(botConfig, newPositions);

    addNotification(
        NOTIFICATION_TYPES.BOT_STARTED,
        "RSI Bot Deployed",
        `Monitoring ${activeCoins.length} coins with RSI ${formData.mode} strategy.`,
        { botId: botConfig.id }
    );

    toast({
        title: "RSI Bot Started",
        description: `Strategy deployed for ${activeCoins.length} pairs.`,
        className: "bg-purple-500 border-purple-600 text-white"
    });

    // Reset Form (Optional, but good UX)
    setSelectedTemplateId('');
  };

  return (
    <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] h-full overflow-y-auto custom-scrollbar flex flex-col">
       <div className="p-5 border-b border-[#2a2a2a]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="text-purple-500" size={20} />
            RSI Bot Builder
          </h2>
          <p className="text-xs text-gray-500 mt-1">Automate trades based on Relative Strength Index.</p>
       </div>

       <form onSubmit={handleSubmit} className="p-5 space-y-6 flex-1">
          {/* 1. Template Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">SELECT TEMPLATE</label>
            <div className="relative mb-4">
                <select
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="w-full appearance-none bg-[#0f0f0f] border border-[#2a2a2a] text-white text-sm rounded-xl px-4 py-3 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors"
                >
                    <option value="">Choose a strategy template...</option>
                    {templates.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.symbols?.length || 0} Symbols)</option>
                    ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
            </div>
            
            {/* Active Coins Display */}
            <ActiveCoinsDisplay activeCoins={activeCoins} hasMapping={activeCoins.length > 0} />
          </div>

          {/* 2. RSI Settings */}
          <div className="bg-[#0f0f0f]/50 rounded-xl border border-[#2a2a2a] overflow-hidden">
             <div className="bg-[#0f0f0f] px-4 py-3 border-b border-[#2a2a2a] flex items-center gap-2">
                <Settings size={16} className="text-purple-400" />
                <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wide">RSI Settings</h3>
             </div>
             
             <div className="p-4 space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1.5">Mode</label>
                        <div className="relative">
                            <select 
                                value={formData.mode}
                                onChange={(e) => setFormData({...formData, mode: e.target.value})}
                                className="w-full appearance-none bg-[#1a1a1a] border border-[#2a2a2a] text-white text-sm font-bold rounded-lg px-3 py-2 focus:border-purple-500 outline-none"
                            >
                                <option value="Touch">Touch (Cross)</option>
                                <option value="Bounce">Bounce (Reversal)</option>
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={14} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1.5">Timeframe</label>
                        <div className="relative">
                            <select 
                                value={formData.timeframe}
                                onChange={(e) => setFormData({...formData, timeframe: e.target.value})}
                                className="w-full appearance-none bg-[#1a1a1a] border border-[#2a2a2a] text-white text-sm font-bold rounded-lg px-3 py-2 focus:border-purple-500 outline-none"
                            >
                                <option value="1m">1m</option>
                                <option value="5m">5m</option>
                                <option value="15m">15m</option>
                                <option value="1h">1h</option>
                                <option value="4h">4h</option>
                                <option value="1d">1d</option>
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={14} />
                        </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1.5">RSI Value (0-100)</label>
                        <input 
                            type="number"
                            min="0" max="100"
                            value={formData.rsiValue}
                            onChange={(e) => setFormData({...formData, rsiValue: e.target.value})}
                            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white text-sm font-bold rounded-lg px-3 py-2 focus:border-purple-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1.5">Limit (Period)</label>
                        <input 
                            type="number"
                            min="1"
                            value={formData.limit}
                            onChange={(e) => setFormData({...formData, limit: e.target.value})}
                            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white text-sm font-bold rounded-lg px-3 py-2 focus:border-purple-500 outline-none"
                        />
                    </div>
                 </div>
             </div>
          </div>

          {/* 3. Safety Settings */}
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
                                <label className="block text-[10px] font-bold text-gray-500 mb-1.5">Cooldown (Seconds)</label>
                                <input 
                                    type="number" 
                                    value={formData.cooldown}
                                    onChange={(e) => setFormData({...formData, cooldown: e.target.value})}
                                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white text-sm rounded-lg px-3 py-2 focus:border-purple-500 outline-none"
                                />
                            </div>

                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className={cn("w-5 h-5 rounded border flex items-center justify-center transition-colors", formData.oneTradeAtTime ? "bg-purple-600 border-purple-600" : "bg-[#1a1a1a] border-[#2a2a2a]")}>
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
                                    <div className={cn("w-5 h-5 rounded border flex items-center justify-center transition-colors", formData.maxTradesEnabled ? "bg-purple-600 border-purple-600" : "bg-[#1a1a1a] border-[#2a2a2a]")}>
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
                                {formData.maxTradesEnabled && (
                                     <input 
                                        type="number"
                                        value={formData.maxTradesPerDay}
                                        onChange={(e) => setFormData({...formData, maxTradesPerDay: e.target.value})}
                                        className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white text-sm rounded-lg px-3 py-2 focus:border-purple-500 outline-none ml-8 w-[calc(100%-2rem)]"
                                    />
                                )}
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
            disabled={!selectedTemplateId}
            className={cn(
                "w-full py-4 mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-full text-white font-bold text-base transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20",
                !selectedTemplateId && "opacity-50 cursor-not-allowed grayscale"
            )}
          >
             <Zap size={20} className="fill-current" />
             <span>Create RSI Bot</span>
          </motion.button>
       </form>
    </div>
  );
};

export default RSITradingBotBuilder;
