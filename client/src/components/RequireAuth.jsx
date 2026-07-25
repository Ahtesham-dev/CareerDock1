import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

export default function RequireAuth({ children }) {
  const { guest, loading } = useAuth();
  if (loading) return null;
  if (guest) return <Navigate to="/dashboard" replace />;
  return children;
}
