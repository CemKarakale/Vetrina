import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartWidgetData, ChartDataPoint } from '../../../../features/dashboard/models/widget.model';

@Component({
  selector: 'app-chart-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-widget">
      <div class="chart-header">
        <h3>{{ data.title }}</h3>
      </div>
      <div class="chart-body">
        @if (data.type === 'line') {
          <svg viewBox="0 0 800 250" preserveAspectRatio="none" class="line-chart">
            <defs>
              <linearGradient [id]="'gradient-' + uniqueId" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" [attr.stop-color]="data.color || '#6a5af9'" stop-opacity="0.4" />
                <stop offset="100%" [attr.stop-color]="data.color || '#6a5af9'" stop-opacity="0" />
              </linearGradient>
            </defs>
            <line x1="0" y1="40" x2="800" y2="40" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
            <line x1="0" y1="90" x2="800" y2="90" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
            <line x1="0" y1="140" x2="800" y2="140" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
            <line x1="0" y1="190" x2="800" y2="190" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
            <polygon [attr.points]="areaPoints" [attr.fill]="'url(#gradient-' + uniqueId + ')'"/>
            <polyline [attr.points]="linePoints" fill="none" [attr.stroke]="data.color || '#6a5af9'" stroke-width="3"/>
            @for (point of data.data; track point.label; let i = $index) {
              <circle [attr.cx]="getX(i)" [attr.cy]="getY(point.value)" r="5" [attr.fill]="'#1a1b26'" [attr.stroke]="data.color || '#6a5af9'" stroke-width="3"/>
            }
          </svg>
          <div class="x-axis">
            @for (point of data.data; track point.label) {
              <span>{{ point.label }}</span>
            }
          </div>
        }
        @if (data.type === 'bar') {
          <div class="bar-chart">
            @for (point of data.data; track point.label; let i = $index) {
              <div class="bar-item">
                <div class="bar-value">{{ point.value | number:'1.0-0' }}</div>
                <div class="bar-container">
                  <div class="bar" [style.height.%]="getBarHeight(point.value)" [style.backgroundColor]="data.color || '#6a5af9'"></div>
                </div>
                <div class="bar-label">{{ point.label }}</div>
              </div>
            }
          </div>
        }
        @if (data.type === 'pie') {
          <div class="pie-chart">
            <svg viewBox="0 0 200 200">
              @for (segment of pieSegments; track segment.label; let i = $index) {
                <circle cx="100" cy="100" r="80" fill="none" [attr.stroke]="segment.color" stroke-width="40"
                  [attr.stroke-dasharray]="segment.dashArray" [attr.stroke-dashoffset]="segment.offset"
                  [style.transform]="'rotate(-90deg)'" [style.transform-origin]="'center'"/>
              }
            </svg>
            <div class="pie-legend">
              @for (point of data.data; track point.label; let i = $index) {
                <div class="legend-item">
                  <span class="legend-color" [style.backgroundColor]="pieColors[i % pieColors.length]"></span>
                  <span class="legend-label">{{ point.label }}</span>
                  <span class="legend-value">{{ point.value }}%</span>
                </div>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .chart-widget {
      background: #1a1b26;
      border-radius: 16px;
      padding: 24px;
      border: 1px solid rgba(255, 255, 255, 0.03);
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    .chart-header h3 {
      margin: 0 0 20px 0;
      font-size: 16px;
      font-weight: 600;
    }
    .chart-body {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .line-chart {
      width: 100%;
      height: 200px;
      overflow: visible;
    }
    .x-axis {
      display: flex;
      justify-content: space-between;
      margin-top: 10px;
      padding: 0 5px;
      font-size: 11px;
      color: #a0a5ba;
    }
    .bar-chart {
      display: flex;
      align-items: flex-end;
      justify-content: space-around;
      height: 200px;
      gap: 12px;
    }
    .bar-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
      max-width: 60px;
    }
    .bar-value {
      font-size: 11px;
      color: #a0a5ba;
      margin-bottom: 8px;
    }
    .bar-container {
      width: 100%;
      height: 150px;
      display: flex;
      align-items: flex-end;
    }
    .bar {
      width: 100%;
      border-radius: 6px 6px 0 0;
      min-height: 4px;
      transition: height 0.3s ease;
    }
    .bar-label {
      font-size: 11px;
      color: #a0a5ba;
      margin-top: 8px;
    }
    .pie-chart {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 30px;
      padding: 10px 0;
    }
    .pie-chart svg {
      width: 160px;
      height: 160px;
    }
    .pie-legend {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
    }
    .legend-color {
      width: 10px;
      height: 10px;
      border-radius: 3px;
    }
    .legend-label {
      color: #a0a5ba;
      flex: 1;
    }
    .legend-value {
      font-weight: 600;
    }
  `]
})
export class ChartWidgetComponent {
  @Input() data!: ChartWidgetData;
  uniqueId = Math.random().toString(36).substring(7);

  pieColors = ['#6a5af9', '#ffab00', '#00e396', '#ff477e', '#00b8d9', '#ffd32a'];

  get maxValue(): number {
    return Math.max(...this.data.data.map((d: ChartDataPoint) => d.value), 1);
  }

  get linePoints(): string {
    return this.data.data.map((point: ChartDataPoint, i: number) => `${this.getX(i)},${this.getY(point.value)}`).join(' ');
  }

  get areaPoints(): string {
    const lastX = this.getX(this.data.data.length - 1);
    return `${this.linePoints} ${lastX},220 0,220`;
  }

  getX(index: number): number {
    if (this.data.data.length === 1) return 400;
    return (index / (this.data.data.length - 1)) * 800;
  }

  getY(value: number): number {
    return 220 - (value / this.maxValue) * 180;
  }

  getBarHeight(value: number): number {
    return (value / this.maxValue) * 100;
  }

  get pieSegments() {
    let offset = 0;
    const circumference = 2 * Math.PI * 80;
    return this.data.data.map((point: ChartDataPoint, i: number) => {
      const dashArray = `${(point.value / 100) * circumference} ${circumference}`;
      const segment = {
        label: point.label,
        value: point.value,
        color: this.pieColors[i % this.pieColors.length],
        dashArray,
        offset: -offset
      };
      offset += (point.value / 100) * circumference;
      return segment;
    });
  }
}