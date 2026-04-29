import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { familyGuard } from '../../core/guards/family.guard';
import { profileRedirectGuard } from '../../core/guards/profile-redirect.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./dashboard/dashboard.component').then((m) => m.DashboardComponent),
    canActivate: [profileRedirectGuard],
  },
  {
    path: 'family-setup',
    loadComponent: () =>
      import('../../features/family-groups/pages/family-setup/family-setup.component').then(
        (m) => m.FamilySetupComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'family-dashboard',
    loadComponent: () =>
      import('../../features/family-groups/pages/family-dashboard/family-dashboard.component').then(
        (m) => m.FamilyDashboardComponent,
      ),
    canActivate: [authGuard, familyGuard],
  },
];
