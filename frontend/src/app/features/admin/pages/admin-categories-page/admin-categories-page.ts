import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin';

@Component({
  selector: 'app-admin-categories-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-categories-page.html'
})
export class AdminCategoriesPage implements OnInit {
  categories = signal<any[]>([]);
  errorMessage = signal('');
  isLoading = signal(true);
  formOpen = signal(false);
  editingCategory = signal<any | null>(null);
  form = signal<any>({ name: '', description: '', parentId: '', status: 'ACTIVE' });

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.isLoading.set(true);
    this.adminService.getCategories().subscribe({
      next: categories => {
        this.categories.set(categories ?? []);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Could not load categories.');
        this.isLoading.set(false);
      }
    });
  }

  openCreate() {
    this.editingCategory.set(null);
    this.form.set({ name: '', description: '', parentId: '', status: 'ACTIVE' });
    this.formOpen.set(true);
  }

  editCategory(category: any) {
    this.editingCategory.set(category);
    this.form.set({
      name: category.name || '',
      description: category.description || '',
      parentId: category.parentId || '',
      status: category.status || 'ACTIVE'
    });
    this.formOpen.set(true);
  }

  saveCategory() {
    const form = this.form();
    const payload = { ...form, parentId: form.parentId ? Number(form.parentId) : null };
    const request = this.editingCategory()
      ? this.adminService.updateCategory(this.editingCategory().id, payload)
      : this.adminService.createCategory(payload);

    request.subscribe({
      next: saved => {
        this.categories.update(categories => this.editingCategory()
          ? categories.map(category => category.id === saved.id ? saved : category)
          : [saved, ...categories]);
        this.formOpen.set(false);
      },
      error: () => this.errorMessage.set('Could not save category.')
    });
  }

  deleteCategory(category: any) {
    if (!window.confirm(`Delete ${category.name}?`)) return;
    this.adminService.deleteCategory(category.id).subscribe({
      next: () => this.categories.update(categories => categories.filter(item => item.id !== category.id)),
      error: () => this.errorMessage.set('Could not delete category.')
    });
  }

  updateForm(field: string, value: any) {
    this.form.update(form => ({ ...form, [field]: value }));
  }
}
