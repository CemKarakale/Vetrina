import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private baseUrl: string = '/api/reviews';

  constructor(private http: HttpClient) {}

  getReviews(all: boolean = false) {
    const url = all ? this.baseUrl : `${this.baseUrl}/my`;
    return this.http.get<any[]>(url);
  }
}
