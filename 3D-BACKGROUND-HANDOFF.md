# 3D 背景交接文件（給接手的 Claude / 開發者看）

> **更新：下面「已知問題」段落描述的三個懷疑點都已經排查完並修好了**（2026-07-29）。
> 當時這份文件其實只寫完了規劃，`js/bg3d.js` 從來沒有真的被建立過——`index.html`/
> `css/style.css` 也都還沒接上 importmap、`#bg3d`、`#bg3dHotspot`。這次是照著這份文件
> 從零把 `js/bg3d.js` 寫出來，並在瀏覽器（Playwright + headless Chromium + swiftshader
> 軟體渲染）裡實際跑起來一輪一輪调的，過程中還額外抓到文件寫的時候沒發現的兩個 bug：
>
> 1. **河流被地形埋掉**：山谷地形用 `smoothstep` 把高度壓到 0 的範圍，跟河流飄帶實際
>    覆蓋的寬度沒對齊，河流兩側的地形邊坡比河面高，从远处看整條河都被地形擋住。
> 2. **山脈把河流「排序」蓋過去**：山脈材質原本設了 `transparent:true`（想讓它能配合
>    城市做淡出），結果跟河流（也是 transparent，且 `depthWrite:false`）一起被丟進
>    Three.js 的半透明佇列，用「物件距離」排序而不是逐像素深度測試，本質上不透明的山脈
>    常常在排序上贏，直接蓋掉河流的顏色。修法：山脈維持不透明（拿掉 `transparent:true`），
>    改成 `cityMix` 到一定比例後用 `visible = false` 整個隱藏，而不是靠 opacity 淡出。
>
> 攝影機的 `cameraPos`/`cameraTarget`/`groupOffsetX` 也整組重新試出來（原本的值确实
> 如文件所述「從沒被驗證過」，实际渲染出来后地形几乎贴到镜头、佔满整个画面）。目前
> CONFIG 的值已经是验证过、构图偏向右侧且河流清楚可见的版本，见下方最新 CONFIG。
> 如果之後又要调，一样建议直接起本机服务器＋浏览器 Console 检查，不要再凭数学猜。

這份文件是寫給接手這個功能的人（或 AI）看的，目的是讓你不用重新猜測需求，直接接著修就好。
**請先讀完「已知問題」那一段再開始動手**，那是目前最需要處理的部分（歷史記錄，問題已修復，保留原文供参考）。

## 這個功能在做什麼

在 `kuohsinyu.github.io`（Syndrea Kuo 的個人作品集，純 HTML/CSS/JS，無框架）的背景加一個
用 Three.js 程式生成的 3D 場景：

- **Landing（Hero）區**：一座程式生成的山脈，中間有一條會發光流動的河，構圖上偏向畫面右側
  （左側留給網站原本的大標題文字），滑鼠拖曳畫面右側可以環繞場景看，放開後會自動緩慢漂移。
- **捲動到 About 區塊時**：山脈跟河流淡出，換成一片低調的深色建築剪影＋散落白色窗光的城市。
- 整體配色刻意跟著網站本身的視覺語言走：深綠/近黑背景（`--bg:#071c12`／`--bg-deep:#04120b`）
  ＋ 白色發光（呼應網站原本的 `.hover-dot`／`.coaster-cart`／`box-shadow` 白光效果）。

這不是外部素材/模型檔，全部是程式（Three.js geometry + shader）即時生成的，沒有任何
`.glb`/`.fbx` 之類的檔案需要管理。

## 目前狀態：功能已經寫好，但畫面上看不見任何東西

部署後使用者反饋：Landing 頁面完全看不到山脈或河流，只在畫面上看到一個孤立的、位置不太對的
發光小點（不屬於原本網站的 8x8 技能點矩陣）。這個孤立光點暗示場景**很可能有載入、也有在渲染**，
只是幾乎不可見。請先按照下面順序排查：

### 第一步：打開瀏覽器 Console 確認有沒有報錯

F12 → Console。如果有紅字錯誤（例如 three.js 從 CDN 載入失敗、import map 路徑錯誤、
shader compile error 等），先解掉這個問題，此時任何視覺調整都沒意義。

### 第二步（最可能的原因）：顏色對比度太低

`js/bg3d.js` 裡山脈的顏色特意跟網站背景色系很接近，想做到「融入」，結果可能做過頭：

```js
const valleyColor = new THREE.Color('#0a2416'); // 跟 --bg-deep (#04120b) 太接近
const rockColor   = new THREE.Color('#123a26');
const peakColor   = new THREE.Color('#2c5a41'); // 亮部也不夠亮，撐不起輪廓
```

加上 `scene.fog = new THREE.FogExp2('#04120b', 0.021)` 又用了幾乎一樣的深色去霧化。
建議：把 `peakColor` 拉亮到接近白色的冷色調（例如 `#8fb8a3` 甚至更亮），或是乾脆讓稜線
用近白色描邊/rim light 強化，確保跟背景至少有肉眼可辨的亮度差。河流的顏色反而應該沒問題
（用了 `AdditiveBlending` 加色混合、顏色是 `vec3(0.8,0.95,1.0)` 偏白，理論上會發光），
如果連河流都看不到，那更可能是第一步的載入問題，或攝影機根本沒對準地形（見下）。

### 第三步：攝影機構圖從沒被實際驗證過

`CONFIG.cameraPos` / `CONFIG.cameraTarget` / `CONFIG.groupOffsetX` 這幾個值是純數學算的，
**沒有經過任何瀏覽器渲染驗證**（開發時沒有可用的瀏覽器/WebGL 環境）。有可能地形整個落在
攝影機視錐（frustum）之外，或是被縮得太小太遠。建議：先把 `groupOffsetX` 設成 `0`、
`cameraTarget` 設成跟地形真正的世界座標中心一致，確認「有沒有畫面」，再慢慢調整偏移量
去達到「山脈偏右側」的構圖效果，而不是一開始就用猜的偏移值。

## 檔案結構 / 改了什麼

只動了 3 個地方，其餘網站內容（文字、雙語切換、Experience 卡片邏輯）完全沒有更動：

1. **`index.html`**：在 `<head>` 加了一個 `importmap`（從 jsdelivr CDN 載入 three.js），
   在 `<body>` 最前面加了 `<div id="bg3d">` 和 `<div id="bg3dHotspot">`，在最後面加了
   `<script type="module" src="js/bg3d.js"></script>`。
2. **`css/style.css`**：檔案最尾端加了 `#bg3d` / `#bg3dHotspot` 的樣式（固定定位、
   `z-index:-1` 讓它一定在所有內容後面、響應式媒體查詢在手機/觸控裝置上直接隱藏）。
3. **`js/bg3d.js`**（新檔案）：所有 Three.js 邏輯都在這裡，包括地形生成、河流 shader、
   城市生成、捲動觸發的淡出/淡入、拖曳互動。

## 調整用的 CONFIG（在 `js/bg3d.js` 最上面）

以下是實際在瀏覽器裡驗證過、目前正在用的版本（不是最初未驗證的猜測值）：

```js
const CONFIG = {
  groupOffsetX: 30,          // 整個場景往右偏移多少，數字越大越靠右
  cameraPos: [-15, 36, 62],  // 拉遠、拉高過，避免地形貼到鏡頭佔滿整個畫面
  cameraTarget: [30, 1, -15],
  fov: 48,
  riverBrightness: 1.35,
  riverGlowWidthScale: 1.9,
  particleCount: 260,
  cityBuildingCount: 30,
  cityWindowCount: 260,
  autoDriftSpeed: 0.035,
  dragSensitivity: 0.005,
  cityMixEase: 0.035,
};
```

另外 `scene.fog` 密度也從 `0.021` 調到 `0.009`——原本的密度配上拉遠後的攝影機距離，
會把地形整個霧化成看不出顏色的純黑剪影（`FogExp2` 的霧化程度跟距離的平方成正比，
拉遠鏡頭之後密度要跟著往下调，不能照抄原本近距离时算好的数值）。

## 需要注意、別不小心弄壞的地方

- **拖曳熱區（`#bg3dHotspot`）只在 Hero 出現在畫面上時才會有 `pointer-events`**
  （透過 `IntersectionObserver` 監看 `#hero`，加/移除 `.is-active` class）。這是刻意設計，
  避免這塊透明熱區在使用者捲到 Experience 區塊時，不小心蓋住 `.exp-card-mini` 卡片、
  擋住原本 hover 展開詳情的互動。**修改時如果不小心把這段邏輯拿掉，記得測試一下
  Experience 卡片的 hover 還能不能正常開啟聚光燈。**
- 手機/觸控裝置（`innerWidth < 900` 或 `pointer: coarse`）完全不載入 3D 背景，這是刻意的
  效能考量，不是漏掉。
- 山脈/城市的淡出淡入是用 `material.opacity` + `visible` 控制，`IntersectionObserver`
  監看 `#about`，捲進畫面 35% 就觸發 `cityMixTarget = 1`。

## 建議的測試方式

因為這是純靜態網站，本機起個伺服器就能測（不需要任何建置流程）：

```bash
cd kuohsinyu.github.io   # 你的 repo 根目錄
python3 -m http.server 8000
# 瀏覽器打開 http://localhost:8000，記得開 Console 看有沒有報錯
```

建議調整順序：先確認「有沒有東西畫出來」（不管好不好看），再調對比度，再調構圖偏移，
最後才調細節（河流亮度、城市建築數量之類）。有畫面回饋的話，這幾輪應該很快就能收斂。
