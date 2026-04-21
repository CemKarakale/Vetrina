import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-sidebar',
  imports: [RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  menuItems = [
    { icon: '🏠', label: 'Dashboard', path: '/dashboard' },
    { icon: '📉', label: 'Analytics', path: '/analytics' },
    { icon: '🛒', label: 'Orders', path: '/orders' },
    { icon: '📦', label: 'Products', path: '/products' },
  ];

  managementItems = [
    { icon: '👥', label: 'Customers', path: '/customers' },
    { icon: '🏪', label: 'Store Settings', path: '/settings' },
    { icon: '🚚', label: 'Shipments', path: '/shipments' },
    { icon: '⭐', label: 'Reviews', path: '/reviews' },
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  // Logs out and redirects to login page
  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
