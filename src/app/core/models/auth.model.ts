import { User } from './user.model';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  nombre: string;
  role?: 'ADMIN' | 'CONSUMER';
}

export interface RegisterResponse {
  id: string;
  email: string;
  nombre: string;
  role: 'ADMIN' | 'CONSUMER';
  token?: string;
}

export interface ErrorResponse {
  error: string;
  mensaje?: string;
}
