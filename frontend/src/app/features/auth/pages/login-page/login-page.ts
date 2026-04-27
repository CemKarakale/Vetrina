import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss'
})
export class LoginPage {
  email: string = '';
  password: string = '';
  errorMessage = signal<string>('');

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  // Normal login via Spring Boot backend
  onLogin() {
    this.errorMessage.set('');
    this.authService.login(this.email, this.password).subscribe({
      next: (response: any) => {
        localStorage.setItem('token', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
        localStorage.setItem('role', response.role);
        localStorage.setItem('username', response.name);
        localStorage.setItem('email', response.email || this.email);
        if (response.userId !== undefined && response.userId !== null) {
          localStorage.setItem('userId', String(response.userId));
        }
        if (response.storeId !== undefined && response.storeId !== null) {
          localStorage.setItem('storeId', String(response.storeId));
        }

        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.errorMessage.set('Login failed. Check your email and password, then try again.');
      }
    });
  }
}
