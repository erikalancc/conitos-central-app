import { Navigate, Outlet } from 'react-router-dom';
import { getSession } from '../auth/session';

// Redirige al login si no hay sesión activa
const ProtectedRoute = () => (getSession() ? <Outlet /> : <Navigate to="/login" replace />);

export default ProtectedRoute;
