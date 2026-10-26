import api from '../config/api';
import type { Usuario, UsuarioCreateRequest } from '../types/Usuario';

export const usuarioService = {
  listarTodos: async (): Promise<Usuario[]> => {
    const response = await api.get<Usuario[]>('/usuarios');
    return response.data;
  },

  // Reusa /api/auth/registro (ya protegido por rol ADMIN en el backend).
  // OJO: ese endpoint responde con texto plano ("Usuario creado: ..."),
  // no un objeto Usuario, así que después de crear hay que volver a listar
  // en vez de usar la respuesta directamente.
  crear: async (usuario: UsuarioCreateRequest): Promise<void> => {
    await api.post('/auth/registro', usuario);
  },

  desactivar: async (id: number): Promise<Usuario> => {
    const response = await api.put<Usuario>(`/usuarios/${id}/desactivar`);
    return response.data;
  },

  activar: async (id: number): Promise<Usuario> => {
    const response = await api.put<Usuario>(`/usuarios/${id}/activar`);
    return response.data;
  },
};