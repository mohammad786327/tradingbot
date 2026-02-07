import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const ExchangeAccountForm = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    exchange: 'Binance',
    apiKey: '',
    apiSecret: '',
    passphrase: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        exchange: initialData.exchange || 'Binance',
        apiKey: initialData.apiKey || '',
        apiSecret: initialData.apiSecret || '',
        passphrase: initialData.passphrase || ''
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Account name is required';
    if (!formData.apiKey.trim()) newErrors.apiKey = 'API Key is required';
    if (formData.apiKey.length < 10) newErrors.apiKey = 'API Key seems too short';
    if (!formData.apiSecret.trim()) newErrors.apiSecret = 'API Secret is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const exchanges = ['Binance', 'Kraken', 'Coinbase', 'Bybit', 'OKX', 'KuCoin'];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* Name & Exchange */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400">Account Name</label>
          <input 
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. My Main Binance"
            className={cn(
                "w-full bg-[#0f0f0f] border rounded-lg px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 transition-all",
                errors.name ? "border-red-500/50 focus:border-red-500" : "border-[#2a2a2a] focus:border-blue-500"
            )}
          />
          {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400">Exchange</label>
          <select 
            name="exchange"
            value={formData.exchange}
            onChange={handleChange}
            className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none cursor-pointer"
          >
            {exchanges.map(ex => (
                <option key={ex} value={ex}>{ex}</option>
            ))}
          </select>
        </div>
      </div>

      {/* API Credentials */}
      <div className="space-y-4 pt-2">
         <h4 className="text-sm font-bold text-gray-300 border-b border-[#2a2a2a] pb-2 mb-4">API Credentials</h4>
         
         <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400">API Key</label>
          <input 
            type="text"
            name="apiKey"
            value={formData.apiKey}
            onChange={handleChange}
            placeholder="Paste your API key here"
            className={cn(
                "w-full bg-[#0f0f0f] border rounded-lg px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 transition-all font-mono text-sm",
                errors.apiKey ? "border-red-500/50 focus:border-red-500" : "border-[#2a2a2a] focus:border-blue-500"
            )}
          />
          {errors.apiKey && <p className="text-xs text-red-400">{errors.apiKey}</p>}
         </div>

         <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400">API Secret</label>
          <input 
            type="password"
            name="apiSecret"
            value={formData.apiSecret}
            onChange={handleChange}
            placeholder="Paste your API secret here"
            className={cn(
                "w-full bg-[#0f0f0f] border rounded-lg px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 transition-all font-mono text-sm",
                errors.apiSecret ? "border-red-500/50 focus:border-red-500" : "border-[#2a2a2a] focus:border-blue-500"
            )}
          />
          {errors.apiSecret && <p className="text-xs text-red-400">{errors.apiSecret}</p>}
         </div>

         <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400">Passphrase (Optional)</label>
          <input 
            type="password"
            name="passphrase"
            value={formData.passphrase}
            onChange={handleChange}
            placeholder="Only required for some exchanges like OKX"
            className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono text-sm"
          />
         </div>
      </div>
      
      {/* Warning Box */}
      <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3 flex gap-3 items-start">
         <AlertCircle className="text-yellow-500 shrink-0 mt-0.5" size={16} />
         <p className="text-xs text-yellow-500/90 leading-relaxed">
            Your API keys are encrypted and stored locally. Never share your keys. Ensure you have enabled "Spot Trading" permissions but <strong>disabled "Withdrawals"</strong> on your exchange settings.
         </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button 
          type="button" 
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 px-4 py-3 bg-[#2a2a2a] hover:bg-[#333] text-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-blue-500/20 disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          {isSubmitting ? 'Saving...' : 'Save Account'}
        </button>
      </div>
    </form>
  );
};

export default ExchangeAccountForm;