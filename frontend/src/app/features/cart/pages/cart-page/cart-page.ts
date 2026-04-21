import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../../../core/services/cart';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cart-page.html',
  styleUrl: './cart-page.scss'
})
export class CartPage {
  paymentMode = signal<boolean>(false);
  paymentSuccess = signal<boolean>(false);
  
  constructor(public cartService: CartService, private router: Router) {}

  checkout() {
    this.paymentMode.set(true);
  }

  processPayment() {
    this.paymentSuccess.set(true);
    this.cartService.clearCart();
    setTimeout(() => {
      this.paymentMode.set(false);
      this.paymentSuccess.set(false);
      this.router.navigate(['/orders']); // Redirect to orders after mock payment
    }, 3000);
  }
}
