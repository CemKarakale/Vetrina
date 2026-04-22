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
        {{ data.icon }}
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
      background: #1a1b26;
      border-radius: 16px;
      padding: 20px;
      display: flex;
      align-items: center;
      border: 1px solid rgba(255, 255, 255, 0.03);
      gap: 16px;
    }
    .stat-icon {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 26px;
      flex-shrink: 0;
    }
    .stat-icon.purple { background: rgba(106, 90, 249, 0.15); }
    .stat-icon.orange { background: rgba(255, 171, 0, 0.15); }
    .stat-icon.green { background: rgba(0, 227, 150, 0.15); }
    .stat-icon.pink { background: rgba(255, 71, 126, 0.15); }
    .stat-info {
      flex: 1;
      h3 {
        margin: 0 0 4px 0;
        font-size: 26px;
        font-weight: 700;
      }
      p {
        margin: 0;
        font-size: 13px;
        color: #a0a5ba;
      }
    }
    .stat-change {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      font-size: 13px;
      font-weight: 600;
    }
    .stat-change.positive { color: #00e396; }
    .stat-change.negative { color: #ff477e; }
    .change-label {
      font-size: 11px;
      color: #a0a5ba;
      font-weight: 400;
    }
  `]
})
export class StatCardComponent {
  @Input() data!: StatWidgetData;

  get iconClass(): string {
    return this.data.color || 'purple';
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