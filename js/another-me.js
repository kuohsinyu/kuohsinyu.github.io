// ============================================================
// 「另一個我」Modal —— 抱石扇形排列、旅遊卡片 hover 換圖、才藝 Carousel、
// 波紋背景動畫。動畫用 GSAP（已透過 CDN 載入）。
//
// 目前大多數照片（抱石／旅遊／才藝）都還沒有實體檔案，所以每張圖都掛了
// onerror 備援：抓不到圖就換成一塊帶標籤的色塊佔位，不會變成瀏覽器預設的
// 破圖示。等真的照片依照檔名規則放進 assets/img/another-me/ 對應的資料夾，
// 這裡完全不用改，會自動變成真正的照片。
// ============================================================

(function () {
  const modal = document.getElementById('anotherMeModal');
  const openBtn = document.getElementById('anotherMeBtn');
  const closeBtn = modal ? modal.querySelector('.modal-close') : null;
  if (!modal || !openBtn) return;

  /* ---------------- 資料 ---------------- */
  const boulderingData = Array.from({ length: 10 }, (_, i) => {
    const n = String(i + 1).padStart(2, '0');
    return { image: `assets/img/another-me/bouldering/bouldering-${n}.jpg`, label: `Bouldering ${n}` };
  });

  const travelCountries = [
    { id: 'iceland', zh: '冰島', en: 'Iceland', year: '2024' },
    { id: 'albania', zh: '阿爾巴尼亞', en: 'Albania', year: '2024' },
    { id: 'switzerland', zh: '瑞士', en: 'Switzerland', year: '2024' },
    { id: 'croatia', zh: '克羅地亞', en: 'Croatia', year: '2024' },
    { id: 'egypt', zh: '埃及', en: 'Egypt', year: '2024' },
    { id: 'newyork', zh: '紐約', en: 'New York', year: '2024' },
    { id: 'italy', zh: '義大利', en: 'Italy', year: '2024' },
    { id: 'london', zh: '倫敦', en: 'London', year: '2024' },
    { id: 'uae', zh: '阿聯酋', en: 'UAE', year: '2024' },
    { id: 'austria', zh: '奧地利', en: 'Austria', year: '2024' },
    { id: 'germany', zh: '德國', en: 'Germany', year: '2024' },
    { id: 'france', zh: '法國', en: 'France', year: '2024 / 2025 / 2026' },
  ];
  const travelData = travelCountries.map((c) => ({
    ...c,
    mainImage: `assets/img/another-me/travel/${c.id}-main.jpg`,
    hoverImage: `assets/img/another-me/travel/${c.id}-hover.jpg`,
  }));

  const talentCounts = { gymnastics: 1, clarinet: 5, guitar: 3, piano: 1, snowboard: 3 };
  const talentLabels = { gymnastics: '體操 Gymnastics', clarinet: '豎笛 Clarinet', guitar: '吉他 Guitar', piano: '鋼琴 Piano', snowboard: '滑單板 Snowboard' };
  const talentsData = [];
  Object.keys(talentCounts).forEach((key) => {
    for (let i = 1; i <= talentCounts[key]; i++) {
      const n = String(i).padStart(2, '0');
      talentsData.push({ image: `assets/img/another-me/talents/${key}-${n}.jpg`, label: `${talentLabels[key]} ${n}` });
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

  /* ---------------- Section 2：抱石扇形排列 ---------------- */
  function initBouldering() {
    const container = document.getElementById('boulderingGrid');
    if (!container) return;
    const total = boulderingData.length;
    const radius = 220;
    const angleSpan = 180;

    boulderingData.forEach((item, index) => {
      const angle = (angleSpan / (total - 1)) * index - 90;
      const rad = (angle * Math.PI) / 180;
      const x = radius * Math.cos(rad);
      const y = radius * Math.sin(rad) * 0.75;

      const card = document.createElement('div');
      card.className = 'bouldering-card';
      const img = document.createElement('img');
      img.src = item.image;
      img.alt = item.label;
      img.loading = 'lazy';
      attachImageFallback(img, item.label);
      card.appendChild(img);
      container.appendChild(card);

      if (window.gsap) {
        gsap.set(card, { x, y: y + 140, rotation: angle * 0.4, transformOrigin: '50% 50%' });
      } else {
        card.style.transform = `translate(${x}px, ${y + 140}px) rotate(${angle * 0.4}deg)`;
      }

      card.addEventListener('mouseenter', () => {
        if (window.gsap) gsap.to(card, { duration: 0.3, scale: 1.15, zIndex: 10, ease: 'power2.out' });
      });
      card.addEventListener('mouseleave', () => {
        if (window.gsap) gsap.to(card, { duration: 0.3, scale: 1, zIndex: 1, ease: 'power2.out' });
      });
    });
  }

  /* ---------------- Section 3：旅遊卡片 ---------------- */
  function initTravel() {
    const grid = document.getElementById('travelGrid');
    if (!grid) return;

    travelData.forEach((c) => {
      const card = document.createElement('div');
      card.className = 'travel-card';
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
      label.innerHTML = `<span class="country-name">${c.en}</span><span class="year">${c.year}</span>`;

      card.appendChild(wrap);
      card.appendChild(label);
      grid.appendChild(card);

      card.addEventListener('mouseenter', () => {
        const m = card.querySelector('.card-image-main');
        const h = card.querySelector('.card-image-hover');
        if (window.gsap) {
          gsap.to(m, { duration: 0.3, opacity: 0, ease: 'power2.out' });
          gsap.to(h, { duration: 0.3, opacity: 1, ease: 'power2.out' });
        }
      });
      card.addEventListener('mouseleave', () => {
        const m = card.querySelector('.card-image-main');
        const h = card.querySelector('.card-image-hover');
        if (window.gsap) {
          gsap.to(m, { duration: 0.3, opacity: 1, ease: 'power2.out' });
          gsap.to(h, { duration: 0.3, opacity: 0, ease: 'power2.out' });
        }
      });
    });
  }

  /* ---------------- Section 4：才藝 Carousel ---------------- */
  function initTalents() {
    const mainEl = document.getElementById('talentsCarouselMain');
    const thumbsEl = document.getElementById('talentsThumbnails');
    const prevBtn = document.getElementById('talentsPrev');
    const nextBtn = document.getElementById('talentsNext');
    const currentIndexEl = document.getElementById('currentIndex');
    const totalCountEl = document.getElementById('totalCount');
    if (!mainEl || !talentsData.length) return;

    totalCountEl.textContent = String(talentsData.length);

    let currentIndex = 0;
    let autoPlayTimer = null;

    function render() {
      const item = talentsData[currentIndex];
      mainEl.innerHTML = '';
      const img = document.createElement('img');
      img.src = item.image;
      img.alt = item.label;
      attachImageFallback(img, item.label);
      mainEl.appendChild(img);

      thumbsEl.innerHTML = '';
      [1, 2].forEach((offset) => {
        const next = talentsData[(currentIndex + offset) % talentsData.length];
        const t = document.createElement('img');
        t.className = 'thumbnail';
        t.src = next.image;
        t.alt = next.label;
        attachImageFallback(t, next.label);
        t.addEventListener('click', () => goTo((currentIndex + offset) % talentsData.length));
        thumbsEl.appendChild(t);
      });

      currentIndexEl.textContent = String(currentIndex + 1);
    }

    function crossfade() {
      if (window.gsap) {
        gsap.to(mainEl, {
          duration: 0.35,
          opacity: 0,
          onComplete: () => {
            render();
            gsap.to(mainEl, { duration: 0.35, opacity: 1 });
          },
        });
      } else {
        render();
      }
    }

    function goTo(index) {
      currentIndex = ((index % talentsData.length) + talentsData.length) % talentsData.length;
      crossfade();
      restartAutoPlay();
    }

    function next() { goTo(currentIndex + 1); }
    function prev() { goTo(currentIndex - 1); }

    function startAutoPlay() {
      autoPlayTimer = setInterval(() => { currentIndex = (currentIndex + 1) % talentsData.length; crossfade(); }, 4000);
    }
    function stopAutoPlay() { clearInterval(autoPlayTimer); }
    function restartAutoPlay() { stopAutoPlay(); startAutoPlay(); }

    prevBtn.addEventListener('click', prev);
    nextBtn.addEventListener('click', next);

    const container = document.querySelector('.talents-carousel-container');
    if (container) {
      container.addEventListener('mouseenter', stopAutoPlay);
      container.addEventListener('mouseleave', startAutoPlay);
    }

    render();
    startAutoPlay();
  }

  /* ---------------- 波紋背景動畫 ---------------- */
  function initWave() {
    const path = document.querySelector('.wave-path');
    if (!path || !window.gsap) return;
    gsap.to(path, {
      duration: 6,
      attr: { d: 'M0,110 Q360,170 720,110 T1440,110 V200 H0 Z' },
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });
  }

  /* ---------------- Modal 開關 ---------------- */
  let initialized = false;
  function openModal() {
    if (!initialized) {
      initBouldering();
      initTravel();
      initTalents();
      initWave();
      initialized = true;
    }
    modal.classList.remove('hidden');
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
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
