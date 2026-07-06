import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './auth';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading workspace…</div>;
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
