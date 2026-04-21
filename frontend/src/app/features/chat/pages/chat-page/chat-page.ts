import { Component, OnInit, signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth';

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

  constructor(public authService: AuthService) {}

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

    const lower = text.toLowerCase();

    // Delay simulation
    setTimeout(() => {
      // Scenario 2: Prompt Injection
      if (lower.includes('ignore previous instructions')) {
         this.messages.update(m => [...m, { 
           role: 'guardrail', 
           metadata: {
              title: 'Bu mesaj güvenlik filtrelerini tetikledi.',
              tagText: 'Guardrail Agent — PROMPT INJECTION',
              alertTitle: 'Prompt Injection Tespit Edildi',
              fields: [
                { label: 'Tespit türü', value: 'Prompt Injection' },
                { label: 'Tetikleyici', value: '"Ignore previous instructions"' },
                { label: 'Hedef', value: 'store_id filtresi bypass' },
                { label: 'Eylem', value: 'İstek tamamen reddedildi' }
              ],
              sqlCrossout: 'SELECT * FROM orders WHERE store_id=? kaldırıldı (engellendi)',
              footerText: 'Sistem promptunu değiştirmeye yönelik girişimler engellenir ve kayıt altına alınır.',
              footerBadge: 'Güvenlik olayı loglandı'
           }
         }]);
         return;
      }

      // Scenario 3: Filter By-pass
      if (lower.includes('filtresini kaldır')) {
         this.messages.update(m => [...m, { 
           role: 'guardrail', 
           metadata: {
              title: 'Bu sorgu kısıtlı veri kapsamına giriyor.',
              tagText: 'Guardrail Agent — KAPSAM DIŞI',
              alertTitle: 'Kapsam Dışı Sorgu',
              fields: [
                 { label: 'Tespit türü', value: 'Filter bypass attempt' },
                 { label: 'Anahtar kelime', value: '"store_id filtresini kaldır"' },
                 { label: 'Eylem', value: 'SQL üretimi durduruldu' }
              ],
              alternativeTitle: 'Bunun yerine yapabilirim:',
              alternativeContent: 'Mağazanız (#1042) için dönemsel ciro karşılaştırması yapabilirim — örn. bu ay vs geçen ay.',
              footerBadgeAlternative: 'Kapsam dışı • Alternatif önerildi'
           }
         }]);
         return;
      }

      // Scenario 1: Cross-store Access
      if (lower.includes('2055')) {
         this.messages.update(m => [...m, { 
           role: 'guardrail', 
           metadata: {
              title: 'Bu isteği gerçekleştiremiyorum.',
              tagText: 'Guardrail Agent — ENGELLENDİ',
              alertTitle: 'Yetki Dışı Erişim Girişimi',
              fields: [
                 { label: 'Tespit türü', value: 'Cross-store data access', urgent: true },
                 { label: 'İstenen store', value: '#2055 (yetkisiz)', urgent: true },
                 { label: 'Oturum store', value: 'sadece #1042' },
                 { label: 'Eylem', value: 'SQL üretimi durduruldu', urgent: true }
              ],
              footerText: 'Yalnızca kendi mağazanız (#1042) için sorgulama yapabilirsiniz.',
              footerBadgeFail: 'SQL üretilmedi'
           }
         }]);
         return;
      }

      // Success Scenario
      if (lower.includes('en çok satan')) {
         this.messages.update(m => [...m, {
           role: 'chart',
           metadata: {
             title: 'Nisan 2026 için mağazanızın en çok satan 5 ürünü:',
             bars: [
               { label: 'Kablosuz Kulaklık', width: '85%', val: '284 ad.' },
               { label: 'Akıllı Saat X', width: '65%', val: '217 ad.' },
               { label: 'Deri Çanta', width: '55%', val: '196 ad.' },
               { label: 'Koşu Ayakkabısı Pro', width: '45%', val: '178 ad.' },
               { label: 'Güneş Gözlüğü', width: '35%', val: '143 ad.' }
             ],
             sql: "SELECT p.name, SUM(oi.quantity) AS total\nFROM order_items oi JOIN products p ON p.id = oi.product_id\nJOIN orders o ON o.id = oi.order_id\nWHERE o.store_id=1042 AND MONTH(o.created_at)=4\nGROUP BY p.id ORDER BY total DESC LIMIT 5;",
             stats: "5 satır döndü • 0.03s"
           }
         }]);
         return;
      }

      // Default reply
      this.messages.update(m => [...m, { role: 'assistant', content: "Anladım. Lütfen örnek formatlardaki senaryoları ('2055', 'Ignore previous instructions', vb) deneyerek test vakalarını inceleyin." }]);
    }, 400); // Slight delay for realism
  }
}
