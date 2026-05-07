import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="home-container">
      <header class="home-header">
        <div class="logo">
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="24" cy="24" r="22" stroke="currentColor" stroke-width="2" />
            <path
              d="M16 32C16 32 18 28 24 28C30 28 32 32 32 32"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
            <circle cx="18" cy="20" r="2" fill="currentColor" />
            <circle cx="30" cy="20" r="2" fill="currentColor" />
          </svg>
          <span>FamilyFood</span>
        </div>
        <div class="user-info">
          <span class="welcome">Bienvenido, {{ authService.user()?.nombre || 'Usuario' }}</span>
          <span class="role-badge">{{ authService.user()?.role || 'USER' }}</span>
          <button class="logout-btn" (click)="authService.logout()">Cerrar sesión</button>
        </div>
      </header>
      <main class="home-content">
        <div class="welcome-card">
          <h1>¡Hola, {{ authService.user()?.nombre || 'Usuario' }}!</h1>
          <p>Has iniciado sesión correctamente en FamilyFood.</p>
          <p class="feature-hint">Aquí irán las funcionalidades del MVP:</p>
          <ul class="feature-list">
            <li>Plan Semanal</li>
            <li>Recetas</li>
            <li>Lista de Compra</li>
            <li>Botón del Pánico</li>
          </ul>
        </div>
      </main>
    </div>
  `,
  styles: [
    `
      .home-container {
        min-height: 100vh;
        background: #fff9f0;
        font-family: 'Inter', sans-serif;
      }

      .home-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 40px;
        background: white;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      }

      .logo {
        display: flex;
        align-items: center;
        gap: 12px;
        color: #2d6a4f;
        font-family: 'Montserrat', sans-serif;
        font-weight: 700;
        font-size: 20px;
      }

      .logo svg {
        width: 40px;
        height: 40px;
      }

      .user-info {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .welcome {
        color: #1b1b1b;
        font-weight: 500;
      }

      .role-badge {
        padding: 4px 12px;
        background: #e8f5e9;
        color: #2d6a4f;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
      }

      .logout-btn {
        padding: 8px 16px;
        background: #fff9f0;
        color: #2d6a4f;
        border: 2px solid #2d6a4f;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }

      .logout-btn:hover {
        background: #2d6a4f;
        color: white;
      }

      .home-content {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: calc(100vh - 80px);
        padding: 40px;
      }

      .welcome-card {
        background: white;
        padding: 48px;
        border-radius: 20px;
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.12);
        text-align: center;
        max-width: 500px;
      }

      .welcome-card h1 {
        font-family: 'Montserrat', sans-serif;
        font-size: 28px;
        color: #2d6a4f;
        margin: 0 0 16px;
      }

      .welcome-card p {
        color: #5a5a5a;
        font-size: 16px;
        margin: 0 0 24px;
      }

      .feature-hint {
        font-weight: 500;
        margin-bottom: 12px !important;
      }

      .feature-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      .feature-list li {
        padding: 16px;
        background: #f5f5f5;
        border-radius: 12px;
        color: #1b1b1b;
        font-weight: 500;
      }
    `,
  ],
})
export class HomeComponent {
  readonly authService = inject(AuthService);
}
