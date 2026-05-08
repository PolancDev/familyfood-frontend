import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/recipe-list/recipe-list.component').then((m) => m.RecipeListComponent),
    canActivate: [authGuard],
  },
  {
    path: 'nueva',
    loadComponent: () =>
      import('./pages/recipe-form/recipe-form.component').then((m) => m.RecipeFormComponent),
    canActivate: [authGuard],
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/recipe-detail/recipe-detail.component').then((m) => m.RecipeDetailComponent),
    canActivate: [authGuard],
  },
  {
    path: ':id/editar',
    loadComponent: () =>
      import('./pages/recipe-form/recipe-form.component').then((m) => m.RecipeFormComponent),
    canActivate: [authGuard],
  },
];
