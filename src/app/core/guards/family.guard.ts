import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { FamilyService } from '../services/family.service';

export const familyGuard: CanActivateFn = (_route, _state) => {
  const familyService = inject(FamilyService);
  const router = inject(Router);

  // Si no tiene familia, redirigir a family-setup
  if (familyService.families().length === 0) {
    return router.parseUrl('/app/family-setup');
  }
  return true;
};
