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
  displayName = signal<string>('User');

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
    this.displayName.set(this.authService.getUsername() || 'User');
    window.addEventListener('profile-updated', ((event: Event) => {
      const profile = (event as CustomEvent).detail;
      this.displayName.set(profile?.name || this.authService.getUsername() || 'User');
    }) as EventListener);
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
    const range = this.selectedRange();

    switch (role) {
      case 'USER':
        this.userDashboard.set(this.dashboardService.applyRangeToDashboard(role, data as UserDashboardDto, range));
        break;
      case 'CORPORATE':
        this.corporateDashboard.set(
          this.dashboardService.applyRangeToDashboard(
            role,
            this.completeCorporateDashboard(data as CorporateDashboardDto),
            range
          )
        );
        break;
      case 'ADMIN':
        this.adminDashboard.set(
          this.dashboardService.applyRangeToDashboard(
            role,
            this.completeAdminDashboard(data as AdminDashboardDto),
            range
          )
        );
        break;
    }
  }

  private loadFallbackData(role: DashboardRole) {
    const range = this.selectedRange();

    switch (role) {
      case 'USER':
        this.userDashboard.set(
          this.dashboardService.applyRangeToDashboard(
            role,
            this.dashboardService.getUserDashboardFallback(),
            range
          )
        );
        break;
      case 'CORPORATE':
        this.corporateDashboard.set(
          this.dashboardService.applyRangeToDashboard(
            role,
            this.dashboardService.getCorporateDashboardFallback(),
            range
          )
        );
        break;
      case 'ADMIN':
        this.adminDashboard.set(
          this.dashboardService.applyRangeToDashboard(
            role,
            this.dashboardService.getAdminDashboardFallback(),
            range
          )
        );
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
    return `${this.getGreeting()}, ${this.displayName()}`;
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

  private completeCorporateDashboard(data: CorporateDashboardDto): CorporateDashboardDto {
    const fallback = this.dashboardService.getCorporateDashboardFallback();
    const products = data.topProducts?.products || [];

    return {
      ...fallback,
      ...data,
      topProducts: {
        title: data.topProducts?.title || fallback.topProducts.title,
        products: this.mergeByName(products, fallback.topProducts.products, 'name')
          .sort((a, b) => (b.sales || 0) - (a.sales || 0) || (b.revenue || 0) - (a.revenue || 0))
          .slice(0, 14)
      },
      customerSegments: this.mergeByName(data.customerSegments || [], fallback.customerSegments || [], 'name').slice(0, 14),
      reviewInsights: this.mergeByName(data.reviewInsights || [], fallback.reviewInsights || [], 'label').slice(0, 14),
      fulfillmentInsights: this.mergeByName(data.fulfillmentInsights || [], fallback.fulfillmentInsights || [], 'label').slice(0, 14),
      inventoryAlerts: this.mergeByName(data.inventoryAlerts || [], fallback.inventoryAlerts || [], 'title').slice(0, 14)
    };
  }

  private completeAdminDashboard(data: AdminDashboardDto): AdminDashboardDto {
    const fallback = this.dashboardService.getAdminDashboardFallback();

    return {
      ...fallback,
      ...data,
      storeComparisons: this.mergeByName(data.storeComparisons || [], fallback.storeComparisons || [], 'storeName').slice(0, 14),
      auditActivities: this.mergeByName(data.auditActivities || [], fallback.auditActivities || [], 'action').slice(0, 14),
      systemInsights: this.mergeByName(data.systemInsights || [], fallback.systemInsights || [], 'label').slice(0, 14)
    };
  }

  private mergeByName<T>(items: T[], fallbackItems: T[], key: keyof T): T[] {
    const merged = [...items];
    const names = new Set(merged.map(item => String(item[key]).toLowerCase()));

    for (const item of fallbackItems) {
      const name = String(item[key]).toLowerCase();
      if (!names.has(name)) {
        merged.push(item);
      }
    }

    return merged;
  }
}
