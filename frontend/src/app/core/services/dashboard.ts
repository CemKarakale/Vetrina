import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  apiUrl: string = '/api/dashboard/summary';

  constructor(private http: HttpClient) {}

  getSummary() {
    return this.http.get<any>(this.apiUrl);
  }
}