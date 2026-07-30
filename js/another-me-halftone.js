// ============================================================
// 「另一個我」Modal 第二面的核心視覺：改編自 three.js 官方範例
// webgl_postprocessing_rgb_halftone（RGB Halftone by Xavier Burrow）。
// 拿掉範例原本的 GUI 面板／FPS 計數器（那些是給範例作者自己調參數用的
// 開發工具，不該出現在正式網站上），但保留 OrbitControls——訪客可以
// 直接在畫面上拖曳去旋轉鏡頭看這群方塊，這是刻意保留的互動，不是裝飾。
//
// 只有在這個 section 真的捲進畫面、而且 Modal 是打開的時候才會渲染，
// 滾出畫面或關掉 Modal 就整個暫停，不會跟主頁面的 Three.js 背景一起
// 疊加拖垮效能。
// ============================================================

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { HalftonePass } from 'three/addons/postprocessing/HalftonePass.js';

const container = document.getElementById('halftoneCanvas');
if (container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  const camera = new THREE.PerspectiveCamera(60, 1, 1, 1000);
  camera.position.z = 14;

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.minDistance = 6;
  controls.maxDistance = 30;

  const scene = new THREE.Scene();

  const group = new THREE.Group();
  scene.add(group);

  const light = new THREE.PointLight(0xffffff, 250);
  light.position.set(0, 4, 6);
  group.add(light);
  group.add(new THREE.AmbientLight(0xffffff, 0.4));

  const mat = new THREE.ShaderMaterial({
    uniforms: {},
    vertexShader: `
      varying vec2 vUV;
      varying vec3 vNormal;
      void main(){
        vUV = uv;
        vNormal = vec3(normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUV;
      varying vec3 vNormal;
      void main(){
        vec4 c = vec4(abs(vNormal) + vec3(vUV, 0.0), 1.0);
        gl_FragColor = c;
      }
    `,
  });

  const cubeCount = 36;
  for (let i = 0; i < cubeCount; i++) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), mat);
    mesh.position.set((Math.random() - 0.5) * 16, (Math.random() - 0.5) * 16, (Math.random() - 0.5) * 16);
    mesh.rotation.set(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2);
    group.add(mesh);
  }

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const halftonePass = new HalftonePass({
    shape: 1,
    radius: 3.2,
    rotateR: Math.PI / 12,
    rotateG: Math.PI / 12 * 3,
    rotateB: Math.PI / 12 * 2,
    scatter: 0,
    blending: 1,
    blendingMode: 1,
    greyscale: false,
    disable: false,
  });
  composer.addPass(halftonePass);

  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h);
    composer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  const rotationSpeed = Math.PI / 24;
  const clock = new THREE.Clock();
  let running = false;
  let visible = false;
  let modalOpen = false;

  function frame() {
    if (!running) return;
    requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.1);
    group.rotation.y += dt * rotationSpeed;
    group.rotation.x += dt * rotationSpeed * 0.3;
    controls.update();
    composer.render(dt);
  }

  function updateRunning() {
    const shouldRun = visible && modalOpen;
    if (shouldRun && !running) {
      running = true;
      clock.getDelta();
      frame();
    } else if (!shouldRun) {
      running = false;
    }
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => { visible = entry.isIntersecting; });
    updateRunning();
  }, { threshold: 0.1 });
  io.observe(container);

  // 由 another-me.js 在開/關 Modal 時呼叫，避免 Modal 關閉後這個 section
  // 雖然不在畫面上，IntersectionObserver 的 root 預設是 viewport，
  // Modal 關閉後 container 其實還是「技術上可見」（只是被 Modal 蓋住），
  // 所以額外用這個開關卡一次。
  window.__haltoneSetModalOpen = (open) => {
    modalOpen = open;
    updateRunning();
  };
}
