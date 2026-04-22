import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavComponent } from './components/nav/nav.component';
import { FooterComponent } from './components/footer/footer.component';
import { LightboxComponent } from './components/lightbox/lightbox.component';
import { ViewfinderCursorComponent } from './components/viewfinder-cursor/viewfinder-cursor.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    NavComponent,
    FooterComponent,
    LightboxComponent,
    ViewfinderCursorComponent,
  ],
  template: `
    <app-nav />
    <main class="app-main">
      <router-outlet />
    </main>
    <app-footer />
    <app-lightbox />
    <app-viewfinder-cursor />
  `,
  styles: [`
    .app-main {
      display: block;
      min-height: 100vh;
    }
  `],
})
export class AppComponent {}
