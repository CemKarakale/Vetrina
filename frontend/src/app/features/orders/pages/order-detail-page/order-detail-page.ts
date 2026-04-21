import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderService } from '../../../../core/services/order';

@Component({
  selector: 'app-order-detail-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-detail-page.html',
  styleUrl: './order-detail-page.scss'
})
export class OrderDetailPage implements OnInit {
  order = signal<any>(null);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string>('');

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService
  ) {}

  ngOnInit() {
    this.loadOrder();
  }

  loadOrder() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.orderService.getOrderById(id).subscribe({
      next: (response: any) => {
        this.order.set(response);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Could not load order from API. Showing demo data.');
        this.isLoading.set(false);
        
        // Mock fallback detailed order to match required fields
        this.order.set({
          id: id,
          status: 'Shipped',
          total: 299.00,
          date: '2025-05-04T14:30:00Z',
          storeName: 'Active Lifestyle',
          paymentInfo: 'Apple Pay',
          shipmentInfo: 'USPS Priority (Tracking: 9400111222333444)',
          customerName: 'John Doe',
          customerEmail: 'john.doe@example.com',
          shippingAddress: '123 E-Commerce St, Suite 400, Tech City, CA 90210',
          items: [
            { id: 1, name: 'Smart Fitness Watch', quantity: 2, price: 149.50 }
          ]
        });
      }
    });
  }

  goBack() {
    this.router.navigate(['/orders']);
  }
}
