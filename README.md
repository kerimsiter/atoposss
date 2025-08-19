# Modern Ürün Yönetim Sistemi

Bu proje, NestJS backend ve Electron-React-TypeScript frontend ile geliştirilmiş modern bir Ürün Yönetim sistemidir. Bento Pro tasarım dilinden ilham alınarak, glassmorphism efektleri ve modern UI/UX prensipleri kullanılmıştır.

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
- **Prisma Service**: Veritabanı bağlantı yönetimi ve ORM işlemleri
- **Products Module**: Tam CRUD operasyonları (oluşturma, okuma, güncelleme, silme)
- **DTOs**: `class-validator` ile güçlü ve otomatik veri doğrulama
- **CORS Support**: Frontend entegrasyonu için yapılandırılmış (http://localhost:5173, http://localhost:3000)
- **Global Validation**: Otomatik veri doğrulama pipeline'ı ile tutarlı giriş kontrolü
- **Ürün Resmi Yükleme ve Servis**: `Multer` ve `Sharp` ile güvenli ve optimize edilmiş resim yükleme, statik dosya sunumu

### REST API Endpoints:
- `POST /products` - Yeni ürün oluştur
- `GET /products` - Tüm ürünleri getir
- `GET /products/:id` - Belirli ürünü getir
- `PATCH /products/:id` - Ürün bilgilerini güncelle
- `DELETE /products/:id` - Ürünü soft-delete ile sil
- `GET /products/meta/companies` - Tanımlı şirketleri getir
- `GET /products/meta/categories` - Ürün kategorilerini getir (isteğe bağlı `companyId` filtresi ile)
- `GET /products/meta/taxes` - Vergi oranlarını getir (isteğe bağlı `companyId` filtresi ile)
- `GET /products/meta/modifier-groups` - Mevcut ek seçenek gruplarını ve seçeneklerini getir
- `GET /products/check-code-uniqueness/:code/:companyId` - Ürün kodunun şirkete özel benzersizliğini kontrol et
- `POST /upload/product-image` - Ürün resmi yükle (WebP'ye dönüştürülür ve yeniden boyutlandırılır)
- `GET /uploads/products/:filename` - Yüklenen ürün resmini getir

### Backend Yapısı:

Copy

backend/
├── src/
│   ├── prisma/
│   │   └── prisma.service.ts
│   ├── products/
│   │   ├── dto/
│   │   │   ├── create-product.dto.ts  # Ürün oluşturma DTO'su (varyant ve ek seçenekler dahil)
│   │   │   └── update-product.dto.ts  # Ürün güncelleme DTO'su (kısmi güncelleme ve varyant/ek seçenek mergelaması)
│   │   ├── products.controller.ts     # Ürün API uç noktaları ve meta data endpointleri
│   │   ├── products.service.ts        # Ürün iş mantığı, veritabanı etkileşimleri, benzersizlik kontrolü, nested işlemler
│   │   └── products.module.ts
│   ├── upload/
│   │   ├── upload.controller.ts       # Dosya yükleme API uç noktaları
│   │   └── upload.service.ts          # Resim işleme ve kaydetme mantığı (Sharp entegrasyonu)
│   ├── app.module.ts
│   └── main.ts (CORS + Validation + Static Assets)
└── prisma/
    ├── schema.prisma                  # Veritabanı şeması ve model tanımları
    └── seed.ts                        # Başlangıç verileri oluşturma (şirket, kategoriler, vergiler)


## 🎨 Frontend Implementation ✅

### Modern Bileşenler:
- **ModernButton**: Gradient ve glassmorphism efektli özelleştirilmiş butonlar
- **ModernCard**: Glassmorphism efektli ve yumuşak gölgeli kartlar
- **ModernTextField**: Modern input alanları (glassmorphism arkaplanlı)
- **ModernChip**: Gradient ve düz renk seçenekli chip bileşenleri
- **ModernImageUpload**: Figma tasarımından ilham alan sürükle-bırak destekli resim yükleme bileşeni (önizleme, ilerleme çubuğu, validasyon)

### Özellikler:
- **Zustand State Management**: Ürünler ve meta veriler için hafif ve hızlı global state yönetimi
- **React Hook Form & Zod**: Form yönetimi ve güçlü şema tabanlı validasyon
- **Modern Theme**: Inter font ailesi, özel gölgeler ve gradient arkaplanlar ile Bento Pro esintili tema
- **Responsive Design**: Tüm cihazlara uyumlu esnek arayüz
- **Smooth Animations**: Fade, hover ve transform gibi akıcı animasyonlar
- **Loading States**: Veri yüklenirken iskelet ekranlar ve backdrop loading (dairesel ilerleme)
- **Error Handling**: Modern alert ve snackbar bileşenleriyle kullanıcı dostu hata mesajları

### Frontend Yapısı:

Copy

frontend/src/renderer/src/
├── theme/
│   └── modernTheme.ts             # Material-UI için özel tema tanımları
├── components/
│   ├── ui/
│   │   ├── ModernButton.tsx
│   │   ├── ModernCard.tsx
│   │   ├── ModernTextField.tsx
│   │   ├── ModernChip.tsx
│   │   └── ModernImageUpload.tsx  # Resim yükleme bileşeni
│   ├── product/
│   │   ├── ProductList.tsx         # Ürünleri listeleyen tablo bileşeni
│   │   ├── ProductForm.tsx         # Ürün ekleme/düzenleme formu (çok sekmeli)
│   │   ├── ProductFormBasicInfo.tsx
│   │   ├── ProductFormPricing.tsx
│   │   ├── ProductFormCategories.tsx
│   │   ├── ProductFormStock.tsx
│   │   ├── ProductFormTabs.tsx     # Ürün formundaki sekmeler
│   │   ├── ProductVariantsSection.tsx # Ürün varyantlarını yöneten bölüm
│   │   ├── ProductModifiersSection.tsx # Ürün ek seçeneklerini yöneten bölüm
│   │   └── ProductAllergensSection.tsx # Ürün alerjenlerini yöneten bölüm
├── stores/
│   ├── useProductStore.ts         # Ürün verileri ve API etkileşimi için Zustand store
│   └── useMetaStore.ts            # Kategoriler, vergiler, ek seçenek grupları gibi meta veriler için Zustand store
├── pages/
│   └── ProductManagement.tsx      # Ürün yönetimi ana sayfası
├── validation/
│   └── productSchemas.ts          # Zod ile form validasyon şemaları ve özel validasyonlar (ürün kodu benzersizliği)
└── App.tsx                        # Ana uygulama bileşeni ve router


### Ana Özellikler:

1.  **Modern Product List**:
    -   Glassmorphism tablo tasarımı
    -   Gelişmiş arama ve filtreleme (ürün adı, kodu, barkod, aktif/pasif, stok takipli)
    -   Satır üzerine gelindiğinde (hover) efektleri ve animasyonlar
    -   Duyarlı (responsive) tasarım
    -   Veri yüklenirken iskelet (skeleton) ekran gösterimi

2.  **Modern Product Form**:
    -   **Multi-step form tasarımı**: Genel, varyantlar, ek seçenekler ve alerjenler sekmeleri
    -   **Glassmorphism dialog**: Şeffaf ve blur efekli şık form penceresi
    -   **Real-time validation**: `react-hook-form` ve `Zod` ile anlık veri doğrulama ve kullanıcıya geri bildirim
    -   **Smooth animations**: Form geçişleri ve etkileşimleri akıcıdır
    -   **Icon-based sections**: Her form bölümü ilgili bir ikonla belirtilmiştir
    -   **Drag & drop image upload**: Figma esintili, kullanıcı dostu resim yükleme arayüzü

3.  **Dashboard Stats**:
    -   Toplam ürün sayısı
    -   Aktif ürün sayısı
    -   Stok takipli ürün sayısı
    -   Gradient arkaplanlı şık stat kartları

4.  **Modern Theme**:
    -   **Inter font family**: Modern ve okunaklı tipografi
    -   **Custom shadows**: Material-UI'nin varsayılan gölgelerinden daha yumuşak ve katmanlı gölgeler
    -   **Gradient backgrounds**: Uygulama genelinde ve bazı bileşenlerde kullanılan yumuşak gradient geçişler
    -   **Glassmorphism effects**: Uygulamanın genel görsel kimliğini oluşturan şeffaf ve blur efekli elemanlar

## 🛠️ Kurulum ve Çalıştırma

### Gereksinimler:
-   Node.js 18+
-   PostgreSQL
-   npm veya yarn

### Backend Kurulumu:
1.  Backend dizinine gidin:
    

Copy
    cd backend
    

2.  Bağımlılıkları yükleyin:
    

Copy
    npm install
    

3.  `.env` dosyasını yapılandırın. `DATABASE_URL`'i PostgreSQL bağlantı dizginizle güncelleyin:
    

Copy

    DATABASE_URL="postgresql://username:password@localhost:5432/dbname?schema=public"
    

    *Örnek:* `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/atropos_pos_db?schema=public"`
4.  Prisma migrasyonlarını uygulayın ve Prisma Client'ı generate edin:
    

Copy
    npx prisma migrate dev --name init # İlk migrasyon için
    npx prisma generate
    

5.  Veritabanına başlangıç verilerini ekleyin (isteğe bağlı):
    

Copy
    npm run db:seed
    

6.  Backend sunucusunu başlatın:
    

Copy
    npm run start:dev
    

    (Sunucu `http://localhost:3000` adresinde çalışacaktır.)

### Frontend Kurulumu:
1.  Frontend dizinine gidin (yeni bir terminalde):
    

Copy
    cd frontend
    

2.  Bağımlılıkları yükleyin:
    

Copy
    npm install
    

    (Inter font kurulumu otomatik olarak yapılacaktır.)
3.  Electron uygulamasını geliştirme modunda başlatın:
    

Copy
    npm run dev
    

    (Uygulama `http://localhost:5173` adresine bağlanacaktır.)

## 🔧 API Entegrasyonu

Frontend, `http://localhost:3000` adresindeki backend API'sine `axios` kütüphanesi aracılığıyla bağlanır ve tüm CRUD işlemlerini gerçekleştirir. Resim yükleme, meta veri çekme ve ürün kodu benzersizlik kontrolü gibi işlemler de bu API üzerinden yönetilir.

## 🛠️ Teknolojiler

### Backend:
-   **NestJS** - Modern, modüler ve ölçeklenebilir Node.js framework
-   **Prisma ORM** - Type-safe veritabanı istemcisi ve ORM
-   **TypeScript** - Type safety ve daha güvenli kod geliştirme
-   **PostgreSQL** - Güçlü ve ilişkisel veritabanı
-   **Class Validator** - DTO'lar için deklaratif veri doğrulama
-   **Multer** - Dosya yükleme middleware'i
-   **Sharp** - Yüksek performanslı resim işleme (yeniden boyutlandırma, format dönüştürme)

### Frontend:
-   **Electron** - Cross-platform masaüstü uygulama geliştirme framework'ü
-   **React 19** - Modern ve bileşen tabanlı UI kütüphanesi
-   **TypeScript** - Frontend için type safety
-   **Material UI v7** - Kullanıma hazır ve özelleştirilebilir UI bileşen kütüphanesi
-   **Zustand** - Hafif ve esnek global state yönetimi
-   **React Hook Form** - Form yönetimi ve validasyon çözümü
-   **Zod** - Şema tabanlı veri doğrulama kütüphanesi
-   **Axios** - HTTP istekleri için Promise tabanlı istemci
-   **Styled Components** - Material-UI'nin styling motoru olarak (Electron Vite yapılandırması)
-   **Inter Font** - Modern ve profesyonel tipografi
-   **Glassmorphism** - Modern UI efektleri için özel CSS ve Material-UI styling'i

## ✅ **Yeni Eklenen Özellikler**

### **Ürün Resmi Yükleme Sistemi (Frontend)**
-   **Drag & Drop Upload**: Figma tasarımından ilham alınmış modern sürükle-bırak arayüzü
-   **File Validation**: Dosya türü (JPEG, PNG, WebP) ve boyut (maks. 5MB) kontrolü
-   **Progress Indicator**: Yükleme sırasında gerçek zamanlı ilerleme çubuğu
-   **Preview System**: Yüklenen resimlerin anında önizlemesi
-   **Error Handling**: Kullanıcı dostu hata mesajları
-   **Responsive Design**: Tüm cihazlarda uyumlu arayüz

### **Backend File Upload**
-   **Multer Integration**: Güvenli ve verimli dosya yükleme middleware'i
-   **File Validation**: MIME türü ve boyut kontrolü
-   **Static File Serving**: Yüklenen resimlerin otomatik olarak statik URL'ler üzerinden sunumu
-   **Unique Filenames**: Çakışmaları önlemek için timestamp ve rastgele dize tabanlı benzersiz dosya adlandırma
-   **Sharp Image Processing**: Yüklenen resimleri otomatik olarak 800px genişliğe yeniden boyutlandırma ve WebP formatına dönüştürme (kalite 80)

### **Gelişmiş Ürün Formu Alanları**
-   **Ürün Varyantları Yönetimi**: Ürünler için birden fazla varyant (boyut, renk vb.) tanımlama, güncelleme ve silme imkanı (`sku`, `fiyat` alanları ile)
-   **Ek Seçenek Grupları ve Seçenekleri Yönetimi**: Ürünlere eklenebilecek ek seçenek grupları (ör: "İçecek Boyutu") ve her grubun altında seçenekler (ör: "Küçük", "Orta", "Büyük") tanımlama. Mevcut ek seçenek gruplarını ekleyebilme.
-   **Alerjen Bilgileri**: Ürünlere alerjen etiketleri (Gluten, Süt vb.) ekleyebilme, önerilerle veya manuel girişle.
-   **Gelişmiş Form Validasyonları**: `React Hook Form` ve `Zod` kullanarak karmaşık nested form alanları için anlık ve şema tabanlı validasyon. Özellikle ürün kodu ve varyant SKU'ları için şirket bazında benzersizlik kontrolü.

## 🎯 Gelecek Özellikler

-   Kategori ve Vergi yönetimi için özel UI sayfaları
-   Çoklu resim desteği (ürün galerisi)
-   Resim optimizasyonu için daha detaylı ayarlar (kalite, format seçenekleri)
-   Toplu ürün işlemleri (silme, pasifleştirme vb.)
-   Ürünleri dışa aktarma/içe aktarma fonksiyonları
-   Gelişmiş filtreleme ve sıralama seçenekleri (fiyat aralığı, kategori, aktiflik)
-   Ürün varyantları ve modifikatörler için stok takibi entegrasyonu
-   Dark mode desteği
-   Çoklu dil desteği

## 📱 Ekran Görüntüleri

Sistem modern, flat ve şık bir tasarıma sahiptir:
-   Glassmorphism kartlar
-   Gradient butonlar
-   Smooth animasyonlar
-   Responsive tasarım
-   Modern tipografi

*(Buraya projenizin ekran görüntülerini ekleyebilirsiniz.)*

## 🚀 Production Hazırlığı

Sistem production kullanımına hazırdır. Ek özellikler:
-   CORS yapılandırması ✅
-   Global validation ✅
-   Error handling ✅
-   Modern UI/UX ✅
-   Type safety ✅

---