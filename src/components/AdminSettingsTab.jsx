
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Bell, Monitor, Volume2, ShieldAlert } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/FirebaseAuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { useUserSettings } from '@/hooks/useFirebaseData';

const AdminSettingsTab = () => {
  const { user } = useAuth();
  const { settings: initialSettings, loading } = useUserSettings();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    theme: 'dark',
    soundEnabled: true,
    soundVolume: 50,
    selectedSound: 'bell',
    notifications: true,
    systemMaintenance: false
  });
  
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialSettings) {
      setFormData(prev => ({
        ...prev,
        ...initialSettings
      }));
    }
  }, [initialSettings]);

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    
    try {
      const settingsRef = doc(db, 'settings', user.uid);
      await updateDoc(settingsRef, formData);
      
      toast({
        title: "Settings Saved",
        description: "Your preferences have been updated successfully.",
        className: "bg-green-600 text-white border-none"
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading settings...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Appearance */}
        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-[#2a2a2a] space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <Monitor className="text-blue-500" size={24} />
            <h3 className="text-lg font-bold text-white">Appearance</h3>
          </div>
          
          <div className="space-y-3">
            <label className="text-sm text-gray-400 block">Theme Preference</label>
            <div className="grid grid-cols-3 gap-3">
              {['dark', 'light', 'system'].map((theme) => (
                <button
                  key={theme}
                  onClick={() => handleChange('theme', theme)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                    formData.theme === theme 
                      ? 'bg-blue-600 border-blue-500 text-white' 
                      : 'bg-[#111] border-[#333] text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {theme.charAt(0).toUpperCase() + theme.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sound */}
        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-[#2a2a2a] space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <Volume2 className="text-purple-500" size={24} />
            <h3 className="text-lg font-bold text-white">Sound & Audio</h3>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-300 text-sm">Enable Sound Effects</span>
            <button 
              onClick={() => handleChange('soundEnabled', !formData.soundEnabled)}
              className={`w-12 h-6 rounded-full transition-colors relative ${formData.soundEnabled ? 'bg-green-500' : 'bg-gray-600'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.soundEnabled ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
          
          {formData.soundEnabled && (
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Volume</span>
                <span>{formData.soundVolume}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={formData.soundVolume} 
                onChange={(e) => handleChange('soundVolume', parseInt(e.target.value))}
                className="w-full h-2 bg-[#333] rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
          )}
        </div>

        {/* System */}
        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-[#2a2a2a] space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <ShieldAlert className="text-red-500" size={24} />
            <h3 className="text-lg font-bold text-white">System Config</h3>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg border border-red-500/20">
            <div>
              <span className="text-red-200 text-sm font-bold block">Maintenance Mode</span>
              <span className="text-red-300/60 text-xs block">Disable all trading bots</span>
            </div>
            <button 
              onClick={() => handleChange('systemMaintenance', !formData.systemMaintenance)}
              className={`w-12 h-6 rounded-full transition-colors relative ${formData.systemMaintenance ? 'bg-red-500' : 'bg-gray-600'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.systemMaintenance ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
          
           <div className="flex items-center justify-between mt-4">
            <span className="text-gray-300 text-sm">System Notifications</span>
            <button 
              onClick={() => handleChange('notifications', !formData.notifications)}
              className={`w-12 h-6 rounded-full transition-colors relative ${formData.notifications ? 'bg-blue-500' : 'bg-gray-600'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.notifications ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-[#2a2a2a]">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save size={18} />
          )}
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default AdminSettingsTab;
