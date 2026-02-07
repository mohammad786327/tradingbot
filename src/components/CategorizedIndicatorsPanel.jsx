import React, { useState, useEffect } from 'react';
import { 
  Search, ChevronDown, ChevronUp, Plus, Check, Trash2,
  TrendingUp, Activity, BarChart2, Zap, Layers, Code
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const DEFAULT_CATEGORIES = [
  {
    id: 'trend',
    name: 'Trend',
    icon: TrendingUp,
    color: 'text-blue-400',
    items: ['SMA', 'EMA', 'Keltner Channels', 'Parabolic SAR', 'Supertrend', 'Ichimoku Cloud']
  },
  {
    id: 'momentum',
    name: 'Momentum',
    icon: Activity,
    color: 'text-purple-400',
    items: ['RSI', 'Stochastic', 'Williams %R', 'ROC', 'CCI', 'MACD']
  },
  {
    id: 'volatility',
    name: 'Volatility',
    icon: Zap,
    color: 'text-yellow-400',
    items: ['Bollinger Bands', 'ATR', 'Historical Volatility']
  },
  {
    id: 'volume',
    name: 'Volume',
    icon: BarChart2,
    color: 'text-green-400',
    items: ['Volume', 'OBV', 'Accumulation/Distribution']
  },
  {
    id: 'strength',
    name: 'Trend Strength',
    icon: Layers,
    color: 'text-red-400',
    items: ['ADX']
  }
];

const CategorizedIndicatorsPanel = ({ onAddIndicator, activeIndicators = [], onCreateCustom }) => {
  const [expandedCategory, setExpandedCategory] = useState('momentum');
  const [searchTerm, setSearchTerm] = useState('');
  const [customIndicators, setCustomIndicators] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);

  // Load custom indicators
  useEffect(() => {
    const loadCustom = () => {
        try {
            const saved = localStorage.getItem('customIndicators');
            if (saved) {
                const parsed = JSON.parse(saved);
                setCustomIndicators(parsed);
            }
        } catch (e) { console.error(e); }
    };
    loadCustom();
    
    // Listen for storage events (if multiple tabs or rapid updates) or pass callback prop?
    // For now, simpler to just re-read when component mounts or updates.
    // Ideally parent triggers reload.
  }, []); // Reload when mounted. 

  // Re-build categories with Custom
  useEffect(() => {
    const customCat = {
        id: 'custom',
        name: 'Custom Scripts',
        icon: Code,
        color: 'text-pink-400',
        items: customIndicators // These are objects, not just strings
    };
    setCategories([...DEFAULT_CATEGORIES, customCat]);
  }, [customIndicators]);

  const toggleCategory = (id) => {
    setExpandedCategory(expandedCategory === id ? null : id);
  };

  const deleteCustomIndicator = (e, id) => {
      e.stopPropagation();
      const newCustom = customIndicators.filter(i => i.id !== id);
      setCustomIndicators(newCustom);
      localStorage.setItem('customIndicators', JSON.stringify(newCustom));
  };

  const isActive = (item) => {
      // item could be string name or object
      const name = typeof item === 'string' ? item : item.name;
      return activeIndicators.some(ind => ind.name === name);
  };

  const filteredCategories = categories.map(cat => {
      let items = cat.items;
      if (searchTerm) {
          items = items.filter(item => {
              const name = typeof item === 'string' ? item : item.name;
              return name.toLowerCase().includes(searchTerm.toLowerCase());
          });
      }
      return { ...cat, items };
  }).filter(cat => cat.items.length > 0);

  return (
    <div className="flex flex-col h-full bg-[#1a1a1a] rounded-xl overflow-hidden border border-[#2a2a2a]">
      {/* Search Header */}
      <div className="p-3 border-b border-[#2a2a2a] bg-[#1f1f1f] space-y-2">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search indicators..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:border-blue-500 outline-none transition-colors"
          />
        </div>
        <button 
            onClick={onCreateCustom}
            className="w-full py-1.5 flex items-center justify-center gap-2 bg-purple-900/20 hover:bg-purple-900/40 text-purple-400 border border-purple-900/50 rounded-lg text-xs font-bold transition-all"
        >
            <Code size={14} />
            Create Custom Indicator
        </button>
      </div>

      {/* Categories List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-2 space-y-2">
          {filteredCategories.map((category) => (
            <div key={category.id} className="border border-[#2a2a2a] rounded-lg overflow-hidden bg-[#0f0f0f]">
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between p-3 hover:bg-[#1f1f1f] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <category.icon size={16} className={category.color} />
                  <span className="text-sm font-bold text-gray-300">{category.name}</span>
                </div>
                {expandedCategory === category.id ? (
                  <ChevronUp size={14} className="text-gray-500" />
                ) : (
                  <ChevronDown size={14} className="text-gray-500" />
                )}
              </button>

              <AnimatePresence>
                {(expandedCategory === category.id || searchTerm) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-[#2a2a2a] bg-[#151515]"
                  >
                    <div className="p-1 space-y-1">
                      {category.items.map((item) => {
                        const isCustom = category.id === 'custom';
                        const itemName = isCustom ? item.name : item;
                        const active = isActive(item);
                        
                        return (
                            <button
                            key={isCustom ? item.id : item}
                            onClick={() => onAddIndicator(item)}
                            className={cn(
                                "w-full flex items-center justify-between p-2 rounded group transition-colors text-left",
                                active ? "bg-blue-500/10" : "hover:bg-[#252525]"
                            )}
                            >
                            <span className={cn("text-xs transition-colors", active ? "text-blue-400 font-bold" : "text-gray-400 group-hover:text-white")}>
                                {itemName}
                            </span>
                            <div className="flex items-center gap-1">
                                {active && <Check size={12} className="text-blue-500" />}
                                {isCustom && (
                                    <div 
                                        role="button"
                                        onClick={(e) => deleteCustomIndicator(e, item.id)}
                                        className="p-1 hover:text-red-500 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 size={12} />
                                    </div>
                                )}
                                {!active && (
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-blue-500/20 rounded text-blue-400">
                                        <Plus size={12} />
                                    </div>
                                )}
                            </div>
                            </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}

          {filteredCategories.length === 0 && (
            <div className="text-center text-gray-500 py-8 text-xs">
              No indicators found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategorizedIndicatorsPanel;