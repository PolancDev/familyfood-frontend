import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  Observable,
  of,
  tap,
  catchError,
  throwError,
  debounceTime,
  switchMap,
  Subject,
} from 'rxjs';
import {
  Recipe,
  RecipeListResponse,
  CreateRecipeRequest,
  UpdateRecipeRequest,
  EtiquetaReceta,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class RecipeService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/v1';

  // ===== SIGNALS DE ESTADO =====
  private readonly _recipes = signal<Recipe[]>([]);
  private readonly _currentRecipe = signal<Recipe | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  // ===== FILTROS =====
  private readonly _filterFavoritas = signal<boolean | undefined>(undefined);
  private readonly _filterBusqueda = signal<string>('');
  private readonly _filterEtiqueta = signal<EtiquetaReceta | ''>('');

  // ===== SUBJECT PARA DEBOUNCE DE BÚSQUEDA =====
  private readonly searchSubject = new Subject<string>();

  // ===== SIGNALS PÚBLICOS (readonly) =====
  readonly recipes = this._recipes.asReadonly();
  readonly currentRecipe = this._currentRecipe.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly filterFavoritas = this._filterFavoritas.asReadonly();
  readonly filterBusqueda = this._filterBusqueda.asReadonly();
  readonly filterEtiqueta = this._filterEtiqueta.asReadonly();

  // ===== COMPUTED =====
  readonly recipeCount = computed(() => this._recipes().length);
  readonly hasRecipes = computed(() => this._recipes().length > 0);

  constructor() {
    // Debounce de búsqueda: esperar 300ms antes de lanzar la petición
    this.searchSubject
      .pipe(
        debounceTime(300),
        switchMap((term) => {
          this._filterBusqueda.set(term);
          return this.fetchRecipes();
        }),
      )
      .subscribe();
  }

  // ===== MÉTODOS DE CARGA =====

  /** Carga la lista de recetas aplicando los filtros actuales */
  loadRecipes(): void {
    this.fetchRecipes().subscribe();
  }

  /** Carga el detalle de una receta por ID */
  loadRecipe(id: string): Observable<Recipe> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.get<Recipe>(`${this.apiUrl}/recetas/${id}`).pipe(
      tap((recipe) => {
        this._currentRecipe.set(recipe);
        this._loading.set(false);
      }),
      catchError((err) => {
        this._loading.set(false);
        this._error.set(this.extractErrorMessage(err, 'Error al cargar la receta'));
        return throwError(() => err);
      }),
    );
  }

  // ===== MÉTODOS DE ESCRITURA =====

  /** Crea una nueva receta */
  createRecipe(request: CreateRecipeRequest): Observable<Recipe> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.post<Recipe>(`${this.apiUrl}/recetas`, request).pipe(
      tap((recipe) => {
        this._recipes.update((list) => [recipe, ...list]);
        this._loading.set(false);
      }),
      catchError((err) => {
        this._loading.set(false);
        this._error.set(this.extractErrorMessage(err, 'Error al crear la receta'));
        return throwError(() => err);
      }),
    );
  }

  /** Actualiza una receta existente */
  updateRecipe(id: string, request: UpdateRecipeRequest): Observable<Recipe> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.put<Recipe>(`${this.apiUrl}/recetas/${id}`, request).pipe(
      tap((updatedRecipe) => {
        this._recipes.update((list) => list.map((r) => (r.id === id ? updatedRecipe : r)));
        this._currentRecipe.set(updatedRecipe);
        this._loading.set(false);
      }),
      catchError((err) => {
        this._loading.set(false);
        this._error.set(this.extractErrorMessage(err, 'Error al actualizar la receta'));
        return throwError(() => err);
      }),
    );
  }

  /** Elimina una receta por ID */
  deleteRecipe(id: string): Observable<void> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.delete<void>(`${this.apiUrl}/recetas/${id}`).pipe(
      tap(() => {
        this._recipes.update((list) => list.filter((r) => r.id !== id));
        if (this._currentRecipe()?.id === id) {
          this._currentRecipe.set(null);
        }
        this._loading.set(false);
      }),
      catchError((err) => {
        this._loading.set(false);
        this._error.set(this.extractErrorMessage(err, 'Error al eliminar la receta'));
        return throwError(() => err);
      }),
    );
  }

  /** Alterna el estado de favorita de una receta */
  toggleFavorita(id: string): Observable<Recipe> {
    this._error.set(null);

    return this.http.post<Recipe>(`${this.apiUrl}/recetas/${id}/favorita`, {}).pipe(
      tap((updatedRecipe) => {
        this._recipes.update((list) => list.map((r) => (r.id === id ? updatedRecipe : r)));
        if (this._currentRecipe()?.id === id) {
          this._currentRecipe.set(updatedRecipe);
        }
      }),
      catchError((err) => {
        this._error.set(this.extractErrorMessage(err, 'Error al cambiar favorita'));
        return throwError(() => err);
      }),
    );
  }

  // ===== FILTROS =====

  /** Establece el filtro de favoritas y recarga */
  setFilterFavoritas(favoritas: boolean | undefined): void {
    this._filterFavoritas.set(favoritas);
    this.loadRecipes();
  }

  /** Establece el filtro de búsqueda con debounce */
  setFilterBusqueda(term: string): void {
    this.searchSubject.next(term);
  }

  /** Establece el filtro de etiqueta y recarga */
  setFilterEtiqueta(etiqueta: EtiquetaReceta | ''): void {
    this._filterEtiqueta.set(etiqueta);
    this.loadRecipes();
  }

  /** Limpia todos los filtros y recarga */
  clearFilters(): void {
    this._filterFavoritas.set(undefined);
    this._filterBusqueda.set('');
    this._filterEtiqueta.set('');
    this.loadRecipes();
  }

  // ===== UTILIDADES =====

  /** Limpia la receta actual (al salir del detalle) */
  clearCurrentRecipe(): void {
    this._currentRecipe.set(null);
  }

  /** Limpia el error */
  clearError(): void {
    this._error.set(null);
  }

  // ===== MÉTODOS PRIVADOS =====

  /** Construye los HttpParams a partir de los filtros actuales */
  private buildParams(): HttpParams {
    let params = new HttpParams();
    const favoritas = this._filterFavoritas();
    const busqueda = this._filterBusqueda();
    const etiqueta = this._filterEtiqueta();

    if (favoritas !== undefined && favoritas !== null) {
      params = params.set('favoritas', favoritas.toString());
    }
    if (busqueda) {
      params = params.set('busqueda', busqueda);
    }
    if (etiqueta) {
      params = params.set('etiqueta', etiqueta);
    }
    return params;
  }

  /** Petición HTTP para obtener la lista de recetas */
  private fetchRecipes(): Observable<RecipeListResponse> {
    this._loading.set(true);
    this._error.set(null);

    const params = this.buildParams();

    return this.http.get<RecipeListResponse>(`${this.apiUrl}/recetas`, { params }).pipe(
      tap((response) => {
        this._recipes.set(response.recetas);
        this._loading.set(false);
      }),
      catchError((err) => {
        this._loading.set(false);
        if (err.status === 0) {
          // Backend no disponible: mantener lista vacía
          this._recipes.set([]);
          this._error.set('No se pudo conectar con el servidor. Inténtalo más tarde.');
          return of({ recetas: [] as Recipe[] });
        }
        this._error.set(this.extractErrorMessage(err, 'Error al cargar las recetas'));
        return throwError(() => err);
      }),
    );
  }

  /** Extrae un mensaje de error legible desde la respuesta HTTP */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extractErrorMessage(err: any, defaultMessage: string): string {
    if (err?.error?.mensaje) {
      return err.error.mensaje;
    }
    if (err?.error?.error) {
      return err.error.error;
    }
    if (err?.status === 401) {
      return 'Sesión expirada. Por favor, inicia sesión de nuevo.';
    }
    if (err?.status === 403) {
      return 'No tienes permisos para realizar esta acción.';
    }
    if (err?.status === 404) {
      return 'Recurso no encontrado.';
    }
    if (err?.status === 0) {
      return 'No se pudo conectar con el servidor.';
    }
    return defaultMessage;
  }
}
