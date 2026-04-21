import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  apiUrl: string = 'http://localhost:8080/api/orders';

  constructor(private http: HttpClient) {}

  getOrders() {
    return this.http.get<any[]>(this.apiUrl);
  }

  getOrderById(id: number) {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }
}