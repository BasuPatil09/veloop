import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { VeloopLoader } from '../common/VeloopLoader/VeloopLoader';

/**
 * Usage:
 *   <Route element={<ProtectedRoute />}>...user-only routes...</Route>
 *   <Route element={<ProtectedRoute requireRole="admin" />}>...admin routes...</Route>
 *
 * Waits for the silent session-restore (via the refresh cookie) to finish before
 * deciding — otherwise a hard page reload would incorrectly bounce a logged-in
 * user to /login for a split second.
 */
export function ProtectedRoute({ requireRole }) {
  const { isAuthenticated, isInitializing, user } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return <VeloopLoader message="Checking your session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requireRole && user.role !== requireRole) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
