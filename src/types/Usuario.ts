export interface Usuario {
  id: number;
  nombreUsuario: string;
  rol: string;
  activo: boolean;
}

export interface UsuarioCreateRequest {
  nombreUsuario: string;
  password: string;
  rol: string;
}