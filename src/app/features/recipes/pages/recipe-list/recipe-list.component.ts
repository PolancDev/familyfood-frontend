import { Component, ChangeDetectionStrategy, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { RecipeService } from '../../../../core/services/recipe.service';
import {
  EtiquetaReceta,
  ETIQUETAS_PREDEFINIDAS,
  ETIQUETA_LABELS,
  ETIQUETA_ICONS,
} from '../../../../core/models/recipe.model';
import { RecipeCardComponent } from '../../components/recipe-card/recipe-card.component';

// PrimeNG
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'app-recipe-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RecipeCardComponent,
    InputTextModule,
    ButtonModule,
    TagModule,
    SkeletonModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './recipe-list.component.html',
})
export class RecipeListComponent implements OnInit, OnDestroy {
  private readonly recipeService = inject(RecipeService);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  // ===== SIGNALS DEL SERVICIO =====
  readonly recipes = this.recipeService.recipes;
  readonly loading = this.recipeService.loading;
  readonly error = this.recipeService.error;
  readonly filterFavoritas = this.recipeService.filterFavoritas;
  readonly filterBusqueda = this.recipeService.filterBusqueda;
  readonly filterEtiqueta = this.recipeService.filterEtiqueta;

  // ===== ETIQUETAS DISPONIBLES (solo predefinidas para filtros) =====
  readonly etiquetas = ETIQUETAS_PREDEFINIDAS;
  readonly etiquetaLabels = ETIQUETA_LABELS;
  readonly etiquetaIcons = ETIQUETA_ICONS;

  // ===== SKELETON CARDS =====
  readonly skeletonCards = Array(6).fill(0);

  // ===== BÚSQUEDA LOCAL =====
  private searchTimeout: ReturnType<typeof setTimeout> | null = null;
  searchTerm = '';

  ngOnInit(): void {
    this.recipeService.loadRecipes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }

  // ===== FILTROS =====

  /** Maneja la búsqueda con debounce de 300ms */
  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value;
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => {
      this.recipeService.setFilterBusqueda(this.searchTerm);
    }, 300);
  }

  /** Alterna el filtro de favoritas */
  toggleFavoritas(): void {
    const current = this.filterFavoritas();
    this.recipeService.setFilterFavoritas(current === true ? undefined : true);
  }

  /** Selecciona una etiqueta como filtro */
  selectEtiqueta(etiqueta: EtiquetaReceta): void {
    const current = this.filterEtiqueta();
    this.recipeService.setFilterEtiqueta(current === etiqueta ? '' : etiqueta);
  }

  /** Limpia todos los filtros */
  clearFilters(): void {
    this.searchTerm = '';
    this.recipeService.clearFilters();
  }

  // ===== ACCIONES =====

  /** Navega al detalle de una receta */
  onRecipeClick(id: string): void {
    this.router.navigate(['/app/recetas', id]);
  }

  /** Alterna el estado de favorita */
  onFavoritaToggle(id: string): void {
    this.recipeService.toggleFavorita(id).subscribe();
  }

  /** Reintenta la carga tras un error */
  retryLoad(): void {
    this.recipeService.clearError();
    this.recipeService.loadRecipes();
  }

  // ===== HELPERS =====

  /** Comprueba si hay filtros activos */
  hasActiveFilters(): boolean {
    return this.filterFavoritas() === true || !!this.filterBusqueda() || !!this.filterEtiqueta();
  }
}
