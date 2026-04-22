import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsService } from '../../../../core/services/analytics';
import { PlotlyModule } from 'angular-plotly.js';

@Component({
  selector: 'app-analytics-page',
  standalone: true,
  imports: [CommonModule, PlotlyModule],
  templateUrl: './analytics-page.html',
  styleUrl: './analytics-page.scss'
})
export class AnalyticsPage implements OnInit {
  analyticsData = signal<any>(null);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string>('');

  revenueData = computed(() => [{
    x: this.analyticsData()?.revenueTrend?.map((d: any) => d.month) || [],
    y: this.analyticsData()?.revenueTrend?.map((d: any) => d.revenue) || [],
    type: 'scatter'
  }]);

  categoryData = computed(() => [{
    values: this.analyticsData()?.categoryDistribution?.map((d: any) => d.percentage) || [],
    labels: this.analyticsData()?.categoryDistribution?.map((d: any) => d.label) || [],
    type: 'pie'
  }]);

  constructor(private analyticsService: AnalyticsService) { }

  ngOnInit() {
    this.loadAnalytics();
  }

  loadAnalytics() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.analyticsService.getOverview().subscribe({
      next: (data) => {
        this.analyticsData.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Could not load analytics from API. Showing demo data.');
        this.isLoading.set(false);

        // Setup fallback mockup data for demonstration if backend fails
        this.analyticsData.set({
          returnRate: 3.2,
          averageOrderValue: 125.50,
          categoryDistribution: [
            { label: 'Electronics', percentage: 45 },
            { label: 'Furniture', percentage: 25 },
            { label: 'Apparel', percentage: 20 },
            { label: 'Kitchen', percentage: 10 }
          ],
          revenueTrend: [
            { month: 'Jan', revenue: 32000 },
            { month: 'Feb', revenue: 38000 },
            { month: 'Mar', revenue: 45000 },
            { month: 'Apr', revenue: 41000 },
            { month: 'May', revenue: 52000 },
            { month: 'Jun', revenue: 61000 }
          ]
        });
      }
    });
  }
}
