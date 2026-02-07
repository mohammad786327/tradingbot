
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Users, Shield, Lock, Activity, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import AdminUsersTable from '@/components/AdminUsersTable';
import RolesPermissionsPage from '@/pages/RolesPermissionsPage';
import AdminSettingsTab from '@/components/AdminSettingsTab';

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('users');

  const tabs = [
    { id: 'users', label: 'Users Management', icon: Users },
    { id: 'roles', label: 'Roles & Permissions', icon: Shield },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'audit', label: 'Audit Log', icon: Activity, disabled: true },
  ];

  return (
    <>
      <Helmet>
        <title>Admin Panel - CryptoBot</title>
      </Helmet>

      <div className="min-h-screen bg-[#0f0f0f] text-white p-6 pb-20">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-500">
                System Administration
              </h1>
              <p className="text-gray-500 mt-1">Manage users, access controls, and system configurations.</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-[#2a2a2a] flex items-center gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => !tab.disabled && setActiveTab(tab.id)}
                disabled={tab.disabled}
                className={cn(
                  "relative px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 min-w-max",
                  activeTab === tab.id ? "text-white" : "text-gray-500 hover:text-gray-300",
                  tab.disabled && "opacity-50 cursor-not-allowed hover:text-gray-500"
                )}
              >
                <tab.icon size={16} />
                {tab.label}
                {tab.disabled && <Lock size={10} className="ml-1 opacity-50" />}
                
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="adminTabLine"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500"
                  />
                )}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="min-h-[500px]">
             {activeTab === 'users' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    <AdminUsersTable />
                </motion.div>
             )}
             
             {activeTab === 'roles' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    <RolesPermissionsPage />
                </motion.div>
             )}

             {activeTab === 'settings' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    <AdminSettingsTab />
                </motion.div>
             )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminPage;
