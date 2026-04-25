import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  apiUrl: string = '/api/products';

  constructor(private http: HttpClient) {}

  getProducts() {
    return this.http.get<any[]>(this.apiUrl);
  }

  getProductById(id: number) {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  createProduct(payload: any) {
    return this.http.post<any>(this.apiUrl, payload);
  }

  updateProduct(id: number, payload: any) {
    return this.http.put<any>(`${this.apiUrl}/${id}`, payload);
  }

  updateStock(id: number, stockQuantity: number) {
    return this.http.put<any>(`${this.apiUrl}/${id}/stock`, { stockQuantity });
  }

  deleteProduct(id: number) {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
