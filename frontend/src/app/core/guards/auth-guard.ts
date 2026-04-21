import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  const token = localStorage.getItem('token'); // read JWT from localStorage
  const role = (localStorage.getItem('role') || 'USER').toUpperCase(); // Normalize role to uppercase

  if (token) {
    const requiredRoles = route.data?.['roles'] as string[];
    if (requiredRoles && !requiredRoles.includes(role)) {
      if (state.url !== '/dashboard') {
        router.navigate(['/dashboard']);
      } else {
        router.navigate(['/login']); // Fallback if even dashboard is forbidden
      }
      return false;
    }
    return true; // allows route
  } else {
    router.navigate(['/login']);// goes back to login
    return false; // blocks route
  }
};