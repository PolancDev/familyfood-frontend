import { Component, ChangeDetectionStrategy, inject, OnInit, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { FamilyService } from '../../../core/services/family.service';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';

interface DashboardCard {
  title: string;
  description: string;
  icon: string;
  route: string;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, CardModule, ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  readonly authService = inject(AuthService);
  readonly familyService = inject(FamilyService);

  readonly hasPendingRequests = computed(() => this.familyService.myPendingRequests().length > 0);
  readonly pendingRequestGroups = computed(() =>
    this.familyService.myPendingRequests().map((r) => r.familyGroupName).join(', '),
  );

  ngOnInit(): void {
    this.familyService.getMyPendingRequests().subscribe();
  }

  readonly cards: DashboardCard[] = [
    {
      title: 'Plan Semanal',
      description: 'Organiza las comidas de toda la semana para tu familia.',
      icon: 'pi pi-calendar',
      route: '/app/weekly-plan',
      color: 'from-primary to-primary-dark',
    },
    {
      title: 'Recetas',
      description: 'Gestiona tu recetario familiar con platos para todos los gustos.',
      icon: 'pi pi-book',
      route: '/app/recetas',
      color: 'from-accent to-accent-dark',
    },
    {
      title: 'Lista de Compra',
      description: 'Genera automáticamente la lista de la compra según tu plan semanal.',
      icon: 'pi pi-shopping-cart',
      route: '/app/shopping-list',
      color: 'from-secondary to-secondary-dark',
    },
    {
      title: 'Mi Familia',
      description: 'Administra los miembros de tu familia y sus preferencias.',
      icon: 'pi pi-users',
      route: '/app/family-dashboard',
      color: 'from-blue-500 to-blue-700',
    },
    {
      title: 'Botón del Pánico',
      description: '¿Sin ideas? Genera una comida rápida con lo que tienes en casa.',
      icon: 'pi pi-exclamation-triangle',
      route: '/app/panic',
      color: 'from-red-500 to-red-700',
    },
    {
      title: 'Configurar Familia',
      description: 'Crea o únete a un grupo familiar para compartir planes y listas.',
      icon: 'pi pi-cog',
      route: '/app/family-setup',
      color: 'from-purple-500 to-purple-700',
    },
  ];
}
