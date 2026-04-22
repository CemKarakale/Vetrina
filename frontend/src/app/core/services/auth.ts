import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface CurrentUser {
  id: number;
  role: string;
  username: string;
  email: string;
  storeId?: number;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private http: HttpClient) { }
  login(email: string, password: string) {
    return this.http.post('/api/auth/login', {
      email: email,
      password: password
    })
  }
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    localStorage.removeItem('storeId');
  }
  isLoggedIn() {
    if (localStorage.getItem('token')) {
      return true;
    }
    return false;
  }
  getToken() {
    return localStorage.getItem('token');
  }
  getRole() {
    return localStorage.getItem('role');
  }
  getUsername() {
    return localStorage.getItem('username');
  }
  getCurrentUser(): CurrentUser | null {
    const role = localStorage.getItem('role');
    const username = localStorage.getItem('username');
    const userId = localStorage.getItem('userId');
    const storeId = localStorage.getItem('storeId');

    if (!role || !username) {
      return null;
    }

    return {
      id: userId ? Number(userId) : 1,
      role: role,
      username: username,
      email: '',
      storeId: storeId ? Number(storeId) : undefined
    };
  }
}
