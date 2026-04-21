import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreSettingsService } from '../../../../core/services/settings';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.scss'
})
export class SettingsPage implements OnInit {
  settings = signal<any>(null);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string>('');
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
        this.settings.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Could not load settings from API. Showing demo data.');
        this.isLoading.set(false);
        
        // Mock fallback demo data
        this.settings.set({
          storeName: 'Tech Haven E-Commerce',
          email: 'admin@techhaven.example.com',
          status: 'Open',
          category: 'Electronics & Gadgets',
          description: 'Premium tech gadgets and lifestyle electronics.',
          currency: 'USD ($)',
          timezone: 'America/New_York'
        });
      }
    });
  }

  saveSettings() {
    // Simulated save logic since backend isn't connected
    this.isSaving.set(true);
    setTimeout(() => {
      this.isSaving.set(false);
      alert('Store settings saved successfully! (Simulated)');
    }, 1000);
  }
}
