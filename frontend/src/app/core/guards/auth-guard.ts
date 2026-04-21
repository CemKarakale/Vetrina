import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  const token = localStorage.getItem('token'); // read JWT from localStorage
  let role = (localStorage.getItem('role') || 'USER').toUpperCase();
  
  // Normalize Spring Boot / Extended Roles
  if (role.startsWith('ROLE_')) { role = role.replace('ROLE_', ''); }
  if (role === 'INDIVIDUAL' || role === 'INDIVIDUAL_USER') { role = 'USER'; }

  if (token) {
    const requiredRoles = route.data?.['roles'] as string[];
    if (requiredRoles && !requiredRoles.includes(role)) {
      if (state.url !== '/dashboard' && state.url !== '/login') {
        router.navigate(['/dashboard']);
      } else {
        router.navigate(['/login']); 
      }
      return false;
    }
    return true; 
  } else {
    router.navigate(['/login']);
    return false;
  }
};