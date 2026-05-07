# FamilyFood - Auth Pages Design Spec

## Concept & Vision

FamilyFood es una aplicación para planificar menús familiares. Las páginas de autenticación transmiten **calidez familiar** y **confianza**. El diseño evoca la sensación de entrar a una cocina acogedora: colores naturales inspirados en ingredientes frescos (verde albahaca, naranja zanahoria), tipografía moderna pero amigable, y micro-interacciones que hacen la experiencia delightful.

## Design Language

### Aesthetic Direction
- **Tono**: Warm minimalism - limpio pero con personalidad cálida
- **Referencia**: Aplicaciones de comida premium como HelloFresh, pero más friendly
- **Diferenciación**: Iconografía custom, gradientes suaves, elementos decorativos orgánicos

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| Primary | `#2D6A4F` | Botones principales, branding, enlaces |
| Primary Light | `#40916C` | Hover states, gradientes |
| Primary Dark | `#1B4332` | Active states, sombras |
| Accent | `#FF8C42` | CTAs secundarios, alertas positivas |
| Background | `#FFF9F0` | Fondo principal (crema huevo) |
| Card | `#FFFFFF` | Tarjetas y contenedores |
| Text | `#1B1B1B` | Títulos y texto principal |
| Text Secondary | `#5A5A5A` | Subtítulos y hints |
| Border | `#E5E5E5` | Bordes sutiles |
| Error | `#DC3545` | Mensajes de error |

### Typography

- **Display**: Montserrat (Bold 700, Medium 500) - títulos y botones
- **Body**: Inter (Regular 400, SemiBold 600) - formularios y texto

### Spatial System

- Base unit: 4px
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64px
- Border radius: 8px (sm), 12px (md), 20px (lg)

### Motion Philosophy

- **Entrada**: Slide-up + fade-in (0.6s ease-out)
- **Elementos decorativos**: Float suave (6s infinite)
- **Micro-interactions**: Hover lift (-2px), shadow expansion
- **Loading**: Spinner con gradiente
- **Error**: Shake animation (0.5s)

## Layout & Structure

### Login Page

```
┌─────────────────────────────────────┐
│  [Background gradient pattern]       │
│                                     │
│       ┌─────────────────┐           │
│       │   [Logo SVG]    │           │
│       │   FamilyFood    │           │
│       │   tagline...    │           │
│       │─────────────────│           │
│       │   Iniciar sesión│           │
│       │   [Form fields] │           │
│       │   [Submit btn]  │           │
│       │─────────────────│           │
│       │  Demo buttons   │           │
│       │─────────────────│           │
│       │  Crear cuenta → │           │
│       └─────────────────┘           │
│                                     │
│  ○ decorative circles               │
└─────────────────────────────────────┘
```

### Register Page

```
┌─────────────────────────────────────┐
│  [Background gradient pattern]       │
│                                     │
│       ┌─────────────────┐           │
│       │   [Logo SVG]    │           │
│       │   FamilyFood    │           │
│       │   Únete a nosotros│         │
│       │─────────────────│           │
│       │   Crear cuenta  │           │
│       │   [Form fields] │           │
│       │     - Nombre    │           │
│       │     - Email     │           │
│       │     - Password  │           │
│       │     - Confirm   │           │
│       │   [Submit btn]  │           │
│       │  Términos...    │           │
│       │─────────────────│           │
│       │  Iniciar sesión │           │
│       └─────────────────┘           │
│                                     │
└─────────────────────────────────────┘
```

## Features & Interactions

### Login Form

| Field | Type | Validation | Icon |
|-------|------|------------|------|
| Email | email | Required, valid email format | Envelope |
| Password | password | Required, min 6 chars | Lock |

**Behaviors:**
- Toggle password visibility (eye icon)
- Real-time validation on blur
- Error shake on invalid submit
- Demo credentials buttons for easy testing
- Redirect to `returnUrl` query param after success

**Mock Credentials:**
- Admin: `admin@familyfood.com` / `admin123`
- Consumer: `consumer@familyfood.com` / `consumer123`

### Register Form

| Field | Type | Validation | Icon |
|-------|------|------------|------|
| Nombre | text | Required, 2-50 chars | User |
| Email | email | Required, valid format | Envelope |
| Password | password | Required, min 6 chars | Lock |
| Confirm Password | password | Must match password | Lock |

**Behaviors:**
- Password match validation
- Success message with redirect
- Terms links (placeholder)

## Component Inventory

### Logo Component
- SVG circular con icono de cara sonriente
- Gradiente primary → primary-light
- Sombras con spread de color primary
- Estados: default, hover (scale 1.05)

### Input Field
- Estados: default, focus, invalid, disabled
- Icono a la izquierda (18x18px)
- Padding: 14px vertical, 44px left (icon)
- Border: 2px solid transparent → primary on focus
- Invalid: border-color error, shake animation

### Password Toggle Button
- 36x36px clickable area
- Icono eye/eye-off
- Hover: background rgba(0,0,0,0.05)

### Primary Button
- Gradiente background
- Box-shadow con spread de primary
- Hover: translateY(-2px), shadow expansion
- Disabled: opacity 0.7, cursor not-allowed
- Loading: spinner + texto "Iniciando sesión..."

### Demo Button
- 2 columnas grid
- Badge de rol (Admin/User)
- Hover: border primary, badge color fill

### Error Alert
- Background error-light
- Icon warning
- Shake animation on appear

### Success Alert
- Background success-light
- Icon checkmark
- Slide-down animation

## Technical Approach

### Architecture
- Angular 19 Standalone Components
- ChangeDetection: OnPush (mejor performance)
- Signals para estado reactivo
- Reactive Forms para validación
- Lazy loading de rutas

### State Management
- AuthService con signals:
  - `_token`: Signal<string | null>
  - `_user`: Signal<User | null>
  - `isAuthenticated`: computed
  - `userRole`: computed
- localStorage para persistencia

### API Integration
- Base URL: `http://localhost:8080/api/v1`
- Endpoints:
  - POST `/auth/login`
  - POST `/auth/register`
- JWT en Authorization header
- Mock responses para desarrollo

### Guards
- `authGuard`: Protege rutas autenticadas
- `guestGuard`: Solo para no autenticados

### Interceptor
- `jwtInterceptor`: Añade Bearer token a todas las requests

### Accessibility
- ARIA labels en toggle buttons
- Focus visible styles
- Role="alert" en mensajes de error
- Reduced motion support
- Contraste 4.5:1 mínimo