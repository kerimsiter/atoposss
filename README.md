Elbette, projenizin güncel durumunu analiz ettim ve `README.md` dosyasını en son eklenen Vergi Yönetimi (Tax Management) özellikleri ve diğer modüllerle uyumlu hale getirdim.

İşte projenizin güncel ve tam `README.md` içeriği:

***

# Modern Ürün Yönetim Sistemi

Bu proje, NestJS backend ve Electron-React-TypeScript frontend ile geliştirilmiş modern bir Ürün, Kategori ve Vergi Yönetim sistemidir. Bento Pro tasarım dilinden ilham alınarak, glassmorphism efektleri ve modern UI/UX prensipleri kullanılmıştır.

## 🎨 Tasarım Özellikleri

### Modern UI/UX:
- **Glassmorphism Effects**: Blur ve transparency efektleri ile derinlik ve modern görünüm
- **Gradient Buttons**: Estetik geçişli butonlar
- **Soft Shadows**: Yumuşak gölge efektleri ile bileşenlere katmanlı bir görünüm
- **Rounded Corners**: Yuvarlak köşelerle daha yumuşak ve çağdaş hatlar
- **Smooth Animations**: Akıcı geçiş animasyonları (fade, hover, transform)
- **Responsive Design**: Tüm ekran boyutlarına uyumlu, esnek arayüz

### Renk Paleti:
- **Primary**: `#2D68FF` (Bento Blue)
- **Success**: `#00A656` (Success Green)
- **Warning**: `#FF9800` (Orange)
- **Background**: Linear gradient (`#F8F9FA` → `#E9ECEF`)
- **Cards**: Glassmorphism (`rgba(253, 253, 253, 0.8)`)

## 🚀 Backend Implementation ✅

### Özellikler:
- **Modüler Mimari**: `ProductsModule`, `CategoriesModule` ve `TaxesModule` ile özellik bazında ayrılmış yapı.
- **Prisma Service**: Veritabanı bağlantı yönetimi ve ORM işlemleri.
- **Tam CRUD Operasyonları**: Ürün, kategori ve vergiler için oluşturma, okuma, güncelleme ve soft-delete ile silme.
- **DTOs**: `class-validator` ile güçlü ve otomatik veri doğrulama.
- **Veri Bütünlüğü**: Kategori adlarının, ürün kodlarının ve vergi kodlarının şirket bazında benzersiz olması sağlanmıştır.
- **CORS Support**: Frontend entegrasyonu için yapılandırılmış (`http://localhost:5173`, `http://localhost:3000`).
- **Global Validation**: Otomatik veri doğrulama pipeline'ı ile tutarlı giriş kontrolü.
- **Ürün Resmi Yükleme ve Servis**: `Multer` ve `Sharp` ile güvenli ve optimize edilmiş resim yükleme (gelen görseller WebP formatına dönüştürülür), statik dosya sunumu.

### REST API Endpoints:
- `POST /products` - Yeni ürün oluştur.
- `GET /products` - Ürünleri getir (filtreleme, sıralama, sayfalama destekli).
- `GET /products/:id` - Belirli bir ürünü getir.
- `PATCH /products/:id` - Ürün bilgilerini güncelle.
- `DELETE /products/:id` - Ürünü `soft-delete` ile sil.
- `POST /categories` - Yeni kategori oluştur.
- `GET /categories` - Kategorileri getir (filtreleme, sıralama, sayfalama destekli).
- `GET /categories/:id` - Belirli bir kategoriyi getir.
- `PATCH /categories/:id` - Kategori bilgilerini güncelle.
- `DELETE /categories/:id` - Kategoriyi `soft-delete` ile sil.
- `POST /taxes` - Yeni vergi oluştur.
- `GET /taxes` - Vergileri getir (filtreleme, sıralama, sayfalama destekli).
- `GET /taxes/:id` - Belirli bir vergiyi getir.
- `PATCH /taxes/:id` - Vergi bilgilerini güncelle.
- `DELETE /taxes/:id` - Vergiyi `soft-delete` ile sil.
- `GET /products/meta/companies` - Tanımlı şirketleri getir.
- `GET /products/meta/categories` - Ürün kategorilerini getir.
- `GET /products/meta/taxes` - Vergi oranlarını getir.
- `GET /products/meta/modifier-groups` - Ek seçenek gruplarını getir.
- `GET /categories/meta/parents` - Ana kategorileri getir.
- `GET /products/check-code-uniqueness` - Ürün kodunun benzersizliğini kontrol et.
- `GET /products/stats` - Ürün istatistiklerini getir.
- `POST /upload/product-image` - Ürün resmi yükle.
- `GET /uploads/products/:filename` - Yüklenen ürün resmini getir.

### Backend Yapısı:

```
backend/
├── src/
│   ├── prisma/
│   │   └── prisma.service.ts
│   ├── products/
│   │   ├── dto/
│   │   ├── products.controller.ts
│   │   ├── products.service.ts
│   │   └── products.module.ts
│   ├── categories/
│   │   ├── dto/
│   │   ├── categories.controller.ts
│   │   ├── categories.service.ts
│   │   └── categories.module.ts
│   ├── taxes/
│   │   ├── dto/
│   │   ├── taxes.controller.ts
│   │   ├── taxes.service.ts
│   │   └── taxes.module.ts
│   ├── upload/
│   │   ├── upload.controller.ts
│   │   └── upload.service.ts
│   ├── app.module.ts
│   └── main.ts
└── prisma/
    ├── migrations/
    ├── schema.prisma
    └── seed.ts
```

## 🎨 Frontend Implementation ✅

### Modern Bileşenler:
- **ModernButton, ModernCard, ModernTextField, ModernChip**: Projeye özel, modern ve tutarlı UI bileşenleri.
- **ModernImageUpload**: Sürükle-bırak destekli, önizlemeli ve ilerleme göstergeli resim yükleme bileşeni.

### Özellikler:
- **Zustand State Management**: `useProductStore`, `useCategoryStore`, `useTaxStore` ve `useMetaStore` ile modüler ve reaktif state yönetimi.
- **React Hook Form & Zod**: Form yönetimi ve güçlü, şema tabanlı validasyon.
- **Material-React-Table**: Gelişmiş tablo özellikleri (sunucu taraflı sayfalama, sıralama, filtreleme, sütun yönetimi, durum kalıcılığı, sanallaştırma).
- **Modern Theme**: Inter font ailesi, özel gölgeler ve gradient arkaplanlar ile Bento Pro esintili tema.
- **Sayfa Yönlendirme**: `react-router-dom` ile `/products`, `/categories` ve `/taxes` arasında geçiş.
- **Yükleme ve Hata Yönetimi**: Kullanıcı deneyimini iyileştiren `Backdrop`, `CircularProgress` ve `Snackbar` bileşenleri.

### Frontend Yapısı:

```
frontend/src/renderer/src/
├── theme/
│   └── modernTheme.ts
├── components/
│   ├── ui/
│   │   ├── ModernButton.tsx, ModernCard.tsx, vb.
│   │   └── ModernImageUpload.tsx
│   ├── product/
│   │   ├── ProductListMRT.tsx, ProductForm.tsx, vb.
│   ├── category/
│   │   ├── CategoryListMRT.tsx
│   │   └── CategoryForm.tsx
│   └── tax/
│       ├── TaxListMRT.tsx
│       └── TaxForm.tsx
├── stores/
│   ├── useProductStore.ts
│   ├── useCategoryStore.ts
│   ├── useTaxStore.ts
│   └── useMetaStore.ts
├── pages/
│   ├── ProductManagement.tsx
│   ├── CategoryManagement.tsx
│   └── TaxManagement.tsx
├── validation/
│   ├── productSchemas.ts
│   ├── categorySchemas.ts
│   └── taxSchemas.ts
└── App.tsx
```

### Ana Özellikler:

1.  **Modern Ürün & Kategori Listeleri**:
    -   Glassmorphism tablo tasarımı ile gelişmiş arama, sıralama ve sayfalama.
    -   Özelleştirilebilir tablo sütunları (yeniden sıralama, boyutlandırma, görünürlük, sabitleme).
    -   Kullanıcı tercihleri (sütun düzeni, sayfa boyutu vb.) tarayıcı depolamasında kalıcı olarak saklanır.

2.  **Modern Formlar (Ürün, Kategori ve Vergi)**:
    -   **Çok sekmeli ürün formu**: "Genel", "Varyantlar", "Ek Seçenekler" ve "Alerjenler" sekmeleri.
    -   **Glassmorphism dialog**: Şeffaf ve blur efektli şık form pencereleri.
    -   **Gerçek zamanlı ve şema tabanlı validasyon**: `React Hook Form` ve `Zod` ile anlık veri doğrulama. Ürün kodu ve kategori adı için benzersizlik kontrolü entegre edilmiştir.
    -   **Ürün Resmi Yükleme Sistemi**: Sürükle-bırak destekli, çoklu görsel yükleme ve ana görsel seçimi yapma imkanı tanıyan arayüz.

3.  **Modern Vergi Yönetimi**:
    -   Vergi oranlarını listelemek, eklemek, güncellemek ve silmek için tam işlevsellik.
    -   Form içinde varsayılan vergi, fiyata dahil olma gibi ayarlar.

4.  **Dashboard İstatistikleri**:
    -   Toplam, aktif ve stok takipli ürün sayılarını gösteren anlık istatistik kartları.

## 🛠️ Kurulum ve Çalıştırma

### Gereksinimler:
-   Node.js 18+
-   PostgreSQL
-   npm veya yarn

### Backend Kurulumu:
1.  `cd backend`
2.  `npm install`
3.  `.env` dosyasını `DATABASE_URL="postgresql://user:password@host:port/db?schema=public"` şeklinde yapılandırın.
4.  `npx prisma migrate dev`
5.  `npm run db:seed` (isteğe bağlı)
6.  `npm run start:dev`

### Frontend Kurulumu:
1.  `cd frontend` (yeni terminalde)
2.  `npm install`
3.  `npm run dev`

## ✅ **Yeni Eklenen Özellikler**

-   **Tam Kapsamlı Kategori Yönetimi**: Ürün yönetimine benzer şekilde, kategoriler için tam CRUD işlevselliği, modern liste ve form arayüzleri, ana-alt kategori desteği ve şirket bazında benzersiz isim kontrolü eklendi.
-   **Tam Kapsamlı Vergi Yönetimi**: Vergi oranları için tam CRUD işlevselliği, liste ve form arayüzleri, şirket bazında benzersiz kod kontrolü eklendi.
-   **Kapsamlı Ürün Formu Alanları**: Varyantlar, ek seçenek grupları (min/maks seçim) ve alerjen bilgileri yönetimi.
-   **Gelişmiş Form Validasyonları**: `Zod`'un `superRefine` özelliği ile ürün kodu ve kategori adı için hem frontend hem de backend tarafında asenkron benzersizlik kontrolü.
-   **Modern Ürün Görseli Yükleme Sistemi**: Sürükle-bırak destekli, çoklu görsel yükleme ve ana görsel seçimi yapma imkanı sunan arayüz. Yüklenen görseller backend'de optimize edilir.
-   **Soft Delete**: Veri kaybını önlemek için ürünler, kategoriler ve vergiler `deletedAt` alanı ile `soft-delete` edilir.
-   **Anlık İstatistik Kartları**: Ürün yönetimi sayfasında toplam, aktif ve stok takipli ürün sayılarını gösteren dashboard kartları.

## 🎯 Gelecek Özellikler

-   Görsel galerisi yönetimi (sıralama, etiketleme vb.).
-   Toplu ürün işlemleri (toplu silme, aktif/pasif yapma).
-   Ürünleri dışa aktarma/içe aktarma.
-   Ürün varyantları ve modifikatörler için gerçek stok takibi entegrasyonu.
-   Dark mode desteği.
-   Çoklu dil desteği.