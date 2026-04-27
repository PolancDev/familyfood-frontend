import { TestBed } from '@angular/core/testing';
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
    it('should login with mock admin credentials', (done) => {
      service
        .login({
          email: 'admin@familyfood.com',
          password: 'admin123',
        })
        .subscribe({
          next: (response) => {
            expect(response.token).toBeTruthy();
            expect(response.user.email).toBe('admin@familyfood.com');
            done();
          },
        });
    });

    it('should login with mock consumer credentials', (done) => {
      service
        .login({
          email: 'consumer@familyfood.com',
          password: 'consumer123',
        })
        .subscribe({
          next: (response) => {
            expect(response.token).toBeTruthy();
            expect(response.user.role).toBe('CONSUMER');
            done();
          },
        });
    });

    it('should update isAuthenticated signal after login', (done) => {
      service
        .login({
          email: 'admin@familyfood.com',
          password: 'admin123',
        })
        .subscribe({
          next: () => {
            expect(service.isAuthenticated()).toBeTrue();
            done();
          },
        });
    });

    it('should store token and user in localStorage', (done) => {
      service
        .login({
          email: 'admin@familyfood.com',
          password: 'admin123',
        })
        .subscribe({
          next: () => {
            expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeTruthy();
            expect(localStorage.getItem(AUTH_USER_KEY)).toBeTruthy();
            done();
          },
        });
    });

    it('should fail login with wrong password', (done) => {
      service
        .login({
          email: 'admin@familyfood.com',
          password: 'wrongpassword',
        })
        .subscribe({
          error: (error) => {
            expect(error).toBeTruthy();
            done();
          },
        });
    });

    it('should fail login with non-existent user', (done) => {
      service
        .login({
          email: 'nonexistent@test.com',
          password: 'password123',
        })
        .subscribe({
          error: (error) => {
            expect(error).toBeTruthy();
            done();
          },
        });
    });
  });

  describe('register', () => {
    it('should register new user', (done) => {
      // Mock backend unavailable - will use fallback
      service
        .register({
          email: 'newuser@test.com',
          password: 'password123',
          nombre: 'New User',
          role: 'ADMIN',
        })
        .subscribe({
          next: (response) => {
            expect(response.email).toBe('newuser@test.com');
            expect(response.nombre).toBe('New User');
            done();
          },
        });
    });

    it('should update isAuthenticated after registration', (done) => {
      service
        .register({
          email: 'newuser@test.com',
          password: 'password123',
          nombre: 'New User',
        })
        .subscribe({
          next: () => {
            expect(service.isAuthenticated()).toBeTrue();
            done();
          },
        });
    });
  });

  describe('logout', () => {
    it('should clear auth state', () => {
      // First login
      service
        .login({
          email: 'admin@familyfood.com',
          password: 'admin123',
        })
        .subscribe();

      // Then logout
      service.logout();

      expect(service.isAuthenticated()).toBeFalse();
      expect(service.user()).toBeNull();
      expect(service.getToken()).toBeNull();
    });

    it('should clear localStorage', () => {
      service
        .login({
          email: 'admin@familyfood.com',
          password: 'admin123',
        })
        .subscribe();

      service.logout();

      expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
      expect(localStorage.getItem(AUTH_USER_KEY)).toBeNull();
    });

    it('should navigate to login page', () => {
      service.logout();
      expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
    });
  });

  describe('token management', () => {
    it('should return stored token', () => {
      localStorage.setItem(AUTH_TOKEN_KEY, mockToken);

      // Create new service instance to read from localStorage
      const newService = TestBed.inject(AuthService);
      expect(newService.getToken()).toBe(mockToken);
    });

    it('should return stored user', () => {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(mockUser));

      const newService = TestBed.inject(AuthService);
      expect(newService.user()?.email).toBe(mockUser.email);
    });

    it('should compute userRole from user', () => {
      localStorage.setItem(AUTH_TOKEN_KEY, mockToken);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(mockUser));

      const newService = TestBed.inject(AuthService);
      expect(newService.userRole()).toBe('ADMIN');
    });
  });

  describe('persistence', () => {
    it('should maintain auth state across service instances', () => {
      // Login
      service
        .login({
          email: 'admin@familyfood.com',
          password: 'admin123',
        })
        .subscribe();

      // Create new service instance
      const newService = TestBed.inject(AuthService);

      expect(newService.isAuthenticated()).toBeTrue();
      expect(newService.user()?.email).toBe('admin@familyfood.com');
    });
  });
});
