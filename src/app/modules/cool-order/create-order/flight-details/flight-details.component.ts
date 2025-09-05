import { Component } from '@angular/core';
import { DialogModule } from "@angular/cdk/dialog";
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Input } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormControl } from '@angular/forms';


@Component({
  selector: 'app-flight-details',
  imports: [DialogModule, CommonModule, FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatDatepickerModule, MatNativeDateModule],
  templateUrl: './flight-details.component.html',
  styleUrl: './flight-details.component.css'
})
export class FlightDetailsComponent {
  @Input() supplier: string = '';
  @Input() awbOrg: string = '';
  @Input() awbDest: string = '';
  public minFlightDateIso: string = this.toLocalDatetimeLocalValue(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 1, 0, 0, 0, 0));
  public entries: Array<{
    flightId: string;
    flightDateLocal: string;
    origin: string;
    destination: string;
    productType: string;
    uldQty: number | null;
    flightDateControl: FormControl;
  }> = [
    { flightId: '', flightDateLocal: '', origin: '', destination: '', productType: '', uldQty: null, flightDateControl: new FormControl(null) }
  ];

  @Input() availableProducts: Array<{ productName: string; totalQuantity: number }> = [];

  // Derived info combining product quantities with AWB Org/Dest
  public productAwbInfo: Array<{ productName: string; totalQuantity: number; awbOrg: string; awbDest: string }> = [];

  public onFlightDateChange(index: number): void {
    const entry = this.entries[index];
    if (!entry) { return; }
    const dateValue = entry.flightDateControl.value;
    if (dateValue) {
      entry.flightDateLocal = this.toLocalDatetimeLocalValue(dateValue);
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
    // Re-apply bounds across all rows when origin/destination changes
    // to ensure origin+product aggregates never exceed product totals.
    for (let i = 0; i < this.entries.length; i++) {
      this.enforceQuantityBounds(i);
    }
  }

  public addEntry(): void {
    this.entries.push({ flightId: '', flightDateLocal: '', origin: '', destination: '', productType: '', uldQty: null, flightDateControl: new FormControl(null) });
  }

  public removeEntry(index: number): void {
    if (this.entries.length === 1) { return; }
    this.entries.splice(index, 1);
  }

  public copyEntry(index: number): void {
    const e = this.entries[index];
    if (!e) { return; }
    this.entries.splice(index + 1, 0, { ...e, flightDateControl: new FormControl(e.flightDateControl.value) });
  }

  // (old enforceQuantityBounds replaced below with a new implementation)

  public onProductTypeChange(index: number): void {
    const entry = this.entries[index];
    if (!entry) { return; }
    entry.uldQty = 1;
    this.enforceQuantityBounds(index);
  }

  public onQtyChange(index: number): void {
    this.enforceQuantityBounds(index);
  }

  private getProductTotalQuantity(productName: string): number | null {
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

  // Aggregate helpers per node
  private getAggregateForOriginProduct(productName: string, origin: string, excludingIndex?: number): number {
    if (!productName || !origin) { return 0; }
    const target = (origin || '').toUpperCase();
    return this.entries.reduce((sum, e, idx) => {
      if (idx === excludingIndex) { return sum; }
      if (e.productType === productName && (e.origin || '').toUpperCase() === target && typeof e.uldQty === 'number') {
        return sum + (e.uldQty || 0);
      }
      return sum;
    }, 0);
  }

  private getAggregateForDestinationProduct(productName: string, destination: string, excludingIndex?: number): number {
    if (!productName || !destination) { return 0; }
    const target = (destination || '').toUpperCase();
    return this.entries.reduce((sum, e, idx) => {
      if (idx === excludingIndex) { return sum; }
      if (e.productType === productName && (e.destination || '').toUpperCase() === target && typeof e.uldQty === 'number') {
        return sum + (e.uldQty || 0);
      }
      return sum;
    }, 0);
  }

  // Compute remaining capacity for an entry based on rules
  private getRemainingForEntry(index: number): number | null {
    const entry = this.entries[index];
    if (!entry || !entry.productType) { return null; }
    const total = this.getProductTotalQuantity(entry.productType);
    if (total == null) { return null; }
    const constraints: number[] = [];
    // Global constraint: For same Origin+Product across all rows, sum must not exceed product total
    if (entry.origin) {
      const usedAtOrigin = this.getAggregateForOriginProduct(entry.productType, entry.origin, index);
      constraints.push(Math.max(0, total - usedAtOrigin));
    }
    // AWB Org bound across all entries
    if ((this.awbOrg || '') && (entry.origin || '').toUpperCase() === (this.awbOrg || '').toUpperCase()) {
      const usedFromAwbOrg = this.getAggregateForOriginProduct(entry.productType, this.awbOrg, index);
      constraints.push(Math.max(0, total - usedFromAwbOrg));
    }
    // AWB Dest inbound bound across all entries
    if ((this.awbDest || '') && (entry.destination || '').toUpperCase() === (this.awbDest || '').toUpperCase()) {
      const receivedAtAwbDest = this.getAggregateForDestinationProduct(entry.productType, this.awbDest, index);
      constraints.push(Math.max(0, total - receivedAtAwbDest));
    }
    if (!constraints.length) { return null; }
    return Math.min(...constraints);
  }

  // Public helpers for parent validations
  public hasAtLeastOneOriginAwbOrg(): boolean {
    const org = (this.awbOrg || '').toUpperCase();
    return !!org && this.entries.some(e => (e.origin || '').toUpperCase() === org);
  }

  public hasAtLeastOneDestinationAwbDest(): boolean {
    const dest = (this.awbDest || '').toUpperCase();
    return !!dest && this.entries.some(e => (e.destination || '').toUpperCase() === dest);
  }

  public areOrgAllocationsEqual(): boolean {
    // For each product, total leaving AWB Org must equal product total
    const org = (this.awbOrg || '').toUpperCase();
    if (!org) { return true; }
    const products = new Set<string>(this.availableProducts.map(p => p.productName));
    for (const product of Array.from(products)) {
      const total = this.getProductTotalQuantity(product);
      if (total == null) { continue; }
      const sum = this.getAggregateForOriginProduct(product, org);
      if (sum !== total) { return false; }
    }
    return true;
  }

  public areDestAllocationsEqual(): boolean {
    // For each product, total arriving at AWB Dest must equal product total
    const dest = (this.awbDest || '').toUpperCase();
    if (!dest) { return true; }
    const products = new Set<string>(this.availableProducts.map(p => p.productName));
    for (const product of Array.from(products)) {
      const total = this.getProductTotalQuantity(product);
      if (total == null) { continue; }
      const sum = this.getAggregateForDestinationProduct(product, dest);
      if (sum !== total) { return false; }
    }
    return true;
  }

  // Full network flow validation: AWB Org supplies exactly totals, AWB Dest receives exactly totals, intermediates conserve flow
  public validateAllProductFlows(): { ok: boolean; errors: string[] } {
    const errors: string[] = [];
    const org = (this.awbOrg || '').toUpperCase();
    const dest = (this.awbDest || '').toUpperCase();
    const products = new Set<string>(this.availableProducts.map(p => p.productName));
    for (const product of Array.from(products)) {
      const total = this.getProductTotalQuantity(product);
      if (total == null) { continue; }
      // Build node balances
      const balance = new Map<string, number>();
      const add = (k: string, v: number) => balance.set(k, (balance.get(k) || 0) + v);
      for (const e of this.entries) {
        if (e.productType !== product || typeof e.uldQty !== 'number') { continue; }
        const o = (e.origin || '').toUpperCase();
        const d = (e.destination || '').toUpperCase();
        add(o, -(e.uldQty || 0));
        add(d, +(e.uldQty || 0));
      }
      const orgBal = balance.get(org) || 0;
      const destBal = balance.get(dest) || 0;
      if (org && orgBal !== -total) {
        errors.push(`${product}: Total leaving AWB Org (${org}) must equal ${total}`);
      }
      if (dest && destBal !== total) {
        errors.push(`${product}: Total arriving at AWB Dest (${dest}) must equal ${total}`);
      }
      // Intermediates should net to 0
      for (const [node, bal] of Array.from(balance.entries())) {
        if (node === org || node === dest) { continue; }
        if (bal !== 0) {
          errors.push(`${product}: Node ${node} must not have leftover (${bal})`);
        }
      }
    }
    return { ok: errors.length === 0, errors };
  }

  public get disableAdd(): boolean {
    const org = (this.awbOrg || '').toUpperCase();
    const dest = (this.awbDest || '').toUpperCase();
    if (!org || !dest) { return false; }
    return this.entries.some(e => (e.origin || '').toUpperCase() === org && (e.destination || '').toUpperCase() === dest);
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

  ngOnChanges(): void {
    this.productAwbInfo = (this.availableProducts || []).map(p => ({ productName: p.productName, totalQuantity: p.totalQuantity, awbOrg: this.awbOrg || '', awbDest: this.awbDest || '' }));
  }

  // Adjust quantity bounds based on new per-key constraints
  public enforceQuantityBounds(index: number): void {
    const entry = this.entries[index];
    if (!entry) { return; }
    if (entry.uldQty == null) { return; }
    if (entry.uldQty < 1) { entry.uldQty = 1; }
    const remaining = this.getRemainingForEntry(index);
    if (remaining != null && entry.uldQty > remaining) {
      entry.uldQty = remaining;
    }
  }
}
