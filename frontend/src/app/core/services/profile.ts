import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  apiUrl: string = '/api/profile';

  profile = signal<any>(null);
  isLoading = signal<boolean>(false);

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.loadFromStorage();
  }

  private getUserKey(): string {
    return 'profile_' + (this.authService.getUsername() || 'guest');
  }

  private loadFromStorage() {
    const stored = localStorage.getItem(this.getUserKey());
    if (stored) {
      this.profile.set(JSON.parse(stored));
    }
  }

  private saveToStorage() {
    localStorage.setItem(this.getUserKey(), JSON.stringify(this.profile()));
  }

  loadProfile() {
    this.isLoading.set(true);
    const userId = this.authService.getUsername();

    this.http.get<any>(`${this.apiUrl}/${userId}`).subscribe({
      next: (data) => {
        this.profile.set(data);
        this.saveToStorage();
        this.isLoading.set(false);
      },
      error: () => {
        const stored = localStorage.getItem(this.getUserKey());
        if (stored) {
          this.profile.set(JSON.parse(stored));
        } else {
          this.profile.set({
            id: userId,
            firstName: 'User',
            lastName: 'Name',
            email: userId + '@example.com',
            phone: '+1 555-000-0000',
            preferences: {
              theme: 'dark',
              notifications: true,
              language: 'English',
              currency: 'USD'
            },
            address: {
              street: '',
              city: '',
              state: '',
              zipCode: '',
              country: ''
            }
          });
        }
        this.isLoading.set(false);
      }
    });
  }

  updateProfile(data: any) {
    const userId = this.authService.getUsername();

    this.http.put<any>(`${this.apiUrl}/${userId}`, data).subscribe({
      next: (updated) => {
        this.profile.set(updated);
        this.saveToStorage();
      },
      error: () => {
        this.profile.update(p => {
          const updated = { ...p, ...data };
          localStorage.setItem(this.getUserKey(), JSON.stringify(updated));
          return updated;
        });
      }
    });
  }

  updatePreferences(prefs: any) {
    this.profile.update(p => {
      const updated = {
        ...p,
        preferences: { ...p.preferences, ...prefs }
      };
      localStorage.setItem(this.getUserKey(), JSON.stringify(updated));
      return updated;
    });

    const userId = this.authService.getUsername();
    this.http.put<any>(`${this.apiUrl}/${userId}/preferences`, prefs).subscribe({});
  }
}