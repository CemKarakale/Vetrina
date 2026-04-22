import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { OrderService } from '../../../../core/services/order';
import { ShipmentService } from '../../../../core/services/shipment';
import { SearchService } from '../../../../core/services/search';

@Component({
  selector: 'app-orders-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './orders-page.html',
  styleUrl: './orders-page.scss'
})
export class OrdersPage implements OnInit {
  orders = signal<any[]>([]);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string>('');
  expandedOrderId = signal<number | null>(null);

  filterStatus = signal<string>('');
  filterDateFrom = signal<string>('');
  filterDateTo = signal<string>('');

  orderShipments = signal<Record<number, any>>({});
  orderItems = signal<Record<number, any[]>>({});

  filteredOrders = computed(() => {
    const term = this.searchService.searchTerm();
    const status = this.filterStatus();
    const dateFrom = this.filterDateFrom();
    const dateTo = this.filterDateTo();
    let list = this.orders();

    if (term) {
      list = list.filter(o =>
        o.id?.toString().includes(term) ||
        o.status?.toLowerCase().includes(term) ||
        o.storeName?.toLowerCase().includes(term)
      );
    }

    if (status) {
      list = list.filter(o => o.status.toLowerCase() === status.toLowerCase());
    }

    if (dateFrom) {
      const from = new Date(dateFrom);
      list = list.filter(o => new Date(o.createdAt) >= from);
    }

    if (dateTo) {
      const to = new Date(dateTo);
      list = list.filter(o => new Date(o.createdAt) <= to);
    }

    return list;
  });

  constructor(
    private orderService: OrderService,
    private shipmentService: ShipmentService,
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
        const orders = response ?? [];
        this.orders.set(orders);
        this.loadAllShipments(orders);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Could not load orders from API. Showing demo data.');
        this.isLoading.set(false);

        const demoOrders = [
          { id: 10425, status: 'Delivered', grandTotal: 120.50, createdAt: '2025-05-01', storeName: 'Tech Haven', items: [{ id: 1, name: 'Wireless Headphones', price: 79.99, quantity: 1 }, { id: 2, name: 'Phone Case', price: 40.51, quantity: 1 }] },
          { id: 10426, status: 'Processing', grandTotal: 89.99, createdAt: '2025-05-03', storeName: 'Comfort Seating', items: [{ id: 3, name: 'Office Chair Cushion', price: 89.99, quantity: 1 }] },
          { id: 10427, status: 'Shipped', grandTotal: 299.00, createdAt: '2025-05-04', storeName: 'Active Lifestyle', items: [{ id: 4, name: 'Fitness Watch', price: 199.00, quantity: 1 }, { id: 5, name: 'Running Shoes', price: 100.00, quantity: 1 }] },
          { id: 10428, status: 'Cancelled', grandTotal: 14.50, createdAt: '2025-05-05', storeName: 'EcoWear', items: [{ id: 6, name: 'Cotton T-Shirt', price: 14.50, quantity: 1 }] },
          { id: 10429, status: 'Pending', grandTotal: 1045.00, createdAt: '2025-05-06', storeName: 'Home Essentials', items: [{ id: 7, name: 'Blender', price: 89.99, quantity: 2 }, { id: 8, name: 'Coffee Maker', price: 165.00, quantity: 5 }] }
        ];
        this.orders.set(demoOrders);
        this.loadAllShipments(demoOrders);
      }
    });
  }

  loadAllShipments(orders: any[]) {
    orders.forEach(order => {
      this.shipmentService.getShipmentByOrderId(order.id).subscribe({
        next: (shipment: any) => {
          this.orderShipments.update(current => ({
            ...current,
            [order.id]: shipment
          }));
        },
        error: () => {
          const fallbackShipment = {
            id: Math.floor(Math.random() * 10000),
            trackingNumber: 'TRK-' + order.id,
            status: order.status === 'Cancelled' ? 'Cancelled' : 'Pending',
            modeOfShipment: 'Standard'
          };
          this.orderShipments.update(current => ({
            ...current,
            [order.id]: fallbackShipment
          }));
        }
      });

      if (order.items) {
        this.orderItems.update(current => ({
          ...current,
          [order.id]: order.items.map((item: any) => ({
            ...item,
            displayName: item.name || item.productName || item.itemName || 'Item #' + item.id
          }))
        }));
      } else if (order.orderItems) {
        this.orderItems.update(current => ({
          ...current,
          [order.id]: order.orderItems.map((item: any) => ({
            ...item,
            displayName: item.name || item.productName || item.itemName || 'Item #' + item.id
          }))
        }));
      }
    });
  }

  getOrderItems(orderId: number) {
    const items = this.orderItems()[orderId] || [];
    return items.map((item: any) => ({
      ...item,
      displayName: item.name || item.productName || item.itemName || 'Item #' + item.id
    }));
  }

  getShipment(orderId: number) {
    return this.orderShipments()[orderId];
  }

  clearFilters() {
    this.filterStatus.set('');
    this.filterDateFrom.set('');
    this.filterDateTo.set('');
  }

  setDateFrom(value: string) {
    this.filterDateFrom.set(value);
  }

  setDateTo(value: string) {
    this.filterDateTo.set(value);
  }

  toggleOrderDetails(orderId: number) {
    if (this.expandedOrderId() === orderId) {
      this.expandedOrderId.set(null);
    } else {
      this.expandedOrderId.set(orderId);
    }
  }

  goToDetails(id: number) {
    this.router.navigate(['/orders', id]);
  }
}