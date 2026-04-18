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

// import { Injectable } from '@angular/core';
// import { of } from 'rxjs';

// @Injectable({
//   providedIn: 'root'
// })
// export class OrderService {
//   getOrders() {
//     return of([
//       {
//         id: 1,
//         status: 'Delivered',
//         total: 120.50,
//         date: '2025-05-01'
//       },
//       {
//         id: 2,
//         status: 'Pending',
//         total: 89.99,
//         date: '2025-05-03'
//       }
//     ]);
//   }

//   getOrderById(id: number) {
//     return of({
//       id: id,
//       status: 'Delivered',
//       total: 120.50,
//       date: '2025-05-01',
//       items: 3
//     });
//   }
// }