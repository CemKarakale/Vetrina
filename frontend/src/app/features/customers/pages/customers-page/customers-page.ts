import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CustomerService } from '../../../../core/services/customer';
import { SearchService } from '../../../../core/services/search';
import { OrderService } from '../../../../core/services/order';
import { AuthService } from '../../../../core/services/auth';

@Component({
  selector: 'app-customers-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customers-page.html',
  styleUrl: './customers-page.scss'
})
export class CustomersPage implements OnInit {
  customers = signal<any[]>([]);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string>('');
  totalCustomers = signal<number>(0);
  selectedCustomer = signal<any>(null);
  selectedSegment = signal<string>('all');
  corporateCustomerNames = signal<Set<string> | null>(null);
  userRole = signal<string>('USER');

  // Filtered customers based on search term
  filteredCustomers = computed(() => {
    const term = this.searchService.searchTerm();
    const segment = this.selectedSegment();
    let list = this.customers();
    const scopedNames = this.corporateCustomerNames();
    if (this.userRole() === 'CORPORATE' && scopedNames) {
      list = list.filter(customer => scopedNames.has(String(customer.name || '').toLowerCase()));
    }
    return list.filter(c => {
      const matchesSearch = !term ||
        c.name?.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term) ||
        c.city?.toLowerCase().includes(term) ||
        c.id?.toString().includes(term) ||
        c.membership?.toLowerCase().includes(term);
      const matchesSegment = segment === 'all' || this.getCustomerSegment(c) === segment;
      return matchesSearch && matchesSegment;
    });
  });

  segmentSummaries = computed(() => {
    const memberships = this.membershipTiers();
    return memberships.map(membership => {
      const customers = this.scopedCustomers().filter(customer => this.getCustomerMembershipKey(customer) === membership);
      const spend = customers.reduce((sum, customer) => sum + Number(customer.totalSpend || 0), 0);
      const orders = customers.reduce((sum, customer) => sum + Number(customer.orderCount || 0), 0);
      return {
        key: membership,
        label: this.getSegmentLabel(membership),
        customers: customers.length,
        averageSpend: customers.length ? spend / customers.length : 0,
        orders
      };
    });
  });

  behaviorSummary = computed(() => {
    const customers = this.filteredCustomers();
    const spend = customers.reduce((sum, customer) => sum + Number(customer.totalSpend || 0), 0);
    const orders = customers.reduce((sum, customer) => sum + Number(customer.orderCount || 0), 0);
    return {
      averageSpend: customers.length ? spend / customers.length : 0,
      averageOrders: customers.length ? orders / customers.length : 0,
      activeCustomers: customers.filter(customer => String(customer.status || '').toLowerCase() === 'active').length
    };
  });

  constructor(
    private customerService: CustomerService,
    private searchService: SearchService,
    private orderService: OrderService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.userRole.set(this.normalizeRole(this.authService.getRole()));
    this.loadCustomers();
  }

  loadCustomers() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.customerService.getCustomers().subscribe({
      next: (response: any) => {
        // Map backend DTO fields to frontend names and ensure safe data
        const mapped = (response ?? []).map((c: any) => ({
          ...c,
          membership: c.membershipType || c.membership || 'Standard',
          status: c.status || 'Active'
        }));
        this.customers.set(mapped);
        this.totalCustomers.set(mapped.length);
        this.isLoading.set(false);
        this.loadCorporateCustomerScope();
      },
      error: () => {
        this.errorMessage.set('Could not load customers from API. Showing demo data.');
        this.isLoading.set(false);

        // Mock fallback demo data
        const mockData = [
          { id: 'CUST-001', name: 'John Smith', email: 'john@example.com', city: 'New York', membership: 'Gold', totalSpend: 4520.50, orderCount: 34, favoriteCategory: 'Electronics', status: 'Active' },
          { id: 'CUST-002', name: 'Sarah Johnson', email: 'sarah@example.com', city: 'Los Angeles', membership: 'Gold', totalSpend: 1250.00, orderCount: 12, favoriteCategory: 'Home', status: 'Active' },
          { id: 'CUST-003', name: 'Michael Brown', email: 'michael@example.com', city: 'Chicago', membership: 'Silver', totalSpend: 450.75, orderCount: 3, favoriteCategory: 'Kitchen', status: 'Inactive' },
          { id: 'CUST-004', name: 'Emily Davis', email: 'emily@example.com', city: 'Miami', membership: 'Bronze', totalSpend: 89.99, orderCount: 1, favoriteCategory: 'Apparel', status: 'Active' },
          { id: 'CUST-005', name: 'David Wilson', email: 'david@example.com', city: 'Houston', membership: 'Gold', totalSpend: 8900.25, orderCount: 89, favoriteCategory: 'Electronics', status: 'Active' }
        ];

        this.customers.set(mockData);
        this.totalCustomers.set(mockData.length);
        this.loadCorporateCustomerScope();
      }
    });
  }

  viewProfile(customer: any) {
    this.selectedCustomer.set(customer);
  }

  getCustomerSegment(customer: any): string {
    return this.getCustomerMembershipKey(customer);
  }

  getSegmentLabel(segment: string): string {
    if (segment === 'all') return 'All';
    return segment.charAt(0).toUpperCase() + segment.slice(1);
  }

  membershipTiers(): string[] {
    const tiers = new Set(this.scopedCustomers().map(customer => this.getCustomerMembershipKey(customer)));
    const preferredOrder = ['gold', 'silver', 'bronze', 'standard'];
    const ordered = preferredOrder.filter(tier => tiers.has(tier));
    const remaining = Array.from(tiers).filter(tier => !preferredOrder.includes(tier)).sort();
    return [...ordered, ...remaining];
  }

  getCustomerMembershipKey(customer: any): string {
    return String(customer?.membership || customer?.membershipType || 'standard').toLowerCase();
  }

  private scopedCustomers(): any[] {
    const scopedNames = this.corporateCustomerNames();
    if (this.userRole() !== 'CORPORATE' || !scopedNames) return this.customers();
    return this.customers().filter(customer => scopedNames.has(String(customer.name || '').toLowerCase()));
  }

  private loadCorporateCustomerScope() {
    if (this.userRole() !== 'CORPORATE') return;

    this.orderService.getOrders().subscribe({
      next: orders => {
        const detailRequests = (orders ?? []).map(order =>
          this.orderService.getOrderById(order.id).pipe(catchError(() => of(null)))
        );

        if (!detailRequests.length) {
          this.corporateCustomerNames.set(new Set());
          return;
        }

        forkJoin(detailRequests).subscribe(details => {
          const names = new Set(
            details
              .map((detail: any) => String(detail?.userName || '').toLowerCase())
              .filter(Boolean)
          );
          this.corporateCustomerNames.set(names);
          this.totalCustomers.set(this.filteredCustomers().length);
        });
      },
      error: () => {}
    });
  }

  private normalizeRole(role: string | null): string {
    const normalized = String(role || 'USER').replace('ROLE_', '').toUpperCase();
    if (normalized === 'INDIVIDUAL' || normalized === 'INDIVIDUAL_USER') return 'USER';
    if (normalized === 'CORPORATE' || normalized === 'ADMIN') return normalized;
    return 'USER';
  }
}
