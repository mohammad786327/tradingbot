
import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Eye, Edit3, Lock, Check, Clock, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const RolePermissionsCard = ({ roleData, onEdit, onView }) => {
  const { role, isProtected, capabilities, lastUpdated, updatedBy } = roleData;
  const count = capabilities.length;
  
  // Dynamic styles based on role
  const styles = {
    Admin: {
      gradient: "from-red-500 to-rose-600",
      icon: Shield,
      border: "border-red-500/20 hover:border-red-500/40",
      bg: "bg-red-500/5"
    },
    Editor: {
      gradient: "from-blue-500 to-cyan-600",
      icon: Edit3,
      border: "border-blue-500/20 hover:border-blue-500/40",
      bg: "bg-blue-500/5"
    },
    Viewer: {
      gradient: "from-green-500 to-emerald-600",
      icon: Eye,
      border: "border-green-500/20 hover:border-green-500/40",
      bg: "bg-green-500/5"
    }
  };
  
  const currentStyle = styles[role] || styles.Viewer;
  const Icon = currentStyle.icon;

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className={cn(
        "relative overflow-hidden rounded-xl border bg-[#1a1a1a] p-6 shadow-lg transition-all flex flex-col h-full",
        currentStyle.border
      )}
    >
      {/* Decorative gradient blob */}
      <div className={`absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br ${currentStyle.gradient} opacity-[0.08] blur-2xl`} />

      <div className="relative z-10 flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg text-white", currentStyle.gradient)}>
            <Icon size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">{role}</h3>
            <div className="flex items-center gap-2 mt-1">
               {isProtected ? (
                 <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full border border-red-400/20">
                    <Lock size={10} /> Protected
                 </span>
               ) : (
                 <span className="text-xs text-gray-500">Customizable Role</span>
               )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between p-3 rounded-lg bg-[#111] border border-[#222]">
           <span className="text-sm text-gray-400">Capabilities Enabled</span>
           <span className={cn("text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r", currentStyle.gradient)}>
              {count} <span className="text-gray-600 text-xs font-normal">/ 20</span>
           </span>
        </div>
        
        <div className="flex items-center justify-between p-3 rounded-lg bg-[#111] border border-[#222]">
           <span className="text-sm text-gray-400">Sidebar Tabs</span>
           <span className="text-sm font-bold text-white">
              {roleData.allowed_tabs.length} <span className="text-gray-600 font-normal">visible</span>
           </span>
        </div>
        
        {!isProtected && (
           <div className="flex items-center gap-2 text-xs text-gray-500 mt-2 px-1">
             <Clock size={12} />
             <span>Updated {formatDistanceToNow(new Date(lastUpdated))} ago by {updatedBy === 'System' ? 'System' : 'Admin'}</span>
           </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-[#2a2a2a]">
        {isProtected ? (
          <button 
            onClick={() => onEdit(roleData)} // Allow view mode even for protected
            className="w-full py-2.5 rounded-lg border border-[#333] text-gray-400 font-medium text-sm hover:text-white hover:bg-[#222] transition-colors flex items-center justify-center gap-2"
          >
            <Eye size={16} /> View Permissions
          </button>
        ) : (
          <button 
            onClick={() => onEdit(roleData)}
            className={cn(
               "w-full py-2.5 rounded-lg text-white font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2",
               "bg-gradient-to-r hover:brightness-110",
               currentStyle.gradient
            )}
          >
            <Edit3 size={16} /> Edit Permissions
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default RolePermissionsCard;
