import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  apiUrl: string = 'http://localhost:8080/api/dashboard';

  constructor(private http: HttpClient) {}

  getSummary() {
    return this.http.get<any>(this.apiUrl);
  }
}