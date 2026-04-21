import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderService } from '../../../../core/services/order';
import { ShipmentService } from '../../../../core/services/shipment';

@Component({
  selector: 'app-order-detail-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-detail-page.html',
  styleUrl: './order-detail-page.scss'
})
export class OrderDetailPage implements OnInit {
  order = signal<any>(null);
  shipment = signal<any>(null);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string>('');

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    private shipmentService: ShipmentService
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
        this.loadShipment(id);
      },
      error: () => {
        this.errorMessage.set('Could not load order from API. Showing demo data.');
        this.isLoading.set(false);

        // Fallback demo data matching backend DTO fields
        this.order.set({
          id: id,
          status: 'Shipped',
          grandTotal: 299.00,
          createdAt: '2025-05-04T14:30:00Z',
          storeName: 'Active Lifestyle',
          userName: 'John Doe',
          items: [
            { id: 1, name: 'Smart Fitness Watch', quantity: 2, price: 149.50 }
          ]
        });
        this.shipment.set({
           id: 101,
           warehouseBlock: 'A',
           modeOfShipment: 'Flight',
           customerCareCalls: 2,
           status: 'In Transit',
           discountOffered: 10
        });
      }
    });
  }

  loadShipment(id: number) {
    this.shipmentService.getShipmentByOrderId(id).subscribe({
      next: (response: any) => {
        this.shipment.set(response);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  goBack() {
    this.router.navigate(['/orders']);
  }
}
