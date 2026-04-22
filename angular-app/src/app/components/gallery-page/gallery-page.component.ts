import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MasonryGalleryComponent } from '../masonry-gallery/masonry-gallery.component';
import { ManifestService } from '../../services/manifest.service';
import { CATEGORIES, CategoryMeta, CategorySlug, ManifestEntry } from '../../shared/manifest.model';

/**
 * One component handles every category route. The `data: { slug }` on each
 * route tells us which manifest + meta to render. Saves ~600 lines of
 * duplicated HTML/CSS/TS from the previous per-category components.
 */
@Component({
  selector: 'app-gallery-page',
  standalone: true,
  imports: [CommonModule, MasonryGalleryComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './gallery-page.component.html',
  styleUrl: './gallery-page.component.css',
})
export class GalleryPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private manifests = inject(ManifestService);

  meta = signal<CategoryMeta | undefined>(undefined);
  entries = signal<ManifestEntry[]>([]);

  count = computed(() => this.entries().length);

  ngOnInit(): void {
    // Grab slug from route data (static) or params (dynamic). We use static
    // route data so the slug is known without string parsing.
    this.route.data.subscribe(data => {
      const slug = data['slug'] as CategorySlug;
      const meta = CATEGORIES.find(c => c.slug === slug);
      this.meta.set(meta);
      this.entries.set(this.manifests.get(slug));
    });
  }
}
