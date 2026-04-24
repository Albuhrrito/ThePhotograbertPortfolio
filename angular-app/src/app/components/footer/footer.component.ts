import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="footer">
      <div class="footer__inner container">
        <div class="footer__col">
          <span class="label">Albert "The Photograbert" Youssef</span>
          <p class="footer__tag">Photographs that remember for you.</p>
        </div>

        <ul class="footer__links">
          <li><a href="https://www.instagram.com/thephotograbert" target="_blank" rel="noopener" aria-label="Instagram">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            <span>Instagram</span>
          </a></li>
          <li><a href="https://www.linkedin.com/in/albert-youssef-5420341ba/" target="_blank" rel="noopener" aria-label="LinkedIn">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
            <span>LinkedIn</span>
          </a></li>
          <li><a href="https://www.albruh.tech" target="_blank" rel="noopener" aria-label="Personal site">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <span>albruh.tech</span>
          </a></li>
          <li><a routerLink="/contact">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            <span>Get in touch</span>
          </a></li>
        </ul>
      </div>
      <div class="footer__meta container">
        <span class="label">© {{ year }} Albert Youssef</span>
        <span class="label">Built in Angular &middot; shot on Fujifilm &amp; Nikon</span>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      margin-top: var(--s-10);
      padding: var(--s-9) 0 calc(var(--s-5) + var(--safe-bottom));
      background: var(--c-bg-alt);
      border-top: 1px solid var(--c-line);
    }
    .footer__inner {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: var(--s-6);
      flex-wrap: wrap;
      margin-bottom: var(--s-7);
    }
    .footer__col { max-width: 360px; }
    .footer__tag {
      font-family: var(--ff-display);
      font-size: 1.5rem;
      margin-top: var(--s-2);
      color: var(--c-ink);
    }

    .footer__links {
      list-style: none; margin: 0; padding: 0;
      display: flex; flex-direction: column; gap: var(--s-2);
      font-size: var(--fs-small);
    }
    .footer__links a {
      display: inline-flex; align-items: center; gap: var(--s-3);
      color: var(--c-ink-soft);
      /* ≥44px tap target on touch via vertical padding. */
      padding: 10px 0;
    }
    .footer__links a:hover { color: var(--c-accent); }

    .footer__meta {
      display: flex;
      justify-content: space-between;
      padding-top: var(--s-4);
      border-top: 1px solid var(--c-line);
      color: var(--c-ink-mute);
      gap: var(--s-3);
      flex-wrap: wrap;
    }

    @media (max-width: 640px) {
      .footer { margin-top: var(--s-8); padding-top: var(--s-7); }
      .footer__inner { gap: var(--s-5); margin-bottom: var(--s-5); }
      .footer__tag { font-size: 1.25rem; }
      .footer__meta { flex-direction: column; gap: var(--s-2); }
    }
  `],
})
export class FooterComponent {
  year = new Date().getFullYear();
}
