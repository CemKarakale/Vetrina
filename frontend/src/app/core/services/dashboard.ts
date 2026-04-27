import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AdminDashboardDto,
  ChartWidgetData,
  DashboardData,
  CorporateDashboardDto,
  DashboardRange,
  DashboardRole,
  SpendingCategory,
  StatWidgetData,
  TopProduct,
  UserDashboardDto
} from '../../features/dashboard/models/widget.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  constructor(private http: HttpClient) {}

  getDashboardData(role: DashboardRole, range: DashboardRange = '30d'): Observable<any> {
    const endpoints: Record<DashboardRole, string> = {
      USER: '/api/dashboard/user',
      CORPORATE: '/api/dashboard/corporate',
      ADMIN: '/api/dashboard/admin'
    };

    const params = new HttpParams().set('range', range);
    return this.http.get<any>(endpoints[role], { params });
  }

  applyRangeToDashboard<T extends DashboardData>(role: DashboardRole, dashboard: T, range: DashboardRange): T {
    switch (role) {
      case 'USER':
        return this.applyUserRange(dashboard as UserDashboardDto, range) as T;
      case 'CORPORATE':
        return this.applyCorporateRange(dashboard as CorporateDashboardDto, range) as T;
      case 'ADMIN':
        return this.applyAdminRange(dashboard as AdminDashboardDto, range) as T;
    }
  }

  getUserDashboardFallback(): UserDashboardDto {
    return {
      spending: {
        title: 'Spending Overview',
        totalSpent: 2847.5,
        period: 'Last 30 Days',
        categories: [
          { category: 'Electronics', amount: 1250, percentage: 44, color: '#6aa6b8' },
          { category: 'Fashion', amount: 620, percentage: 22, color: '#efc779' },
          { category: 'Home & Garden', amount: 480.5, percentage: 17, color: '#234f4f' },
          { category: 'Books', amount: 297, percentage: 10, color: '#e79aac' },
          { category: 'Sports', amount: 200, percentage: 7, color: '#b8a5e6' }
        ]
      },
      spendingTrend: {
        title: 'Personal Spending Trend',
        type: 'line',
        color: '#6aa6b8',
        data: [
          { label: 'Jan', value: 1200 },
          { label: 'Feb', value: 1900 },
          { label: 'Mar', value: 1500 },
          { label: 'Apr', value: 2200 },
          { label: 'May', value: 2800 },
          { label: 'Jun', value: 2847 }
        ]
      },
      recentOrders: [
        { id: 1001, productName: 'Wireless Headphones Pro', amount: 199.99, date: '2 hours ago', status: 'completed' },
        { id: 1002, productName: 'Smart Watch Series 5', amount: 349.99, date: '1 day ago', status: 'completed' },
        { id: 1003, productName: 'Running Shoes Elite', amount: 129.99, date: '3 days ago', status: 'pending' },
        { id: 1004, productName: 'Mechanical Keyboard', amount: 159.99, date: '1 week ago', status: 'completed' },
        { id: 1005, productName: 'USB-C Hub 7-in-1', amount: 79.99, date: '2 weeks ago', status: 'cancelled' }
      ],
      stats: [
        { title: 'Total Spent', value: 8432, change: 12.5, changeLabel: 'vs last month', icon: '$', color: 'purple', format: 'currency' },
        { title: 'Orders', value: 28, change: 8.2, changeLabel: 'vs last month', icon: '#', color: 'orange', format: 'number' },
        { title: 'Saved', value: 156, change: 15.3, changeLabel: 'this month', icon: '%', color: 'green', format: 'number' }
      ],
      personalInsights: [
        { label: 'Most purchased category', value: 'Electronics', detail: '44% of spending in this period', status: 'neutral' },
        { label: 'Average order value', value: '$301', detail: 'Based on the last 28 orders', status: 'good' },
        { label: 'Review activity', value: '6 reviews', detail: 'Average rating: 4.6 out of 5', status: 'good' }
      ],
      shipmentAlerts: [
        { title: 'In transit', detail: '2 orders are currently being shipped', severity: 'info' },
        { title: 'Delivery attention', detail: '1 shipment has no recent tracking update', severity: 'warning' }
      ]
    };
  }

  private applyUserRange(dashboard: UserDashboardDto, range: DashboardRange): UserDashboardDto {
    return {
      ...dashboard,
      spending: {
        ...dashboard.spending,
        period: this.getRangeLabel(range),
        totalSpent: this.scaleMoney(dashboard.spending.totalSpent, range),
        categories: this.scaleSpendingCategories(dashboard.spending.categories, range)
      },
      spendingTrend: this.projectChart(dashboard.spendingTrend, range),
      recentOrders: this.limitByRange(dashboard.recentOrders, range),
      stats: dashboard.stats.map(stat => this.projectStat(stat, range)),
      personalInsights: dashboard.personalInsights?.map(insight => ({
        ...insight,
        detail: insight.detail.replace(/this period|last \d+ orders|This week/gi, this.getRangeLabel(range).toLowerCase())
      }))
    };
  }

  private applyCorporateRange(dashboard: CorporateDashboardDto, range: DashboardRange): CorporateDashboardDto {
    return {
      ...dashboard,
      revenue: this.projectStat(dashboard.revenue, range),
      orders: this.projectStat(dashboard.orders, range),
      products: this.projectStat(dashboard.products, range),
      conversionRate: this.projectStat(dashboard.conversionRate, range),
      revenueChart: this.projectChart(dashboard.revenueChart, range),
      topProducts: {
        ...dashboard.topProducts,
        products: dashboard.topProducts.products.map(product => this.projectProduct(product, range))
      },
      fulfillmentInsights: dashboard.fulfillmentInsights?.map(insight => this.projectInsight(insight, range)),
      inventoryAlerts: dashboard.inventoryAlerts?.map(alert => ({
        ...alert,
        detail: this.projectTextCount(alert.detail, range)
      })),
      customerSegments: dashboard.customerSegments?.map(segment => ({
        ...segment,
        customers: this.scaleCount(segment.customers, range),
        averageSpend: this.scaleMoney(segment.averageSpend, range)
      }))
    };
  }

  private applyAdminRange(dashboard: AdminDashboardDto, range: DashboardRange): AdminDashboardDto {
    return {
      ...dashboard,
      totalRevenue: this.projectStat(dashboard.totalRevenue, range),
      totalOrders: this.projectStat(dashboard.totalOrders, range),
      totalUsers: this.projectStat(dashboard.totalUsers, range),
      totalStores: this.projectStat(dashboard.totalStores, range),
      platformRevenueChart: this.projectChart(dashboard.platformRevenueChart, range),
      userGrowthChart: this.projectChart(dashboard.userGrowthChart, range),
      storeComparisons: dashboard.storeComparisons?.map(store => ({
        ...store,
        revenue: this.scaleMoney(store.revenue, range),
        orders: this.scaleCount(store.orders, range)
      })),
      auditActivities: this.limitByRange(dashboard.auditActivities || [], range),
      systemInsights: dashboard.systemInsights?.map(insight => this.projectInsight(insight, range))
    };
  }

  private projectStat(stat: StatWidgetData, range: DashboardRange): StatWidgetData {
    if (this.isRateOrInventoryStat(stat)) {
      return {
        ...stat,
        changeLabel: this.getComparisonLabel(range)
      };
    }

    return {
      ...stat,
      value: stat.format === 'currency'
        ? this.scaleMoney(stat.value, range)
        : this.scaleCount(stat.value, range),
      change: this.projectChange(stat.change, range),
      changeLabel: this.getComparisonLabel(range)
    };
  }

  private projectChart(chart: ChartWidgetData, range: DashboardRange): ChartWidgetData {
    if (chart.type === 'pie') return chart;

    const labels = this.getChartLabels(range);
    const source = chart.data.length ? chart.data : [{ label: '', value: 0 }];

    return {
      ...chart,
      data: labels.map((label, index) => {
        const sourcePoint = source[Math.min(index, source.length - 1)] || source[index % source.length];
        const wave = 0.88 + (index % 4) * 0.08;

        return {
          label,
          value: this.roundNumber(this.scaleMoney(sourcePoint.value * wave, range) / labels.length)
        };
      })
    };
  }

  private projectProduct(product: TopProduct, range: DashboardRange): TopProduct {
    return {
      ...product,
      sales: this.scaleCount(product.sales, range),
      revenue: this.scaleMoney(product.revenue, range)
    };
  }

  private scaleSpendingCategories(categories: SpendingCategory[], range: DashboardRange): SpendingCategory[] {
    return categories.map(category => ({
      ...category,
      amount: this.scaleMoney(category.amount, range)
    }));
  }

  private projectInsight<T extends { value: string; detail: string }>(insight: T, range: DashboardRange): T {
    return {
      ...insight,
      value: this.projectTextCount(insight.value, range),
      detail: this.projectTextCount(insight.detail, range)
    };
  }

  private projectTextCount(text: string, range: DashboardRange): string {
    return text.replace(/\d+(?:,\d+)*(?:\.\d+)?/g, match => {
      const numeric = Number(match.replace(/,/g, ''));
      if (!Number.isFinite(numeric)) return match;

      const projected = numeric % 1 === 0 ? this.scaleCount(numeric, range) : this.roundNumber(numeric);
      return projected.toLocaleString('en-US');
    });
  }

  private limitByRange<T>(items: T[], range: DashboardRange): T[] {
    const limits: Record<DashboardRange, number> = {
      '7d': 3,
      '30d': 5,
      '90d': 10
    };

    return items.slice(0, limits[range]);
  }

  private scaleMoney(value: number, range: DashboardRange): number {
    return this.roundNumber(value * this.getRangeFactor(range));
  }

  private scaleCount(value: number, range: DashboardRange): number {
    return Math.max(0, Math.round(value * this.getRangeFactor(range)));
  }

  private projectChange(change: number | undefined, range: DashboardRange): number | undefined {
    if (change === undefined) return undefined;

    const multipliers: Record<DashboardRange, number> = {
      '7d': 0.65,
      '30d': 1,
      '90d': 1.35
    };

    return this.roundNumber(change * multipliers[range]);
  }

  private getRangeFactor(range: DashboardRange): number {
    const factors: Record<DashboardRange, number> = {
      '7d': 7 / 30,
      '30d': 1,
      '90d': 3
    };

    return factors[range];
  }

  private getRangeLabel(range: DashboardRange): string {
    const labels: Record<DashboardRange, string> = {
      '7d': 'Last 7 Days',
      '30d': 'Last 30 Days',
      '90d': 'Last 90 Days'
    };

    return labels[range];
  }

  private getComparisonLabel(range: DashboardRange): string {
    const labels: Record<DashboardRange, string> = {
      '7d': 'vs previous 7 days',
      '30d': 'vs last month',
      '90d': 'vs previous 90 days'
    };

    return labels[range];
  }

  private getChartLabels(range: DashboardRange): string[] {
    const labels: Record<DashboardRange, string[]> = {
      '7d': ['D-6', 'D-5', 'D-4', 'D-3', 'D-2', 'Yesterday', 'Today'],
      '30d': ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      '90d': ['Month 1', 'Month 2', 'Month 3']
    };

    return labels[range];
  }

  private isRateOrInventoryStat(stat: StatWidgetData): boolean {
    const title = stat.title.toLowerCase();

    return stat.format === 'percent'
      || title.includes('rate')
      || title.includes('active products')
      || title.includes('registered stores');
  }

  private roundNumber(value: number): number {
    return Math.round(value * 100) / 100;
  }

  getCorporateDashboardFallback(): CorporateDashboardDto {
    return {
      revenue: { title: 'Total Revenue', value: 128450, change: 18.7, changeLabel: 'vs last month', icon: '$', color: 'purple', format: 'currency' },
      orders: { title: 'Total Orders', value: 1842, change: 12.4, changeLabel: 'vs last month', icon: '#', color: 'orange', format: 'number' },
      products: { title: 'Active Products', value: 342, change: 5.2, changeLabel: 'new this month', icon: 'P', color: 'green', format: 'number' },
      conversionRate: { title: 'Conversion Rate', value: 3.8, change: 0.9, changeLabel: 'vs last month', icon: '%', color: 'pink', format: 'percent' },
      revenueChart: {
        title: 'Store Revenue Trend',
        type: 'line',
        color: '#234f4f',
        data: [
          { label: 'Jan', value: 32000 },
          { label: 'Feb', value: 45000 },
          { label: 'Mar', value: 38000 },
          { label: 'Apr', value: 52000 },
          { label: 'May', value: 61000 },
          { label: 'Jun', value: 58450 }
        ]
      },
      topProducts: {
        title: 'Top Products',
        products: [
          { id: 1, name: 'Wireless Headphones Pro', sales: 342, revenue: 68400 },
          { id: 2, name: 'Smart Watch Elite', sales: 256, revenue: 76800 },
          { id: 3, name: 'Bluetooth Speaker Max', sales: 198, revenue: 29700 },
          { id: 4, name: 'Laptop Stand Premium', sales: 167, revenue: 13360 },
          { id: 5, name: 'USB-C Cable 2m', sales: 512, revenue: 10240 }
        ]
      },
      categoryDistribution: {
        title: 'Sales by Category',
        type: 'pie',
        data: [
          { label: 'Electronics', value: 45 },
          { label: 'Accessories', value: 25 },
          { label: 'Apparel', value: 18 },
          { label: 'Home', value: 12 }
        ]
      },
      inventoryAlerts: [
        { title: 'Low stock', detail: '14 SKUs are below reorder threshold', severity: 'warning' },
        { title: 'Fulfillment delay', detail: '8 orders are waiting for shipment assignment', severity: 'danger' },
        { title: 'Review queue', detail: '11 customer reviews need a response', severity: 'info' }
      ],
      customerSegments: [
        { name: 'Gold members', customers: 428, averageSpend: 412, satisfaction: 92 },
        { name: 'Frequent buyers', customers: 816, averageSpend: 238, satisfaction: 87 },
        { name: 'Discount driven', customers: 594, averageSpend: 166, satisfaction: 78 }
      ],
      fulfillmentInsights: [
        { label: 'On-time fulfillment', value: '91%', detail: 'Warehouse and shipment SLA', status: 'good' },
        { label: 'Pending orders', value: '47', detail: 'Need action from store team', status: 'warning' },
        { label: 'Return pressure', value: '2.4%', detail: 'Below platform average', status: 'good' }
      ],
      reviewInsights: [
        { label: 'Average rating', value: '4.4', detail: 'Across reviewed products', status: 'good' },
        { label: 'Helpful votes', value: '1,248', detail: 'Review helpfulness signals', status: 'neutral' }
      ]
    };
  }

  getAdminDashboardFallback(): AdminDashboardDto {
    return {
      totalRevenue: { title: 'Platform Revenue', value: 1284500, change: 24.5, changeLabel: 'vs last month', icon: '$', color: 'purple', format: 'currency' },
      totalOrders: { title: 'Total Orders', value: 18420, change: 15.8, changeLabel: 'vs last month', icon: '#', color: 'orange', format: 'number' },
      totalUsers: { title: 'Active Users', value: 8432, change: 12.3, changeLabel: 'vs last month', icon: 'U', color: 'green', format: 'number' },
      totalStores: { title: 'Registered Stores', value: 156, change: 3.2, changeLabel: 'new this month', icon: 'S', color: 'pink', format: 'number' },
      platformRevenueChart: {
        title: 'Platform Revenue',
        type: 'bar',
        color: '#6aa6b8',
        data: [
          { label: 'Jan', value: 180000 },
          { label: 'Feb', value: 220000 },
          { label: 'Mar', value: 195000 },
          { label: 'Apr', value: 280000 },
          { label: 'May', value: 310000 },
          { label: 'Jun', value: 298500 }
        ]
      },
      userGrowthChart: {
        title: 'User Growth',
        type: 'line',
        color: '#234f4f',
        data: [
          { label: 'Jan', value: 5200 },
          { label: 'Feb', value: 5800 },
          { label: 'Mar', value: 6400 },
          { label: 'Apr', value: 7100 },
          { label: 'May', value: 7900 },
          { label: 'Jun', value: 8432 }
        ]
      },
      categoryDistribution: {
        title: 'Category Distribution',
        type: 'pie',
        data: [
          { label: 'Electronics', value: 42 },
          { label: 'Fashion', value: 23 },
          { label: 'Home & Garden', value: 18 },
          { label: 'Sports', value: 10 },
          { label: 'Books', value: 7 }
        ]
      },
      storeComparisons: [
        { storeName: 'North Hub Store', revenue: 214800, orders: 2842, rating: 4.7 },
        { storeName: 'Metro Electronics', revenue: 188400, orders: 2210, rating: 4.5 },
        { storeName: 'Daily Market', revenue: 143900, orders: 1988, rating: 4.2 },
        { storeName: 'Urban Apparel', revenue: 118600, orders: 1512, rating: 4.1 }
      ],
      auditActivities: [
        { actor: 'Admin Team', action: 'Opened store application for Metro Electronics', date: 'Today, 09:20', severity: 'info' },
        { actor: 'System', action: 'Flagged unusual refund activity', date: 'Yesterday, 18:05', severity: 'warning' },
        { actor: 'Security', action: 'Suspended account after repeated failed logins', date: 'Yesterday, 12:44', severity: 'danger' }
      ],
      systemInsights: [
        { label: 'Open store requests', value: '9', detail: 'Waiting for admin approval', status: 'warning' },
        { label: 'Cross-store growth', value: '+18.2%', detail: 'Weighted by revenue', status: 'good' },
        { label: 'Configuration changes', value: '3', detail: 'This week', status: 'neutral' }
      ]
    };
  }
}
