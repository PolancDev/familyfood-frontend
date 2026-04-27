import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../../../core/services/auth.service';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['register', 'logout']);
    mockAuthService.isAuthenticated = jasmine.createSpyObj('Signal', ['get']);
    mockAuthService.user = jasmine.createSpyObj('Signal', ['get']);
    mockAuthService.token = jasmine.createSpyObj('Signal', ['get']);

    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      providers: [
        FormBuilder,
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have empty form on init', () => {
    expect(component.registerForm.value).toEqual({
      nombre: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'ADMIN',
    });
  });

  it('should mark nombre as invalid when empty and touched', () => {
    component.nombreControl?.markAsTouched();
    fixture.detectChanges();
    expect(component.nombreInvalid()).toBeTrue();
  });

  it('should mark email as invalid when empty and touched', () => {
    component.emailControl?.markAsTouched();
    fixture.detectChanges();
    expect(component.emailInvalid()).toBeTrue();
  });

  it('should detect password mismatch', () => {
    component.registerForm.patchValue({
      password: 'password123',
      confirmPassword: 'differentpassword',
    });
    fixture.detectChanges();
    expect(component.passwordsMismatch()).toBeTrue();
  });

  it('should not detect mismatch when passwords match', () => {
    component.registerForm.patchValue({
      password: 'password123',
      confirmPassword: 'password123',
    });
    fixture.detectChanges();
    expect(component.passwordsMismatch()).toBeFalse();
  });

  it('should call authService.register on valid submit', () => {
    mockAuthService.register.and.returnValue({
      subscribe: (handlers: any) => {
        handlers.next({ id: '1', email: 'test@test.com', nombre: 'Test', role: 'ADMIN' });
        return { unsubscribe: () => {} };
      },
    });

    component.registerForm.patchValue({
      nombre: 'Test User',
      email: 'test@test.com',
      password: 'password123',
      confirmPassword: 'password123',
      role: 'ADMIN',
    });

    component.onSubmit();

    expect(mockAuthService.register).toHaveBeenCalledWith({
      nombre: 'Test User',
      email: 'test@test.com',
      password: 'password123',
      role: 'ADMIN',
    });
  });

  it('should show success message on successful registration', () => {
    mockAuthService.register.and.returnValue({
      subscribe: (handlers: any) => {
        handlers.next({ id: '1', email: 'test@test.com', nombre: 'Test', role: 'ADMIN' });
        return { unsubscribe: () => {} };
      },
    });

    component.registerForm.patchValue({
      nombre: 'Test User',
      email: 'test@test.com',
      password: 'password123',
      confirmPassword: 'password123',
    });

    component.onSubmit();

    expect(component.successMessage()).toContain('cuenta creada con éxito');
  });

  it('should not submit when passwords do not match', () => {
    component.registerForm.patchValue({
      nombre: 'Test User',
      email: 'test@test.com',
      password: 'password123',
      confirmPassword: 'differentpassword',
    });

    component.onSubmit();

    expect(component.errorMessage()).toBe('Las contraseñas no coinciden');
    expect(mockAuthService.register).not.toHaveBeenCalled();
  });

  it('should show error message on registration failure', () => {
    mockAuthService.register.and.returnValue({
      subscribe: (handlers: any) => {
        handlers.error({ status: 409 });
        return { unsubscribe: () => {} };
      },
    });

    component.registerForm.patchValue({
      nombre: 'Test User',
      email: 'existing@test.com',
      password: 'password123',
      confirmPassword: 'password123',
    });

    component.onSubmit();

    expect(component.errorMessage()).toBe('Este email ya está registrado');
  });

  it('should toggle password visibility', () => {
    expect(component.showPassword()).toBeFalse();
    component.togglePasswordVisibility('password');
    expect(component.showPassword()).toBeTrue();

    expect(component.showConfirmPassword()).toBeFalse();
    component.togglePasswordVisibility('confirm');
    expect(component.showConfirmPassword()).toBeTrue();
  });

  it('should mark all fields as touched on invalid submit', () => {
    const markAllAsTouchedSpy = spyOn(component.registerForm, 'markAllAsTouched');
    component.onSubmit();
    expect(markAllAsTouchedSpy).toHaveBeenCalled();
  });
});
