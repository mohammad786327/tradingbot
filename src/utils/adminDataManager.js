const USERS_STORAGE_KEY = 'admin_users_data';
const ROLES_STORAGE_KEY = 'admin_roles_data';

const DEFAULT_ROLES = {
  Admin: {
    id: 'role-admin',
    name: 'Admin',
    description: 'Full system access',
    permissions: ['manage_users', 'manage_roles', 'view_audit_log', 'configure_system', 'create_bots', 'edit_bots', 'delete_bots', 'manage_trades']
  },
  Editor: {
    id: 'role-editor',
    name: 'Editor',
    description: 'Can manage bots and trades',
    permissions: ['create_bots', 'edit_bots', 'delete_bots', 'manage_trades']
  },
  Viewer: {
    id: 'role-viewer',
    name: 'Viewer',
    description: 'Read-only access',
    permissions: ['view_bots', 'view_trades', 'view_positions']
  }
};

const DEFAULT_USERS = [
  {
    id: 'user-admin-1',
    name: 'Admin User',
    email: 'admin@test.com',
    role: 'Admin',
    status: 'Active',
    lastLogin: new Date().toISOString(),
    createdAt: new Date(Date.now() - 10000000).toISOString()
  },
  {
    id: 'user-editor-1',
    name: 'Editor User',
    email: 'editor@test.com',
    role: 'Editor',
    status: 'Active',
    lastLogin: new Date(Date.now() - 86400000).toISOString(),
    createdAt: new Date(Date.now() - 5000000).toISOString()
  },
  {
    id: 'user-viewer-1',
    name: 'Viewer User',
    email: 'viewer@test.com',
    role: 'Viewer',
    status: 'Active',
    lastLogin: new Date(Date.now() - 172800000).toISOString(),
    createdAt: new Date(Date.now() - 2000000).toISOString()
  }
];

class AdminDataManager {
  constructor() {
    this.init();
  }

  init() {
    if (!localStorage.getItem(USERS_STORAGE_KEY)) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
    }
    if (!localStorage.getItem(ROLES_STORAGE_KEY)) {
      localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(DEFAULT_ROLES));
    }
  }

  // --- Users CRUD ---

  getAllUsers() {
    const data = localStorage.getItem(USERS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  getUserById(id) {
    const users = this.getAllUsers();
    return users.find(u => u.id === id);
  }
  
  getUserByEmail(email) {
    const users = this.getAllUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  addUser(userData) {
    const users = this.getAllUsers();
    
    if (users.some(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
      throw new Error('User with this email already exists');
    }

    const newUser = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36), // Fallback UUID
      createdAt: new Date().toISOString(),
      lastLogin: null,
      status: 'Active',
      ...userData
    };

    users.push(newUser);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    return newUser;
  }

  updateUser(id, updates) {
    const users = this.getAllUsers();
    const index = users.findIndex(u => u.id === id);
    
    if (index === -1) throw new Error('User not found');

    // Prevent duplicate email if email is being updated
    if (updates.email) {
      const duplicate = users.find(u => u.email.toLowerCase() === updates.email.toLowerCase() && u.id !== id);
      if (duplicate) throw new Error('Email already in use by another user');
    }

    users[index] = { ...users[index], ...updates };
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    return users[index];
  }

  deleteUser(id) {
    let users = this.getAllUsers();
    const user = users.find(u => u.id === id);
    if (!user) throw new Error('User not found');
    
    // Prevent deleting the last admin
    if (user.role === 'Admin') {
      const adminCount = users.filter(u => u.role === 'Admin').length;
      if (adminCount <= 1) throw new Error('Cannot delete the last Administrator');
    }

    users = users.filter(u => u.id !== id);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    return true;
  }

  toggleUserStatus(id) {
    const users = this.getAllUsers();
    const index = users.findIndex(u => u.id === id);
    
    if (index === -1) throw new Error('User not found');
    
    const currentStatus = users[index].status;
    const newStatus = currentStatus === 'Active' ? 'Disabled' : 'Active';
    
    // Prevent disabling the last admin
    if (users[index].role === 'Admin' && newStatus === 'Disabled') {
      const activeAdmins = users.filter(u => u.role === 'Admin' && u.status === 'Active').length;
      if (activeAdmins <= 1) throw new Error('Cannot disable the last active Administrator');
    }

    users[index].status = newStatus;
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    return users[index];
  }

  // --- Roles & Permissions ---

  getRoles() {
    const data = localStorage.getItem(ROLES_STORAGE_KEY);
    return data ? JSON.parse(data) : DEFAULT_ROLES;
  }

  getPermissionsForRole(roleName) {
    const roles = this.getRoles();
    return roles[roleName]?.permissions || [];
  }
}

export const adminDataManager = new AdminDataManager();