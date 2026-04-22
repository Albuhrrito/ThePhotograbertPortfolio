import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  PLATFORM_ID,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
// ElementRef kept imported for the template ViewChild type; host ref no longer needed.
import { ManifestEntry, CategorySlug } from '../../shared/manifest.model';
import { imageUrl, Tier } from '../../shared/image-url';

/**
 * <app-photo> — progressive-loading image with LQIP blur-up.
 *
 *   Renders an inline base64 LQIP (sharp, immediate), overlays a <picture>
 *   that swaps in once the real file finishes decoding. WebP preferred,
 *   JPEG fallback. Width/height attributes set to preserve layout (no CLS).
 *
 *   `loading="eager"` only for above-the-fold priority images; everything else
 *   is lazy-loaded with an IntersectionObserver-based reveal.
 */
@Component({
  selector: 'app-photo',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <figure
      class="photo"
      [class.is-loaded]="loaded"
      [style.aspect-ratio]="entry.w + ' / ' + entry.h"
    >
      <img class="photo__lqip" [src]="entry.lqip" aria-hidden="true" alt="" />
      <picture>
        <source [srcset]="srcsetWebp" [sizes]="sizes" type="image/webp" />
        <img
          #img
          class="photo__img"
          [src]="fallbackJpg"
          [srcset]="srcsetJpg"
          [sizes]="sizes"
          [attr.width]="entry.w"
          [attr.height]="entry.h"
          [attr.loading]="priority ? 'eager' : 'lazy'"
          [attr.fetchpriority]="priority ? 'high' : 'auto'"
          [attr.decoding]="priority ? 'sync' : 'async'"
          [alt]="entry.alt"
          (load)="onLoad()"
        />
      </picture>
    </figure>
  `,
  styles: [
    `
      :host { display: block; position: relative; }

      .photo {
        position: relative;
        margin: 0;
        width: 100%;
        overflow: hidden;
        background: var(--c-bg-alt);
      }

      .photo__lqip,
      .photo__img {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .photo__lqip {
        filter: blur(16px) saturate(1.2);
        transform: scale(1.08); /* hide blur edge bleed */
        transition: opacity var(--t-med);
      }

      .photo__img {
        opacity: 0;
        transition: opacity var(--t-slow);
      }

      .photo.is-loaded .photo__img { opacity: 1; }
      .photo.is-loaded .photo__lqip { opacity: 0; }
    `,
  ],
})
export class PhotoComponent implements AfterViewInit {
  @Input({ required: true }) entry!: ManifestEntry;
  @Input({ required: true }) category!: CategorySlug | 'hero' | 'about';
  @Input() priority = false;
  /** Which tier to render in the grid. Default 'thumb' (gallery grid). */
  @Input() tier: Tier = 'thumb';
  /** The `sizes` hint. Callers know their own column widths. */
  @Input() sizes = '(max-width: 700px) 100vw, (max-width: 1200px) 50vw, 33vw';

  @ViewChild('img') imgRef!: ElementRef<HTMLImageElement>;

  loaded = false;
  private platformId = inject(PLATFORM_ID);

  get fallbackJpg(): string {
    return imageUrl(this.category, this.tier, this.entry.id, 'jpg');
  }

  /** Responsive srcset spanning thumb/medium/large — caller's `sizes` picks. */
  get srcsetWebp(): string {
    return this.buildSrcset('webp');
  }

  get srcsetJpg(): string {
    return this.buildSrcset('jpg');
  }

  private buildSrcset(ext: 'webp' | 'jpg'): string {
    const id = this.entry.id;
    const c = this.category;
    return [
      `${imageUrl(c, 'thumb', id, ext)} 600w`,
      `${imageUrl(c, 'medium', id, ext)} 1400w`,
      `${imageUrl(c, 'large', id, ext)} 2400w`,
    ].join(', ');
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    // Catch cached images that load before the handler attaches.
    const el = this.imgRef?.nativeElement;
    if (el?.complete && el.naturalWidth > 0) {
      this.loaded = true;
    }
  }

  onLoad(): void {
    this.loaded = true;
  }
}
