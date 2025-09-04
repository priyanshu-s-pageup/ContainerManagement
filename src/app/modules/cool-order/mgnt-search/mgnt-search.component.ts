import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { ViewChild } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';


@Component({
  selector: 'app-mgnt-search',
  imports: [CommonModule, FormsModule, MatDatepickerModule, MatInputModule, MatSelectModule, MatIconModule, MatButtonModule, MatTableModule, MatSortModule, MatChipsModule, MatTooltipModule],
  templateUrl: './mgnt-search.component.html',
  styleUrl: './mgnt-search.component.css'
})
export class MgntSearchComponent {

  status = 'In Progress';
  searchText = '';
  dateType = '';
  orders: any[] = [];

  public publishedList: any[] = [];
  public savedDraftList: any[] = [];

  public dataSource = new MatTableDataSource<any>([]);
  public columnsToDisplay: string[] = [
    'orderId', 'awb', 'supplier', 'product', 'origin', 'destination',
    'customerSOL', 'customerEOL', 'orderStatus', 'lastUpdated', 'createdAt', 'actions'
  ];

  @ViewChild(MatSort) sort!: MatSort;

  constructor(private router: Router) {
    // Reload data whenever we navigate back to this route
    this.router.events.subscribe(evt => {
      if (evt instanceof NavigationEnd && evt.urlAfterRedirects.includes('mgnt-search')) {
        this.reloadFromStorage();
      }
    });
  }

  ngOnInit(): void {
    this.reloadFromStorage();

    // Note: data comes from localStorage

    // Update table with all published and saved drafts is part of reloadFromStorage
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
  }

  private loadPublishedDrafts(): void {
    try {
      const raw = localStorage.getItem('publishedDrafts');
      this.publishedList = raw ? JSON.parse(raw) : [];
    } catch {
      this.publishedList = [];
    }
  }

  private savePublishedDrafts(): void {
    try {
      localStorage.setItem('publishedDrafts', JSON.stringify(this.publishedList));
    } catch {}
  }

  private reloadFromStorage(): void {
    this.loadPublishedDrafts();
    this.loadSavedDrafts();
    this.updateTableFromLists();
  }

  private loadSavedDrafts(): void {
    try {
      const raw = localStorage.getItem('orderDrafts');
      const parsed = raw ? JSON.parse(raw) : [];
      this.savedDraftList = Array.isArray(parsed) ? parsed : (parsed ? [parsed] : []);
    } catch {
      this.savedDraftList = [];
    }
  }

  private updateTableFromLists(): void {
    // Deduplicate drafts by AWB; keep the latest createdAt
    const dedupeByAwb = (list: any[]) => {
      const map = new Map<string, any>();
      for (const d of list || []) {
        const key = `${d?.orderDetails?.awbPrefix || ''}-${d?.orderDetails?.awbSuffix || ''}`;
        const existing = map.get(key);
        if (!existing) { map.set(key, d); }
        else {
          const a = new Date(existing.createdAt || 0).getTime();
          const b = new Date(d.createdAt || 0).getTime();
          if (b >= a) { map.set(key, d); }
        }
      }
      return Array.from(map.values());
    };
    const publishedUnique = dedupeByAwb(this.publishedList);
    const draftsUnique = dedupeByAwb(this.savedDraftList);
    const toRow = (d: any, status: string, idx: number) => {
      const awb = `${d.orderDetails?.awbPrefix || ''}-${d.orderDetails?.awbSuffix || ''}`;
      const firstProduct = (d.products?.[0]?.selectedProduct) || '';
      const firstQty = (d.products?.[0]?.quantity) || '';
      const qtyProduct = firstProduct ? `${firstQty} / ${firstProduct}` : '';
      const firstFlight = (d.flights?.[0]) || {};
      const formatDateTime = (isoLike: any) => {
        if (!isoLike) { return ''; }
        try {
          const date = typeof isoLike === 'string' || typeof isoLike === 'number' ? new Date(isoLike) : isoLike;
          return date.toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        } catch { return ''; }
      };
      const sol = d.orderDetails?.utcStart || d.orderDetails?.leaseStart || null;
      const eol = d.orderDetails?.utcEnd || d.orderDetails?.leaseEnd || null;
      return {
        orderId: awb || d.id || `DRAFT-${idx+1}`,
        awb,
        supplier: d.supplier || '',
        qtyProduct,
        origin: d.orderDetails?.awbOrg || firstFlight.origin || '',
        destination: d.orderDetails?.awbDest || firstFlight.destination || '',
        customerSOL: formatDateTime(sol),
        customerEOL: formatDateTime(eol),
        orderStatus: status,
        lastUpdated: new Date(d.lastUpdated || d.createdAt || Date.now()).toLocaleString(),
        createdAt: new Date(d.createdAt || Date.now()).toLocaleString(),
        cr: false,
        __raw: d
      } as any;
    };
    // Sort newest first by createdAt for both lists
    const byCreatedDesc = (a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    const publishedRows = (publishedUnique || []).slice().sort(byCreatedDesc).map((d, idx) => toRow(d, 'New', idx));
    const draftRows = (draftsUnique || []).slice().sort(byCreatedDesc).map((d, idx) => toRow(d, 'Draft', idx));
    this.orders = [...publishedRows, ...draftRows];
    this.dataSource.data = this.orders;
  }

  applyFilters(): void {
    const text = (this.searchText || '').toLowerCase().trim();
    const statusSel = this.status || '';
    const filtered = this.orders.filter(row => {
      const matchesStatus = !statusSel
        ? true
        : (statusSel === 'Completed' ? row.orderStatus === 'Completed' : row.orderStatus !== 'Completed');
      if (!matchesStatus) { return false; }
      if (!text) { return true; }
      const hay = [row.orderId, row.awb, row.supplier, row.qtyProduct, row.origin, row.destination, row.customerSQL, row.customerEOL]
        .join(' ').toLowerCase();
      return hay.includes(text);
    });
    this.dataSource.data = filtered;
  }

  onEdit(row: any): void {
    const draft = row?.__raw;
    if (!draft) { return; }
    this.router.navigateByUrl('/create-order', { state: { editMode: true, draft } });
  }

  onView(row: any): void {
    const draft = row?.__raw;
    this.router.navigateByUrl('/create-order', { state: { editMode: false, viewOnly: true, draft } });
  }


}
