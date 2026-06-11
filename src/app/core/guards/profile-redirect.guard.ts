import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { FamilyService } from '../services/family.service';
import { map, switchMap, of } from 'rxjs';

export const profileRedirectGuard: CanActivateFn = (_route, _state) => {
  const authService = inject(AuthService);
  const familyService = inject(FamilyService);
  const router = inject(Router);

  const role = authService.userRole();

  // Si es INVITADO, redirigir a family-setup
  if (role === 'INVITADO') {
    return router.parseUrl('/app/family-setup');
  }

  // Si es ADMIN/CONSUMER, cargar familias para que el dashboard tenga datos contextuales
  // Si ya tenemos datos en el signal, no recargamos
  if (familyService.families().length > 0) {
    return of(true);
  }

  return familyService.getMyFamilies().pipe(
    map(() => true),
  );
};
