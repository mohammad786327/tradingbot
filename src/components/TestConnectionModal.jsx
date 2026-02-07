import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const TestConnectionModal = ({ isOpen, onClose, status, message, timestamp }) => {
  // Auto close on success
  useEffect(() => {
    if (isOpen && status === 'success') {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, status, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl shadow-2xl overflow-hidden p-6"
        >
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>

          <div className="flex flex-col items-center text-center space-y-4 pt-2">
            
            {status === 'loading' && (
              <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-2">
                 <Loader2 size={32} className="text-blue-500 animate-spin" />
              </div>
            )}

            {status === 'success' && (
               <motion.div 
                 initial={{ scale: 0 }}
                 animate={{ scale: 1 }}
                 className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-2"
               >
                 <CheckCircle size={32} className="text-green-500" />
               </motion.div>
            )}

            {status === 'error' && (
               <motion.div 
                 initial={{ scale: 0 }}
                 animate={{ scale: 1 }}
                 className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-2"
               >
                 <AlertCircle size={32} className="text-red-500" />
               </motion.div>
            )}

            <h3 className="text-xl font-bold text-white">
              {status === 'loading' && 'Testing Connection...'}
              {status === 'success' && 'Connection Successful!'}
              {status === 'error' && 'Connection Failed'}
            </h3>

            <p className="text-gray-400 text-sm max-w-[80%]">
              {status === 'loading' && 'Verifying API keys and permissions with the exchange...'}
              {message}
            </p>

            {timestamp && status !== 'loading' && (
              <p className="text-xs text-gray-600 font-mono mt-4">
                Tested at: {new Date(timestamp).toLocaleTimeString()}
              </p>
            )}

            {status !== 'loading' && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="mt-6 px-6 py-2 bg-[#2a2a2a] hover:bg-[#333] text-white rounded-lg text-sm font-medium transition-colors w-full"
              >
                Close
              </motion.button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TestConnectionModal;