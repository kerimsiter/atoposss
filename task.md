[cite_start]Daha önceki adımda ürün yönetimi için backend tarafının planlandığını ve bu planın başarıyla uygulandığını doğrulayan bir dosya aldım[cite: 460, 461, 462, 463, 464]. Şimdi, bu backend API'lerini kullanacak frontend arayüzünü planlayalım.

### Frontend Geliştirme Planı: Ürün Yönetimi

Frontend, Electron-React-TypeScript altyapınızı kullanarak modern ve kullanışlı bir Ürün Yönetimi sayfası oluşturmaya odaklanacak.

#### 1. Zustand State Yönetimi
Projeye `zustand` kütüphanesini dahil ederek ürün verilerini global bir state'te tutalım.
* **`useProductStore` Hook'u**: Ürünleri (liste, seçilen ürün) ve ilgili durumları (yükleniyor, hata) yöneten bir store oluşturun.
* **Aksiyonlar (Actions)**: Bu store içinde backend'den veri çekme (`fetchProducts`), ürün ekleme (`addProduct`), ürün güncelleme (`updateProduct`) ve silme (`deleteProduct`) gibi asenkron işlemleri yöneten fonksiyonları tanımlayın. Bu fonksiyonlar, backend API'lerine yapılan çağrıları içerecek.

#### 2. Sayfa Yapısı ve Yönlendirme
Ürün yönetimi için ana bir sayfa (`src/renderer/src/pages/ProductManagement.tsx`) oluşturalım. Bu sayfa, `react-router-dom` gibi bir kütüphane ile yönlendirme altyapısına eklenebilir.

#### 3. Material UI Bileşenleri
Sayfanın bileşenlerini tasarlayalım:

* **`ProductList` Bileşeni**:
    * `TableContainer` ve `Table` bileşenleri kullanılarak ürün listesini gösterecek.
    * `TableHead` ve `TableBody` ile başlık ve içerik kısımları ayrılacak.
    * Ürün adı, kodu, fiyatı gibi bilgileri gösterecek `TableCell` bileşenleri yer alacak.
    * Her ürün için `IconButton` ile "Düzenle" (`EditIcon`) ve "Sil" (`DeleteIcon`) butonları eklenecek.
    * Arama ve filtreleme için `TextField` ve `Select` bileşenleri kullanılarak kullanıcı dostu bir arayüz sağlanacak.

* **`ProductForm` Bileşeni**:
    * Yeni ürün ekleme ve mevcut ürünü düzenleme için ortak bir form bileşeni olacak.
    * `Dialog` veya `Drawer` gibi bir bileşen içinde açılıp kapanabilir şekilde tasarlanacak.
    * Prisma şemasındaki `Product` modeline göre `TextField`, `Select` ve `Switch` gibi Material UI form elemanları kullanılacak.
    * Form gönderildiğinde, `Zustand` store'undaki ilgili aksiyon (örneğin, `addProduct` veya `updateProduct`) çağrılacak.

#### 4. Veri Akışı
1.  `ProductManagement` sayfası yüklendiğinde, `useProductStore` hook'u çağrılarak `fetchProducts` aksiyonu çalıştırılacak.
2.  Bu aksiyon, `/products` API uç noktasına bir GET isteği gönderecek ve yanıtı store'a kaydedecek.
3.  `ProductList` bileşeni, store'daki ürün listesini alacak ve ekranda gösterecek.
4.  Kullanıcı bir ürünü düzenlemek veya silmek istediğinde, ilgili butonun `onClick` olayında `Zustand` store'unun `updateProduct` veya `deleteProduct` aksiyonları çağrılacak.

Bu plan, backend'deki API'leri tüketerek kullanıcıların ürünleri kolayca yönetebileceği, modüler ve estetik bir frontend arayüzü oluşturmak için bir yol haritası sunar. Bir sonraki adımda, bu planı kodlamaya başlayabiliriz.