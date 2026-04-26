import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private adminUrl = '/api/admin';
  private categoryUrl = '/api/categories';

  constructor(private http: HttpClient) {}

  getUsers() {
    return this.http.get<any[]>(`${this.adminUrl}/users`);
  }

  createUser(payload: any) {
    return this.http.post<any>(`${this.adminUrl}/users`, payload);
  }

  updateUser(id: number, payload: any) {
    return this.http.put<any>(`${this.adminUrl}/users/${id}`, payload);
  }

  updateUserStatus(id: number, status: string) {
    return this.http.put<any>(`${this.adminUrl}/users/${id}/status`, { status });
  }

  deleteUser(id: number) {
    return this.http.delete<void>(`${this.adminUrl}/users/${id}`);
  }

  getStores() {
    return this.http.get<any[]>(`${this.adminUrl}/stores`);
  }

  updateStoreStatus(id: number, status: string) {
    return this.http.put<any>(`${this.adminUrl}/stores/${id}/status`, { status });
  }

  getCategories() {
    return this.http.get<any[]>(this.categoryUrl);
  }

  createCategory(payload: any) {
    return this.http.post<any>(this.categoryUrl, payload);
  }

  updateCategory(id: number, payload: any) {
    return this.http.put<any>(`${this.categoryUrl}/${id}`, payload);
  }

  deleteCategory(id: number) {
    return this.http.delete<void>(`${this.categoryUrl}/${id}`);
  }

  getSystemSettings() {
    return this.http.get<Record<string, string>>(`${this.adminUrl}/system-settings`);
  }

  updateSystemSettings(payload: Record<string, string>) {
    return this.http.put<Record<string, string>>(`${this.adminUrl}/system-settings`, payload);
  }

  getAuditLogs(filters: any = {}) {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<any[]>(`${this.adminUrl}/audit-logs`, { params });
  }

  getStoreReports(filters: any = {}) {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<any[]>(`${this.adminUrl}/reports/stores`, { params });
  }
}
