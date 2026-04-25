import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../../../core/services/dashboard';
import { AuthService } from '../../../../core/services/auth';
import {
  DashboardAlert,
  DashboardInsight,
  DashboardRange,
  DashboardRole,
  UserDashboardDto,
  CorporateDashboardDto,
  AdminDashboardDto
} from '../../models/widget.model';
import {
  StatCardComponent,
  ChartWidgetComponent,
  SpendingWidgetComponent,
  TopProductsWidgetComponent,
  RecentActivityWidgetComponent
} from '../../../../shared/components/widgets';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    StatCardComponent,
    ChartWidgetComponent,
    SpendingWidgetComponent,
    TopProductsWidgetComponent,
    RecentActivityWidgetComponent
  ],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
})
export class DashboardPage implements OnInit {
  userDashboard = signal<UserDashboardDto | null>(null);
  corporateDashboard = signal<CorporateDashboardDto | null>(null);
  adminDashboard = signal<AdminDashboardDto | null>(null);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string>('');

  userRole = signal<DashboardRole>('USER');
  selectedRange = signal<DashboardRange>('30d');

  isUser = computed(() => this.userRole() === 'USER');
  isCorporate = computed(() => this.userRole() === 'CORPORATE');
  isAdmin = computed(() => this.userRole() === 'ADMIN');
  rangeLabel = computed(() => this.getRangeLabel(this.selectedRange()));

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadDashboard();
  }

  loadDashboard() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    let role = (this.authService.getRole() || 'USER').toUpperCase();
    if (role.startsWith('ROLE_')) { role = role.replace('ROLE_', ''); }
    if (role === 'INDIVIDUAL' || role === 'INDIVIDUAL_USER') { role = 'USER'; }
    if (role !== 'USER' && role !== 'CORPORATE' && role !== 'ADMIN') { role = 'USER'; }

    this.userRole.set(role as DashboardRole);

    this.dashboardService.getDashboardData(role as DashboardRole, this.selectedRange()).subscribe({
      next: (data) => {
        this.setDashboardData(role as DashboardRole, data);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Could not load dashboard data. Showing demo data.');
        this.loadFallbackData(role as DashboardRole);
        this.isLoading.set(false);
      }
    });
  }

  changeRange(range: DashboardRange) {
    this.selectedRange.set(range);
    this.loadDashboard();
  }

  private setDashboardData(role: DashboardRole, data: any) {
    switch (role) {
      case 'USER':
        this.userDashboard.set(data as UserDashboardDto);
        break;
      case 'CORPORATE':
        this.corporateDashboard.set(data as CorporateDashboardDto);
        break;
      case 'ADMIN':
        this.adminDashboard.set(data as AdminDashboardDto);
        break;
    }
  }

  private loadFallbackData(role: DashboardRole) {
    switch (role) {
      case 'USER':
        this.userDashboard.set(this.dashboardService.getUserDashboardFallback());
        break;
      case 'CORPORATE':
        this.corporateDashboard.set(this.dashboardService.getCorporateDashboardFallback());
        break;
      case 'ADMIN':
        this.adminDashboard.set(this.dashboardService.getAdminDashboardFallback());
        break;
    }
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  getWelcomeMessage(): string {
    const username = this.authService.getUsername() || 'User';
    return `${this.getGreeting()}, ${username}`;
  }

  getRoleDescription(): string {
    if (this.isAdmin()) return 'Platform analytics, store governance, audit monitoring, and cross-store reporting';
    if (this.isCorporate()) return 'Store KPIs, inventory health, order fulfillment, customer insights, and revenue reporting';
    return 'Personal spending analytics, order history, shipment status, and review activity';
  }

  getRangeLabel(range: DashboardRange): string {
    const labels: Record<DashboardRange, string> = {
      '7d': 'Last 7 days',
      '30d': 'Last 30 days',
      '90d': 'Last 90 days'
    };

    return labels[range];
  }

  getInsights(): DashboardInsight[] {
    if (this.isAdmin()) return this.adminDashboard()?.systemInsights || [];
    if (this.isCorporate()) return this.corporateDashboard()?.fulfillmentInsights || [];
    return this.userDashboard()?.personalInsights || [];
  }

  getAlerts(): DashboardAlert[] {
    if (this.isCorporate()) return this.corporateDashboard()?.inventoryAlerts || [];
    if (this.isUser()) return this.userDashboard()?.shipmentAlerts || [];
    return [];
  }
}
