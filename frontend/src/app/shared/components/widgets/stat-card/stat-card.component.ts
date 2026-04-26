import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatWidgetData } from '../../../../features/dashboard/models/widget.model';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stat-card">
      <div class="stat-icon" [class]="iconClass">
        {{ displayIcon }}
      </div>
      <div class="stat-info">
        <h3>{{ formattedValue }}</h3>
        <p>{{ data.title }}</p>
      </div>
      @if (data.change !== undefined) {
        <div class="stat-change" [class.positive]="data.change >= 0" [class.negative]="data.change < 0">
          <span>{{ data.change >= 0 ? '+' : '' }}{{ data.change }}%</span>
          @if (data.changeLabel) {
            <span class="change-label">{{ data.changeLabel }}</span>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .stat-card {
      background: #f6fbfa;
      border-radius: 10px;
      padding: 18px;
      display: flex;
      align-items: center;
      border: 1px solid #c8dcda;
      gap: 14px;
      min-width: 0;
      overflow: hidden;
    }
    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      justify-content: center;
      align-items: center;
      color: #263b36;
      font-size: 16px;
      font-weight: 800;
      flex-shrink: 0;
    }
    .stat-icon.purple { background: #dcd8f7; }
    .stat-icon.orange { background: #f9dfba; }
    .stat-icon.green { background: #cbe5df; }
    .stat-icon.pink { background: #f4d4df; }
    .stat-info {
      flex: 1;
      min-width: 0;
      h3 {
        margin: 0 0 4px 0;
        color: #17312c;
        font-size: 24px;
        font-weight: 700;
        line-height: 1.1;
        overflow-wrap: anywhere;
      }
      p {
        margin: 0;
        font-size: 13px;
        color: #61746f;
      }
    }
    .stat-change {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      flex: 0 0 auto;
      max-width: 72px;
      font-size: 13px;
      font-weight: 600;
      text-align: right;
    }
    .stat-change.positive { color: #1f8f66; }
    .stat-change.negative { color: #b55b62; }
    .change-label {
      font-size: 11px;
      color: #7c8985;
      font-weight: 400;
    }
    @media (max-width: 1320px) {
      .stat-card {
        align-items: flex-start;
        flex-wrap: wrap;
      }
      .stat-change {
        width: 100%;
        max-width: none;
        align-items: flex-start;
        text-align: left;
      }
    }
  `]
})
export class StatCardComponent {
  @Input() data!: StatWidgetData;

  get iconClass(): string {
    return this.data.color || 'purple';
  }

  get displayIcon(): string {
    const icon = String(this.data.icon || '').toLowerCase();
    const icons: Record<string, string> = {
      '$': '$',
      '#': '#',
      '%': '%',
      'dollar-sign': '$',
      'shopping-cart': 'ORD',
      'users': 'USR',
      'user': 'USR',
      'store': 'ST',
      'package': 'PR',
      'box': 'PR',
      'chart': 'AN',
      'trending-up': 'UP'
    };

    return icons[icon] || String(this.data.icon || '').slice(0, 3).toUpperCase();
  }

  get formattedValue(): string {
    if (this.data.format === 'currency') {
      return '$' + Number(this.data.value).toLocaleString('en-US', { maximumFractionDigits: 0 });
    }
    if (this.data.format === 'percent') {
      return Number(this.data.value).toFixed(1) + '%';
    }
    return Number(this.data.value).toLocaleString();
  }
}
