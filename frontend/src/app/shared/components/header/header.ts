import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SearchService } from '../../../core/services/search';
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
    private searchService: SearchService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Get the stored username from login
    this.userName = this.authService.getUsername() || 'User';

    // Update page title based on current route
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event) => {
      this.updatePageTitle(event.urlAfterRedirects);
      // Clear search when navigating to a different page
      this.searchService.clear();
    });
  }

  // Called when the user types in the search bar
  onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchService.updateSearch(input.value);
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
