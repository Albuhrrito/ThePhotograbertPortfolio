import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  QueryList,
  ViewChildren,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PhotoComponent } from '../photo/photo.component';
import { ManifestService } from '../../services/manifest.service';
import { CATEGORIES, ManifestEntry } from '../../shared/manifest.model';
import { imageUrl } from '../../shared/image-url';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, PhotoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  private manifests = inject(ManifestService);
  private platformId = inject(PLATFORM_ID);

  heroImages: ManifestEntry[] = [];
  categories = CATEGORIES;
  aboutImage?: ManifestEntry;

  currentHeroIndex = signal(0);
  private heroTimer?: ReturnType<typeof setInterval>;

  @ViewChildren('catCard') catCards!: QueryList<ElementRef<HTMLElement>>;
  private observer?: IntersectionObserver;

  ngOnInit(): void {
    this.heroImages = this.manifests.get('hero');
    this.aboutImage = this.manifests.featured('about');
  }

  heroUrlLarge(entry: ManifestEntry): string {
    return imageUrl('hero', 'large', entry.id, 'webp');
  }
  heroUrlLargeJpg(entry: ManifestEntry): string {
    return imageUrl('hero', 'large', entry.id, 'jpg');
  }

  featuredFor(slug: typeof CATEGORIES[number]['slug']): ManifestEntry | undefined {
    const meta = CATEGORIES.find(c => c.slug === slug);
    if (meta?.heroImageId) {
      const picked = this.manifests.findById(slug, meta.heroImageId);
      if (picked) return picked;
    }
    return this.manifests.featured(slug);
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Cycle hero every 7 seconds
    if (this.heroImages.length > 1) {
      this.heroTimer = setInterval(() => {
        this.currentHeroIndex.update(i => (i + 1) % this.heroImages.length);
      }, 7000);
    }

    // Reveal category cards on scroll
    this.observer = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          (e.target as HTMLElement).classList.add('is-revealed');
          this.observer?.unobserve(e.target);
        }
      }
    }, { rootMargin: '60px 0px', threshold: 0.05 });
    this.catCards.forEach(c => this.observer?.observe(c.nativeElement));
  }

  ngOnDestroy(): void {
    if (this.heroTimer) clearInterval(this.heroTimer);
    this.observer?.disconnect();
  }
}
