import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  computed,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { FamilyService } from '../../../../core/services/family.service';
import { RecipeService } from '../../../../core/services/recipe.service';
import { PlanSemanalService } from '../../services/plan-semanal.service';
import { PlanDayModalComponent } from '../../components/plan-day-modal/plan-day-modal.component';
import { GenerateMenuModalComponent } from '../../components/generate-menu-modal/generate-menu-modal.component';
import {
  PlanDay,
  DiaSemana,
  TipoComida,
  EstadoDia,
  DIAS_SEMANA,
  DIA_SHORT_LABELS,
  DIA_LABELS,
  TIPO_COMIDA_LABELS,
  GenerateMenuRequest,
} from '../../models/plan-semanal.model';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'app-plan-semanal-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    ButtonModule,
    CardModule,
    TooltipModule,
    ProgressSpinnerModule,
    MessageModule,
    ToastModule,
    DialogModule,
    TagModule,
    SkeletonModule,
    PlanDayModalComponent,
    GenerateMenuModalComponent,
  ],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './plan-semanal-page.component.html',
})
export class PlanSemanalPageComponent implements OnInit {
  // ===== CONSTANTES EXPUESTAS PARA EL TEMPLATE =====
  readonly DIAS_SEMANA = DIAS_SEMANA;
  readonly DIA_LABELS = DIA_LABELS;
  readonly DIA_SHORT_LABELS = DIA_SHORT_LABELS;
  readonly TIPO_COMIDA_LABELS = TIPO_COMIDA_LABELS;

  readonly authService = inject(AuthService);
  readonly familyService = inject(FamilyService);
  readonly recipeService = inject(RecipeService);
  readonly planService = inject(PlanSemanalService);
  private readonly messageService = inject(MessageService);

  // ===== SIGNALS LOCALES =====
  readonly showDayModal = signal(false);
  readonly showGenerateModal = signal(false);
  readonly selectedDay = signal<PlanDay | null>(null);
  readonly generating = signal(false);
  readonly _gridVisible = signal(true);

  // ===== SIGNALS DEL SERVICIO =====
  readonly plan = this.planService.plan;
  readonly loading = this.planService.loading;
  readonly error = this.planService.error;
  readonly currentYear = this.planService.currentYear;
  readonly currentWeek = this.planService.currentWeek;

  // ===== COMPUTED =====
  readonly isAdmin = computed(() => this.authService.userRole() === 'ADMIN');

  readonly familyGroupId = computed(() => {
    const family = this.familyService.currentFamily();
    if (family) return family.id;
    const families = this.familyService.families();
    return families.length > 0 ? families[0].id : '';
  });

  readonly dateRange = computed(() => {
    const plan = this.plan();
    // Usar fechas del backend (correctas) en vez de calcular localmente
    if (plan?.startDate && plan?.endDate) {
      return this.planService.formatDateRange(plan.startDate, plan.endDate);
    }
    // Fallback si no hay plan
    const { startDate, endDate } = this.planService.getWeekDates(
      this.currentYear(),
      this.currentWeek(),
    );
    return this.planService.formatDateRange(startDate, endDate);
  });

  readonly hasPlan = computed(() => !!this.plan() && !this.loading() && !this.error());

  /** Hash del plan que cambia con cada modificación → fuerza re-render del @if */
  readonly planHash = computed(() => {
    const p = this.plan();
    if (!p) return '';
    return p.dias.map(d => `${d.dia}|${d.tipo}|${d.estado}|${d.receta?.id ?? '-'}`).join(',');
  });

  readonly recipes = computed(() => this.recipeService.recipes());

  readonly isCurrentWeek = computed(() => {
    const now = new Date();
    const currentIsoWeek = this.planService.getCurrentISOWeek();
    return this.currentYear() === now.getFullYear() && this.currentWeek() === currentIsoWeek;
  });

  /** Obtiene los días numéricos para cada columna basado en la fecha de inicio */
  readonly dayNumbers = computed(() => {
    const plan = this.plan();
    if (!plan?.startDate) return DIAS_SEMANA.map(() => 0);
    const start = new Date(plan.startDate + 'T00:00:00');
    return DIAS_SEMANA.map((_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d.getDate();
    });
  });

  /** Cuenta cuántos slots están vacíos (IMPROVISADO) */
  readonly emptySlotCount = computed(() => {
    const plan = this.plan();
    if (!plan) return 14;
    return plan.dias.filter((d) => d.estado === 'IMPROVISADO').length;
  });

  /** Etiqueta del botón de generación */
  readonly generateButtonLabel = computed(() => {
    const empty = this.emptySlotCount();
    if (empty === 14) return 'Generar menú automático';
    if (empty > 0) return 'Completar menú semanal';
    return ''; // Botón oculto cuando está completo
  });

  /** Si hay que mostrar el botón de generar */
  readonly showGenerateButton = computed(() => {
    return this.isAdmin() && this.emptySlotCount() > 0;
  });

  /** Si el modo es completar (hay slots ya rellenos) */
  readonly isCompletar = computed(() => {
    const empty = this.emptySlotCount();
    return empty > 0 && empty < 14;
  });

  /** Fuerza re-render del grid toggleando _gridVisible */
  private refreshGrid(): void {
    this._gridVisible.set(false);
    setTimeout(() => this._gridVisible.set(true));
  }

  /** Obtiene el PlanDay para una combinación día + tipo */
  getDay(dia: DiaSemana, tipo: TipoComida): PlanDay | undefined {
    const plan = this.plan();
    if (!plan) return undefined;
    return plan.dias.find((d) => d.dia === dia && d.tipo === tipo);
  }

  /** Devuelve los PlanDay agrupados por tipo para un día */
  getDaySlots(dia: DiaSemana): { comida: PlanDay | undefined; cena: PlanDay | undefined } {
    const plan = this.plan();
    if (!plan) return { comida: undefined, cena: undefined };
    return {
      comida: plan.dias.find((d) => d.dia === dia && d.tipo === 'COMIDA'),
      cena: plan.dias.find((d) => d.dia === dia && d.tipo === 'CENA'),
    };
  }

  /** Clases CSS para un estado de día */
  getEstadoClasses(estado: EstadoDia): string {
    switch (estado) {
      case 'NORMAL':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'SOBRAS':
        return 'bg-amber-50 border-amber-200 text-amber-800';
      case 'COMER_FUERA':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'IMPROVISADO':
        return 'bg-gray-50 border-gray-200 text-gray-500';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-500';
    }
  }

  /** Clases CSS para la celda */
  getCellClasses(day: PlanDay | undefined, estado: EstadoDia): string {
    const base =
      'cursor-pointer rounded-lg border-2 p-3 transition-all duration-200 hover:shadow-md min-h-[80px] flex flex-col justify-center';
    if (day?.alergenosAdvertencia) {
      return `${base} border-l-4 border-l-red-400 ${this.getEstadoClasses(estado)}`;
    }
    return `${base} ${this.getEstadoClasses(estado)}`;
  }

  /** Texto a mostrar en la celda */
  getCellText(day: PlanDay | undefined): string {
    if (!day) return '—';
    switch (day.estado) {
      case 'NORMAL':
        return day.receta?.nombre ?? 'Seleccionar receta';
      case 'SOBRAS':
        return `Sobras (${day.sobrasOrigenRecetaNombre ?? day.sobrasOrigenDia ?? '?'})`;
      case 'COMER_FUERA':
        return 'Comer fuera 🏠';
      case 'IMPROVISADO':
        return 'Improvisado';
      default:
        return '—';
    }
  }

  /** Obtiene el tiempo de preparación si aplica */
  getCellTime(day: PlanDay | undefined): string | null {
    if (!day || day.estado !== 'NORMAL' || !day.receta) return null;
    return `${day.receta.tiempoMinutos} min`;
  }

  // ===== ACCIONES =====

  /** Abre el modal de edición para un slot */
  openDayModal(day: PlanDay | undefined, dia: DiaSemana, tipo: TipoComida): void {
    if (day) {
      this.selectedDay.set({ ...day });
    } else {
      this.selectedDay.set({
        id: '',
        dia,
        tipo,
        receta: null,
        estado: 'IMPROVISADO',
        sobrasOrigenDia: null,
        sobrasOrigenTipo: null,
        sobrasOrigenRecetaId: null,
        sobrasOrigenRecetaNombre: null,
        alergenosAdvertencia: false,
      });
    }
    this.showDayModal.set(true);
  }

  /** Cierra el modal de edición */
  closeDayModal(): void {
    this.showDayModal.set(false);
    this.selectedDay.set(null);
  }

  /** Guarda los cambios del modal de edición */
  onDaySaved(updatedDay: PlanDay): void {
    const familyId = this.familyGroupId();
    if (!familyId) return;

    const request = {
      dia: updatedDay.dia,
      tipo: updatedDay.tipo,
      recetaId: updatedDay.receta?.id ?? null,
      estado: updatedDay.estado,
      sobrasOrigenDia: updatedDay.sobrasOrigenDia,
      sobrasOrigenTipo: updatedDay.sobrasOrigenTipo,
    };

    this.planService
      .actualizarDia(familyId, this.currentYear(), this.currentWeek(), request)
      .subscribe({
        next: () => {
          this.closeDayModal();
          this.refreshGrid();
          this.messageService.add({
            severity: 'success',
            summary: 'Guardado',
            detail: `${DIA_LABELS[updatedDay.dia]} - ${TIPO_COMIDA_LABELS[updatedDay.tipo]} actualizado`,
            life: 3000,
          });
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo guardar el cambio',
            life: 5000,
          });
        },
      });
  }

  /** Abre el modal de generación de menú */
  openGenerateModal(): void {
    this.showGenerateModal.set(true);
  }

  /** Cierra el modal de generación */
  closeGenerateModal(): void {
    this.showGenerateModal.set(false);
  }

  /** Ejecuta la generación del menú */
  onMenuGenerated(request: GenerateMenuRequest): void {
    const familyId = this.familyGroupId();
    if (!familyId) return;

    this.generating.set(true);

    // Añadir flag completar + año/semana
    const finalRequest: GenerateMenuRequest = {
      ...request,
      completar: this.isCompletar(),
      year: this.currentYear(),
      weekNumber: this.currentWeek(),
    };

    this.planService.generarMenu(familyId, finalRequest).subscribe({
      next: () => {
        this.generating.set(false);
        this.closeGenerateModal();
        this.refreshGrid();
        this.messageService.add({
          severity: 'success',
          summary: 'Menú generado',
          detail: 'El menú semanal ha sido generado y guardado.',
          life: 5000,
        });
      },
      error: () => {
        this.generating.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo generar el menú automático',
          life: 5000,
        });
      },
    });
  }

  /** Navega a la semana anterior */
  previousWeek(): void {
    this.planService.previousWeek();
    this.cargarPlan();
  }

  /** Navega a la semana siguiente */
  nextWeek(): void {
    this.planService.nextWeek();
    this.cargarPlan();
  }

  /** Carga el plan para la semana actual */
  private cargarPlan(): void {
    const familyId = this.familyGroupId();
    if (familyId) {
      this.planService.getPlan(familyId, this.currentYear(), this.currentWeek()).subscribe();
    }
  }

  ngOnInit(): void {
    // Cargar recetas para los dropdowns de los modales
    this.recipeService.loadRecipes();
    this.cargarPlan();
  }
}
