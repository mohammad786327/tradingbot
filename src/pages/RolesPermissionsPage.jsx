
import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { rolePermissionsManager } from '@/utils/rolePermissionsManager';
import RolePermissionsCard from '@/components/RolePermissionsCard';
import EditRolePermissionsModal from '@/components/EditRolePermissionsModal';
import { usePermissions } from '@/hooks/usePermissions';

const RolesPermissionsPage = () => {
  const [permissionsData, setPermissionsData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [editingRole, setEditingRole] = useState(null);
  const { rolePermissions } = usePermissions(); // We use this to trigger refreshes if our own role updates

  const fetchData = () => {
    setIsLoading(true);
    // Simulate tiny delay for UX
    setTimeout(() => {
        setPermissionsData(rolePermissionsManager.getAllRolePermissions());
        setIsLoading(false);
    }, 300);
  };

  useEffect(() => {
    fetchData();
  }, [rolePermissions]); // Refetch if our own permissions context updates

  const handleEdit = (roleData) => {
    setEditingRole(roleData);
  };

  return (
    <div className="space-y-6">
       {/* Warning Banner */}
       <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex items-start gap-3">
         <AlertTriangle className="text-yellow-500 shrink-0 mt-0.5" size={18} />
         <div>
            <h4 className="text-yellow-500 font-bold text-sm">Global Permission Settings</h4>
            <p className="text-yellow-200/70 text-xs mt-1">
               Changes made here will immediately affect all users assigned to these roles.
               Please exercise caution when modifying "Editor" permissions as it controls trading capabilities.
            </p>
         </div>
       </div>

       {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
             {[1,2,3].map(i => (
                <div key={i} className="h-64 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a]"></div>
             ))}
          </div>
       ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <RolePermissionsCard 
                roleData={permissionsData.Admin} 
                onEdit={handleEdit} 
             />
             <RolePermissionsCard 
                roleData={permissionsData.Editor} 
                onEdit={handleEdit} 
             />
             <RolePermissionsCard 
                roleData={permissionsData.Viewer} 
                onEdit={handleEdit} 
             />
          </div>
       )}

       <EditRolePermissionsModal 
          isOpen={!!editingRole} 
          roleData={editingRole} 
          onClose={() => setEditingRole(null)} 
          onSuccess={fetchData} 
       />
    </div>
  );
};

export default RolesPermissionsPage;
