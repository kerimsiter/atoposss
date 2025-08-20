Harika bir fikir! Bir restoran POS sisteminde ürün görsellerinin zenginliği, hem menü oluşturma hem de müşteri deneyimi açısından çok önemlidir. `Product.images: TEXT[]` alanının mevcut olması, altyapının hazır olduğunu gösteriyor. İşte size bu "Çoklu Ürün Görseli Yönetimi" özelliğini projenize entegre etmek için adım adım bir geliştirme planı ve UI/UX önerileri:

---

### **Geliştirme Planı: Çoklu Ürün Görseli Yönetimi**

**Amaç:** Ürünlere birden fazla görsel yükleyebilme, bunları yönetebilme (ekleme, silme, sıralama) ve bir ana görsel belirleyebilme.

**Faz 1: Backend API ve Veri Modeli Adaptasyonu**

1.  **DTO (Data Transfer Object) Güncellemesi:**
    *   **`backend/src/products/dto/create-product.dto.ts`**:
        *   Mevcut `image?: string;` alanı ana görsel için kalabilir.
        *   Yeni görseller listesi için `images?: string[];` alanını ekleyin.
        ```typescript
        // backend/src/products/dto/create-product.dto.ts
        import { IsString, IsArray, IsOptional, ValidateNested } from 'class-validator';
        // ... diğer importlar

        export class CreateProductDto {
          // ... mevcut alanlar
          @IsOptional()
          @IsString()
          image?: string; // Ana ürün görseli (opsiyonel)

          @IsOptional()
          @IsArray()
          @IsString({ each: true })
          images?: string[]; // Ek ürün görselleri (URL dizisi)
          // ...
        }
        ```
    *   **`backend/src/products/dto/update-product.dto.ts`**:
        *   `PartialType` kullandığınız için `CreateProductDto`'daki `image` ve `images` alanları otomatik olarak `UpdateProductDto`'ya gelecektir. Ek bir düzenleme gerekmeyecektir.

2.  **`ProductsService` Güncellemesi:**
    *   **`create` Metodu**:
        *   Gelen `createProductDto.images` dizisini `data.images`'e atayın. Eğer `null` veya `undefined` ise boş bir dizi olarak kaydedildiğinden emin olun (`createProductDto.images ?? []`).
    *   **`update` Metodu**:
        *   Gelen `updateProductDto.images` değeri varsa, `product` modelindeki `images` alanını güncelleyin.
        *   `updateProductDto.image` değeri varsa, `product` modelindeki `image` alanını güncelleyin.
        *   **Önemli**: Eğer `updateProductDto.image` sağlanmazsa, ancak `updateProductDto.images` dizisi varsa, `image` alanını otomatik olarak `images[0]` olarak atamayı düşünebilirsiniz (veya backend'in bu kararı frontend'e bırakması daha iyi olabilir). Şu anki Prisma şemasında `image` ayrı bir alan olduğu için, frontend'in ana görseli açıkça belirtmesi daha mantıklı.

    ```typescript
    // backend/src/products/products.service.ts (İlgili kısımlar)

    async create(createProductDto: CreateProductDto) {
      // ... companyId belirleme mantığı
      const data: Prisma.ProductCreateInput = {
        // ... diğer alanlar
        image: createProductDto.image,
        images: createProductDto.images ?? [], // images dizisini doğrudan atayın
        // ...
      };
      // ... try/catch bloğu
    }

    async update(id: string, updateProductDto: UpdateProductDto) {
      // ... existingProduct kontrolü

      const data: Prisma.ProductUpdateInput = {};
      // ... diğer alanların güncellemeleri
      if (updateProductDto.image !== undefined) {
        data.image = updateProductDto.image;
      }
      if (updateProductDto.images !== undefined) {
        data.images = updateProductDto.images;
      }

      // ... transaction bloğu
      await tx.product.update({
        where: { id },
        data,
      });
      // ...
    }
    ```
3.  **`Product` Dönecek Objelerin Güncellenmesi**:
    *   `findAll`, `findOne` metodlarında `product` objesi dönerken `images` alanının da dahil edildiğinden emin olun (Prisma `include` ile otomatik gelecektir).

**Faz 2: Frontend UI/UX ve State Yönetimi Güncellemesi**

1.  **`ModernImageUpload.tsx` Bileşenini Dönüştürme:**
    *   **Prop Değişiklikleri:**
        *   `value?: string;` propunu `currentImages: string[];` olarak değiştirin.
        *   `onChange: (imageUrl: string | undefined) => void;` propunu `onChange: (imageUrls: string[]) => void;` olarak değiştirin.
        *   Ana görseli yönetmek için yeni bir prop ekleyin: `onPrimaryImageChange: (imageUrl: string) => void;` ve `primaryImageUrl: string;` (bu ana görselin hangi görsel olduğunu belirtmek için).
    *   **Çoklu Dosya Seçimi:**
        *   `<input type="file" />` elementine `multiple` özniteliğini ekleyin.
        *   `handleFileSelect` ve `handleDrop` fonksiyonlarını, `FileList`'i tek tek işlemesi için güncelleyin. Her dosya için `uploadFile` çağrılır ve dönen URL'ler geçici olarak bir array'de tutulur.
    *   **Görsel Galerisi ve Önizleme:**
        *   Yüklenmiş görselleri ( `currentImages` propundan veya bileşenin kendi içindeki geçici state'ten gelenleri) gösteren küçük bir galeri alanı oluşturun. Her bir görsel için bir `img` etiketi kullanın.
        *   **Görsel Silme**: Her önizleme görselinin üzerinde küçük bir "X" veya çöp kutusu ikonu ile o görseli listeden çıkarmayı sağlayın. Bu, `currentImages` dizisinden ilgili URL'yi çıkarıp `onChange` callback'i ile üst bileşene bildirmelidir. Eğer silinen görsel ana görselse, `onPrimaryImageChange` çağrılmalı ve muhtemelen yeni ana görsel olarak dizideki ilk görsel atanmalıdır.
        *   **Ana Görsel Belirleme**: Her görselin üzerinde, kullanıcıların bu görseli ana görsel olarak ayarlamasını sağlayan bir ikon (örneğin bir yıldız veya pin) ekleyin. Tıklandığında `onPrimaryImageChange` callback'i ile ilgili URL'yi üst bileşene iletir. Ana görsel farklı bir stil (örneğin daha kalın bir çerçeve) ile vurgulanabilir.
        *   **Sürükle-Bırak Sıralama (İsteğe Bağlı ama UX için Harika)**: `react-beautiful-dnd` veya benzeri bir kütüphane kullanarak görsellerin galeri içinde sürükle-bırak ile sıralanmasını sağlayın. Bu, `onChange` callback'ine güncel sıralanmış URL dizisini göndermelidir. İlk görselin her zaman ana görsel olmasını istiyorsanız, bu çok daha önemli hale gelir.
    *   **Yükleme İlerlemesi:** Eğer birden fazla dosya aynı anda yükleniyorsa, her dosya için ayrı bir ilerleme çubuğu veya genel bir toplu ilerleme çubuğu gösterebilirsiniz.

2.  **`ProductForm.tsx` Güncellemesi:**
    *   **Form Alanları:**
        *   `formMethods` (React Hook Form) ile `image` (ana görsel) ve `images` (ek görseller) alanlarını bağlayın.
        *   Formun açılışında (`useEffect` içindeki `reset` metodunda), `product` objesinden gelen `product.image` ve `product.images` değerlerini RHF state'ine doğru şekilde yükleyin.
    *   **`ModernImageUpload` Kullanımı:**
        *   `ModernImageUpload` bileşenini yeni prop'larla çağırın:
            ```typescript
            // frontend/src/renderer/src/components/product/ProductForm.tsx
            // ...
            const rhfImages = watch('images') as string[] | undefined;
            const rhfPrimaryImage = watch('image') as string | undefined;

            // ...
            <ModernImageUpload
              currentImages={rhfImages ?? []} // Tüm görselleri buraya gönder
              primaryImageUrl={rhfPrimaryImage ?? ''} // Ana görseli belirt
              onChange={(newImages) => {
                setValue('images', newImages, { shouldValidate: true, shouldDirty: true });
                // Eğer hiç ana görsel yoksa ve yeni görseller varsa, ilkini ana görsel yap
                if (!rhfPrimaryImage && newImages.length > 0) {
                  setValue('image', newImages[0], { shouldValidate: true, shouldDirty: true });
                }
              }}
              onPrimaryImageChange={(newPrimary) => {
                setValue('image', newPrimary, { shouldValidate: true, shouldDirty: true });
              }}
              disabled={loading}
            />
            // ...
            ```
    *   **Payload Oluşturma:** `handleSubmit` fonksiyonunda, `rhfImages` ve `rhfPrimaryImage` değerlerini backend'e gönderecek `payload` yapısını güncelleyin.

3.  **`ProductList.tsx` Güncellemesi:**
    *   Ürün listesi tablosunda, `product.image` alanı yerine `product.images` dizisindeki ilk görseli kullanarak önizlemeyi güncelleyin. Eğer `images` dizisi boşsa bir fallback ikon kullanın.
    *   Her ürün satırında, o ürünün kaç tane ek görseli olduğunu belirten küçük bir metin veya ikon (örneğin bir fotoğraf albümü ikonu ve görsel sayısı) ekleyebilirsiniz. Bu, kullanıcılara ürünün zengin medya içeriği olduğunu gösterir.

    ```typescript
    // frontend/src/renderer/src/components/product/ProductList.tsx (İlgili kısım)
    <Avatar
      src={product.image || (product.images?.length > 0 ? product.images[0] : undefined) || undefined} // Ana görseli kullan, yoksa ilk ek görseli kullan
      // ...
    >
      {!(product.image || (product.images?.length > 0)) && <InventoryIcon color="primary" />} {/* Hiç görsel yoksa fallback ikon */}
    </Avatar>
    {product.images?.length > 1 && (
      <Tooltip title={`${product.images.length} Ek Görsel`}>
        <PhotoLibraryIcon fontSize="small" color="action" /> {/* Yeni ikon */}
      </Tooltip>
    )}
    ```

4.  **`useProductStore.ts` Güncellemesi:**
    *   `Product` ve `CreateProductData` interface'lerini `images: string[];` ile güncelleyin.

    ```typescript
    // frontend/src/renderer/src/stores/useProductStore.ts
    export interface Product {
      // ...
      image?: string; // Ana görsel
      images: string[]; // Ek görseller dizisi
      // ...
    }

    export interface CreateProductData {
      // ...
      image?: string;
      images?: string[];
      // ...
    }
    ```

5.  **`productSchemas.ts` Güncellemesi:**
    *   `productBaseSchema` içinde `image` ve `images` alanları için validasyonları güncelleyin. URL formatı veya boş olup olmaması gibi durumları ele alın.

    ```typescript
    // frontend/src/renderer/src/validation/productSchemas.ts
    // ...
    export const productBaseSchema = z.object({
      // ...
      image: z.string().optional().or(z.literal('')), // Ana görsel için string veya boş string olabilir
      images: z.array(z.string().url('Geçerli bir görsel URL\'si olmalıdır')).optional(), // Her eleman URL olmalı, dizi opsiyonel
    });
    // ...
    ```
    *Not: `z.literal('')` kullanımı, boş string'i validasyon kuralına dahil etmek içindir. Eğer `ModernImageUpload` boş string döndürmez de `undefined` döndürürse, sadece `z.string().optional()` yeterli olacaktır.*

---

### **UI/UX İpuçları (ModernImageUpload Bileşeni İçin Detaylı):**

*   **Görsel Galeri Düzeni**: Yüklenmiş görselleri esnek bir kutu (`display: flex; flex-wrap: wrap; gap: 8px;`) içinde küçük kareler veya dikdörtgenler halinde gösterin.
*   **Seçilen Ana Görsel Vurgusu**: Ana görsel olarak belirlenen görselin etrafına belirgin, renkli bir çerçeve veya bir "Ana" etiketi ekleyin.
*   **Sıralama İpuçları**: Eğer sürükle-bırak sıralama eklerseniz, fare görselin üzerine geldiğinde bir "tutma" (grab) imleci göstermek veya küçük bir sürükleme ikonu (örneğin altı noktalı bir ızgara ikonu) eklemek kullanıcıya yardımcı olur.
*   **Boş Durum**: Hiç görsel yüklenmediğinde, mevcut "Ürün Resmi Yükle" alanı biraz daha büyük ve belirgin olabilir, veya "Buraya sürükleyin ya da tıklayın" gibi net bir çağrı-yapılabilir metin içerebilir.

Bu kapsamlı plan, projenizin ürün yönetimi modülünü çoklu görsel desteği ile zenginleştirecek ve bir restoran POS sistemi için daha işlevsel hale getirecektir. Başarılar dilerim!