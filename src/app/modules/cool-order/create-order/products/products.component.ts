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

  public availableOptions: string[][] = [[]];
  public productCodeValid: boolean[] = [false];
  public quantityValid: boolean[] = [false];

  constructor() {}

  ngOnInit(): void {
    this.syncDerivedArraysToEntries();
    this.recomputeAllDerived();
  }

  public addEntry(): void {
    if (this.entries.length >= 5) {
      return;
    }
    this.entries.push({ selectedGroup: '', selectedProduct: '', productCode: '', quantity: null });
    this.syncDerivedArraysToEntries();
    this.recomputeEntryDerived(this.entries.length - 1);
    this.publishProducts();
  }

  public removeEntry(index: number): void {
    if (this.entries.length === 1) {
      return;
    }
    this.entries.splice(index, 1);
    this.availableOptions.splice(index, 1);
    this.productCodeValid.splice(index, 1);
    this.quantityValid.splice(index, 1);
    this.publishProducts();
  }

  public onGroupChange(index: number): void {
    const entry = this.entries[index];
    if (!entry) { return; }
    entry.selectedProduct = '';
    entry.productCode = '';
    this.availableOptions[index] = entry.selectedGroup ? (this.productsByGroup[entry.selectedGroup] ?? []) : [];
    this.productCodeValid[index] = false;
    this.publishProducts();
  }

  private recomputeEntryDerived(index: number): void {
    const entry = this.entries[index];
    if (!entry) { return; }
    // available options for select
    this.availableOptions[index] = entry.selectedGroup ? (this.productsByGroup[entry.selectedGroup] ?? []) : [];
    // product code validation
    if (!entry.selectedProduct || !entry.productCode) {
      this.productCodeValid[index] = false;
    } else {
      const lettersOnly = entry.selectedProduct.replace(/[^A-Za-z]/g, '');
      const expectedPrefix = lettersOnly.slice(0, 3).toUpperCase();
      const regex = new RegExp(`^${expectedPrefix}[0-9]{4}$`);
      this.productCodeValid[index] = regex.test(entry.productCode);
    }
    // quantity validation
    const value = entry.quantity;
    this.quantityValid[index] = typeof value === 'number' && value > 0 && value < 10;
  }

  private recomputeAllDerived(): void {
    for (let i = 0; i < this.entries.length; i++) {
      this.recomputeEntryDerived(i);
    }
  }

  private syncDerivedArraysToEntries(): void {
    const n = this.entries.length;
    while (this.availableOptions.length < n) { this.availableOptions.push([]); }
    while (this.productCodeValid.length < n) { this.productCodeValid.push(false); }
    while (this.quantityValid.length < n) { this.quantityValid.push(false); }
    this.availableOptions.length = n;
    this.productCodeValid.length = n;
    this.quantityValid.length = n;
  }

  public onQuantityChange(): void {
    this.recomputeAllDerived();
    this.publishProducts();
  }

  public onProductChange(): void {
    this.recomputeAllDerived();
    this.publishProducts();
  }

  public onProductCodeInput(index: number): void {
    this.recomputeEntryDerived(index);
  }

  public publishProducts(): void {
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

  public refreshDerivedState(): void {
    this.syncDerivedArraysToEntries();
    this.recomputeAllDerived();
  }
}
