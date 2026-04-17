import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  const token = localStorage.getItem('token'); // read JWT from localStorage

  if (token) {
    return true; // allows route
  } else {
    router.navigate(['/login']);// goes back to login
    return false; // blocks route
  }
};