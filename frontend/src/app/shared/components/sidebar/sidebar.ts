import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-sidebar',
  imports: [RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar implements OnInit {
  menuItems: any[] = [];
  managementItems: any[] = [];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    let role = (this.authService.getRole() || 'USER').toUpperCase();

    if (role.startsWith('ROLE_')) { role = role.replace('ROLE_', ''); }
    if (role === 'INDIVIDUAL' || role === 'INDIVIDUAL_USER') { role = 'USER'; }

    const allMenuItems = [
      { icon: '🏠', label: 'Dashboard', path: '/dashboard', roles: ['ADMIN', 'CORPORATE', 'USER'] },
      { icon: '📉', label: 'Analytics', path: '/analytics', roles: ['ADMIN', 'CORPORATE'] },
      { icon: '🛒', label: 'Orders', path: '/orders', roles: ['ADMIN', 'CORPORATE', 'USER'] },
      { icon: '📦', label: 'Products', path: '/products', roles: ['ADMIN', 'CORPORATE', 'USER'] },
      { icon: '🛍️', label: 'Cart', path: '/cart', roles: ['ADMIN', 'USER'] },
    ];

    const allManagementItems = [
      { icon: '👥', label: 'Customers', path: '/customers', roles: ['ADMIN', 'CORPORATE'] },
      { icon: '🏪', label: 'Store Settings', path: '/settings', roles: ['ADMIN', 'CORPORATE'] },
      { icon: '⭐', label: 'Reviews', path: '/reviews', roles: ['ADMIN', 'CORPORATE', 'USER'] },
    ];

    this.menuItems = allMenuItems.filter(item => item.roles.includes(role));
    this.managementItems = allManagementItems.filter(item => item.roles.includes(role));
  }

  // Logs out and redirects to login page
  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
