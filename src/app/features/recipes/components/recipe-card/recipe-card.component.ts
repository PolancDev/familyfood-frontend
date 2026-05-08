import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Recipe,
  EtiquetaReceta,
  getEtiquetaLabel as etiquetaLabelHelper,
  getEtiquetaIcon as etiquetaIconHelper,
  getEtiquetaColor as etiquetaColorHelper,
} from '../../../../core/models/recipe.model';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-recipe-card',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, TagModule, TooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './recipe-card.component.html',
})
export class RecipeCardComponent {
  // ===== INPUTS =====
  readonly recipe = input.required<Recipe>();

  // ===== OUTPUTS =====
  readonly recipeClick = output<string>();
  readonly favoritaToggle = output<string>();

  // ===== MÁXIMO DE ETIQUETAS VISIBLES =====
  private readonly MAX_VISIBLE_TAGS = 2;

  // ===== COMPUTED =====
  readonly visibleEtiquetas = computed(() =>
    this.recipe().etiquetas.slice(0, this.MAX_VISIBLE_TAGS),
  );
  readonly remainingEtiquetasCount = computed(() =>
    Math.max(0, this.recipe().etiquetas.length - this.MAX_VISIBLE_TAGS),
  );

  // ===== MÉTODOS =====

  /** Trunca la descripción a un máximo de caracteres */
  truncateDescription(text: string, maxLength = 100): string {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '…';
  }

  /** Maneja el click en la tarjeta */
  onCardClick(): void {
    this.recipeClick.emit(this.recipe().id);
  }

  /** Maneja el toggle de favorita (detiene propagación) */
  onFavoritaToggle(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.favoritaToggle.emit(this.recipe().id);
  }

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
