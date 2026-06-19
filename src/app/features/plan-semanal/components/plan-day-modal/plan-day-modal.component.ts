import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
  signal,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  PlanDay,
  EstadoDia,
  DIA_LABELS,
  TIPO_COMIDA_LABELS,
  ESTADO_LABELS,
  ESTADOS_DIA,
} from '../../models/plan-semanal.model';
import { Recipe } from '../../../../core/models/recipe.model';

// PrimeNG
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { MessageModule } from 'primeng/message';

interface SelectOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-plan-day-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule, ButtonModule, SelectModule, MessageModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-dialog
      [visible]="visible()"
      (visibleChange)="onHide()"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: '450px', maxWidth: '95vw' }"
      styleClass="rounded-xl"
      [header]="'Editar: ' + diaLabel() + ' - ' + tipoLabel()"
      [closable]="true"
    >
      <div class="space-y-4 pt-2">
        <!-- Estado -->
        <div>
          <label
            for="estado-select"
            class="block text-sm font-display font-bold text-secondary mb-1.5"
          >
            Estado
          </label>
          <p-select
            id="estado-select"
            [options]="estadoOptions"
            [(ngModel)]="localEstado"
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar estado"
            styleClass="w-full"
            [showClear]="false"
            appendTo="body"
          />
        </div>

        <!-- Receta (visible solo si NORMAL) -->
        @if (localEstado() === 'NORMAL') {
          <div>
            <label
              for="receta-select"
              class="block text-sm font-display font-bold text-secondary mb-1.5"
            >
              Receta
            </label>
            <p-select
              id="receta-select"
              [options]="recetaOptions()"
              [(ngModel)]="localRecetaId"
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar receta"
              styleClass="w-full"
              [showClear]="true"
              [filter]="true"
              filterBy="label"
              appendTo="body"
            />
            @if (recetaOptions().length === 0) {
              <p-message
                severity="warn"
                text="No hay recetas disponibles. Crea recetas primero."
                styleClass="mt-2 text-sm"
              />
            }
          </div>
        }

        <!-- Sobras (visible solo si SOBRAS) -->
        @if (localEstado() === 'SOBRAS') {
          <p-message
            severity="info"
            text="Se marcará como 'Sobras'. Se asignará automáticamente en función de las recetas de días anteriores con raciones sobrantes."
            styleClass="text-sm"
          />
        }

        <!-- Estado info messages -->
        @if (localEstado() === 'COMER_FUERA') {
          <p-message
            severity="info"
            text="Se marcará como 'Comer fuera'. No se asignará receta."
            styleClass="text-sm"
          />
        }

        @if (localEstado() === 'IMPROVISADO') {
          <p-message
            severity="info"
            text="Se marcará como 'Improvisado'. El día queda sin receta asignada."
            styleClass="text-sm"
          />
        }
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
            label="Guardar"
            (click)="onSave()"
            [disabled]="!isValid()"
            class="font-body"
            aria-label="Guardar cambios"
          ></button>
        </div>
      </ng-template>
    </p-dialog>
  `,
})
export class PlanDayModalComponent {
  // ===== INPUTS =====
  readonly day = input.required<PlanDay>();
  readonly recipes = input.required<Recipe[]>();
  readonly visible = input.required<boolean>();

  // ===== OUTPUTS =====
  readonly closed = output<void>();
  readonly saved = output<PlanDay>();

  // ===== LOCAL STATE =====
  readonly localEstado = signal<EstadoDia>('IMPROVISADO');
  readonly localRecetaId = signal<string | null>(null);

  // ===== COMPUTED =====
  readonly diaLabel = computed(() => DIA_LABELS[this.day().dia] || this.day().dia);
  readonly tipoLabel = computed(() => TIPO_COMIDA_LABELS[this.day().tipo] || this.day().tipo);

  readonly recetaOptions = computed<SelectOption[]>(() =>
    this.recipes().map((r) => ({
      label: `${r.nombre} (${r.tiempoMinutos} min)`,
      value: r.id,
    })),
  );

  readonly estadoOptions: SelectOption[] = ESTADOS_DIA.map((e) => ({
    label: ESTADO_LABELS[e],
    value: e,
  }));

  readonly isValid = computed(() => {
    if (this.localEstado() === 'NORMAL') {
      return !!this.localRecetaId();
    }
    return true;
  });

  constructor() {
    effect(() => {
      const d = this.day();
      if (d) {
        this.localEstado.set(d.estado);
        this.localRecetaId.set(d.receta?.id ?? null);
      }
    });
  }

  onHide(): void {
    this.closed.emit();
  }

  onSave(): void {
    const d = this.day();
    const recetaId = this.localRecetaId();
    const recipe = recetaId ? this.recipes().find((r) => r.id === recetaId) : null;

    const updatedDay: PlanDay = {
      ...d,
      estado: this.localEstado(),
      receta: recipe
        ? { id: recipe.id, nombre: recipe.nombre, tiempoMinutos: recipe.tiempoMinutos }
        : null,
      sobrasOrigenDia: null,
      sobrasOrigenTipo: null,
      sobrasOrigenRecetaId: null,
      sobrasOrigenRecetaNombre: null,
    };

    this.saved.emit(updatedDay);
  }
}
