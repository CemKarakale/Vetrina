package com.cse214.project.service;

import com.cse214.project.dto.chat.ChatAskRequest;
import com.cse214.project.dto.chat.ChatAskResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ChatService {

    public ChatAskResponse ask(ChatAskRequest request) {
        String question = request.getQuestion().toLowerCase();

        String answer = "Merhaba! Ben AI asistanınızım. Şu anda yapay zeka entegrasyonu hazırlanmaktadır. Sorularınızı yanıtlamak için yakında burada olacağım.";

        if (question.contains("ürün") || question.contains("product")) {
            answer = "Ürünlerimiz hakkında bilgi edinmek için ürün sayfamızı ziyaret edebilirsiniz. Kategorilere göre filtreleme yapabilirsiniz.";
        } else if (question.contains("sipariş") || question.contains("order")) {
            answer = "Siparişlerinizi siparişlerim sayfasından takip edebilirsiniz. Sipariş durumunuz 'Beklemede', 'Onaylandı', 'Kargoya Verildi' veya 'Teslim Edildi' olabilir.";
        } else if (question.contains("kargo") || question.contains("shipment")) {
            answer = "Kargonuzu kargo takip numarası ile takip edebilirsiniz. Sipariş detaylarından kargo bilgilerinize ulaşabilirsiniz.";
        } else if (question.contains("ödeme") || question.contains("payment")) {
            answer = "Ödemeleriniz Stripe üzerinden güvenli bir şekilde işlenmektedir. Kredi kartı bilgileriniz hiçbir zaman sistemimizde saklanmaz.";
        } else if (question.contains("fiyat") || question.contains("price")) {
            answer = "Ürün fiyatlarını görmek için ürün listesi sayfamızı ziyaret edin. Güncel fiyatlar burada gösterilmektedir.";
        } else if (question.contains(" yardım") || question.contains("help")) {
            answer = "Size nasıl yardımcı olabilirim? Ürün arama, sipariş takibi, ödeme veya kargo bilgisi konusunda sorabilirsiniz.";
        }

        return ChatAskResponse.builder().answer(answer).build();
    }
}