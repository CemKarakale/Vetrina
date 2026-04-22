import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', loadComponent: () => import('./features/auth/pages/login-page/login-page').then(m => m.LoginPage) },
    { path: 'products', loadComponent: () => import('./features/products/pages/product-list-page/product-list-page').then(m => m.ProductListPage), canActivate: [authGuard], data: { roles: ['ADMIN', 'CORPORATE', 'USER'] } },
    { path: 'products/:id', loadComponent: () => import('./features/products/pages/product-detail-page/product-detail-page').then(m => m.ProductDetailPage), canActivate: [authGuard], data: { roles: ['ADMIN', 'CORPORATE', 'USER'] } },
    { path: 'dashboard', loadComponent: () => import('./features/dashboard/pages/dashboard-page/dashboard-page').then(m => m.DashboardPage), canActivate: [authGuard], data: { roles: ['ADMIN', 'CORPORATE', 'USER'] } },
    { path: 'analytics', loadComponent: () => import('./features/analytics/pages/analytics-page/analytics-page').then(m => m.AnalyticsPage), canActivate: [authGuard], data: { roles: ['ADMIN', 'CORPORATE'] } },
    { path: 'orders', loadComponent: () => import('./features/orders/pages/orders-page/orders-page').then(m => m.OrdersPage), canActivate: [authGuard], data: { roles: ['ADMIN', 'CORPORATE', 'USER'] } },
    { path: 'orders/:id', loadComponent: () => import('./features/orders/pages/order-detail-page/order-detail-page').then(m => m.OrderDetailPage), canActivate: [authGuard], data: { roles: ['ADMIN', 'CORPORATE', 'USER'] } },
    { path: 'customers', loadComponent: () => import('./features/customers/pages/customers-page/customers-page').then(m => m.CustomersPage), canActivate: [authGuard], data: { roles: ['ADMIN', 'CORPORATE'] } },
    { path: 'reviews', loadComponent: () => import('./features/reviews/pages/reviews-page/reviews-page').then(m => m.ReviewsPage), canActivate: [authGuard], data: { roles: ['ADMIN', 'CORPORATE', 'USER'] } },
    { path: 'settings', loadComponent: () => import('./features/settings/pages/settings-page/settings-page').then(m => m.SettingsPage), canActivate: [authGuard], data: { roles: ['ADMIN', 'CORPORATE'] } },
    { path: 'cart', loadComponent: () => import('./features/cart/pages/cart-page/cart-page').then(m => m.CartPage), canActivate: [authGuard], data: { roles: ['ADMIN', 'USER'] } },
    { path: 'ai-assistant', loadComponent: () => import('./features/chat/pages/chat-page/chat-page').then(m => m.ChatPage), canActivate: [authGuard], data: { roles: ['ADMIN', 'CORPORATE', 'USER'] } },
    { path: '**', redirectTo: 'login' }
];
