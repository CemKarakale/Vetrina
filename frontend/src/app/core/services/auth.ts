import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

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
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    localStorage.removeItem('storeId');
    localStorage.removeItem('email');
    //check login or do all that in login
    //
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

  getUserId() {
    return localStorage.getItem('userId');
  }

  getStoreId() {
    return localStorage.getItem('storeId');
  }

  getEmail() {
    return localStorage.getItem('email');
  }

  getCurrentUser() {
    return {
      token: this.getToken(),
      role: this.getRole(),
      username: this.getUsername(),
      userId: this.getUserId(),
      storeId: this.getStoreId(),
      email: this.getEmail()
    };
  }
}
