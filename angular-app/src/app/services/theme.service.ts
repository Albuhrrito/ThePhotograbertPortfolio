import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private isDarkMode = new BehaviorSubject<boolean>(false);
  public isDarkMode$ = this.isDarkMode.asObservable();

  constructor() {
    this.initializeTheme();
  }

  private initializeTheme(): void {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

      const isDark = savedTheme === 'dark' || (savedTheme === null && prefersDark);
      this.setTheme(isDark);
    }
  }

  toggleTheme(): void {
    const newTheme = !this.isDarkMode.value;
    this.setTheme(newTheme);
  }

  private setTheme(isDark: boolean): void {
    this.isDarkMode.next(isDark);

    if (typeof document !== 'undefined') {
      if (isDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
    }

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }
  }

  getCurrentTheme(): boolean {
    return this.isDarkMode.value;
  }
}