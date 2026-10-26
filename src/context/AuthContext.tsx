import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { login as loginRequest } from '../services/authService';
import type { LoginRequest } from '../types/Auth';

interface AuthContextValue {
  token: string | null;
  nombreUsuario: string | null;
  rol: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Guardamos el token en localStorage para que la sesión sobreviva a un
// refresh de página (F5). La contrapartida es que queda expuesto a XSS si
// en algún momento se inyecta script malicioso en la app; si eso te
// preocupa más que la comodidad de no re-loguearte en cada refresh, se
// puede cambiar fácilmente a solo useState (en memoria, se pierde al
// recargar).
const TOKEN_KEY = 'microcreditos_token';
const NOMBRE_USUARIO_KEY = 'microcreditos_nombre_usuario';
const ROL_KEY = 'microcreditos_rol';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [nombreUsuario, setNombreUsuario] = useState<string | null>(() =>
    localStorage.getItem(NOMBRE_USUARIO_KEY)
  );
  const [rol, setRol] = useState<string | null>(() => localStorage.getItem(ROL_KEY));

  async function login(credentials: LoginRequest) {
    const data = await loginRequest(credentials);

    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(NOMBRE_USUARIO_KEY, data.nombreUsuario);
    localStorage.setItem(ROL_KEY, data.rol);

    setToken(data.token);
    setNombreUsuario(data.nombreUsuario);
    setRol(data.rol);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(NOMBRE_USUARIO_KEY);
    localStorage.removeItem(ROL_KEY);

    setToken(null);
    setNombreUsuario(null);
    setRol(null);
  }

  const value: AuthContextValue = {
    token,
    nombreUsuario,
    rol,
    isAuthenticated: token !== null,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un <AuthProvider>');
  }
  return context;
}