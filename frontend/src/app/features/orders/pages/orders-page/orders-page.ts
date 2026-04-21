import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { OrderService } from '../../../../core/services/order';

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

  constructor(
    private orderService: OrderService,
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

        // Fallback for demo purposes
        this.orders.set([
          { id: 10425, status: 'Delivered', total: 120.50, date: '2025-05-01', storeName: 'Tech Haven', paymentInfo: 'Credit Card ending in 4242', shipmentInfo: 'FedEx Express (Tracking: FX123456789)' },
          { id: 10426, status: 'Processing', total: 89.99, date: '2025-05-03', storeName: 'Comfort Seating', paymentInfo: 'PayPal', shipmentInfo: 'UPS Ground (Pending)' },
          { id: 10427, status: 'Shipped', total: 299.00, date: '2025-05-04', storeName: 'Active Lifestyle', paymentInfo: 'Apple Pay', shipmentInfo: 'USPS Priority (Tracking: 9400111222333444)' },
          { id: 10428, status: 'Cancelled', total: 14.50, date: '2025-05-05', storeName: 'EcoWear', paymentInfo: 'Refunded to Visa', shipmentInfo: 'N/A' },
          { id: 10429, status: 'Pending', total: 1045.00, date: '2025-05-06', storeName: 'Home Essentials', paymentInfo: 'Bank Transfer (Pending)', shipmentInfo: 'Awaiting Fulfillment' }
        ]);
      }
    });
  }

  goToDetails(id: number) {
    this.router.navigate(['/orders', id]);
  }
}