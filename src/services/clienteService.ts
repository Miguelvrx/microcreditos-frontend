import api from '../config/api';
import type { Cliente, ClientePagina, ClienteCreateRequest } from '../types/Cliente';


export const clienteService = {
  // GET /api/clientes
  listarTodos: async (): Promise<Cliente[]> => {
    const response = await api.get<Cliente[]>('/clientes');
    return response.data;
  },

  // GET /api/clientes/pagina?texto=&pagina=&tamano=
  buscarPagina: async (
    texto: string,
    pagina: number,
    tamano: number
  ): Promise<ClientePagina> => {
    const response = await api.get<ClientePagina>('/clientes/pagina', {
      params: { texto, pagina, tamano },
    });
    return response.data;
  },

  // GET /api/clientes/{id}
  buscarPorId: async (id: number): Promise<Cliente> => {
    const response = await api.get<Cliente>(`/clientes/${id}`);
    return response.data;
  },

  // POST /api/clientes
  crear: async (cliente: ClienteCreateRequest): Promise<Cliente> => {
    const response = await api.post<Cliente>('/clientes', cliente);
    return response.data;
  },

  // PUT /api/clientes/{id}
  actualizar: async (id: number, cliente: ClienteCreateRequest): Promise<Cliente> => {
    const response = await api.put<Cliente>(`/clientes/${id}`, cliente);
    return response.data;
  },

  // DELETE /api/clientes/{id}
  eliminar: async (id: number): Promise<void> => {
    await api.delete(`/clientes/${id}`);
  },
};