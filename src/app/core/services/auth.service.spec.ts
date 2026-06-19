import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService, AUTH_TOKEN_KEY, AUTH_USER_KEY } from './auth.service';
import { Router } from '@angular/router';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;

  const mockUser = {
    id: '1',
    email: 'admin@familyfood.com',
    nombre: 'Test Admin',
    role: 'ADMIN' as const,
  };

  const mockToken = 'mock-jwt-token-123456';
  const API_AUTH_LOGIN = 'http://localhost:8080/api/v1/auth/login';
  const API_AUTH_REGISTER = 'http://localhost:8080/api/v1/auth/register';

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        {
          provide: Router,
          useValue: { navigate: jasmine.createSpy('navigate') },
        },
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should start as not authenticated', () => {
      expect(service.isAuthenticated()).toBeFalse();
    });

    it('should start with null user', () => {
      expect(service.user()).toBeNull();
    });

    it('should start with null token', () => {
      expect(service.getToken()).toBeNull();
    });
  });

  describe('login', () => {
    it('should login with mock admin credentials', fakeAsync(() => {
      let response: any;
      service
        .login({
          email: 'admin@familyfood.com',
          password: 'admin123',
        })
        .subscribe({
          next: (r) => (response = r),
        });
      tick(800);
      expect(response.token).toBeTruthy();
      expect(response.user.email).toBe('admin@familyfood.com');
    }));

    it('should login with mock consumer credentials', fakeAsync(() => {
      let response: any;
      service
        .login({
          email: 'consumer@familyfood.com',
          password: 'consumer123',
        })
        .subscribe({
          next: (r) => (response = r),
        });
      tick(800);
      expect(response.token).toBeTruthy();
      expect(response.user.role).toBe('CONSUMER');
    }));

    it('should update isAuthenticated signal after login', fakeAsync(() => {
      service
        .login({
          email: 'admin@familyfood.com',
          password: 'admin123',
        })
        .subscribe();
      tick(800);
      expect(service.isAuthenticated()).toBeTrue();
    }));

    it('should store token and user in localStorage', fakeAsync(() => {
      service
        .login({
          email: 'admin@familyfood.com',
          password: 'admin123',
        })
        .subscribe();
      tick(800);
      expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeTruthy();
      expect(localStorage.getItem(AUTH_USER_KEY)).toBeTruthy();
    }));

    it('should fail login with wrong password', fakeAsync(() => {
      let errorReceived: any;
      service
        .login({
          email: 'admin@familyfood.com',
          password: 'wrongpassword',
        })
        .subscribe({
          error: (err) => (errorReceived = err),
        });

      const req = httpMock.expectOne(API_AUTH_LOGIN);
      req.flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });
      tick();

      expect(errorReceived).toBeTruthy();
    }));

    it('should fail login with non-existent user', fakeAsync(() => {
      let errorReceived: any;
      service
        .login({
          email: 'nonexistent@test.com',
          password: 'password123',
        })
        .subscribe({
          error: (err) => (errorReceived = err),
        });

      const req = httpMock.expectOne(API_AUTH_LOGIN);
      req.flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });
      tick();

      expect(errorReceived).toBeTruthy();
    }));
  });

  describe('register', () => {
    it('should register new user', fakeAsync(() => {
      let response: any;
      service
        .register({
          email: 'newuser@test.com',
          password: 'password123',
          nombre: 'New User',
          role: 'ADMIN',
        })
        .subscribe({
          next: (r) => (response = r),
        });

      // Register siempre intenta HTTP → simulamos backend no disponible
      const req = httpMock.expectOne(API_AUTH_REGISTER);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });

      tick(1000); // delay(1000) del fallback mock
      expect(response.email).toBe('newuser@test.com');
      expect(response.nombre).toBe('New User');
    }));

    it('should update isAuthenticated after registration', fakeAsync(() => {
      service
        .register({
          email: 'newuser@test.com',
          password: 'password123',
          nombre: 'New User',
        })
        .subscribe();

      const req = httpMock.expectOne(API_AUTH_REGISTER);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });

      tick(1000);
      expect(service.isAuthenticated()).toBeTrue();
    }));
  });

  describe('logout', () => {
    it('should clear auth state', fakeAsync(() => {
      // Primero hacer login (con delay de 800ms)
      service
        .login({
          email: 'admin@familyfood.com',
          password: 'admin123',
        })
        .subscribe();
      tick(800);

      // Luego logout
      service.logout();

      expect(service.isAuthenticated()).toBeFalse();
      expect(service.user()).toBeNull();
      expect(service.getToken()).toBeNull();
    }));

    it('should clear localStorage', fakeAsync(() => {
      service
        .login({
          email: 'admin@familyfood.com',
          password: 'admin123',
        })
        .subscribe();
      tick(800);

      service.logout();

      expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
      expect(localStorage.getItem(AUTH_USER_KEY)).toBeNull();
    }));

    it('should navigate to login page', () => {
      service.logout();
      expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
    });
  });

  describe('token management', () => {
    it('should return stored token', () => {
      localStorage.setItem(AUTH_TOKEN_KEY, mockToken);

      // Reset y recrear el módulo para que el servicio lea localStorage fresco
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          AuthService,
          {
            provide: Router,
            useValue: { navigate: jasmine.createSpy('navigate') },
          },
        ],
      });

      const newService = TestBed.inject(AuthService);
      expect(newService.getToken()).toBe(mockToken);

      // Verificar el nuevo controller para evitar fugas
      const newHttpMock = TestBed.inject(HttpTestingController);
      newHttpMock.verify();
      localStorage.clear();
    });

    it('should return stored user', () => {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(mockUser));

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          AuthService,
          {
            provide: Router,
            useValue: { navigate: jasmine.createSpy('navigate') },
          },
        ],
      });

      const newService = TestBed.inject(AuthService);
      expect(newService.user()?.email).toBe(mockUser.email);

      const newHttpMock = TestBed.inject(HttpTestingController);
      newHttpMock.verify();
      localStorage.clear();
    });

    it('should compute userRole from user', () => {
      localStorage.setItem(AUTH_TOKEN_KEY, mockToken);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(mockUser));

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          AuthService,
          {
            provide: Router,
            useValue: { navigate: jasmine.createSpy('navigate') },
          },
        ],
      });

      const newService = TestBed.inject(AuthService);
      expect(newService.userRole()).toBe('ADMIN');

      const newHttpMock = TestBed.inject(HttpTestingController);
      newHttpMock.verify();
      localStorage.clear();
    });
  });

  describe('persistence', () => {
    it('should maintain auth state across service instances', fakeAsync(() => {
      // Login
      service
        .login({
          email: 'admin@familyfood.com',
          password: 'admin123',
        })
        .subscribe();
      tick(800);

      // Como es singleton, TestBed.inject devuelve la misma instancia
      const newService = TestBed.inject(AuthService);

      expect(newService.isAuthenticated()).toBeTrue();
      expect(newService.user()?.email).toBe('admin@familyfood.com');
    }));
  });
});
