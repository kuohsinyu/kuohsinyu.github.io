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
    'about-p1': "Hi, I'm <strong>Syndrea</strong> — a bilingual marketing student moving between Taiwan and Germany, currently exploring the space where data, design, and storytelling meet. One Facebook post I wrote for a concert band pulled in 7,421 views and 745 engagements — proof that I like turning raw numbers into visuals people actually want to look at, and turning ideas into content that travels smoothly across platforms and languages.",
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
    'fiabci-bullet1': 'Interpreted and coordinated on-site for a 22-person Taiwan delegation spanning 5 media outlets (CommonWealth, Global Views, Business Weekly, TTV, and Mirror Media) across a 9-day itinerary, at a congress that drew nearly 200 Taiwanese industry representatives alongside delegations from the US, Malaysia, Germany, and Italy.',
    'fiabci-bullet2': 'Delivered real-time English–Mandarin interpretation across 3 dedicated days — 3 delegation dinners with foreign press and one full conference day — plus continuous on-the-ground translation for the rest of the trip after the tour guide turned out not to speak Mandarin.',

    'ntnu-title': 'Public Relations &amp; Social Media Lead',
    'ntnu-org': 'NTNU Wind Band — Taiwan',
    'ntnu-date': 'Jul 2024 – Aug 2025',
    'ntnu-bullet1': 'Negotiated with corporate vendors to secure NT$350,000 in sponsorships, owning the agreements, documentation, and follow-up communications end to end.',
    'ntnu-bullet2': 'Ran the content calendar and promotional planning — one Facebook post drew 7,421 views and 745 engagements — while coordinating a seven-day, six-stop western Taiwan tour completed in January 2025.',

    'sentiment-title': 'YouTube Chinese Sentiment Analyzer',
    'sentiment-org': 'Independent Project (BERT NLP Pipeline) — Taiwan',
    'sentiment-date': '2024',
    'sentiment-bullet1': 'Built an end-to-end NLP pipeline — comment scraping, preprocessing, keyword extraction, and fine-tuned BERT sentiment classification — that pulls 2,000+ YouTube comments per video, including nested replies.',
    'sentiment-bullet2': 'Solved an early crawler bug that skipped mid-thread replies, rebuilding the scraper to reliably capture every reply in a comment thread, not just top-level comments.',

    'concordia-title': 'France CONCORDIA International Volunteer Program',
    'concordia-org': 'Concordia Association — France',
    'concordia-desc': 'Traveled independently to France to collaborate closely with young leaders from ten countries around the world, working on local town hall restoration, forest conservation, and community public education.',
    'concordia-bullet1': '<strong>International Public Outreach &amp; Education:</strong> Led multicultural education initiatives for children in rural France, bridging language barriers and successfully using Taiwanese music as a means of cultural exchange.',
    'concordia-bullet2': '<strong>Cross-Border Advocacy &amp; Communication:</strong> Co-organized a workshop on climate change and environmental sustainability, engaging deeply with volunteers from Belgium, Serbia, and other countries on international geopolitical and cultural perspectives.',

    'uae-title': 'Taiwan–UAE Youth Exchange Program',
    'uae-org': 'Selected as Taiwan Youth Representative — United Arab Emirates',
    'uae-desc': "Engaged with the core of the Middle East's technology and business sectors through a cross-disciplinary international exchange centered on leadership, entrepreneurship, and environmental sustainability.",
    'uae-bullet1': '<strong>Sustainability Project Practice:</strong> Ran hands-on tree-planting work and represented Taiwan in cross-national youth forums on environmental sustainability, alongside extreme-climate adaptation training.',
    'uae-bullet2': '<strong>Cross-Disciplinary Business Thinking:</strong> Worked through entrepreneurship case studies and museum-based briefings that connected technology, human resources, and ESG (Environmental, Social, and Governance) thinking.',
    'exp-source': 'Source: NTNU News →',

    'heidelberg-title': 'Heidelberg University Exchange Program',
    'heidelberg-org': 'MOE 學海飛揚 Scholarship for Study Abroad — Heidelberg, Germany',
    'heidelberg-date': '2025 – 2026',
    'heidelberg-bullet1': "Selected for a year abroad under Taiwan's Ministry of Education 學海飛揚 Scholarship for Outstanding Students Studying Abroad.",
    'heidelberg-bullet2': 'Completing a full academic year of coursework at Heidelberg University while building an international network.',

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
    'about-p1': '嗨，我是 <strong>Syndrea</strong>——一位穿梭於台灣與德國之間的雙語行銷學生，目前正探索數據、設計與敘事交會的領域。我為管樂團寫的一篇臉書貼文曾創下7,421次瀏覽、745次互動——這就是我喜歡把生硬的數字轉化成大家真正想看的視覺內容，也喜歡把想法轉化成能跨平台、跨語言傳播的內容的證明。',
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
    'fiabci-bullet1': '為22人的台灣媒體代表團（涵蓋非凡、遠見、商業周刊、台視、鏡週刊5家媒體）擔任隨行口譯與現場協調，全程9天行程，該屆大會吸引近200位台灣業界代表與會，同場並有來自美國、馬來西亞、德國、義大利等國的代表團。',
    'fiabci-bullet2': '於3天的專場口譯中提供英語與中文即時口譯——包含3場與外國媒體交涉的晚宴及1整天的正式會議，並在導遊不諳中文的情況下，全程9天隨行程即時口譯。',

    'ntnu-title': '公共關係暨社群媒體負責人',
    'ntnu-org': '師大管樂團 — 台灣',
    'ntnu-date': '2024年7月 – 2025年8月',
    'ntnu-bullet1': '與企業廠商談判，成功爭取新台幣35萬元贊助，獨立負責相關合約、文件與後續溝通。',
    'ntnu-bullet2': '主導內容行事曆與宣傳規劃——其中一篇臉書貼文創下7,421次瀏覽、745次互動，同時籌劃並於2025年1月完成七天六場的西臺灣巡演。',

    'sentiment-title': 'YouTube 中文情感分析器',
    'sentiment-org': '獨立專案（BERT 自然語言處理流程）— 台灣',
    'sentiment-date': '2024年',
    'sentiment-bullet1': '建置端到端自然語言處理流程——留言爬取、前處理、關鍵字擷取，以及微調 BERT 模型進行情感分類——單支影片可擷取超過2,000則留言，包含所有回覆。',
    'sentiment-bullet2': '解決了爬蟲初期抓不到留言串中間層回覆的問題，重寫爬取邏輯後可完整擷取每一則留言與回覆，而不只是最上層留言。',

    'concordia-title': '法國 CONCORDIA 國際志工計畫',
    'concordia-org': 'Concordia 協會 — 法國',
    'concordia-desc': '獨自前往法國，與來自全球十個國家的青年領袖深度協作，負責地方市政廳修復、森林保育與社區公共教育。',
    'concordia-bullet1': '<strong>國際公共宣導與教育：</strong>主導面向法國偏鄉孩童的多元文化教育，跨越語言障礙，成功運用臺灣音樂進行交流。',
    'concordia-bullet2': '<strong>跨國倡議與溝通：</strong>共同籌辦氣候變遷與環境永續申論工作營，與比利時、塞爾維亞等多國志工深度碰撞國際地緣政治與文化觀點。',

    'uae-title': '臺灣－阿拉伯聯合大公國（UAE）青年交流計畫',
    'uae-org': '獲選台灣代表青年 — 阿拉伯聯合大公國',
    'uae-desc': '深入中東科技與商業核心，以領袖能力、企業家精神與環境永續為核心主軸進行跨領域國際交流。',
    'uae-bullet1': '<strong>永續專案實踐：</strong>親手執行阿聯酋當地的植樹計畫，並代表台灣出席跨國青年座談討論環境永續議題，同時完成極端氣候適應訓練。',
    'uae-bullet2': '<strong>跨領域商務思維：</strong>透過企業家精神個案研討與當地頂尖博物館的簡報參訪，串連科技、人力資源與永續發展（ESG）思維。',
    'exp-source': '資料來源：師大新聞 →',

    'heidelberg-title': '海德堡大學交換計畫',
    'heidelberg-org': '教育部學海飛揚獎學金 — 德國海德堡',
    'heidelberg-date': '2025 – 2026',
    'heidelberg-bullet1': '獲選教育部學海飛揚獎學金補助，赴德國海德堡大學進行為期一年的交換學習。',
    'heidelberg-bullet2': '在海德堡大學完成為期一年的完整學業，同時建立國際人脈網絡。',

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
