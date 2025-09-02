import { Component } from '@angular/core';
import { DialogModule } from "@angular/cdk/dialog";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Input } from '@angular/core';


@Component({
  selector: 'app-flight-details',
  imports: [DialogModule, CommonModule, FormsModule],
  templateUrl: './flight-details.component.html',
  styleUrl: './flight-details.component.css'
})
export class FlightDetailsComponent {
  @Input() supplier: string = '';
  entries: Array<{
    flightId: string;
    flightDateLocal: string;
    origin: string;
    destination: string;
    productType: string;
    uldQty: number | null;
  }> = [
    { flightId: '', flightDateLocal: '', origin: '', destination: '', productType: '', uldQty: null }
  ];

  @Input() availableProducts: Array<{ productName: string; totalQuantity: number }> = [];

  public get minFlightDateIso(): string {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
    return this.toLocalDatetimeLocalValue(tomorrow);
  }

  public onFlightDateChange(index: number): void {
    const entry = this.entries[index];
    if (!entry) { return; }
    if (entry.flightDateLocal && entry.flightDateLocal < this.minFlightDateIso) {
      entry.flightDateLocal = this.minFlightDateIso;
    }
  }

  public openFlightDatePicker(input: HTMLInputElement): void {
    if (typeof (input as any).showPicker === 'function') {
      (input as any).showPicker();
    } else {
      input.focus();
      input.click();
    }
  }

  public onFlightIdInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const sanitized = (input.value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    input.value = sanitized;
  }

  public onCityCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const letters = (input.value || '').replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 3);
    input.value = letters;
  }

  public addEntry(): void {
    this.entries.push({ flightId: '', flightDateLocal: '', origin: '', destination: '', productType: '', uldQty: null });
  }

  public removeEntry(index: number): void {
    if (this.entries.length === 1) { return; }
    this.entries.splice(index, 1);
  }

  public enforceQuantityBounds(index: number): void {
    const entry = this.entries[index];
    if (!entry) { return; }
    const maxQty = this.getMaxQtyForProduct(entry.productType);
    if (entry.uldQty == null) { return; }
    if (entry.uldQty < 1) { entry.uldQty = 1; }
    const currentAggregate = this.getAggregateForProduct(entry.productType, index);
    const remaining = maxQty != null ? Math.max(0, maxQty - currentAggregate) : null;
    if (remaining != null && entry.uldQty > remaining) {
      entry.uldQty = remaining;
    }
  }

  public onProductTypeChange(index: number): void {
    const entry = this.entries[index];
    if (!entry) { return; }
    // Reset qty to 1 and enforce bounds
    entry.uldQty = 1;
    this.enforceQuantityBounds(index);
  }

  public onQtyChange(index: number): void {
    this.enforceQuantityBounds(index);
  }

  private getMaxQtyForProduct(productName: string): number | null {
    const found = this.availableProducts.find(p => p.productName === productName);
    return found ? found.totalQuantity : null;
  }

  private getAggregateForProduct(productName: string, excludingIndex?: number): number {
    if (!productName) { return 0; }
    return this.entries.reduce((sum, e, idx) => {
      if (idx === excludingIndex) { return sum; }
      if (e.productType === productName && typeof e.uldQty === 'number') {
        return sum + (e.uldQty || 0);
      }
      return sum;
    }, 0);
  }

  private toLocalDatetimeLocalValue(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  }
}
