import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostBinding,
  HostListener,
  PLATFORM_ID,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

/**
 * Desktop-only crosshair cursor that follows the mouse. Fades in when the
 * user hovers over elements marked `[data-viewfinder]` (gallery tiles,
 * category cards). Disabled on touch devices and reduced-motion users.
 */
@Component({
  selector: 'app-viewfinder-cursor',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div #cursor class="vfc" [class.is-active]="active()">
      <span class="vfc__frame"></span>
      <span class="vfc__dot"></span>
    </div>
  `,
  styles: [`
    :host { position: fixed; inset: 0; pointer-events: none; z-index: 999; }
    .vfc {
      position: fixed;
      top: 0;
      left: 0;
      width: 44px;
      height: 44px;
      transform: translate(-50%, -50%) scale(0.6);
      opacity: 0;
      transition: opacity var(--t-med), transform var(--t-med);
      mix-blend-mode: difference;
      will-change: transform, opacity;
    }
    .vfc.is-active {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
    .vfc__frame {
      position: absolute;
      inset: 0;
      border: 1px solid #fff;
      border-radius: 2px;
      box-shadow: inset 0 0 0 1px rgba(0,0,0,0.3);
    }
    .vfc__frame::before, .vfc__frame::after {
      content: '';
      position: absolute;
      background: #fff;
    }
    .vfc__frame::before {
      top: 50%; left: -6px; right: -6px;
      height: 1px; transform: translateY(-50%);
    }
    .vfc__frame::after {
      top: -6px; bottom: -6px; left: 50%;
      width: 1px; transform: translateX(-50%);
    }
    .vfc__dot {
      position: absolute;
      top: 50%; left: 50%;
      width: 3px; height: 3px;
      background: #fff;
      border-radius: 50%;
      transform: translate(-50%, -50%);
    }
    @media (hover: none) { :host { display: none; } }
    @media (prefers-reduced-motion: reduce) { :host { display: none; } }
  `],
})
export class ViewfinderCursorComponent implements AfterViewInit {
  @ViewChild('cursor') cursorRef!: ElementRef<HTMLElement>;
  active = signal(false);
  private platformId = inject(PLATFORM_ID);
  private rafId = 0;

  @HostListener('document:mousemove', ['$event'])
  onMove(e: MouseEvent): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const el = this.cursorRef?.nativeElement;
    if (!el) return;
    cancelAnimationFrame(this.rafId);
    this.rafId = requestAnimationFrame(() => {
      el.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%) ${this.active() ? 'scale(1)' : 'scale(0.6)'}`;
    });
    const target = e.target as HTMLElement | null;
    const onVf = !!target?.closest('[data-viewfinder]');
    if (onVf !== this.active()) this.active.set(onVf);
  }

  ngAfterViewInit(): void {
    // no-op — mousemove handler sets up all state
  }
}
