// ============================================================
// 「另一個我」Modal —— The World & Me（散落式相片牆＋大引言）、Hobby
// （近黑底、缺角卡片畫廊）、Bouldering（簡單橫向卡片網格）。
//
// 目前大多數照片都還沒有實體檔案，所以每張圖都掛了 onerror 備援：抓不到圖
// 就換成一塊帶標籤的色塊佔位，不會變成瀏覽器預設的破圖示。等真的照片依照
// 檔名規則放進 assets/img/another-me/ 對應的資料夾，這裡完全不用改，
// 會自動變成真正的照片。
// ============================================================

(function () {
  const modal = document.getElementById('anotherMeModal');
  const openBtn = document.getElementById('anotherMeBtn');
  const closeBtn = modal ? modal.querySelector('.modal-close') : null;
  if (!modal || !openBtn) return;

  /* ---------------- 資料 ---------------- */
  const boulderingData = Array.from({ length: 6 }, (_, i) => {
    const n = String(i + 1).padStart(2, '0');
    return { image: `assets/img/another-me/bouldering/bouldering-${n}.jpg`, label: `Bouldering ${n}` };
  });

  const travelCountries = [
    { id: 'iceland', zh: '冰島', en: 'Iceland', year: '2024' },
    { id: 'albania', zh: '阿爾巴尼亞', en: 'Albania', year: '2024' },
    { id: 'croatia', zh: '克羅地亞', en: 'Croatia', year: '2024' },
    { id: 'egypt', zh: '埃及', en: 'Egypt', year: '2024' },
    { id: 'newyork', zh: '紐約', en: 'New York', year: '2024' },
    { id: 'italy', zh: '義大利', en: 'Italy', year: '2024' },
    { id: 'london', zh: '倫敦', en: 'London', year: '2024' },
    { id: 'uae', zh: '阿聯酋', en: 'UAE', year: '2024' },
    { id: 'austria', zh: '奧地利', en: 'Austria', year: '2024' },
    { id: 'germany', zh: '德國', en: 'Germany', year: '2024' },
    { id: 'france', zh: '法國', en: 'France', year: '2024 / 2025 / 2026' },
    { id: 'greece', zh: '希臘', en: 'Greece', year: '2024' },
  ];
  const travelData = travelCountries.map((c) => ({
    ...c,
    mainImage: `assets/img/another-me/travel/${c.id}-main.jpg`,
    hoverImage: `assets/img/another-me/travel/${c.id}-hover.jpg`,
  }));

  // 只放已经有真实照片的分类——吉他还没有照片，整个分类先拿掉，
  // 不留下缺图佔位块占位置
  const talentCounts = {
    piano: 1,
    snowboard: 3,
    paragliding: 1,
    gymnastics: 1,
    clarinet: 4,
    engineering: 1,
    karting: 1,
    'skateboard-art': 1,
  };
  const talentLabels = {
    gymnastics: '體操 Gymnastics',
    clarinet: '豎笛 Clarinet',
    piano: '鋼琴 Piano',
    snowboard: '滑單板 Snowboard',
    paragliding: '滑翔傘 Paragliding',
    engineering: '工程實作 Engineering',
    karting: '卡丁車 Karting',
    'skateboard-art': '滑板彩繪 Skateboard Art',
  };
  const talentYears = {
    gymnastics: '2022',
    clarinet: '2023',
    piano: '2021',
    snowboard: '2024',
    paragliding: '2026',
    engineering: '2023',
    karting: '2024',
    'skateboard-art': '2022',
  };
  const talentsData = [];
  Object.keys(talentCounts).forEach((key) => {
    for (let i = 1; i <= talentCounts[key]; i++) {
      const n = String(i).padStart(2, '0');
      talentsData.push({
        image: `assets/img/another-me/talents/${key}-${n}.jpg`,
        label: `${talentLabels[key]} ${n}`,
        year: talentYears[key],
      });
    }
  });

  /* ---------------- 缺圖佔位備援 ---------------- */
  function attachImageFallback(imgEl, label) {
    imgEl.addEventListener(
      'error',
      () => {
        const ph = document.createElement('div');
        ph.className = 'am-placeholder ' + imgEl.className;
        ph.textContent = label;
        imgEl.replaceWith(ph);
      },
      { once: true },
    );
  }

  /* ---------------- Section：Bouldering（扇形展開，左右對稱） ---------------- */
  function initBouldering() {
    const container = document.getElementById('boulderingGrid');
    if (!container) return;
    const total = boulderingData.length;
    const radius = 1450; // 只剩 6 張之後半徑再拉大，卡片才能真的攤開有間距，不會擠成一疊
    const angleSpan = 34; // 张角跟着放宽一点，最外侧卡片略有翻转但整体仍接近水平

    boulderingData.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'bouldering-card';
      const img = document.createElement('img');
      img.src = item.image;
      img.alt = item.label;
      img.loading = 'lazy';
      attachImageFallback(img, item.label);
      card.appendChild(img);
      container.appendChild(card);

      // 扇子的支点在卡片下方 radius 处；角度对称分布（-65°~+65°），
      // x/rotation 是角度的奇函数（左右镜像），y 是偶函数（两侧一样往下垂），
      // 这样排出来才是真的左右对称的扇形，不会歪成一边高一边低的「C」
      const t = total === 1 ? 0.5 : index / (total - 1);
      const angle = -angleSpan / 2 + angleSpan * t;
      const rad = (angle * Math.PI) / 180;
      const x = radius * Math.sin(rad);
      const y = radius * (1 - Math.cos(rad));

      if (window.gsap) {
        gsap.set(card, { x, y, rotation: angle, transformOrigin: '50% 264px' });
      } else {
        card.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg)`;
      }

      card.addEventListener('mouseenter', () => {
        if (window.gsap) gsap.to(card, { duration: 0.3, scale: 1.08, zIndex: 10, ease: 'power2.out' });
      });
      card.addEventListener('mouseleave', () => {
        if (window.gsap) gsap.to(card, { duration: 0.3, scale: 1, zIndex: 1, ease: 'power2.out' });
      });
    });
  }

  /* ---------------- Section：The World & Me（散落式相片牆） ---------------- */
  function initWorldMe() {
    const grid = document.getElementById('worldMeGrid');
    if (!grid) return;

    travelData.forEach((c) => {
      const card = document.createElement('div');
      card.className = 'world-me-card';
      card.dataset.country = c.en;

      const wrap = document.createElement('div');
      wrap.className = 'card-image-wrapper';

      const mainImg = document.createElement('img');
      mainImg.className = 'card-image-main';
      mainImg.src = c.mainImage;
      mainImg.alt = c.en;
      mainImg.loading = 'lazy';
      attachImageFallback(mainImg, c.en);

      const hoverImg = document.createElement('img');
      hoverImg.className = 'card-image-hover';
      hoverImg.src = c.hoverImage;
      hoverImg.alt = `${c.en} detail`;
      hoverImg.loading = 'lazy';
      attachImageFallback(hoverImg, c.en);

      wrap.appendChild(mainImg);
      wrap.appendChild(hoverImg);

      const label = document.createElement('div');
      label.className = 'card-label';
      label.innerHTML = `<span class="country-name">${c.en}</span>`;

      card.appendChild(wrap);
      card.appendChild(label);
      grid.appendChild(card);

      // 人物照原本停在自己框框下方 100% 的位置（藏在卡片底下看不到），
      // 滑过去往上滑进来盖住风景照，滑开再往下滑出去，不是直接淡入淡出
      if (window.gsap) gsap.set(hoverImg, { yPercent: 100 });

      card.addEventListener('mouseenter', () => {
        const h = card.querySelector('.card-image-hover');
        if (window.gsap) gsap.to(h, { duration: 0.45, yPercent: 0, ease: 'power2.out' });
      });
      card.addEventListener('mouseleave', () => {
        const h = card.querySelector('.card-image-hover');
        if (window.gsap) gsap.to(h, { duration: 0.4, yPercent: 100, ease: 'power2.in' });
      });
    });
  }

  /* ---------------- Section：Hobby（缺角卡片畫廊） ---------------- */
  function initHobby() {
    const grid = document.getElementById('hobbyGrid');
    if (!grid) return;

    talentsData.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'hobby-card';

      const img = document.createElement('img');
      img.src = item.image;
      img.alt = item.label;
      img.loading = 'lazy';
      // 这张卡片本来就有独立的 .card-label 叠在照片下方显示分类名跟年份，
      // 缺图佔位块如果又把同一段文字置中显示一次，两段文字会叠在一起，
      // 读起来像故障的重复字。缺图时佔位块只留花纹、不重复放文字。
      attachImageFallback(img, '');

      const label = document.createElement('div');
      label.className = 'card-label';
      label.innerHTML = `${item.label}<span class="year">${item.year}</span>`;

      card.appendChild(img);
      card.appendChild(label);
      grid.appendChild(card);

      card.addEventListener('mouseenter', () => {
        if (window.gsap) gsap.to(card, { duration: 0.3, y: -8, ease: 'power2.out' });
      });
      card.addEventListener('mouseleave', () => {
        if (window.gsap) gsap.to(card, { duration: 0.3, y: 0, ease: 'power2.out' });
      });
    });
  }

  /* ---------------- Hobby 強制捲動：pin 住整個 section，捲動距離
     拿去驅動裡面的照片直向位移，逼使用者要把整條 track 捲完（看完
     所有照片）才會放開 pin、繼續往下滑到 Bouldering。取代原本鼠標
     移過去就會被「跟隨鼠標位置」瞬間拉走、感覺太敏感/太快的橫向
     自動捲動 ---------------- */
  function initHobbyScrollGate() {
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);
    const scroller = modal.querySelector('.modal-scroll');
    const section = document.querySelector('.hobby-section');
    const viewport = document.getElementById('hobbyScroll');
    const track = document.getElementById('hobbyGrid');
    if (!section || !viewport || !track) return;

    gsap.set(track, { y: 0 });

    ScrollTrigger.create({
      trigger: section,
      scroller,
      start: 'top top',
      end: () => '+=' + Math.max(1, track.scrollHeight - viewport.clientHeight),
      scrub: true,
      pin: true,
      anticipatePin: 1,
      onUpdate(self) {
        const travel = track.scrollHeight - viewport.clientHeight;
        gsap.set(track, { y: -travel * self.progress });
      },
    });
  }

  /* ---------------- 封面第一次向上滑：照片從四角往內縮（pin 住畫面、
     捲動距離換算成縮小進度），露出後面 #3a4900 底色＋跑動的 #ccff00
     線條；縮完之後繼續往上滑，才放開 pin、正常捲進 Halftone 那一面 ---------------- */
  function initIntroShrink() {
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);
    const scroller = modal.querySelector('.modal-scroll');
    const introSection = document.getElementById('introSection');
    const photoBox = document.getElementById('introPhotoBox');
    const introCopy = introSection ? introSection.querySelector('.intro-copy') : null;
    const lines = introSection ? introSection.querySelectorAll('.intro-line') : [];
    if (!introSection || !photoBox) return;

    gsap
      .timeline({
        scrollTrigger: {
          trigger: introSection,
          scroller,
          start: 'top top',
          end: () => '+=' + window.innerHeight,
          scrub: true,
          pin: true,
          anticipatePin: 1,
          // 缩小到一半大小之后，浏览器仍然是拿原本那张全尺寸的合成层去
          // 做插值缩放，容易看起来糊糊的；捲回最顶端（progress 回到 0）
          // 时强制清掉 will-change 底下残留的合成层，逼浏览器重新用
          // scale:1 的原生尺寸重画一次，封面才会重新变回清晰
          onUpdate(self) {
            if (self.progress === 0) {
              photoBox.style.willChange = 'auto';
              // eslint-disable-next-line no-unused-expressions
              photoBox.offsetHeight;
              photoBox.style.willChange = 'transform, border-radius';
            }
          },
        },
      })
      .to(introCopy, { opacity: 0, y: -30, ease: 'none' }, 0)
      .to(photoBox, { scale: 0.55, borderRadius: '20px', ease: 'none', force3D: true }, 0);

    // 線條持續慢慢漂移，跟捲動位置沒有關係，縮小之後才會露出來看到它在動
    lines.forEach((line, i) => {
      gsap.to(line, {
        x: i % 2 === 0 ? 60 : -60,
        duration: 9 + i * 2.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    });
  }

  /* ---------------- 捲動進場動畫：每個分頁自己的標題／說明淡入上移，
     卡片群組用 stagger 一張一張陸續出現，滾動到哪裡就補上動畫，
     不是整頁一次全部靜態擺好 ---------------- */
  function initScrollReveals() {
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);
    const scroller = modal.querySelector('.modal-scroll');

    gsap.utils.toArray('.am-reveal').forEach((el) => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, scroller, start: 'top 88%' },
        },
      );
    });

    // Hobby 的卡片不进这个 stagger reveal——它们的位置已经交给
    // initHobbyScrollGate() 的 pin+scrub 逐张位移控制，GSAP 在这里
    // 再用 y 做一次 fromTo 会跟卡片本来 CSS 设的 translateX 打架
    // （两者都会整个覆写 transform，其中一个会被吃掉）
    [
      ['.world-me-card', '#worldMeGrid'],
      ['.bouldering-card', '#boulderingGrid'],
    ].forEach(([cardSelector, containerSelector]) => {
      const container = document.querySelector(containerSelector);
      if (!container) return;
      const cards = container.querySelectorAll(cardSelector);
      if (!cards.length) return;
      gsap.fromTo(
        cards,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power2.out',
          stagger: 0.06,
          scrollTrigger: { trigger: container, scroller, start: 'top 88%' },
        },
      );
    });

    ScrollTrigger.refresh();
  }

  /* ---------------- Modal 開關 ---------------- */
  let initialized = false;
  function openModal() {
    if (!initialized) {
      initWorldMe();
      initHobby();
      initBouldering();
      initIntroShrink();
      initHobbyScrollGate();
      initScrollReveals();
      initialized = true;
    }
    modal.classList.remove('hidden');
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    // Modal 打开时暂停主页面的 3D 背景、启动 halftone 装饰场景，
    // 避免两个 WebGL 场景同时跑
    if (window.__bg3dPause) window.__bg3dPause();
    if (window.__haltoneSetModalOpen) window.__haltoneSetModalOpen(true);
    if (window.gsap) {
      gsap.to(modal, { duration: 0.4, opacity: 1, visibility: 'visible', ease: 'power2.inOut' });
    } else {
      modal.style.opacity = 1;
      modal.style.visibility = 'visible';
    }
  }

  function closeModal() {
    const finish = () => {
      modal.classList.remove('is-open');
      document.body.style.overflow = '';
    };
    if (window.__bg3dResume) window.__bg3dResume();
    if (window.__haltoneSetModalOpen) window.__haltoneSetModalOpen(false);
    if (window.gsap) {
      gsap.to(modal, { duration: 0.4, opacity: 0, visibility: 'hidden', ease: 'power2.inOut', onComplete: finish });
    } else {
      modal.style.opacity = 0;
      modal.style.visibility = 'hidden';
      finish();
    }
  }

  openBtn.addEventListener('click', openModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });
})();
