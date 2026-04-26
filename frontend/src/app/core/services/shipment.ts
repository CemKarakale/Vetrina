import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ShipmentService {
  apiUrl: string = '/api/shipments/order';

  constructor(private http: HttpClient) {}

  getShipmentByOrderId(orderId: number) {
    return this.http.get<any>(`${this.apiUrl}/${orderId}`);
  }
}
