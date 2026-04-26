import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthService } from './auth';

@Injectable({
  providedIn: 'root'
})
export class StoreSettingsService {
  apiUrl: string = '/api/store-settings';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getSettings() {
    return this.http.get<any>(this.apiUrl).pipe(
      tap(settings => this.cacheSettings(settings)),
      catchError(error => {
        const cached = this.getCachedSettings();
        return cached ? of(cached) : throwError(() => error);
      })
    );
  }

  updateSettings(payload: any) {
    return this.http.put<any>(this.apiUrl, payload).pipe(
      tap(settings => this.cacheSettings(settings)),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  private cacheSettings(settings: any) {
    if (settings) {
      localStorage.setItem(this.getCacheKey(), JSON.stringify(settings));
    }
  }

  private getCachedSettings(): any | null {
    const stored = localStorage.getItem(this.getCacheKey());
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }

  private getCacheKey(): string {
    return `store_settings_draft_${this.authService.getStoreId() || this.authService.getUserId() || this.authService.getEmail() || 'default'}`;
  }
}
