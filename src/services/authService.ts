import api from '../config/api';
import type { LoginRequest, LoginResponse } from '../types/Auth';

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>('/auth/login', credentials);
  return response.data;
}