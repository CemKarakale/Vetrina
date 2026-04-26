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
  users = signal<any[]>([]);
  isLoading = signal(true);
  errorMessage = signal('');
  isSaving = signal(false);
  formOpen = signal(false);
  statusFilter = signal('');
  searchTerm = signal('');
  form = signal({ name: '', ownerId: '', status: 'ACTIVE' });

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

  ownerOptions = computed(() => {
    const corporateUsers = this.users().filter(user => user.roleType === 'CORPORATE');
    return corporateUsers.length ? corporateUsers : this.users().filter(user => user.roleType !== 'ADMIN');
  });

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.loadStores();
    this.loadUsers();
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

  loadUsers() {
    this.adminService.getUsers().subscribe({
      next: users => this.users.set(users ?? []),
      error: () => this.errorMessage.set('Could not load store owners.')
    });
  }

  setStatus(store: any, status: string) {
    this.adminService.updateStoreStatus(store.id, status).subscribe({
      next: updated => this.stores.update(stores => stores.map(item => item.id === store.id ? updated : item)),
      error: () => this.errorMessage.set('Could not update store status.')
    });
  }

  openCreate() {
    this.form.set({ name: '', ownerId: '', status: 'ACTIVE' });
    this.formOpen.set(true);
    this.errorMessage.set('');
  }

  closeForm() {
    this.formOpen.set(false);
  }

  saveStore() {
    const payload = this.form();
    if (!payload.name.trim() || !payload.ownerId) {
      this.errorMessage.set('Store name and owner are required.');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');
    const ownerId = Number(payload.ownerId);
    this.adminService.createStore({
      name: payload.name.trim(),
      ownerId,
      status: payload.status
    }).subscribe({
      next: store => {
        this.stores.update(stores => [store, ...stores]);
        this.isSaving.set(false);
        this.closeForm();
      },
      error: () => {
        this.errorMessage.set('Could not add store. The selected owner may already be invalid for store creation.');
        this.isSaving.set(false);
      }
    });
  }

  updateForm(field: string, value: string) {
    this.form.update(form => ({ ...form, [field]: value }));
  }
}
