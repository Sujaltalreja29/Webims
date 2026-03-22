import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import type { UserRole } from '../core/models';

interface RoleProtectedRouteProps {
  roles: UserRole[];
  children: React.ReactNode;
}

export const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({ roles, children }) => {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!roles.includes(user.role)) {
    return (
      <Navigate
        to="/access-denied"
        replace
        state={{
          attemptedPath: location.pathname,
          currentRole: user.role,
          requiredRoles: roles
        }}
      />
    );
  }

  return <>{children}</>;
};
