
import { useFirebaseUser, useRolePermissions } from '@/hooks/useFirebaseData';

export const usePermissions = () => {
  const { userData, loading: userLoading } = useFirebaseUser();
  const role = userData?.role || 'Viewer';
  const { permissions, loading: permsLoading } = useRolePermissions(role);

  const loading = userLoading || permsLoading;

  // Basic check helper
  const can = (capability) => {
    if (loading) return false;
    
    // Admin override (Superuser)
    if (role === 'Admin') return true;
    
    if (!permissions) return false;

    return permissions.capabilities?.includes(capability) || false;
  };

  // Tab Access helper
  const hasTabAccess = (tabName) => {
    if (loading) return false;
    
    if (role === 'Admin') return true;
    if (!permissions) return false;

    return permissions.allowed_tabs?.includes(tabName) || false;
  };
  
  // Specific role checks
  const canAccessAdminPanel = () => {
    return role === 'Admin';
  };
  
  const canManageUsers = () => can('manage_users');
  const canManageRoles = () => can('manage_roles');
  const canCreateBots = () => can('create_bots');
  const canEditBots = () => can('edit_bots');
  const canDeleteBots = () => can('delete_bots');
  const canTrade = () => can('place_manual_trades') || can('manage_positions');

  return {
    role,
    userRole: role, // Alias
    rolePermissions: permissions,
    can,
    hasTabAccess,
    canAccessTab: hasTabAccess, // Alias
    loading,
    canAccessAdminPanel,
    canManageUsers,
    canManageRoles,
    canCreateBots,
    canEditBots,
    canDeleteBots,
    canTrade
  };
};
