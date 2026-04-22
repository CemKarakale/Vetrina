import { Component, OnInit, signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth';
import { ChatService, ChatResponse } from '../../../../core/services/chat';

type Message = {
  role: 'user' | 'assistant' | 'guardrail' | 'chart';
  content?: string;
  metadata?: any;
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
  userInput: string = '';
  storeId = '1042';

  suggestions = [
    'Geçen aya göre satışlar nasıl değişti?',
    'Stoku 10\'un altına düşen ürünler?',
    'En değerli 5 müşterim kimler?',
    'Bekleyen siparişlerin toplam değeri nedir?',
    'Hangi kategoride iade oranı en yüksek?',
    'Bu hafta yapılan sevkiyatların durumu?',
    '1 yıldız alan ürünleri listele',
    'Aylık gelir trendini grafik olarak göster'
  ];

  constructor(
    public authService: AuthService,
    private chatService: ChatService
  ) {}

  ngOnInit() {}

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      this.chatScroll.nativeElement.scrollTop = this.chatScroll.nativeElement.scrollHeight;
    } catch(err) { }
  }

  sendSuggestion(text: string) {
    this.userInput = text;
    this.sendMessage();
  }

  get username() {
    return this.authService.getUsername() || 'Ahmet Şahin';
  }

  get userRole() {
     let role = this.authService.getRole() || 'USER';
     if (role.toUpperCase().startsWith('ROLE_')) role = role.replace('ROLE_', '');
     if (role === 'ADMIN' || role === 'CORPORATE') return 'Corporate User';
     return 'Individual User';
  }

  sendMessage() {
    const text = this.userInput.trim();
    if (!text) return;

    this.messages.update(m => [...m, { role: 'user', content: text }]);
    this.userInput = '';

    this.messages.update(m => [...m, { role: 'assistant', content: "💭 Yanıtınız hazırlanıyor..." }]);

    this.chatService.sendMessage(text).subscribe({
      next: (res: ChatResponse) => {
        this.messages.update(list => {
          const updated = [...list];
          updated.pop();
          updated.push({ role: 'assistant', content: res.answer });
          return updated;
        });
      },
      error: (err) => {
        this.messages.update(list => {
          const updated = [...list];
          updated.pop();
          updated.push({
            role: 'assistant',
            content: `AI servisine şu anda ulaşılamıyor: ${err.message || 'Bağlantı hatası'}`
          });
          return updated;
        });
      }
    });
  }
}
