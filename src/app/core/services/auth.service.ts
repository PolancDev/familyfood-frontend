import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of, delay, tap, catchError, throwError } from 'rxjs';
import { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from '../models';
import { User, Role } from '../models';

export const AUTH_TOKEN_KEY = 'familyfood_token';
export const AUTH_USER_KEY = 'familyfood_user';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = 'http://localhost:8080/api/v1'; // TODO: usar environment.apiUrl cuando se configure

  // Signals para estado reactivo
  private readonly _token = signal<string | null>(this.getStoredToken());
  private readonly _user = signal<User | null>(this.getStoredUser());

  // Computed signals
  readonly token = this._token.asReadonly();
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => !!this._token() && !!this._user());
  readonly userRole = computed(() => this._user()?.role);

  private getStoredToken(): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }

  private getStoredUser(): User | null {
    if (typeof localStorage === 'undefined') return null;
    const userStr = localStorage.getItem(AUTH_USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  private storeAuth(token: string, user: User): void {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    this._token.set(token);
    this._user.set(user);
  }

  private clearAuth(): void {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    this._token.set(null);
    this._user.set(null);
  }

  /**
   * Actualiza el rol del usuario en memoria y localStorage.
   * Útil cuando el usuario crea una familia y pasa de INVITADO a ADMIN.
   */
  updateUserRole(newRole: Role): void {
    const currentUser = this._user();
    if (currentUser) {
      const updatedUser: User = { ...currentUser, role: newRole };
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updatedUser));
      this._user.set(updatedUser);
    }
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    // MOCK: Simulación de respuesta para desarrollo
    // En producción, usar: return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, credentials);

    const mockUsers: Record<string, { password: string; user: User; token: string }> = {
      'admin@familyfood.com': {
        password: 'admin123',
        user: {
          id: '1',
          email: 'admin@familyfood.com',
          nombre: 'Administrador',
          role: 'ADMIN',
        },
        token: 'mock-jwt-token-admin-123456',
      },
      'consumer@familyfood.com': {
        password: 'consumer123',
        user: {
          id: '2',
          email: 'consumer@familyfood.com',
          nombre: 'Usuario Demo',
          role: 'CONSUMER',
        },
        token: 'mock-jwt-token-consumer-789012',
      },
    };

    const mockUser = mockUsers[credentials.email];

    if (mockUser && mockUser.password === credentials.password) {
      return of({ token: mockUser.token, user: mockUser.user }).pipe(
        delay(800),
        tap((response) => this.storeAuth(response.token, response.user)),
      );
    }

    // Intentar llamada real al backend
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap((response) => this.storeAuth(response.token, response.user)),
      catchError((error) => {
        // Si el backend no está disponible, usar mock
        if (error.status === 0 || error.status === 404) {
          if (mockUser && mockUser.password === credentials.password) {
            return of({ token: mockUser.token, user: mockUser.user }).pipe(
              delay(800),
              tap((response) => this.storeAuth(response.token, response.user)),
            );
          }
        }
        return throwError(() => error);
      }),
    );
  }

  register(data: RegisterRequest): Observable<RegisterResponse> {
    // MOCK: Simulación de respuesta para desarrollo
    // En producción, usar: return this.http.post<RegisterResponse>(`${this.apiUrl}/auth/register`, data);

    return this.http.post<RegisterResponse>(`${this.apiUrl}/auth/register`, data).pipe(
      tap((response) => {
        const user: User = {
          id: response.id,
          email: response.email,
          nombre: response.nombre,
          role: response.role,
        };
        this.storeAuth(response.token, user);
      }),
      catchError((error) => {
        // Si el backend no está disponible, simular registro exitoso
        if (error.status === 0 || error.status === 404) {
          const mockUser: User = {
            id: 'mock-uuid-' + Date.now(),
            email: data.email,
            nombre: data.nombre,
            role: data.role || 'INVITADO',
          };
          return of({
            ...mockUser,
            token: 'mock-jwt-token-' + Date.now(),
          }).pipe(
            delay(1000),
            tap((response) => {
              if (response.token) {
                this.storeAuth(response.token, mockUser);
              }
            }),
          );
        }
        return throwError(() => error);
      }),
    );
  }

  logout(): void {
    this.clearAuth();
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return this._token();
  }
}
