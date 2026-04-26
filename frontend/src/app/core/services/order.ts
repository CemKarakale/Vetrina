import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  apiUrl: string = '/api/orders';

  constructor(private http: HttpClient) {}

  getOrders() {
    return this.http.get<any[]>(this.apiUrl);
  }

  getOrderById(id: number) {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  createOrder(items: any[], storeId: number) {
    return this.http.post<any>(this.apiUrl, { items, storeId });
  }

  updateOrderStatus(id: number, status: string) {
    return this.http.put<any>(`${this.apiUrl}/${id}/status`, { status });
  }
}
