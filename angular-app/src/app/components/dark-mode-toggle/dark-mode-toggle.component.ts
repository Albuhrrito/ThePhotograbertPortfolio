import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dark-mode-toggle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      class="dark-mode-toggle"
      (click)="toggleTheme()"
      [attr.aria-label]="isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'"
      title="{{ isDarkMode ? 'Switch to light mode' : 'Switch to dark mode' }}">
      {{ isDarkMode ? '☀️' : '🌙' }}
    </button>
  `,
  styles: []
})
export class DarkModeToggleComponent implements OnInit, OnDestroy {
  isDarkMode = false;
  private subscription?: Subscription;

  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    this.subscription = this.themeService.isDarkMode$.subscribe(
      isDark => this.isDarkMode = isDark
    );
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}