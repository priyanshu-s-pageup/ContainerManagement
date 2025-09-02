import { StockTakePageComponent } from './modules/stock-take-page/stock-take-page.component';
import { CreateOrderComponent } from './modules/cool-order/create-order/create-order.component';
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'stock-take', pathMatch: 'full' },
  { path: 'stock-take', component: StockTakePageComponent},
  { path: 'create-order', component: CreateOrderComponent},
];
