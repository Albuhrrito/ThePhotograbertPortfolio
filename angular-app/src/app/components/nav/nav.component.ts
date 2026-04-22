import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  HostListener,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CATEGORIES } from '../../shared/manifest.model';
import { ThemeService } from '../../services/theme.service';

/**
 * Sticky slim top bar. Hides on scroll-down, reappears on scroll-up.
 * Hamburger opens a full-screen overlay on mobile.
 */
@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.css',
})
export class NavComponent {
  categories = CATEGORIES;
  menuOpen = signal(false);
  hidden = signal(false);
  private lastY = 0;
  private platformId = inject(PLATFORM_ID);
  private theme = inject(ThemeService);

  isDark = signal(this.theme.getCurrentTheme());

  constructor() {
    this.theme.isDarkMode$.subscribe(v => this.isDark.set(v));
  }

  @HostBinding('class.is-hidden') get h() { return this.hidden(); }
  @HostBinding('class.menu-open') get m() { return this.menuOpen(); }

  @HostListener('window:scroll')
  onScroll(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const y = window.scrollY;
    // Always show at top
    if (y < 40) { this.hidden.set(false); this.lastY = y; return; }
    if (y > this.lastY + 6) this.hidden.set(true);
    else if (y < this.lastY - 6) this.hidden.set(false);
    this.lastY = y;
  }

  toggleMenu(): void {
    this.menuOpen.update(v => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  toggleTheme(): void {
    this.theme.toggleTheme();
  }
}
