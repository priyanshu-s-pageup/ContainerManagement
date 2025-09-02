import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventEmitter, Output } from '@angular/core';
import { Input } from '@angular/core';

@Component({
  selector: 'app-products',
  imports: [CommonModule, FormsModule],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css'
})
export class ProductsComponent {
  @Input() supplier: string = '';
  @Output() productsChange = new EventEmitter<Array<{ productName: string; totalQuantity: number }>>();
  groups: string[] = ['Coolers', 'MRIs', 'Lathe', 'Pumps'];

  productsByGroup: Record<string, string[]> = {
    Coolers: ['ArcticCool', 'BreezeMax', 'CoolPro', 'FrostLine', 'ThermoFlow'],
    MRIs: ['MagniScan', 'NeuroView', 'QuantumMRI', 'SpectraMag', 'UltraMag'],
    Lathe: ['PrecisionTurn', 'MetalMaster', 'ProLathe', 'SpinCraft', 'TurboTurn'],
    Pumps: ['HydroJet', 'AquaFlow', 'MegaPump', 'FlowMaster', 'PulsePump']
  };

  entries: Array<{
    selectedGroup: string;
    selectedProduct: string;
    productCode: string;
    quantity: number | null;
  }> = [
    { selectedGroup: '', selectedProduct: '', productCode: '', quantity: null }
  ];

  constructor() {}

  addEntry(): void {
    if (this.entries.length >= 5) {
      return;
    }
    this.entries.push({ selectedGroup: '', selectedProduct: '', productCode: '', quantity: null });
    this.publishProducts();
  }

  removeEntry(index: number): void {
    if (this.entries.length === 1) {
      return;
    }
    this.entries.splice(index, 1);
    this.publishProducts();
  }

  onGroupChange(index: number): void {
    const entry = this.entries[index];
    if (!entry) { return; }
    entry.selectedProduct = '';
    entry.productCode = '';
    this.publishProducts();
  }

  availableProducts(index: number): string[] {
    const group = this.entries[index]?.selectedGroup;
    return group ? this.productsByGroup[group] ?? [] : [];
  }

  isProductCodeValid(index: number): boolean {
    const entry = this.entries[index];
    if (!entry || !entry.selectedProduct || !entry.productCode) {
      return false;
    }
    const lettersOnly = entry.selectedProduct.replace(/[^A-Za-z]/g, '');
    const expectedPrefix = lettersOnly.slice(0, 3).toUpperCase();
    const regex = new RegExp(`^${expectedPrefix}[0-9]{4}$`);
    return regex.test(entry.productCode);
  }

  isQuantityValid(index: number): boolean {
    const value = this.entries[index]?.quantity;
    if (value === null || value === undefined) {
      return false;
    }
    return value > 0 && value < 10;
  }

  onQuantityChange(): void {
    this.publishProducts();
  }

  onProductChange(): void {
    this.publishProducts();
  }

  private publishProducts(): void {
    const productToQty = new Map<string, number>();
    for (const e of this.entries) {
      if (!e.selectedProduct) { continue; }
      const qty = typeof e.quantity === 'number' ? e.quantity : 0;
      if (qty <= 0) { continue; }
      productToQty.set(e.selectedProduct, (productToQty.get(e.selectedProduct) || 0) + qty);
    }
    const list = Array.from(productToQty.entries()).map(([productName, totalQuantity]) => ({ productName, totalQuantity }));
    this.productsChange.emit(list);
  }
}
