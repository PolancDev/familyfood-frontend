import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { FamilyService } from '../../../../core/services/family.service';
import { FamilySearchResult } from '../../../../core/models';

// PrimeNG
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { RadioButtonModule } from 'primeng/radiobutton';
import { MessageModule } from 'primeng/message';
import { DividerModule } from 'primeng/divider';
import { AutoCompleteModule } from 'primeng/autocomplete';

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
    AutoCompleteModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './family-setup.component.html',
})
export class FamilySetupComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly familyService = inject(FamilyService);
  private readonly router = inject(Router);
  private readonly searchSubject = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  readonly setupMode = signal<'create' | 'join'>('create');
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly searchResults = signal<FamilySearchResult[]>([]);
  readonly selectedFamily = signal<FamilySearchResult | null>(null);
  readonly searching = signal(false);

  readonly hasPendingRequests = computed(() => this.familyService.myPendingRequests().length > 0);
  readonly pendingRequestGroups = computed(() =>
    this.familyService.myPendingRequests().map((r) => r.familyGroupName).join(', '),
  );

  readonly setupForm: FormGroup = this.fb.group({
    familyName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
  });

  get familyNameControl() {
    return this.setupForm.get('familyName');
  }
  readonly familyNameInvalid = computed(() => {
    const control = this.familyNameControl;
    return control?.invalid && control?.touched;
  });

  ngOnInit(): void {
    this.familyService.getMyPendingRequests().subscribe();

    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => this.searching.set(true)),
        switchMap((query) => this.familyService.searchFamilies(query)),
        tap(() => this.searching.set(false)),
      )
      .subscribe((results) => {
        this.searchResults.set(results);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.searchSubject.complete();
  }

  selectMode(mode: 'create' | 'join'): void {
    this.setupMode.set(mode);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.selectedFamily.set(null);
    this.searchResults.set([]);
  }

  onSearch(event: { query: string }): void {
    this.searchSubject.next(event.query);
  }

  onSelect(event: FamilySearchResult): void {
    this.selectedFamily.set(event);
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
      const selected = this.selectedFamily();
      if (!selected) {
        this.errorMessage.set('Selecciona un grupo familiar para unirte');
        return;
      }

      this.loading.set(true);
      this.familyService.joinFamily(selected.id).subscribe({
        next: () => {
          this.loading.set(false);
          this.successMessage.set('¡Te has unido a la familia!');
          setTimeout(() => {
            this.router.navigate(['/app/family-dashboard']);
          }, 1500);
        },
        error: () => {
          this.loading.set(false);
          this.errorMessage.set('Error al unirse a la familia. Inténtalo de nuevo.');
        },
      });
    }
  }
}
