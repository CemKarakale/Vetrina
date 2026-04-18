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

  onLogin() {
    this.errorMessage.set('');
    this.authService.login(this.email, this.password).subscribe({
      next: (response: any) => {
        localStorage.setItem('token', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
        localStorage.setItem('role', response.role);
        localStorage.setItem('username', response.name);

        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.errorMessage.set('Login failed');
      }
    });
  }
}