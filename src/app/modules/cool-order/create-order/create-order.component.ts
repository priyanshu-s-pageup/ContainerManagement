import { Component, ViewChild } from '@angular/core';
import { OrderDetailsComponent } from './order-details/order-details.component';
import { ProductsComponent } from './products/products.component';
import { FlightDetailsComponent } from './flight-details/flight-details.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { ConfirmSheetComponent } from './confirm-sheet.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create-order',
  imports: [
    OrderDetailsComponent,
    ProductsComponent,
    FlightDetailsComponent,
    CommonModule,
    FormsModule,
    MatBottomSheetModule,
    MatSnackBarModule,
    MatButtonModule
  ],
  templateUrl: './create-order.component.html',
  styleUrl: './create-order.component.css'
})
export class CreateOrderComponent {
  @ViewChild('orderDetailsRef') orderDetailsRef?: any;
  @ViewChild('productsRef') productsRef?: any;
  @ViewChild('flightDetailsRef') flightDetailsRef?: any;
  productsSummary: Array<{ productName: string; totalQuantity: number }> = [];
  orderType: string = '';
  supplier: string = '';
  // token used to force subtree remount for a full reset
  resetToken: number = Date.now();
  resetFlag: boolean = true;
  lastResetAt: string = '';

  // naive in-memory drafts store
  drafts: Array<any> = [];
  // id for the in-progress draft (regenerated on page refresh/reset)
  currentDraftId: string = '';

  // edit mode flags/data
  editMode: boolean = false;
  originalDraft: any = null;
  viewOnly: boolean = false;

  handleProductsChange(summary: Array<{ productName: string; totalQuantity: number }>): void {
    this.productsSummary = summary;
  }

  constructor(private bottomSheet: MatBottomSheet, private snackBar: MatSnackBar, private router: Router) {}

  onRefresh(): void {
    const message = this.editMode ? 'Discard all changes and revert to original?' : 'All entered data will be cleared.';
    const ref = this.bottomSheet.open(ConfirmSheetComponent, { data: { title: 'Reset form?', message } });
    ref.afterDismissed().subscribe((confirmed: boolean) => {
      if (!confirmed) { return; }
      if (this.editMode && this.originalDraft) {
        // Reapply original draft data
        this.applyDraftToUi(this.originalDraft);
        this.snackBar.open('Changes discarded', 'OK', { duration: 2000 });
      } else {
        // reset parent fields
        this.orderType = '';
        this.supplier = '';
        this.productsSummary = [];
        // clear drafts
        this.drafts = [];
        try { localStorage.removeItem('orderDrafts'); } catch {}
        // assign a new draft id for the next input session
        this.currentDraftId = this.generateRandomId();
        // force child components to remount by toggling flag
        this.resetFlag = false;
        setTimeout(() => { this.resetFlag = true; });
        this.lastResetAt = new Date().toLocaleTimeString();
        this.snackBar.open('Form reset', 'OK', { duration: 2000 });
      }
    });
    console.log(this.drafts);
  }

  onSaveDraft(): void {
    const validation = this.validateBeforeSave();
    if (!validation.valid) {
      this.snackBar.open(validation.message || 'Please complete required fields before saving.', 'OK', { duration: 3000 });
      return;
    }
    const ref = this.bottomSheet.open(ConfirmSheetComponent, { data: { title: 'Save draft?', message: 'You can continue editing later.' } });
    ref.afterDismissed().subscribe((confirmed: boolean) => {
      if (!confirmed) { return; }
      // Collect structured snapshot from children and parent
      const od: any = this.orderDetailsRef;
      const newId = this.generateRandomId();
      const draft = {
        id: this.editMode && this.originalDraft?.id ? this.originalDraft.id : newId,
        createdAt: this.editMode && this.originalDraft?.createdAt ? this.originalDraft.createdAt : new Date().toISOString(),
        orderType: this.orderType,
        supplier: this.supplier,
        orderDetails: od ? {
          awbPrefix: od.awbPrefix,
          awbSuffix: od.awbSuffix,
          awbOrg: od.awbOrgControl?.value ?? '',
          awbDest: od.awbDestControl?.value ?? '',
          pickupPort: od.pickupPortControl?.value ?? '',
          returnPort: od.returnPortControl?.value ?? '',
          pickupLocation: od.pickupLocation ?? '',
          bookedRentalDays: od.bookedRentalDaysControl?.value ?? null,
          leaseStart: od.leaseStartControl?.value ?? null,
          leaseEnd: od.leaseEndControl?.value ?? null,
          utcStart: od.utcStartDateControl?.value ?? null,
          utcEnd: od.utcEndDateControl?.value ?? null,
        } : null,
        products: this.productsRef?.entries ?? [],
        flights: this.flightDetailsRef?.entries ?? []
      };
      this.drafts = [draft];
      console.log(this.drafts);
      try {
        // Persist saved draft list; upsert by AWB (and id if present)
        const rawExisting = localStorage.getItem('orderDrafts');
        const existing = rawExisting ? JSON.parse(rawExisting) : [];
        const arr = Array.isArray(existing) ? existing : (existing ? [existing] : []);
        const awbPrefix = draft?.orderDetails?.awbPrefix || '';
        const awbSuffix = draft?.orderDetails?.awbSuffix || '';
        const isSameAwb = (d: any) => (d?.orderDetails?.awbPrefix || '') === awbPrefix && (d?.orderDetails?.awbSuffix || '') === awbSuffix;
        let idx = -1;
        // Prefer match by id if editing
        if (this.editMode && draft.id) {
          idx = arr.findIndex((d: any) => d?.id === draft.id);
        }
        // Fallback to match by AWB
        if (idx < 0) {
          idx = arr.findIndex((d: any) => isSameAwb(d));
        }
        if (idx >= 0) { arr[idx] = draft; } else { arr.push(draft); }
        localStorage.setItem('orderDrafts', JSON.stringify(arr));
      } catch {}
      if (this.editMode) {
        // Merge into publishedDrafts for immediate persistence in search table
        try {
          const raw = localStorage.getItem('publishedDrafts');
          const list = raw ? JSON.parse(raw) : [];
          const idx = Array.isArray(list) ? list.findIndex((d: any) => d?.id === draft.id) : -1;
          if (idx >= 0) { list[idx] = { ...draft, lastUpdated: new Date().toISOString() }; }
          else { list.push({ ...draft, lastUpdated: new Date().toISOString() }); }
          localStorage.setItem('publishedDrafts', JSON.stringify(list));
        } catch {}
        this.snackBar.open('Changes saved', 'OK', { duration: 2000 });
      } else {
        this.snackBar.open('Draft saved', 'OK', { duration: 2000 });
      }
      // Prepare a fresh id for the next save-as-new-draft flow when not editing
      if (!this.editMode) {
        this.currentDraftId = this.generateRandomId();
      }
    });
  }

  private validateBeforeSave(): { valid: boolean; message?: string } {
    const od: any = this.orderDetailsRef;
    const missing: string[] = [];
    if (!this.orderType) { missing.push('Order Type'); }
    if (!this.supplier) { missing.push('Supplier'); }

    // Order Details required controls
    if (od) {
      if (!od.awbOrgControl?.value) { missing.push('AWB Org'); }
      if (!od.awbDestControl?.value) { missing.push('AWB Dest'); }
      if (!od.pickupPortControl?.value) { missing.push('Pickup Port'); }
      if (!od.returnPortControl?.value) { missing.push('Return Port'); }
      if (!od.bookedRentalDaysControl?.value || od.bookedRentalDaysControl?.value <= 0) { missing.push('Booked Rental Days'); }
      if (!od.leaseStartControl?.value) { missing.push('Planned Lease Start'); }
      if (!od.leaseEndControl?.value) { missing.push('Planned Lease End'); }
    }

    // At least one valid product (name + qty>0)
    const productsEntries: any[] = this.productsRef?.entries ?? [];
    const hasValidProduct = productsEntries.some(e => e?.selectedProduct && typeof e?.quantity === 'number' && e.quantity > 0);
    if (!hasValidProduct) { missing.push('At least one Product with quantity'); }

    // At least one valid flight entry
    const flightEntries: any[] = this.flightDetailsRef?.entries ?? [];
    const hasValidFlight = flightEntries.some(e => e?.flightId && e?.flightDateLocal && e?.origin && e?.destination && e?.productType && typeof e?.uldQty === 'number' && e.uldQty > 0);
    if (!hasValidFlight) { missing.push('At least one Flight with all fields'); }

    if (missing.length) {
      return { valid: false, message: `Please complete: ${missing.join(', ')}` };
    }
    return { valid: true };
  }

  ngOnInit(): void {
    // hydrate drafts from localStorage
    try {
      const raw = localStorage.getItem('orderDrafts');
      this.drafts = raw ? JSON.parse(raw) : [];
    } catch { this.drafts = []; }
    const incoming: any = (history?.state as any) || {};
    this.editMode = !!incoming?.editMode && !incoming?.viewOnly;
    this.viewOnly = !!incoming?.viewOnly;
    const draft = incoming?.draft;
    if (this.editMode && draft) {
      this.originalDraft = draft;
      // Use the incoming draft id as current working id
      this.currentDraftId = draft.id || this.generateRandomId();
      // Parent fields immediately; children will be patched after view init
      this.orderType = draft?.orderType || '';
      this.supplier = draft?.supplier || '';
    } else {
      // generate a fresh id for the new input session
      this.currentDraftId = this.generateRandomId();
    }
  }

  ngAfterViewInit(): void {
    if ((this.editMode || this.viewOnly) && this.originalDraft) {
      // Ensure child ViewChilds exist before patching
      setTimeout(() => this.applyDraftToUi(this.originalDraft));
    }
  }

  onPublish(): void {
    if (!this.drafts.length) {
      this.snackBar.open('Nothing to publish. Save a draft first.', 'OK', { duration: 2500 });
      return;
    }
    // Move current drafts into publishedDrafts and clear orderDrafts
    try {
      const raw = localStorage.getItem('publishedDrafts');
      const list = raw ? JSON.parse(raw) : [];
      const incoming = this.drafts.map(d => ({ ...d, lastUpdated: new Date().toISOString() }));
      // Upsert by id
      for (const d of incoming) {
        const idx = Array.isArray(list) ? list.findIndex((x: any) => x?.id === d.id) : -1;
        if (idx >= 0) { list[idx] = d; } else { list.push(d); }
      }
      localStorage.setItem('publishedDrafts', JSON.stringify(list));
      localStorage.removeItem('orderDrafts');
    } catch {}
    // Clear current working draft data and start a new id
    this.drafts = [];
    this.currentDraftId = this.generateRandomId();
    this.snackBar.open('Draft published', 'OK', { duration: 1200 });
  }

  private generateRandomId(): string {
    const ts = Date.now().toString();
    const rand = Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0');
    return `${ts}${rand}`; // numeric-only id
  }

  private applyDraftToUi(draft: any): void {
    // Parent fields (ensure set)
    this.orderType = draft?.orderType || this.orderType || '';
    this.supplier = draft?.supplier || this.supplier || '';
    // Child components may not be ready synchronously; guard with ViewChild checks
    const od: any = this.orderDetailsRef;
    if (od && draft?.orderDetails) {
      od.awbPrefix = draft.orderDetails.awbPrefix || od.awbPrefix || '';
      od.awbSuffix = draft.orderDetails.awbSuffix || '';
      od.awbOrgControl?.setValue(draft.orderDetails.awbOrg || '');
      od.awbDestControl?.setValue(draft.orderDetails.awbDest || '');
      od.pickupPortControl?.setValue(draft.orderDetails.pickupPort || '');
      od.returnPortControl?.setValue(draft.orderDetails.returnPort || '');
      od.pickupLocation = draft.orderDetails.pickupLocation || '';
      od.bookedRentalDaysControl?.setValue(draft.orderDetails.bookedRentalDays ?? null);
      // Dates
      if (draft.orderDetails.leaseStart) { od.leaseStartControl?.setValue(new Date(draft.orderDetails.leaseStart)); }
      if (draft.orderDetails.leaseEnd) { od.leaseEndControl?.setValue(new Date(draft.orderDetails.leaseEnd)); }
      od.utcStartDateControl?.setValue(draft.orderDetails.utcStart || null);
      od.utcEndDateControl?.setValue(draft.orderDetails.utcEnd || null);
    }
    const pr = this.productsRef;
    if (pr && Array.isArray(draft?.products)) {
      pr.entries = draft.products.map((p: any) => ({
        selectedGroup: p.selectedGroup || '',
        selectedProduct: p.selectedProduct || '',
        productCode: p.productCode || '',
        quantity: p.quantity ?? null
      }));
      if (!pr.entries.length) { pr.entries = [{ selectedGroup: '', selectedProduct: '', productCode: '', quantity: null }]; }
      // Recompute options/validation and emit summary for flights
      if (typeof pr.refreshDerivedState === 'function') { pr.refreshDerivedState(); }
      if (typeof pr.publishProducts === 'function') { pr.publishProducts(); }
      // Compute productsSummary directly for safety
      const map = new Map<string, number>();
      for (const e of pr.entries) {
        if (!e.selectedProduct || typeof e.quantity !== 'number' || e.quantity <= 0) { continue; }
        map.set(e.selectedProduct, (map.get(e.selectedProduct) || 0) + e.quantity);
      }
      this.productsSummary = Array.from(map.entries()).map(([productName, totalQuantity]) => ({ productName, totalQuantity }));
    }
    const fl = this.flightDetailsRef;
    if (fl && Array.isArray(draft?.flights)) {
      fl.entries = draft.flights.map((f: any) => ({
        flightId: f.flightId || '',
        flightDateLocal: f.flightDateLocal || '',
        origin: f.origin || '',
        destination: f.destination || '',
        productType: f.productType || '',
        uldQty: f.uldQty ?? null
      }));
      if (!fl.entries.length) { fl.entries = [{ flightId: '', flightDateLocal: '', origin: '', destination: '', productType: '', uldQty: null }]; }
    }
  }
}
