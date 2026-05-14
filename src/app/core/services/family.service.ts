import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay, tap, catchError, throwError } from 'rxjs';
import { FamilyGroup, FamilyMember, JoinRequest, FamilySearchResult } from '../models';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class FamilyService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = 'http://localhost:8080/api/v1';

  readonly families = signal<FamilyGroup[]>([]);
  readonly currentFamily = signal<FamilyGroup | null>(null);
  readonly members = signal<FamilyMember[]>([]);
  readonly pendingRequests = signal<JoinRequest[]>([]);
  readonly myPendingRequests = signal<JoinRequest[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  createFamily(name: string): Observable<FamilyGroup> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.post<FamilyGroup>(`${this.apiUrl}/familias`, { name }).pipe(
      tap((family) => {
        this.families.update((list) => [...list, family]);
        this.currentFamily.set(family);
        this.authService.updateUserRole('ADMIN');
        this.loading.set(false);
      }),
      catchError((error) => {
        this.loading.set(false);
        if (error.status === 0 || error.status === 404) {
          // Mock: simular creación exitosa
          const mockFamily: FamilyGroup = {
            id: 'mock-family-' + Date.now(),
            name,
            createdBy: 'current-user',
            createdAt: new Date().toISOString(),
          };
          this.families.update((list) => [...list, mockFamily]);
          this.currentFamily.set(mockFamily);
          this.authService.updateUserRole('ADMIN');
          return of(mockFamily).pipe(delay(500));
        }
        this.error.set('Error al crear la familia');
        return throwError(() => error);
      }),
    );
  }

  joinFamily(familyId: string): Observable<void> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.post<void>(`${this.apiUrl}/familias/${familyId}/unirse`, {}).pipe(
      tap(() => {
        this.loading.set(false);
      }),
      catchError((error) => {
        this.loading.set(false);
        if (error.status === 0 || error.status === 404) {
          // Mock: simular unión exitosa
          return of(void 0).pipe(delay(500));
        }
        this.error.set('Error al unirse a la familia');
        return throwError(() => error);
      }),
    );
  }

  getMyFamilies(): Observable<FamilyGroup[]> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.get<FamilyGroup[]>(`${this.apiUrl}/familias/mis-familias`).pipe(
      tap((families) => {
        this.families.set(families);
        this.loading.set(false);
      }),
      catchError((error) => {
        this.loading.set(false);
        if (error.status === 0 || error.status === 404) {
          // Mock: devolver lista vacía
          return of([]).pipe(delay(300));
        }
        this.error.set('Error al cargar familias');
        return throwError(() => error);
      }),
    );
  }

  getMembers(familyId: string): Observable<FamilyMember[]> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.get<FamilyMember[]>(`${this.apiUrl}/familias/${familyId}/miembros`).pipe(
      tap((members) => {
        this.members.set(members);
        this.loading.set(false);
      }),
      catchError((error) => {
        this.loading.set(false);
        if (error.status === 0 || error.status === 404) {
          // Mock: devolver miembros simulados
          const mockMembers: FamilyMember[] = [
            {
              id: 'mock-member-1',
              userId: 'current-user',
              userEmail: 'usuario@familyfood.com',
              familyGroupId: familyId,
              role: 'ADMIN',
              joinedAt: new Date().toISOString(),
            },
          ];
          this.members.set(mockMembers);
          return of(mockMembers).pipe(delay(300));
        }
        this.error.set('Error al cargar miembros');
        return throwError(() => error);
      }),
    );
  }

  getPendingRequests(familyId: string): Observable<JoinRequest[]> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.get<JoinRequest[]>(`${this.apiUrl}/familias/${familyId}/solicitudes`).pipe(
      tap((requests) => {
        this.pendingRequests.set(requests);
        this.loading.set(false);
      }),
      catchError((error) => {
        this.loading.set(false);
        if (error.status === 0 || error.status === 404) {
          // Mock: devolver lista vacía
          this.pendingRequests.set([]);
          return of([]).pipe(delay(300));
        }
        this.error.set('Error al cargar solicitudes');
        return throwError(() => error);
      }),
    );
  }

  getMyPendingRequests(): Observable<JoinRequest[]> {
    return this.http.get<JoinRequest[]>(`${this.apiUrl}/familias/mis-solicitudes`).pipe(
      tap((requests) => {
        this.myPendingRequests.set(requests);
      }),
      catchError(() => {
        // Fallback mock para desarrollo
        const mockRequests: JoinRequest[] = [
          {
            id: 'mock-request-1',
            userId: 'mock-user-id',
            userName: 'Usuario',
            userEmail: 'usuario@email.com',
            familyGroupId: 'mock-family-id',
            familyGroupName: 'Familia García',
            status: 'PENDING',
            createdAt: new Date().toISOString(),
          },
        ];
        this.myPendingRequests.set(mockRequests);
        return of(mockRequests);
      }),
    );
  }

  approveRequest(requestId: string): Observable<void> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.put<void>(`${this.apiUrl}/familias/solicitudes/${requestId}/aprobar`, {}).pipe(
      tap(() => {
        this.pendingRequests.update((requests) => requests.filter((r) => r.id !== requestId));
        this.loading.set(false);
      }),
      catchError((error) => {
        this.loading.set(false);
        if (error.status === 0 || error.status === 404) {
          // Mock: simular aprobación
          this.pendingRequests.update((requests) => requests.filter((r) => r.id !== requestId));
          return of(void 0).pipe(delay(500));
        }
        this.error.set('Error al aprobar solicitud');
        return throwError(() => error);
      }),
    );
  }

  searchFamilies(query: string): Observable<FamilySearchResult[]> {
    if (!query || query.trim().length === 0) {
      return of([]);
    }
    return this.http
      .get<FamilySearchResult[]>(`${this.apiUrl}/familias/buscar`, {
        params: { q: query.trim() },
      })
      .pipe(
        catchError(() => {
          // Fallback mock para desarrollo
          return of(this.getMockSearchResults(query));
        }),
      );
  }

  private getMockSearchResults(query: string): FamilySearchResult[] {
    const mockFamilies: FamilySearchResult[] = [
      { id: 'mock-id-1', name: 'Familia García', memberCount: 4 },
      { id: 'mock-id-2', name: 'Los Pérez', memberCount: 3 },
      { id: 'mock-id-3', name: 'Familia Rodríguez', memberCount: 5 },
      { id: 'mock-id-4', name: 'Hermanos López', memberCount: 2 },
    ];
    const lowerQuery = query.toLowerCase();
    return mockFamilies.filter((f) => f.name.toLowerCase().includes(lowerQuery));
  }

  transferAdmin(familyId: string, memberId: string): Observable<void> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.put<void>(`${this.apiUrl}/familias/${familyId}/transferir-admin/${memberId}`, {}).pipe(
      tap(() => {
        // Refrescar miembros después de la transferencia
        this.getMembers(familyId).subscribe();
        this.loading.set(false);
      }),
      catchError((error) => {
        this.loading.set(false);
        if (error.status === 0 || error.status === 404) {
          // Mock: simular transferencia exitosa
          return of(void 0).pipe(delay(500));
        }
        this.error.set('Error al transferir la administración');
        return throwError(() => error);
      }),
    );
  }

  rejectRequest(requestId: string): Observable<void> {
    this.loading.set(true);
    this.error.set(null);

    return this.http
      .put<void>(`${this.apiUrl}/familias/solicitudes/${requestId}/rechazar`, {})
      .pipe(
        tap(() => {
          this.pendingRequests.update((requests) => requests.filter((r) => r.id !== requestId));
          this.loading.set(false);
        }),
        catchError((error) => {
          this.loading.set(false);
          if (error.status === 0 || error.status === 404) {
            // Mock: simular rechazo
            this.pendingRequests.update((requests) => requests.filter((r) => r.id !== requestId));
            return of(void 0).pipe(delay(500));
          }
          this.error.set('Error al rechazar solicitud');
          return throwError(() => error);
        }),
      );
  }
}
