import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../../../core/services/dashboard';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
})
export class DashboardPage implements OnInit {
  summary = signal<any>(null);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string>('');

  constructor(private dashboardService: DashboardService) {}

  ngOnInit() {
    this.loadSummary();
  }

  loadSummary() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.dashboardService.getSummary().subscribe({
      next: (data) => {
        this.summary.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Could not load dashboard data');
        this.isLoading.set(false);
        
        // Setup fallback mockup data for demonstration if backend fails
        this.summary.set({
           totalRevenue: 48294,
           totalOrders: 1842,
           totalCustomers: 3421,
           avgRating: 4.8
        });
      }
    });
  }
}
