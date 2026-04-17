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
    localStorage.removeItem('role');
    localStorage.removeItem('username');
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
}
