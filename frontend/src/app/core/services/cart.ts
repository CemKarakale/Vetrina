import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  cartItems = signal<any[]>([]);
  
  addToCart(product: any) {
    this.cartItems.update(items => {
      const existing = items.find(i => i.id === product.id);
      if (existing) {
        return items.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...items, { ...product, quantity: 1 }];
    });
  }

  removeFromCart(productId: number) {
    this.cartItems.update(items => items.filter(i => i.id !== productId));
  }

  clearCart() {
    this.cartItems.set([]);
  }

  getTotal() {
    return this.cartItems().reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  }
}
