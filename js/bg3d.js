import * as THREE from 'three';

// 手机/触控装置完全不载入，纯效能考量
const isSmallOrTouch = window.innerWidth < 900 || window.matchMedia('(pointer: coarse)').matches;
const container = document.getElementById('bg3d');
const hotspot = document.getElementById('bg3dHotspot');

if (!isSmallOrTouch && container) {
  init();
}

function init() {
  const CONFIG = {
    groupOffsetX: 30,
    cameraPos: [-15, 36, 62],
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

  /* ---------------- 基础场景 ---------------- */
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2('#04120b', 0.009);

  const camera = new THREE.PerspectiveCamera(CONFIG.fov, window.innerWidth / window.innerHeight, 0.1, 200);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight('#3a4a40', 1.6));
  const moon = new THREE.DirectionalLight('#dff2e6', 1.3);
  moon.position.set(-12, 24, 12);
  scene.add(moon);
  const fill = new THREE.DirectionalLight('#274434', 0.7);
  fill.position.set(20, 10, -20);
  scene.add(fill);

  /* ---------------- 噪声函数（不依赖外部函式库） ---------------- */
  function hash(x, y) {
    const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
    return s - Math.floor(s);
  }
  function noise2D(x, y) {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi);
    const b = hash(xi + 1, yi);
    const c = hash(xi, yi + 1);
    const d = hash(xi + 1, yi + 1);
    return THREE.MathUtils.lerp(THREE.MathUtils.lerp(a, b, u), THREE.MathUtils.lerp(c, d, u), v);
  }
  function fbm(x, y, octaves) {
    let total = 0;
    let amp = 0.5;
    let freq = 1;
    for (let i = 0; i < octaves; i++) {
      total += noise2D(x * freq, y * freq) * amp;
      freq *= 2;
      amp *= 0.5;
    }
    return total;
  }
  function ridgeNoise(x, y) {
    const n = fbm(x, y, 4);
    return Math.pow(1 - Math.abs(n * 2 - 1), 1.5);
  }
  function riverCenterZ(x) {
    return Math.sin(x * 0.12) * 5 + Math.sin(x * 0.05) * 3;
  }

  /* ---------------- 山脉地形 ---------------- */
  function buildTerrain() {
    const size = 70;
    const segments = 100;
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const valleyColor = new THREE.Color('#0d2e1c');
    const rockColor = new THREE.Color('#245a3c');
    const peakColor = new THREE.Color('#cdeede'); // 拉亮到近白冷色调，确保跟背景有可辨的亮度差

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);

      const ridge = ridgeNoise(x * 0.05, z * 0.05) * 5 + ridgeNoise(x * 0.14, z * 0.14) * 1.4;
      const distToRiver = Math.abs(z - riverCenterZ(x));
      // 河道要留一段完全平坦（0 高度）的河床宽度，比河流本身的宽度更宽一点，
      // 否则河流两侧的地形边坡会比河面高，从远处看会把河流整条挡住
      const valleyMask = THREE.MathUtils.smoothstep(distToRiver, 2.6, 9);
      const height = ridge * valleyMask;
      pos.setY(i, height);

      const t = THREE.MathUtils.clamp(height / 6, 0, 1);
      const c = new THREE.Color();
      if (t < 0.5) c.copy(valleyColor).lerp(rockColor, t / 0.5);
      else c.copy(rockColor).lerp(peakColor, (t - 0.5) / 0.5);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    // 故意保持不透明（没有 transparent:true）：这个网格跟河流共用同一个 group，
    // 如果两个都进了「半透明」渲染队列，Three.js 会按物件距离排序而不是逐像素深度测试，
    // 山脉（本质上不透明）常常会在排序上盖过河流，把发光河流整条吃掉。
    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 1,
      metalness: 0,
    });
    // 不额外偏移 z：river 用的是同一套未偏移的本地座标，偏移会让山谷跟河流对不齐
    return new THREE.Mesh(geo, mat);
  }

  /* ---------------- 发光河流（沿地形山谷路径的一条自订飘带） ---------------- */
  function buildRiver() {
    const segments = 140;
    const halfWidth = 1.1 * CONFIG.riverGlowWidthScale;
    const pts = [];
    for (let i = 0; i <= segments; i++) {
      const x = -35 + (70 * i) / segments;
      pts.push(new THREE.Vector2(x, riverCenterZ(x)));
    }

    const positions = [];
    const uvs = [];
    const indices = [];
    for (let i = 0; i <= segments; i++) {
      const p = pts[i];
      const prev = pts[Math.max(0, i - 1)];
      const next = pts[Math.min(segments, i + 1)];
      const dir = new THREE.Vector2(next.x - prev.x, next.y - prev.y).normalize();
      const normal = new THREE.Vector2(-dir.y, dir.x);
      positions.push(p.x + normal.x * halfWidth, 0.1, p.y + normal.y * halfWidth);
      positions.push(p.x - normal.x * halfWidth, 0.1, p.y - normal.y * halfWidth);
      uvs.push(i / segments, 0, i / segments, 1);
    }
    for (let i = 0; i < segments; i++) {
      const a = i * 2;
      const b = i * 2 + 1;
      const c = (i + 1) * 2;
      const d = (i + 1) * 2 + 1;
      indices.push(a, c, b, b, c, d);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uBrightness: { value: CONFIG.riverBrightness },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexShader: `
        varying vec2 vUv;
        void main(){
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uBrightness;
        varying vec2 vUv;
        void main(){
          float edge = smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.8, vUv.y);
          float flow = sin(vUv.x * 26.0 - uTime * 1.6) * 0.5 + 0.5;
          float glow = mix(0.45, 1.0, flow) * edge;
          vec3 color = vec3(0.8, 0.95, 1.0) * glow * uBrightness;
          gl_FragColor = vec4(color, glow);
        }
      `,
    });

    return new THREE.Mesh(geo, mat);
  }

  /* ---------------- 空气中的微光粒子 ---------------- */
  function buildParticles(count) {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 55;
      positions[i * 3 + 1] = Math.random() * 11 + 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 55 - 10;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: '#dff5ea',
      size: 0.12,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return new THREE.Points(geo, mat);
  }

  /* ---------------- 城市剪影（捲到 About 时淡入取代山脉） ---------------- */
  function buildCity() {
    const group = new THREE.Group();
    const buildingMats = [];

    for (let i = 0; i < CONFIG.cityBuildingCount; i++) {
      const w = 1.2 + Math.random() * 2.2;
      const d = 1.2 + Math.random() * 2.2;
      const h = 2.5 + Math.random() * 11;
      const geo = new THREE.BoxGeometry(w, h, d);
      const mat = new THREE.MeshStandardMaterial({
        color: '#081f13',
        roughness: 1,
        transparent: true,
        opacity: 0,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set((Math.random() - 0.5) * 42, h / 2, -6 - Math.random() * 24);
      group.add(mesh);
      buildingMats.push(mat);
    }

    const winPositions = new Float32Array(CONFIG.cityWindowCount * 3);
    for (let i = 0; i < CONFIG.cityWindowCount; i++) {
      const b = group.children[Math.floor(Math.random() * group.children.length)];
      winPositions[i * 3] = b.position.x + (Math.random() - 0.5) * b.geometry.parameters.width;
      winPositions[i * 3 + 1] = Math.random() * b.geometry.parameters.height;
      winPositions[i * 3 + 2] = b.position.z + (Math.random() - 0.5) * b.geometry.parameters.depth + 0.1;
    }
    const winGeo = new THREE.BufferGeometry();
    winGeo.setAttribute('position', new THREE.BufferAttribute(winPositions, 3));
    const winMat = new THREE.PointsMaterial({
      color: '#ffffff',
      size: 0.16,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const windows = new THREE.Points(winGeo, winMat);
    group.add(windows);

    group.userData.buildingMats = buildingMats;
    group.userData.windowMat = winMat;
    return group;
  }

  const landscape = new THREE.Group();
  landscape.position.x = CONFIG.groupOffsetX;
  scene.add(landscape);

  const terrain = buildTerrain();
  const river = buildRiver();
  const particles = buildParticles(CONFIG.particleCount);
  landscape.add(terrain, river, particles);

  const city = buildCity();
  city.position.x = CONFIG.groupOffsetX;
  scene.add(city);

  /* ---------------- 摄影机环绕：以 cameraTarget 为中心的球面座标 ---------------- */
  const target = new THREE.Vector3(...CONFIG.cameraTarget);
  const initialOffset = new THREE.Vector3(...CONFIG.cameraPos).sub(target);
  const radius = initialOffset.length();
  let theta = Math.atan2(initialOffset.x, initialOffset.z);
  let phi = Math.acos(THREE.MathUtils.clamp(initialOffset.y / radius, -1, 1));
  const phiMin = phi - 0.5;
  const phiMax = phi + 0.35;

  function updateCameraPosition() {
    camera.position.x = target.x + radius * Math.sin(phi) * Math.sin(theta);
    camera.position.y = target.y + radius * Math.cos(phi);
    camera.position.z = target.z + radius * Math.sin(phi) * Math.cos(theta);
    camera.lookAt(target);
  }
  updateCameraPosition();

  /* ---------------- 拖曳环绕 + 放开后自动缓慢漂移 ---------------- */
  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  if (hotspot) {
    hotspot.addEventListener('pointerdown', (e) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      hotspot.setPointerCapture(e.pointerId);
    });
    hotspot.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      theta -= dx * CONFIG.dragSensitivity;
      phi = THREE.MathUtils.clamp(phi - dy * CONFIG.dragSensitivity, phiMin, phiMax);
    });
    hotspot.addEventListener('pointerup', () => { dragging = false; });
    hotspot.addEventListener('pointercancel', () => { dragging = false; });

    // 只有 Hero 出现在画面上时才启用拖曳热区，避免捲到 Experience 时挡住卡片 hover
    const heroEl = document.getElementById('hero');
    if (heroEl) {
      const heroObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => hotspot.classList.toggle('is-active', entry.isIntersecting));
      }, { threshold: 0.1 });
      heroObserver.observe(heroEl);
    }
  }

  /* ---------------- 捲到 About 时：山脉/河流淡出，城市淡入 ---------------- */
  let cityMix = 0;
  let cityMixTarget = 0;
  const aboutEl = document.getElementById('about');
  if (aboutEl) {
    const aboutObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        cityMixTarget = entry.intersectionRatio >= 0.35 ? 1 : 0;
      });
    }, { threshold: [0, 0.35, 1] });
    aboutObserver.observe(aboutEl);
  }

  function updateFade() {
    cityMix += (cityMixTarget - cityMix) * CONFIG.cityMixEase;

    // 山脉/河流是不透明网格，没有 opacity 可以柔化，改成城市快盖满画面时才整个隐藏，
    // 城市本身（半透明）继续用 opacity 慢慢淡入，视觉上还是一段柔和的过渡
    const showLandscape = cityMix < 0.6;
    terrain.visible = showLandscape;
    river.visible = showLandscape;
    river.material.uniforms.uBrightness.value = CONFIG.riverBrightness * Math.max(0, 1 - cityMix / 0.6);
    particles.material.opacity = 0.5 * (1 - cityMix * 0.6);

    city.userData.buildingMats.forEach((m) => { m.opacity = cityMix * 0.92; });
    city.userData.windowMat.opacity = cityMix * Math.min(1, cityMix * 1.4);
  }

  /* ---------------- 缩放 ---------------- */
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  /* ---------------- 主循环 ---------------- */
  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const dt = clock.getDelta();

    if (!dragging) theta += CONFIG.autoDriftSpeed * dt;
    updateCameraPosition();

    river.material.uniforms.uTime.value += dt;
    updateFade();

    renderer.render(scene, camera);
  }
  animate();
}
