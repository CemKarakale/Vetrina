import { Routes } from '@angular/router';
import { LoginPage } from './features/auth/pages/login-page/login-page';
import { ProductListPage } from './features/products/pages/product-list-page/product-list-page';
import { ProductDetailPage } from './features/products/pages/product-detail-page/product-detail-page';
import { DashboardPage } from './features/dashboard/pages/dashboard-page/dashboard-page';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: LoginPage },
    { path: 'products', component: ProductListPage, canActivate: [authGuard] },
    { path: 'products/:id', component: ProductDetailPage, canActivate: [authGuard] },
    { path: 'dashboard', component: DashboardPage, canActivate: [authGuard] },
    { path: '**', redirectTo: 'login' }
]
