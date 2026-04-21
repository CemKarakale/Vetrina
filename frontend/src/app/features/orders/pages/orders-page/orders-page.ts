import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { OrderService } from '../../../../core/services/order';
import { SearchService } from '../../../../core/services/search';

@Component({
  selector: 'app-orders-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './orders-page.html',
  styleUrl: './orders-page.scss'
})
export class OrdersPage implements OnInit {
  orders = signal<any[]>([]);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string>('');

  // Filtered list based on search term
  filteredOrders = computed(() => {
    const term = this.searchService.searchTerm();
    const list = this.orders();
    if (!term) return list;
    return list.filter(o =>
      o.id?.toString().includes(term) ||
      o.status?.toLowerCase().includes(term) ||
      o.storeName?.toLowerCase().includes(term)
    );
  });

  constructor(
    private orderService: OrderService,
    private searchService: SearchService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.orderService.getOrders().subscribe({
      next: (response: any) => {
        this.orders.set(response ?? []);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Could not load orders from API. Showing demo data.');
        this.isLoading.set(false);

        // Fallback demo data matching backend DTO fields
        this.orders.set([
          { id: 10425, status: 'Delivered', grandTotal: 120.50, createdAt: '2025-05-01', storeName: 'Tech Haven' },
          { id: 10426, status: 'Processing', grandTotal: 89.99, createdAt: '2025-05-03', storeName: 'Comfort Seating' },
          { id: 10427, status: 'Shipped', grandTotal: 299.00, createdAt: '2025-05-04', storeName: 'Active Lifestyle' },
          { id: 10428, status: 'Cancelled', grandTotal: 14.50, createdAt: '2025-05-05', storeName: 'EcoWear' },
          { id: 10429, status: 'Pending', grandTotal: 1045.00, createdAt: '2025-05-06', storeName: 'Home Essentials' }
        ]);
      }
    });
  }

  goToDetails(id: number) {
    this.router.navigate(['/orders', id]);
  }
}