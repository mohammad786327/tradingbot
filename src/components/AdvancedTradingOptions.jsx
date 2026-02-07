import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings2, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const AdvancedTradingOptions = ({ isOpen, onClose, onApply, currentOptions }) => {
  const [options, setOptions] = useState(currentOptions || {
    timeInForce: 'GTC',
    postOnly: false,
    reduceOnly: false,
    trailingStop: { enabled: false, value: '', type: 'percentage' },
    goodTillDate: null
  });

  // Ensure internal state syncs with props when reopening
  useEffect(() => {
    if (isOpen && currentOptions) {
      setOptions(currentOptions);
    }
  }, [isOpen, currentOptions]);

  const handleApply = () => {
    onApply(options);
    onClose();
  };

  const toggleTrailingStop = () => {
    setOptions(prev => ({
      ...prev,
      trailingStop: { ...prev.trailingStop, enabled: !prev.trailingStop.enabled }
    }));
  };

  // Use Portal to render modal outside of parent containers that might have overflow:hidden or transforms
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
          />
          
          {/* Modal - Centered Positioning */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: '-40%', x: '-50%' }}
            animate={{ opacity: 1, scale: 1, y: '-50%', x: '-50%' }}
            exit={{ opacity: 0, scale: 0.95, y: '-40%', x: '-50%' }}
            transition={{ type: "spring", duration: 0.3 }}
            className="fixed left-1/2 top-1/2 w-full max-w-md bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-2xl z-[9999] overflow-hidden"
            style={{ transform: 'translate(-50%, -50%)' }} 
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2a] bg-[#1f1f1f]">
              <div className="flex items-center gap-2">
                <Settings2 size={18} className="text-blue-500" />
                <h3 className="font-bold text-white">Advanced Options</h3>
              </div>
              <button 
                onClick={onClose}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              
              {/* Time In Force */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Time in Force</label>
                <div className="grid grid-cols-4 gap-2">
                  {['GTC', 'IOC', 'FOK', 'PO'].map((tif) => (
                    <button
                      key={tif}
                      onClick={() => setOptions({ ...options, timeInForce: tif })}
                      className={cn(
                        "py-2 px-1 rounded-lg text-xs font-bold border transition-all text-center",
                        options.timeInForce === tif
                          ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                          : "bg-[#0f0f0f] text-gray-500 border-[#2a2a2a] hover:border-gray-600"
                      )}
                    >
                      {tif}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-gray-600">
                  {options.timeInForce === 'GTC' && "Good Till Cancelled - The order remains active until filled or cancelled."}
                  {options.timeInForce === 'IOC' && "Immediate or Cancel - The order must be filled immediately, partially or fully. Unfilled parts are cancelled."}
                  {options.timeInForce === 'FOK' && "Fill or Kill - The order must be filled immediately in its entirety or not at all."}
                  {options.timeInForce === 'PO' && "Post Only - The order will only be added to the order book and never take liquidity."}
                </p>
              </div>

              {/* Checkboxes */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Order Settings</label>
                
                <div 
                  onClick={() => setOptions({ ...options, postOnly: !options.postOnly })}
                  className="flex items-center justify-between p-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg cursor-pointer hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                      options.postOnly ? "bg-blue-500 border-blue-500" : "border-gray-600 bg-transparent"
                    )}>
                      {options.postOnly && <Check size={12} className="text-white" />}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-white block">Post Only</span>
                      <span className="text-[10px] text-gray-500 block">Ensure maker rebate, never take liquidity</span>
                    </div>
                  </div>
                </div>

                <div 
                  onClick={() => setOptions({ ...options, reduceOnly: !options.reduceOnly })}
                  className="flex items-center justify-between p-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg cursor-pointer hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                      options.reduceOnly ? "bg-blue-500 border-blue-500" : "border-gray-600 bg-transparent"
                    )}>
                      {options.reduceOnly && <Check size={12} className="text-white" />}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-white block">Reduce Only</span>
                      <span className="text-[10px] text-gray-500 block">Only reduce position, never increase</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trailing Stop */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Trailing Stop</label>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setOptions(prev => ({ 
                        ...prev, 
                        trailingStop: { ...prev.trailingStop, type: 'percentage' } 
                      }))}
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded transition-colors",
                        options.trailingStop.type === 'percentage' ? "bg-blue-500/20 text-blue-400" : "text-gray-500 hover:text-gray-300"
                      )}
                    >
                      %
                    </button>
                    <button 
                      onClick={() => setOptions(prev => ({ 
                        ...prev, 
                        trailingStop: { ...prev.trailingStop, type: 'amount' } 
                      }))}
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded transition-colors",
                        options.trailingStop.type === 'amount' ? "bg-blue-500/20 text-blue-400" : "text-gray-500 hover:text-gray-300"
                      )}
                    >
                      $
                    </button>
                  </div>
                </div>
                
                <div className={cn(
                  "p-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg transition-colors",
                  options.trailingStop.enabled ? "opacity-100" : "opacity-60"
                )}>
                  <div className="flex items-center gap-3 mb-3">
                     <div 
                        onClick={toggleTrailingStop}
                        className={cn(
                          "w-10 h-5 rounded-full relative transition-colors cursor-pointer",
                          options.trailingStop.enabled ? "bg-blue-500" : "bg-gray-600"
                        )}
                     >
                       <div className={cn(
                         "absolute top-1 w-3 h-3 bg-white rounded-full transition-transform",
                         options.trailingStop.enabled ? "left-6" : "left-1"
                       )} />
                     </div>
                     <span className="text-sm font-medium text-white">Enable Trailing Stop</span>
                  </div>
                  
                  {options.trailingStop.enabled && (
                    <div className="relative">
                      <input
                        type="number"
                        placeholder={options.trailingStop.type === 'percentage' ? "Delta % (e.g. 1.5)" : "Delta Amount"}
                        value={options.trailingStop.value}
                        onChange={(e) => setOptions({
                          ...options,
                          trailingStop: { ...options.trailingStop, value: e.target.value }
                        })}
                        className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg py-2 px-3 text-sm text-white focus:border-blue-500 outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 bg-[#1f1f1f] border-t border-[#2a2a2a] flex gap-3">
              <button 
                onClick={onClose}
                className="flex-1 py-2.5 rounded-lg border border-[#3a3a3a] text-gray-300 text-sm font-bold hover:bg-[#2a2a2a] transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleApply}
                className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20"
              >
                Apply Changes
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default AdvancedTradingOptions;