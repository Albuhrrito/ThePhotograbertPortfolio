import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { LightboxService } from '../../services/lightbox.service';
import { imageUrl } from '../../shared/image-url';
import { ExifInfo } from '../../shared/manifest.model';

/**
 * <app-lightbox> — one instance mounted at app root.
 *
 *   Progressive loading: LQIP → medium (fast-appear) → large (crisp) → full
 *   only when user zooms. Keyboard: ←/→ to navigate, Esc to close, `+`/`-` to
 *   zoom, `0` to reset. Mouse: click to close, scroll to zoom, drag to pan
 *   when zoomed. Touch: pinch-to-zoom, swipe to navigate, double-tap to zoom.
 */
@Component({
  selector: 'app-lightbox',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './lightbox.component.html',
  styleUrl: './lightbox.component.css',
})
export class LightboxComponent implements AfterViewInit, OnDestroy {
  private lb = inject(LightboxService);
  private platformId = inject(PLATFORM_ID);
  private host = inject(ElementRef<HTMLElement>);
  private wheelCleanup?: () => void;

  state = this.lb.state;

  // Zoom + pan state
  zoom = signal(1);
  tx = signal(0);
  ty = signal(0);

  // Progressive source state — controls whether we upgrade to 'full'.
  upgradedToFull = signal(false);

  // Preloaded url of the next-tier image so we can swap cleanly
  currentLargeUrl = computed(() => {
    const s = this.state();
    if (!s.entries.length) return '';
    const entry = s.entries[s.index];
    return imageUrl(s.category, 'large', entry.id, 'webp');
  });

  currentLargeUrlJpg = computed(() => {
    const s = this.state();
    if (!s.entries.length) return '';
    const entry = s.entries[s.index];
    return imageUrl(s.category, 'large', entry.id, 'jpg');
  });

  currentFullUrl = computed(() => {
    const s = this.state();
    if (!s.entries.length) return '';
    const entry = s.entries[s.index];
    return imageUrl(s.category, 'full', entry.id, 'webp');
  });

  currentFullUrlJpg = computed(() => {
    const s = this.state();
    if (!s.entries.length) return '';
    const entry = s.entries[s.index];
    return imageUrl(s.category, 'full', entry.id, 'jpg');
  });

  currentEntry = computed(() => {
    const s = this.state();
    return s.entries[s.index];
  });

  // Whenever the slide changes, reset zoom/pan/full-tier upgrade.
  constructor() {
    effect(() => {
      // Track changes to index to reset interaction state.
      const s = this.state();
      // Side-effects don't belong in computed() — use effect().
      void s.index; // subscribe to index
      this.resetZoom();
      this.upgradedToFull.set(false);
    });
  }

  transform = computed(() => {
    return `translate3d(${this.tx()}px, ${this.ty()}px, 0) scale(${this.zoom()})`;
  });

  resetZoom(): void {
    this.zoom.set(1);
    this.tx.set(0);
    this.ty.set(0);
  }

  zoomIn(cx = 0, cy = 0): void {
    const current = this.zoom();
    const next = Math.min(current * 1.5, 4);
    this.zoom.set(next);
    if (next > 2 && !this.upgradedToFull()) this.upgradedToFull.set(true);
  }

  zoomOut(): void {
    const next = Math.max(this.zoom() / 1.5, 1);
    this.zoom.set(next);
    if (next === 1) {
      this.tx.set(0);
      this.ty.set(0);
    }
  }

  close(): void {
    this.lb.close();
  }

  next(): void {
    this.lb.next();
  }

  prev(): void {
    this.lb.prev();
  }

  // Keyboard
  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    if (!this.state().open) return;
    switch (e.key) {
      case 'Escape': this.close(); break;
      case 'ArrowRight': this.next(); break;
      case 'ArrowLeft': this.prev(); break;
      case '+':
      case '=': this.zoomIn(); break;
      case '-': this.zoomOut(); break;
      case '0': this.resetZoom(); break;
    }
  }

  // Wheel listener attached manually as passive — Angular's (wheel) binding
  // defaults to non-passive which triggers Chrome's scroll-blocking warning.
  // Body scroll is already locked via `is-lightbox-open`, so we don't need
  // preventDefault here.
  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const el = this.host.nativeElement;
    const handler = (e: WheelEvent) => {
      if (!this.state().open) return;
      if (e.deltaY < 0) this.zoomIn();
      else this.zoomOut();
    };
    el.addEventListener('wheel', handler, { passive: true });
    this.wheelCleanup = () => el.removeEventListener('wheel', handler);
  }

  ngOnDestroy(): void {
    this.wheelCleanup?.();
  }

  // --- Pointer (click-to-zoom + drag-pan + swipe-nav + pinch) ----------------
  //
  // Interaction model:
  //   • Single pointer, no drag          → click: toggle zoom (1× ↔ 2.5×)
  //   • Single pointer, drag while zoom>1 → pan
  //   • Single pointer, drag while zoom=1 → swipe to prev/next
  //   • Two pointers                     → pinch zoom
  //
  // The close behavior is X button + Esc only (no backdrop click).

  private pointers = new Map<number, { startX: number; startY: number; curX: number; curY: number; moved: boolean }>();
  private startTx = 0;
  private startTy = 0;
  private startDist = 0;
  private startZoom = 1;
  private static readonly DRAG_THRESHOLD = 4;
  private static readonly SWIPE_THRESHOLD = 80;
  private static readonly CLICK_ZOOM_LEVEL = 2.5;

  onPointerDown(e: PointerEvent): void {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    this.pointers.set(e.pointerId, {
      startX: e.clientX, startY: e.clientY,
      curX: e.clientX,   curY: e.clientY,
      moved: false,
    });
    this.startTx = this.tx();
    this.startTy = this.ty();

    if (this.pointers.size === 2) {
      const [a, b] = [...this.pointers.values()];
      this.startDist = Math.hypot(b.curX - a.curX, b.curY - a.curY);
      this.startZoom = this.zoom();
    }
  }

  onPointerMove(e: PointerEvent): void {
    const p = this.pointers.get(e.pointerId);
    if (!p) return;
    p.curX = e.clientX;
    p.curY = e.clientY;

    // Pinch (two pointers active)
    if (this.pointers.size === 2) {
      const [a, b] = [...this.pointers.values()];
      const dist = Math.hypot(b.curX - a.curX, b.curY - a.curY);
      if (this.startDist > 0) {
        const ratio = dist / this.startDist;
        const next = Math.min(4, Math.max(1, this.startZoom * ratio));
        this.zoom.set(next);
        if (next > 2 && !this.upgradedToFull()) this.upgradedToFull.set(true);
      }
      return;
    }

    // Single pointer
    const dx = p.curX - p.startX;
    const dy = p.curY - p.startY;
    if (!p.moved && (Math.abs(dx) > LightboxComponent.DRAG_THRESHOLD ||
                     Math.abs(dy) > LightboxComponent.DRAG_THRESHOLD)) {
      p.moved = true;
    }
    if (!p.moved) return;

    if (this.zoom() > 1) {
      // drag-pan (absolute from start, no jitter)
      this.tx.set(this.startTx + dx);
      this.ty.set(this.startTy + dy);
    } else {
      // swipe indicator — reduced follow so release feels springy
      this.tx.set(dx * 0.35);
      this.ty.set(0);
    }
  }

  onPointerUp(e: PointerEvent): void {
    const p = this.pointers.get(e.pointerId);
    this.pointers.delete(e.pointerId);
    if (this.pointers.size < 2) this.startDist = 0;
    if (!p) return;

    const wasSinglePointer = this.pointers.size === 0;

    // Single, no-drag → click: toggle zoom
    if (wasSinglePointer && !p.moved) {
      if (this.zoom() > 1) {
        this.resetZoom();
      } else {
        this.zoom.set(LightboxComponent.CLICK_ZOOM_LEVEL);
        if (LightboxComponent.CLICK_ZOOM_LEVEL > 2 && !this.upgradedToFull()) {
          this.upgradedToFull.set(true);
        }
      }
      return;
    }

    // Single, drag while unzoomed → swipe to navigate
    if (wasSinglePointer && this.zoom() === 1) {
      if (this.tx() > LightboxComponent.SWIPE_THRESHOLD)       { this.prev(); this.resetZoom(); }
      else if (this.tx() < -LightboxComponent.SWIPE_THRESHOLD) { this.next(); this.resetZoom(); }
      else { this.tx.set(0); this.ty.set(0); }
    }
    // Single, drag while zoomed → pan already applied in move, nothing to do
  }

  // EXIF helper — render only populated fields as `LABEL value` tokens.
  exifTokens(exif: ExifInfo): { label: string; value: string }[] {
    const rows: { label: string; value: string | number | undefined }[] = [
      { label: 'Camera', value: exif.camera },
      { label: 'Lens',   value: exif.lens },
      { label: 'ƒ',      value: exif.aperture },
      { label: 'Shutter', value: exif.shutter },
      { label: 'ISO',    value: exif.iso },
      { label: 'Focal',  value: exif.focal },
      { label: 'Date',   value: exif.date },
    ];
    return rows
      .filter(r => r.value !== undefined && r.value !== null && r.value !== '')
      .map(r => ({ label: r.label, value: String(r.value) }));
  }
}
