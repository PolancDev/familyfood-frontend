import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { FamilyService } from '../services/family.service';
import { map } from 'rxjs/operators';

export const familyGuard: CanActivateFn = () => {
  const familyService = inject(FamilyService);
  const router = inject(Router);

  // Si ya tenemos familias en el signal, decidir inmediatamente
  if (familyService.families().length > 0) {
    return true;
  }

  // Si el signal está vacío, cargar desde el backend antes de decidir
  return familyService.getMyFamilies().pipe(
    map((families) => {
      if (families.length > 0) {
        return true;
      }
      return router.parseUrl('/app/family-setup');
    }),
  );
};
