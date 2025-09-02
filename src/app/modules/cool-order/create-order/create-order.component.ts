import { Component } from '@angular/core';
import { OrderDetailsComponent } from './order-details/order-details.component';
import { ProductsComponent } from './products/products.component';
import { FlightDetailsComponent } from './flight-details/flight-details.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-create-order',
  imports: [
    OrderDetailsComponent,
    ProductsComponent,
    FlightDetailsComponent,
    CommonModule,
    FormsModule
  ],
  templateUrl: './create-order.component.html',
  styleUrl: './create-order.component.css'
})
export class CreateOrderComponent {
  productsSummary: Array<{ productName: string; totalQuantity: number }> = [];
  orderType: string = '';
  supplier: string = '';

  handleProductsChange(summary: Array<{ productName: string; totalQuantity: number }>): void {
    this.productsSummary = summary;
  }
}
