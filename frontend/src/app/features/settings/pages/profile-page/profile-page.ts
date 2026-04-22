import { Component, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../../../../core/services/profile';
import { AuthService } from '../../../../core/services/auth';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.scss'
})
export class ProfilePage implements OnInit {
  activeTab = signal<string>('info');
  role = signal<string>('');

  constructor(
    public profileService: ProfileService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    let r = (this.authService.getRole() || 'USER').toUpperCase();
    if (r.startsWith('ROLE_')) r = r.replace('ROLE_', '');
    if (r === 'INDIVIDUAL' || r === 'INDIVIDUAL_USER') r = 'USER';
    this.role.set(r);

    this.profileService.loadProfile();
  }

  setTab(tab: string) {
    this.activeTab.set(tab);
  }

  updateInfo() {
    const p = this.profileService.profile();
    if (!p) return;
    this.profileService.updateProfile({
      firstName: p.firstName,
      lastName: p.lastName,
      email: p.email,
      phone: p.phone
    });
  }

  updateAddress() {
    const p = this.profileService.profile();
    if (!p) return;
    this.profileService.updateProfile({ address: p.address });
  }

  toggleNotification() {
    const p = this.profileService.profile();
    if (!p) return;
    this.profileService.updatePreferences({
      notifications: !p.preferences.notifications
    });
  }

  setTheme(theme: string) {
    this.profileService.updatePreferences({ theme });
  }
}