# FamilyFood - Frontend

Aplicación web Angular para la planificación de menús familiares. Interfaz de usuario para gestionar recetas, planificar menús semanales, generar listas de la compra y administrar grupos familiares.

## Stack Tecnológico

- **Angular 19** (Standalone Components)
- **TypeScript** (strict mode)
- **PrimeNG 19** (componentes UI)
- **Tailwind CSS v3** (estilos utility-first)
- **Signals** (estado reactivo)
- **Reactive Forms** (formularios)
- **TanStack Query** (cache y sincronización con backend)
- **Jest** (tests unitarios)
- **ESLint 9 + Prettier** (calidad de código)

## Estructura del Proyecto

```
src/
├── app/
│   ├── core/                    → Servicios, Guards, Interceptors, Modelos
│   │   ├── guards/              → AuthGuard, LoginGuard, FamilyGuard
│   │   ├── interceptors/        → JWT Interceptor (Bearer token)
│   │   ├── models/              → user.model.ts, family.model.ts
│   │   └── services/            → AuthService, FamilyService
│   │
│   ├── shared/                  → Componentes, Directivas, Pipes compartidos
│   │
│   └── features/                → Módulos por funcionalidad (lazy loading)
│       ├── auth/                → Login, Register
│       │   └── pages/
│       │       ├── login/       → LoginComponent
│       │       └── register/    → RegisterComponent
│       │
│       ├── home/                → Página principal
│       │   └── pages/
│       │       └── home/        → HomeComponent
│       │
│       └── family-groups/       → Gestión de familias
│           └── pages/
│               ├── family-setup/       → FamilySetupComponent
│               └── family-dashboard/   → FamilyDashboardComponent
│
├── assets/                      → Imágenes, iconos, favicon
├── environments/                → environment.ts, environment.prod.ts
└── styles.css                   → Estilos globales + Tailwind directives
```

## Cómo ejecutar

### Requisitos
- Node.js 20+
- npm 10+

### Pasos
```bash
# 1. Clonar el repositorio
git clone https://github.com/PolancDev/familyfood-frontend.git
cd familyfood-frontend

# 2. Instalar dependencias
npm install

# 3. Ejecutar en desarrollo (con HMR)
npm start

# 4. Abrir en el navegador: http://localhost:4200
```

## Scripts disponibles
| Comando | Descripción |
|---------|-------------|
| `npm start` | Servidor de desarrollo con HMR (puerto 4200) |
| `npm run build` | Build de producción |
| `npm run test` | Ejecutar tests unitarios (Jest) |
| `npm run lint` | Verificar código con ESLint |
| `npm run lint:fix` | Corregir errores ESLint automáticamente |
| `npm run format` | Formatear código con Prettier |
| `npm run format:check` | Verificar formato sin modificar |

## Tests
```bash
# Ejecutar todos los tests
npm run test

# Ejecutar tests en modo watch
npm run test -- --watch
```

## Autenticación
La aplicación usa **JWT** para autenticación:
- El token se almacena en `localStorage`
- Se envía automáticamente en cada petición mediante el `JwtInterceptor`
- El `AuthGuard` protege las rutas privadas
- El `LoginGuard` redirige a home si ya estás autenticado

## Sistema de Familias

### Flujo de usuario
1. **Registro**: El usuario se registra con rol `INVITADO`
2. **Sin familia**: Al acceder a `/home`, el `FamilyGuard` redirige a `/family-setup`
3. **Opciones en FamilySetup**:
   - **Crear familia**: Introduce un nombre → se convierte en `ADMIN`
   - **Unirse a familia**: Introduce el ID de una familia → solicita unión como `CONSUMER`
4. **Dashboard de familia** (`/family-dashboard`):
   - **ADMIN**: Ve miembros, ve solicitudes pendientes, puede aprobar/rechazar
   - **CONSUMER**: Ve información de su familia

### Roles
| Rol | Descripción |
|-----|-------------|
| `INVITADO` | Usuario registrado sin familia asignada |
| `CONSUMER` | Miembro de una familia (puede ver contenido) |
| `ADMIN` | Administrador de la familia (gestiona miembros y solicitudes) |

## Diseño Visual
- **Paleta de colores**: Naranja primario (#E86A33), Verde secundario (#2D6A4F), Crema (#FFF8F0)
- **Componentes**: PrimeNG (p-card, p-button, p-inputText, p-password, p-table, p-tag, p-toast)
- **Estilos**: Tailwind CSS para layout y espaciado
- **Responsive**: Breakpoints sm:, md:, lg: para móvil, tablet y desktop
- **Accesibilidad**: WCAG 2.1 AA, aria-labels, roles semánticos

## Rutas
| Ruta | Componente | Guards |
|------|-----------|--------|
| `/auth/login` | LoginComponent | LoginGuard |
| `/auth/register` | RegisterComponent | LoginGuard |
| `/home` | HomeComponent | AuthGuard + FamilyGuard |
| `/family-setup` | FamilySetupComponent | AuthGuard |
| `/family-dashboard` | FamilyDashboardComponent | AuthGuard + FamilyGuard |

## Funcionalidades Implementadas

- **Autenticación:** Login/Register con JWT, almacenamiento en localStorage, interceptor automático
- **Gestión de Familias:** Crear familia, unirse por ID, dashboard con miembros y solicitudes
- **Recetas:** CRUD completo con formularios reactivos, ingredientes dinámicos, etiquetas y niveles de cocina
- **Diseño Responsive:** Adaptado a móvil, tablet y desktop con Tailwind CSS + PrimeNG
