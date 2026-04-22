import { Routes } from '@angular/router';
import { HomeComponent } from './app/components/home/home.component';
import { GalleryPageComponent } from './app/components/gallery-page/gallery-page.component';
import { AboutComponent } from './app/components/about/about.component';
import { ContactComponent } from './app/components/contact/contact.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, title: 'The Photograbert — Albert Youssef' },

  { path: 'portraits',  component: GalleryPageComponent, data: { slug: 'portraits'  }, title: 'Portraits — The Photograbert' },
  { path: 'modeling',   component: GalleryPageComponent, data: { slug: 'modeling'   }, title: 'Modeling — The Photograbert' },
  { path: 'sports',     component: GalleryPageComponent, data: { slug: 'sports'     }, title: 'Sports — The Photograbert' },
  { path: 'street',     component: GalleryPageComponent, data: { slug: 'street'     }, title: 'Street — The Photograbert' },
  { path: 'products',   component: GalleryPageComponent, data: { slug: 'products'   }, title: 'Products — The Photograbert' },
  { path: 'graduation', component: GalleryPageComponent, data: { slug: 'graduation' }, title: 'Graduation — The Photograbert' },
  { path: 'aesthetics', component: GalleryPageComponent, data: { slug: 'aesthetics' }, title: 'Aesthetics — The Photograbert' },

  { path: 'about',   component: AboutComponent,   title: 'About — The Photograbert' },
  { path: 'contact', component: ContactComponent, title: 'Contact — The Photograbert' },

  { path: '**', redirectTo: '' },
];
