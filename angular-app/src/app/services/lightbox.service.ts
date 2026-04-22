import { Injectable, signal } from '@angular/core';
import { ManifestEntry, CategorySlug } from '../shared/manifest.model';

export interface LightboxState {
  open: boolean;
  entries: ManifestEntry[];
  category: CategorySlug | 'hero' | 'about';
  index: number;
}

@Injectable({ providedIn: 'root' })
export class LightboxService {
  private readonly _state = signal<LightboxState>({
    open: false,
    entries: [],
    category: 'portraits',
    index: 0,
  });

  readonly state = this._state.asReadonly();

  open(entries: ManifestEntry[], category: CategorySlug | 'hero' | 'about', index: number): void {
    this._state.set({ open: true, entries, category, index });
    if (typeof document !== 'undefined') {
      document.documentElement.classList.add('is-lightbox-open');
      document.body.classList.add('is-lightbox-open');
    }
  }

  close(): void {
    this._state.update(s => ({ ...s, open: false }));
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('is-lightbox-open');
      document.body.classList.remove('is-lightbox-open');
    }
  }

  next(): void {
    this._state.update(s =>
      s.entries.length ? { ...s, index: (s.index + 1) % s.entries.length } : s,
    );
  }

  prev(): void {
    this._state.update(s =>
      s.entries.length
        ? { ...s, index: (s.index - 1 + s.entries.length) % s.entries.length }
        : s,
    );
  }

  goto(index: number): void {
    this._state.update(s => ({ ...s, index }));
  }
}
