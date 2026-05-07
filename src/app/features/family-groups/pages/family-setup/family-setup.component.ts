import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FamilyService } from '../../../../core/services/family.service';

// PrimeNG
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { RadioButtonModule } from 'primeng/radiobutton';
import { MessageModule } from 'primeng/message';
import { DividerModule } from 'primeng/divider';

@Component({
  selector: 'app-family-setup',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    InputTextModule,
    ButtonModule,
    RadioButtonModule,
    MessageModule,
    DividerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './family-setup.component.html',
})
export class FamilySetupComponent {
  private readonly fb = inject(FormBuilder);
  private readonly familyService = inject(FamilyService);
  private readonly router = inject(Router);

  readonly setupMode = signal<'create' | 'join'>('create');
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly setupForm: FormGroup = this.fb.group({
    familyName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    familyCode: ['', [Validators.required, Validators.minLength(8)]],
  });

  get familyNameControl() {
    return this.setupForm.get('familyName');
  }
  get familyCodeControl() {
    return this.setupForm.get('familyCode');
  }

  readonly familyNameInvalid = computed(() => {
    const control = this.familyNameControl;
    return control?.invalid && control?.touched;
  });

  readonly familyCodeInvalid = computed(() => {
    const control = this.familyCodeControl;
    return control?.invalid && control?.touched;
  });

  selectMode(mode: 'create' | 'join'): void {
    this.setupMode.set(mode);
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  onSubmit(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);

    if (this.setupMode() === 'create') {
      const nameControl = this.familyNameControl;
      if (!nameControl || nameControl.invalid) {
        nameControl?.markAsTouched();
        this.errorMessage.set('El nombre de la familia es obligatorio (mín. 3 caracteres)');
        return;
      }

      this.loading.set(true);
      this.familyService.createFamily(nameControl.value).subscribe({
        next: () => {
          this.loading.set(false);
          this.successMessage.set('¡Familia creada con éxito!');
          setTimeout(() => {
            this.router.navigate(['/app/family-dashboard']);
          }, 1500);
        },
        error: () => {
          this.loading.set(false);
          this.errorMessage.set('Error al crear la familia. Inténtalo de nuevo.');
        },
      });
    } else {
      const codeControl = this.familyCodeControl;
      if (!codeControl || codeControl.invalid) {
        codeControl?.markAsTouched();
        this.errorMessage.set('El código de familia es obligatorio');
        return;
      }

      this.loading.set(true);
      this.familyService.joinFamily(codeControl.value).subscribe({
        next: () => {
          this.loading.set(false);
          this.successMessage.set('¡Te has unido a la familia!');
          setTimeout(() => {
            this.router.navigate(['/app/family-dashboard']);
          }, 1500);
        },
        error: () => {
          this.loading.set(false);
          this.errorMessage.set('Error al unirse a la familia. Verifica el código.');
        },
      });
    }
  }
}
