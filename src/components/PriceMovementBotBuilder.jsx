
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, AlertTriangle, DollarSign, Activity, Zap, Info } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useNotifications } from '@/context/NotificationContext';
import { NOTIFICATION_TYPES } from '@/utils/notificationTypes';
import { cn } from '@/lib/utils';
import PriceMovementConditionCards from '@/components/PriceMovementConditionCards';
import PriceMovementCoinSelector from './PriceMovementCoinSelector';
import ActiveCoinsDisplay from './ActiveCoinsDisplay';
import { AVAILABLE_MOVEMENT_COINS } from '@/utils/TemplateCoinsMapping';
import { v4 as uuidv4 } from 'uuid';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { getAuth } from 'firebase/auth';

const PriceMovementBotBuilder = ({ templates: propTemplates, onCreateBot, onPreviewSymbolsChange, onSettingsChange }) => {
  const { toast } = useToast();
  const { addNotification } = useNotifications();
  
  // State
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedMovementCoin, setSelectedMovementCoin] = useState(AVAILABLE_MOVEMENT_COINS[0]);
  const [activeCoins, setActiveCoins] = useState([]);
  const [isSafetyOpen, setIsSafetyOpen] = useState(true);
  const [mappingValid, setMappingValid] = useState(true);
  
  const [formData, setFormData] = useState({
    dollarMovement: '50', // This is the "amount" threshold for the trigger
    movementTimeframe: '1m',
    directionMode: 'Long', 
    cooldown: '30',
    cooldownUnit: 'Sec',
    oneTradeAtTime: true,
    maxTradesEnabled: true,
    maxTradesPerDay: '10'
  });

  // Filter out system templates if needed, or rely on propTemplates being correct.
  const userTemplates = useMemo(() => {
    return propTemplates || [];
  }, [propTemplates]);

  // Derived: Current Template Info
  const selectedTemplate = useMemo(() => 
    userTemplates.find(t => t.id === selectedTemplateId), 
  [selectedTemplateId, userTemplates]);

  // Effect: Update Active Coins when Template or Movement Coin changes
  useEffect(() => {
    if (!selectedTemplate) {
        setActiveCoins([]);
        setMappingValid(true);
        return;
    }

    let coins = [];
    if (selectedTemplate.mappings && selectedTemplate.mappings[selectedMovementCoin]) {
        // Support legacy/advanced mapping if available in template data
        coins = selectedTemplate.mappings[selectedMovementCoin];
    } else if (selectedTemplate.symbols && Array.isArray(selectedTemplate.symbols)) {
        // Standard user template: Active coins = All template symbols
        coins = selectedTemplate.symbols;
    }

    if (coins && coins.length > 0) {
        setActiveCoins(coins);
        setMappingValid(true);
    } else {
        setActiveCoins([]);
        // If template exists but no coins derived, it's invalid for this movement coin or empty
        setMappingValid(false);
    }
  }, [selectedTemplate, selectedMovementCoin]);

  // Notify parent for preview - show movement coin + active coins
  useEffect(() => {
    if (onPreviewSymbolsChange) {
      const allSymbols = [selectedMovementCoin, ...activeCoins];
      // Dedup just in case
      onPreviewSymbolsChange([...new Set(allSymbols)]);
    }
  }, [selectedMovementCoin, activeCoins, onPreviewSymbolsChange]);

  // Notify settings
  useEffect(() => {
    if (onSettingsChange) {
      const dollarVal = parseFloat(formData.dollarMovement) || 0;
      onSettingsChange(prev => {
        if (prev?.dollarMovement === dollarVal) return prev;
        return { dollarMovement: dollarVal };
      });
    }
  }, [formData.dollarMovement, onSettingsChange]);

  // Debugging: Log Amount Input Changes
  useEffect(() => {
    console.log(`[DEBUG] Amount Input Changed: ${formData.dollarMovement}`);
  }, [formData.dollarMovement]);

  const handleTemplateChange = (e) => {
      const newTemplateId = e.target.value;
      setSelectedTemplateId(newTemplateId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validations
    if (!selectedTemplateId) {
        toast({ title: "Validation Error", description: "Please select a template.", variant: "destructive" });
        return;
    }
    if (!mappingValid || activeCoins.length === 0) {
         toast({ title: "Validation Error", description: "Invalid coin mapping. Please select a template with symbols.", variant: "destructive" });
         return;
    }
    const amountThreshold = parseFloat(formData.dollarMovement);
    if (!formData.dollarMovement || isNaN(amountThreshold) || amountThreshold <= 0) {
         toast({ title: "Validation Error", description: "Enter a valid positive dollar movement amount.", variant: "destructive" });
        return;
    }

    console.log("[DEBUG] Submitting Bot Config...");
    console.log(`[DEBUG] Trigger Threshold: ${amountThreshold}`);

    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) {
        toast({ title: "Authentication Error", description: "You must be logged in to create a bot.", variant: "destructive" });
        return;
    }

    const botId = Date.now().toString();

    // Create bot configuration object
    const botConfig = {
        id: botId,
        uid: currentUser.uid, // Add User ID for security rules
        templateId: selectedTemplateId,
        templateName: selectedTemplate?.name || 'Unknown Strategy',
        movementCoin: selectedMovementCoin,
        symbols: activeCoins,
        ...formData,
        dollarMovement: amountThreshold, // Ensure number type
        
        // Trigger State Initialization
        hasTriggered: false,
        lastTriggerTime: null,
        
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    console.log("[DEBUG] Bot Config Created:", botConfig);

    // Generate Initial Positions for each active coin
    // These positions start as PENDING until the trigger condition is met
    const initialPositions = activeCoins.map(symbol => {
        const entryPrice = 0; // Updated later when triggered
        const margin = amountThreshold; 

        return {
            id: uuidv4(),
            uid: currentUser.uid,
            botId: botConfig.id,
            botName: botConfig.templateName,
            symbol: symbol,
            entryPrice: entryPrice,
            currentPrice: entryPrice,
            direction: formData.directionMode,
            margin: margin,
            leverage: selectedTemplate?.leverage || 10,
            quantity: 0,
            dollarTarget: amountThreshold, // Used for progress tracking
            status: 'PENDING',
            progress: 0,
            unrealizedPnl: 0,
            pnlPercentage: 0,
            priceChangePercent: 0,
            stopLossAmount: selectedTemplate?.stopLossAmount,
            takeProfitAmount: selectedTemplate?.takeProfitAmount,
            createdAt: new Date().toISOString()
        };
    });

    console.log(`[DEBUG] Created ${initialPositions.length} pending positions.`);

    try {
        // Save Bot to Firestore
        await setDoc(doc(db, 'bots', botConfig.id), botConfig);
        console.log("[DEBUG] Bot saved to Firestore 'bots' collection.");

        // Save Positions to Firestore
        // Note: Ideally use batch write, but keeping it simple for now as requested
        for (const pos of initialPositions) {
            await setDoc(doc(db, 'positions', pos.id), pos);
        }
        console.log("[DEBUG] Positions saved to Firestore 'positions' collection.");

        // Call parent handler to update local state immediately
        onCreateBot(botConfig, initialPositions);
        
        addNotification(
            NOTIFICATION_TYPES.BOT_STARTED,
            "Price Movement Bot Started",
            `Monitoring ${selectedMovementCoin} to trade ${activeCoins.length} pairs.`,
            { botId: botConfig.id, strategy: 'Price Movement' }
        );
        
        toast({
            title: "Bot Created Successfully",
            description: `Trigger: ${selectedMovementCoin} | Trades: ${activeCoins.length} Coins`,
            className: "bg-green-500 border-green-600 text-white"
        });

    } catch (error) {
        console.error("[ERROR] Failed to save bot or positions:", error);
        toast({
            title: "Creation Failed",
            description: "Could not save bot to database. Check console for details.",
            variant: "destructive"
        });
    }
  };

  const DirectionToggle = useCallback(({ value, onChange }) => {
     const options = ['Long', 'Short'];
     const selectedIndex = options.indexOf(value);
     return (
        <div className="flex bg-[#1a1a1a] p-1 rounded-full border border-[#2a2a2a] relative overflow-hidden h-[42px] items-center">
           <motion.div
              className={cn("absolute top-1 bottom-1 rounded-full shadow-sm z-0", value === 'Long' ? 'bg-green-600' : 'bg-red-600')}
              initial={false}
              animate={{ left: selectedIndex === 0 ? '4px' : 'calc(50% + 2px)', width: 'calc(50% - 6px)' }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
           />
           {options.map((opt) => (
              <button key={opt} type="button" onClick={() => onChange(opt)} className={cn("flex-1 py-2 text-xs font-bold rounded-full transition-colors relative z-10 h-full flex items-center justify-center", value === opt ? "text-white" : "text-gray-400 hover:text-white")}>{opt}</button>
           ))}
        </div>
     );
  }, []);
  
  return (
    <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] h-full overflow-y-auto custom-scrollbar flex flex-col">
       <div className="p-5 border-b border-[#2a2a2a]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="text-purple-500" size={20} />
            Price Movement Bot
          </h2>
          <p className="text-xs text-gray-500 mt-1">Configure automated trading based on price volatility.</p>
       </div>

       <form onSubmit={handleSubmit} className="p-5 space-y-6 flex-1">
          {/* 1. Template Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">SELECT TEMPLATE</label>
            <div className="relative mb-4">
                <select
                    value={selectedTemplateId}
                    onChange={handleTemplateChange}
                    className="w-full appearance-none bg-[#0f0f0f] border border-[#2a2a2a] text-white text-sm rounded-xl px-4 py-3 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors"
                >
                    <option value="">Choose a strategy template...</option>
                    {userTemplates.map(t => {
                        // Handle naming for both system and user templates
                        const symbolCount = t.symbols?.length || 0;
                        const orderType = t.orderType || t.type || 'Standard';
                        return (
                           <option key={t.id} value={t.id}>{t.name} ({symbolCount} Symbols) ({orderType})</option>
                        );
                    })}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
            </div>

            {/* 2. Condition Cards */}
            <PriceMovementConditionCards 
                dollarMovement={formData.dollarMovement}
                timeframe={formData.movementTimeframe}
                direction={formData.directionMode}
            />
          </div>

          {/* 3. Coin Selector */}
          <PriceMovementCoinSelector 
             selectedCoin={selectedMovementCoin} 
             onSelectCoin={setSelectedMovementCoin} 
          />

          {/* 4. Active Coins Display */}
          <ActiveCoinsDisplay 
             activeCoins={activeCoins} 
             hasMapping={mappingValid} 
          />

          {/* 5. Dollar Trigger Section */}
          <div className="bg-[#0f0f0f]/50 rounded-xl border border-[#2a2a2a] overflow-hidden">
             <div className="bg-[#0f0f0f] px-4 py-3 border-b border-[#2a2a2a] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <DollarSign size={16} className="text-purple-400" />
                    <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wide">Dollar Trigger</h3>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">
                    <Info size={10} className="text-purple-400" />
                    <span className="text-[10px] text-purple-300 font-medium">Based on Movement Coin</span>
                </div>
             </div>
             
             <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1.5">Dollar Movement (USDT)</label>
                        <input 
                            type="number" 
                            step="0.01"
                            min="0.01"
                            value={formData.dollarMovement}
                            onChange={(e) => setFormData(prev => ({...prev, dollarMovement: e.target.value}))}
                            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white text-sm font-bold rounded-lg px-3 py-2 focus:border-purple-500 outline-none"
                            placeholder="50"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1.5">Movement In Time Frame</label>
                        <div className="relative">
                            <select 
                                value={formData.movementTimeframe}
                                onChange={(e) => setFormData(prev => ({...prev, movementTimeframe: e.target.value}))}
                                className="w-full appearance-none bg-[#1a1a1a] border border-[#2a2a2a] text-white text-sm font-bold rounded-lg px-3 py-2 focus:border-purple-500 outline-none"
                            >
                                <option value="1m">1m</option>
                                <option value="5m">5m</option>
                                <option value="15m">15m</option>
                                <option value="1h">1h</option>
                                <option value="4h">4h</option>
                                <option value="1d">1d</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={14} />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-gray-500 text-[10px] font-bold mb-1.5">Direction Mode</label>
                    <DirectionToggle 
                        value={formData.directionMode}
                        onChange={(val) => setFormData(prev => ({...prev, directionMode: val}))}
                    />
                </div>
                
                {/* Dynamic Condition Text */}
                <div className="text-[11px] text-gray-400 font-mono bg-[#151515] p-2 rounded border border-[#252525] text-center">
                    If <span className="text-white font-bold">{selectedMovementCoin}</span> moves 
                    <span className={formData.directionMode === 'Long' ? "text-green-400" : "text-red-400"}>
                        {formData.directionMode === 'Long' ? ' UP' : ' DOWN'} ${formData.dollarMovement}
                    </span> in {formData.movementTimeframe}, trigger {activeCoins.length} trades.
                </div>
             </div>
          </div>

          {/* 6. Safety Settings (Collapsible) */}
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
                                        onChange={(e) => setFormData(prev => ({...prev, cooldown: e.target.value}))}
                                        className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] text-white text-sm rounded-lg px-3 py-2 focus:border-purple-500 outline-none"
                                    />
                                    <div className="relative w-24">
                                        <select 
                                            value={formData.cooldownUnit}
                                            onChange={(e) => setFormData(prev => ({...prev, cooldownUnit: e.target.value}))}
                                            className="w-full h-full appearance-none bg-[#1a1a1a] border border-[#2a2a2a] text-white text-xs font-bold rounded-lg px-2 focus:border-purple-500 outline-none"
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
                                    onChange={() => setFormData(prev => ({...prev, oneTradeAtTime: !prev.oneTradeAtTime}))}
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
                                        onChange={() => setFormData(prev => ({...prev, maxTradesEnabled: !prev.maxTradesEnabled}))}
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
                                                onChange={(e) => setFormData(prev => ({...prev, maxTradesPerDay: e.target.value}))}
                                                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white text-sm rounded-lg px-3 py-2 focus:border-purple-500 outline-none"
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
            disabled={!mappingValid || activeCoins.length === 0}
            className={cn(
                "w-full py-4 mt-4 border-2 rounded-full font-bold text-base transition-all flex items-center justify-center gap-2 shadow-none",
                !mappingValid || activeCoins.length === 0 
                    ? "bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed" 
                    : "bg-transparent border-teal-500/50 hover:border-teal-400 text-white hover:bg-teal-500/10"
            )}
          >
             <Zap size={20} className="fill-current" />
             <span>{(!mappingValid || activeCoins.length === 0) ? 'Invalid Configuration' : 'Create Bot'}</span>
          </motion.button>
       </form>
    </div>
  );
};

export default PriceMovementBotBuilder;
