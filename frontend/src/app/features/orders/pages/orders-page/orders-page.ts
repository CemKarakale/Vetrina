import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { OrderService } from '../../../../core/services/order';
import { ShipmentService } from '../../../../core/services/shipment';
import { AuthService } from '../../../../core/services/auth';

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
  productSearchTerm = signal<string>('');
  memberSearchTerm = signal<string>('');

  orderShipments = signal<Record<number, any>>({});
  orderItems = signal<Record<number, any[]>>({});
  cancellingOrderId = signal<number | null>(null);
  updatingOrderId = signal<number | null>(null);
  usingFallbackData = signal<boolean>(false);
  userRole = signal<string>('USER');
  isUser = computed(() => this.userRole() === 'USER');
  isOperationsUser = computed(() => this.userRole() === 'CORPORATE' || this.userRole() === 'ADMIN');

  filteredOrders = computed(() => {
    const productTerm = this.productSearchTerm().trim().toLowerCase();
    const memberTerm = this.memberSearchTerm().trim().toLowerCase();
    const status = this.filterStatus();
    const dateFrom = this.filterDateFrom();
    const dateTo = this.filterDateTo();
    let list = this.orders();

    if (productTerm) {
      list = list.filter(order => this.orderMatchesProductSearch(order, productTerm));
    }

    if (this.isOperationsUser() && memberTerm) {
      list = list.filter(order => this.orderMatchesMemberSearch(order, memberTerm));
    }

    if (status) {
      list = list.filter(o => this.normalizeStatus(o.status) === this.normalizeStatus(status));
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

  visibleOrdersCount = computed(() => this.filteredOrders().length);
  openOrdersCount = computed(() => this.orders().filter(order => this.canCancelOrder(order)).length);
  totalOrderValue = computed(() => this.filteredOrders().reduce((sum, order) => sum + Number(order.grandTotal || 0), 0));
  productSearchSuggestions = computed(() => {
    const suggestions = new Set<string>();

    for (const order of this.orders()) {
      for (const item of this.getOrderItems(order.id)) {
        if (item.displayName) suggestions.add(item.displayName);
      }
    }

    return Array.from(suggestions).sort((a, b) => a.localeCompare(b)).slice(0, 30);
  });

  memberSearchSuggestions = computed(() => {
    const suggestions = new Set<string>();

    for (const order of this.orders()) {
      if (this.isOperationsUser() && order.userName) {
        suggestions.add(order.userName);
      }
    }

    return Array.from(suggestions).sort((a, b) => a.localeCompare(b)).slice(0, 30);
  });

  constructor(
    private orderService: OrderService,
    private shipmentService: ShipmentService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.userRole.set(this.normalizeRole(this.authService.getRole()));
    this.loadOrders();
  }

  loadOrders() {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.usingFallbackData.set(false);

    this.orderService.getOrders().subscribe({
      next: (response: any) => {
        const orders = response ?? [];
        this.orders.set(orders);
        this.loadAllShipments(orders);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Could not load orders from API. Showing demo data.');
        this.usingFallbackData.set(true);
        this.isLoading.set(false);

        const demoOrders = [
          { id: 10425, status: 'DELIVERED', grandTotal: 120.50, createdAt: '2025-05-01', storeName: 'Tech Haven', userName: 'Maya Carter', items: [{ id: 1, productName: 'Wireless Headphones', price: 79.99, quantity: 1 }, { id: 2, productName: 'Phone Case', price: 40.51, quantity: 1 }] },
          { id: 10426, status: 'CONFIRMED', grandTotal: 89.99, createdAt: '2025-05-03', storeName: 'Comfort Seating', userName: 'Emir Yilmaz', items: [{ id: 3, productName: 'Office Chair Cushion', price: 89.99, quantity: 1 }] },
          { id: 10427, status: 'SHIPPED', grandTotal: 299.00, createdAt: '2025-05-04', storeName: 'Active Lifestyle', userName: 'Nora Stone', items: [{ id: 4, productName: 'Fitness Watch', price: 199.00, quantity: 1 }, { id: 5, productName: 'Running Shoes', price: 100.00, quantity: 1 }] },
          { id: 10428, status: 'CANCELLED', grandTotal: 14.50, createdAt: '2025-05-05', storeName: 'EcoWear', userName: 'Aylin Demir', items: [{ id: 6, productName: 'Cotton T-Shirt', price: 14.50, quantity: 1 }] },
          { id: 10429, status: 'PENDING', grandTotal: 1045.00, createdAt: '2025-05-06', storeName: 'Home Essentials', userName: 'Jordan Lee', items: [{ id: 7, productName: 'Blender', price: 179.98, quantity: 2 }, { id: 8, productName: 'Coffee Maker', price: 865.02, quantity: 5 }] }
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
        this.setOrderItems(order.id, order.items);
      } else if (order.orderItems) {
        this.setOrderItems(order.id, order.orderItems);
      } else {
        this.orderService.getOrderById(order.id).subscribe({
          next: (detail: any) => {
            if (detail?.items?.length) {
              this.setOrderItems(order.id, detail.items);
              this.orders.update(current => current.map(currentOrder =>
                currentOrder.id === order.id ? { ...currentOrder, userName: detail.userName, items: detail.items } : currentOrder
              ));
            }
          }
        });
      }
    });
  }

  getOrderItems(orderId: number) {
    const items = this.orderItems()[orderId] || [];
    return items.map((item: any) => ({
      ...item,
      displayName: this.getItemName(item),
      lineTotal: this.getItemTotal(item)
    }));
  }

  setOrderItems(orderId: number, items: any[]) {
    this.orderItems.update(current => ({
      ...current,
      [orderId]: items.map((item: any) => ({
        ...item,
        displayName: this.getItemName(item),
        lineTotal: this.getItemTotal(item)
      }))
    }));
  }

  getPrimaryProduct(orderId: number): string {
    const items = this.getOrderItems(orderId);
    if (!items.length) return 'Products loading';
    const firstName = items[0].displayName;
    const preview = this.truncateText(firstName, 40);
    return items.length > 1 ? `${preview} +${items.length - 1} more` : preview;
  }

  getProductPreview(orderId: number): string {
    const items = this.getOrderItems(orderId);
    if (!items.length) return 'Open for product details';
    return items.length > 1 ? 'Open to see full product names' : 'Open to see full product name';
  }

  getShipment(orderId: number) {
    return this.orderShipments()[orderId];
  }

  clearFilters() {
    this.filterStatus.set('');
    this.filterDateFrom.set('');
    this.filterDateTo.set('');
    this.productSearchTerm.set('');
    this.memberSearchTerm.set('');
  }

  setProductSearchTerm(value: string) {
    this.productSearchTerm.set(value);
  }

  setMemberSearchTerm(value: string) {
    this.memberSearchTerm.set(value);
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

  cancelOrder(order: any, event?: Event) {
    event?.stopPropagation();
    if (!this.canCancelOrder(order) || this.cancellingOrderId() === order.id) return;

    const confirmed = window.confirm(`Cancel order #${order.id}?`);
    if (!confirmed) return;

    this.cancellingOrderId.set(order.id);
    this.errorMessage.set('');

    if (this.usingFallbackData()) {
      this.applyCancelledOrder(order.id);
      this.cancellingOrderId.set(null);
      return;
    }

    this.orderService.updateOrderStatus(order.id, 'CANCELLED').subscribe({
      next: (updated: any) => {
        this.orders.update(current => current.map(currentOrder =>
          currentOrder.id === order.id ? { ...currentOrder, ...updated, status: 'CANCELLED' } : currentOrder
        ));
        this.cancellingOrderId.set(null);
      },
      error: () => {
        this.errorMessage.set('Could not cancel this order. It may already be in fulfillment.');
        this.cancellingOrderId.set(null);
      }
    });
  }

  advanceFulfillment(order: any, event?: Event) {
    event?.stopPropagation();
    if (!this.isOperationsUser() || this.updatingOrderId() === order.id) return;

    const nextStatus = this.getNextFulfillmentStatus(order.status);
    if (!nextStatus) return;

    this.updatingOrderId.set(order.id);
    this.errorMessage.set('');

    if (this.usingFallbackData()) {
      this.applyOrderStatus(order.id, nextStatus);
      this.updatingOrderId.set(null);
      return;
    }

    this.orderService.updateOrderStatus(order.id, nextStatus).subscribe({
      next: (updated: any) => {
        this.orders.update(current => current.map(currentOrder =>
          currentOrder.id === order.id ? { ...currentOrder, ...updated, status: nextStatus } : currentOrder
        ));
        this.updatingOrderId.set(null);
      },
      error: () => {
        this.errorMessage.set('Could not update fulfillment status. Please refresh and try again.');
        this.updatingOrderId.set(null);
      }
    });
  }

  getNextFulfillmentStatus(status: string): string | null {
    switch (this.normalizeStatus(status)) {
      case 'PENDING': return 'CONFIRMED';
      case 'CONFIRMED': return 'PROCESSING';
      case 'PROCESSING': return 'SHIPPED';
      case 'SHIPPED': return 'DELIVERED';
      default: return null;
    }
  }

  getFulfillmentActionLabel(order: any): string {
    const nextStatus = this.getNextFulfillmentStatus(order?.status);
    if (!nextStatus) return '';
    return `Mark ${this.getStatusLabel(nextStatus)}`;
  }

  canCancelOrder(order: any): boolean {
    const status = this.normalizeStatus(order?.status);
    return status === 'PENDING' || status === 'CONFIRMED' || status === 'PROCESSING';
  }

  getStatusLabel(status: string): string {
    return this.normalizeStatus(status).replace('_', ' ').toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
  }

  getItemName(item: any): string {
    return item?.productName || item?.name || item?.itemName || item?.product?.name || `Item #${item?.id ?? ''}`.trim();
  }

  getItemTotal(item: any): number {
    const quantity = Number(item?.quantity || 1);
    const price = Number(item?.price ?? item?.unitPrice ?? item?.product?.unitPrice ?? 0);
    return price;
  }

  private orderMatchesProductSearch(order: any, term: string): boolean {
    return this.getOrderItems(order.id).some((item: any) =>
      item.displayName.toLowerCase().includes(term)
    );
  }

  private orderMatchesMemberSearch(order: any, term: string): boolean {
    return String(order.userName || '').toLowerCase().includes(term);
  }

  private truncateText(value: string, maxLength: number): string {
    if (!value || value.length <= maxLength) return value;
    return `${value.slice(0, maxLength).trim()}...`;
  }

  normalizeStatus(status: string): string {
    return String(status || '').toUpperCase();
  }

  private normalizeRole(role: string | null): string {
    const normalized = String(role || 'USER').replace('ROLE_', '').toUpperCase();
    if (normalized === 'INDIVIDUAL' || normalized === 'INDIVIDUAL_USER') return 'USER';
    if (normalized === 'CORPORATE' || normalized === 'ADMIN') return normalized;
    return 'USER';
  }

  private applyCancelledOrder(orderId: number) {
    this.applyOrderStatus(orderId, 'CANCELLED');
  }

  private applyOrderStatus(orderId: number, status: string) {
    this.orders.update(current => current.map(order =>
      order.id === orderId ? { ...order, status } : order
    ));
    this.orderShipments.update(current => ({
      ...current,
      [orderId]: { ...(current[orderId] || {}), status }
    }));
  }

  exportOrders() {
    const orders = this.filteredOrders();
    const csv = [
      ['Order ID', 'Date', 'Store', 'Customer', 'Products', 'Status', 'Total'].join(','),
      ...orders.map(o => [o.id, o.createdAt, o.storeName, o.userName || '', this.getPrimaryProduct(o.id), o.status, o.grandTotal].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'orders-export.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
}
