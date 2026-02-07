
import React from 'react';
import { Check, RotateCcw } from 'lucide-react';
import { AVAILABLE_TABS } from '@/utils/rolePermissionsManager';
import { cn } from '@/lib/utils';

const TabsVisibilityTab = ({ allowedTabs, onChange, onReset, isSaving }) => {
  const toggleTab = (tabName) => {
    if (tabName === 'Admin') return; // Cannot toggle Admin from UI here usually, or handled carefully
    
    const newTabs = allowedTabs.includes(tabName)
      ? allowedTabs.filter(t => t !== tabName)
      : [...allowedTabs, tabName];
    onChange(newTabs);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <div>
          <h4 className="font-bold text-white text-sm">Sidebar Navigation Visibility</h4>
          <p className="text-xs text-blue-300">Control which tabs appear in the main sidebar for this role.</p>
        </div>
        <div className="text-right">
          <span className="text-xl font-bold text-blue-400">{allowedTabs.length}</span>
          <span className="text-xs text-gray-500 ml-1">/ {AVAILABLE_TABS.length} visible</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {AVAILABLE_TABS.map((tab) => {
           const isEnabled = allowedTabs.includes(tab);
           // Special case: Admin tab usually restricted
           const isAdminTab = tab === 'Admin';
           
           return (
             <div 
               key={tab}
               onClick={() => !isAdminTab && toggleTab(tab)}
               className={cn(
                 "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all",
                 isEnabled 
                   ? "bg-[#222] border-green-500/30 hover:border-green-500/50" 
                   : "bg-[#151515] border-[#333] hover:border-[#444]",
                 isAdminTab && "opacity-50 cursor-not-allowed"
               )}
             >
               <span className={cn("text-sm font-medium", isEnabled ? "text-white" : "text-gray-500")}>
                 {tab}
               </span>
               
               <div className={cn(
                 "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                 isEnabled 
                   ? "bg-green-600 border-green-600 text-white" 
                   : "bg-transparent border-gray-600"
               )}>
                 {isEnabled && <Check size={12} strokeWidth={4} />}
               </div>
             </div>
           );
        })}
      </div>

      <div className="flex justify-end pt-4 border-t border-[#333]">
        <button
          type="button"
          onClick={onReset}
          disabled={isSaving}
          className="flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-white transition-colors"
        >
          <RotateCcw size={12} />
          Reset to Default Tabs
        </button>
      </div>
    </div>
  );
};

export default TabsVisibilityTab;
