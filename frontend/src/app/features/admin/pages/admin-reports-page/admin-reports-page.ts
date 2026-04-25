import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin';

@Component({
  selector: 'app-admin-reports-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-reports-page.html'
})
export class AdminReportsPage implements OnInit {
  reports = signal<any[]>([]);
  selectedStore = signal<any | null>(null);
  filters = signal<any>({ from: '', to: '', sortBy: 'revenue' });
  isLoading = signal(true);
  errorMessage = signal('');

  totals = computed(() => {
    const reports = this.reports();
    return {
      revenue: reports.reduce((sum, item) => sum + Number(item.revenue || 0), 0),
      orders: reports.reduce((sum, item) => sum + Number(item.orderCount || 0), 0),
      products: reports.reduce((sum, item) => sum + Number(item.productCount || 0), 0),
      reviews: reports.reduce((sum, item) => sum + Number(item.reviewCount || 0), 0)
    };
  });

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.loadReports();
  }

  loadReports() {
    this.isLoading.set(true);
    this.adminService.getStoreReports(this.filters()).subscribe({
      next: reports => {
        this.reports.set(reports ?? []);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Could not load store reports.');
        this.isLoading.set(false);
      }
    });
  }

  updateFilter(field: string, value: string) {
    this.filters.update(filters => ({ ...filters, [field]: value }));
  }
}
