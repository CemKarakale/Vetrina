import { Component, OnInit, signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth';
import { ChatService } from '../../../../core/services/chat';
import { PlotlyModule } from 'angular-plotly.js';

type Message = {
  role: 'user' | 'assistant' | 'guardrail' | 'chart';
  content?: string;
  metadata?: any;
};

@Component({
  selector: 'app-chat-page',
  standalone: true,
  imports: [CommonModule, FormsModule, PlotlyModule],
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

      // Success Scenario (Mock specific chart)
      if (lower.includes('en çok satan')) {
         this.messages.update(m => [...m, {
           role: 'chart',
           metadata: {
             title: 'Nisan 2026 için mağazanızın en çok satan 5 ürünü:',
             plotlyData: [{
               x: [284, 217, 196, 178, 143],
               y: ['Kablosuz Kulaklık', 'Akıllı Saat X', 'Deri Çanta', 'Koşu Ayakkabısı Pro', 'Güneş Gözlüğü'],
               type: 'bar',
               orientation: 'h'
             }],
             sql: "SELECT p.name, SUM(oi.quantity) AS total\nFROM order_items oi JOIN products p ON p.id = oi.product_id\nJOIN orders o ON o.id = oi.order_id\nWHERE o.store_id=1042 AND MONTH(o.created_at)=4\nGROUP BY p.id ORDER BY total DESC LIMIT 5;",
             stats: "5 satır döndü • 0.03s"
           }
         }]);
         return;
      }

      // API Backend integration for generic queries
      this.messages.update(m => [...m, { role: 'assistant', content: "💭 Verileriniz inceleniyor..." }]);
      
      this.chatService.sendMessage(text).subscribe({
         next: (res: any) => {
            this.messages.update(list => {
               const updated = [...list];
               updated.pop(); // remove loading message
               updated.push({ role: 'assistant', content: res.answer || res.response || JSON.stringify(res) });
               return updated;
            });
         },
         error: () => {
            const mockResponse = this.generateMockResponse(lower);
            this.messages.update(list => {
               const updated = [...list];
               updated.pop(); 
               updated.push({ role: 'assistant', content: mockResponse });
               return updated;
            });
         }
      });
      
    }, 400); // Slight delay for realism
  }

  generateMockResponse(text: string): string {
    if (text.includes('geçen ay')) return 'Geçen aya göre satışlarınız %15 artış gösterdi. Özellikle "Elektronik" kategorisinde belirgin bir ivme var.';
    if (text.includes('stok') && text.includes('10')) return 'Stoku 10\'un altına düşen 3 ürününüz var: 1. Akıllı Saat X (8 adet), 2. Kablosuz Şarj Cihazı (4 adet), 3. Oyuncu Klavyesi (9 adet).';
    if (text.includes('müşteri')) return 'En değerli müşterileriniz: 1. Ahmet Y. (₺12,500), 2. Mehmet K. (₺9,200), 3. Ayşe S. (₺8,100).';
    if (text.includes('bekleyen')) return 'Şu anda kargolanmayı bekleyen 14 siparişiniz bulunuyor, toplam değerleri ₺4,500.';
    if (text.includes('iade')) return 'İade oranının en yüksek olduğu kategori %12 ile "Giyim". Genellikle beden uyuşmazlığı nedeniyle iade yapılmış.';
    if (text.includes('sevkiyat')) return 'Bu hafta yapılan 45 sevkiyatın 40\'ı teslim edildi, 5\'i halen yolda.';
    if (text.includes('1 yıldız')) return '1 yıldız alan ürünler: "Ucuz Telefon Kılıfı" (Malzeme kalitesi şikayeti) ve "Pilli Radyo" (Bozuk ürün şikayeti).';
    if (text.includes('trend')) return 'Aylık gelir trendiniz yükselişte. Lütfen tam grafiksel görünüm için "bu ay en çok satan 5 ürün hangileri" sorgusunu deneyin.';

    return 'Şu anda AI sunucusuna ulaşılamıyor (Backend çevrimdışı) ve bu soru için çevrimdışı bir yanıt bulunmuyor. Lütfen daha sonra tekrar deneyin veya örnek sorulardan birini seçin.';
  }
}
