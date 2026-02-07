
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Edit2, Trash2, Power, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import AddUserModal from './AddUserModal';
import EditUserModal from './EditUserModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '@/services/firebase';

const AdminUsersTable = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);

  // Real-time Firestore Listener
  // NOTE: This listener retrieves public user profile data (name, email, role, status).
  // Critical Security Note: User passwords are NEVER stored in Firestore. 
  // Passwords are managed exclusively by Firebase Authentication service.
  useEffect(() => {
    // Query users collection, ordered by creation date
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => {
        // We only extract specific fields. Verify expected schema:
        // { uid, email, name, role, status, createdAt, lastLogin }
        return {
          id: doc.id,
          ...doc.data()
        };
      });
      setUsers(usersData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching users:", error);
      toast({ title: "Error", description: "Failed to load users", variant: "destructive" });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const handleToggleStatus = async (user) => {
    try {
      const newStatus = user.status === 'Active' ? 'Disabled' : 'Active';
      const userRef = doc(db, 'users', user.id);
      
      await updateDoc(userRef, { status: newStatus });
      
      toast({
        title: newStatus === 'Active' ? "User Activated" : "User Disabled",
        description: `${user.name || user.email} is now ${newStatus.toLowerCase()}.`,
        className: newStatus === 'Active' ? "bg-green-600 text-white" : "bg-orange-500 text-white"
      });
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    try {
      await deleteDoc(doc(db, 'users', deletingUser.id));
      
      // Note: We can only delete the Firestore doc from client. 
      // Auth user deletion requires backend or Firebase Admin SDK.
      
      toast({
        title: "User Data Removed",
        description: `Firestore record for ${deletingUser.name || deletingUser.email} deleted. Note: Auth login requires separate deletion.`,
        variant: "default",
        className: "bg-red-600 text-white"
      });
      setDeletingUser(null);
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const filteredUsers = users.filter(user => 
    (user.name?.toLowerCase() || '').includes(search.toLowerCase()) || 
    (user.email?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (user.role?.toLowerCase() || '').includes(search.toLowerCase())
  );

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'Admin': return "bg-red-500/10 text-red-500 border-red-500/20";
      case 'Editor': return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default: return "bg-green-500/10 text-green-500 border-green-500/20";
    }
  };

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden shadow-lg flex flex-col h-full">
      {/* Header Toolbar */}
      <div className="p-4 border-b border-[#2a2a2a] flex flex-col sm:flex-row justify-between gap-4 bg-[#1a1a1a]">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search users..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#111] border border-[#333] rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
        >
          <div className="bg-white/20 p-0.5 rounded-full"><PlusIcon size={12} /></div> Add User
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto custom-scrollbar bg-[#111]">
        <table className="w-full text-left">
          <thead className="bg-[#1a1a1a] text-xs uppercase text-gray-500 font-bold sticky top-0 z-10">
            <tr>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Last Login</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1f1f1f]">
            {isLoading ? (
               <tr><td colSpan="5" className="p-8 text-center text-gray-500">Loading users from Firestore...</td></tr>
            ) : filteredUsers.length === 0 ? (
               <tr><td colSpan="5" className="p-8 text-center text-gray-500">No users found.</td></tr>
            ) : (
              <AnimatePresence>
                {filteredUsers.map((user) => (
                  <motion.tr 
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-[#161616] group transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-white font-bold">
                          {user.displayName ? user.displayName.charAt(0) : (user.name ? user.name.charAt(0) : '?')}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm">{user.displayName || user.name || 'Unknown'}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("px-2.5 py-1 rounded text-xs font-bold border", getRoleBadgeColor(user.role))}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                         {user.status === 'Active' 
                           ? <CheckCircle size={14} className="text-emerald-500" />
                           : <XCircle size={14} className="text-gray-500" />
                         }
                         <span className={cn("text-xs font-medium", user.status === 'Active' ? "text-emerald-400" : "text-gray-500")}>
                           {user.status || 'Active'}
                         </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs font-mono">
                      {user.lastLogin ? format(new Date(user.lastLogin), 'MMM d, HH:mm') : 'Never'}
                    </td>
                    <td className="px-6 py-4 text-right relative">
                       <div className="flex items-center justify-end gap-2">
                          <button 
                             onClick={() => setEditingUser(user)}
                             className="p-1.5 rounded hover:bg-blue-500/20 text-gray-500 hover:text-blue-400 transition-colors"
                             title="Edit User"
                          >
                             <Edit2 size={16} />
                          </button>
                          
                          <button 
                             onClick={() => handleToggleStatus(user)}
                             className={cn(
                               "p-1.5 rounded hover:bg-[#333] transition-colors",
                               user.status === 'Active' ? "text-emerald-500 hover:text-orange-500" : "text-gray-500 hover:text-emerald-500"
                             )}
                             title={user.status === 'Active' ? "Disable User" : "Enable User"}
                          >
                             <Power size={16} />
                          </button>
                          
                          <button 
                             onClick={() => setDeletingUser(user)}
                             className="p-1.5 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors"
                             title="Delete User"
                          >
                             <Trash2 size={16} />
                          </button>
                       </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <AddUserModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={() => {}} // Listener handles update
      />
      
      <EditUserModal 
        isOpen={!!editingUser} 
        onClose={() => setEditingUser(null)} 
        user={editingUser}
        onSuccess={() => {}} // Listener handles update
      />
      
      <DeleteConfirmationModal
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleDelete}
        itemType="User Account"
        count={1}
      />
    </div>
  );
};

// Helper for icon
const PlusIcon = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

export default AdminUsersTable;
