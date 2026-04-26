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
  isCancelling = signal<boolean>(false);

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

  cancelOrder() {
    const order = this.order();
    if (!order || !this.canCancelOrder(order) || this.isCancelling()) return;

    const confirmed = window.confirm(`Cancel order #${order.id}?`);
    if (!confirmed) return;

    this.isCancelling.set(true);
    this.errorMessage.set('');
    this.orderService.updateOrderStatus(order.id, 'CANCELLED').subscribe({
      next: (updated: any) => {
        this.order.update((current: any) => ({ ...current, ...updated, status: 'CANCELLED' }));
        this.shipment.update((current: any) => current ? { ...current, status: 'CANCELLED' } : current);
        this.isCancelling.set(false);
      },
      error: () => {
        this.errorMessage.set('Could not cancel this order. It may already be in fulfillment.');
        this.isCancelling.set(false);
      }
    });
  }

  canCancelOrder(order: any): boolean {
    const status = this.normalizeStatus(order?.status);
    return status === 'PENDING' || status === 'CONFIRMED' || status === 'PROCESSING';
  }

  getItemName(item: any): string {
    return item?.productName || item?.name || item?.itemName || item?.product?.name || `Item #${item?.id ?? ''}`.trim();
  }

  getItemTotal(item: any): number {
    return Number(item?.price ?? item?.unitPrice ?? item?.product?.unitPrice ?? 0);
  }

  getStatusLabel(status: string): string {
    return this.normalizeStatus(status).replace('_', ' ').toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
  }

  normalizeStatus(status: string): string {
    return String(status || '').toUpperCase();
  }
}
