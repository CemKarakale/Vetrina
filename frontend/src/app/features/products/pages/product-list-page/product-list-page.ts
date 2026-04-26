import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from '../../../../core/services/product';
import { SearchService } from '../../../../core/services/search';
import { AuthService } from '../../../../core/services/auth';

@Component({
  selector: 'app-product-list-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-list-page.html',
  styleUrl: './product-list-page.scss'
})
export class ProductListPage implements OnInit {
  products = signal<any[]>([]);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string>('');
  isAddModalOpen = signal<boolean>(false);
  editingProduct = signal<any | null>(null);
  isSaving = signal<boolean>(false);
  deletingProductId = signal<number | null>(null);
  userRole = signal<string>('USER');

  productForm = signal<any>({
    id: null,
    name: '',
    sku: '',
    categoryName: '',
    categoryId: 1,
    unitPrice: 0,
    stockQuantity: 0,
    lowStockThreshold: 10,
    description: ''
  });

  // Filter values
  selectedCategory = signal<string>('');
  minPrice = signal<string>('');
  maxPrice = signal<string>('');
  sortBy = signal<'name' | 'price' | 'stock'>('name');
  sortOrder = signal<'asc' | 'desc'>('asc');
  stockFilter = signal<'all' | 'low' | 'out'>('all');
  isCorporateUser = computed(() => this.userRole() === 'CORPORATE' || this.userRole() === 'ADMIN');

  // Dynamic categories derived from products
  categories = computed(() => {
    const cats = this.products().map(p => p.categoryName).filter(c => c);
    return [...new Set(cats)] as string[];
  });

  // Filtered and sorted products
  filteredProducts = computed(() => {
    const term = this.searchService.searchTerm().toLowerCase();
    const category = this.selectedCategory();
    const min = this.minPrice() ? Number(this.minPrice()) : 0;
    const max = this.maxPrice() ? Number(this.maxPrice()) : Infinity;
    const sort = this.sortBy();
    const order = this.sortOrder();
    const stock = this.stockFilter();
    let list = this.products();

    list = list.filter(p => {
      const matchesSearch = !term ||
        p.name?.toLowerCase().includes(term) ||
        p.categoryName?.toLowerCase().includes(term) ||
        p.storeName?.toLowerCase().includes(term);
      const matchesCategory = !category || p.categoryName.toLowerCase() === category.toLowerCase();
      const matchesPrice = p.unitPrice >= min && p.unitPrice <= max;
      const stockQuantity = this.getStockQuantity(p);
      const lowThreshold = this.getLowStockThreshold(p);
      const matchesStock =
        stock === 'all' ||
        (stock === 'low' && stockQuantity > 0 && stockQuantity <= lowThreshold) ||
        (stock === 'out' && stockQuantity <= 0);
      return matchesSearch && matchesCategory && matchesPrice && matchesStock;
    });

    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sort === 'name') cmp = a.name.localeCompare(b.name);
      else if (sort === 'price') cmp = a.unitPrice - b.unitPrice;
      else if (sort === 'stock') cmp = this.getStockQuantity(a) - this.getStockQuantity(b);
      return order === 'asc' ? cmp : -cmp;
    });

    return list;
  });

  inventorySummary = computed(() => {
    const products = this.products();
    return {
      total: products.length,
      low: products.filter(product => this.isLowStock(product)).length,
      out: products.filter(product => this.getStockQuantity(product) <= 0).length,
      units: products.reduce((sum, product) => sum + this.getStockQuantity(product), 0)
    };
  });

  lowStockProducts = computed(() => this.products().filter(product => this.isLowStock(product)).slice(0, 6));

  constructor(
    private productService: ProductService,
    private searchService: SearchService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.userRole.set(this.normalizeRole(this.authService.getRole()));
    this.loadProducts();
  }

  loadProducts() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.productService.getProducts().subscribe({
      next: (response: any) => {
        this.products.set(this.extractProducts(response).map((product: any) => this.normalizeProduct(product)));
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Could not load products from API. Showing demo data.');
        this.isLoading.set(false);

        // Fallback demo data matching backend DTO fields
        this.products.set([
          { id: 1, sku: 'TH-WH-100', name: 'Wireless Noise-Canceling Headphones', categoryName: 'Electronics', categoryId: 1, unitPrice: 299.99, stockQuantity: 8, lowStockThreshold: 12, storeName: 'Tech Haven' },
          { id: 2, sku: 'CS-CH-210', name: 'Ergonomic Office Chair', categoryName: 'Furniture', categoryId: 2, unitPrice: 199.50, stockQuantity: 31, lowStockThreshold: 8, storeName: 'Comfort Seating' },
          { id: 3, sku: 'AL-SW-030', name: 'Smart Fitness Watch', categoryName: 'Electronics', categoryId: 1, unitPrice: 149.00, stockQuantity: 0, lowStockThreshold: 10, storeName: 'Active Lifestyle' },
          { id: 4, sku: 'EW-TS-044', name: 'Organic Cotton T-Shirt', categoryName: 'Apparel', categoryId: 3, unitPrice: 24.99, stockQuantity: 64, lowStockThreshold: 20, storeName: 'EcoWear' },
          { id: 5, sku: 'HE-BL-501', name: 'Professional Blender', categoryName: 'Kitchen', categoryId: 4, unitPrice: 89.99, stockQuantity: 5, lowStockThreshold: 10, storeName: 'Home Essentials' },
          { id: 6, sku: 'HE-MG-116', name: 'Ceramic Coffee Mug', categoryName: 'Kitchen', categoryId: 4, unitPrice: 14.50, stockQuantity: 118, lowStockThreshold: 24, storeName: 'Home Essentials' }
        ].map(product => this.normalizeProduct(product)));
      }
    });
  }

  goToDetails(id: number) {
    this.router.navigate(['/products', id]);
  }

  openAddModal() {
    this.editingProduct.set(null);
    this.productForm.set({
      id: null,
      name: '',
      sku: '',
      categoryName: '',
      categoryId: 1,
      unitPrice: 0,
      stockQuantity: 0,
      lowStockThreshold: 10,
      description: ''
    });
    this.isAddModalOpen.set(true);
  }

  closeAddModal() {
    this.isAddModalOpen.set(false);
    this.editingProduct.set(null);
  }

  editProduct(product: any, event?: Event) {
    event?.stopPropagation();
    this.editingProduct.set(product);
    this.productForm.set({
      id: product.id,
      name: product.name || '',
      sku: product.sku || `SKU-${product.id}`,
      categoryName: product.categoryName || 'General',
      categoryId: product.categoryId || 1,
      unitPrice: Number(product.unitPrice || 0),
      stockQuantity: this.getStockQuantity(product),
      lowStockThreshold: this.getLowStockThreshold(product),
      description: product.description || ''
    });
    this.isAddModalOpen.set(true);
  }

  saveProduct() {
    const form = this.productForm();
    if (!form.name || !Number(form.unitPrice)) return;

    this.isSaving.set(true);
    const payload = {
      name: form.name,
      sku: form.sku || `SKU-${Date.now()}`,
      description: form.description || '',
      unitPrice: Number(form.unitPrice),
      categoryId: Number(form.categoryId || 1),
      categoryName: form.categoryName || 'General',
      stockQuantity: Number(form.stockQuantity || 0),
      lowStockThreshold: Number(form.lowStockThreshold || 10)
    };

    if (this.editingProduct()) {
      const id = Number(form.id);
      this.productService.updateProduct(id, payload).subscribe({
        next: (updated: any) => {
          const merged = this.normalizeProduct({ ...payload, ...updated });
          this.products.update(products => products.map(product => product.id === id ? { ...product, ...merged } : product));
          this.syncStockEndpoint(id, payload.stockQuantity);
          this.isSaving.set(false);
          this.closeAddModal();
        },
        error: () => {
          this.products.update(products => products.map(product => product.id === id ? { ...product, ...payload } : product));
          this.errorMessage.set('Could not save to API. Updated locally for this session.');
          this.isSaving.set(false);
          this.closeAddModal();
        }
      });
      return;
    }

    const localProduct = {
      id: Math.floor(Math.random() * 100000),
      ...payload,
      storeName: 'My Store'
    };

    this.productService.createProduct(payload).subscribe({
      next: (created: any) => {
        this.products.set([this.normalizeProduct({ ...localProduct, ...created, ...payload }), ...this.products()]);
        this.isSaving.set(false);
        this.closeAddModal();
      },
      error: () => {
        this.products.set([localProduct, ...this.products()]);
        this.errorMessage.set('Could not save to API. Added locally for this session.');
        this.isSaving.set(false);
        this.closeAddModal();
      }
    });
  }

  deleteProduct(product: any, event?: Event) {
    event?.stopPropagation();
    if (!window.confirm(`Delete ${product.name}?`)) return;

    this.deletingProductId.set(product.id);
    this.productService.deleteProduct(product.id).subscribe({
      next: () => {
        this.products.update(products => products.filter(item => item.id !== product.id));
        this.deletingProductId.set(null);
      },
      error: () => {
        this.products.update(products => products.filter(item => item.id !== product.id));
        this.errorMessage.set('Could not delete through API. Removed locally for this session.');
        this.deletingProductId.set(null);
      }
    });
  }

  clearFilters() {
    this.selectedCategory.set('');
    this.minPrice.set('');
    this.maxPrice.set('');
    this.sortBy.set('name');
    this.sortOrder.set('asc');
    this.stockFilter.set('all');
  }

  updateForm(field: string, value: any) {
    this.productForm.update(form => ({ ...form, [field]: value }));
  }

  getStockQuantity(product: any): number {
    return Number(
      product?.stockQuantity ??
      product?.stock_quantity ??
      product?.quantityInStock ??
      product?.quantity ??
      product?.stock ??
      product?.inventoryQuantity ??
      0
    );
  }

  getLowStockThreshold(product: any): number {
    return Number(product?.lowStockThreshold ?? 10);
  }

  isLowStock(product: any): boolean {
    const stock = this.getStockQuantity(product);
    return stock > 0 && stock <= this.getLowStockThreshold(product);
  }

  getStockStatus(product: any): string {
    const stock = this.getStockQuantity(product);
    if (stock <= 0) return 'Out of stock';
    if (this.isLowStock(product)) return 'Low stock';
    return 'In stock';
  }

  private normalizeRole(role: string | null): string {
    const normalized = String(role || 'USER').replace('ROLE_', '').toUpperCase();
    if (normalized === 'INDIVIDUAL' || normalized === 'INDIVIDUAL_USER') return 'USER';
    if (normalized === 'CORPORATE' || normalized === 'ADMIN') return normalized;
    return 'USER';
  }

  private extractProducts(response: any): any[] {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.content)) return response.content;
    if (Array.isArray(response?.products)) return response.products;
    if (Array.isArray(response?.data)) return response.data;
    return [];
  }

  private normalizeProduct(product: any): any {
    return {
      ...product,
      sku: product?.sku || `SKU-${product?.id ?? Date.now()}`,
      categoryName: product?.categoryName || product?.category?.name || 'General',
      categoryId: product?.categoryId || product?.category?.id || 1,
      storeName: product?.storeName || product?.store?.name || 'My Store',
      stockQuantity: this.getStockQuantity(product),
      lowStockThreshold: Number(product?.lowStockThreshold ?? product?.low_stock_threshold ?? product?.reorderThreshold ?? 10)
    };
  }

  private syncStockEndpoint(id: number, stockQuantity: number) {
    this.productService.updateStock(id, stockQuantity).subscribe({ error: () => {} });
  }
}
