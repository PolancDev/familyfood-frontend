# Frontend - Angular 19

## Arquitectura de Módulos

```
frontend/
├── src/
│   ├── app/
│   │   ├── core/                    # Módulo Core (singletons)
│   │   │   ├── services/            # Servicios singletons
│   │   │   ├── guards/              # Guards de rutas
│   │   │   ├── interceptors/        # HTTP interceptors
│   │   │   └── models/              # Modelos TypeScript
│   │   │
│   │   ├── shared/                  # Módulo Shared (reutilizable)
│   │   │   ├── components/         # Componentes compartidos
│   │   │   ├── directives/         # Directivas
│   │   │   └── pipes/              # Pipes
│   │   │
│   │   └── features/               # Módulos de características
│   │       ├── auth/               # Autenticación
│   │       ├── recipes/            # Gestión de recetas
│   │       ├── weekly-plan/        # Planificador semanal
│   │       ├── shopping-list/      # Lista de compras
│   │       └── profile/            # Perfil de usuario
│   │
│   ├── assets/                     # Recursos estáticos
│   │   ├── images/                 # Imágenes
│   │   ├── icons/                  # Iconos SVG
│   │   └── i18n/                   # Traducciones
│   │
│   └── environments/               # Configuración por entorno
│
├── e2e/                            # Tests end-to-end
└── ...
```

## Agente Asignado

**FRONTEND** → Trabaja en este directorio
**UI-UX** → Trabaja en este directorio (estilos y diseño)

## Comandos Útiles

```bash
# Servidor desarrollo
ng serve

# Build producción
ng build

# Tests unitarios
ng test

# Tests e2e
ng e2e

# Linting
ng lint
```

## Convenciones

- Usar Standalone Components
- Signals para estado reactivo
- OnPush change detection
- Rutas lazy-loaded por feature
