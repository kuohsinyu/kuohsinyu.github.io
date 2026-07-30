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
  const talentYears = { gymnastics: '2022', clarinet: '2023', guitar: '2023', piano: '2021', snowboard: '2024' };
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

  /* ---------------- Section：Bouldering（簡單橫向卡片網格） ---------------- */
  function initBouldering() {
    const container = document.getElementById('boulderingGrid');
    if (!container) return;
    boulderingData.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'bouldering-card';
      const img = document.createElement('img');
      img.src = item.image;
      img.alt = item.label;
      img.loading = 'lazy';
      attachImageFallback(img, item.label);
      card.appendChild(img);
      container.appendChild(card);
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

  /* ---------------- Modal 開關 ---------------- */
  let initialized = false;
  function openModal() {
    if (!initialized) {
      initWorldMe();
      initHobby();
      initBouldering();
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
