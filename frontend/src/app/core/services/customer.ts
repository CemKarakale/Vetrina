import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  apiUrl: string = 'http://localhost:8080/api/customers';

  constructor(private http: HttpClient) {}

  getCustomers() {
    return this.http.get<any[]>(this.apiUrl);
  }
}
