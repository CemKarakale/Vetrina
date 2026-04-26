import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin';

@Component({
  selector: 'app-admin-settings-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-settings-page.html'
})
export class AdminSettingsPage implements OnInit {
  settings = signal<Record<string, string>>({});
  errorMessage = signal('');
  isLoading = signal(true);
  isSaving = signal(false);
  rows = computed(() => Object.entries(this.settings()).map(([key, value]) => ({ key, value })));

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.loadSettings();
  }

  loadSettings() {
    this.isLoading.set(true);
    this.adminService.getSystemSettings().subscribe({
      next: settings => {
        this.settings.set(settings ?? {});
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Could not load system settings.');
        this.isLoading.set(false);
      }
    });
  }

  updateSetting(key: string, value: string) {
    this.settings.update(settings => ({ ...settings, [key]: value }));
  }

  addSetting() {
    const key = `setting_${Object.keys(this.settings()).length + 1}`;
    this.settings.update(settings => ({ ...settings, [key]: '' }));
  }

  removeSetting(key: string) {
    this.settings.update(settings => {
      const next = { ...settings };
      delete next[key];
      return next;
    });
  }

  saveSettings() {
    this.isSaving.set(true);
    this.adminService.updateSystemSettings(this.settings()).subscribe({
      next: settings => {
        this.settings.set(settings ?? this.settings());
        this.isSaving.set(false);
      },
      error: () => {
        this.errorMessage.set('Could not save system settings.');
        this.isSaving.set(false);
      }
    });
  }
}
