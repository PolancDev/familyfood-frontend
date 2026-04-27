import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

// PrimeNG
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageModule } from 'primeng/message';

/**
 * Validador personalizado que verifica email con TLD válido
 * Acepta: email@dominio.com, email@dominio.es, email@sub.dominio.io
 * Rechaza: pruebaDef@familyfood (sin TLD)
 */
function emailWithTldValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;

  const email = control.value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return { email: 'El email debe tener formato: usuario@dominio.ext' };
  }

  const parts = email.split('@');
  if (parts.length !== 2) return { email: 'El email debe tener un único @' };

  const domain = parts[1];
  if (!domain.includes('.')) {
    return { email: 'El dominio debe tener un TLD válido (ej: .com, .es)' };
  }

  const tld = domain.split('.').pop();
  if (!tld || tld.length < 2) {
    return { email: 'El TLD debe tener al menos 2 caracteres (ej: .com, .es)' };
  }

  return null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    ToastModule,
    MessageModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly formSubmitted = signal(false);

  readonly registerForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    email: ['', [Validators.required, emailWithTldValidator]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
    role: ['ADMIN'],
  });

  get nombreControl() {
    return this.registerForm.get('nombre');
  }
  get emailControl() {
    return this.registerForm.get('email');
  }
  get passwordControl() {
    return this.registerForm.get('password');
  }
  get confirmPasswordControl() {
    return this.registerForm.get('confirmPassword');
  }

  readonly nombreInvalid = computed(() => {
    const control = this.nombreControl;
    return control?.invalid && control?.touched;
  });

  readonly emailInvalid = computed(() => {
    const control = this.emailControl;
    return control?.invalid && control?.touched;
  });

  readonly passwordInvalid = computed(() => {
    const control = this.passwordControl;
    return control?.invalid && control?.touched;
  });

  readonly confirmPasswordInvalid = computed(() => {
    const control = this.confirmPasswordControl;
    return control?.invalid && control?.touched;
  });

  // Signals derivados para valores de campos
  readonly passwordValue = computed(() => this.passwordControl?.value || '');
  readonly confirmPasswordValue = computed(() => this.confirmPasswordControl?.value || '');

  // Signal para validar coincidencia de contraseñas (reactivo)
  // Se activa cuando el formulario ha sido enviado y las contraseñas no coinciden
  readonly passwordMismatch = computed(() => {
    return (
      this.formSubmitted() &&
      this.passwordValue().length > 0 &&
      this.confirmPasswordValue().length > 0 &&
      this.passwordValue() !== this.confirmPasswordValue()
    );
  });

  togglePasswordVisibility(field: 'password' | 'confirm'): void {
    if (field === 'password') {
      this.showPassword.update((v) => !v);
    } else {
      this.showConfirmPassword.update((v) => !v);
    }
  }

  onSubmit(): void {
    // Primero obtener los valores ANTES de marcar como touched
    const password = this.passwordControl?.value || '';
    const confirmPassword = this.confirmPasswordControl?.value || '';

    // Marcar como tocados para mostrar errores de otros campos
    this.formSubmitted.set(true);
    this.registerForm.markAllAsTouched();

    // PROBLEMA 1: Si el formulario es inválido, establecer mensaje de error apropiado
    if (this.registerForm.invalid) {
      // Establecer error según el campo específico que esté inválido
      if (this.nombreControl?.invalid) {
        this.errorMessage.set('El nombre es obligatorio (mín. 2 caracteres)');
      } else if (this.emailControl?.invalid) {
        this.errorMessage.set('El email es obligatorio y debe ser válido');
      } else if (this.passwordControl?.invalid) {
        this.errorMessage.set('La contraseña es obligatoria (mín. 6 caracteres)');
      } else if (this.confirmPasswordControl?.invalid) {
        this.errorMessage.set('Debes confirmar tu contraseña');
      }
      return;
    }

    // Luego verificar que las contraseñas coincidan
    if (password !== confirmPassword) {
      this.errorMessage.set('Las contraseñas no coinciden');
      return;
    }

    if (this.loading()) return;

    this.loading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const { nombre, email, role } = this.registerForm.value;

    this.authService.register({ nombre, email, password, role }).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.successMessage.set('¡Cuenta creada con éxito! Redirigiendo...');
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 1500);
      },
      error: (err: any) => {
        this.loading.set(false);
        if (err.status === 400) {
          this.errorMessage.set('Datos inválidos. Verifica la información.');
        } else if (err.status === 409) {
          this.errorMessage.set('Este email ya está registrado');
        } else if (err.status === 0) {
          this.errorMessage.set('Error de conexión. Inténtalo de nuevo.');
        } else {
          this.errorMessage.set('Ha ocurrido un error. Inténtalo de nuevo.');
        }
      },
    });
  }
}
