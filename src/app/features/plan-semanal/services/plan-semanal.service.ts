import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { FamilyService } from '../../../core/services/family.service';
import {
  WeeklyPlan,
  SaveWeeklyPlanRequest,
  UpdateDayRequest,
  PlanDay,
  GenerateMenuRequest,
} from '../models/plan-semanal.model';

@Injectable({
  providedIn: 'root',
})
export class PlanSemanalService {
  private readonly http = inject(HttpClient);
  private readonly familyService = inject(FamilyService);
  private readonly apiUrl = 'http://localhost:8080/api/v1';

  // ===== SIGNALS =====
  private readonly _plan = signal<WeeklyPlan | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  private readonly _planVersion = signal(0);

  readonly plan = this._plan.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly planVersion = this._planVersion.asReadonly();

  // ===== WEEK NAVIGATION STATE =====
  private readonly _currentYear = signal<number>(new Date().getFullYear());
  private readonly _currentWeek = signal<number>(this.getCurrentISOWeek());

  readonly currentYear = this._currentYear.asReadonly();
  readonly currentWeek = this._currentWeek.asReadonly();

  // ===== HELPERS =====

  /** Actualiza el plan y la versión forzando change detection */
  private setPlan(plan: WeeklyPlan | null): void {
    this._plan.set(plan);
    this._planVersion.update((v) => v + 1);
  }

  /** Devuelve el familyGroupId actual */
  private getFamilyGroupId(): string {
    const family = this.familyService.currentFamily();
    if (family) return family.id;
    const families = this.familyService.families();
    if (families.length > 0) return families[0].id;
    return '';
  }

  /** Obtiene el número de semana ISO actual */
  getCurrentISOWeek(): number {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const daysOffset =
      ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 6) / 7;
    return Math.floor(daysOffset);
  }

  /** Navega a la semana anterior */
  previousWeek(): void {
    let year = this._currentYear();
    let week = this._currentWeek() - 1;
    if (week < 1) {
      year--;
      week = this.getWeeksInYear(year);
    }
    this._currentYear.set(year);
    this._currentWeek.set(week);
  }

  /** Navega a la semana siguiente */
  nextWeek(): void {
    let year = this._currentYear();
    let week = this._currentWeek() + 1;
    const maxWeeks = this.getWeeksInYear(year);
    if (week > maxWeeks) {
      year++;
      week = 1;
    }
    this._currentYear.set(year);
    this._currentWeek.set(week);
  }

  /** Obtiene el número de semanas ISO en un año */
  getWeeksInYear(year: number): number {
    const lastDay = new Date(year, 11, 31);
    const lastDayOfWeek = lastDay.getDay() || 7;
    const lastThursday = new Date(year, 11, 31 - ((lastDayOfWeek + 3) % 7));
    const firstThursday = new Date(year, 0, 1 + ((11 - new Date(year, 0, 1).getDay()) % 7));
    return Math.ceil((lastThursday.getTime() - firstThursday.getTime()) / (7 * 86400000)) + 1;
  }

  /** Calcula las fechas de inicio y fin de una semana ISO */
  getWeekDates(year: number, week: number): { startDate: string; endDate: string } {
    const jan4 = new Date(year, 0, 4);
    const dayOfWeek = jan4.getDay() || 7;
    const firstMonday = new Date(jan4);
    firstMonday.setDate(jan4.getDate() - (dayOfWeek - 1));
    const start = new Date(firstMonday);
    start.setDate(firstMonday.getDate() + (week - 1) * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  }

  /** Formatea rango de fechas para mostrar */
  formatDateRange(startDate: string, endDate: string): string {
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    const months = [
      'Ene',
      'Feb',
      'Mar',
      'Abr',
      'May',
      'Jun',
      'Jul',
      'Ago',
      'Sep',
      'Oct',
      'Nov',
      'Dic',
    ];
    if (start.getMonth() === end.getMonth()) {
      return `${start.getDate()} - ${end.getDate()} ${months[end.getMonth()]} ${end.getFullYear()}`;
    }
    return `${start.getDate()} ${months[start.getMonth()]} - ${end.getDate()} ${months[end.getMonth()]} ${end.getFullYear()}`;
  }

  // ===== API CALLS =====

  /** Obtener plan de una semana (backend auto-crea si no existe) */
  getPlan(familyGroupId: string, year: number, week: number): Observable<WeeklyPlan> {
    this._loading.set(true);
    this._error.set(null);

    const params = new HttpParams()
      .set('familyGroupId', familyGroupId)
      .set('year', year.toString())
      .set('weekNumber', week.toString());

    return this.http.get<WeeklyPlan>(`${this.apiUrl}/plan-semanal`, { params }).pipe(
      tap((plan) => {
        this.setPlan(plan);
        this._loading.set(false);
      }),
      catchError((err) => {
        this._loading.set(false);
        this._error.set(this.extractErrorMessage(err, 'Error al cargar el plan semanal'));
        return throwError(() => err);
      }),
    );
  }

  /** Guardar plan completo */
  guardarPlan(familyGroupId: string, request: SaveWeeklyPlanRequest): Observable<WeeklyPlan> {
    this._loading.set(true);
    this._error.set(null);

    const params = new HttpParams().set('familyGroupId', familyGroupId);

    return this.http.post<WeeklyPlan>(`${this.apiUrl}/plan-semanal`, request, { params }).pipe(
      tap((plan) => {
        this.setPlan(plan);
        this._loading.set(false);
      }),
      catchError((err) => {
        this._loading.set(false);
        this._error.set(this.extractErrorMessage(err, 'Error al guardar el plan'));
        return throwError(() => err);
      }),
    );
  }

  /** Actualizar un día/slot */
  actualizarDia(
    familyGroupId: string,
    year: number,
    week: number,
    request: UpdateDayRequest,
  ): Observable<PlanDay> {
    this._error.set(null);

    const params = new HttpParams()
      .set('familyGroupId', familyGroupId)
      .set('year', year.toString())
      .set('weekNumber', week.toString());

    return this.http.put<PlanDay>(`${this.apiUrl}/plan-semanal/dia`, request, { params }).pipe(
      tap((updatedDay) => {
        const currentPlan = this._plan();
        if (currentPlan) {
          const updatedDias = currentPlan.dias.map((d) =>
            d.dia === updatedDay.dia && d.tipo === updatedDay.tipo ? updatedDay : d,
          );
          this.setPlan({ ...currentPlan, dias: updatedDias });
        }
      }),
      catchError((err) => {
        this._error.set(this.extractErrorMessage(err, 'Error al actualizar el día'));
        return throwError(() => err);
      }),
    );
  }

  /** Generar menú automático (el backend guarda en BBDD) */
  generarMenu(familyGroupId: string, request: GenerateMenuRequest): Observable<WeeklyPlan> {
    this._loading.set(true);
    this._error.set(null);

    const params = new HttpParams().set('familyGroupId', familyGroupId);

    return this.http
      .post<WeeklyPlan>(`${this.apiUrl}/plan-semanal/generar`, request, { params })
      .pipe(
        tap((plan) => {
          this.setPlan(plan);
          this._loading.set(false);
        }),
        catchError((err) => {
          this._loading.set(false);
          this._error.set(this.extractErrorMessage(err, 'Error al generar el menú'));
          return throwError(() => err);
        }),
      );
  }

  /** Recargar el plan para la semana actual */
  recargarPlan(): void {
    const familyGroupId = this.getFamilyGroupId();
    if (familyGroupId) {
      this.getPlan(familyGroupId, this._currentYear(), this._currentWeek()).subscribe();
    }
  }

  /** Clears error state */
  clearError(): void {
    this._error.set(null);
  }

  // ===== PRIVATE =====

  private extractErrorMessage(
    err: { status?: number; error?: { mensaje?: string; error?: string } },
    defaultMessage: string,
  ): string {
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
      return 'No se encontró el plan para esta semana.';
    }
    if (err?.status === 0) {
      return 'No se pudo conectar con el servidor.';
    }
    return defaultMessage;
  }
}
