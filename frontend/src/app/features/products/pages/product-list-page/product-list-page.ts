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

  // Filtered list based on search term
  filteredProducts = computed(() => {
    const term = this.searchService.searchTerm();
    const list = this.products();
    if (!term) return list;
    return list.filter(p =>
      p.name?.toLowerCase().includes(term) ||
      p.categoryName?.toLowerCase().includes(term) ||
      p.storeName?.toLowerCase().includes(term)
    );
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
}