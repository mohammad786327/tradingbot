import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const GridBotEditModal = ({ isOpen, onClose, position, onSave }) => {
  const [formData, setFormData] = useState({
    lowerPrice: '',
    upperPrice: '',
    numGrids: '',
    stopLoss: '',
    takeProfit: ''
  });

  useEffect(() => {
    if (position) {
      setFormData({
        lowerPrice: position.lowerPrice || '',
        upperPrice: position.upperPrice || '',
        numGrids: position.numGrids || '',
        stopLoss: position.stopLoss || '', // Assuming these fields might exist or be added
        takeProfit: position.takeProfit || ''
      });
    }
  }, [position]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...position,
      lowerPrice: parseFloat(formData.lowerPrice),
      upperPrice: parseFloat(formData.upperPrice),
      numGrids: parseInt(formData.numGrids),
      stopLoss: formData.stopLoss ? parseFloat(formData.stopLoss) : null,
      takeProfit: formData.takeProfit ? parseFloat(formData.takeProfit) : null
    });
    onClose();
  };

  if (!isOpen || !position) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[#1a1a1a] w-full max-w-md rounded-2xl border border-[#2a2a2a] shadow-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a] bg-[#0f0f0f]">
            <div>
              <h2 className="text-lg font-bold text-white">Edit Bot Configuration</h2>
              <p className="text-xs text-gray-400 font-mono mt-0.5">{position.symbol} • {position.gridType}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-[#2a2a2a] rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex gap-3">
              <AlertTriangle className="text-yellow-500 shrink-0" size={20} />
              <div className="text-xs text-yellow-200/80 leading-relaxed">
                Modifying grid parameters will restart the bot. Current active orders will be cancelled and replaced.
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">Lower Price</label>
                <input
                  type="number"
                  required
                  value={formData.lowerPrice}
                  onChange={(e) => setFormData({ ...formData, lowerPrice: e.target.value })}
                  className="w-full bg-[#0f0f0f] border border-[#2a2a2a] text-white text-sm font-bold rounded-lg px-3 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">Upper Price</label>
                <input
                  type="number"
                  required
                  value={formData.upperPrice}
                  onChange={(e) => setFormData({ ...formData, upperPrice: e.target.value })}
                  className="w-full bg-[#0f0f0f] border border-[#2a2a2a] text-white text-sm font-bold rounded-lg px-3 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">Number of Grids</label>
              <input
                type="number"
                required
                min="2"
                max="100"
                value={formData.numGrids}
                onChange={(e) => setFormData({ ...formData, numGrids: e.target.value })}
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] text-white text-sm font-bold rounded-lg px-3 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#2a2a2a]">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 bg-[#2a2a2a] hover:bg-[#333] text-gray-300 font-bold rounded-xl transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Save size={16} />
                Save Changes
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default GridBotEditModal;