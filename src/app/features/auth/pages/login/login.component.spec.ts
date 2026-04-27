import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../../core/services/auth.service';
import { signal } from '@angular/core';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['login', 'logout']);
    mockAuthService.isAuthenticated = signal(false);
    mockAuthService.user = signal(null);
    mockAuthService.token = signal(null);

    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      providers: [
        FormBuilder,
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have empty form on init', () => {
    expect(component.loginForm.value).toEqual({
      email: '',
      password: '',
    });
  });

  it('should mark email as invalid when empty and touched', () => {
    component.emailControl?.markAsTouched();
    fixture.detectChanges();
    expect(component.emailInvalid()).toBeTrue();
  });

  it('should mark password as invalid when less than 6 chars and touched', () => {
    component.loginForm.patchValue({ password: '123' });
    component.passwordControl?.markAsTouched();
    fixture.detectChanges();
    expect(component.passwordInvalid()).toBeTrue();
  });

  it('should call authService.login with form values on submit', () => {
    mockAuthService.login.and.returnValue({
      subscribe: (handlers: any) => {
        handlers.next({
          token: 'test',
          user: { id: '1', email: 'test@test.com', nombre: 'Test', role: 'ADMIN' },
        });
        return { unsubscribe: () => {} };
      },
    });

    component.loginForm.patchValue({
      email: 'test@test.com',
      password: 'password123',
    });

    component.onSubmit();

    expect(mockAuthService.login).toHaveBeenCalledWith({
      email: 'test@test.com',
      password: 'password123',
    });
  });

  it('should navigate on successful login', () => {
    mockAuthService.login.and.returnValue({
      subscribe: (handlers: any) => {
        handlers.next({
          token: 'test',
          user: { id: '1', email: 'test@test.com', nombre: 'Test', role: 'ADMIN' },
        });
        return { unsubscribe: () => {} };
      },
    });

    component.onSubmit();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should show error message on login failure', () => {
    mockAuthService.login.and.returnValue({
      subscribe: (handlers: any) => {
        handlers.error({ status: 401 });
        return { unsubscribe: () => {} };
      },
    });

    component.loginForm.patchValue({
      email: 'test@test.com',
      password: 'wrongpassword',
    });

    component.onSubmit();

    expect(component.errorMessage()).toBe('Email o contraseña incorrectos');
  });

  it('should fill demo admin credentials', () => {
    component.fillDemoCredentials('admin');
    fixture.detectChanges();

    expect(component.loginForm.value.email).toBe('admin@familyfood.com');
    expect(component.loginForm.value.password).toBe('admin123');
  });

  it('should fill demo consumer credentials', () => {
    component.fillDemoCredentials('consumer');
    fixture.detectChanges();

    expect(component.loginForm.value.email).toBe('consumer@familyfood.com');
    expect(component.loginForm.value.password).toBe('consumer123');
  });

  it('should clear error message when filling demo credentials', () => {
    component.errorMessage.set('Some error');
    component.fillDemoCredentials('admin');
    expect(component.errorMessage()).toBeNull();
  });

  it('should toggle password visibility', () => {
    expect(component.showPassword()).toBeFalse();
    component.togglePasswordVisibility();
    expect(component.showPassword()).toBeTrue();
    component.togglePasswordVisibility();
    expect(component.showPassword()).toBeFalse();
  });

  it('should mark all fields as touched on invalid submit', () => {
    const markAllAsTouchedSpy = spyOn(component.loginForm, 'markAllAsTouched');
    component.onSubmit();
    expect(markAllAsTouchedSpy).toHaveBeenCalled();
  });
});
