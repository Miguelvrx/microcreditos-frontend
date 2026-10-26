import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
});

// Agrega el token JWT (si existe) a cada request saliente.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('microcreditos_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Si el backend responde 401 (token vencido o inválido), limpiamos la
// sesión guardada y mandamos al usuario de vuelta al login.
// Se excluye el propio login: un 401 ahí significa "credenciales
// incorrectas" y el formulario debe mostrar su error sin recargar.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const esLogin = (error.config?.url ?? '').includes('/auth/login');

    if (status === 401 && !esLogin) {
      localStorage.removeItem('microcreditos_token');
      localStorage.removeItem('microcreditos_nombre_usuario');
      localStorage.removeItem('microcreditos_rol');
      if (window.location.pathname !== '/login') {
        sessionStorage.setItem('sesion_expirada', '1');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;