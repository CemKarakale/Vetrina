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
        <span>Sorted by sales, then revenue</span>
      </div>
      <div class="products-list">
        @for (product of data.products; track product.id; let i = $index) {
          <div class="product-row">
            <span class="rank" [class]="'rank-' + (i + 1)">{{ i + 1 }}</span>
            <div class="product-info">
              <span class="product-name">{{ product.name }}</span>
            </div>
            <span class="product-sales">{{ product.sales | number }} sales</span>
            <span class="product-revenue">\${{ product.revenue | number:'1.0-0' }}</span>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .top-products-widget {
      background: #f6fbfa;
      border-radius: 10px;
      padding: 24px;
      border: 1px solid #c8dcda;
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    .widget-header {
      margin-bottom: 16px;
    }
    .widget-header h3 {
      margin: 0 0 4px 0;
      color: #17312c;
      font-size: 16px;
      font-weight: 600;
    }
    .widget-header span {
      color: #5d6d69;
      font-size: 12px;
    }
    .products-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .product-row {
      display: grid;
      grid-template-columns: 32px minmax(0, 1fr) 86px 90px;
      align-items: center;
      gap: 10px;
      padding: 9px 0;
      border-bottom: 1px solid #d8e8e4;
    }
    .product-row:last-child {
      border-bottom: 0;
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
    .rank-1 { background: #d7ebe7; color: #234f4f; }
    .rank-2 { background: #dbeef4; color: #356b78; }
    .rank-3 { background: #e8e1f6; color: #6c5a9d; }
    .rank-4, .rank-5 {
      background: #e8f3f0;
      color: #5d6d69;
    }
    .product-info {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .product-name {
      color: #17312c;
      font-size: 14px;
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .product-sales {
      color: #234f4f;
      font-size: 13px;
      font-weight: 700;
      text-align: right;
    }
    .product-revenue {
      font-size: 14px;
      font-weight: 700;
      color: #17312c;
      text-align: right;
    }
    @media (max-width: 640px) {
      .product-row {
        grid-template-columns: 32px minmax(0, 1fr);
      }
      .product-sales,
      .product-revenue {
        grid-column: 2;
        text-align: left;
      }
    }
  `]
})
export class TopProductsWidgetComponent {
  @Input() data!: TopProductsWidgetData;
}
