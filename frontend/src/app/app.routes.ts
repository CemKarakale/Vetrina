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
import { ShipmentsPage } from './features/shipments/pages/shipments-page/shipments-page';
import { ReviewsPage } from './features/reviews/pages/reviews-page/reviews-page';
import { SettingsPage } from './features/settings/pages/settings-page/settings-page';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: LoginPage },
    { path: 'products', component: ProductListPage, canActivate: [authGuard] },
    { path: 'products/:id', component: ProductDetailPage, canActivate: [authGuard] },
    { path: 'dashboard', component: DashboardPage, canActivate: [authGuard] },
    { path: 'analytics', component: AnalyticsPage, canActivate: [authGuard] },
    { path: 'orders', component: OrdersPage, canActivate: [authGuard] },
    { path: 'orders/:id', component: OrderDetailPage, canActivate: [authGuard] },
    { path: 'customers', component: CustomersPage, canActivate: [authGuard] },
    { path: 'shipments', component: ShipmentsPage, canActivate: [authGuard] },
    { path: 'reviews', component: ReviewsPage, canActivate: [authGuard] },
    { path: 'settings', component: SettingsPage, canActivate: [authGuard] },
    { path: '**', redirectTo: 'login' }
]
