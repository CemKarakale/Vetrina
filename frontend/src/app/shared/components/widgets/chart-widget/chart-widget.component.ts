import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { ChartWidgetData } from '../../../../features/dashboard/models/widget.model';

Chart.register(...registerables);

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
        <canvas #chartCanvas></canvas>
      </div>
    </div>
  `,
  styles: [`
    .chart-widget {
      background: #f6fbfa;
      border-radius: 10px;
      padding: 24px;
      border: 1px solid #c8dcda;
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    .chart-header h3 {
      margin: 0 0 20px 0;
      color: #17312c;
      font-size: 16px;
      font-weight: 600;
    }
    .chart-body {
      flex: 1;
      width: 100%;
      min-height: 240px;
      position: relative;
    }
  `]
})
export class ChartWidgetComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() data!: ChartWidgetData;
  @ViewChild('chartCanvas') chartCanvas?: ElementRef<HTMLCanvasElement>;

  private chart?: Chart;
  private readonly pieColors = ['#234f4f', '#6aa6b8', '#86c3a5', '#b8a5e6', '#e79aac', '#efc779'];
  private readonly chartColors = ['#234f4f', '#6aa6b8', '#86c3a5', '#b8a5e6', '#e79aac', '#efc779'];

  ngAfterViewInit(): void {
    this.renderChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && !changes['data'].firstChange) {
      this.renderChart();
    }
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private renderChart(): void {
    if (!this.chartCanvas || !this.data) return;

    this.chart?.destroy();
    this.chart = new Chart(this.chartCanvas.nativeElement, this.buildConfig());
  }

  private buildConfig(): ChartConfiguration {
    const labels = this.data.data.map(point => point.label);
    const values = this.data.data.map(point => point.value);
    const color = this.getChartColor();
    const chartType = this.data.type === 'pie' ? 'doughnut' : this.data.type;
    const isCircular = chartType === 'doughnut';
    const isLine = this.data.type === 'line';
    const isBar = this.data.type === 'bar';
    const barColors = values.map((_, index) => this.chartColors[index % this.chartColors.length]);

    return {
      type: chartType,
      data: {
        labels,
        datasets: [
          {
            label: this.data.title,
            data: values,
            borderColor: isBar ? barColors : color,
            backgroundColor: this.getBackgroundColor(isCircular, isLine, isBar, color, barColors),
            borderWidth: isCircular ? 0 : 2,
            fill: isLine,
            tension: 0.35,
            pointBackgroundColor: '#f6fbfa',
            pointBorderColor: color,
            pointBorderWidth: 2,
            pointRadius: isLine ? 4 : 0,
            pointHoverRadius: isLine ? 7 : 0,
            borderRadius: isBar ? 7 : 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          legend: {
            display: isCircular,
            position: 'bottom',
            labels: {
              color: '#667873',
              boxWidth: 10,
              boxHeight: 10,
              useBorderRadius: true
            }
          },
          tooltip: {
            backgroundColor: '#22312f',
            borderColor: '#c8dcda',
            borderWidth: 1,
            titleColor: '#ffffff',
            bodyColor: '#f7efe5',
            displayColors: true
          }
        },
        scales: isCircular ? {} : {
          x: {
            grid: { display: false },
            ticks: { color: '#8b9a96' }
          },
          y: {
            beginAtZero: true,
            grid: { color: '#d8e8e4' },
            ticks: { color: '#8b9a96' }
          }
        }
      }
    };
  }

  private softColor(color: string): string {
    const colors: Record<string, string> = {
      '#6a5af9': '#6aa6b8',
      '#00e396': '#234f4f',
      '#ffab00': '#efc779',
      '#ff477e': '#e79aac',
      '#00b8d9': '#6aa6b8',
      '#008000': '#234f4f',
      '#ffa500': '#efc779',
      '#65bfa4': '#86c3a5',
      '#72b7d9': '#6aa6b8',
      '#7b6ee6': '#b8a5e6',
      'green': '#234f4f',
      'orange': '#efc779',
      'purple': '#b8a5e6',
      'pink': '#e79aac',
      'blue': '#6aa6b8',
      'teal': '#234f4f'
    };

    return colors[color.toLowerCase()] || color;
  }

  private getChartColor(): string {
    const title = String(this.data.title || '').toLowerCase();

    if (title.includes('user growth')) {
      return '#86c3a5';
    }

    return this.softColor(this.data.color || '#6aa6b8');
  }

  private getBackgroundColor(
    isCircular: boolean,
    isLine: boolean,
    isBar: boolean,
    color: string,
    barColors: string[]
  ): string | string[] {
    if (isCircular) return this.pieColors;
    if (isBar) return barColors.map(barColor => this.hexToRgba(barColor, 0.86));
    return this.hexToRgba(color, isLine ? 0.2 : 0.82);
  }

  private hexToRgba(hex: string, alpha: number): string {
    const normalized = hex.replace('#', '');
    const bigint = parseInt(normalized.length === 3
      ? normalized.split('').map(char => char + char).join('')
      : normalized, 16);
    const red = (bigint >> 16) & 255;
    const green = (bigint >> 8) & 255;
    const blue = bigint & 255;

    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  }
}
