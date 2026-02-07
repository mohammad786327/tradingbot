import React, { useState } from 'react';
import { Settings, Plus, Trash2, Eye, EyeOff, List, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import CategorizedIndicatorsPanel from './CategorizedIndicatorsPanel';
import CustomIndicatorPanel from './CustomIndicatorPanel';

const TechnicalIndicatorsPanel = ({ activeIndicators, onUpdateIndicators, onAddPanel }) => {
  const [activeTab, setActiveTab] = useState('list');
  const [showCustomCreator, setShowCustomCreator] = useState(false);

  const removeIndicator = (id) => {
    // Notify parent to remove (works for both overlays and panels if parent handles it unified)
    // The parent callback onUpdateIndicators handles activeIndicators list
    // But panels are handled by onRemovePanel in parent usually.
    // The parent needs to provide a unified removal or we need to know the type.
    
    // Assuming activeIndicators contains BOTH panels and overlays as requested by user in Task 1
    // "activeIndicators state that tracks ALL currently active indicators"
    onUpdateIndicators(activeIndicators.filter(i => i.id !== id));
  };

  const toggleIndicator = (id) => {
    onUpdateIndicators(activeIndicators.map(i => i.id === id ? { ...i, enabled: !i.enabled } : i));
  };

  const updateParam = (id, param, value) => {
    onUpdateIndicators(activeIndicators.map(i => i.id === id ? { ...i, [param]: value } : i));
  };

  const handleAdd = (indicatorItem) => {
      // indicatorItem can be a string (built-in) or object (custom)
      const isCustom = typeof indicatorItem === 'object';
      const type = isCustom ? indicatorItem.name : indicatorItem;
      
      const overlayTypes = ['SMA', 'EMA', 'Bollinger Bands', 'Keltner Channels', 'Parabolic SAR', 'Supertrend', 'Ichimoku Cloud'];
      let isOverlay = overlayTypes.includes(type);
      if (isCustom) isOverlay = indicatorItem.isOverlay;

      if (isOverlay) {
          let config = { 
              id: Date.now(),
              type: type, 
              name: isCustom ? indicatorItem.name : type, 
              enabled: true, 
              period: 20, 
              color: '#fbbf24',
              isOverlay: true 
          };
          
          if (type === 'Bollinger Bands') config = { ...config, type: 'Bollinger', period: 20, stdDev: 2, color: '#3b82f6' };
          
          if (isCustom) {
              config = { 
                  ...config, 
                  ...indicatorItem, 
                  color: '#e879f9'
              };
          }

          onUpdateIndicators([...activeIndicators, config]);
      } else {
          // Panel Indicator
          if (onAddPanel) {
              onAddPanel(isCustom ? indicatorItem : type);
          }
      }
      setActiveTab('list');
  };

  const handleCustomSaved = (newIndicator) => {
      try {
          const existing = JSON.parse(localStorage.getItem('customIndicators') || '[]');
          localStorage.setItem('customIndicators', JSON.stringify([...existing, newIndicator]));
      } catch(e) {}
      
      setShowCustomCreator(false);
      setActiveTab('add'); 
  };

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl flex flex-col h-full overflow-hidden">
      <div className="p-3 border-b border-[#2a2a2a] flex justify-between items-center bg-[#1f1f1f]">
        <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Settings size={14} className="text-blue-500" />
            Indicators
        </h3>
        <div className="flex bg-[#0f0f0f] rounded p-0.5 border border-[#2a2a2a]">
            <button 
                onClick={() => setActiveTab('list')}
                className={cn("p-1 rounded text-xs transition-colors", activeTab === 'list' ? "bg-[#2a2a2a] text-white" : "text-gray-500")}
                title="Active Indicators"
            >
                <List size={14} />
            </button>
            <button 
                onClick={() => setActiveTab('add')}
                className={cn("p-1 rounded text-xs transition-colors", activeTab === 'add' ? "bg-[#2a2a2a] text-white" : "text-gray-500")}
                title="Add Indicator"
            >
                <Plus size={14} />
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        {showCustomCreator ? (
            <div className="absolute inset-0 z-20">
                <CustomIndicatorPanel 
                    onClose={() => setShowCustomCreator(false)}
                    onSave={handleCustomSaved}
                />
            </div>
        ) : activeTab === 'add' ? (
            <div className="absolute inset-0 z-10 bg-[#1a1a1a]">
                <CategorizedIndicatorsPanel 
                    onAddIndicator={handleAdd} 
                    activeIndicators={activeIndicators}
                    onCreateCustom={() => setShowCustomCreator(true)}
                />
            </div>
        ) : (
            <div className="h-full overflow-y-auto p-2 space-y-2 custom-scrollbar">
                {activeIndicators.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                        <AlertCircle className="mb-2 opacity-50" size={24} />
                        <span className="text-xs">No active indicators</span>
                        <button onClick={() => setActiveTab('add')} className="mt-2 text-blue-400 text-xs hover:underline">
                            Add Indicator
                        </button>
                    </div>
                )}
                <AnimatePresence>
                    {activeIndicators.map(ind => (
                        <motion.div
                            key={ind.id}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-3 shadow-sm hover:border-gray-700 transition-colors"
                        >
                            <div className="flex justify-between items-center mb-3">
                                <div className="flex items-center gap-2">
                                    <div className={cn("w-1.5 h-1.5 rounded-full", ind.enabled ? "bg-green-500" : "bg-gray-500")} />
                                    <span className="text-xs font-bold text-gray-300">
                                        {ind.name}
                                    </span>
                                    {ind.isCustom && <span className="text-[9px] bg-purple-900/50 text-purple-300 px-1 rounded border border-purple-800">SCRIPT</span>}
                                    {!ind.isOverlay && <span className="text-[9px] bg-blue-900/50 text-blue-300 px-1 rounded border border-blue-800">PANEL</span>}
                                </div>
                                <div className="flex items-center gap-1">
                                    {ind.isOverlay && (
                                        <button onClick={() => toggleIndicator(ind.id)} className="p-1 text-gray-500 hover:text-white transition-colors">
                                            {ind.enabled ? <Eye size={14} /> : <EyeOff size={14} />}
                                        </button>
                                    )}
                                    <button onClick={() => removeIndicator(ind.id)} className="p-1 text-gray-500 hover:text-red-500 transition-colors">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                            
                            {ind.enabled && ind.isOverlay && !ind.isCustom && (
                                <div className="grid grid-cols-2 gap-3 bg-[#151515] p-2 rounded border border-[#2a2a2a]/50">
                                    <div>
                                        <label className="text-[10px] text-gray-500 block mb-1">Period</label>
                                        <input 
                                            type="number" 
                                            value={ind.period || ''}
                                            onChange={(e) => updateParam(ind.id, 'period', parseInt(e.target.value))}
                                            className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded px-2 py-1 text-xs text-white focus:border-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-gray-500 block mb-1">Color</label>
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="color" 
                                                value={ind.color}
                                                onChange={(e) => updateParam(ind.id, 'color', e.target.value)}
                                                className="w-6 h-6 bg-transparent border-none rounded cursor-pointer p-0"
                                            />
                                            <span className="text-[10px] text-gray-500 font-mono">{ind.color}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        )}
      </div>
    </div>
  );
};

export default TechnicalIndicatorsPanel;