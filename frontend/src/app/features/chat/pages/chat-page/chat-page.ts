import { AfterViewChecked, Component, ElementRef, OnInit, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth';
import { AiChatResponse, ChatService } from '../../../../core/services/chat';

export type Message = {
  role: 'user' | 'assistant' | 'guardrail' | 'chart';
  content?: string;
  metadata?: any;
  sqlQuery?: string | null;
  visualizationCode?: string | null;
};

@Component({
  selector: 'app-chat-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-page.html',
  styleUrl: './chat-page.scss'
})
export class ChatPage implements OnInit, AfterViewChecked {
  @ViewChild('chatScroll') private chatScroll!: ElementRef;

  messages = signal<Message[]>([]);
  isSending = signal<boolean>(false);
  userInput = '';

  suggestions = [
    'Puan dagilimini goster',
    'En cok satan 5 urunu goster',
    'Siparis durum dagilimini goster',
    'Aylik gelir trendini grafik olarak goster',
    'En cok gelir getiren 5 urun hangileri?',
    'Stokta en az kalan 5 urunu listele',
    'Ortalama urun puani nedir?',
    'Son 7 ayda siparis trendini goster'
  ];

  constructor(
    public authService: AuthService,
    private chatService: ChatService
  ) {}

  ngOnInit() {}

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  get storeId() {
    return this.authService.getStoreId() || 'yok';
  }

  get username() {
    return this.authService.getUsername() || 'Demo User';
  }

  get userRole() {
    const role = this.normalizedRole();
    if (role === 'ADMIN' || role === 'CORPORATE') return 'Corporate User';
    if (role === 'INDIVIDUAL') return 'Individual User';
    return 'User';
  }

  get isBusy() {
    return this.isSending();
  }

  scrollToBottom(): void {
    try {
      this.chatScroll.nativeElement.scrollTop = this.chatScroll.nativeElement.scrollHeight;
    } catch {
      // ViewChild is not ready during the first render.
    }
  }

  sendSuggestion(text: string) {
    this.userInput = text;
    this.sendMessage();
  }

  sendMessage() {
    const text = this.userInput.trim();
    if (!text || this.isBusy) return;

    this.messages.update(messages => [...messages, { role: 'user', content: text }]);
    this.userInput = '';
    this.isSending.set(true);

    this.messages.update(messages => [...messages, { role: 'assistant', content: 'Verileriniz inceleniyor...' }]);

    this.chatService.sendMessage(text).subscribe({
      next: (response) => {
        this.replaceLoadingWith(this.toMessage(response));
        this.isSending.set(false);
      },
      error: () => {
        this.replaceLoadingWith({
          role: 'assistant',
          content: 'AI servisine ulasilamadi. FastAPI servisinin 8000 portunda calistigindan emin olun.'
        });
        this.isSending.set(false);
      }
    });
  }

  sqlQueryFor(message: Message): string | null | undefined {
    return message.sqlQuery;
  }

  visualizationCodeFor(message: Message): string | null | undefined {
    return message.visualizationCode;
  }

  formatAssistantAnswer(content?: string): string {
    const text = this.stripResultPrefix(content || '');
    if (!text) return '';

    const resultCard = this.renderResultCard(text);
    if (resultCard) return resultCard;

    const emptyAnswer = this.renderEmptyAnswer(text);
    if (emptyAnswer) return emptyAnswer;

    const singleLine = this.renderSingleLineAnswer(text);
    if (singleLine) return singleLine;

    return this.renderMarkdownSections(text);
  }

  private toMessage(response: AiChatResponse): Message {
    if (response.blocked_reason) {
      return this.buildGuardrailMessage(response);
    }

    const chart = this.buildChartMessage(response);
    if (chart) {
      return chart;
    }

    return {
      role: 'assistant',
      content: response.answer || 'AI yaniti bos dondu.',
      sqlQuery: response.sql_query,
      visualizationCode: response.visualization_code
    };
  }

  private buildGuardrailMessage(response: AiChatResponse): Message {
    const reason = response.blocked_reason || 'UNKNOWN';
    const titles: Record<string, string> = {
      PROMPT_INJECTION: 'Prompt injection tespit edildi',
      SCOPE_BYPASS: 'Kapsam disi veri erisimi engellendi',
      NO_STORE_ID: 'Store bilgisi eksik'
    };

    return {
      role: 'guardrail',
      metadata: {
        title: response.answer || 'Bu istegi gerceklestiremiyorum.',
        tagText: `Guardrail Agent - ${reason}`,
        alertTitle: titles[reason] || 'Guvenlik kontrolu',
        fields: [
          { label: 'Tespit turu', value: reason, urgent: true },
          { label: 'Kullanici rolu', value: this.normalizedRole() },
          { label: 'Store', value: this.storeId === 'yok' ? 'Belirtilmedi' : `#${this.storeId}` },
          { label: 'Eylem', value: 'SQL uretimi durduruldu', urgent: true }
        ],
        footerBadgeFail: 'SQL uretilmedi'
      }
    };
  }

  private buildChartMessage(response: AiChatResponse): Message | null {
    if (!response.visualization_code) return null;

    try {
      const spec = JSON.parse(response.visualization_code);
      const firstTrace = spec?.data?.[0];
      if (!firstTrace?.x || !firstTrace?.y) return null;

      const rawValues = firstTrace.y.map((value: any) => Number(value) || 0);
      const title = this.chartTitleFrom(response.answer, this.layoutTitle(spec?.layout?.title));
      const isMonthlyTrend = this.isMonthlyTrend(response.answer, this.layoutTitle(spec?.layout?.title), rawValues.length);
      const chartType = this.chartTypeFrom(firstTrace, response.answer, this.layoutTitle(spec?.layout?.title));
      const rawPoints = firstTrace.x.map((label: any, index: number) => ({
        label: this.cleanChartLabel(label, isMonthlyTrend),
        value: rawValues[index],
        displayValue: String(firstTrace.y[index])
      }));
      const points = this.prepareChartPoints(rawPoints, chartType, isMonthlyTrend);
      const values = points.map(point => point.value);
      const max = Math.max(...values, 1);

      return {
        role: 'chart',
        metadata: {
          title,
          chartType,
          summaryItems: this.chartSummaryItems(points, rawPoints.length),
          points: points.map((point: any, index: number) => ({
            ...point,
            height: `${Math.max((values[index] / max) * 100, 6)}%`
          })),
          linePoints: chartType === 'line' ? this.linePointsFor(values) : null,
          bars: points.map((point: any, index: number) => ({
            label: point.label,
            width: `${Math.max((values[index] / max) * 100, 4)}%`,
            val: point.displayValue,
            height: `${Math.max((values[index] / max) * 100, 6)}%`
          })),
          sql: response.sql_query,
          stats: `${firstTrace.x.length} satir dondu`
        }
      };
    } catch {
      return {
        role: 'assistant',
        content: response.answer || 'Grafik yaniti alindi ancak gorsellestirme okunamadi.',
        sqlQuery: response.sql_query,
        visualizationCode: response.visualization_code
      };
    }
  }

  private replaceLoadingWith(message: Message) {
    this.messages.update(messages => {
      const next = [...messages];
      const last = next[next.length - 1];
      if (last?.role === 'assistant' && last.content === 'Verileriniz inceleniyor...') {
        next.pop();
      }
      next.push(message);
      return next;
    });
  }

  private normalizedRole() {
    const role = (this.authService.getRole() || 'USER').toUpperCase().replace(/^ROLE_/, '');
    if (role === 'INDIVIDUAL_USER') return 'INDIVIDUAL';
    return role;
  }

  private renderResultCard(text: string): string | null {
    const normalized = text.replace(/\s+/g, ' ').trim();
    if (!normalized.includes(':')) return null;

    const fields = this.extractInlineFields(normalized)
      .filter(field => !this.isCountOnlyField(field));
    if (fields.length < 1) return null;

    return `
      <div class="answer-result-card">
        <div class="result-metrics">
          ${fields.map(field => `
            <div class="result-metric">
              <span>${this.escapeHtml(field.label)}</span>
              <strong>${this.escapeHtml(field.value)}</strong>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  private extractInlineFields(text: string): { label: string; value: string }[] {
    return Array.from(text.matchAll(/(?:^|\s)([^:\d][^:]*?):\s*([+-]?\d[\d.,]*(?:\s*(?:adet|ad\.|TL|TRY|USD|EUR|%))?)/g))
      .map(match => ({ label: this.cleanFieldLabel(match[1]), value: match[2].trim().replace(/^#/, '') }))
      .filter(field => field.value);
  }

  private renderEmptyAnswer(text: string): string | null {
    if (!/(bulunamad|#0\b|:\s*0\.?$)/i.test(text)) return null;

    const monthly = /bu\s+ay|current\s+month|this\s+month/i.test(text);
    const note = monthly
      ? 'Bu ay icin kayit bulunamadi. Veritabani eski tarihli olabilir; son 7 yil veya tum zamanlar icin sormayi deneyin.'
      : 'Bu kriterlere uygun kayit bulunamadi.';
    return `<p class="answer-single">${note}</p>`;
  }

  private renderSingleLineAnswer(text: string): string | null {
    if (text.includes('\n') || text.length > 180 || /[`|#]/.test(text)) return null;

    return `<p class="answer-single">${this.formatInline(this.humanizeCountOnlyAnswer(text))}</p>`;
  }

  private chartTitleFrom(answer?: string, fallback?: string): string {
    const clean = this.translateLabel(this.stripResultPrefix(answer || fallback || '').replace(/\s+/g, ' ').trim());
    const countMatch = clean.match(/^(\d+)\s+sonu\S*\s+bulundu/i);
    if (countMatch) return 'Bulunan kayitlar';

    const firstSentence = clean.split(/[.!?]/)[0]?.trim();
    if (firstSentence && firstSentence.length <= 70 && !firstSentence.includes(' Id:')) {
      return firstSentence;
    }

    return fallback || 'Analiz';
  }

  private layoutTitle(title: any): string | undefined {
    if (!title) return undefined;
    return typeof title === 'string' ? title : title.text;
  }

  private cleanChartLabel(label: any, forceMonth = false): string {
    const raw = String(label).replace(/\s+/g, ' ').trim();
    if (forceMonth) return this.monthLabel(raw);

    return this.translateLabel(String(label)
      .replace(/\s+/g, ' ')
      .replace(/\s*-\s*Id:\s*\d+/i, '')
      .replace(/\s*Id:\s*\d+/i, '')
      .trim());
  }

  private stripResultPrefix(value: string): string {
    return value
      .replace(/\r\n/g, '\n')
      .trim()
      .replace(/^(?:sorgunuzun\s+sonucu|sonu[^:]*):\s*/i, '')
      .trim();
  }

  private isCountOnlyField(field: { label: string; value: string }): boolean {
    return /sonu|kayit|adet/i.test(field.label) && /^[\d.,]+\.?$/.test(field.value);
  }

  private humanizeCountOnlyAnswer(text: string): string {
    const count = text.match(/^\s*(\d+)\.?\s*$/)?.[1];
    if (count) return `${count} kayit bulundu.`;
    return text;
  }

  private chartTypeFrom(trace: any, answer?: string, title?: string): 'bar' | 'line' | 'column' {
    const type = String(trace?.type || '').toLowerCase();
    const mode = String(trace?.mode || '').toLowerCase();
    const context = `${answer || ''} ${title || ''}`.toLowerCase();
    if (type === 'column') return 'column';
    if (/son 7 ay|last 7 month|aylik|monthly/.test(context)) return 'column';
    return type === 'scatter' || mode.includes('line') || /trend|haftalik/.test(context) ? 'line' : 'bar';
  }

  private prepareChartPoints(
    points: { label: string; value: number; displayValue: string }[],
    chartType: 'bar' | 'line' | 'column',
    isMonthlyTrend = false
  ) {
    if (chartType === 'line' || chartType === 'column') {
      const ordered = isMonthlyTrend
        ? [...points].sort((a, b) => this.monthIndex(a.label) - this.monthIndex(b.label))
        : points;
      return ordered.slice(0, 12);
    }

    const grouped = new Map<string, number>();
    points.forEach(point => {
      grouped.set(point.label, (grouped.get(point.label) || 0) + point.value);
    });

    return Array.from(grouped.entries())
      .map(([label, value]) => ({ label, value, displayValue: this.formatNumber(value) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }

  private linePointsFor(values: number[]): string {
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const span = Math.max(max - min, 1);
    const last = Math.max(values.length - 1, 1);

    return values.map((value, index) => {
      const x = (index / last) * 100;
      const y = 40 - ((value - min) / span) * 34 + 2;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(' ');
  }

  private chartSummaryItems(
    points: { label: string; value: number; displayValue: string }[],
    originalCount: number
  ) {
    if (!points.length) return [];

    const sorted = [...points].sort((a, b) => b.value - a.value);
    const total = points.reduce((sum, point) => sum + point.value, 0);
    const summary = [
      { label: 'En yuksek', value: `${sorted[0].label}: ${sorted[0].displayValue}` },
      { label: 'En dusuk', value: `${sorted[sorted.length - 1].label}: ${sorted[sorted.length - 1].displayValue}` }
    ];

    if (originalCount > points.length) {
      summary.push({ label: 'Gosterilen', value: `${points.length} / ${originalCount}` });
    } else {
      summary.push({ label: 'Toplam', value: this.formatNumber(total) });
    }

    return summary;
  }

  private translateLabel(value: string): string {
    const dictionary: Record<string, string> = {
      Sales: 'Satis',
      Revenue: 'Gelir',
      Orders: 'Siparisler',
      Products: 'Urunler',
      Customers: 'Musteriler',
      DELIVERED: 'Teslim edildi',
      Completed: 'Tamamlandi',
      Shipped: 'Kargoda',
      Pending: 'Bekliyor',
      Cancelled: 'Iptal',
      Canceled: 'Iptal',
      CANCELLED: 'Iptal',
      REFUNDED: 'Iade',
      Monday: 'Pazartesi',
      Tuesday: 'Sali',
      Wednesday: 'Carsamba',
      Thursday: 'Persembe',
      Friday: 'Cuma',
      Saturday: 'Cumartesi',
      Sunday: 'Pazar',
      Mon: 'Pzt',
      Tue: 'Sal',
      Wed: 'Car',
      Thu: 'Per',
      Fri: 'Cum',
      Sat: 'Cmt',
      Sun: 'Paz',
      'Weekly Revenue Trend': 'Haftalik gelir trendi',
      'Order Status Breakdown': 'Siparis durum dagilimi',
      'Rating Distribution': 'Puan dagilimi'
    };

    return Object.entries(dictionary).reduce(
      (label, [source, target]) => label.replace(new RegExp(`\\b${source}\\b`, 'gi'), target),
      value
    );
  }

  private formatNumber(value: number): string {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }

  private cleanFieldLabel(label: string): string {
    const hasOrderCount = /\bSiparis Sayisi\b/i.test(label) || /\bOrder Count\b/i.test(label);
    const cleaned = this.translateLabel(label)
      .replace(/\b\d+\.\s*/g, '')
      .replace(/\bSiparis Sayisi\b/gi, '')
      .replace(/\bOrder Count\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    return cleaned || (hasOrderCount ? 'Siparis sayisi' : 'Deger');
  }

  private monthLabel(label: string): string {
    const months = ['Ocak', 'Subat', 'Mart', 'Nisan', 'Mayis', 'Haziran', 'Temmuz', 'Agustos', 'Eylul', 'Ekim', 'Kasim', 'Aralik'];
    const yearMonth = label.match(/^(\d{4})-(\d{1,2})$/);
    if (yearMonth) {
      const month = Number(yearMonth[2]);
      if (month >= 1 && month <= 12) return `${months[month - 1]} ${yearMonth[1]}`;
    }
    const monthNumber = Number(label);
    if (Number.isInteger(monthNumber) && monthNumber >= 1 && monthNumber <= 12) {
      return months[monthNumber - 1];
    }
    return label;
  }

  private monthIndex(label: string): number {
    const months = ['Ocak', 'Subat', 'Mart', 'Nisan', 'Mayis', 'Haziran', 'Temmuz', 'Agustos', 'Eylul', 'Ekim', 'Kasim', 'Aralik'];
    const yearMonth = label.match(/^(\d{4})-(\d{1,2})$/);
    if (yearMonth) return Number(yearMonth[1]) * 12 + Number(yearMonth[2]);

    const monthNumber = Number(label);
    if (Number.isInteger(monthNumber) && monthNumber >= 1 && monthNumber <= 12) return monthNumber;

    const monthYear = label.match(/^([A-Za-z]+)\s+(\d{4})$/);
    if (monthYear) {
      const index = months.findIndex(month => month.toLowerCase() === monthYear[1].toLowerCase());
      if (index >= 0) return Number(monthYear[2]) * 12 + index + 1;
    }

    const index = months.findIndex(month => month.toLowerCase() === label.toLowerCase());
    return index >= 0 ? index + 1 : 99;
  }

  private isMonthlyTrend(answer?: string, title?: string, pointCount = 0): boolean {
    const context = `${answer || ''} ${title || ''}`.toLowerCase();
    return /aylik|monthly|month|son 7 ay|last 7 month/.test(context);
  }

  private renderMarkdownSections(text: string): string {
    const codeFencePattern = /```([\w-]+)?\n?([\s\S]*?)```/g;
    let html = '';
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = codeFencePattern.exec(text)) !== null) {
      html += this.renderMarkdownBlocks(text.slice(lastIndex, match.index));
      const language = match[1] ? `<span>${this.escapeHtml(match[1])}</span>` : '';
      html += `<div class="answer-code-block">${language}<pre><code>${this.escapeHtml(match[2].trim())}</code></pre></div>`;
      lastIndex = match.index + match[0].length;
    }

    html += this.renderMarkdownBlocks(text.slice(lastIndex));
    return html;
  }

  private renderMarkdownBlocks(text: string): string {
    const lines = text.split('\n');
    const blocks: string[] = [];

    for (let index = 0; index < lines.length;) {
      const line = lines[index].trim();

      if (!line) {
        index++;
        continue;
      }

      const heading = line.match(/^(#{1,3})\s+(.+)$/);
      if (heading) {
        const level = Math.min(heading[1].length + 2, 5);
        blocks.push(`<h${level}>${this.formatInline(heading[2])}</h${level}>`);
        index++;
        continue;
      }

      if (this.isTableStart(lines, index)) {
        const tableLines: string[] = [];
        while (index < lines.length && lines[index].includes('|') && lines[index].trim()) {
          tableLines.push(lines[index]);
          index++;
        }
        blocks.push(this.renderTable(tableLines));
        continue;
      }

      if (/^\s*[-*]\s+/.test(lines[index])) {
        const items: string[] = [];
        while (index < lines.length && /^\s*[-*]\s+/.test(lines[index])) {
          items.push(`<li>${this.formatInline(lines[index].replace(/^\s*[-*]\s+/, ''))}</li>`);
          index++;
        }
        blocks.push(`<ul>${items.join('')}</ul>`);
        continue;
      }

      if (/^\s*\d+[.)]\s+/.test(lines[index])) {
        const items: string[] = [];
        while (index < lines.length && /^\s*\d+[.)]\s+/.test(lines[index])) {
          items.push(`<li>${this.formatInline(lines[index].replace(/^\s*\d+[.)]\s+/, ''))}</li>`);
          index++;
        }
        blocks.push(`<ol>${items.join('')}</ol>`);
        continue;
      }

      const paragraphLines: string[] = [];
      while (
        index < lines.length &&
        lines[index].trim() &&
        !/^(#{1,3})\s+/.test(lines[index].trim()) &&
        !/^\s*[-*]\s+/.test(lines[index]) &&
        !/^\s*\d+[.)]\s+/.test(lines[index]) &&
        !this.isTableStart(lines, index)
      ) {
        paragraphLines.push(lines[index].trim());
        index++;
      }
      blocks.push(`<p>${this.formatInline(paragraphLines.join(' '))}</p>`);
    }

    return blocks.join('');
  }

  private renderTable(lines: string[]): string {
    const dataLines = lines.filter((line, index) => index !== 1 || !this.isTableSeparator(line));
    const rows = dataLines.map(line =>
      line
        .trim()
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map(cell => this.formatInline(cell.trim()))
    );

    const head = rows[0] || [];
    const body = rows.slice(1);
    return `
      <div class="answer-table-wrap">
        <table class="answer-table">
          <thead><tr>${head.map(cell => `<th>${cell}</th>`).join('')}</tr></thead>
          <tbody>${body.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>
      </div>
    `;
  }

  private isTableStart(lines: string[], index: number): boolean {
    return Boolean(lines[index]?.includes('|') && lines[index + 1] && this.isTableSeparator(lines[index + 1]));
  }

  private isTableSeparator(line: string): boolean {
    return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
  }

  private formatInline(value: string): string {
    let formatted = this.escapeHtml(value);
    formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\b(TRY|USD|EUR)\s?([\d.,]+)/g, '<strong>$1 $2</strong>');
    return formatted;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
