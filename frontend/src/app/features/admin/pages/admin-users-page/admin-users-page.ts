import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin';

@Component({
  selector: 'app-admin-users-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-users-page.html'
})
export class AdminUsersPage implements OnInit {
  users = signal<any[]>([]);
  isLoading = signal(true);
  errorMessage = signal('');
  isSaving = signal(false);
  formOpen = signal(false);
  searchTerm = signal('');
  statusFilter = signal('');
  roleFilter = signal('');
  editingUser = signal<any | null>(null);
  form = signal({ name: '', email: '', password: '', roleType: 'INDIVIDUAL' });

  filteredUsers = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    return this.users().filter(user => {
      const matchesTerm = !term ||
        user.name?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        String(user.id).includes(term);
      const matchesStatus = !this.statusFilter() || user.status === this.statusFilter();
      const matchesRole = !this.roleFilter() || user.roleType === this.roleFilter();
      return matchesTerm && matchesStatus && matchesRole;
    });
  });

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.adminService.getUsers().subscribe({
      next: users => {
        this.users.set(users ?? []);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Could not load users.');
        this.isLoading.set(false);
      }
    });
  }

  openCreate() {
    this.editingUser.set(null);
    this.form.set({ name: '', email: '', password: '', roleType: 'INDIVIDUAL' });
    this.formOpen.set(true);
  }

  editUser(user: any) {
    this.editingUser.set(user);
    this.form.set({ name: user.name || '', email: user.email || '', password: '', roleType: user.roleType || 'INDIVIDUAL' });
    this.formOpen.set(true);
  }

  closeForm() {
    this.formOpen.set(false);
    this.editingUser.set(null);
  }

  saveUser() {
    const payload = this.form();
    if (!payload.name || !payload.email || (!this.editingUser() && !payload.password)) return;

    this.isSaving.set(true);
    const request = this.editingUser()
      ? this.adminService.updateUser(this.editingUser().id, { ...payload, password: payload.password || 'unchanged-password' })
      : this.adminService.createUser(payload);

    request.subscribe({
      next: saved => {
        this.users.update(users => this.editingUser()
          ? users.map(user => user.id === saved.id ? saved : user)
          : [saved, ...users]);
        this.isSaving.set(false);
        this.closeForm();
      },
      error: () => {
        this.errorMessage.set('Could not save user.');
        this.isSaving.set(false);
      }
    });
  }

  setStatus(user: any, status: string) {
    this.adminService.updateUserStatus(user.id, status).subscribe({
      next: updated => this.users.update(users => users.map(item => item.id === user.id ? updated : item)),
      error: () => this.errorMessage.set('Could not update user status.')
    });
  }

  deleteUser(user: any) {
    if (!window.confirm(`Delete ${user.name}?`)) return;
    this.adminService.deleteUser(user.id).subscribe({
      next: () => this.users.update(users => users.filter(item => item.id !== user.id)),
      error: () => this.errorMessage.set('Could not delete user.')
    });
  }

  updateForm(field: string, value: string) {
    this.form.update(form => ({ ...form, [field]: value }));
  }
}
