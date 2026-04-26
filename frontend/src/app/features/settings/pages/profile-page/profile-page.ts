import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ProfilePreferences,
  ProfileService,
  UserProfile
} from '../../../../core/services/profile';
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
  successMessage = signal<string>('');
  profileDraft: UserProfile | null = null;

  constructor(
    public profileService: ProfileService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    let r = (this.authService.getRole() || 'USER').toUpperCase();
    if (r.startsWith('ROLE_')) r = r.replace('ROLE_', '');
    if (r === 'INDIVIDUAL' || r === 'INDIVIDUAL_USER') r = 'USER';
    this.role.set(r);

    this.profileDraft = this.cloneProfile(this.profileService.profile());
    this.profileService.loadProfile().subscribe({
      next: (profile) => {
        this.profileDraft = this.cloneProfile(profile);
      },
      error: () => {
        this.profileDraft = this.cloneProfile(this.profileService.profile());
      }
    });
  }

  setTab(tab: string) {
    this.activeTab.set(tab);
    this.successMessage.set('');
  }

  updateInfo() {
    if (!this.profileDraft) return;

    const firstName = String(this.profileDraft.firstName || '').trim();
    const lastName = String(this.profileDraft.lastName || '').trim();

    this.saveProfile({
      firstName,
      lastName,
      name: `${firstName} ${lastName}`.trim(),
      email: String(this.profileDraft.email || '').trim(),
      phone: String(this.profileDraft.phone || '').trim()
    }, 'Profile information saved.');
  }

  updateAddress() {
    if (!this.profileDraft) return;
    this.saveProfile({ address: this.profileDraft.address }, 'Address saved.');
  }

  toggleNotification() {
    if (!this.profileDraft) return;
    const notifications = !this.profileDraft.preferences.notifications;
    this.savePreferences({ notifications }, 'Notification preference saved.');
  }

  setTheme(theme: ProfilePreferences['theme']) {
    this.savePreferences({ theme }, 'Theme preference saved.');
  }

  private saveProfile(payload: Parameters<ProfileService['updateProfile']>[0], message: string) {
    this.successMessage.set('');
    this.profileService.updateProfile(payload).subscribe({
      next: (profile) => {
        this.profileDraft = this.cloneProfile(profile);
        this.successMessage.set(message);
      },
      error: () => {
        this.successMessage.set('');
      }
    });
  }

  private savePreferences(payload: Partial<ProfilePreferences>, message: string) {
    if (!this.profileDraft) return;

    this.successMessage.set('');
    this.profileService.updatePreferences(payload).subscribe({
      next: (profile) => {
        this.profileDraft = this.cloneProfile(profile);
        this.successMessage.set(message);
      },
      error: () => {
        this.successMessage.set('');
      }
    });
  }

  private cloneProfile(profile: UserProfile | null): UserProfile | null {
    return profile ? structuredClone(profile) : null;
  }
}
