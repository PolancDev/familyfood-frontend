import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router } from '@angular/router';
import { authGuard, guestGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';
import { signal } from '@angular/core';

describe('Auth Guards', () => {
  let mockAuthService: any;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(() => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    mockAuthService = {
      isAuthenticated: signal(false),
      user: signal(null),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: Router, useValue: mockRouter }],
    });
  });

  describe('authGuard', () => {
    let guard: CanActivateFn;

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          authGuard,
          { provide: AuthService, useValue: mockAuthService },
          { provide: Router, useValue: mockRouter },
        ],
      });
      guard = TestBed.runInTestingContext(authGuard);
    });

    it('should allow access when authenticated', () => {
      mockAuthService.isAuthenticated = signal(true);

      const result = guard({} as any, { url: '/home' } as any);

      expect(result).toBeTrue();
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should deny access and redirect to login when not authenticated', () => {
      mockAuthService.isAuthenticated = signal(false);

      const result = guard({} as any, { url: '/home' } as any);

      expect(result).toBeFalse();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/login'], {
        queryParams: { returnUrl: '/home' },
      });
    });

    it('should preserve the original URL in query params', () => {
      mockAuthService.isAuthenticated = signal(false);

      guard({} as any, { url: '/plan-semanal' } as any);

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/login'], {
        queryParams: { returnUrl: '/plan-semanal' },
      });
    });
  });

  describe('guestGuard', () => {
    let guard: CanActivateFn;

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          guestGuard,
          { provide: AuthService, useValue: mockAuthService },
          { provide: Router, useValue: mockRouter },
        ],
      });
      guard = TestBed.runInTestingContext(guestGuard);
    });

    it('should allow access when not authenticated', () => {
      mockAuthService.isAuthenticated = signal(false);

      const result = guard({} as any, { url: '/auth/login' } as any);

      expect(result).toBeTrue();
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should deny access and redirect to home when already authenticated', () => {
      mockAuthService.isAuthenticated = signal(true);

      const result = guard({} as any, { url: '/auth/login' } as any);

      expect(result).toBeFalse();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
    });
  });
});
