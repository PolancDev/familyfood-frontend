import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';

// PrimeNG
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-login',
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
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Signals de estado
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal(false);
  readonly formSubmitted = signal(false);

  //activo
  readonly loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  // Computed para acceso fácil a campos
  get emailControl() {
    return this.loginForm.get('email');
  }
  get passwordControl() {
    return this.loginForm.get('password');
  }

  // Validación de campos
  readonly emailInvalid = computed(() => {
    this.formSubmitted();
    const control = this.emailControl;
    return control?.invalid && control?.touched;
  });

  readonly passwordInvalid = computed(() => {
    this.formSubmitted();
    const control = this.passwordControl;
    return control?.invalid && control?.touched;
  });

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.formSubmitted.set(true);
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.loginForm.value;

    this.authService.login({ email, password }).subscribe({
      next: () => {
        this.loading.set(false);
        // Redirigir a la URL guardada o al home
        const returnUrl = new URLSearchParams(window.location.search).get('returnUrl');
        this.router.navigate([returnUrl || '/']);
      },
      error: (err) => {
        this.loading.set(false);
        if (err.status === 401) {
          this.errorMessage.set('Email o contraseña incorrectos');
        } else if (err.status === 0) {
          this.errorMessage.set('Error de conexión. Inténtalo de nuevo.');
        } else {
          this.errorMessage.set('Ha ocurrido un error. Inténtalo de nuevo.');
        }
      },
    });
  }

  fillDemoCredentials(type: 'admin' | 'consumer'): void {
    if (type === 'admin') {
      this.loginForm.patchValue({
        email: 'admin@familyfood.com',
        password: 'admin123',
      });
    } else {
      this.loginForm.patchValue({
        email: 'consumer@familyfood.com',
        password: 'consumer123',
      });
    }
    this.errorMessage.set(null);
  }
}
