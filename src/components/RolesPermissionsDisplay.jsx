
import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Eye, Edit3, Lock, Check } from 'lucide-react';
import { adminDataManager } from '@/utils/adminDataManager';

const RoleCard = ({ role, permissions, icon: Icon, colorClass, delay }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 shadow-lg flex flex-col h-full hover:border-[#3a3a3a] transition-colors relative overflow-hidden group"
    >
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${colorClass} opacity-5 rounded-bl-full`} />
      
      <div className="flex items-center gap-4 mb-6 relative z-10">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass.replace('from-', 'bg-').split(' ')[0]} bg-opacity-10 text-white`}>
          <Icon size={24} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">{role}</h3>
          <p className="text-xs text-gray-500">System Role</p>
        </div>
      </div>

      <div className="space-y-3 flex-1 relative z-10">
        <p className="text-sm text-gray-400 mb-4 h-10">{
           role === 'Admin' ? 'Full access to all system features, user management, and configuration.' :
           role === 'Editor' ? 'Can create and manage trading bots, place manual trades, and edit settings.' :
           'Read-only access to view dashboards, positions, and logs. Cannot modify data.'
        }</p>
        
        <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase text-gray-600 mb-2 tracking-wider">Capabilities</h4>
            {permissions.map((perm, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
                    <Check size={14} className="text-green-500" />
                    <span>{perm.replace(/_/g, ' ')}</span>
                </div>
            ))}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-[#2a2a2a] flex justify-between items-center text-xs text-gray-500">
         <span className="flex items-center gap-1"><Lock size={12} /> Protected Role</span>
         <span>{permissions.length} Permissions</span>
      </div>
    </motion.div>
  );
};

const RolesPermissionsDisplay = () => {
  const rolesData = adminDataManager.getRoles();
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
       <RoleCard 
         role="Admin" 
         permissions={rolesData['Admin'].permissions} 
         icon={Shield} 
         colorClass="from-red-500 to-rose-600" 
         delay={0}
       />
       <RoleCard 
         role="Editor" 
         permissions={rolesData['Editor'].permissions} 
         icon={Edit3} 
         colorClass="from-blue-500 to-cyan-600" 
         delay={0.1}
       />
       <RoleCard 
         role="Viewer" 
         permissions={rolesData['Viewer'].permissions} 
         icon={Eye} 
         colorClass="from-green-500 to-emerald-600" 
         delay={0.2}
       />
    </div>
  );
};

export default RolesPermissionsDisplay;
