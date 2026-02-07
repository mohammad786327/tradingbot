
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';

export const ADMIN_PERMISSIONS = {
  role: 'Admin',
  isProtected: true,
  capabilities: [
    'manage_users', 'manage_roles', 'view_audit_log', 'system_settings',
    'view_dashboard', 'view_positions', 'manage_positions', 'place_manual_trades', 'view_active_orders', 'manage_orders',
    'view_bots', 'create_bots', 'edit_bots', 'delete_bots', 'control_bots',
    'view_templates', 'create_templates', 'edit_templates', 'delete_templates', 'view_advanced_chart'
  ],
  allowed_tabs: [
    'Dashboard', 'Positions', 'Manual Trade', 'Advanced Chart', 'Templates', 
    'Bot Trading', 'Exchange Accounts', 'Settings', 'Admin'
  ],
  updatedBy: 'System',
  lastUpdated: new Date().toISOString()
};

export const EDITOR_PERMISSIONS = {
  role: 'Editor',
  isProtected: false,
  capabilities: [
    'view_dashboard', 'view_positions', 'manage_positions', 'place_manual_trades', 'view_active_orders', 'manage_orders',
    'view_bots', 'create_bots', 'edit_bots', 'delete_bots', 'control_bots',
    'view_templates', 'create_templates', 'edit_templates', 'delete_templates', 'view_advanced_chart'
  ],
  allowed_tabs: [
    'Dashboard', 'Positions', 'Manual Trade', 'Advanced Chart', 'Templates', 
    'Bot Trading', 'Exchange Accounts', 'Settings'
  ],
  updatedBy: 'System',
  lastUpdated: new Date().toISOString()
};

export const VIEWER_PERMISSIONS = {
  role: 'Viewer',
  isProtected: false,
  capabilities: [
    'view_dashboard', 'view_positions', 'view_active_orders',
    'view_bots', 'view_templates', 'view_advanced_chart'
  ],
  allowed_tabs: [
    'Dashboard', 'Positions', 'Advanced Chart', 'Bot Trading', 'Templates'
  ],
  updatedBy: 'System',
  lastUpdated: new Date().toISOString()
};

export const initializeRolePermissions = async () => {
  try {
    const roles = [ADMIN_PERMISSIONS, EDITOR_PERMISSIONS, VIEWER_PERMISSIONS];
    
    for (const roleData of roles) {
      const roleRef = doc(db, 'role_permissions', roleData.role);
      const roleSnap = await getDoc(roleRef);
      
      if (!roleSnap.exists()) {
        await setDoc(roleRef, roleData);
        console.log(`Initialized permissions for role: ${roleData.role}`);
      }
    }
  } catch (error) {
    console.error("Error initializing role permissions:", error);
  }
};
