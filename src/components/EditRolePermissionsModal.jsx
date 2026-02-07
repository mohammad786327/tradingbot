
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Layers, Layout, Save, RotateCcw, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { CAPABILITIES, rolePermissionsManager, updateRolePermissions } from '@/utils/rolePermissionsManager';
import { cn } from '@/lib/utils';
import { getAuth } from 'firebase/auth';
import TabsVisibilityTab from './TabsVisibilityTab';

const EditRolePermissionsModal = ({ isOpen, onClose, roleData, onSuccess }) => {
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('capabilities');
  const [capabilities, setCapabilities] = useState([]);
  const [allowedTabs, setAllowedTabs] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (roleData) {
      setCapabilities(roleData.capabilities || []);
      setAllowedTabs(roleData.allowed_tabs || []);
    }
  }, [roleData]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      const currentUserId = currentUser ? currentUser.uid : 'System';

      const result = await updateRolePermissions(roleData.role, {
        capabilities,
        allowed_tabs: allowedTabs
      }, currentUserId);

      if (!result.success) {
        throw new Error(result.error);
      }
      
      toast({
        title: "Permissions Updated",
        description: `${roleData.role} role permissions have been saved successfully.`,
        className: "bg-green-600 text-white border-green-700"
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update permissions",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm("Are you sure you want to reset this role to default permissions? This cannot be undone.")) {
      return;
    }

    setIsSaving(true);
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      await rolePermissionsManager.resetRoleToDefaults(roleData.role, currentUser?.uid);
      
      toast({ title: "Reset Successful", description: "Role permissions restored to defaults." });
      onSuccess(); // To refresh parent
      onClose();
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleCapability = (capId) => {
    if (capabilities.includes(capId)) {
      setCapabilities(prev => prev.filter(c => c !== capId));
    } else {
      setCapabilities(prev => [...prev, capId]);
    }
  };

  // Group capabilities
  const groupedCapabilities = Object.values(CAPABILITIES).reduce((acc, cap) => {
    if (!acc[cap.category]) acc[cap.category] = [];
    acc[cap.category].push(cap);
    return acc;
  }, {});

  if (!isOpen || !roleData) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-4xl bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-[#2a2a2a] bg-[#1a1a1a]">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Shield className="text-blue-500" size={24} /> 
                Edit Permissions: <span className="text-blue-400">{roleData.role}</span>
              </h3>
              <p className="text-xs text-gray-500 mt-1">Configure access control and feature visibility</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[#2a2a2a] bg-[#151515]">
            <button
              onClick={() => setActiveTab('capabilities')}
              className={cn(
                "flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors",
                activeTab === 'capabilities' 
                  ? "border-blue-500 text-blue-400 bg-[#1a1a1a]" 
                  : "border-transparent text-gray-500 hover:text-gray-300"
              )}
            >
              <Layers size={16} /> Capabilities
            </button>
            <button
              onClick={() => setActiveTab('tabs')}
              className={cn(
                "flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors",
                activeTab === 'tabs' 
                  ? "border-blue-500 text-blue-400 bg-[#1a1a1a]" 
                  : "border-transparent text-gray-500 hover:text-gray-300"
              )}
            >
              <Layout size={16} /> Sidebar Tabs
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-[#111] custom-scrollbar">
            {activeTab === 'capabilities' ? (
              <div className="space-y-8">
                <div className="flex items-center justify-between p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                    <div>
                        <h4 className="font-bold text-white text-sm">Feature Access Control</h4>
                        <p className="text-xs text-purple-300">Enable or disable specific actions.</p>
                    </div>
                    <div className="text-right">
                        <span className="text-xl font-bold text-purple-400">{capabilities.length}</span>
                        <span className="text-xs text-gray-500 ml-1">/ 20 enabled</span>
                    </div>
                </div>

                {Object.entries(groupedCapabilities).map(([category, caps]) => (
                  <div key={category} className="space-y-3">
                    <h4 className="text-xs font-bold uppercase text-gray-500 tracking-wider flex items-center gap-2">
                      <div className="h-px bg-[#333] flex-1"></div>
                      {category}
                      <div className="h-px bg-[#333] flex-1"></div>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {caps.map((cap) => {
                        const isEnabled = capabilities.includes(cap.id);
                        return (
                          <div 
                            key={cap.id}
                            onClick={() => toggleCapability(cap.id)}
                            className={cn(
                              "p-3 rounded-lg border cursor-pointer transition-all hover:bg-[#1f1f1f]",
                              isEnabled ? "bg-[#1a1a1a] border-blue-500/40" : "bg-[#151515] border-[#333] opacity-60"
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                "mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                                isEnabled ? "bg-blue-500 border-blue-500" : "border-gray-600"
                              )}>
                                {isEnabled && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><X size={10} className="text-white rotate-45" strokeWidth={4} /></motion.div>}
                              </div>
                              <div>
                                <h5 className={cn("text-sm font-bold", isEnabled ? "text-white" : "text-gray-400")}>{cap.label}</h5>
                                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{cap.description}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                
                <div className="flex justify-end pt-4 border-t border-[#333]">
                   <button
                     type="button"
                     onClick={handleReset}
                     disabled={isSaving}
                     className="flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-white transition-colors"
                   >
                     <RotateCcw size={12} />
                     Reset to Default Capabilities
                   </button>
                </div>
              </div>
            ) : (
              <TabsVisibilityTab 
                allowedTabs={allowedTabs} 
                onChange={setAllowedTabs} 
                onReset={handleReset}
                isSaving={isSaving}
              />
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-[#2a2a2a] bg-[#1a1a1a] flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-lg border border-[#333] text-sm font-bold text-gray-300 hover:text-white hover:bg-[#252525] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-lg shadow-blue-900/20 flex items-center gap-2"
            >
              {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Save size={16} />}
              Save Changes
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EditRolePermissionsModal;
