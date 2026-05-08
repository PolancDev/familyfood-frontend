import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  OnDestroy,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormArray,
  AbstractControl,
  Validators,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { RecipeService } from '../../../../core/services/recipe.service';
import {
  Recipe,
  CreateRecipeRequest,
  UpdateRecipeRequest,
  EtiquetaReceta,
  ETIQUETAS_PREDEFINIDAS,
  getEtiquetaLabel as etiquetaLabelHelper,
  getEtiquetaIcon as etiquetaIconHelper,
  getEtiquetaColor as etiquetaColorHelper,
} from '../../../../core/models/recipe.model';

// PrimeNG
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CheckboxModule } from 'primeng/checkbox';

@Component({
  selector: 'app-recipe-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    TextareaModule,
    InputNumberModule,
    ButtonModule,
    ToggleSwitchModule,
    ToastModule,
    CheckboxModule,
  ],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './recipe-form.component.html',
})
export class RecipeFormComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly recipeService = inject(RecipeService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);
  private readonly destroy$ = new Subject<void>();

  // ===== ESTADO =====
  readonly isEditing = signal(false);
  readonly recipeId = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly loadingRecipe = signal(false);
  readonly formSubmitted = signal(false);

  // ===== ETIQUETAS =====
  readonly etiquetasPredefinidas = ETIQUETAS_PREDEFINIDAS;
  readonly customTagInput = signal('');

  // Signal sincronizado con el form control para reactividad en template
  readonly selectedEtiquetas = signal<EtiquetaReceta[]>([]);

  // Etiquetas personalizadas (no predefinidas)
  readonly customTags = computed(() =>
    this.selectedEtiquetas().filter((e) => !ETIQUETAS_PREDEFINIDAS.includes(e)),
  );

  // ===== FORMULARIO =====
  readonly recipeForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
    descripcion: ['', [Validators.required, Validators.maxLength(2000)]],
    tiempoMinutos: [null, [Validators.required, Validators.min(1)]],
    raciones: [null, [Validators.required, Validators.min(1)]],
    ingredientes: this.fb.array([this.createIngredientGroup()]),
    pasos: this.fb.array([this.fb.control('', [Validators.required])]),
    etiquetas: [[]],
    favorita: [false],
  });

  // ===== COMPUTED =====
  readonly pageTitle = computed(() => (this.isEditing() ? 'Editar receta' : 'Nueva receta'));
  readonly submitLabel = computed(() => (this.isEditing() ? 'Guardar cambios' : 'Crear receta'));

  // ===== GETTERS =====
  get ingredientesArray(): FormArray {
    return this.recipeForm.get('ingredientes') as FormArray;
  }

  get pasosArray(): FormArray {
    return this.recipeForm.get('pasos') as FormArray;
  }

  get nombreControl(): AbstractControl | null {
    return this.recipeForm.get('nombre');
  }

  get descripcionControl(): AbstractControl | null {
    return this.recipeForm.get('descripcion');
  }

  get tiempoMinutosControl(): AbstractControl | null {
    return this.recipeForm.get('tiempoMinutos');
  }

  get racionesControl(): AbstractControl | null {
    return this.recipeForm.get('raciones');
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditing.set(true);
      this.recipeId.set(id);
      this.loadRecipeForEdit(id);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===== CARGA DE RECETA PARA EDITAR =====

  private loadRecipeForEdit(id: string): void {
    this.loadingRecipe.set(true);
    this.recipeService
      .loadRecipe(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (recipe) => {
          this.patchFormWithRecipe(recipe);
          this.loadingRecipe.set(false);
        },
        error: () => {
          this.loadingRecipe.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo cargar la receta para editar',
          });
          this.router.navigate(['/app/recetas']);
        },
      });
  }

  private patchFormWithRecipe(recipe: Recipe): void {
    // Limpiar los FormArrays y rellenar con los datos de la receta
    while (this.ingredientesArray.length) {
      this.ingredientesArray.removeAt(0);
    }
    while (this.pasosArray.length) {
      this.pasosArray.removeAt(0);
    }

    // Añadir ingredientes
    recipe.ingredientes.forEach((ing) => {
      this.ingredientesArray.push(
        this.fb.group({
          nombre: [ing.nombre, [Validators.required, Validators.maxLength(200)]],
          cantidad: [ing.cantidad, [Validators.required, Validators.min(0.01)]],
          unidad: [ing.unidad, [Validators.required, Validators.maxLength(50)]],
        }),
      );
    });

    // Añadir pasos
    recipe.pasos.forEach((paso) => {
      this.pasosArray.push(this.fb.control(paso, [Validators.required]));
    });

    // Patch del resto de campos
    this.recipeForm.patchValue({
      nombre: recipe.nombre,
      descripcion: recipe.descripcion,
      tiempoMinutos: recipe.tiempoMinutos,
      raciones: recipe.raciones,
      etiquetas: recipe.etiquetas,
      favorita: recipe.favorita,
    });

    // Sincronizar signal de etiquetas seleccionadas
    this.syncEtiquetasSignal();
  }

  // ===== ETIQUETAS: GESTIÓN =====

  /** Sincroniza el signal selectedEtiquetas con el valor del form control */
  private syncEtiquetasSignal(): void {
    const value = (this.recipeForm.get('etiquetas')?.value as EtiquetaReceta[]) || [];
    this.selectedEtiquetas.set([...value]);
  }

  /** Comprueba si una etiqueta predefinida está seleccionada */
  isEtiquetaSelected(etiqueta: EtiquetaReceta): boolean {
    return this.selectedEtiquetas().includes(etiqueta);
  }

  /** Alterna una etiqueta predefinida en la selección */
  toggleEtiqueta(etiqueta: EtiquetaReceta): void {
    const control = this.recipeForm.get('etiquetas');
    const current = (control?.value as EtiquetaReceta[]) || [];
    const isSelected = current.includes(etiqueta);
    if (isSelected) {
      control?.setValue(current.filter((e) => e !== etiqueta));
    } else {
      control?.setValue([...current, etiqueta]);
    }
    this.syncEtiquetasSignal();
  }

  /** Maneja la entrada de texto en el input de etiqueta personalizada */
  onCustomTagInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.customTagInput.set(input.value);
  }

  /** Añade una etiqueta personalizada */
  addCustomTag(event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    const tag = this.customTagInput().trim();
    if (!tag) return;

    const control = this.recipeForm.get('etiquetas');
    const current = (control?.value as EtiquetaReceta[]) || [];
    if (current.includes(tag)) {
      this.customTagInput.set('');
      return;
    }
    control?.setValue([...current, tag]);
    this.syncEtiquetasSignal();
    this.customTagInput.set('');
  }

  /** Elimina una etiqueta personalizada */
  removeCustomTag(tag: EtiquetaReceta): void {
    const control = this.recipeForm.get('etiquetas');
    const current = (control?.value as EtiquetaReceta[]) || [];
    control?.setValue(current.filter((e) => e !== tag));
    this.syncEtiquetasSignal();
  }

  /** Devuelve el label para una etiqueta */
  getEtiquetaLabel(etiqueta: EtiquetaReceta): string {
    return etiquetaLabelHelper(etiqueta);
  }

  /** Devuelve el icono para una etiqueta */
  getEtiquetaIcon(etiqueta: EtiquetaReceta): string {
    return etiquetaIconHelper(etiqueta) || '';
  }

  /** Devuelve las clases de color para una etiqueta seleccionada */
  getSelectedEtiquetaClasses(etiqueta: EtiquetaReceta): string {
    return etiquetaColorHelper(etiqueta);
  }

  // ===== FORMARRAY: INGREDIENTES =====

  private createIngredientGroup(): FormGroup {
    return this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(200)]],
      cantidad: [null, [Validators.required, Validators.min(0.01)]],
      unidad: ['', [Validators.required, Validators.maxLength(50)]],
    });
  }

  addIngredient(): void {
    this.ingredientesArray.push(this.createIngredientGroup());
  }

  removeIngredient(index: number): void {
    if (this.ingredientesArray.length > 1) {
      this.ingredientesArray.removeAt(index);
    }
  }

  // ===== FORMARRAY: PASOS =====

  addStep(): void {
    this.pasosArray.push(this.fb.control('', [Validators.required]));
  }

  removeStep(index: number): void {
    if (this.pasosArray.length > 1) {
      this.pasosArray.removeAt(index);
    }
  }

  // ===== ENVÍO DEL FORMULARIO =====

  onSubmit(): void {
    this.formSubmitted.set(true);

    if (this.recipeForm.invalid) {
      this.recipeForm.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulario incompleto',
        detail: 'Por favor, revisa los campos marcados en rojo',
      });
      return;
    }

    this.submitting.set(true);
    const formValue = this.recipeForm.value;

    if (this.isEditing()) {
      this.updateRecipe(formValue);
    } else {
      this.createRecipe(formValue);
    }
  }

  private createRecipe(formValue: RecipeFormValue): void {
    const request: CreateRecipeRequest = {
      nombre: formValue.nombre,
      descripcion: formValue.descripcion,
      tiempoMinutos: formValue.tiempoMinutos,
      raciones: formValue.raciones,
      ingredientes: formValue.ingredientes,
      pasos: formValue.pasos,
      etiquetas: formValue.etiquetas || [],
      favorita: formValue.favorita || false,
    };

    this.recipeService
      .createRecipe(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (recipe) => {
          this.submitting.set(false);
          this.messageService.add({
            severity: 'success',
            summary: 'Receta creada',
            detail: `"${recipe.nombre}" se ha creado correctamente`,
          });
          this.router.navigate(['/app/recetas']);
        },
        error: () => {
          this.submitting.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo crear la receta. Inténtalo de nuevo.',
          });
        },
      });
  }

  private updateRecipe(formValue: RecipeFormValue): void {
    const id = this.recipeId();
    if (!id) return;

    const request: UpdateRecipeRequest = {
      nombre: formValue.nombre,
      descripcion: formValue.descripcion,
      tiempoMinutos: formValue.tiempoMinutos,
      raciones: formValue.raciones,
      ingredientes: formValue.ingredientes,
      pasos: formValue.pasos,
      etiquetas: formValue.etiquetas || [],
    };

    this.recipeService
      .updateRecipe(id, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (recipe) => {
          this.submitting.set(false);
          this.messageService.add({
            severity: 'success',
            summary: 'Receta actualizada',
            detail: `"${recipe.nombre}" se ha actualizado correctamente`,
          });
          this.router.navigate(['/app/recetas', recipe.id]);
        },
        error: () => {
          this.submitting.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo actualizar la receta. Inténtalo de nuevo.',
          });
        },
      });
  }

  // ===== VALIDACIÓN DE CAMPOS =====

  isFieldInvalid(fieldName: string): boolean {
    const control = this.recipeForm.get(fieldName);
    return !!(control && control.invalid && (control.touched || this.formSubmitted()));
  }

  getFieldError(fieldName: string): string {
    const control = this.recipeForm.get(fieldName);
    if (!control || !control.errors) return '';

    if (control.errors['required']) return 'Este campo es obligatorio';
    if (control.errors['minlength'])
      return `Mínimo ${control.errors['minlength'].requiredLength} caracteres`;
    if (control.errors['maxlength'])
      return `Máximo ${control.errors['maxlength'].requiredLength} caracteres`;
    if (control.errors['min']) return `El valor mínimo es ${control.errors['min'].min}`;
    if (control.errors['email']) return 'Introduce un email válido';

    return 'Campo no válido';
  }

  isIngredientInvalid(index: number, field: string): boolean {
    const ingredientGroup = this.ingredientesArray.at(index) as FormGroup;
    const control = ingredientGroup?.get(field);
    return !!(control && control.invalid && (control.touched || this.formSubmitted()));
  }

  isStepInvalid(index: number): boolean {
    const control = this.pasosArray.at(index);
    return !!(control && control.invalid && (control.touched || this.formSubmitted()));
  }

  // ===== NAVEGACIÓN =====

  goBack(): void {
    if (this.isEditing() && this.recipeId()) {
      this.router.navigate(['/app/recetas', this.recipeId()]);
    } else {
      this.router.navigate(['/app/recetas']);
    }
  }
}

// ===== TIPO PARA EL FORMULARIO =====
interface RecipeFormValue {
  nombre: string;
  descripcion: string;
  tiempoMinutos: number;
  raciones: number;
  ingredientes: { nombre: string; cantidad: number; unidad: string }[];
  pasos: string[];
  etiquetas: EtiquetaReceta[];
  favorita: boolean;
}
