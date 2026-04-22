import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpendingWidgetData } from '../../../../features/dashboard/models/widget.model';

@Component({
  selector: 'app-spending-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="spending-widget">
      <div class="widget-header">
        <h3>{{ data.title }}</h3>
        <span class="period">{{ data.period }}</span>
      </div>
      <div class="total-amount">
        <span class="label">Total Spent</span>
        <span class="value">\${{ data.totalSpent | number:'1.2-2' }}</span>
      </div>
      <div class="categories">
        @for (cat of data.categories; track cat.category) {
          <div class="category-row">
            <div class="category-info">
              <span class="category-color" [style.backgroundColor]="cat.color"></span>
              <span class="category-name">{{ cat.category }}</span>
            </div>
            <div class="category-values">
              <span class="category-amount">\${{ cat.amount | number:'1.2-2' }}</span>
              <span class="category-percent">{{ cat.percentage }}%</span>
            </div>
            <div class="category-bar">
              <div class="category-bar-fill" [style.width.%]="cat.percentage" [style.backgroundColor]="cat.color"></div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .spending-widget {
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
    .period {
      font-size: 12px;
      color: #a0a5ba;
      background: rgba(255, 255, 255, 0.05);
      padding: 4px 10px;
      border-radius: 20px;
    }
    .total-amount {
      display: flex;
      flex-direction: column;
      margin-bottom: 24px;
      .label {
        font-size: 12px;
        color: #a0a5ba;
        margin-bottom: 4px;
      }
      .value {
        font-size: 32px;
        font-weight: 700;
      }
    }
    .categories {
      display: flex;
      flex-direction: column;
      gap: 16px;
      flex: 1;
    }
    .category-row {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .category-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .category-color {
      width: 8px;
      height: 8px;
      border-radius: 3px;
    }
    .category-name {
      font-size: 13px;
      color: #fff;
    }
    .category-values {
      display: flex;
      justify-content: space-between;
      margin-left: 16px;
    }
    .category-amount {
      font-size: 12px;
      color: #a0a5ba;
    }
    .category-percent {
      font-size: 12px;
      font-weight: 600;
    }
    .category-bar {
      height: 6px;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 3px;
      margin-left: 16px;
      overflow: hidden;
    }
    .category-bar-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.5s ease;
    }
  `]
})
export class SpendingWidgetComponent {
  @Input() data!: SpendingWidgetData;
}