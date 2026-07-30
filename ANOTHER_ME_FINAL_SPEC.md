# 「另一個我」Modal 模塊 - 最終開發規格 v2.0

## 🎯 項目概述

在 kuohsinyu.github.io 主頁加入一個**全螢幕 Modal 模塊**，展示個人興趣、旅遊足跡、才藝經歷。  
採用 **Landon Norris 網站風格**，用 Lenis + GSAP 實現流暢動畫效果。

---

## 🛠️ 技術棧（已驗證）

```
平滑滾動 & 速度傳遞    → Lenis (最新版本)
動畫引擎              → GSAP 3.13.0 (含 TimelineMax)
DOM 操作              → Vanilla JavaScript (無 jQuery)
3D 效果 & 布局       → CSS Transform + GSAP
打包工具              → 保持現有設置
```

### 核心技術邏輯（參考 Landon）
- `window.lenis` 掛載在全域，隨時可調用 `.stop()` / `.start()`
- 卡片 Hover 動畫用 `gsap.to()` 或 `gsap.timeline()`
- 扇形排列用 CSS Transform + GSAP 位置計算
- 平滑過渡用 GSAP duration + easing

---

## 🎨 設計規格（最終版本）

### 色板
```css
主背景色           #CCFF00 (螢光淺綠)
文字色（主）       #1a1a1a (深灰/黑)
文字色（輔）       #555555 (中灰)
半透明遮罩         rgba(0, 0, 0, 0.3) 到 rgba(0, 0, 0, 0.5)

彩虹點綴色（區塊邊框）：
- 抱石 Bouldering   #FF006E (亮粉紅)
- 旅遊 Travel       #00B4D8 (亮藍)
- 才藝 Talents      #FFA500 (亮橙)
```

### 排版
```css
Section 標題         Iansui 28-32px (中文)
內容文字            Iansui 16px (中文)
卡片標籤            14px (國家、年份、才藝名)
留白空間            視覺舒適為主，不填滿畫面
```

### 背景波紋裝飾
```
線條顏色    白色 #FFFFFF (或 rgba(255,255,255,0.3))
背景底色    #CCFF00 (螢光淺綠)
動畫        持續流動（持續循環，無停頓）
效果        極簡線條波紋，縮放變化
實現        CSS animation 或 SVG + GSAP
```

---

## 📱 頁面結構

### Modal 容器架構
```html
<div id="anotherMeModal" class="modal-overlay hidden">
  <!-- 關閉按鈕 -->
  <button class="modal-close">✕</button>
  
  <!-- Modal 內容區 -->
  <div class="modal-content">
    
    <!-- 背景層 1：用戶照片 + 遮罩 -->
    <div class="modal-hero-bg">
      <img src="user-photo.jpg" alt="Hero Background">
      <div class="modal-hero-overlay"></div>
    </div>
    
    <!-- 背景層 2：波紋動畫 -->
    <div class="modal-wave-animation">
      <!-- SVG 或 CSS 波紋 -->
    </div>
    
    <!-- Section 1：標題介紹 -->
    <section class="modal-section intro-section">
      <h1>另一個我</h1>
      <p>Another Me</p>
      <p class="subtitle">展現我的興趣、熱情、和旅程</p>
    </section>
    
    <!-- Section 2：抱石 Bouldering -->
    <section class="modal-section bouldering-section">
      <h2>Bouldering</h2>
      <div class="bouldering-container">
        <!-- 扇形排列的 10 張照片 -->
        <div class="bouldering-grid" id="boulderingGrid">
          <!-- 動態插入 -->
        </div>
      </div>
    </section>
    
    <!-- Section 3：旅遊 Travel -->
    <section class="modal-section travel-section">
      <h2>Travel Map</h2>
      <div class="travel-container">
        <!-- 3x4 網格，12 個國家卡片 -->
        <div class="travel-grid" id="travelGrid">
          <!-- 動態插入 -->
        </div>
      </div>
    </section>
    
    <!-- Section 4：才藝 Talents -->
    <section class="modal-section talents-section">
      <h2>Talents</h2>
      <div class="talents-carousel-container">
        <!-- 主照片 -->
        <div class="carousel-main" id="talentsCarouselMain"></div>
        
        <!-- 側邊小縮圖 (1-2 張) -->
        <div class="carousel-thumbnails" id="talentsThumbnails"></div>
        
        <!-- 控制按鈕 & 自動播放 -->
        <div class="carousel-controls">
          <button class="carousel-prev">←</button>
          <button class="carousel-next">→</button>
          <div class="carousel-indicator"></div>
        </div>
      </div>
    </section>
    
  </div>
</div>
```

---

## 🎬 核心交互邏輯

### 1️⃣ Modal 打開 / 關閉

**打開**：
```javascript
// 點擊主頁的「另一個我」按鈕
document.getElementById('anotherMeBtn').addEventListener('click', () => {
  const modal = document.getElementById('anotherMeModal');
  
  // 淡入動畫 (0.3-0.5 秒)
  gsap.to(modal, {
    duration: 0.4,
    opacity: 1,
    visibility: 'visible',
    ease: 'power2.inOut'
  });
  
  // 停止主頁滾動（如果有 Lenis）
  if (window.lenis) {
    window.lenis.stop();
  }
});
```

**關閉**：
```javascript
// 點擊 ✕ 或按 ESC
document.querySelector('.modal-close').addEventListener('click', closeModal);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

function closeModal() {
  const modal = document.getElementById('anotherMeModal');
  gsap.to(modal, {
    duration: 0.4,
    opacity: 0,
    visibility: 'hidden',
    ease: 'power2.inOut',
    onComplete: () => {
      // 恢復主頁滾動
      if (window.lenis) {
        window.lenis.start();
      }
    }
  });
}
```

---

### 2️⃣ 抱石區塊 - 扇形排列

**佈局邏輯**：
```javascript
function initBoulderingFan() {
  const container = document.getElementById('boulderingGrid');
  const images = [10 張抱石照片];
  const totalImages = images.length;
  const radius = 200; // 扇形半徑
  const angleSpan = 180; // 總角度 180 度
  
  images.forEach((img, index) => {
    const angle = (angleSpan / (totalImages - 1)) * index - 90; // 0 到 180 度
    const rad = (angle * Math.PI) / 180;
    
    const x = radius * Math.cos(rad);
    const y = radius * Math.sin(rad);
    
    const card = document.createElement('div');
    card.className = 'bouldering-card';
    card.innerHTML = `<img src="${img}" alt="Bouldering">`;
    
    // 初始位置
    gsap.set(card, {
      x: x,
      y: y,
      rotation: angle,
      transformOrigin: '50% 50%'
    });
    
    // Hover 動畫
    card.addEventListener('mouseenter', () => {
      gsap.to(card, {
        duration: 0.3,
        scale: 1.1,
        zIndex: 10,
        ease: 'power2.out'
      });
    });
    
    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        duration: 0.3,
        scale: 1,
        zIndex: 1,
        ease: 'power2.out'
      });
    });
    
    container.appendChild(card);
  });
}
```

---

### 3️⃣ 旅遊區塊 - 卡片 Hover 效果

**卡片結構**：
```html
<div class="travel-card" data-country="Iceland">
  <div class="card-image-wrapper">
    <img class="card-image-main" src="iceland-main.jpg" alt="Iceland">
    <img class="card-image-hover" src="iceland-hover.jpg" alt="Iceland Detail">
  </div>
  <div class="card-label">
    <span class="country-name">Iceland</span>
    <span class="year">2024</span>
  </div>
</div>
```

**Hover 動畫邏輯**：
```javascript
function initTravelHover() {
  document.querySelectorAll('.travel-card').forEach(card => {
    const mainImg = card.querySelector('.card-image-main');
    const hoverImg = card.querySelector('.card-image-hover');
    
    card.addEventListener('mouseenter', () => {
      // 主圖淡出，Hover 圖淡入
      gsap.to(mainImg, {
        duration: 0.3,
        opacity: 0,
        ease: 'power2.out'
      });
      gsap.to(hoverImg, {
        duration: 0.3,
        opacity: 1,
        ease: 'power2.out'
      });
    });
    
    card.addEventListener('mouseleave', () => {
      // 恢復原狀
      gsap.to(mainImg, {
        duration: 0.3,
        opacity: 1,
        ease: 'power2.out'
      });
      gsap.to(hoverImg, {
        duration: 0.3,
        opacity: 0,
        ease: 'power2.out'
      });
    });
  });
}
```

**旅遊卡片佈局**：
```css
.travel-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* 3 列 */
  grid-template-rows: repeat(4, 1fr);   /* 4 列 = 3x4 */
  gap: 20px;
  padding: 40px;
}

.travel-card {
  aspect-ratio: 1; /* 正方形 */
  border: 2px solid #00B4D8;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  position: relative;
}

.card-label {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
}
```

---

### 4️⃣ 才藝區塊 - Carousel (1 大 + 1-2 小)

**Carousel 結構**：
```html
<div class="carousel-main">
  <img id="talentsMainImage" src="talent-1.jpg" alt="Talent">
</div>

<div class="carousel-thumbnails">
  <img id="talentsThumbnail1" src="talent-next-1.jpg" class="thumbnail">
  <img id="talentsThumbnail2" src="talent-next-2.jpg" class="thumbnail">
</div>

<div class="carousel-controls">
  <button id="talentsPrev" class="carousel-prev">← Prev</button>
  <button id="talentsNext" class="carousel-next">Next →</button>
  <span class="carousel-counter"><span id="currentIndex">1</span> / <span id="totalCount">23</span></span>
</div>
```

**Carousel 邏輯**：
```javascript
class TalentsCarousel {
  constructor() {
    this.images = [23 張才藝照片的陣列];
    this.currentIndex = 0;
    this.autoPlayInterval = null;
    
    this.init();
  }
  
  init() {
    document.getElementById('talentsNext').addEventListener('click', () => this.next());
    document.getElementById('talentsPrev').addEventListener('click', () => this.prev());
    
    // 自動播放
    this.startAutoPlay();
  }
  
  updateDisplay() {
    const mainImg = this.images[this.currentIndex];
    const nextImg = this.images[(this.currentIndex + 1) % this.images.length];
    const nextNextImg = this.images[(this.currentIndex + 2) % this.images.length];
    
    // 主圖動畫
    gsap.to('#talentsMainImage', {
      duration: 0.5,
      opacity: 0,
      onComplete: () => {
        document.getElementById('talentsMainImage').src = mainImg;
        gsap.to('#talentsMainImage', { opacity: 1, duration: 0.5 });
      }
    });
    
    // 小縮圖淡入
    document.getElementById('talentsThumbnail1').src = nextImg;
    document.getElementById('talentsThumbnail2').src = nextNextImg;
    
    // 更新計數器
    document.getElementById('currentIndex').textContent = this.currentIndex + 1;
  }
  
  next() {
    this.currentIndex = (this.currentIndex + 1) % this.images.length;
    this.updateDisplay();
  }
  
  prev() {
    this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
    this.updateDisplay();
  }
  
  startAutoPlay() {
    this.autoPlayInterval = setInterval(() => this.next(), 4000); // 4 秒自動切換
  }
  
  stopAutoPlay() {
    clearInterval(this.autoPlayInterval);
  }
}

// 初始化
const talentsCarousel = new TalentsCarousel();
```

**Carousel CSS**：
```css
.carousel-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  border: 2px solid #FFA500;
  border-radius: 8px;
  overflow: hidden;
  padding: 20px;
}

.carousel-main img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.carousel-thumbnails {
  display: flex;
  gap: 20px;
  padding: 20px;
  justify-content: flex-end;
}

.carousel-thumbnails img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border: 1px solid #FFA500;
  border-radius: 4px;
  cursor: pointer;
  transition: opacity 0.3s;
}

.carousel-thumbnails img:hover {
  opacity: 0.7;
}

.carousel-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  gap: 20px;
}

.carousel-controls button {
  padding: 10px 20px;
  background: #FFA500;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.carousel-controls button:hover {
  opacity: 0.8;
}
```

---

### 5️⃣ 波紋背景動畫

**實現方式 A：CSS Animation**
```css
@keyframes wave-flow {
  0% {
    transform: translateX(0) scaleY(1);
  }
  50% {
    transform: translateX(50px) scaleY(1.2);
  }
  100% {
    transform: translateX(0) scaleY(1);
  }
}

.modal-wave-animation {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url('wave-pattern.svg') repeat-x;
  opacity: 0.1;
  animation: wave-flow 6s linear infinite;
  pointer-events: none;
}
```

**實現方式 B：SVG + GSAP**（更精細控制）
```javascript
function initWaveAnimation() {
  const wavePath = document.querySelector('.modal-wave-animation path');
  
  gsap.to(wavePath, {
    duration: 8,
    attr: { d: 'M0,50 Q25,0 50,50 T100,50' }, // 波紋路徑
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut'
  });
}
```

---

## 📊 數據結構

### 旅遊國家資料
```javascript
const travelData = [
  {
    id: 'iceland',
    name: '冰島',
    nameEn: 'Iceland',
    mainImage: 'assets/img/another-me/travel/iceland-main.jpg',
    hoverImage: 'assets/img/another-me/travel/iceland-hover.jpg',
    year: '2024'
  },
  {
    id: 'albania',
    name: '阿爾巴尼亞',
    nameEn: 'Albania',
    mainImage: 'assets/img/another-me/travel/albania-main.jpg',
    hoverImage: 'assets/img/another-me/travel/albania-hover.jpg',
    year: '2024'
  },
  // ... 共 12 個國家
  {
    id: 'france',
    name: '法國',
    nameEn: 'France',
    mainImage: 'assets/img/another-me/travel/france-main.jpg',
    hoverImage: 'assets/img/another-me/travel/france-hover.jpg',
    year: '2024 / 2025 / 2026' // 多年份
  }
];
```

### 才藝照片資料
```javascript
const talentsData = [
  { image: 'assets/img/another-me/talents/gymnastics-01.jpg', category: 'Gymnastics', name: '體操' },
  { image: 'assets/img/another-me/talents/clarinet-01.jpg', category: 'Clarinet', name: '豎笛' },
  // ... 共 23 張
];
```

---

## 📦 資源清單（需要提供）

### 照片資源

#### 1. 封面照片（Hero Background）
- [ ] 你的冰島照片（高分辨率，建議 2000px 以上寬度）
- 位置：`assets/img/another-me/hero-bg.jpg`

#### 2. 抱石照片（10 張）
- [ ] 10 張抱石照片（統一尺寸，建議 600x600px）
- 位置：`assets/img/another-me/bouldering/`
- 檔名：`bouldering-01.jpg` ~ `10.jpg`

#### 3. 旅遊照片（12 國 × 2 張 = 24 張）

**必放 6 國 + 待補 6 國**：
- [ ] 冰島 Iceland（2 張：主圖 + Hover 圖）
- [ ] 阿爾巴尼亞 Albania（2 張）
- [ ] 瑞士 Switzerland（2 張）
- [ ] 克羅地亞 Croatia（2 張）
- [ ] 埃及 Egypt（2 張）
- [ ] 紐約 New York（2 張）
- [ ] 義大利 Italy（2 張）
- [ ] 倫敦 London（2 張）
- [ ] 阿聯酋 UAE（2 張）
- [ ] 奧地利 Austria（2 張）
- [ ] 德國 Germany（2 張）
- [ ] 法國 France（2 張，可註明 2024/2025/2026）

位置：`assets/img/another-me/travel/`  
檔名格式：`{country}-main.jpg` 和 `{country}-hover.jpg`

#### 4. 才藝照片（23 張）
- [ ] 體操 1 張（劈腿）→ `gymnastics-01.jpg`
- [ ] 豎笛 5 張 → `clarinet-01.jpg` ~ `05.jpg`
- [ ] 吉他 3 張 → `guitar-01.jpg` ~ `03.jpg`
- [ ] 鋼琴 1 張 → `piano-01.jpg`
- [ ] 滑單板 3 張 → `snowboard-01.jpg` ~ `03.jpg`

位置：`assets/img/another-me/talents/`

### 文案資源

- [ ] Section 1 副標題（中英）：「展現我的興趣、熱情、和旅程」或其他？
- [ ] 旅遊卡片年份標籤（確認法國的三個年份格式）
- [ ] 才藝 Carousel 的章節標題（如有的話）

---

## 🎯 開發步驟（順序很重要）

### Phase 1：基礎結構 & 樣式（1-2 天）
- [ ] 在 `index.html` 加入 Modal HTML 結構
- [ ] 在導航列加入「另一個我」按鈕（位置：最左邊）
- [ ] 寫基礎 CSS 樣式（顏色、布局、響應式）
- [ ] 匯入 Lenis 和 GSAP 庫

### Phase 2：交互邏輯（2-3 天）
- [ ] 實現 Modal 打開/關閉動畫
- [ ] 實現抱石扇形排列 + Hover 效果
- [ ] 實現旅遊卡片 Hover 動畫
- [ ] 實現才藝 Carousel

### Phase 3：波紋背景 & 細節（1 天）
- [ ] 實現波紋背景動畫
- [ ] 雙語切換整合
- [ ] 響應式測試

### Phase 4：優化 & 測試（1-2 天）
- [ ] 性能優化（圖片懶加載、動畫優化）
- [ ] 跨瀏覽器測試
- [ ] 手機 / 平板響應式測試

---

## 💾 檔案結構

```
kuohsinyu.github.io/
├── index.html                          (修改：加入 Modal + 按鈕)
├── css/
│   ├── style.css                       (修改：加入 Modal 樣式)
│   └── another-me.css                  (新增：Modal 獨有樣式，可選)
├── js/
│   ├── script.js                       (修改：加入 Modal 邏輯)
│   └── another-me.js                   (新增：Modal 交互邏輯，可選)
├── assets/
│   └── img/
│       └── another-me/
│           ├── hero-bg.jpg             (封面照)
│           ├── bouldering/
│           │   └── bouldering-01.jpg ~ 10.jpg
│           ├── travel/
│           │   └── {country}-main.jpg & {country}-hover.jpg
│           └── talents/
│               └── {talent}-01.jpg ...
└── lib/
    ├── gsap.min.js                     (GSAP 3.13.0)
    └── lenis.js                        (Lenis)
```

---

## ⚠️ 重要提醒

1. **圖片尺寸**：建議統一尺寸，避免版面抖動
   - 抱石：600x600px
   - 旅遊：400x400px
   - 才藝：500x500px
   
2. **性能**：23 + 10 + 24 = 57 張圖片，建議用懶加載或 webp 格式

3. **雙語**：所有文案都要中英對應，用 `data-zh` / `data-en` 或現有的語言系統

4. **Lenis + Modal**：打開 Modal 時要 `window.lenis.stop()`，關閉時 `window.lenis.start()`

---

## 📝 備註

- 所有動畫參數（duration、ease、delay）都可調整
- 波紋背景可用 SVG 或 CSS，看哪個效果更好
- 可隨時加入手繪裝飾（預留位置即可）
- Carousel 的自動播放時間（4 秒）可調

---

## 🚀 接下來

你準備好資源（照片 + 文案）後，直接把這份文檔丟給 Claude Code：

```
用這份規格開發「另一個我」Modal 模塊，技術棧：Lenis + GSAP，遵循所有設計細節和交互邏輯。
```

Claude Code 會按照這份文檔逐步實現！

