import React, { useState } from 'react';
import { Shield, Target, AlertTriangle } from 'lucide-react';
import { theme } from '@/utils/cyberpunkTheme';

const RiskManagementPanel = () => {
  const [riskAmount, setRiskAmount] = useState(100);
  
  return (
    <div className={`${theme.colors.card} p-6 rounded-2xl`}>
      <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
        <Shield className="text-blue-400" size={20} /> Risk Calculator
      </h3>
      
      <div className="space-y-4">
        <div>
           <label className="text-xs text-gray-500 uppercase font-bold mb-1.5 block">Account Risk ($)</label>
           <input 
             type="number" 
             value={riskAmount}
             onChange={(e) => setRiskAmount(e.target.value)}
             className="w-full bg-[#151515] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white font-mono focus:border-blue-500 outline-none" 
           />
        </div>

        <div className="grid grid-cols-2 gap-4">
             <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                 <div className="flex items-center gap-2 mb-1 text-red-400 text-xs font-bold uppercase">
                     <AlertTriangle size={12} /> Stop Loss
                 </div>
                 <div className="text-xl font-mono text-white">1.5%</div>
             </div>
             <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                 <div className="flex items-center gap-2 mb-1 text-green-400 text-xs font-bold uppercase">
                     <Target size={12} /> Take Profit
                 </div>
                 <div className="text-xl font-mono text-white">4.5%</div>
             </div>
        </div>

        <div className="pt-2">
            <div className="flex justify-between text-sm text-gray-400 mb-1">
                <span>Risk/Reward Ratio</span>
                <span className="text-white font-bold">1:3</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden flex">
                <div className="w-1/4 bg-red-500"></div>
                <div className="w-3/4 bg-green-500"></div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default RiskManagementPanel;