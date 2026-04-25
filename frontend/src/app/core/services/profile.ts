import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { AuthService } from './auth';

export interface ProfileAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface ProfilePreferences {
  theme: 'dark' | 'light';
  notifications: boolean;
  language: string;
  currency: string;
}

export interface UserProfile {
  id: number | string | null;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  role?: string;
  address: ProfileAddress;
  preferences: ProfilePreferences;
}

export type ProfileUpdateRequest = Partial<
  Pick<UserProfile, 'firstName' | 'lastName' | 'name' | 'email' | 'phone' | 'address' | 'preferences'>
>;

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private readonly apiUrl = '/api/profile';

  profile = signal<UserProfile | null>(null);
  isLoading = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  errorMessage = signal<string>('');

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.loadCachedProfile();
  }

  loadProfile(): Observable<UserProfile> {
    this.isLoading.set(true);
    this.errorMessage.set('');

    return this.http.get<UserProfile>(`${this.apiUrl}/me`).pipe(
      tap((data) => this.setProfile(data)),
      catchError((error) => {
        const cached = this.getCachedProfile();
        if (cached) {
          this.profile.set(cached);
          this.errorMessage.set('Backend profile endpoint is unavailable. Showing last loaded profile.');
        } else {
          this.profile.set(null);
          this.errorMessage.set('Profile could not be loaded from the backend.');
        }
        return throwError(() => error);
      }),
      finalize(() => this.isLoading.set(false))
    );
  }

  updateProfile(data: ProfileUpdateRequest): Observable<UserProfile> {
    this.isSaving.set(true);
    this.errorMessage.set('');

    return this.http.put<UserProfile>(`${this.apiUrl}/me`, data).pipe(
      tap((updated) => this.setProfile(updated)),
      catchError((error) => {
        this.errorMessage.set('Profile was not saved. Please try again when the backend is available.');
        return throwError(() => error);
      }),
      finalize(() => this.isSaving.set(false))
    );
  }

  updatePreferences(prefs: Partial<ProfilePreferences>): Observable<UserProfile> {
    this.isSaving.set(true);
    this.errorMessage.set('');

    return this.http.patch<UserProfile>(`${this.apiUrl}/me/preferences`, prefs).pipe(
      tap((updated) => this.setProfile(updated)),
      catchError((error) => {
        this.errorMessage.set('Preferences were not saved. Please try again when the backend is available.');
        return throwError(() => error);
      }),
      finalize(() => this.isSaving.set(false))
    );
  }

  private setProfile(data: Partial<UserProfile>) {
    const normalized = this.normalizeProfile(data);
    this.profile.set(normalized);
    localStorage.setItem(this.getCacheKey(), JSON.stringify(normalized));
    if (normalized.name) localStorage.setItem('username', normalized.name);
    if (normalized.email) localStorage.setItem('email', normalized.email);
    window.dispatchEvent(new CustomEvent('profile-updated', { detail: normalized }));
  }

  private loadCachedProfile() {
    const cached = this.getCachedProfile();
    if (cached) {
      this.profile.set(cached);
    }
  }

  private getCachedProfile(): UserProfile | null {
    const stored = localStorage.getItem(this.getCacheKey());
    if (!stored) {
      return null;
    }

    try {
      return this.normalizeProfile(JSON.parse(stored));
    } catch {
      return null;
    }
  }

  private getCacheKey(): string {
    return `profile_${this.authService.getUserId() || this.authService.getEmail() || this.authService.getUsername() || 'guest'}`;
  }

  private normalizeProfile(data: Partial<UserProfile>): UserProfile {
    const fullName = data.name || `${data.firstName || ''} ${data.lastName || ''}`.trim();
    const splitName = fullName.split(' ').filter(Boolean);
    const firstName = data.firstName || splitName[0] || '';
    const lastName = data.lastName || splitName.slice(1).join(' ');

    return {
      id: data.id ?? this.authService.getUserId() ?? null,
      firstName,
      lastName,
      name: fullName || `${firstName} ${lastName}`.trim(),
      email: data.email || this.authService.getEmail() || '',
      phone: data.phone || '',
      role: data.role || this.authService.getRole() || undefined,
      address: {
        street: data.address?.street || '',
        city: data.address?.city || '',
        state: data.address?.state || '',
        zipCode: data.address?.zipCode || '',
        country: data.address?.country || ''
      },
      preferences: {
        theme: data.preferences?.theme || 'dark',
        notifications: data.preferences?.notifications ?? true,
        language: data.preferences?.language || 'English',
        currency: data.preferences?.currency || 'USD'
      }
    };
  }
}
