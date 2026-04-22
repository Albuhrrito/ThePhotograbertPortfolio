import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PhotoComponent } from '../photo/photo.component';
import { ManifestService } from '../../services/manifest.service';
import { ManifestEntry } from '../../shared/manifest.model';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink, PhotoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './about.component.html',
  styleUrl: './about.component.css',
})
export class AboutComponent {
  private manifests = inject(ManifestService);
  portrait?: ManifestEntry = this.manifests.featured('about');
}
