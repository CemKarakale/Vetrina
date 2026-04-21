import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  apiUrl: string = 'http://localhost:8080/api/reviews/my';

  constructor(private http: HttpClient) {}

  getReviews() {
    return this.http.get<any[]>(this.apiUrl);
  }
}
