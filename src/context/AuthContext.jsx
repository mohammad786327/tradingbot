import React, { createContext, useContext, useState, useEffect } from 'react';
import { adminDataManager } from '@/utils/adminDataManager';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('cryptoUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (email, password) => {
    // 1. Check against Admin Data Manager
    const adminUser = adminDataManager.getUserByEmail(email);
    
    if (adminUser) {
      if (adminUser.status !== 'Active') {
         return { success: false, error: 'Account is disabled. Contact administrator.' };
      }
      
      // Allow any password for test users, OR specific password
      if (['demo123', 'admin123', 'editor123', 'viewer123'].includes(password)) {
          // Update last login
          adminDataManager.updateUser(adminUser.id, { lastLogin: new Date().toISOString() });
          
          const userData = {
            id: adminUser.id,
            email: adminUser.email,
            name: adminUser.name,
            role: adminUser.role // Ensure role is passed for PermissionsContext
          };
          
          setUser(userData);
          localStorage.setItem('cryptoUser', JSON.stringify(userData));
          return { success: true };
      }
    }

    // 2. Fallback legacy demo login
    if (email === 'demo@crypto.com' && password === 'demo123') {
      const userData = {
        email: 'demo@crypto.com',
        name: 'Demo User',
        id: 'demo-user-1',
        role: 'Admin'
      };
      setUser(userData);
      localStorage.setItem('cryptoUser', JSON.stringify(userData));
      return { success: true };
    }

    return { success: false, error: 'Invalid credentials' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('cryptoUser');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};