import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useAdminStore } from '../../store/adminStore';

const ProtectedRoute: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const { isAdmin, isChecking, checkAdminStatus } = useAdminStore();
  const [hasChecked, setHasChecked] = useState(false);

  // Check admin status when user changes
  useEffect(() => {
    const performCheck = async () => {
      if (!user) {
        setHasChecked(true);
        return;
      }

      // First check if the user object already has is_super_admin set to true
      if (user.is_super_admin === true) {
        useAdminStore.getState().setAdminStatus(true);
        setHasChecked(true);
        return;
      }
      
      // Otherwise do a direct database check
      await checkAdminStatus(user.id);
      setHasChecked(true);
    };
    
    performCheck();
  }, [user, checkAdminStatus]);

  // Loading state
  if (loading || isChecking || !hasChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-tan"></div>
        <p className="ml-4 text-lg text-gray-300">Verifying admin access...</p>
      </div>
    );
  }

  // Not logged in or not authorized
  if (!isAdmin) {
    // Log unauthorized access attempt
    if (user) {
      console.error('Unauthorized access attempt to admin section:', {
        userId: user.id,
        email: user.email
      });
    }
    
    return <Navigate to="/" replace />;
  }

  // Authorized - render the child routes
  return <Outlet />;
};

export default ProtectedRoute; 