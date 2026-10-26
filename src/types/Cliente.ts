import type { Credito } from './Credito';

// Refleja la entidad Cliente.java tal como la devuelve el backend (GET)
export interface Cliente {
  id: number;
  nombreCompleto: string;
  numeroDocumento: string;
  telefono: string;
  direccion: string;
  fechaRegistro: string; // formato ISO: "2026-09-13"
  creditos: Credito[] | null;
}

// Body que espera POST /api/clientes y PUT /api/clientes/{id}
// (el backend recibe un Cliente completo, pero solo usa estos campos)
export interface ClienteCreateRequest {
  nombreCompleto: string;
  numeroDocumento: string;
  telefono: string;
  direccion: string;
}


export interface ClientePagina {
    contenido: Cliente[];
    pagina: number;
    tamano: number;
    totalElementos: number;
    totalPaginas: number;
}