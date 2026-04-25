import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header implements OnInit {
  userName = 'User';
  pageTitle = 'Dashboard';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Get the stored username from login
    this.userName = this.authService.getUsername() || 'User';
    window.addEventListener('profile-updated', ((event: Event) => {
      const profile = (event as CustomEvent).detail;
      this.userName = profile?.name || this.authService.getUsername() || 'User';
    }) as EventListener);

    // Update page title based on current route
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event) => {
      this.updatePageTitle(event.urlAfterRedirects);
    });
  }

  // Maps the URL path to a readable page title
  private updatePageTitle(url: string) {
    const path = url.split('/')[1]; // Get the first segment
    const titles: { [key: string]: string } = {
      'dashboard': 'Dashboard',
      'products': 'Products',
      'orders': 'Orders',
      'analytics': 'Analytics',
      'customers': 'Customers',
      'shipments': 'Shipments',
      'reviews': 'Reviews',
      'settings': 'Store Settings'
    };
    this.pageTitle = titles[path] || 'Dashboard';
  }
}
