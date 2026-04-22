import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecentActivityWidgetData, RecentOrder } from '../../../../features/dashboard/models/widget.model';

@Component({
  selector: 'app-recent-activity-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="recent-activity-widget">
      <div class="widget-header">
        <h3>{{ data.title }}</h3>
        <a href="/orders" class="view-all">View All</a>
      </div>
      <div class="activity-list">
        @for (order of data.orders; track order.id) {
          <div class="activity-row">
            <div class="activity-icon" [class]="getStatusClass(order.status)">
              {{ getStatusIcon(order.status) }}
            </div>
            <div class="activity-info">
              <span class="activity-product">{{ order.productName }}</span>
              <span class="activity-date">{{ order.date }}</span>
            </div>
            <div class="activity-right">
              <span class="activity-amount">\${{ order.amount | number:'1.2-2' }}</span>
              <span class="activity-status" [class]="order.status">{{ order.status }}</span>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .recent-activity-widget {
      background: #1a1b26;
      border-radius: 16px;
      padding: 24px;
      border: 1px solid rgba(255, 255, 255, 0.03);
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    .widget-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      h3 { margin: 0; font-size: 16px; font-weight: 600; }
    }
    .view-all {
      font-size: 12px;
      color: #6a5af9;
      text-decoration: none;
      &:hover { text-decoration: underline; }
    }
    .activity-list {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .activity-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .activity-icon {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      flex-shrink: 0;
    }
    .activity-icon.completed { background: rgba(0, 227, 150, 0.15); }
    .activity-icon.pending { background: rgba(255, 171, 0, 0.15); }
    .activity-icon.cancelled { background: rgba(255, 71, 126, 0.15); }
    .activity-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .activity-product {
      font-size: 13px;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .activity-date {
      font-size: 11px;
      color: #a0a5ba;
    }
    .activity-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }
    .activity-amount {
      font-size: 13px;
      font-weight: 600;
    }
    .activity-status {
      font-size: 10px;
      padding: 2px 8px;
      border-radius: 10px;
      text-transform: capitalize;
    }
    .activity-status.completed { background: rgba(0, 227, 150, 0.15); color: #00e396; }
    .activity-status.pending { background: rgba(255, 171, 0, 0.15); color: #ffab00; }
    .activity-status.cancelled { background: rgba(255, 71, 126, 0.15); color: #ff477e; }
  `]
})
export class RecentActivityWidgetComponent {
  @Input() data!: RecentActivityWidgetData;

  getStatusIcon(status: string): string {
    switch (status) {
      case 'completed': return '✓';
      case 'pending': return '⏳';
      case 'cancelled': return '✕';
      default: return '•';
    }
  }

  getStatusClass(status: string): string {
    return status;
  }
}