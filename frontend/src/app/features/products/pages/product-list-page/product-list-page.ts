import { Component, OnInit } from '@angular/core';
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
  products: any[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';

  constructor(
    private productService: ProductService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.isLoading = true;
    this.errorMessage = '';

    this.productService.getProducts().subscribe({
      next: (response: any) => {
        this.products = response;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Could not load products';
        this.isLoading = false;
      }
    });
  }

  goToDetails(id: number) {
    this.router.navigate(['/products', id]);
  }
}