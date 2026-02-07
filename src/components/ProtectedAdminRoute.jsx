
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/context/FirebaseAuthContext';

const ProtectedAdminRoute = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { canAccessAdminPanel, loading: permsLoading, userRole } = usePermissions();
  const location = useLocation();

  if (authLoading || permsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-gray-400 text-sm">Verifying privileges...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but not admin
  if (!canAccessAdminPanel()) {
    console.warn("Access denied: User is not Admin. Role:", userRole);
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedAdminRoute;
