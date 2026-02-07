import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, XCircle, CheckCircle2 } from 'lucide-react';
import TradeHistoryModal from './TradeHistoryModal';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, type = 'warning', confirmText = 'Confirm' }) => {
    if (!isOpen) return null;

    const colors = {
        warning: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', btn: 'bg-red-600 hover:bg-red-700' },
        info: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', btn: 'bg-blue-600 hover:bg-blue-700' },
    };

    const style = colors[type];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="relative w-full max-w-sm bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-xl overflow-hidden p-6"
                >
                    <div className={`w-12 h-12 rounded-full ${style.bg} flex items-center justify-center mb-4`}>
                        {type === 'warning' ? <AlertTriangle className={style.text} /> : <CheckCircle2 className={style.text} />}
                    </div>
                    
                    <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                    <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                        {message}
                    </p>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-2.5 bg-[#252525] hover:bg-[#303030] text-gray-300 rounded-lg text-sm font-bold transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => { onConfirm(); onClose(); }}
                            className={`flex-1 py-2.5 ${style.btn} text-white rounded-lg text-sm font-bold transition-colors shadow-lg`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

const TradeActionsModal = ({ 
    activeAction, // 'close', 'delete', 'history', null
    onClose, 
    onConfirmClose, 
    onConfirmDelete, 
    trade 
}) => {
    
    if (activeAction === 'history') {
        return <TradeHistoryModal isOpen={true} onClose={onClose} trade={trade} />;
    }

    if (activeAction === 'close') {
        return (
            <ConfirmationModal
                isOpen={true}
                onClose={onClose}
                onConfirm={() => onConfirmClose(trade)}
                title="Close Position?"
                message={`Are you sure you want to close the position for ${trade?.coinName}? This will realize the current PNL.`}
                type="warning"
                confirmText="Close Trade"
            />
        );
    }

    if (activeAction === 'delete') {
         return (
            <ConfirmationModal
                isOpen={true}
                onClose={onClose}
                onConfirm={() => onConfirmDelete(trade)}
                title="Delete Trade Record?"
                message="This will permanently remove this trade from your history. This action cannot be undone."
                type="warning"
                confirmText="Delete Forever"
            />
        );
    }

    return null;
};

export default TradeActionsModal;