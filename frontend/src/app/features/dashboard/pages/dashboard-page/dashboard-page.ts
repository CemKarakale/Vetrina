import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../../../core/services/dashboard';
import { AuthService } from '../../../../core/services/auth';
import {
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

  isUser = computed(() => this.userRole() === 'USER');
  isCorporate = computed(() => this.userRole() === 'CORPORATE');
  isAdmin = computed(() => this.userRole() === 'ADMIN');

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

    this.dashboardService.getDashboardData(role as DashboardRole).subscribe({
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
}