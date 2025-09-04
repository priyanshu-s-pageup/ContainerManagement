import { Component, ViewEncapsulation } from '@angular/core';
import { Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { FormControl, FormGroupDirective, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ErrorStateMatcher, provideNativeDateAdapter, MAT_DATE_LOCALE, MAT_DATE_FORMATS, DateAdapter, NativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';

class InstantErrorStateMatcher implements ErrorStateMatcher {
  // Show error if control is invalid and either dirty, touched, or form submitted
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = !!form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

@Component({
  selector: 'app-order-details',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatDatepickerModule, MatSelectModule],
  templateUrl: './order-details.component.html',
  styleUrl: './order-details.component.css',
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'en-GB' },
    { provide: MAT_DATE_FORMATS, useValue: {
      parse: { dateInput: { day: '2-digit', month: '2-digit', year: '2-digit' } },
      display: {
        dateInput: { day: '2-digit', month: '2-digit', year: '2-digit' },
        monthYearLabel: { month: 'short', year: 'numeric' },
        dateA11yLabel: { day: '2-digit', month: 'long', year: 'numeric' },
        monthYearA11yLabel: { month: 'long', year: 'numeric' }
      }
    } }
  ],
  encapsulation: ViewEncapsulation.None

})
export class OrderDetailsComponent {
  @Input() supplier: string = '';
  // AWB inputs
  onAwbPrefixInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digitsOnly = (input.value || '').replace(/\D/g, '').slice(0, 3);
    input.value = digitsOnly;
    this.awbPrefix = digitsOnly;
  }

  onAwbSuffixInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digitsOnly = (input.value || '').replace(/\D/g, '').slice(0, 6);
    input.value = digitsOnly;
    this.awbSuffix = digitsOnly;
  }

  // Lease dates
  plannedLeaseStart: string = ''; // ISO-like local string for datetime-local
  plannedLeaseEnd: string = '';
  utcStartInput: string = '';
  utcEndInput: string = '';
  bookedRentalDays: number | null = null;
  // Reactive form controls for Material error handling
  awbOrgControl = new FormControl('', [Validators.required, Validators.pattern(/^[A-Za-z]{3}$/)]);
  awbDestControl = new FormControl('', [Validators.required, Validators.pattern(/^[A-Za-z]{3}$/)]);
  pickupPortControl = new FormControl('', [Validators.required, Validators.pattern(/^[A-Za-z]{3}$/)]);
  returnPortControl = new FormControl('', [Validators.required, Validators.pattern(/^[A-Za-z]{3}$/)]);
  bookedRentalDaysControl = new FormControl<number | null>(null, [Validators.required, Validators.min(1)]);
  // Datepicker controls (local and UTC serialized)
  leaseStartControl = new FormControl<Date | null>(null, [Validators.required]);
  leaseEndControl = new FormControl<Date | null>(null, [Validators.required]);
  utcStartDateControl = new FormControl<string | null>(null);
  utcEndDateControl = new FormControl<string | null>(null);
  // Backing strings for legacy template-driven bindings used elsewhere
  awbPrefix: string = '020';
  awbSuffix: string = '';
  awbOrg: string = '';
  awbDest: string = '';
  pickupPort: string = '';
  returnPort: string = '';
  pickupLocation: string = '';
  errorStateMatcher = new InstantErrorStateMatcher();

  constructor() {
    // Keep end date within allowed range when start date or booked days change
    this.leaseStartControl.valueChanges.subscribe(() => {
      this.syncUtcFromLocalStart();
      this.clampLeaseEndWithinRange();
    });
    this.bookedRentalDaysControl.valueChanges.subscribe(() => {
      this.clampLeaseEndWithinRange();
    });
    this.leaseEndControl.valueChanges.subscribe(() => {
      this.syncUtcFromLocalEnd();
    });
  }

  // Constraints (local timezone for native date adapter)
  get minStartDate(): Date {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
    return tomorrow;
  }

  get minEndDate(): Date | null {
    return this.leaseStartControl.value ? this.startOfDay(this.leaseStartControl.value) : null;
  }

  get maxEndDate(): Date | null {
    const start = this.leaseStartControl.value ? this.startOfDay(this.leaseStartControl.value) : null;
    const days = this.bookedRentalDaysControl.value || 0;
    if (!start || !days || days <= 0) { return null; }
    const max = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
    return max;
  }

  leaseStartFilter = (d: Date | null) => {
    if (!d) { return true; }
    return this.startOfDay(d).getTime() >= this.minStartDate.getTime();
  };

  leaseEndFilter = (d: Date | null) => {
    if (!d) { return true; }
    const day = this.startOfDay(d).getTime();
    const min = this.minEndDate ? this.minEndDate.getTime() : -Infinity;
    const max = this.maxEndDate ? this.maxEndDate.getTime() : Infinity;
    return day >= min && day <= max;
  };

  private startOfDay(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  }

  private clampLeaseEndWithinRange(): void {
    const min = this.minEndDate;
    const max = this.maxEndDate;
    const end = this.leaseEndControl.value;
    if (!end) { return; }
    let clamped = this.startOfDay(end);
    if (min && clamped.getTime() < min.getTime()) { clamped = min; }
    if (max && clamped.getTime() > max.getTime()) { clamped = max; }
    if (clamped.getTime() !== this.startOfDay(end).getTime()) {
      this.leaseEndControl.setValue(clamped);
      this.syncUtcFromLocalEnd();
    }
  }

  private syncUtcFromLocalStart(): void {
    const start = this.leaseStartControl.value ? this.startOfDay(this.leaseStartControl.value) : null;
    this.utcStartDateControl.setValue(start ? new Date(Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())).toISOString() : null);
  }

  private syncUtcFromLocalEnd(): void {
    const end = this.leaseEndControl.value ? this.startOfDay(this.leaseEndControl.value) : null;
    this.utcEndDateControl.setValue(end ? new Date(Date.UTC(end.getFullYear(), end.getMonth(), end.getDate())).toISOString() : null);
  }

  get minStartIso(): string {
    const now = new Date();
    // Tomorrow 00:00 local
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
    return this.toLocalDatetimeLocalValue(tomorrow);
  }

  private getMinStartUtc(): Date {
    const now = new Date();
    // Compute tomorrow 00:00 in UTC
    const y = now.getUTCFullYear();
    const m = now.getUTCMonth();
    const d = now.getUTCDate() + 1;
    return new Date(Date.UTC(y, m, d, 0, 0, 0, 0));
  }

  get minEndIso(): string {
    if (!this.plannedLeaseStart) { return ''; }
    return this.plannedLeaseStart;
  }

  get maxEndIso(): string {
    if (!this.plannedLeaseStart || !this.bookedRentalDays || this.bookedRentalDays <= 0) {
      return '';
    }
    const start = this.parseLocalDatetimeLocalValue(this.plannedLeaseStart);
    const endMax = new Date(start.getTime() + this.bookedRentalDays * 24 * 60 * 60 * 1000);
    return this.toLocalDatetimeLocalValue(endMax);
  }

  onStartChange(): void {
    // Enforce min for manual input on local start
    if (this.plannedLeaseStart && this.plannedLeaseStart < this.minStartIso) {
      this.plannedLeaseStart = this.minStartIso;
    }
    const startDate = this.plannedLeaseStart ? this.parseLocalDatetimeLocalValue(this.plannedLeaseStart) : null;
    this.utcStartInput = startDate ? this.toUtcInputString(startDate) : '';
    // Reset end if outside range
    if (this.plannedLeaseEnd) {
      if (this.minEndIso && this.plannedLeaseEnd < this.minEndIso) {
        this.plannedLeaseEnd = this.minEndIso;
      }
      const max = this.maxEndIso;
      if (max && this.plannedLeaseEnd > max) {
        this.plannedLeaseEnd = max;
      }
    }
    this.onEndChange();
  }

  onEndChange(): void {
    // Enforce range for manual input on local end
    if (this.plannedLeaseEnd) {
      const min = this.minEndIso;
      const max = this.maxEndIso;
      if (min && this.plannedLeaseEnd < min) {
        this.plannedLeaseEnd = min;
      }
      if (max && this.plannedLeaseEnd > max) {
        this.plannedLeaseEnd = max;
      }
    }
    const endDate = this.plannedLeaseEnd ? this.parseLocalDatetimeLocalValue(this.plannedLeaseEnd) : null;
    this.utcEndInput = endDate ? this.toUtcInputString(endDate) : '';
  }

  onBookedDaysChange(): void {
    // Coerce to 1+ integer, cap reasonably
    if (this.bookedRentalDays !== null) {
      const normalized = Math.max(1, Math.floor(this.bookedRentalDays));
      this.bookedRentalDays = normalized;
    }
    // Adjust end within new range
    if (this.plannedLeaseEnd) {
      const max = this.maxEndIso;
      if (max && this.plannedLeaseEnd > max) {
        this.plannedLeaseEnd = max;
        this.onEndChange();
      }
    }
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

  private parseLocalDatetimeLocalValue(v: string): Date {
    // v in format yyyy-MM-ddTHH:mm interpreted as local time
    const [datePart, timePart] = v.split('T');
    const [y, m, d] = datePart.split('-').map(Number);
    const [hh, mi] = (timePart || '00:00').split(':').map(Number);
    return new Date(y, (m - 1), d, hh, mi, 0, 0);
  }

  private toUtcInputString(d: Date): string {
    // Represent date as UTC ISO without seconds, e.g., 2025-01-02T15:30Z
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}Z`;
  }

  private parseUtcInputString(v: string): Date | null {
    if (!v) { return null; }
    // Accept formats: YYYY-MM-DDTHH:mmZ or YYYY-MM-DD HH:mm (assumed UTC)
    const s = v.trim().replace(' ', 'T');
    const match = s.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(Z)?$/);
    if (!match) { return null; }
    const [, ys, ms, ds, hs, mis] = match;
    const y = Number(ys), m = Number(ms) - 1, d = Number(ds), h = Number(hs), mi = Number(mis);
    const msSinceEpoch = Date.UTC(y, m, d, h, mi, 0, 0);
    return new Date(msSinceEpoch);
  }

  // Three-letter code enforcement
  onCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const letters = (input.value || '').replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 3);
    input.value = letters;
  }

  // Three-letter enforcement for Reactive FormControls
  onCodeControlInput(control: FormControl, event: Event): void {
    const input = event.target as HTMLInputElement;
    const letters = (input.value || '').replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 3);
    // Update both the DOM input and the control to keep them in sync
    if (input.value !== letters) {
      input.value = letters;
    }
    if (control.value !== letters) {
      control.setValue(letters, { emitEvent: true });
    }
  }

  // Allow setting dates from UTC inputs
  onUtcStartChange(): void {
    let date = this.parseUtcInputString(this.utcStartInput);
    if (!date) { return; }
    // Enforce UTC min
    const minUtc = this.getMinStartUtc();
    if (date.getTime() < minUtc.getTime()) {
      date = minUtc;
      this.utcStartInput = this.toUtcInputString(date);
    }
    // Convert to local datetime-local string
    const local = this.toLocalDatetimeLocalValue(date);
    this.plannedLeaseStart = local;
    this.onStartChange();
  }

  onUtcEndChange(): void {
    let date = this.parseUtcInputString(this.utcEndInput);
    if (!date) { return; }
    // Enforce UTC range relative to start and booked days
    const startUtc = this.plannedLeaseStart ? this.parseLocalDatetimeLocalValue(this.plannedLeaseStart) : null;
    if (startUtc) {
      const minUtc = startUtc; // start as baseline
      const maxUtc = this.bookedRentalDays && this.bookedRentalDays > 0
        ? new Date(startUtc.getTime() + this.bookedRentalDays * 24 * 60 * 60 * 1000)
        : null;
      if (date.getTime() < minUtc.getTime()) {
        date = minUtc;
      }
      if (maxUtc && date.getTime() > maxUtc.getTime()) {
        date = maxUtc;
      }
      this.utcEndInput = this.toUtcInputString(date);
    }
    const local = this.toLocalDatetimeLocalValue(date);
    this.plannedLeaseEnd = local;
    this.onEndChange();
  }

  // Open native pickers via icon
  openStartPicker(input: HTMLInputElement): void {
    if (typeof (input as any).showPicker === 'function') {
      (input as any).showPicker();
    } else {
      input.focus();
      input.click();
    }
  }

  openEndPicker(input: HTMLInputElement): void {
    if (typeof (input as any).showPicker === 'function') {
      (input as any).showPicker();
    } else {
      input.focus();
      input.click();
    }
  }

  // UTC pickers
  openUtcStartPicker(input: HTMLInputElement): void {
    if (typeof (input as any).showPicker === 'function') {
      (input as any).showPicker();
    } else {
      input.focus();
      input.click();
    }
  }

  openUtcEndPicker(input: HTMLInputElement): void {
    if (typeof (input as any).showPicker === 'function') {
      (input as any).showPicker();
    } else {
      input.focus();
      input.click();
    }
  }

  onUtcStartPickerChange(value: string): void {
    let date = this.parseLocalPickerAsUtc(value);
    if (!date) { return; }
    const minUtc = this.getMinStartUtc();
    if (date.getTime() < minUtc.getTime()) {
      date = minUtc;
    }
    this.utcStartInput = this.toUtcInputString(date);
    this.plannedLeaseStart = this.toLocalDatetimeLocalValue(date);
    this.onStartChange();
  }

  onUtcEndPickerChange(value: string): void {
    let date = this.parseLocalPickerAsUtc(value);
    if (!date) { return; }
    const startUtc = this.plannedLeaseStart ? this.parseLocalDatetimeLocalValue(this.plannedLeaseStart) : null;
    if (startUtc) {
      const minUtc = startUtc;
      const maxUtc = this.bookedRentalDays && this.bookedRentalDays > 0
        ? new Date(startUtc.getTime() + this.bookedRentalDays * 24 * 60 * 60 * 1000)
        : null;
      if (date.getTime() < minUtc.getTime()) {
        date = minUtc;
      }
      if (maxUtc && date.getTime() > maxUtc.getTime()) {
        date = maxUtc;
      }
    }
    this.utcEndInput = this.toUtcInputString(date);
    this.plannedLeaseEnd = this.toLocalDatetimeLocalValue(date);
    this.onEndChange();
  }

  private parseLocalPickerAsUtc(v: string): Date | null {
    if (!v) { return null; }
    const [datePart, timePart] = v.split('T');
    if (!datePart || !timePart) { return null; }
    const [y, m, d] = datePart.split('-').map(Number);
    const [hh, mi] = timePart.split(':').map(Number);
    const msSinceEpoch = Date.UTC(y, m - 1, d, hh, mi, 0, 0);
    return new Date(msSinceEpoch);
  }
}
