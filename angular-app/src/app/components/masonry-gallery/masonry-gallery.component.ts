import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  PLATFORM_ID,
  ViewChildren,
  QueryList,
  inject,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { PhotoComponent } from '../photo/photo.component';
import { ManifestEntry, CategorySlug } from '../../shared/manifest.model';
import { LightboxService } from '../../services/lightbox.service';

/**
 * CSS-columns masonry grid. Responsive column counts via container-query-ish
 * media queries. Each tile scroll-reveals via IntersectionObserver and shows
 * viewfinder corner brackets on hover.
 */
@Component({
  selector: 'app-masonry-gallery',
  standalone: true,
  imports: [CommonModule, PhotoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="masonry">
      @for (entry of entries; track entry.id; let i = $index) {
        <li #tile class="masonry__tile" (click)="openAt(i)">
          <div class="masonry__photo-wrap">
            <app-photo
              [entry]="entry"
              [category]="category"
              [priority]="i < 2"
              [sizes]="tileSizes"
              tier="thumb"
            />
            <span class="viewfinder-corners"><span></span></span>
          </div>
        </li>
      }
    </ul>
  `,
  styleUrl: './masonry-gallery.component.css',
})
export class MasonryGalleryComponent implements AfterViewInit, OnDestroy {
  @Input({ required: true }) entries: ManifestEntry[] = [];
  @Input({ required: true }) category!: CategorySlug;
  @Input() tileSizes = '(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw';

  @ViewChildren('tile') tiles!: QueryList<ElementRef<HTMLElement>>;

  private observer?: IntersectionObserver;
  private platformId = inject(PLATFORM_ID);
  private lb = inject(LightboxService);

  openAt(index: number): void {
    this.lb.open(this.entries, this.category, index);
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            (e.target as HTMLElement).classList.add('is-revealed');
            this.observer?.unobserve(e.target);
          }
        }
      },
      { rootMargin: '80px 0px', threshold: 0.01 },
    );
    this.tiles.forEach(t => this.observer?.observe(t.nativeElement));
    // Re-observe if list changes
    this.tiles.changes.subscribe(() => {
      this.tiles.forEach(t => {
        if (!t.nativeElement.classList.contains('is-revealed')) {
          this.observer?.observe(t.nativeElement);
        }
      });
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
