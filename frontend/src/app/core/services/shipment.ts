import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ShipmentService {
  apiUrl: string = 'http://localhost:8080/api/shipments';

  constructor(private http: HttpClient) {}

  getShipments() {
    return this.http.get<any[]>(this.apiUrl);
  }
}
