import { Component, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule],
  template: `
    <header [class.scrolled]="isScrolled">
      <nav>
        <div class="logo-container">
          <a routerLink="/" class="logo">
            <span class="logo-x">X</span><span class="logo-2">2</span>
          </a>
        </div>

        <div class="nav-links">
          @if (!(isLoggedIn$ | async)) {
            <a routerLink="/login">Login</a>
            <a routerLink="/register">Register</a>
          } @else {
            <a routerLink="/feed">Feed</a>
            <button (click)="logout()" class="logout-btn">Logout</button>
          }
        </div>
      </nav>
    </header>
    <main>
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
    }

    header {
      position: sticky;
      top: 0;
      z-index: 100;
      background-color: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      padding: 16px 0;
      border-bottom: 1px solid rgba(229, 231, 235, 0.5);
      transition: all 0.3s ease;
    }

    header.scrolled {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      padding: 12px 0;
    }

    nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 24px;
    }

    .logo-container {
      display: flex;
      align-items: center;
    }

    .logo {
      font-size: 2rem;
      font-weight: 900;
      text-decoration: none;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
    }

    .logo-x {
      color: #1DA1F2;
      margin-right: -3px;
    }

    .logo-2 {
      color: #14171A;
    }

    .logo:hover {
      transform: scale(1.05);
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: 32px;
    }

    .nav-links a {
      text-decoration: none;
      color: #14171A;
      font-size: 1rem;
      font-weight: 500;
      padding: 8px 0;
      position: relative;
      transition: all 0.2s ease;
    }

    .nav-links a::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 0;
      height: 2px;
      background-color: #1DA1F2;
      transition: width 0.3s ease;
    }

    .nav-links a:hover::after,
    .nav-links a.active::after {
      width: 100%;
    }

    .nav-links a:hover {
      color: #1DA1F2;
    }

    .register-btn {
      background-color: #1DA1F2;
      color: white !important;
      padding: 10px 20px !important;
      border-radius: 24px;
      font-weight: 600;
      transition: all 0.2s ease;
    }

    .register-btn:hover {
      background-color: #0d8ed9;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(29, 161, 242, 0.3);
    }

    .register-btn::after {
      display: none;
    }

    .logout-btn {
      background-color: #f1f5f9;
      border: none;
      cursor: pointer;
      color: #14171A;
      font-size: 1rem;
      font-weight: 500;
      padding: 10px 20px;
      border-radius: 24px;
      transition: all 0.2s ease;
    }

    .logout-btn:hover {
      background-color: #e2e8f0;
      color: #1DA1F2;
    }

    .mobile-menu-button {
      display: none;
      flex-direction: column;
      justify-content: space-between;
      height: 20px;
      width: 28px;
      cursor: pointer;
      z-index: 15;
    }

    .bar {
      width: 100%;
      height: 2px;
      background-color: #14171A;
      transition: all 0.3s ease;
    }

    main {
      max-width: 100%;
      margin: 0 auto;
    }

    @media (max-width: 768px) {
      .mobile-menu-button {
        display: flex;
      }

      .nav-links {
        position: fixed;
        top: 0;
        right: -100%;
        width: 80%;
        max-width: 300px;
        height: 100vh;
        background-color: white;
        flex-direction: column;
        padding: 80px 32px;
        gap: 20px;
        box-shadow: -5px 0 15px rgba(0, 0, 0, 0.1);
        transition: right 0.3s ease;
        align-items: flex-start;
      }

      .nav-links.mobile-open {
        right: 0;
      }

      .mobile-open + .bar:nth-child(1) {
        transform: translateY(8px) rotate(45deg);
      }

      .mobile-open + .bar:nth-child(2) {
        opacity: 0;
      }

      .mobile-open + .bar:nth-child(3) {
        transform: translateY(-8px) rotate(-45deg);
      }
    }
  `]
})
export class AppComponent {
  isLoggedIn$: Observable<string | null>;
  isScrolled = false;
  mobileMenuOpen = false;

  constructor(private authService: AuthService) {
    this.isLoggedIn$ = this.authService.token$;
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    this.isScrolled = window.scrollY > 10;
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  logout() {
    this.authService.logout();
    this.mobileMenuOpen = false;
  }
}
