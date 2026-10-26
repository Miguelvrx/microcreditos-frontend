import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';

interface RutaPrivadaProps {
  children: ReactNode;
  // Si se especifica, solo un usuario con este rol exacto puede entrar.
  // Un usuario autenticado pero sin el rol correcto se manda al home, no
  // al login (ya está autenticado, solo no tiene permiso para esta pantalla).
  rolRequerido?: string;
}

export default function RutaPrivada({ children, rolRequerido }: RutaPrivadaProps) {
  const { isAuthenticated, rol } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (rolRequerido && rol !== rolRequerido) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}