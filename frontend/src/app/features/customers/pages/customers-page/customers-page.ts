import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomerService } from '../../../../core/services/customer';
import { SearchService } from '../../../../core/services/search';

@Component({
  selector: 'app-customers-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customers-page.html',
  styleUrl: './customers-page.scss'
})
export class CustomersPage implements OnInit {
  customers = signal<any[]>([]);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string>('');
  totalCustomers = signal<number>(0);
  selectedCustomer = signal<any>(null);

  // Filtered customers based on search term
  filteredCustomers = computed(() => {
    const term = this.searchService.searchTerm();
    const list = this.customers();
    if (!term) return list;
    return list.filter(c =>
      c.name?.toLowerCase().includes(term) ||
      c.id?.toString().includes(term) ||
      c.membership?.toLowerCase().includes(term)
    );
  });

  constructor(
    private customerService: CustomerService,
    private searchService: SearchService
  ) {}

  ngOnInit() {
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
      },
      error: () => {
        this.errorMessage.set('Could not load customers from API. Showing demo data.');
        this.isLoading.set(false);

        // Mock fallback demo data
        const mockData = [
          { id: 'CUST-001', name: 'John Smith', membership: 'Platinum', totalSpend: 4520.50, orderCount: 34, status: 'Active' },
          { id: 'CUST-002', name: 'Sarah Johnson', membership: 'Gold', totalSpend: 1250.00, orderCount: 12, status: 'Active' },
          { id: 'CUST-003', name: 'Michael Brown', membership: 'Silver', totalSpend: 450.75, orderCount: 3, status: 'Inactive' },
          { id: 'CUST-004', name: 'Emily Davis', membership: 'Standard', totalSpend: 89.99, orderCount: 1, status: 'Active' },
          { id: 'CUST-005', name: 'David Wilson', membership: 'Platinum', totalSpend: 8900.25, orderCount: 89, status: 'Active' }
        ];

        this.customers.set(mockData);
        this.totalCustomers.set(mockData.length);
      }
    });
  }

  viewProfile(customer: any) {
    this.selectedCustomer.set(customer);
  }
}
