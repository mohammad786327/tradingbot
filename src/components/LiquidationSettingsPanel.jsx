import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const VIZ_STYLES = [
  'Price Level Markers', 
  'Overlay Bands', 
  'Heatmap', 
  'Separate Panel', 
  'Candlestick Coloring'
];

const TYPE_CONFIG = {
  long: { label: 'Long Liqs', color: 'bg-red-500', ring: 'ring-red-500/50' },
  short: { label: 'Short Liqs', color: 'bg-green-500', ring: 'ring-green-500/50' },
  total: { label: 'Total Liqs', color: 'bg-blue-500', ring: 'ring-blue-500/50' },
};

const LiquidationSettingsPanel = ({ settings, setSettings }) => {
  
  const handleToggleMaster = (enabled) => {
    setSettings(prev => ({ ...prev, enabled }));
  };

  const handleToggleType = (type) => {
    setSettings(prev => ({
      ...prev,
      types: {
        ...prev.types,
        [type]: { ...prev.types[type], enabled: !prev.types[type].enabled }
      }
    }));
  };

  const handleStyleChange = (type, style) => {
    setSettings(prev => ({
      ...prev,
      types: {
        ...prev.types,
        [type]: { ...prev.types[type], style }
      }
    }));
  };

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3 space-y-4">
      <div className="flex items-center justify-between">
        <label htmlFor="master-toggle" className="text-sm font-bold text-white">Show Liquidations</label>
        <button
          id="master-toggle"
          onClick={() => handleToggleMaster(!settings.enabled)}
          className={cn(
            "w-10 h-5 rounded-full relative transition-colors",
            settings.enabled ? 'bg-blue-600' : 'bg-gray-700'
          )}
        >
          <motion.div 
            className="w-4 h-4 bg-white rounded-full absolute top-0.5"
            animate={{ x: settings.enabled ? 22 : 2 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </button>
      </div>

      <AnimatePresence>
        {settings.enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 overflow-hidden"
          >
            {Object.keys(TYPE_CONFIG).map((type) => (
              <div key={type} className="bg-[#0f0f0f] p-2 rounded-lg border border-[#2a2a2a]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", TYPE_CONFIG[type].color)} />
                    <label htmlFor={`${type}-toggle`} className="text-xs font-medium text-gray-300">
                      {TYPE_CONFIG[type].label}
                    </label>
                  </div>
                  <button
                    id={`${type}-toggle`}
                    onClick={() => handleToggleType(type)}
                    className={cn(
                        "w-8 h-4 rounded-full relative transition-colors",
                        settings.types[type].enabled ? TYPE_CONFIG[type].color : 'bg-gray-600'
                    )}
                  >
                     <motion.div className="w-3 h-3 bg-white rounded-full absolute top-0.5"
                         animate={{ x: settings.types[type].enabled ? 18 : 2 }}
                         transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                     />
                  </button>
                </div>
                {settings.types[type].enabled && (
                   <div className="mt-2">
                      <select 
                        value={settings.types[type].style}
                        onChange={(e) => handleStyleChange(type, e.target.value)}
                        className="w-full bg-[#1a1a1a] border border-[#3a3a3a] text-xs text-white rounded p-1.5 outline-none focus:ring-1 focus:ring-blue-500"
                      >
                          {VIZ_STYLES.map(style => (
                            <option key={style} value={style}>{style}</option>
                          ))}
                      </select>
                   </div>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LiquidationSettingsPanel;