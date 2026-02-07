import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import ExchangeAccountForm from './ExchangeAccountForm';

const ExchangeAccountModal = ({ isOpen, onClose, initialData, onSubmit, title }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Container */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative w-full max-w-2xl bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[#2a2a2a]">
                    <h2 className="text-xl font-bold text-white bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        {title}
                    </h2>
                    <button 
                        onClick={onClose}
                        className="p-2 text-gray-500 hover:text-white hover:bg-[#2a2a2a] rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <ExchangeAccountForm 
                        initialData={initialData}
                        onSubmit={onSubmit}
                        onCancel={onClose}
                    />
                </div>
            </motion.div>
        </div>
    </AnimatePresence>
  );
};

export default ExchangeAccountModal;