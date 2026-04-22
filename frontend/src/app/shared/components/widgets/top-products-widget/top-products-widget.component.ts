import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TopProductsWidgetData, TopProduct } from '../../../../features/dashboard/models/widget.model';

@Component({
  selector: 'app-top-products-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="top-products-widget">
      <div class="widget-header">
        <h3>{{ data.title }}</h3>
      </div>
      <div class="products-list">
        @for (product of data.products; track product.id; let i = $index) {
          <div class="product-row">
            <span class="rank" [class]="'rank-' + (i + 1)">{{ i + 1 }}</span>
            <div class="product-info">
              <span class="product-name">{{ product.name }}</span>
              <span class="product-sales">{{ product.sales }} sales</span>
            </div>
            <span class="product-revenue">\${{ product.revenue | number:'1.0-0' }}</span>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .top-products-widget {
      background: #1a1b26;
      border-radius: 16px;
      padding: 24px;
      border: 1px solid rgba(255, 255, 255, 0.03);
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    .widget-header h3 {
      margin: 0 0 20px 0;
      font-size: 16px;
      font-weight: 600;
    }
    .products-list {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .product-row {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .rank {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      flex-shrink: 0;
    }
    .rank-1 { background: rgba(255, 215, 0, 0.15); color: #ffd700; }
    .rank-2 { background: rgba(192, 192, 192, 0.15); color: #c0c0c0; }
    .rank-3 { background: rgba(205, 127, 50, 0.15); color: #cd7f32; }
    .rank-4, .rank-5 {
      background: rgba(255, 255, 255, 0.05);
      color: #a0a5ba;
    }
    .product-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .product-name {
      font-size: 14px;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .product-sales {
      font-size: 12px;
      color: #a0a5ba;
    }
    .product-revenue {
      font-size: 14px;
      font-weight: 600;
      color: #00e396;
    }
  `]
})
export class TopProductsWidgetComponent {
  @Input() data!: TopProductsWidgetData;
}