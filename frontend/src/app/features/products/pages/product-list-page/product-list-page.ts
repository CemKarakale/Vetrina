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
        this.errorMessage.set('Could not load products');
        this.isLoading.set(false);
        console.log('isLoading set to false in error');
      },
      complete: () => {
        console.log('Products request complete');
      }
    });
  }

  goToDetails(id: number) {
    this.router.navigate(['/products', id]);
  }
}