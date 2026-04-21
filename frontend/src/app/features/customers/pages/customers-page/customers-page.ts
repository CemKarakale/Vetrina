import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomerService } from '../../../../core/services/customer';

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

  isAddModalOpen = signal<boolean>(false);
  selectedCustomer = signal<any>(null);

  openAddModal() {
    this.isAddModalOpen.set(true);
  }

  saveCustomer(name: string, members: string, spend: string) {
    if (!name) return;
    const newCust = {
      id: 'CUST-NEW-' + Math.floor(Math.random() * 999),
      name: name,
      membership: members || 'Standard',
      totalSpend: Number(spend) || 0,
      orderCount: 0,
      status: 'Active'
    };
    this.customers.set([newCust, ...this.customers()]);
    this.totalCustomers.update(t => t + 1);
    this.isAddModalOpen.set(false);
  }

  viewProfile(customer: any) {
    this.selectedCustomer.set(customer);
  }

  constructor(private customerService: CustomerService) { }

  ngOnInit() {
    this.loadCustomers();
  }

  loadCustomers() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.customerService.getCustomers().subscribe({
      next: (response: any) => {
        this.customers.set(response ?? []);
        this.totalCustomers.set(response?.length || 0);
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
        this.totalCustomers.set(12458); // Faking total count for realism
      }
    });
  }
}
