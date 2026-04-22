# Frontend İhtiyaç Duyulan Backend Endpoint Analizi

## Eksiklik Özeti

| Servis | Endpoint | Durum |
|--------|----------|-------|
| **auth.ts** | POST /api/auth/login | ✅ Var |
| | POST /api/auth/refresh | ❌ EKSİK |
| **product.ts** | GET /api/products | ✅ Var |
| | GET /api/products/{id} | ✅ Var |
| | POST /api/products | ❌ EKSİK |
| | PUT /api/products/{id} | ❌ EKSİK |
| | DELETE /api/products/{id} | ❌ EKSİK |
| **order.ts** | GET /api/orders | ✅ Var |
| | GET /api/orders/{id} | ✅ Var |
| | POST /api/orders | ❌ EKSİK |
| | PUT /api/orders/{id}/status | ❌ EKSİK |
| **review.ts** | GET /api/reviews/my | ✅ Var |
| | GET /api/reviews | ✅ Var |
| | GET /api/reviews/product/{productId} | ❌ EKSİK |
| | POST /api/reviews | ❌ EKSİK |
| | DELETE /api/reviews/{id} | ❌ EKSİK |
| **shipment.ts** | GET /api/shipments/order/{orderId} | ✅ Var |
| | GET /api/shipments | ❌ EKSİK |
| **analytics.ts** | GET /api/analytics/overview | ✅ Var |
| **customer.ts** | GET /api/customers | ✅ Var |
| **settings.ts** | GET /api/store-settings | ✅ Var |
| | PUT /api/store-settings | ✅ Var |
| **chat.ts** | POST /api/chat/ask | ✅ Var |

---

## Mutlak Gerekli Olan Eksikler (Frontend Çalışmak İçin)

```
POST /api/auth/refresh
POST /api/products
PUT  /api/products/{id}
DELETE /api/products/{id}
POST /api/orders
PUT  /api/orders/{id}/status
GET  /api/reviews/product/{productId}
POST /api/reviews
DELETE /api/reviews/{id}
GET  /api/shipments
```

## Yapılacaklara İlişkin Detaylı Açıklama

### 1. auth.ts - Token Refresh Eksiği
Frontend'de logout sonrası token yenileme için refresh mekanizması gerekli. Auth interceptor'da refresh logic'i var ama backend endpoint'i yok.

### 2. product.ts - CRUD İşlemleri Eksiği
Frontend'de ürün ekleme, güncelleme ve silme sayfaları var. Sadece OKUMA var, YAZMA yok.
- `createProduct(product: any)` → POST /api/products
- `updateProduct(id: number, product: any)` → PUT /api/products/{id}
- `deleteProduct(id: number)` → DELETE /api/products/{id}

### 3. order.ts - Status Güncelleme Eksiği
Siparişlerin durumu güncellenebilmeli. Admin panelinden sipariş onaylama/reddetme için:
- `updateOrderStatus(id: number, status: string)` → PUT /api/orders/{id}/status
- Sipariş oluşturma (Sepet → Sipariş) için: `createOrder(order: any)` → POST /api/orders

### 4. review.ts - Ürün Yorumları ve Yazma Eksiği
- `getProductReviews(productId: number)` → GET /api/reviews/product/{productId}
- `createReview(review: any)` → POST /api/reviews
- `deleteReview(id: number)` → DELETE /api/reviews/{id}

### 5. shipment.ts - Tüm Kargoları Listeleme Eksiği
Bağımsız shipments sayfası için:
- `getAllShipments()` → GET /api/shipments

---

## Backend'e İletilecek Mesaj

```
Frontend çalışması için aşağıdaki endpoint'lerin implementasyonu şart:

1. POST /api/auth/refresh          → Token yenileme
2. POST /api/products              → Ürün oluşturma
3. PUT  /api/products/{id}         → Ürün güncelleme
4. DELETE /api/products/{id}       → Ürün silme
5. POST /api/orders                → Sipariş oluşturma
6. PUT  /api/orders/{id}/status    → Sipariş durumu güncelleme
7. GET  /api/reviews/product/{productId} → Ürüne ait yorumlar
8. POST /api/reviews               → Yorum oluşturma
9. DELETE /api/reviews/{id}       → Yorum silme
10. GET  /api/shipments            → Tüm kargoları listeleme
```
