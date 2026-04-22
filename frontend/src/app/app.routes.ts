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
import { CartPage } from './features/cart/pages/cart-page/cart-page';
import { ChatPage } from './features/chat/pages/chat-page/chat-page';

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
    { path: 'settings', component: SettingsPage, canActivate: [authGuard], data: { roles: ['ADMIN', 'CORPORATE'] } },
    { path: 'cart', component: CartPage, canActivate: [authGuard], data: { roles: ['ADMIN', 'USER'] } },
    { path: 'ai-assistant', component: ChatPage, canActivate: [authGuard], data: { roles: ['ADMIN', 'CORPORATE', 'USER'] } },
    { path: '**', redirectTo: 'login' }
];
