// ===== ETIQUETA DE RECETA (texto libre, con predefinidas) =====
export type EtiquetaReceta = string;

// ===== ETIQUETAS PREDEFINIDAS =====
export const ETIQUETAS_PREDEFINIDAS: EtiquetaReceta[] = ['RAPIDA', 'ECONOMICA', 'NINOS'];

// ===== MAPEO DE ETIQUETAS PARA UI (solo predefinidas) =====
export const ETIQUETA_LABELS: Record<string, string> = {
  RAPIDA: 'Rápida',
  ECONOMICA: 'Económica',
  NINOS: 'Niños',
};

export const ETIQUETA_ICONS: Record<string, string> = {
  RAPIDA: 'pi pi-bolt',
  ECONOMICA: 'pi pi-dollar',
  NINOS: 'pi pi-heart',
};

export const ETIQUETA_COLORS: Record<string, string> = {
  RAPIDA: 'bg-amber-100 text-amber-800 border-amber-300',
  ECONOMICA: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  NINOS: 'bg-pink-100 text-pink-800 border-pink-300',
};

// ===== HELPERS DE ETIQUETAS =====

/** Devuelve el label para una etiqueta (el propio valor si es personalizada) */
export function getEtiquetaLabel(etiqueta: EtiquetaReceta): string {
  return ETIQUETA_LABELS[etiqueta] || etiqueta;
}

/** Devuelve el icono para una etiqueta (null si es personalizada) */
export function getEtiquetaIcon(etiqueta: EtiquetaReceta): string | null {
  return ETIQUETA_ICONS[etiqueta] || null;
}

/** Devuelve las clases de color para una etiqueta (neutro si es personalizada) */
export function getEtiquetaColor(etiqueta: EtiquetaReceta): string {
  return ETIQUETA_COLORS[etiqueta] || 'bg-gray-100 text-gray-800 border-gray-300';
}

/** Comprueba si una etiqueta es predefinida */
export function isEtiquetaPredefinida(etiqueta: EtiquetaReceta): boolean {
  return ETIQUETAS_PREDEFINIDAS.includes(etiqueta);
}

// ===== INGREDIENTE DE RECETA =====
export interface RecipeIngredient {
  nombre: string;
  cantidad: number;
  unidad: string;
}

// ===== RESPUESTA DE RECETA (GET, POST, PUT) =====
export interface Recipe {
  id: string;
  nombre: string;
  descripcion: string;
  tiempoMinutos: number;
  raciones: number;
  ingredientes: RecipeIngredient[];
  pasos: string[];
  etiquetas: EtiquetaReceta[];
  imagen: string | null;
  favorita: boolean;
}

// ===== RESPUESTA DEL LISTADO (GET /recetas) =====
export interface RecipeListResponse {
  recetas: Recipe[];
}

// ===== PETICIÓN DE CREACIÓN (POST /recetas) =====
export interface CreateRecipeRequest {
  nombre: string;
  descripcion: string;
  tiempoMinutos: number;
  raciones: number;
  ingredientes: RecipeIngredient[];
  pasos: string[];
  etiquetas: EtiquetaReceta[];
  favorita: boolean;
}

// ===== PETICIÓN DE ACTUALIZACIÓN (PUT /recetas/{id}) =====
export interface UpdateRecipeRequest {
  nombre: string;
  descripcion: string;
  tiempoMinutos: number;
  raciones: number;
  ingredientes: RecipeIngredient[];
  pasos: string[];
  etiquetas: EtiquetaReceta[];
}

// ===== FILTROS DE BÚSQUEDA =====
export interface RecipeFilters {
  favoritas?: boolean;
  busqueda?: string;
  etiqueta?: EtiquetaReceta | '';
}
