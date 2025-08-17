# Modern Product Management System

Bu proje, NestJS backend ve Electron-React-TypeScript frontend ile geliştirilmiş modern bir Ürün Yönetim sistemidir. Bento Pro tasarım dilinden ilham alınarak, glassmorphism efektleri ve modern UI/UX prensipleri kullanılmıştır.

## 🎨 Tasarım Özellikleri

### Modern UI/UX:
- **Glassmorphism Effects**: Blur ve transparency efektleri
- **Gradient Buttons**: Modern gradient butonlar
- **Soft Shadows**: Yumuşak gölge efektleri
- **Rounded Corners**: Yuvarlak köşeler
- **Smooth Animations**: Akıcı geçiş animasyonları
- **Responsive Design**: Tüm ekran boyutlarına uyumlu

### Renk Paleti:
- **Primary**: #2D68FF (Bento Blue)
- **Success**: #00A656 (Success Green)
- **Background**: Linear gradient (#F8F9FA → #E9ECEF)
- **Cards**: Glassmorphism (rgba(253, 253, 253, 0.8))

## 🚀 Backend Implementation ✅

### Özellikler:
- **Prisma Service**: Veritabanı bağlantı yönetimi
- **Products Module**: Tam CRUD operasyonları
- **DTOs**: class-validator ile veri doğrulama
- **CORS Support**: Frontend entegrasyonu
- **Global Validation**: Otomatik veri doğrulama

### REST API Endpoints:
- `POST /products` - Ürün oluştur
- `GET /products` - Tüm ürünleri getir
- `GET /products/:id` - Belirli ürünü getir
- `PATCH /products/:id` - Ürün güncelle
- `DELETE /products/:id` - Ürün sil
- `GET /products/meta/companies` - Şirketleri getir
- `GET /products/meta/categories` - Kategorileri getir
- `GET /products/meta/taxes` - Vergi oranlarını getir
- `POST /upload/product-image` - Ürün resmi yükle
- `GET /upload/products/:filename` - Ürün resmini getir

### Backend Yapısı:
```
backend/
├── src/
│   ├── prisma/
│   │   └── prisma.service.ts
│   ├── products/
│   │   ├── dto/
│   │   │   ├── create-product.dto.ts
│   │   │   └── update-product.dto.ts
│   │   ├── products.controller.ts
│   │   ├── products.service.ts
│   │   └── products.module.ts
│   ├── app.module.ts
│   └── main.ts (CORS + Validation)
└── prisma/
    └── schema.prisma
```

## 🎨 Frontend Implementation ✅

### Modern Bileşenler:
- **ModernButton**: Gradient ve glassmorphism butonlar
- **ModernCard**: Glassmorphism kartlar
- **ModernTextField**: Modern input alanları
- **ModernChip**: Gradient chip bileşenleri
- **ModernImageUpload**: Drag & drop resim yükleme (Figma inspired)

### Özellikler:
- **Zustand State Management**: Global state yönetimi
- **Modern Theme**: Bento Pro inspired tema
- **Responsive Design**: Tüm cihazlara uyumlu
- **Smooth Animations**: Fade, hover ve transform efektleri
- **Loading States**: Skeleton ve backdrop loading
- **Error Handling**: Modern alert ve snackbar

### Frontend Yapısı:
```
frontend/src/renderer/src/
├── theme/
│   └── modernTheme.ts
├── components/
│   ├── ui/
│   │   ├── ModernButton.tsx
│   │   ├── ModernCard.tsx
│   │   ├── ModernTextField.tsx
│   │   └── ModernChip.tsx
│   ├── ProductList.tsx
│   └── ProductForm.tsx
├── stores/
│   ├── useProductStore.ts
│   └── useMetaStore.ts
├── pages/
│   └── ProductManagement.tsx
└── App.tsx
```

### Ana Özellikler:

1. **Modern Product List**:
   - Glassmorphism tablo tasarımı
   - Gelişmiş arama ve filtreleme
   - Hover efektleri ve animasyonlar
   - Responsive tasarım
   - Loading skeleton

2. **Modern Product Form**:
   - Multi-step form tasarımı
   - Glassmorphism dialog
   - Real-time validation
   - Smooth animations
   - Icon-based sections
   - Drag & drop image upload

3. **Dashboard Stats**:
   - Toplam ürün sayısı
   - Aktif ürün sayısı
   - Stok takipli ürün sayısı
   - Gradient stat kartları

4. **Modern Theme**:
   - Inter font family
   - Custom shadows
   - Gradient backgrounds
   - Glassmorphism effects

## 🛠️ Kurulum ve Çalıştırma

### Gereksinimler:
- Node.js 18+
- PostgreSQL
- npm veya yarn

### Backend Kurulumu:
```bash
cd backend
npm install

# Veritabanı bağlantısını .env dosyasında yapılandırın
# DATABASE_URL="postgresql://username:password@localhost:5432/dbname"

# Prisma migration
npx prisma migrate dev
npx prisma generate

# Sunucuyu başlat
npm run start:dev
```

### Frontend Kurulumu:
```bash
cd frontend
npm install

# Inter font kurulumu otomatik olarak yapılacak
npm run dev
```

## 🔧 API Entegrasyonu

Frontend, `http://localhost:3000` adresindeki backend API'sine bağlanır ve tüm CRUD işlemlerini gerçekleştirir.

## 🛠️ Teknolojiler

### Backend:
- **NestJS** - Modern Node.js framework
- **Prisma ORM** - Type-safe database client
- **TypeScript** - Type safety
- **PostgreSQL** - Veritabanı
- **Class Validator** - DTO validation

### Frontend:
- **Electron** - Desktop app framework
- **React 19** - UI library
- **TypeScript** - Type safety
- **Material UI v7** - Component library
- **Zustand** - State management
- **Inter Font** - Modern typography
- **Glassmorphism** - Modern UI effects

## ✅ **Yeni Eklenen Özellikler**

### **Ürün Resmi Yükleme Sistemi**
- **Drag & Drop Upload**: Figma tasarımından ilham alınmış modern upload arayüzü
- **File Validation**: Dosya türü ve boyut kontrolü
- **Progress Indicator**: Real-time upload progress
- **Preview System**: Yüklenen resimlerin önizlemesi
- **Error Handling**: Kullanıcı dostu hata mesajları
- **Responsive Design**: Tüm cihazlarda uyumlu

### **Backend File Upload**
- **Multer Integration**: Güvenli dosya yükleme
- **File Validation**: MIME type ve boyut kontrolü
- **Static File Serving**: Otomatik resim servisi
- **Unique Filenames**: Çakışma önleme sistemi

## 🎯 Gelecek Özellikler

- Kategori ve Vergi yönetimi
- Çoklu resim desteği
- Resim optimizasyonu
- Toplu işlemler
- Export/Import fonksiyonları
- Gelişmiş filtreleme ve sıralama
- Ürün varyantları ve modifikatörler
- Dark mode desteği
- Çoklu dil desteği

## 📱 Ekran Görüntüleri

Sistem modern, flat ve şık bir tasarıma sahiptir:
- Glassmorphism kartlar
- Gradient butonlar
- Smooth animasyonlar
- Responsive tasarım
- Modern tipografi

## 🚀 Production Hazırlığı

Sistem production kullanımına hazırdır. Ek özellikler:
- CORS yapılandırması ✅
- Global validation ✅
- Error handling ✅
- Modern UI/UX ✅
- Type safety ✅