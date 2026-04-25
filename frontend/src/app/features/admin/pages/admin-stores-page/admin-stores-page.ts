import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin';

@Component({
  selector: 'app-admin-stores-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-stores-page.html'
})
export class AdminStoresPage implements OnInit {
  stores = signal<any[]>([]);
  isLoading = signal(true);
  errorMessage = signal('');
  statusFilter = signal('');
  searchTerm = signal('');

  filteredStores = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    return this.stores().filter(store => {
      const matchesTerm = !term ||
        store.name?.toLowerCase().includes(term) ||
        store.ownerName?.toLowerCase().includes(term) ||
        store.ownerEmail?.toLowerCase().includes(term);
      const matchesStatus = !this.statusFilter() || store.status === this.statusFilter();
      return matchesTerm && matchesStatus;
    });
  });

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.loadStores();
  }

  loadStores() {
    this.isLoading.set(true);
    this.adminService.getStores().subscribe({
      next: stores => {
        this.stores.set(stores ?? []);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Could not load stores.');
        this.isLoading.set(false);
      }
    });
  }

  setStatus(store: any, status: string) {
    this.adminService.updateStoreStatus(store.id, status).subscribe({
      next: updated => this.stores.update(stores => stores.map(item => item.id === store.id ? updated : item)),
      error: () => this.errorMessage.set('Could not update store status.')
    });
  }
}
