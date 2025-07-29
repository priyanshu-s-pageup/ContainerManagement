import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { StockTakePageComponent } from './modules/stock-take-page/stock-take-page.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, StockTakePageComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  // title = 'ContainerManagement';
}
