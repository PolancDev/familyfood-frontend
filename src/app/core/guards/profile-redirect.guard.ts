import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const profileRedirectGuard: CanActivateFn = (_route, _state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const role = authService.userRole();
  const userId = authService.user();

  if (role === 'INVITADO') {
    return router.parseUrl('/app/family-setup');
  }

  // ADMIN o CONSUMER → permite acceso al dashboard
  return true;
};
