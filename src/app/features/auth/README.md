# FamilyFood Auth Module

## Descripción

Módulo de autenticación para la aplicación FamilyFood, construido con Angular 19.

## Características

- Login con email y contraseña
- Registro de nuevos usuarios
- Validación de formularios en tiempo real
- Persistencia de sesión en localStorage
- Guards para proteger rutas
- Interceptor JWT para autenticación

## Estructura

```
src/app/
├── core/
│   ├── guards/
│   │   └── auth.guard.ts         # authGuard, guestGuard
│   ├── interceptors/
│   │   └── jwt.interceptor.ts    # JWT Bearer token interceptor
│   ├── models/
│   │   ├── auth.model.ts         # DTOs de autenticación
│   │   ├── user.model.ts         # Modelo User
│   │   └── index.ts
│   └── services/
│       ├── auth.service.ts       # Servicio de autenticación
│       └── auth.service.spec.ts   # Tests unitarios
├── features/
│   └── auth/
│       └── pages/
│           ├── login/
│           │   ├── login.component.ts
│           │   ├── login.component.html
│           │   ├── login.component.css
│           │   ├── login.component.spec.ts
│           ├── register/
│           │   ├── register.component.ts
│           │   ├── register.component.html
│           │   ├── register.component.css
│           │   └── register.component.spec.ts
├── app.routes.ts                  # Rutas configuradas
└── app.config.ts                  # Configuración de providers
```

## Uso

### Rutas Protegidas

```typescript
// app.routes.ts
{
  path: 'home',
  loadComponent: () => import('./features/home/home.component'),
  canActivate: [authGuard]  // Requiere autenticación
}
```

### Rutas de Invitados

```typescript
{
  path: 'login',
  loadComponent: () => import('./features/auth/pages/login/login.component'),
  canActivate: [guestGuard]  // Solo para no autenticados
}
```

## Credenciales de Prueba

El servicio incluye mock data para desarrollo:

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | admin@familyfood.com | admin123 |
| Consumer | consumer@familyfood.com | consumer123 |

## API Endpoints

- `POST /auth/login` - Iniciar sesión
- `POST /auth/register` - Registrar nuevo usuario

## Signals Usage

```typescript
// Leer estado de autenticación
const isLoggedIn = authService.isAuthenticated();

// Obtener usuario actual
const user = authService.user();

// Obtener rol
const role = authService.userRole();

// Cerrar sesión
authService.logout();
```

## Testing

```bash
# Ejecutar tests
npm test

# Ejecutar tests con coverage
npm test -- --code-coverage
```

## Diseño

Ver especificación completa en: `docs/specs/ui/auth-pages.md`

### Paleta de Colores

- Primary: `#2D6A4F` (Verde Albahaca)
- Accent: `#FF8C42` (Naranja Zanahoria)
- Background: `#FFF9F0` (Crema Huevo)

### Tipografía

- Display: Montserrat Bold
- Body: Inter Regular