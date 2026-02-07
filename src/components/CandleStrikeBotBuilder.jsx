import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Zap, Settings, Flame, Shield } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useNotifications } from '@/context/NotificationContext';
import { NOTIFICATION_TYPES } from '@/utils/notificationTypes';
import { cn } from '@/lib/utils';

const CandleStrikeBotBuilder = ({ templates, onCreateBot, onPreviewBot }) => {
  const { toast } = useToast();
  const { addNotification } = useNotifications();
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [isSafetyOpen, setIsSafetyOpen] = useState(true);
  
  // Form State
  const [formData, setFormData] = useState({
    timeframe: '5m',
    direction: 'Green Candles', // Default changed from Auto to Green Candles
    consecutiveCandles: 3,
    // Safety Settings
    cooldownDuration: 30,
    cooldownUnit: 'Sec',
    oneTradeAtATime: true,
    maxTradesEnabled: true,
    maxTradesPerDay: 10
  });

  // Effect to preview settings
  useEffect(() => {
    if (onPreviewBot) {
        onPreviewBot({
            timeframe: formData.timeframe,
            direction: formData.direction,
            consecutiveCandles: formData.consecutiveCandles,
            safety: {
                cooldownDuration: formData.cooldownDuration,
                cooldownUnit: formData.cooldownUnit,
                oneTradeAtATime: formData.oneTradeAtATime,
                maxTradesEnabled: formData.maxTradesEnabled,
                maxTradesPerDay: formData.maxTradesPerDay
            }
        });
    }
  }, [formData, onPreviewBot]);

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
              // Optionally load safety settings from template if they existed
          }
      }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const template = templates.find(t => t.id === selectedTemplateId);
    const symbols = template?.symbols || ['BTCUSDT'];
    
    // Master Config
    const botConfig = {
        id: Date.now().toString(),
        templateId: selectedTemplateId,
        templateName: template?.name || 'Manual Candle Strike',
        symbols: symbols,
        ...formData,
        status: 'ACTIVE',
        createdAt: new Date().toISOString()
    };

    // Individual Bots
    const timestamp = Date.now();
    const newBots = symbols.map((sym, index) => ({
        id: `${timestamp}_${index}`,
        symbol: sym,
        strategy: 'Candle Strike',
        ...formData,
        status: 'ACTIVE',
        pnl: 0,
        unrealizedPnl: 0,
        pnlPercentage: 0,
        currentPrice: 0, 
        createdAt: new Date().toISOString(),
        configId: botConfig.id
    }));

    onCreateBot(botConfig, newBots);
    
    // Trigger notification
    addNotification(
        NOTIFICATION_TYPES.BOT_STARTED,
        "Candle Strike Bot Started",
        `Scanning ${formData.timeframe} candles for ${symbols.length} symbol(s). Target: ${formData.consecutiveCandles} consecutive candles. Safety: ${formData.cooldownDuration}${formData.cooldownUnit} cooldown.`,
        { botId: botConfig.id, strategy: 'Candle Strike' }
    );

    toast({
        title: "Candle Strike Bot Started",
        description: `Launched strategy for ${symbols.length} symbol(s) with safety protocols active.`,
        className: "bg-pink-500 border-pink-600 text-white"
    });
  };

  // Custom Toggle for Direction (Removed Auto option)
  const DirectionToggle = ({ value, onChange }) => {
      const options = ['Green Candles', 'Red Candles'];
      const selectedIndex = options.indexOf(value);

      return (
        <div className="flex flex-col space-y-2">
            <div className="flex bg-[#1a1a1a] p-1 rounded-lg border border-[#2a2a2a] relative overflow-hidden h-[80px] sm:h-[42px] items-center flex-col sm:flex-row">
                <motion.div
                    className="absolute rounded-md shadow-sm z-0 hidden sm:block"
                    initial={false}
                    animate={{ 
                        left: `calc(${selectedIndex * 50}% + 4px)`, // Updated calculation for 2 options
                        width: 'calc(50% - 8px)',
                        backgroundColor: value === 'Green Candles' ? '#10b981' : '#ef4444'
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    style={{ top: '4px', bottom: '4px' }}
                />
                
                {options.map((opt) => (
                    <button
                        key={opt}
                        type="button"
                        onClick={() => onChange(opt)}
                        className={cn(
                        "flex-1 w-full sm:w-auto py-2 px-1 text-xs font-bold rounded-md transition-colors relative z-10 h-full flex items-center justify-center",
                        value === opt ? "text-white sm:bg-transparent" : "text-gray-400 hover:text-white",
                        value === opt && "sm:bg-transparent bg-pink-600" // Fallback mobile bg
                        )}
                    >
                        {opt}
                    </button>
                ))}
            </div>
        </div>
      );
  };

  return (
    <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] h-full overflow-y-auto custom-scrollbar flex flex-col">
       <div className="p-5 border-b border-[#2a2a2a]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Flame className="text-pink-500" size={20} />
            Candle Strike Bot
          </h2>
          <p className="text-xs text-gray-500 mt-1">Pattern-based algorithmic trading.</p>
       </div>

       <form onSubmit={handleSubmit} className="p-5 space-y-6 flex-1">
          {/* Template Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">Select Template</label>
            <div className="relative">
                <select
                    value={selectedTemplateId}
                    onChange={handleTemplateChange}
                    className="w-full appearance-none bg-[#0f0f0f] border border-[#2a2a2a] text-white text-sm rounded-xl px-4 py-3 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition-colors"
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

          {/* Candle Trigger Settings */}
          <div className="bg-[#0f0f0f]/50 rounded-xl border border-[#2a2a2a] overflow-hidden">
             <div className="bg-[#0f0f0f] px-4 py-3 border-b border-[#2a2a2a] flex items-center gap-2">
                <Zap size={16} className="text-pink-400" />
                <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wide">Candle Trigger</h3>
             </div>
             
             <div className="p-4 space-y-6">
                {/* Timeframe */}
                <div>
                   <label className="block text-gray-500 text-[10px] font-bold mb-1.5 uppercase">Timeframe</label>
                   <div className="relative">
                        <select
                            value={formData.timeframe}
                            onChange={(e) => setFormData({...formData, timeframe: e.target.value})}
                            className="w-full appearance-none bg-[#1a1a1a] border border-[#2a2a2a] text-white text-sm font-bold rounded-lg px-3 py-2 focus:border-pink-500 outline-none"
                        >
                            {['1m', '2m', '3m', '5m', '10m', '15m', '30m', '1h', '2h', '4h', '1D'].map(tf => (
                                <option key={tf} value={tf}>{tf}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={14} />
                   </div>
                </div>

                {/* Direction */}
                <div>
                    <label className="block text-gray-500 text-[10px] font-bold mb-1.5 uppercase">Candle Color Strategy</label>
                    <DirectionToggle 
                        value={formData.direction}
                        onChange={(val) => setFormData({...formData, direction: val})}
                    />
                </div>

                {/* Consecutive Candles Slider */}
                <div>
                    <div className="flex justify-between items-center mb-3">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Consecutive Candles to Monitor</label>
                        <span className="text-xl font-black text-pink-500">{formData.consecutiveCandles}</span>
                    </div>
                    <div className="relative flex items-center gap-4 bg-[#1a1a1a] p-3 rounded-lg border border-[#2a2a2a]">
                        <input
                            type="range"
                            min="1"
                            max="20"
                            step="1"
                            value={formData.consecutiveCandles}
                            onChange={(e) => setFormData({...formData, consecutiveCandles: parseInt(e.target.value)})}
                            className="w-full h-2 bg-[#0f0f0f] rounded-lg appearance-none cursor-pointer accent-pink-500"
                        />
                         <div className="flex items-center justify-center min-w-[32px] h-8 bg-[#0f0f0f] border border-[#333] rounded text-white font-mono font-bold">
                             {formData.consecutiveCandles}
                         </div>
                    </div>
                    <p className="text-[10px] text-gray-600 mt-2">
                        Bot will trigger after <span className="text-gray-400 font-bold">{formData.consecutiveCandles}</span> consecutive candles of the same color.
                    </p>
                </div>
             </div>
          </div>

          {/* Safety Settings */}
          <div className="bg-[#0f0f0f]/50 rounded-xl border border-[#2a2a2a] overflow-hidden">
             <button 
                 type="button"
                 onClick={() => setIsSafetyOpen(!isSafetyOpen)}
                 className="w-full bg-[#0f0f0f] px-4 py-3 border-b border-[#2a2a2a] flex items-center justify-between hover:bg-[#151515] transition-colors outline-none focus:outline-none"
             >
                 <div className="flex items-center gap-2">
                     <Shield size={16} className="text-emerald-400" />
                     <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wide">Safety Settings</h3>
                 </div>
                 <ChevronDown 
                     size={16} 
                     className={cn("text-gray-500 transition-transform duration-300", isSafetyOpen ? "rotate-180" : "")} 
                 />
             </button>
             
             <AnimatePresence>
                 {isSafetyOpen && (
                     <motion.div
                         initial={{ height: 0, opacity: 0 }}
                         animate={{ height: "auto", opacity: 1 }}
                         exit={{ height: 0, opacity: 0 }}
                         transition={{ duration: 0.3, ease: "easeInOut" }}
                         className="overflow-hidden"
                     >
                         <div className="p-4 space-y-5">
                             {/* Cooldown */}
                             <div>
                                 <label className="block text-gray-500 text-[10px] font-bold mb-1.5 uppercase">Cooldown</label>
                                 <div className="flex gap-2">
                                      <input 
                                         type="number" 
                                         min="0"
                                         value={formData.cooldownDuration}
                                         onChange={(e) => setFormData({...formData, cooldownDuration: parseInt(e.target.value) || 0})}
                                         className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] text-white text-sm font-bold rounded-lg px-3 py-2 focus:border-emerald-500 outline-none transition-colors"
                                      />
                                      <div className="relative w-28">
                                         <select 
                                             value={formData.cooldownUnit}
                                             onChange={(e) => setFormData({...formData, cooldownUnit: e.target.value})}
                                             className="w-full appearance-none bg-[#1a1a1a] border border-[#2a2a2a] text-white text-sm font-bold rounded-lg px-3 py-2 focus:border-emerald-500 outline-none transition-colors"
                                         >
                                             <option>Sec</option>
                                             <option>Min</option>
                                             <option>Hour</option>
                                         </select>
                                         <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={14} />
                                      </div>
                                 </div>
                                 <p className="text-[10px] text-gray-600 mt-1.5">Wait time between trades</p>
                             </div>

                             {/* One Trade at a Time */}
                             <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-[#1a1a1a]/50 transition-colors">
                                  <input 
                                     type="checkbox" 
                                     id="oneTrade"
                                     checked={formData.oneTradeAtATime}
                                     onChange={(e) => setFormData({...formData, oneTradeAtATime: e.target.checked})}
                                     className="mt-0.5 w-4 h-4 accent-emerald-500 rounded bg-[#1a1a1a] border-gray-600 cursor-pointer"
                                  />
                                  <div>
                                      <label htmlFor="oneTrade" className="text-xs font-bold text-gray-300 cursor-pointer block select-none">One trade at a time</label>
                                      <p className="text-[10px] text-gray-600 mt-0.5">Only one trade can be active at a time</p>
                                  </div>
                             </div>

                             {/* Max Trades Per Day */}
                              <div className="space-y-3">
                                 <div className="flex items-center gap-3 px-2">
                                      <input 
                                         type="checkbox" 
                                         id="maxTrades"
                                         checked={formData.maxTradesEnabled}
                                         onChange={(e) => setFormData({...formData, maxTradesEnabled: e.target.checked})}
                                         className="w-4 h-4 accent-emerald-500 rounded bg-[#1a1a1a] border-gray-600 cursor-pointer"
                                      />
                                      <label htmlFor="maxTrades" className="text-xs font-bold text-gray-300 cursor-pointer block select-none">Max Trades Per Day</label>
                                 </div>
                                 
                                 <div className={cn("transition-all duration-300 pl-2", formData.maxTradesEnabled ? "opacity-100" : "opacity-40 pointer-events-none grayscale")}>
                                     <input 
                                         type="number" 
                                         min="1"
                                         value={formData.maxTradesPerDay}
                                         onChange={(e) => setFormData({...formData, maxTradesPerDay: parseInt(e.target.value) || 0})}
                                         disabled={!formData.maxTradesEnabled}
                                         className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white text-sm font-bold rounded-lg px-3 py-2 focus:border-emerald-500 outline-none transition-colors"
                                      />
                                      <p className="text-[10px] text-gray-600 mt-1.5">Limits total trades in a 24-hour period</p>
                                 </div>
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
            className="w-full py-4 mt-4 bg-transparent border-2 border-pink-500/50 hover:border-pink-400 rounded-full text-white font-bold text-base hover:bg-pink-500/10 transition-all flex items-center justify-center gap-2 shadow-none"
          >
             <Flame size={20} className="fill-current" />
             <span>Create Bot{templates.find(t => t.id === selectedTemplateId)?.symbols?.length > 1 ? 's' : ''}</span>
          </motion.button>
       </form>
    </div>
  );
};

export default CandleStrikeBotBuilder;