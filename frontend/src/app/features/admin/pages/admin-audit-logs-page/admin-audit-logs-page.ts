import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin';

@Component({
  selector: 'app-admin-audit-logs-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-audit-logs-page.html'
})
export class AdminAuditLogsPage implements OnInit {
  logs = signal<any[]>([]);
  filters = signal<any>({ from: '', to: '', actor: '', type: '', severity: '' });
  isLoading = signal(true);
  errorMessage = signal('');

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.loadLogs();
  }

  loadLogs() {
    this.isLoading.set(true);
    this.adminService.getAuditLogs(this.filters()).subscribe({
      next: logs => {
        this.logs.set(logs ?? []);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Could not load audit logs.');
        this.isLoading.set(false);
      }
    });
  }

  updateFilter(field: string, value: string) {
    this.filters.update(filters => ({ ...filters, [field]: value }));
  }

  clearFilters() {
    this.filters.set({ from: '', to: '', actor: '', type: '', severity: '' });
    this.loadLogs();
  }
}
