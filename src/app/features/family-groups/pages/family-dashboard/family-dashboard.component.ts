import { Component, ChangeDetectionStrategy, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FamilyService } from '../../../../core/services/family.service';
import { AuthService } from '../../../../core/services/auth.service';

// PrimeNG
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-family-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    TableModule,
    TagModule,
    ButtonModule,
    MessageModule,
    ProgressSpinnerModule,
    TooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './family-dashboard.component.html',
})
export class FamilyDashboardComponent implements OnInit {
  private readonly familyService = inject(FamilyService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly families = this.familyService.families.asReadonly();
  readonly currentFamily = this.familyService.currentFamily.asReadonly();
  readonly members = this.familyService.members.asReadonly();
  readonly pendingRequests = this.familyService.pendingRequests.asReadonly();
  readonly loading = this.familyService.loading.asReadonly();
  readonly error = this.familyService.error.asReadonly();

  readonly userRole = this.authService.userRole;

  readonly isAdmin = computed(() => this.userRole() === 'ADMIN');

  readonly hasPendingRequests = computed(() => this.pendingRequests().length > 0);

  ngOnInit(): void {
    this.loadFamilyData();
  }

  private loadFamilyData(): void {
    this.familyService.getMyFamilies().subscribe({
      next: (families) => {
        if (families.length > 0) {
          const family = families[0];
          this.familyService.currentFamily.set(family);
          this.familyService.getMembers(family.id).subscribe({
            next: (members) => {
              // Verificar si el usuario actual es ADMIN en los miembros
              const currentUser = this.authService.user();
              if (currentUser) {
                const isMemberAdmin = members.some(
                  (m) => m.userId === currentUser.id && m.role === 'ADMIN',
                );
                if (isMemberAdmin && currentUser.role !== 'ADMIN') {
                  this.authService.updateUserRole('ADMIN');
                }
              }
            },
          });
          if (this.isAdmin()) {
            this.familyService.getPendingRequests(family.id).subscribe();
          }
        }
      },
    });
  }

  approveRequest(requestId: string): void {
    this.familyService.approveRequest(requestId).subscribe();
  }

  rejectRequest(requestId: string): void {
    this.familyService.rejectRequest(requestId).subscribe();
  }

  goToSetup(): void {
    this.router.navigate(['/app/family-setup']);
  }

  getRoleSeverity(role: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    switch (role) {
      case 'ADMIN':
        return 'success';
      case 'CONSUMER':
        return 'info';
      default:
        return 'info';
    }
  }

  getRequestStatusSeverity(
    status: string,
  ): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    switch (status) {
      case 'PENDING':
        return 'warn';
      case 'APPROVED':
        return 'success';
      case 'REJECTED':
        return 'danger';
      default:
        return 'info';
    }
  }
}
