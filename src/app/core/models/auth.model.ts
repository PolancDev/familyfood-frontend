import { User, Role } from './user.model';

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
  role?: Role;
}

export interface RegisterResponse {
  id: string;
  email: string;
  nombre: string;
  role: Role;
  token: string;
}

export interface ErrorResponse {
  error: string;
  mensaje?: string;
}
