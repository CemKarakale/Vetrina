import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../../../core/services/product';

@Component({
  selector: 'app-product-detail-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-detail-page.html',
  styleUrl: './product-detail-page.scss'
})
export class ProductDetailPage implements OnInit {
  product = signal<any>(null);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string>('');
  isEditing = signal<boolean>(false);
  isAddedToCart = signal<boolean>(false);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService
  ) { }

  ngOnInit() {
    this.loadProduct();
  }

  loadProduct() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.productService.getProductById(id).subscribe({
      next: (response: any) => {
        this.product.set(response);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Could not load product from API. Showing demo data.');
        this.isLoading.set(false);

        // Mock fallback detailed product
        this.product.set({
          id: id,
          name: 'Wireless Noise-Canceling Headphones',
          category: 'Electronics',
          price: 299.99,
          sku: 'WH-1000XM4',
          storeName: 'Tech Haven',
          rating: 4.8,
          description: 'Industry-leading noise canceling with Dual Noise Sensor technology. Next-level music with Edge-AI, co-developed with Tokyo Music Studios. Up to 30-hour battery life with quick charging. Premium sound quality with High-Resolution Audio support.',
          reviewsCount: 1240,
          stockStatus: 'In Stock'
        });
      }
    });
  }

  goBack() {
    this.router.navigate(['/products']);
  }

  addToCart() {
    this.isAddedToCart.set(true);
    setTimeout(() => this.isAddedToCart.set(false), 3000);
  }

  toggleEdit() {
    this.isEditing.set(!this.isEditing());
  }

  saveProduct(descValue: string, priceValue: string) {
    // Optimistic update of local signal payload
    this.product.update((p: any) => ({
      ...p,
      description: descValue,
      price: Number(priceValue)
    }));
    this.isEditing.set(false);
  }
}