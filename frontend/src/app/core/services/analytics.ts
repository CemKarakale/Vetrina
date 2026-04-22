import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  apiUrl: string = '/api/analytics/overview';

  constructor(private http: HttpClient) {}

  getOverview() {
    return this.http.get<any>(this.apiUrl);
  }
}
