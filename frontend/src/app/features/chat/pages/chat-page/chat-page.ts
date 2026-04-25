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
    'Gecen aya gore satislar nasil degisti?',
    'Stoku 10 un altina dusen urunler?',
    'En degerli 5 musterim kimler?',
    'Bekleyen siparislerin toplam degeri nedir?',
    'Hangi kategoride iade orani en yuksek?',
    'Bu hafta yapilan sevkiyatlarin durumu?',
    '1 yildiz alan urunleri listele',
    'Aylik gelir trendini grafik olarak goster'
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

      const values = firstTrace.y.map((value: any) => Number(value) || 0);
      const max = Math.max(...values, 1);

      return {
        role: 'chart',
        metadata: {
          title: response.answer || spec?.layout?.title || 'Sorgu sonucu',
          bars: firstTrace.x.map((label: any, index: number) => ({
            label: String(label),
            width: `${Math.max((values[index] / max) * 100, 4)}%`,
            val: String(firstTrace.y[index])
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
}
