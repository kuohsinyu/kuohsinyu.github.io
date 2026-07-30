// ============================================================
// 1) 自訂游標：圓點即時跟隨、圓圈帶延遲地追著跑
// 2) 中英文雙語切換
// （Experience / Project & Program 的卡片展開純靠 CSS :hover / :focus-within，
//   不需要額外的 JS）
// ============================================================

const TRANSLATIONS = {
  en: {
    'nav-logo': 'Welcome to my space',
    'nav-work': 'HOME PAGE',
    'nav-about': 'ABOUT',
    'nav-experience': 'EXPERIENCE',
    'nav-projects': 'PROJECT &amp; PROGRAM',
    'nav-contact': 'CONTACT',

    'hero-line1': "Hi, I'm",
    'scroll-cue': 'SCROLL',

    'skill-photoshop': 'Photoshop',
    'skill-illustrator': 'Illustrator',
    'skill-canva': 'Canva',
    'skill-python': 'Python',
    'skill-social': 'Social Media',
    'skill-data': 'Data Analysis',
    'skill-bilingual': 'Bilingual',

    'about-tag': '01 — ABOUT',
    'about-title': 'About Me',
    'about-p1': "Hi, I'm <strong>Syndrea</strong> — a bilingual marketing student moving between Taiwan and Germany, currently exploring the space where data, design, and storytelling meet. I like turning raw numbers into visuals people actually want to look at, and turning ideas into content that travels smoothly across platforms and languages.",
    'about-p2': "Outside of coursework, I've managed social media for a concert band, built a sentiment-analysis pipeline out of curiosity, and picked up interpreting work along the way — always looking for the next thing to learn.",
    'about-photo': 'YOUR PHOTO HERE',

    'exp-tag': '02 — EXPERIENCE',
    'exp-title': 'Experience',
    'exp-hint': 'Hover (or tap) a card to see the details',

    'proj-tag': '03 — PROJECT &amp; PROGRAM',
    'proj-title': 'Project &amp; Program',
    'proj-hint': 'Hover (or tap) a card to see the details',

    'fiabci-title': 'Media Liaison &amp; Liaison Interpreter',
    'fiabci-org': '76th FIABCI World Congress — Vienna, Austria',
    'fiabci-date': 'June 2026 · Freelance',
    'fiabci-bullet1': 'Coordinated schedules and on-site support for Taiwan media delegations at an international congress, working across corporate, government, and press stakeholders.',
    'fiabci-bullet2': 'Delivered real-time English–Mandarin interpretation and prepared written materials for accurate press coverage.',

    'ntnu-title': 'Public Relations &amp; Social Media Lead',
    'ntnu-org': 'NTNU Wind Band — Taiwan',
    'ntnu-date': 'Jul 2024 – Aug 2025',
    'ntnu-bullet1': 'Coordinated with corporate vendors to secure NT$350,000 in sponsorships, managing the associated documentation, agreements, and follow-up communications — directly transferable to HR documentation and vendor-facing administrative tasks.',
    'ntnu-bullet2': 'Maintained an ongoing content calendar and promotional planning system, reflecting comfort with routine, structured record-keeping and multi-task management under deadlines.',

    'sentiment-title': 'YouTube Chinese Sentiment Analyzer',
    'sentiment-org': 'Independent Project (BERT NLP Pipeline) — Taiwan',
    'sentiment-date': '2024',
    'sentiment-bullet1': 'Built an end-to-end NLP pipeline — data collection, preprocessing, keyword extraction, and sentiment classification — then organized results into clear, structured reports.',
    'sentiment-bullet2': 'Demonstrates precision and comfort maintaining structured, accurate data — directly relevant to keeping HR systems and employee records accurate and up to date.',

    'concordia-title': 'France CONCORDIA International Volunteer Program',
    'concordia-org': 'Concordia Association — France',
    'concordia-desc': 'Traveled independently to France to collaborate closely with young leaders from ten countries around the world, working on local town hall restoration, forest conservation, and community public education.',
    'concordia-bullet1': '<strong>International Public Outreach &amp; Education:</strong> Led multicultural education initiatives for children in rural France, bridging language barriers and successfully using Taiwanese music as a means of cultural exchange.',
    'concordia-bullet2': '<strong>Cross-Border Advocacy &amp; Communication:</strong> Co-organized a workshop on climate change and environmental sustainability, engaging deeply with volunteers from Belgium, Serbia, and other countries on international geopolitical and cultural perspectives.',

    'uae-title': 'Taiwan–UAE Youth Exchange Program',
    'uae-org': 'Selected as Taiwan Youth Representative — United Arab Emirates',
    'uae-desc': "Engaged with the core of the Middle East's technology and business sectors through a cross-disciplinary international exchange centered on leadership, entrepreneurship, and environmental sustainability.",
    'uae-bullet1': '<strong>Sustainability Project Practice:</strong> Took part in local environmental sustainability initiatives in the UAE, including hands-on tree-planting projects, cross-national youth forums, and extreme climate adaptation experiences.',
    'uae-bullet2': '<strong>Cross-Disciplinary Business Thinking:</strong> Participated in entrepreneurship workshops and visits to leading local museums, integrating technology, human resources, and ESG (Environmental, Social, and Governance) thinking.',
    'exp-source': 'Source: NTNU News →',

    'heidelberg-title': 'Heidelberg University Exchange Program',
    'heidelberg-org': 'MOE 學海飛揚 Scholarship for Study Abroad — Heidelberg, Germany',
    'heidelberg-date': '2025 – 2026',
    'heidelberg-bullet1': "Selected for a year abroad under Taiwan's Ministry of Education 學海飛揚 Scholarship for Outstanding Students Studying Abroad.",
    'heidelberg-bullet2': 'Continuing coursework in a new academic and cultural environment — adapting to a different language, teaching style, and daily life while building an international network.',

    'photo-1': 'PHOTO 1',
    'photo-2': 'PHOTO 2',
    'photo-3': 'PHOTO 3',

    'contact-tag': '04 — CONTACT',
    'contact-title': "Let's Talk",
    'contact-text': 'Open to working student roles, collaborations, or just a good conversation about design and data.',

    'nav-another-me': 'MORE OF ME',
    'am-intro-subtitle': 'A look at my hobbies, my passions, and my travels',
    'am-halftone-tag': 'A LITTLE EXPERIMENT',
    'am-halftone-title': 'Me &amp; Life',
    'am-world-tag': 'THE WORLD &amp; ME',
    'am-world-title': 'The World Through My Eyes, and Me Between the World',
    'am-world-quote': 'Every place I have been left a slightly different version of me behind.',
    'am-hobby-title': 'Hobby',
    'am-hobby-hint': 'Keep scrolling ↓',
    'am-bouldering-title': 'Bouldering',
    'am-credits-title': 'Sites &amp; Resources',
    'am-credits-1': 'Design inspiration — landonorris.com',
    'am-credits-2': '3D effect — Three.js "RGB Halftone" by Xavier Burrow (CC BY-NC-SA 4.0)',
    'am-credits-3': 'Animation — GSAP / ScrollTrigger',
  },
  zh: {
    'nav-logo': '歡迎來到我的空間',
    'nav-work': '首頁',
    'nav-about': '關於我',
    'nav-experience': '經歷',
    'nav-projects': '專案與計畫',
    'nav-contact': '聯絡',

    'hero-line1': '我是郭昕宇',
    'scroll-cue': '向下滑動',

    'skill-photoshop': 'Photoshop',
    'skill-illustrator': 'Illustrator',
    'skill-canva': 'Canva',
    'skill-python': 'Python',
    'skill-social': '社群媒體',
    'skill-data': '數據分析',
    'skill-bilingual': '雙語能力',

    'about-tag': '01 — 關於我',
    'about-title': '關於我',
    'about-p1': '嗨，我是 <strong>Syndrea</strong>——一位穿梭於台灣與德國之間的雙語行銷學生，目前正探索數據、設計與敘事交會的領域。我喜歡把生硬的數字轉化成大家真正想看的視覺內容，也喜歡把想法轉化成能跨平台、跨語言的內容。',
    'about-p2': '課堂之外，我曾為管樂團經營社群媒體、打造網路爬蟲情感分析文字雲，也接觸過口譯工作——始終在尋找下一個值得學習的新事物。',
    'about-photo': '放上你的照片',

    'exp-tag': '02 — 經歷',
    'exp-title': '經歷',
    'exp-hint': '滑過（或點擊）卡片查看詳情',

    'proj-tag': '03 — 專案與計畫',
    'proj-title': '專案與計畫',
    'proj-hint': '滑過（或點擊）卡片查看詳情',

    'fiabci-title': '媒體聯絡與隨行口譯',
    'fiabci-org': '第76屆國際不動產聯盟世界大會 — 奧地利維也納',
    'fiabci-date': '2026年6月・自由接案',
    'fiabci-bullet1': '於國際會議中協調台灣媒體代表團的行程與現場支援，橫跨各國企業、政府與媒體等多方。',
    'fiabci-bullet2': '提供英語與中文即時口譯，並準備書面資料以確保媒體報導的準確性，同時補充部分攝影工作。',

    'ntnu-title': '公共關係暨社群媒體負責人',
    'ntnu-org': '師大管樂團 — 台灣',
    'ntnu-date': '2024年7月 – 2025年8月',
    'ntnu-bullet1': '與企業、廠商和校友團協調並成功爭取新台幣35萬元贊助，負責相關文件、合約與後續溝通——熟練掌握文件處理與廠商對接的行政能力。',
    'ntnu-bullet2': '持續維護內容行事曆與宣傳規劃系統，展現在期限壓力下進行結構化紀錄與多工管理的能力，並於2025年一月籌備完成七天六場的西臺灣巡演。',

    'sentiment-title': 'YouTube 中文情感分析器',
    'sentiment-org': '獨立專案（BERT 自然語言處理流程）— 台灣',
    'sentiment-date': '2024年',
    'sentiment-bullet1': '建置端到端自然語言處理流程——資料蒐集、前處理、關鍵字擷取與情感分類——並將結果整理成清晰、結構化的報告。',
    'sentiment-bullet2': '展現在維護結構化、精確資料上的細心與熟練，熟悉使用機器學習技術，與確保系統及紀錄準確更新高度相關。',

    'concordia-title': '法國 CONCORDIA 國際志工計畫',
    'concordia-org': 'Concordia 協會 — 法國',
    'concordia-desc': '獨自前往法國，與來自全球十個國家的青年領袖深度協作，負責地方市政廳修復、森林保育與社區公共教育。',
    'concordia-bullet1': '<strong>國際公共宣導與教育：</strong>主導面向法國偏鄉孩童的多元文化教育，跨越語言障礙，成功運用臺灣音樂進行交流。',
    'concordia-bullet2': '<strong>跨國倡議與溝通：</strong>共同籌辦氣候變遷與環境永續申論工作營，與比利時、塞爾維亞等多國志工深度碰撞國際地緣政治與文化觀點。',

    'uae-title': '臺灣－阿拉伯聯合大公國（UAE）青年交流計畫',
    'uae-org': '獲選台灣代表青年 — 阿拉伯聯合大公國',
    'uae-desc': '深入中東科技與商業核心，以領袖能力、企業家精神與環境永續為核心主軸進行跨領域國際交流。',
    'uae-bullet1': '<strong>永續專案實踐：</strong>深度參與阿聯酋當地的環境永續倡議，包含實地綠色植樹計畫、跨國青年座談與極端氣候適應體驗。',
    'uae-bullet2': '<strong>跨領域商務思維：</strong>對接企業家精神研習與當地頂尖博物館參訪，將科技、人力資源與永續發展（ESG）思維深度結合。',
    'exp-source': '資料來源：師大新聞 →',

    'heidelberg-title': '海德堡大學交換計畫',
    'heidelberg-org': '教育部學海飛揚獎學金 — 德國海德堡',
    'heidelberg-date': '2025 – 2026',
    'heidelberg-bullet1': '獲選教育部學海飛揚獎學金補助，赴德國海德堡大學進行為期一年的交換學習。',
    'heidelberg-bullet2': '在全新的學術與文化環境中持續進修——適應不同的語言、教學方式與生活步調，同時建立國際人脈網絡。',

    'photo-1': '照片 1',
    'photo-2': '照片 2',
    'photo-3': '照片 3',

    'contact-tag': '04 — 聯絡',
    'contact-title': '現在聯絡我！',
    'contact-text': '歡迎實習職缺、合作機會，或單純想聊聊設計與創新的想法。',

    'nav-another-me': '更多的我',
    'am-intro-subtitle': '展現我的興趣、熱情、和旅程',
    'am-halftone-tag': 'A LITTLE EXPERIMENT',
    'am-halftone-title': '我與生活',
    'am-world-tag': 'THE WORLD &amp; ME',
    'am-world-title': '我眼中的世界，與世界之間的我',
    'am-world-quote': '走過的每個地方，都留下了一點點不一樣的自己。',
    'am-hobby-title': 'Hobby',
    'am-hobby-hint': '繼續往下滑 ↓',
    'am-bouldering-title': '抱石 Bouldering',
    'am-credits-title': '使用的網站與資源 Sites &amp; Resources',
    'am-credits-1': '設計靈感 Design inspiration — landonorris.com',
    'am-credits-2': '3D 特效 3D effect — Three.js「RGB Halftone」by Xavier Burrow（CC BY-NC-SA 4.0）',
    'am-credits-3': '動畫引擎 Animation — GSAP / ScrollTrigger',
  },
};

document.addEventListener('DOMContentLoaded', () => {
  /* ---------------- 自訂游標 ---------------- */
  const isTouch = window.matchMedia('(pointer: coarse)').matches;
  const cursorDot = document.querySelector('.cursor-dot');
  const cursorRing = document.querySelector('.cursor-ring');

  if (!isTouch && cursorDot && cursorRing) {
    let mouseX = 0;
    let mouseY = 0;
    let ringX = 0;
    let ringY = 0;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursorDot.style.left = mouseX + 'px';
      cursorDot.style.top = mouseY + 'px';
    });

    function tickRing() {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      cursorRing.style.left = ringX + 'px';
      cursorRing.style.top = ringY + 'px';
      requestAnimationFrame(tickRing);
    }
    tickRing();

    document.querySelectorAll('a, button, .exp-card, .photo-frame').forEach((el) => {
      el.addEventListener('mouseenter', () => cursorRing.classList.add('is-active'));
      el.addEventListener('mouseleave', () => cursorRing.classList.remove('is-active'));
    });
  }

  /* ---------------- 語言切換 ---------------- */
  const langToggle = document.getElementById('langToggle');

  function applyLanguage(lang) {
    document.documentElement.lang = lang === 'zh' ? 'zh-Hant' : 'en';
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.dataset.i18n;
      const text = TRANSLATIONS[lang][key];
      if (text !== undefined) el.innerHTML = text;
    });
    if (langToggle) langToggle.textContent = lang === 'en' ? '中文' : 'EN';
    localStorage.setItem('site-lang', lang);
  }

  let currentLang = localStorage.getItem('site-lang') === 'zh' ? 'zh' : 'en';

  if (langToggle) {
    langToggle.addEventListener('click', () => {
      currentLang = currentLang === 'en' ? 'zh' : 'en';
      applyLanguage(currentLang);
    });
  }

  applyLanguage(currentLang);
});
