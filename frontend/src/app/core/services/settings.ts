import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class StoreSettingsService {
  apiUrl: string = 'http://localhost:8080/api/store-settings';

  constructor(private http: HttpClient) {}

  getSettings() {
    return this.http.get<any>(this.apiUrl);
  }

  updateSettings(payload: any) {
    return this.http.put<any>(this.apiUrl, payload);
  }
}
