import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private http: HttpClient, private router: Router) { }
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
    this.router.navigate(['/LoginPage']);
  }
  isLoggedIn(){
    if(localStorage.getItem('token')){
      return true;
    }
    return false;

  }
  getToken(){
    return localStorage.getItem('token');
  }
  getRole(){
    return localStorage.getItem('role');
  }
  getUsername(){
    return localStorage.getItem('username');
  }
}
