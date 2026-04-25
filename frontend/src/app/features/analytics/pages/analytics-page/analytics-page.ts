import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnalyticsService } from '../../../../core/services/analytics';
import { DashboardService } from '../../../../core/services/dashboard';
import { AuthService } from '../../../../core/services/auth';
import { ChartWidgetComponent } from '../../../../shared/components/widgets';
import { ChartWidgetData } from '../../../dashboard/models/widget.model';
import { DashboardRole } from '../../../dashboard/models/widget.model';

@Component({
  selector: 'app-analytics-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ChartWidgetComponent],
  templateUrl: './analytics-page.html',
  styleUrl: './analytics-page.scss'
})
export class AnalyticsPage implements OnInit {
  analyticsData = signal<any>(null);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string>('');
  dateFrom = signal<string>('');
  dateTo = signal<string>('');
  drilldownType = signal<'revenue' | 'category' | 'products'>('revenue');
  productDrilldownRows = signal<any[]>([]);
  revenueChart = computed<ChartWidgetData>(() => ({
    title: 'Revenue Trends',
    type: 'line',
    color: '#6aa6b8',
    data: (this.analyticsData()?.revenueTrend ?? []).map((item: any) => ({
      label: item.month,
      value: item.revenue
    }))
  }));
  categoryChart = computed<ChartWidgetData>(() => ({
    title: 'Category Distribution',
    type: 'pie',
    data: (this.analyticsData()?.categoryDistribution ?? []).map((item: any) => ({
      label: item.label,
      value: item.percentage
    }))
  }));
  revenueRows = computed(() => (this.analyticsData()?.revenueTrend ?? []).map((item: any) => ({
    label: item.month || item.label || item.date,
    revenue: Number(item.revenue || item.value || 0),
    orders: this.getEstimatedOrders(item),
    averageOrderValue: this.getEstimatedAverageOrderValue(item)
  })));
  categoryRows = computed(() => (this.analyticsData()?.categoryDistribution ?? []).map((item: any) => ({
    label: item.label,
    percentage: Number(item.percentage || item.value || 0),
    revenue: Number(item.revenue || 0),
    orders: Number(item.orders ?? item.orderCount ?? this.getOrdersFromPercentage(item))
  })));
  productRows = computed(() => {
    const topProducts = this.analyticsData()?.topProducts;
    return topProducts?.length ? topProducts : this.productDrilldownRows();
  });

  constructor(
    private analyticsService: AnalyticsService,
    private dashboardService: DashboardService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadAnalytics();
  }

  loadAnalytics() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.analyticsService.getOverview(this.dateFrom(), this.dateTo()).subscribe({
      next: (data) => {
        this.analyticsData.set(this.normalizeAnalyticsData(data));
        this.loadTopProducts();
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Could not load analytics from API. Showing demo data.');
        this.isLoading.set(false);
        
        // Setup fallback mockup data for demonstration if backend fails
        this.analyticsData.set(this.normalizeAnalyticsData({
           returnRate: 3.2,
           averageOrderValue: 125.50,
           totalRevenue: 269000,
           totalOrders: 2143,
           totalCustomers: 812,
           totalReviews: 486,
           categoryDistribution: [
             { label: 'Electronics', percentage: 45, revenue: 121050, orders: 842 },
             { label: 'Furniture', percentage: 25, revenue: 67250, orders: 391 },
             { label: 'Apparel', percentage: 20, revenue: 53800, orders: 615 },
             { label: 'Kitchen', percentage: 10, revenue: 26900, orders: 295 }
           ],
           revenueTrend: [
             { month: 'Jan', revenue: 32000, orders: 244, averageOrderValue: 131 },
             { month: 'Feb', revenue: 38000, orders: 302, averageOrderValue: 126 },
             { month: 'Mar', revenue: 45000, orders: 351, averageOrderValue: 128 },
             { month: 'Apr', revenue: 41000, orders: 330, averageOrderValue: 124 },
             { month: 'May', revenue: 52000, orders: 408, averageOrderValue: 127 },
             { month: 'Jun', revenue: 61000, orders: 508, averageOrderValue: 120 }
           ],
           topProducts: [
             { id: 1, name: 'Wireless Noise-Canceling Headphones', revenue: 68400, sales: 342 },
             { id: 2, name: 'Smart Fitness Watch', revenue: 51200, sales: 256 },
             { id: 3, name: 'Professional Blender', revenue: 29700, sales: 198 }
           ]
        }));
        this.loadTopProducts();
      }
    });
  }

  applyDateRange() {
    this.loadAnalytics();
  }

  clearDateRange() {
    this.dateFrom.set('');
    this.dateTo.set('');
    this.loadAnalytics();
  }

  private getEstimatedOrders(item: any): number {
    const explicit = Number(item.orders ?? item.orderCount ?? 0);
    if (explicit) return explicit;

    const data = this.analyticsData();
    const totalOrders = Number(data?.totalOrders || 0);
    const totalRevenue = Number(data?.totalRevenue || 0);
    const revenue = Number(item.revenue || item.value || 0);
    if (!totalOrders || !totalRevenue || !revenue) return 0;

    return Math.round((revenue / totalRevenue) * totalOrders);
  }

  private getEstimatedAverageOrderValue(item: any): number {
    const explicit = Number(item.averageOrderValue ?? item.aov ?? 0);
    if (explicit) return explicit;

    const revenue = Number(item.revenue || item.value || 0);
    const orders = this.getEstimatedOrders(item);
    return orders ? revenue / orders : 0;
  }

  private getOrdersFromPercentage(item: any): number {
    const totalOrders = Number(this.analyticsData()?.totalOrders || 0);
    const percentage = Number(item.percentage || item.value || 0);
    return totalOrders && percentage ? Math.round(totalOrders * (percentage / 100)) : 0;
  }

  private normalizeAnalyticsData(data: any): any {
    const revenueTrend = data?.revenueTrend ?? [];
    const categoryDistribution = data?.categoryDistribution ?? [];
    const totalRevenue = Number(data?.totalRevenue ?? revenueTrend.reduce((sum: number, item: any) => sum + Number(item.revenue || item.value || 0), 0));
    const totalOrders = Number(data?.totalOrders ?? data?.completedOrders ?? 0);
    const averageOrderValue = Number(data?.averageOrderValue ?? (totalOrders ? totalRevenue / totalOrders : 0));

    return {
      ...data,
      totalRevenue,
      totalOrders,
      averageOrderValue,
      returnRate: Number(data?.returnRate ?? 0),
      categoryDistribution,
      revenueTrend,
      topProducts: data?.topProducts
    };
  }

  private loadTopProducts() {
    const role = this.normalizeRole(this.authService.getRole());
    if (role !== 'CORPORATE' && role !== 'ADMIN') return;

    this.dashboardService.getDashboardData(role as DashboardRole, '30d').subscribe({
      next: (dashboard: any) => {
        const products = dashboard?.topProducts?.products || [];
        this.productDrilldownRows.set(products);
      },
      error: () => {
        this.productDrilldownRows.set([]);
      }
    });
  }

  private normalizeRole(role: string | null): string {
    const normalized = String(role || 'USER').replace('ROLE_', '').toUpperCase();
    if (normalized === 'INDIVIDUAL' || normalized === 'INDIVIDUAL_USER') return 'USER';
    if (normalized === 'CORPORATE' || normalized === 'ADMIN') return normalized;
    return 'USER';
  }
}
