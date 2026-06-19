import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GenerateMenuRequest } from '../../models/plan-semanal.model';
import { Recipe } from '../../../../core/models/recipe.model';

// PrimeNG
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { ChipModule } from 'primeng/chip';
import { TooltipModule } from 'primeng/tooltip';

interface SelectOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-generate-menu-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    InputNumberModule,
    CheckboxModule,
    SelectModule,
    ChipModule,
    TooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-dialog
      [visible]="visible()"
      (visibleChange)="onHide()"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: '500px', maxWidth: '95vw' }"
      styleClass="rounded-xl"
      header="Generar Menú Automático"
      [closable]="true"
    >
      <div class="space-y-5 pt-2">
        <!-- Número de personas -->
        <div>
          <label
            for="num-personas"
            class="block text-sm font-display font-bold text-secondary mb-1.5"
          >
            Número de personas
          </label>
          <p-inputNumber
            id="num-personas"
            [(ngModel)]="numeroPersonas"
            [min]="1"
            [max]="20"
            [showButtons]="true"
            buttonLayout="horizontal"
            [step]="1"
            incrementButtonIcon="pi pi-plus"
            decrementButtonIcon="pi pi-minus"
            styleClass="w-full"
            inputStyleClass="text-center"
          />
        </div>

        <!-- Usar preferencias -->
        <div class="flex items-center gap-3">
          <p-checkbox
            id="usar-preferencias"
            [(ngModel)]="preferenciasUsar"
            [binary]="true"
            inputId="usar-preferencias"
          />
          <label for="usar-preferencias" class="text-sm font-body text-gray-700 cursor-pointer">
            Usar preferencias y restricciones de la familia
          </label>
        </div>

        <!-- Recetas a excluir -->
        <div>
          <label
            for="recetas-excluir-select"
            class="block text-sm font-display font-bold text-secondary mb-1.5"
          >
            Recetas a excluir (opcional)
          </label>
          <p-select
            id="recetas-excluir-select"
            [options]="availableRecetas()"
            [(ngModel)]="selectedExcluir"
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar recetas a excluir"
            styleClass="w-full"
            [filter]="true"
            filterBy="label"
            appendTo="body"
          />

          <!-- Chips de recetas excluidas -->
          @if (excludedChips().length > 0) {
            <div class="flex flex-wrap gap-2 mt-3">
              @for (chip of excludedChips(); track chip.id) {
                <p-chip
                  [label]="chip.label"
                  [removable]="true"
                  (onRemove)="removeExcluded(chip.id)"
                  styleClass="bg-gray-100 text-gray-700 border border-gray-200"
                />
              }
            </div>
          }
        </div>

        <!-- Info -->
        <p class="text-xs text-gray-400 font-body">
          El backend generará un menú semanal basado en tus preferencias y recetas disponibles. El
          menú se guarda automáticamente. Revisa el resultado para verificar que todo es correcto.
        </p>
      </div>

      <ng-template #footer>
        <div class="flex justify-end gap-3 pt-2">
          <button
            pButton
            severity="secondary"
            variant="outlined"
            label="Cancelar"
            (click)="onHide()"
            class="font-body"
            aria-label="Cancelar"
          ></button>
          <button
            pButton
            severity="primary"
            icon="pi pi-refresh"
            label="Generar"
            (click)="onGenerate()"
            [loading]="loading()"
            class="font-body"
            aria-label="Generar menú"
          ></button>
        </div>
      </ng-template>
    </p-dialog>
  `,
})
export class GenerateMenuModalComponent {
  // ===== INPUTS =====
  readonly visible = input.required<boolean>();
  readonly recipes = input.required<Recipe[]>();

  // ===== OUTPUTS =====
  readonly closed = output<void>();
  readonly generated = output<GenerateMenuRequest>();

  // ===== LOCAL STATE =====
  readonly numeroPersonas = signal<number>(4);
  readonly preferenciasUsar = signal<boolean>(true);
  readonly excludedIds = signal<string[]>([]);
  readonly selectedExcluir = signal<string | null>(null);
  readonly loading = signal(false);

  // ===== COMPUTED =====
  readonly availableRecetas = computed<SelectOption[]>(() => {
    const excluded = this.excludedIds();
    return this.recipes()
      .filter((r) => !excluded.includes(r.id))
      .map((r) => ({
        label: r.nombre,
        value: r.id,
      }));
  });

  readonly excludedChips = computed(() => {
    const excluded = this.excludedIds();
    return this.recipes()
      .filter((r) => excluded.includes(r.id))
      .map((r) => ({
        id: r.id,
        label: r.nombre,
      }));
  });

  constructor() {
    // Auto-add recipe when selected from dropdown
    // We use a simpler approach: watch for changes manually
  }

  /** Añade la receta seleccionada a la lista de excluidas */
  addExcluded(): void {
    const selected = this.selectedExcluir();
    if (selected && !this.excludedIds().includes(selected)) {
      this.excludedIds.update((ids) => [...ids, selected]);
    }
    this.selectedExcluir.set(null);
  }

  /** Elimina una receta de la lista de excluidas */
  removeExcluded(recipeId: string): void {
    this.excludedIds.update((ids) => ids.filter((id) => id !== recipeId));
  }

  onHide(): void {
    this.closed.emit();
  }

  onGenerate(): void {
    // Auto-add any pending selection before generating
    this.addExcluded();

    const request: GenerateMenuRequest = {
      numeroPersonas: this.numeroPersonas(),
      preferenciasUsar: this.preferenciasUsar(),
      recetasExcluidas: this.excludedIds().length > 0 ? [...this.excludedIds()] : undefined,
    };

    this.generated.emit(request);
  }
}
