import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreSettingsService } from '../../../../core/services/settings';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.scss'
})
export class SettingsPage implements OnInit {
  settings = signal<any>(null);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string>('');
  successMessage = signal<string>('');
  isSaving = signal<boolean>(false);

  constructor(private settingsService: StoreSettingsService) {}

  ngOnInit() {
    this.loadSettings();
  }

  loadSettings() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.settingsService.getSettings().subscribe({
      next: (data) => {
        this.settings.set(this.normalizeSettings(data));
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Could not load settings from API. Showing demo data.');
        this.isLoading.set(false);
        
        // Mock fallback demo data
        this.settings.set(this.normalizeSettings({
          storeName: 'Tech Haven E-Commerce',
          email: 'admin@techhaven.example.com',
          status: 'Open',
          category: 'Electronics & Gadgets',
          description: 'Premium tech gadgets and lifestyle electronics.',
          currency: 'USD ($)',
          timezone: 'America/New_York'
        }));
      }
    });
  }

  saveSettings() {
    this.isSaving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.settingsService.updateSettings(this.settings()).subscribe({
      next: (updated) => {
        this.settings.set(this.normalizeSettings(updated));
        this.successMessage.set('Store settings saved.');
        this.isSaving.set(false);
      },
      error: () => {
        this.errorMessage.set('Could not save store settings. Check the backend store-settings endpoint.');
        this.isSaving.set(false);
      }
    });
  }

  updateSetting(field: string, value: any) {
    this.settings.update(current => ({ ...(current || {}), [field]: value }));
  }

  private normalizeSettings(data: any): any {
    return {
      id: data?.id,
      storeId: data?.storeId,
      storeName: data?.storeName || '',
      email: data?.email || '',
      status: data?.status || 'Open',
      category: data?.category || '',
      description: data?.description || '',
      currency: data?.currency || 'USD ($)',
      timezone: data?.timezone || 'America/New_York'
    };
  }
}
