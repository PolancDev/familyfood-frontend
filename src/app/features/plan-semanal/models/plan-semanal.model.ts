// ===== DÍAS DE LA SEMANA =====
export type DiaSemana =
  | 'LUNES'
  | 'MARTES'
  | 'MIERCOLES'
  | 'JUEVES'
  | 'VIERNES'
  | 'SABADO'
  | 'DOMINGO';

export const DIAS_SEMANA: DiaSemana[] = [
  'LUNES',
  'MARTES',
  'MIERCOLES',
  'JUEVES',
  'VIERNES',
  'SABADO',
  'DOMINGO',
];

export const DIA_LABELS: Record<DiaSemana, string> = {
  LUNES: 'Lunes',
  MARTES: 'Martes',
  MIERCOLES: 'Miércoles',
  JUEVES: 'Jueves',
  VIERNES: 'Viernes',
  SABADO: 'Sábado',
  DOMINGO: 'Domingo',
};

export const DIA_SHORT_LABELS: Record<DiaSemana, string> = {
  LUNES: 'LUN',
  MARTES: 'MAR',
  MIERCOLES: 'MIÉ',
  JUEVES: 'JUE',
  VIERNES: 'VIE',
  SABADO: 'SÁB',
  DOMINGO: 'DOM',
};

// ===== TIPOS DE COMIDA =====
export type TipoComida = 'COMIDA' | 'CENA';

export const TIPOS_COMIDA: TipoComida[] = ['COMIDA', 'CENA'];

export const TIPO_COMIDA_LABELS: Record<TipoComida, string> = {
  COMIDA: 'Comida',
  CENA: 'Cena',
};

export const TIPO_COMIDA_ICONS: Record<TipoComida, string> = {
  COMIDA: '🍽️',
  CENA: '🌙',
};

// ===== ESTADOS DE DÍA =====
export type EstadoDia = 'NORMAL' | 'SOBRAS' | 'COMER_FUERA' | 'IMPROVISADO';

export const ESTADOS_DIA: EstadoDia[] = ['NORMAL', 'SOBRAS', 'COMER_FUERA', 'IMPROVISADO'];

export const ESTADO_LABELS: Record<EstadoDia, string> = {
  NORMAL: 'Normal',
  SOBRAS: 'Sobras',
  COMER_FUERA: 'Comer fuera',
  IMPROVISADO: 'Improvisado',
};

export const ESTADO_ICONS: Record<EstadoDia, string> = {
  NORMAL: 'pi pi-check-circle',
  SOBRAS: 'pi pi-replay',
  COMER_FUERA: 'pi pi-home',
  IMPROVISADO: 'pi pi-question-circle',
};

// ===== MODELOS DE API =====

export interface WeeklyPlan {
  id: string;
  familyGroupId: string;
  year: number;
  weekNumber: number;
  startDate: string; // "2026-06-15"
  endDate: string; // "2026-06-21"
  dias: PlanDay[];
}

export interface PlanDay {
  id: string;
  dia: DiaSemana;
  tipo: TipoComida;
  receta: PlanDayRecipe | null;
  estado: EstadoDia;
  sobrasOrigenDia: DiaSemana | null;
  sobrasOrigenTipo: TipoComida | null;
  sobrasOrigenRecetaId: string | null;
  sobrasOrigenRecetaNombre: string | null;
  alergenosAdvertencia: boolean;
}

export interface PlanDayRecipe {
  id: string;
  nombre: string;
  tiempoMinutos: number;
}

// ===== PETICIONES =====

export interface SaveWeeklyPlanRequest {
  year: number;
  weekNumber: number;
  dias: SavePlanDayRequest[];
}

export interface SavePlanDayRequest {
  dia: DiaSemana;
  tipo: TipoComida;
  recetaId: string | null;
  estado: EstadoDia;
  sobrasOrigenDia: DiaSemana | null;
  sobrasOrigenTipo: TipoComida | null;
}

export interface UpdateDayRequest {
  dia: DiaSemana;
  tipo: TipoComida;
  recetaId: string | null;
  estado: EstadoDia;
  sobrasOrigenDia: DiaSemana | null;
  sobrasOrigenTipo: TipoComida | null;
}

export interface GenerateMenuRequest {
  numeroPersonas: number;
  recetasExcluidas?: string[];
  preferenciasUsar: boolean;
  completar?: boolean;
  year?: number;
  weekNumber?: number;
}
