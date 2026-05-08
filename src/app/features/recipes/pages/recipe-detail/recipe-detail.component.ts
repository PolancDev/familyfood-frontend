import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  OnDestroy,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { RecipeService } from '../../../../core/services/recipe.service';
import {
  EtiquetaReceta,
  getEtiquetaLabel as etiquetaLabelHelper,
  getEtiquetaIcon as etiquetaIconHelper,
  getEtiquetaColor as etiquetaColorHelper,
} from '../../../../core/models/recipe.model';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-recipe-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonModule, TagModule, ConfirmDialogModule, ToastModule],
  providers: [ConfirmationService, MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './recipe-detail.component.html',
})
export class RecipeDetailComponent implements OnInit, OnDestroy {
  private readonly recipeService = inject(RecipeService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);
  private readonly destroy$ = new Subject<void>();

  // ===== SIGNALS =====
  readonly recipe = this.recipeService.currentRecipe;
  readonly loading = this.recipeService.loading;
  readonly error = this.recipeService.error;

  // ===== COMPUTED =====
  readonly hasRecipe = computed(() => !!this.recipe());

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.recipeService
        .loadRecipe(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo cargar la receta',
            });
          },
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.recipeService.clearCurrentRecipe();
  }

  // ===== ACCIONES =====

  /** Alterna el estado de favorita */
  toggleFavorita(): void {
    const recipe = this.recipe();
    if (!recipe) return;

    this.recipeService
      .toggleFavorita(recipe.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          this.messageService.add({
            severity: updated.favorita ? 'success' : 'info',
            summary: updated.favorita ? 'Favorita añadida' : 'Favorita quitada',
            detail: updated.favorita
              ? `"${updated.nombre}" añadida a favoritas`
              : `"${updated.nombre}" quitada de favoritas`,
          });
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo cambiar el estado de favorita',
          });
        },
      });
  }

  /** Muestra diálogo de confirmación para eliminar */
  confirmDelete(): void {
    const recipe = this.recipe();
    if (!recipe) return;

    this.confirmationService.confirm({
      header: 'Eliminar receta',
      message: `¿Estás seguro de que quieres eliminar "${recipe.nombre}"? Esta acción no se puede deshacer.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonProps: {
        severity: 'danger',
      },
      accept: () => {
        this.deleteRecipe();
      },
    });
  }

  /** Elimina la receta */
  private deleteRecipe(): void {
    const recipe = this.recipe();
    if (!recipe) return;

    this.recipeService
      .deleteRecipe(recipe.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Receta eliminada',
            detail: `"${recipe.nombre}" ha sido eliminada correctamente`,
          });
          this.router.navigate(['/app/recetas']);
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo eliminar la receta',
          });
        },
      });
  }

  /** Reintenta la carga */
  retryLoad(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.recipeService.clearError();
      this.recipeService.loadRecipe(id).pipe(takeUntil(this.destroy$)).subscribe();
    }
  }

  // ===== HELPERS =====

  /** Devuelve las clases CSS para una etiqueta */
  getEtiquetaClasses(etiqueta: EtiquetaReceta): string {
    return etiquetaColorHelper(etiqueta);
  }

  /** Devuelve el label para una etiqueta */
  getEtiquetaLabel(etiqueta: EtiquetaReceta): string {
    return etiquetaLabelHelper(etiqueta);
  }

  /** Devuelve el icono para una etiqueta (null si es personalizada) */
  getEtiquetaIcon(etiqueta: EtiquetaReceta): string | null {
    return etiquetaIconHelper(etiqueta);
  }
}
