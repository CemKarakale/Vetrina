import { Routes } from '@angular/router';
import { LoginPage } from './features/auth/pages/login-page/login-page';
import { ProductListPage } from './features/products/pages/product-list-page/product-list-page';
import { ProductDetailPage } from './features/products/pages/product-detail-page/product-detail-page';
import { DashboardPage } from './features/dashboard/pages/dashboard-page/dashboard-page';
import { AnalyticsPage } from './features/analytics/pages/analytics-page/analytics-page';
import { authGuard } from './core/guards/auth-guard';
import { OrdersPage } from './features/orders/pages/orders-page/orders-page';
import { OrderDetailPage } from './features/orders/pages/order-detail-page/order-detail-page';
import { CustomersPage } from './features/customers/pages/customers-page/customers-page';
import { ReviewsPage } from './features/reviews/pages/reviews-page/reviews-page';
import { SettingsPage } from './features/settings/pages/settings-page/settings-page';
import { ProfilePage } from './features/settings/pages/profile-page/profile-page';
import { CartPage } from './features/cart/pages/cart-page/cart-page';
import { ChatPage } from './features/chat/pages/chat-page/chat-page';
import { AdminUsersPage } from './features/admin/pages/admin-users-page/admin-users-page';
import { AdminStoresPage } from './features/admin/pages/admin-stores-page/admin-stores-page';
import { AdminCategoriesPage } from './features/admin/pages/admin-categories-page/admin-categories-page';
import { AdminSettingsPage } from './features/admin/pages/admin-settings-page/admin-settings-page';
import { AdminAuditLogsPage } from './features/admin/pages/admin-audit-logs-page/admin-audit-logs-page';
import { AdminReportsPage } from './features/admin/pages/admin-reports-page/admin-reports-page';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: LoginPage },
    { path: 'products', component: ProductListPage, canActivate: [authGuard], data: { roles: ['ADMIN', 'CORPORATE', 'USER'] } },
    { path: 'products/:id', component: ProductDetailPage, canActivate: [authGuard], data: { roles: ['ADMIN', 'CORPORATE', 'USER'] } },
    { path: 'dashboard', component: DashboardPage, canActivate: [authGuard], data: { roles: ['ADMIN', 'CORPORATE', 'USER'] } },
    { path: 'analytics', component: AnalyticsPage, canActivate: [authGuard], data: { roles: ['ADMIN', 'CORPORATE'] } },
    { path: 'orders', component: OrdersPage, canActivate: [authGuard], data: { roles: ['ADMIN', 'CORPORATE', 'USER'] } },
    { path: 'orders/:id', component: OrderDetailPage, canActivate: [authGuard], data: { roles: ['ADMIN', 'CORPORATE', 'USER'] } },
    { path: 'customers', component: CustomersPage, canActivate: [authGuard], data: { roles: ['ADMIN', 'CORPORATE'] } },
    { path: 'reviews', component: ReviewsPage, canActivate: [authGuard], data: { roles: ['ADMIN', 'CORPORATE', 'USER'] } },
    { path: 'settings', component: SettingsPage, canActivate: [authGuard], data: { roles: ['CORPORATE'] } },
    { path: 'profile', component: ProfilePage, canActivate: [authGuard], data: { roles: ['ADMIN', 'CORPORATE', 'USER'] } },
    { path: 'cart', component: CartPage, canActivate: [authGuard], data: { roles: ['ADMIN', 'USER'] } },
    { path: 'ai-assistant', component: ChatPage, canActivate: [authGuard], data: { roles: ['ADMIN', 'CORPORATE', 'USER'] } },
    { path: 'admin/users', component: AdminUsersPage, canActivate: [authGuard], data: { roles: ['ADMIN'] } },
    { path: 'admin/stores', component: AdminStoresPage, canActivate: [authGuard], data: { roles: ['ADMIN'] } },
    { path: 'admin/categories', component: AdminCategoriesPage, canActivate: [authGuard], data: { roles: ['ADMIN'] } },
    { path: 'admin/settings', component: AdminSettingsPage, canActivate: [authGuard], data: { roles: ['ADMIN'] } },
    { path: 'admin/audit-logs', component: AdminAuditLogsPage, canActivate: [authGuard], data: { roles: ['ADMIN'] } },
    { path: 'admin/reports', component: AdminReportsPage, canActivate: [authGuard], data: { roles: ['ADMIN'] } },
    { path: '**', redirectTo: 'login' }
];
