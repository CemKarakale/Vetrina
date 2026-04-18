import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OrderService } from '../../../../core/services/order';

@Component({
  selector: 'app-orders-page',
  standalone: true,
  imports: [],
  templateUrl: './orders-page.html',
  styleUrl: './orders-page.scss'
})
export class OrdersPage implements OnInit {
  orders: any[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';

  constructor(
    private orderService: OrderService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.isLoading = true;
    this.errorMessage = '';

    this.orderService.getOrders().subscribe({
      next: (response: any) => {
        this.orders = response;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Could not load orders';
        this.isLoading = false;
      }
    });
  }

  goToDetails(id: number) {
    this.router.navigate(['/orders', id]);
  }
}