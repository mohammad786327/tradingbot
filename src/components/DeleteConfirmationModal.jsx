
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, itemType = 'items', count = 1 }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                <AlertTriangle size={24} />
              </div>
              <button 
                onClick={onClose}
                className="p-1 text-gray-500 hover:text-white hover:bg-[#2a2a2a] rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <h3 className="text-xl font-bold text-white mb-2">Delete {count > 1 ? `${count} ` : ''}{itemType}?</h3>
            <p className="text-gray-400 text-sm mb-6">
              This action cannot be undone. This will permanently remove the selected {itemType.toLowerCase()} from your list.
            </p>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#333] font-bold text-gray-300 hover:bg-[#2a2a2a] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-900/20"
              >
                <Trash2 size={18} />
                Delete
              </button>
            </div>
          </div>
          <div className="h-1 w-full bg-[#2a2a2a]">
             <motion.div 
               className="h-full bg-red-600" 
               initial={{ width: "100%" }} 
               animate={{ width: "0%" }} 
               transition={{ duration: 5 }} 
             />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DeleteConfirmationModal;
