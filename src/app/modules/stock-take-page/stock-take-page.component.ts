import { Component } from '@angular/core';
import { StockTakeInfoComponent } from "./stock-take-info/stock-take-info.component";
import { AddUldComponent } from "./add-uld/add-uld.component";

@Component({
  selector: 'app-stock-take-page',
  imports: [StockTakeInfoComponent, AddUldComponent],
  templateUrl: './stock-take-page.component.html',
  styleUrl: './stock-take-page.component.css'
})
export class StockTakePageComponent {
  public nothing: string = "nothing Just Testing";
}
