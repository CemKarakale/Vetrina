import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProductService } from '../../../../core/services/product';

@Component({
  selector: 'app-product-detail-page',
  standalone: true,
  imports: [],
  templateUrl: './product-detail-page.html',
  styleUrl: './product-detail-page.scss'
})
export class ProductDetailPage implements OnInit {
  product: any = null;
  isLoading: boolean = true;
  errorMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService
  ) {}

  ngOnInit() {
    this.loadProduct();
  }

  loadProduct() {
    this.isLoading = true;
    this.errorMessage = '';

    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.productService.getProductById(id).subscribe({
      next: (response: any) => {
        this.product = response;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Could not load product';
        this.isLoading = false;
      }
    });
  }
}