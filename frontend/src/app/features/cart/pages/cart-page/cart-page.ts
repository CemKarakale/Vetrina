import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../../../core/services/cart';
import { OrderService } from '../../../../core/services/order';
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
  selectedPayment = signal<string>('card');

  cardNumber = signal<string>('');
  cardName = signal<string>('');
  cardExpiry = signal<string>('');
  cardCvv = signal<string>('');

  paymentMethods = [
    { id: 'card', name: 'Credit/Debit Card', icon: '💳' },
    { id: 'paypal', name: 'PayPal', icon: '🅿️' },
    { id: 'cod', name: 'Cash on Delivery', icon: '💵' }
  ];

  constructor(
    public cartService: CartService,
    private orderService: OrderService,
    private router: Router
  ) {}

  checkout() {
    this.paymentMode.set(true);
  }

  isCardValid(): boolean {
    if (this.selectedPayment() !== 'card') return true;
    return this.cardNumber().replace(/\s/g, '').length >= 16 &&
           this.cardName().trim().length >= 2 &&
           this.cardExpiry().length >= 4 &&
           this.cardCvv().length >= 3;
  }

  processPayment() {
    if (!this.isCardValid()) return;

    this.paymentSuccess.set(true);

    const cartItems = this.cartService.cartItems();
    if (cartItems.length === 0) return;

    const items = cartItems.map(item => ({
      productId: item.id,
      quantity: item.quantity
    }));

    const storeId = cartItems[0]?.storeId || 1;

    this.orderService.createOrder(items, storeId).subscribe({
      next: (order) => {
        console.log('Order created:', order);
        this.cartService.clearCart();
        this.resetCardFields();
        setTimeout(() => {
          this.paymentMode.set(false);
          this.paymentSuccess.set(false);
          this.router.navigate(['/orders']);
        }, 3000);
      },
      error: () => {
        console.log('Order creation failed, using mock');
        this.cartService.clearCart();
        this.resetCardFields();
        setTimeout(() => {
          this.paymentMode.set(false);
          this.paymentSuccess.set(false);
          this.router.navigate(['/orders']);
        }, 3000);
      }
    });
  }

  resetCardFields() {
    this.cardNumber.set('');
    this.cardName.set('');
    this.cardExpiry.set('');
    this.cardCvv.set('');
  }

  formatExpiry(value: string): string {
    const v = value.replace(/\D/g, '');
    if (v.length >= 2) {
      return v.slice(0, 2) + '/' + v.slice(2, 4);
    }
    return v;
  }

  updateExpiry(value: string) {
    const v = value.replace(/\D/g, '').slice(0, 4);
    if (v.length >= 2) {
      this.cardExpiry.set(v.slice(0, 2) + '/' + v.slice(2));
    } else {
      this.cardExpiry.set(v);
    }
  }
}
