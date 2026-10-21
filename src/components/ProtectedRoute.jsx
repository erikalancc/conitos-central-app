import { Navigate, Outlet } from 'react-router-dom';
import { getSession } from '../auth/session';
import { tieneRol } from '../auth/roles';

// Redirige al login si no hay sesión activa; con `roles`, manda a Inicio a quien no tenga permiso
const ProtectedRoute = ({ roles }) => {
  const usuario = getSession();
  if (!usuario) return <Navigate to="/login" replace />;
  if (!tieneRol(usuario, roles)) return <Navigate to="/inicio" replace />;
  return <Outlet />;
};

export default ProtectedRoute;
