import { StockTakePageComponent } from './modules/stock-take-page/stock-take-page.component';
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'stock-take', pathMatch: 'full' },
  { path: 'app-stock-take-page', component: StockTakePageComponent},
];
