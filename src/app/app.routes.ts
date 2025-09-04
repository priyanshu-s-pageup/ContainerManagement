import { StockTakePageComponent } from './modules/stock-take-page/stock-take-page.component';
import { CreateOrderComponent } from './modules/cool-order/create-order/create-order.component';
import { Routes } from '@angular/router';
import { MgntSearchComponent } from './modules/cool-order/mgnt-search/mgnt-search.component';

export const routes: Routes = [
  { path: '', redirectTo: 'stock-take', pathMatch: 'full' },
  { path: 'stock-take', component: StockTakePageComponent},
  { path: 'create-order', component: CreateOrderComponent},
  { path: 'mgnt-search', component: MgntSearchComponent},
];
