
import { db } from '@/services/firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

const PERMISSIONS_STORAGE_KEY = 'admin_role_permissions';

export const CAPABILITIES = {
  // User & System (4)
  manage_users: { id: 'manage_users', label: 'Manage Users', category: 'User & System', description: 'Create, edit, and delete user accounts' },
  manage_roles: { id: 'manage_roles', label: 'Manage Roles', category: 'User & System', description: 'Modify role permissions and access' },
  view_audit_log: { id: 'view_audit_log', label: 'View Audit Log', category: 'User & System', description: 'View system activity history' },
  system_settings: { id: 'system_settings', label: 'System Settings', category: 'User & System', description: 'Configure global system parameters' },

  // Trading/Orders (6)
  view_dashboard: { id: 'view_dashboard', label: 'View Dashboard', category: 'Trading/Orders', description: 'Access main dashboard statistics' },
  view_positions: { id: 'view_positions', label: 'View Positions', category: 'Trading/Orders', description: 'See active and closed positions' },
  manage_positions: { id: 'manage_positions', label: 'Manage Positions', category: 'Trading/Orders', description: 'Close or modify active positions' },
  place_manual_trades: { id: 'place_manual_trades', label: 'Place Manual Trades', category: 'Trading/Orders', description: 'Execute new manual market/limit orders' },
  view_active_orders: { id: 'view_active_orders', label: 'View Active Orders', category: 'Trading/Orders', description: 'See open orders' },
  manage_orders: { id: 'manage_orders', label: 'Manage Orders', category: 'Trading/Orders', description: 'Cancel open orders' },

  // Bots (5)
  view_bots: { id: 'view_bots', label: 'View Bots', category: 'Bots', description: 'See created trading bots' },
  create_bots: { id: 'create_bots', label: 'Create Bots', category: 'Bots', description: 'Configure and launch new bots' },
  edit_bots: { id: 'edit_bots', label: 'Edit Bots', category: 'Bots', description: 'Modify existing bot configurations' },
  delete_bots: { id: 'delete_bots', label: 'Delete Bots', category: 'Bots', description: 'Remove trading bots' },
  control_bots: { id: 'control_bots', label: 'Control Bots', category: 'Bots', description: 'Start or stop running bots' },

  // Templates (5)
  view_templates: { id: 'view_templates', label: 'View Templates', category: 'Templates', description: 'Access saved strategy templates' },
  create_templates: { id: 'create_templates', label: 'Create Templates', category: 'Templates', description: 'Save new strategy templates' },
  edit_templates: { id: 'edit_templates', label: 'Edit Templates', category: 'Templates', description: 'Modify existing templates' },
  delete_templates: { id: 'delete_templates', label: 'Delete Templates', category: 'Templates', description: 'Remove templates' },
  view_advanced_chart: { id: 'view_advanced_chart', label: 'View Advanced Chart', category: 'Templates', description: 'Access TradingView charts' },
};

export const AVAILABLE_TABS = [
  'Dashboard', 
  'Positions', 
  'Manual Trade', 
  'Advanced Chart', 
  'Templates', 
  'Bot Trading', 
  'Exchange Accounts', 
  'Settings', 
  'Admin'
];

const DEFAULT_PERMISSIONS = {
  Admin: {
    role: 'Admin',
    isProtected: true,
    capabilities: Object.keys(CAPABILITIES), // All 20
    allowed_tabs: AVAILABLE_TABS, // All tabs
    lastUpdated: new Date().toISOString(),
    updatedBy: 'System'
  },
  Editor: {
    role: 'Editor',
    isProtected: false,
    // 16/20 enabled (Everything except User & System)
    capabilities: Object.keys(CAPABILITIES).filter(k => CAPABILITIES[k].category !== 'User & System'),
    allowed_tabs: AVAILABLE_TABS.filter(t => t !== 'Admin'),
    lastUpdated: new Date().toISOString(),
    updatedBy: 'System'
  },
  Viewer: {
    role: 'Viewer',
    isProtected: false,
    // 3/20 enabled
    capabilities: ['view_dashboard', 'view_positions', 'view_bots', 'view_templates'], 
    allowed_tabs: ['Dashboard', 'Positions', 'Bot Trading', 'Templates'],
    lastUpdated: new Date().toISOString(),
    updatedBy: 'System'
  }
};

class RolePermissionsManager {
  constructor() {
    this.init();
  }

  init() {
    if (!localStorage.getItem(PERMISSIONS_STORAGE_KEY)) {
      localStorage.setItem(PERMISSIONS_STORAGE_KEY, JSON.stringify(DEFAULT_PERMISSIONS));
    }
  }

  getAllRolePermissions() {
    const data = localStorage.getItem(PERMISSIONS_STORAGE_KEY);
    return data ? JSON.parse(data) : DEFAULT_PERMISSIONS;
  }

  getRolePermissions(role) {
    const all = this.getAllRolePermissions();
    return all[role] || DEFAULT_PERMISSIONS.Viewer;
  }

  /**
   * Updates role permissions in Firestore
   * @param {string} roleName - Name of the role to update
   * @param {Object} updatedPermissions - Object containing allowed_tabs and capabilities
   * @param {string} currentUserId - ID of the user performing the update
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async updateRolePermissions(roleName, updatedPermissions, currentUserId) {
    try {
      if (roleName === 'Admin') {
        // Double check protection, although Firestore rules should also prevent this
        // We allow updating tabs for admin, but usually capabilities should be full
        // For now, we'll allow it but log a warning
        console.warn("Updating Admin permissions - be careful not to lock yourself out.");
      }

      const roleRef = doc(db, 'role_permissions', roleName);
      
      const payload = {
        role: roleName,
        capabilities: updatedPermissions.capabilities || [],
        allowed_tabs: updatedPermissions.allowed_tabs || [],
        updatedBy: currentUserId || 'System',
        lastUpdated: new Date().toISOString()
      };

      // Using setDoc with merge: true to ensure document exists or update specific fields
      await setDoc(roleRef, payload, { merge: true });
      
      return { success: true };
    } catch (error) {
      console.error("Error updating role permissions:", error);
      return { success: false, error: error.message };
    }
  }

  async resetRoleToDefaults(roleName, currentUserId) {
    try {
      if (roleName === 'Admin') throw new Error('Cannot reset Admin role');
      
      const defaultRole = DEFAULT_PERMISSIONS[roleName] || DEFAULT_PERMISSIONS.Viewer;
      const roleRef = doc(db, 'role_permissions', roleName);
      
      const payload = {
        ...defaultRole,
        updatedBy: currentUserId || 'System',
        lastUpdated: new Date().toISOString()
      };

      await setDoc(roleRef, payload, { merge: true });
      return { success: true };
    } catch (error) {
      console.error("Error resetting role permissions:", error);
      return { success: false, error: error.message };
    }
  }
}

export const rolePermissionsManager = new RolePermissionsManager();

// Standalone export as requested
export const updateRolePermissions = (roleName, updatedPermissions, currentUserId) => 
  rolePermissionsManager.updateRolePermissions(roleName, updatedPermissions, currentUserId);
