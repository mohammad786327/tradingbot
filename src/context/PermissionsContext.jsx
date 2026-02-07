
import React, { createContext, useContext, useState, useEffect } from 'react';
import { rolePermissionsManager } from '@/utils/rolePermissionsManager';

const PermissionsContext = createContext();

export const PermissionsProvider = ({ children, user }) => {
  const [rolePermissions, setRolePermissions] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load permissions whenever user changes
  useEffect(() => {
    const loadPermissions = () => {
      if (user && user.role) {
        const perms = rolePermissionsManager.getRolePermissions(user.role);
        setRolePermissions(perms);
      } else {
        // Default to viewer-like permissions or empty if not logged in
        setRolePermissions(rolePermissionsManager.getRolePermissions('Viewer'));
      }
      setLoading(false);
    };

    loadPermissions();
    
    // Listen for storage events to sync across tabs
    const handleStorageChange = (e) => {
      if (e.key === 'admin_role_permissions') {
        loadPermissions();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user]);

  const can = (capability) => {
    if (!rolePermissions) return false;
    // Admins implicitly have all capabilities usually, but we check the list explicitly
    // relying on the manager to ensure Admin always has all capabilities in the list
    return rolePermissions.capabilities.includes(capability);
  };

  const hasTabAccess = (tabName) => {
    if (!rolePermissions) return false;
    return rolePermissions.allowed_tabs.includes(tabName);
  };

  const refreshPermissions = () => {
    if (user && user.role) {
      const perms = rolePermissionsManager.getRolePermissions(user.role);
      setRolePermissions(perms);
    }
  };

  return (
    <PermissionsContext.Provider value={{ 
      rolePermissions, 
      can, 
      hasTabAccess, 
      loading,
      refreshPermissions
    }}>
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissionsContext = () => {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissionsContext must be used within PermissionsProvider');
  }
  return context;
};
