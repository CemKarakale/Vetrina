// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';

// @Injectable({
//   providedIn: 'root'
// })
// export class ProductService {
//   apiUrl: string = 'http://localhost:8080/api/products';

//   constructor(private http: HttpClient) {}

//   getProducts() {
//     return this.http.get<any[]>(this.apiUrl);
//   }

//   getProductById(id: number) {
//     return this.http.get<any>(`${this.apiUrl}/${id}`);
//   }
// }
import { Injectable } from '@angular/core';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  getProducts() {
    return of([
      { id: 1, name: 'Phone', category: 'Electronics', price: 1000 },
      { id: 2, name: 'Laptop', category: 'Electronics', price: 2500 }
    ]);
  }

  getProductById(id: number) {
    return of({
      id: id,
      name: 'Phone',
      category: 'Electronics',
      price: 1000,
      description: 'Sample product'
    });
  }
}