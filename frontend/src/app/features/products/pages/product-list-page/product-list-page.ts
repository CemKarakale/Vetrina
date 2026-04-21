import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ProductService } from '../../../../core/services/product';

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
  testMessage = signal<string>('PRODUCT LIST TS IS ACTIVE');

  constructor(
    private productService: ProductService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    console.log('loadProducts started');

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.productService.getProducts().subscribe({
      next: (response: any) => {
        console.log('Products response:', response);
        this.products.set(response ?? []);
        this.isLoading.set(false);
        console.log('isLoading set to false in next');
      },
      error: (err) => {
        console.log('Products error:', err);
        this.errorMessage.set('Could not load products from API. Showing demo data.');
        this.isLoading.set(false);
        
        this.products.set([
          { id: 1, name: 'Wireless Noise-Canceling Headphones', category: 'Electronics', price: 299.99, sku: 'WH-1000XM4', storeName: 'Tech Haven', rating: 4.8, description: 'Industry-leading noise canceling with Dual Noise Sensor technology.' },
          { id: 2, name: 'Ergonomic Office Chair', category: 'Furniture', price: 199.50, sku: 'OC-ERGO-01', storeName: 'Comfort Seating', rating: 4.5, description: 'Adjustable lumbar support and breathable mesh back.' },
          { id: 3, name: 'Smart Fitness Watch', category: 'Electronics', price: 149.00, sku: 'FW-PRO-2', storeName: 'Active Lifestyle', rating: 4.6, description: 'Track your steps, heart rate, and sleep patterns with precision.' },
          { id: 4, name: 'Organic Cotton T-Shirt', category: 'Apparel', price: 24.99, sku: 'TS-ORG-WHT', storeName: 'EcoWear', rating: 4.2, description: '100% organic cotton, sustainably sourced and manufactured.' },
          { id: 5, name: 'Professional Blender', category: 'Kitchen', price: 89.99, sku: 'BL-PRO-500', storeName: 'Home Essentials', rating: 4.7, description: 'High-speed motor for smoothies, crushed ice, and soups.' },
          { id: 6, name: 'Ceramic Coffee Mug', category: 'Kitchen', price: 14.50, sku: 'CM-CER-BE', storeName: 'Home Essentials', rating: 4.9, description: 'Handcrafted ceramic mug with a beautiful glaze finish.' }
        ]);
      },
      complete: () => {
        console.log('Products request complete');
      }
    });
  }

  isAddModalOpen = signal<boolean>(false);

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
      id: Math.floor(Math.random() * 10000), // Fake ID
      name: name,
      category: category || 'General',
      price: Number(price),
      storeName: 'My Store',
      rating: 0,
      sku: 'NEW-' + Math.floor(Math.random() * 1000)
    };

    // Update signal by pushing new product
    this.products.set([newProduct, ...this.products()]);
    this.closeAddModal();
  }
}