import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  imports: [RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  menuItems = [
    { icon: '🏠', label: 'Dashboard', path: '/dashboard', isNew: false },
    { icon: '🤖', label: 'AI Assistant', path: '/ai-assistant', isNew: true },
    { icon: '📉', label: 'Analytics', path: '/analytics', isNew: false },
    { icon: '🛒', label: 'Orders', path: '/orders', isNew: false },
    { icon: '📦', label: 'Products', path: '/products', isNew: false },
  ];

  managementItems = [
    { icon: '👥', label: 'Customers', path: '/customers' },
    { icon: '🏪', label: 'Store Settings', path: '/settings' },
    { icon: '🚚', label: 'Shipments', path: '/shipments' },
    { icon: '⭐', label: 'Reviews', path: '/reviews' },
  ];
}
