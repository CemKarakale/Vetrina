import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  apiUrl: string = '/api/analytics/overview';

  constructor(private http: HttpClient) {}

  getOverview(from?: string, to?: string) {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<any>(this.apiUrl, { params });
  }
}
