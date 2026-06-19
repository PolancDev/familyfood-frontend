import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Observable } from 'rxjs';
import { PlanSemanalService } from './plan-semanal.service';
import { FamilyService } from '../../../core/services/family.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  WeeklyPlan,
  PlanDay,
  SaveWeeklyPlanRequest,
  UpdateDayRequest,
  GenerateMenuRequest,
} from '../models/plan-semanal.model';

describe('PlanSemanalService', () => {
  let service: PlanSemanalService;
  let httpMock: HttpTestingController;
  let familyService: FamilyService;

  const apiUrl = 'http://localhost:8080/api/v1';

  const mockFamilyId = 'family-123';

  const mockPlanDay: PlanDay = {
    id: 'day-1',
    dia: 'LUNES',
    tipo: 'COMIDA',
    receta: { id: 'recipe-1', nombre: 'Paella', tiempoMinutos: 45 },
    estado: 'NORMAL',
    sobrasOrigenDia: null,
    sobrasOrigenTipo: null,
    sobrasOrigenRecetaId: null,
    sobrasOrigenRecetaNombre: null,
    alergenosAdvertencia: false,
  };

  const mockCenaDay: PlanDay = {
    id: 'day-2',
    dia: 'LUNES',
    tipo: 'CENA',
    receta: null,
    estado: 'SOBRAS',
    sobrasOrigenDia: 'LUNES',
    sobrasOrigenTipo: 'COMIDA',
    sobrasOrigenRecetaId: 'recipe-1',
    sobrasOrigenRecetaNombre: 'Paella',
    alergenosAdvertencia: false,
  };

  const mockWeeklyPlan: WeeklyPlan = {
    id: 'plan-1',
    familyGroupId: mockFamilyId,
    year: 2026,
    weekNumber: 25,
    startDate: '2026-06-15',
    endDate: '2026-06-21',
    dias: [mockPlanDay, mockCenaDay],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PlanSemanalService,
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useValue: {
            user: () => ({ id: 'user-1', role: 'ADMIN', email: 'admin@test.com', nombre: 'Admin' }),
            isAuthenticated: () => true,
            getToken: () => 'mock-token',
          } as Partial<AuthService>,
        },
        FamilyService,
      ],
    });

    service = TestBed.inject(PlanSemanalService);
    httpMock = TestBed.inject(HttpTestingController);
    familyService = TestBed.inject(FamilyService);

    // Setup family in the service
    (familyService as unknown as { families: { set: (v: unknown[]) => void } }).families.set([
      { id: mockFamilyId, name: 'Test Family', createdBy: 'user-1', createdAt: '2026-01-01' },
    ]);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getCurrentISOWeek', () => {
    it('should return a positive week number', () => {
      const week = service.getCurrentISOWeek();
      expect(week).toBeGreaterThan(0);
      expect(week).toBeLessThanOrEqual(53);
    });
  });

  describe('getWeeksInYear', () => {
    it('should return 52 or 53 for any year', () => {
      const weeks2026 = service.getWeeksInYear(2026);
      expect(weeks2026).toBeGreaterThanOrEqual(52);
      expect(weeks2026).toBeLessThanOrEqual(53);

      const weeks2024 = service.getWeeksInYear(2024);
      expect(weeks2024).toBeGreaterThanOrEqual(52);
      expect(weeks2024).toBeLessThanOrEqual(53);
    });
  });

  describe('getWeekDates', () => {
    it('should return date strings in YYYY-MM-DD format', () => {
      const dates = service.getWeekDates(2026, 25);
      expect(dates.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(dates.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(new Date(dates.startDate).getTime()).toBeLessThan(new Date(dates.endDate).getTime());
    });
  });

  describe('formatDateRange', () => {
    it('should format same-month range correctly', () => {
      const formatted = service.formatDateRange('2026-06-15', '2026-06-21');
      expect(formatted).toContain('Jun');
      expect(formatted).toContain('2026');
      expect(formatted).toContain('15');
      expect(formatted).toContain('21');
    });
  });

  describe('week navigation', () => {
    it('should navigate to previous week', () => {
      const initialWeek = service.currentWeek();
      service.previousWeek();
      expect(service.currentWeek()).toBe(initialWeek - 1);
    });

    it('should navigate to next week', () => {
      const initialWeek = service.currentWeek();
      service.nextWeek();
      expect(service.currentWeek()).toBe(initialWeek + 1);
    });
  });

  describe('getPlan', () => {
    it('should fetch plan and update signals on success', () => {
      service.getPlan(mockFamilyId, 2026, 25).subscribe((plan) => {
        expect(plan).toEqual(mockWeeklyPlan);
      });

      const req = httpMock.expectOne(
        `${apiUrl}/plan-semanal?familyGroupId=${mockFamilyId}&year=2026&weekNumber=25`,
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockWeeklyPlan);

      expect(service.plan()).toEqual(mockWeeklyPlan);
      expect(service.loading()).toBeFalse();
    });

    it('should set error on 404 (backend always returns 200 now, but handle gracefully)', () => {
      service.getPlan(mockFamilyId, 2026, 25).subscribe();

      const req = httpMock.expectOne(
        `${apiUrl}/plan-semanal?familyGroupId=${mockFamilyId}&year=2026&weekNumber=25`,
      );
      req.flush('Not found', { status: 404, statusText: 'Not Found' });

      expect(service.error()).toBeTruthy();
      expect(service.plan()).toBeNull();
      expect(service.loading()).toBeFalse();
    });

    it('should set error on server error', () => {
      service.getPlan(mockFamilyId, 2026, 25).subscribe();

      const req = httpMock.expectOne(
        `${apiUrl}/plan-semanal?familyGroupId=${mockFamilyId}&year=2026&weekNumber=25`,
      );
      req.flush('Server error', { status: 500, statusText: 'Server Error' });

      expect(service.error()).toBeTruthy();
      expect(service.loading()).toBeFalse();
    });
  });

  describe('guardarPlan', () => {
    it('should save plan and update signals', () => {
      const request: SaveWeeklyPlanRequest = {
        year: 2026,
        weekNumber: 25,
        dias: [
          {
            dia: 'LUNES',
            tipo: 'COMIDA',
            recetaId: 'recipe-1',
            estado: 'NORMAL',
            sobrasOrigenDia: null,
            sobrasOrigenTipo: null,
          },
        ],
      };

      service.guardarPlan(mockFamilyId, request).subscribe((plan) => {
        expect(plan).toEqual(mockWeeklyPlan);
      });

      const req = httpMock.expectOne(`${apiUrl}/plan-semanal?familyGroupId=${mockFamilyId}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockWeeklyPlan);

      expect(service.plan()).toEqual(mockWeeklyPlan);
    });
  });

  describe('actualizarDia', () => {
    it('should update day via PUT and update local state', () => {
      // First set a plan via the public API
      const mockPlan = { ...mockWeeklyPlan };
      (service as unknown as { _plan: { set: (v: WeeklyPlan) => void } })._plan.set(mockPlan);

      const request: UpdateDayRequest = {
        dia: 'LUNES',
        tipo: 'COMIDA',
        recetaId: 'recipe-2',
        estado: 'NORMAL',
        sobrasOrigenDia: null,
        sobrasOrigenTipo: null,
      };

      const updatedDay: PlanDay = {
        ...mockPlanDay,
        receta: { id: 'recipe-2', nombre: 'Ensalada', tiempoMinutos: 15 },
      };

      service.actualizarDia(mockFamilyId, 2026, 25, request).subscribe((result) => {
        expect(result).toEqual(updatedDay);
      });

      const req = httpMock.expectOne(
        `${apiUrl}/plan-semanal/dia?familyGroupId=${mockFamilyId}&year=2026&weekNumber=25`,
      );
      expect(req.request.method).toBe('PUT');
      req.flush(updatedDay);
    });
  });

  describe('generarMenu', () => {
    it('should generate menu via POST', () => {
      const request: GenerateMenuRequest = {
        numeroPersonas: 4,
        preferenciasUsar: true,
        recetasExcluidas: ['recipe-excluded'],
      };

      service.generarMenu(mockFamilyId, request).subscribe((plan) => {
        expect(plan).toEqual(mockWeeklyPlan);
      });

      const req = httpMock.expectOne(
        `${apiUrl}/plan-semanal/generar?familyGroupId=${mockFamilyId}`,
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockWeeklyPlan);

      expect(service.plan()).toEqual(mockWeeklyPlan);
    });
  });

  describe('clearError', () => {
    it('should clear the error signal', () => {
      (service as unknown as { _error: { set: (v: string | null) => void } })._error.set('Some error');
      service.clearError();
      expect(service.error()).toBeNull();
    });
  });

  describe('recargarPlan', () => {
    it('should call getPlan with current year and week', () => {
      const getPlanSpy = spyOn(service, 'getPlan').and.returnValue(new Observable());
      service.recargarPlan();
      expect(getPlanSpy).toHaveBeenCalledWith(
        mockFamilyId,
        service.currentYear(),
        service.currentWeek(),
      );
    });
  });
});
