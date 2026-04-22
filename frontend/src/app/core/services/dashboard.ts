import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  DashboardRole,
  UserDashboardDto,
  CorporateDashboardDto,
  AdminDashboardDto
} from '../../features/dashboard/models/widget.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  constructor(private http: HttpClient) {}

  getDashboardData(role: DashboardRole): Observable<any> {
    const endpoints: Record<DashboardRole, string> = {
      USER: '/api/dashboard/user',
      CORPORATE: '/api/dashboard/corporate',
      ADMIN: '/api/dashboard/admin'
    };

    return this.http.get<any>(endpoints[role]);
  }

  getUserDashboardFallback(): UserDashboardDto {
    return {
      spending: {
        title: 'Spending Overview',
        totalSpent: 2847.50,
        period: 'Last 30 Days',
        categories: [
          { category: 'Electronics', amount: 1250.00, percentage: 44, color: '#6a5af9' },
          { category: 'Fashion', amount: 620.00, percentage: 22, color: '#ffab00' },
          { category: 'Home & Garden', amount: 480.50, percentage: 17, color: '#00e396' },
          { category: 'Books', amount: 297.00, percentage: 10, color: '#ff477e' },
          { category: 'Sports', amount: 200.00, percentage: 7, color: '#00b8d9' }
        ]
      },
      spendingTrend: {
        title: 'Spending Trend',
        type: 'line',
        color: '#6a5af9',
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
        { title: 'Total Spent', value: 8432, change: 12.5, changeLabel: 'vs last month', icon: '💳', color: 'purple', format: 'currency' },
        { title: 'Orders', value: 28, change: 8.2, changeLabel: 'vs last month', icon: '📦', color: 'orange', format: 'number' },
        { title: 'Saved', value: 156, change: 15.3, changeLabel: 'this month', icon: '💰', color: 'green', format: 'number' }
      ]
    };
  }

  getCorporateDashboardFallback(): CorporateDashboardDto {
    return {
      revenue: { title: 'Total Revenue', value: 128450, change: 18.7, changeLabel: 'vs last month', icon: '💰', color: 'purple', format: 'currency' },
      orders: { title: 'Total Orders', value: 1842, change: 12.4, changeLabel: 'vs last month', icon: '📦', color: 'orange', format: 'number' },
      products: { title: 'Active Products', value: 342, change: 5.2, changeLabel: 'new this month', icon: '🏷️', color: 'green', format: 'number' },
      conversionRate: { title: 'Conversion Rate', value: 3.8, change: 0.9, changeLabel: 'vs last month', icon: '📊', color: 'pink', format: 'percent' },
      revenueChart: {
        title: 'Revenue Trend',
        type: 'line',
        color: '#6a5af9',
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
      }
    };
  }

  getAdminDashboardFallback(): AdminDashboardDto {
    return {
      totalRevenue: { title: 'Platform Revenue', value: 1284500, change: 24.5, changeLabel: 'vs last month', icon: '💰', color: 'purple', format: 'currency' },
      totalOrders: { title: 'Total Orders', value: 18420, change: 15.8, changeLabel: 'vs last month', icon: '📦', color: 'orange', format: 'number' },
      totalUsers: { title: 'Active Users', value: 8432, change: 12.3, changeLabel: 'vs last month', icon: '👥', color: 'green', format: 'number' },
      totalStores: { title: 'Registered Stores', value: 156, change: 3.2, changeLabel: 'new this month', icon: '🏪', color: 'pink', format: 'number' },
      platformRevenueChart: {
        title: 'Platform Revenue',
        type: 'bar',
        color: '#6a5af9',
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
        color: '#00e396',
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
      }
    };
  }
}