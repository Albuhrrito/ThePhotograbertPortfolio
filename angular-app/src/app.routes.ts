import { Routes } from '@angular/router';
import { HomeComponent } from './app/components/home/home.component';
import { PortraitsComponent } from './app/components/portraits/portraits.component';
import { ProductsComponent } from './app/components/products/products.component';
import { StreetComponent } from './app/components/street/street.component';
import { LandscapeComponent } from './app/components/landscape/landscape.component';
import { GraduationComponent } from './app/components/graduation/graduation.component';
import { AestheticsComponent } from './app/components/aesthetics/aesthetics.component';
import { ContactComponent } from './app/components/contact/contact.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'portraits', component: PortraitsComponent },
  { path: 'products', component: ProductsComponent },
  { path: 'street', component: StreetComponent },
  { path: 'landscape', component: LandscapeComponent },
  { path: 'graduation', component: GraduationComponent },
  { path: 'aesthetics', component: AestheticsComponent },
  { path: 'contact', component: ContactComponent },
];
