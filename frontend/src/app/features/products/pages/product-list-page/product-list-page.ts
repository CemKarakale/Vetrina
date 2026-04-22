import { Component, OnInit, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { ProductService } from '../../../../core/services/product';
import { SearchService } from '../../../../core/services/search';

@Component({
  selector: 'app-product-list-page',
  standalone: true,
  imports: [],
  templateUrl: './product-list-page.html',
  styleUrl: './product-list-page.scss'
})
export class ProductListPage implements OnInit {
  products = signal<any[]>([]);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string>('');
  isAddModalOpen = signal<boolean>(false);

  // Filter values
  selectedCategory = signal<string>('');
  minPrice = signal<string>('');
  maxPrice = signal<string>('');
  sortBy = signal<'name' | 'price'>('name');
  sortOrder = signal<'asc' | 'desc'>('asc');

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
    let list = this.products();

    list = list.filter(p => {
      const matchesSearch = !term ||
        p.name?.toLowerCase().includes(term) ||
        p.categoryName?.toLowerCase().includes(term) ||
        p.storeName?.toLowerCase().includes(term);
      const matchesCategory = !category || p.categoryName.toLowerCase() === category.toLowerCase();
      const matchesPrice = p.unitPrice >= min && p.unitPrice <= max;
      return matchesSearch && matchesCategory && matchesPrice;
    });

    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sort === 'name') cmp = a.name.localeCompare(b.name);
      else if (sort === 'price') cmp = a.unitPrice - b.unitPrice;
      return order === 'asc' ? cmp : -cmp;
    });

    return list;
  });

  constructor(
    private productService: ProductService,
    private searchService: SearchService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.productService.getProducts().subscribe({
      next: (response: any) => {
        this.products.set(response ?? []);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Could not load products from API. Showing demo data.');
        this.isLoading.set(false);

        // Fallback demo data matching backend DTO fields
        this.products.set([
          { id: 1, name: 'Wireless Noise-Canceling Headphones', categoryName: 'Electronics', unitPrice: 299.99, storeName: 'Tech Haven' },
          { id: 2, name: 'Ergonomic Office Chair', categoryName: 'Furniture', unitPrice: 199.50, storeName: 'Comfort Seating' },
          { id: 3, name: 'Smart Fitness Watch', categoryName: 'Electronics', unitPrice: 149.00, storeName: 'Active Lifestyle' },
          { id: 4, name: 'Organic Cotton T-Shirt', categoryName: 'Apparel', unitPrice: 24.99, storeName: 'EcoWear' },
          { id: 5, name: 'Professional Blender', categoryName: 'Kitchen', unitPrice: 89.99, storeName: 'Home Essentials' },
          { id: 6, name: 'Ceramic Coffee Mug', categoryName: 'Kitchen', unitPrice: 14.50, storeName: 'Home Essentials' }
        ]);
      }
    });
  }

  goToDetails(id: number) {
    this.router.navigate(['/products', id]);
  }

  openAddModal() {
    this.isAddModalOpen.set(true);
  }

  closeAddModal() {
    this.isAddModalOpen.set(false);
  }

  saveProduct(name: string, category: string, price: string) {
    if (!name || !price) return;

    const newProduct = {
      id: Math.floor(Math.random() * 10000),
      name: name,
      categoryName: category || 'General',
      unitPrice: Number(price),
      storeName: 'My Store'
    };

    this.products.set([newProduct, ...this.products()]);
    this.closeAddModal();
  }

  clearFilters() {
    this.selectedCategory.set('');
    this.minPrice.set('');
    this.maxPrice.set('');
    this.sortBy.set('name');
    this.sortOrder.set('asc');
  }
}