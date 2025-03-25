import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './app/components/home/home.component';
import { PortraitsComponent } from './app/components/portraits/portraits.component';
import { ProductsComponent } from './app/components/products/products.component';
import { StreetComponent } from './app/components/street/street.component';
import { ExtraComponent } from './app/components/extra/extra.component';
import { ContactComponent } from './app/components/contact/contact.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'portraits', component: PortraitsComponent },
  { path: 'products', component: ProductsComponent },
  { path: 'street', component: StreetComponent },
  { path: 'extra', component: ExtraComponent },
  { path: 'contact', component: ContactComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
