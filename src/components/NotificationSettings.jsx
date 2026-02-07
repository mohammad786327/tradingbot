
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX, Play, Moon, Bell, Check } from 'lucide-react';
import { soundManager } from '@/utils/SoundManager';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

const SOUND_OPTIONS = [
  { 
    id: 'pulse', 
    label: 'Pulse', 
    description: 'Smooth ascending tone' 
  },
  { 
    id: 'chime', 
    label: 'Chime', 
    description: 'Clear pleasant triad' 
  },
  { 
    id: 'beep', 
    label: 'Beep', 
    description: 'Short electronic signal' 
  },
  { 
    id: 'bell', 
    label: 'Bell', 
    description: 'Classic metallic ring' 
  },
  { 
    id: 'alert', 
    label: 'Alert', 
    description: 'Urgent attention signal' 
  },
  { 
    id: 'softpop', 
    label: 'Soft Pop', 
    description: 'Subtle notification click' 
  },
];

const NotificationSettings = () => {
  const { toast } = useToast();
  const [playingId, setPlayingId] = useState(null);
  const [settings, setSettings] = useState({
    notificationsEnabled: true,
    soundEnabled: true,
    volume: 60,
    soundId: 'chime',
    dndEnabled: false,
    dndStart: '22:00',
    dndEnd: '07:00'
  });

  useEffect(() => {
    const stored = localStorage.getItem('notificationSettings');
    if (stored) {
      const parsed = JSON.parse(stored);
      setSettings(parsed);
      // Sync sound manager
      soundManager.setVolume(parsed.volume);
      soundManager.setEnabled(parsed.soundEnabled);
    }
  }, []);

  const saveSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('notificationSettings', JSON.stringify(newSettings));
    
    // Update Sound Manager immediately
    soundManager.setVolume(newSettings.volume);
    soundManager.setEnabled(newSettings.soundEnabled);
  };

  const handleToggle = (key) => {
    saveSettings({ ...settings, [key]: !settings[key] });
  };

  const handleVolumeChange = (e) => {
    const vol = parseInt(e.target.value);
    saveSettings({ ...settings, volume: vol });
  };

  const handleSoundSelect = (id) => {
    saveSettings({ ...settings, soundId: id });
    handlePlayPreview(id);
  };

  const handlePlayPreview = (id) => {
    setPlayingId(id);
    soundManager.play(id, true);
    setTimeout(() => setPlayingId(null), 1000); // Reset icon after 1s
  };

  const handleDndChange = (key, value) => {
    saveSettings({ ...settings, [key]: value });
  };

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl overflow-hidden shadow-xl">
      <div className="p-6 border-b border-[#2a2a2a] bg-[#151515]">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Bell size={20} className="text-purple-500" />
          Notification Preferences
        </h3>
        <p className="text-sm text-gray-400 mt-1">
            Customize how you want to be alerted when bots activate.
        </p>
      </div>

      <div className="p-6 space-y-8">
        {/* Master Toggle */}
        <div className="flex items-center justify-between">
            <div>
                <h4 className="font-bold text-white">Enable Bot Activation Notifications</h4>
                <p className="text-xs text-gray-500">Receive alerts when any bot enters a position.</p>
            </div>
            <button 
                onClick={() => handleToggle('notificationsEnabled')}
                className={cn(
                    "w-12 h-6 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-purple-500/50",
                    settings.notificationsEnabled ? "bg-purple-600" : "bg-gray-700"
                )}
            >
                <span className={cn(
                    "absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform",
                    settings.notificationsEnabled ? "translate-x-6" : "translate-x-0"
                )} />
            </button>
        </div>

        <div className="h-px bg-[#2a2a2a]" />

        {/* Sound Settings */}
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {settings.soundEnabled ? <Volume2 size={18} className="text-white" /> : <VolumeX size={18} className="text-gray-500" />}
                    <h4 className="font-bold text-white">Sound Alerts</h4>
                </div>
                <button 
                    onClick={() => handleToggle('soundEnabled')}
                    className={cn(
                        "w-10 h-5 rounded-full transition-colors relative focus:outline-none",
                        settings.soundEnabled ? "bg-green-600" : "bg-gray-700"
                    )}
                >
                    <span className={cn(
                        "absolute top-1 left-1 w-3 h-3 rounded-full bg-white transition-transform",
                        settings.soundEnabled ? "translate-x-5" : "translate-x-0"
                    )} />
                </button>
            </div>

            <div className={cn("space-y-6 transition-all duration-300", !settings.soundEnabled ? "opacity-40 grayscale pointer-events-none" : "opacity-100")}>
                {/* Volume Slider */}
                <div className="bg-[#111] p-4 rounded-xl border border-[#2a2a2a]">
                    <div className="flex justify-between mb-3">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Master Volume</label>
                        <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">{settings.volume}%</span>
                    </div>
                    <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={settings.volume} 
                        onChange={handleVolumeChange}
                        className="w-full h-1.5 bg-[#333] rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400 transition-all"
                    />
                </div>

                {/* Sound Selector */}
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase mb-3 block tracking-wider">Alert Sound Selection</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {SOUND_OPTIONS.map(sound => {
                            const isSelected = settings.soundId === sound.id;
                            const isPlaying = playingId === sound.id;
                            
                            return (
                                <div 
                                    key={sound.id}
                                    onClick={() => handleSoundSelect(sound.id)}
                                    className={cn(
                                        "relative flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-200 group overflow-hidden",
                                        isSelected 
                                            ? "bg-purple-500/10 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.15)]" 
                                            : "bg-[#111] border-[#2a2a2a] hover:border-[#444] hover:bg-[#161616]"
                                    )}
                                >
                                    {/* Selection Indicator Background */}
                                    {isSelected && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent pointer-events-none" />
                                    )}

                                    <div className="flex items-center gap-3 relative z-10">
                                        <div className={cn(
                                            "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                                            isSelected ? "border-purple-500 bg-purple-500" : "border-gray-600 group-hover:border-gray-500"
                                        )}>
                                            {isSelected && <Check size={10} className="text-white" strokeWidth={4} />}
                                        </div>
                                        <div>
                                            <span className={cn("text-sm font-bold block", isSelected ? "text-white" : "text-gray-400 group-hover:text-gray-300")}>
                                                {sound.label}
                                            </span>
                                            <span className="text-[10px] text-gray-600 block leading-tight">{sound.description}</span>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handlePlayPreview(sound.id);
                                        }}
                                        className={cn(
                                            "p-2 rounded-lg transition-all relative z-10",
                                            isPlaying 
                                                ? "bg-green-500 text-white shadow-lg scale-110" 
                                                : "bg-[#222] text-gray-400 hover:text-white hover:bg-[#333]"
                                        )}
                                        title="Preview Sound"
                                    >
                                        {isPlaying ? <Volume2 size={14} className="animate-pulse" /> : <Play size={14} fill="currentColor" />}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>

        <div className="h-px bg-[#2a2a2a]" />

        {/* Do Not Disturb */}
        <div className="space-y-4">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Moon size={18} className={settings.dndEnabled ? "text-blue-400" : "text-gray-500"} />
                    <div>
                        <h4 className="font-bold text-white">Do Not Disturb</h4>
                        <p className="text-xs text-gray-500">Mute sounds during specific hours.</p>
                    </div>
                </div>
                <button 
                    onClick={() => handleToggle('dndEnabled')}
                    className={cn(
                        "w-10 h-5 rounded-full transition-colors relative focus:outline-none",
                        settings.dndEnabled ? "bg-blue-600" : "bg-gray-700"
                    )}
                >
                    <span className={cn(
                        "absolute top-1 left-1 w-3 h-3 rounded-full bg-white transition-transform",
                        settings.dndEnabled ? "translate-x-5" : "translate-x-0"
                    )} />
                </button>
            </div>

            {settings.dndEnabled && (
                <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="grid grid-cols-2 gap-4 pl-6 border-l-2 border-[#2a2a2a] overflow-hidden"
                >
                    <div className="py-2">
                        <label className="text-xs text-gray-500 block mb-1.5 font-bold uppercase">From</label>
                        <input 
                            type="time" 
                            value={settings.dndStart}
                            onChange={(e) => handleDndChange('dndStart', e.target.value)}
                            className="bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-white text-sm w-full focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all"
                        />
                    </div>
                    <div className="py-2">
                        <label className="text-xs text-gray-500 block mb-1.5 font-bold uppercase">To</label>
                        <input 
                            type="time" 
                            value={settings.dndEnd}
                            onChange={(e) => handleDndChange('dndEnd', e.target.value)}
                            className="bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-white text-sm w-full focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all"
                        />
                    </div>
                </motion.div>
            )}
        </div>

      </div>
    </div>
  );
};

export default NotificationSettings;
