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
    globeRadius: 22,
    globeRotationSpeed: 0.12,
    autoDriftSpeed: 0.035,
    dragSensitivity: 0.005,
    cityMixEase: 0.035,
  };

  /* ---------------- 基础场景 ---------------- */
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2('#04120b', 0.009);

  // far 原本是 200，天空半球（半径 240，见 buildSky）从摄影机视角看最远会超过 300，
  // 不拉远 far clip 平面天空整个会被裁掉、完全不会画出来
  const camera = new THREE.PerspectiveCamera(CONFIG.fov, window.innerWidth / window.innerHeight, 0.1, 500);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);
  // 城市背景是独立的正交相机全屏 shader，跟主场景分开渲染再叠在一起，
  // 所以不能用默认的 autoClear，要自己控制清除时机（见 animate()）
  renderer.autoClear = false;

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
  // 两条河流各自的中心线，都刻意让 x 落在镜头看向的区域里（跟原本单一河流验证过、
  // 不会跟左侧标题文字重叠的范围一致），地形范围虽然放大了很多，但摄影机看的还是
  // 同一小片区域，河流没有必要跟着铺到整块地图那么远
  function riverCenterZ1(x) {
    return Math.sin(x * 0.12) * 5 + Math.sin(x * 0.05) * 3;
  }
  function riverCenterZ2(x) {
    return riverCenterZ1(x) + 16 + Math.sin(x * 0.07 + 1.3) * 4;
  }

  /* ---------------- 山脉地形 ---------------- */
  function buildTerrain() {
    // 地形整体放大很多，边界会被推到摄影机视野以外，才不会再看到明显的正方形边线；
    // 摄影机本身没有跟着拉远，看到的仍是同一小片、之前已经调好构图的区域
    const size = 320;
    const segments = 170;
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

      // 加一层更低频率的噪声，做出更宏大、起伏更大的山势（更高的山）
      const ridge = ridgeNoise(x * 0.018, z * 0.018) * 8
        + ridgeNoise(x * 0.05, z * 0.05) * 5
        + ridgeNoise(x * 0.14, z * 0.14) * 1.6;

      // 河道要留一段完全平坦（0 高度）的河床宽度，比河流本身的宽度更宽一点，
      // 否则河流两侧的地形边坡会比河面高，从远处看会把河流整条挡住
      const dist1 = Math.abs(z - riverCenterZ1(x));
      const dist2 = Math.abs(z - riverCenterZ2(x));
      // 山变高之后，原本的平坦带宽度（2.6~9）已经不够了：就算 mask 只剩很小一点点，
      // 乘上现在高很多的山势也会超过河面的高度，从某些角度看会变成一排规律的
      // 三角形缺口「咬」进河流的边缘。平坦带整个往外推、坡度也放缓，才留够余裕。
      const mask1 = THREE.MathUtils.smoothstep(dist1, 5, 16);
      const mask2 = THREE.MathUtils.smoothstep(dist2, 5, 16);
      const valleyMask = Math.min(mask1, mask2);
      const height = ridge * valleyMask;
      pos.setY(i, height);

      const t = THREE.MathUtils.clamp(height / 10, 0, 1);
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
  function buildRiver(centerZFn, xStart, xEnd) {
    const segments = 140;
    const halfWidth = 1.1 * CONFIG.riverGlowWidthScale;
    const pts = [];
    for (let i = 0; i <= segments; i++) {
      const x = xStart + ((xEnd - xStart) * i) / segments;
      pts.push(new THREE.Vector2(x, centerZFn(x)));
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

  /* ---------------- 城市背景：kishimisu 的《Elevator to infinity》raymarching shader
     （CC BY-NC-SA 4.0，https://www.shadertoy.com/view/mddfW8），捲到 About／Experience
     时淡入取代山脉，用正交相机＋全屏四边形跑在独立的场景里，跟主场景分开渲染再叠图 ---------------- */
  function buildCityNoiseTexture() {
    // 原始 shader 的 iChannel0 只是拿来在建筑表面做一层很淡的噪声遮罩，
    // 不需要还原成原本 Shadertoy 用的确切贴图，随手生成的灰阶噪声效果就够接近了
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(size, size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const v = Math.floor(hash(x, y) * 255);
        const i = (y * size + x) * 4;
        img.data[i] = v;
        img.data[i + 1] = v;
        img.data[i + 2] = v;
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  const CITY_SHADER_FRAGMENT = `precision highp float;

uniform float iTime;
uniform vec3 iResolution;
uniform vec4 iMouse;
uniform sampler2D iChannel0;
uniform float uOpacity;

out vec4 fragColor;

/* Elevator to infinity by @kishimisu (2023)  -  https://www.shadertoy.com/view/mddfW8
   This work is licensed under a Creative Commons Attribution-NonCommercial-ShareAlike
   4.0 International License (https://creativecommons.org/licenses/by-nc-sa/4.0/deed.en)
*/

float acc = 0.; // Neon light accumulation
float occ = 1.; // Ambient occlusion (Fake)

// 2D rotation
#define rot(a) mat2(cos(a), -sin(a), sin(a), cos(a))

// Domain rep.
#define rep(p, r) mod(p+r, r+r)-r

// Domain rep. ID
#define rid(p, r) floor((p+r)/(r+r))

// Fast random noise 2 -> 3
vec3 hash(vec2 p) {
    vec2 r = fract(sin(p*mat2(137.1, 12.7, 74.7, 269.5)) * 43478.5453);
    return vec3(r, fract(r.x*r.y*1121.67));
}
// Random noise 3 -> 3 - https://shadertoyunofficial.wordpress.com/2019/01/02/
#define hash33(p) fract(sin(p*mat3(127.1,311.7,74.7,269.5,183.3,246.1,113.5,271.9,124.6))*43758.5453123)

// Distance functions - https://iquilezles.org/articles/distfunctions/
float box(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.)) + min(max(q.x, max(q.y, q.z)), 0.);
}
float rect(vec2 p, vec2 b) {
    vec2 d = abs(p) - b;
    return length(max(d, 0.)) + min(max(d.x, d.y), 0.);
}

#define ext 2.

// 简化版：拿掉原本的电梯井、栏杆、背面横杆、侧窗几个细节几何（每个 building()
// 呼叫要多跑好几次距离场运算），只留主体建筑量体＋窗洞＋发光窗格、遮蔽，
// 视觉上还是「无限高楼＋会发光的窗」，但每步 raymarch 的运算量少了将近一半
float building(vec3 p0, vec3 p, float L) {
    float B = rect(p.xz, vec2(L, 10)); // Main building

    // (Optim) Skip building calculations
    if (B > .2) return B;

    vec3 q = p;
    p.y = rep(p.y, 3.); // Infinite floor y-repetition

    // Building lights
    vec3  id = rid(vec3(q.xy, p0.z), vec3(21, 18, 48));
    vec3  rn = hash33(id);
    float rw = fract(rn.x*rn.z*1021.67);

    q.x += 14. * (rn.x*3.-1.);
    q.y += 12. * (floor(rn.y*3.)-1.);
    q.xy = rep(q.xy, vec2(21, 18));

    float l = box(q, vec3(mix(3., 15., rw), rn.z*1.5+.5, 7));
    acc += .5 / (1. + pow(abs(l)*20., 1.5))
                * smoothstep(0., .4, iTime - rw * 20.)
                * step(p0.x, 10. + 2e2*step(20., abs(p0.z)));

    // Occlusion
    occ = min(occ, smoothstep(3.5, 0., -rect(p.xz, vec2(L+2.,10))));

    // Front hole (window grid)
    q = p;
    q.x = rep(q.x, 7.);

    float f = box(q + vec3(0,0,10), vec3(6.6, 2., 3));
    B = max(B, -f);

    B = max(B, abs(p.x) - L);

    return B;
}

float map(vec3 p) {
    vec2 id = vec2(step(40., p.x), rid(p.z, 140.));
    vec3 rn = mix(vec3(1, -.5, 0), hash(id), step(.5, id.x+id.y));

    // Buildings
    vec3 p0 = p;
    p.x = abs(abs(p.x - 40.) - 80.);
    p.z = rep(p.z - id.x*200., 200.);

    float bL = 21.4 + id.y*3.;
    float b1 = building(p0, p - vec3(30,0,0), bL);
    float b2 = building(p0, vec3(p.z,p.y,-p.x), 185.);

    // Elevator lights
    float rpy = 80. + 150. * rn.x;;
    p.y = rep(p.y - iTime * 40. * (rn.y*.5+.5), rpy);
    p -= vec3(30.+bL+ext, rn.z*rpy*.5, ext-10.);

    float l = box(p, vec3(ext*.8, 2.7, ext*.8));
    acc += .5 / (1. + pow(abs(l)*18., 1.17));

    // Fix broken distance before 20s
    b2 = min(b2, abs(p0.x + p0.z - 30.) + 6.);

    return min(b1, b2);
}

// https://iquilezles.org/articles/normalsSDF/
vec3 normal(vec3 p) {
    const vec2 k = vec2(1,-1)*.0001;
    return normalize(k.xyy*map(p + k.xyy) + k.yyx*map(p + k.yyx) +
                     k.yxy*map(p + k.yxy) + k.xxx*map(p + k.xxx));
}

void mainImage(out vec4 O, vec2 F) {
    vec2  R = iResolution.xy,
          u = (F+F-R)/R.y,
          M = iMouse.xy/R * 2. - 1.;
          M *= step(1., iMouse.z);

    // Camera animation
    float T  = 1. - pow(1. - clamp(iTime*.025, 0., 1.), 3.);
    float ax = mix(-.8, .36, T);
    float az = mix(-40., -140., T);
    float rx = M.x*.45 - (cos(iTime*.1)*.5+.5)*.4;
    rx = clamp(ax + rx - .55, min(iTime*.05 - 1.6, -.9), .1);

    // Ray origin & direction
    vec3 ro = vec3(0, iTime*10., az);
    vec3 rd = normalize(vec3(u, 3));

    rd.zy *= rot(M.y*1.3);
    rd.zx *= rot(rx);
    ro.zx *= rot(rx);

    // Raymarching（原本 60 步、最远 2200 单位；雾在远处早就把细节盖掉了，
    // 砍到 38 步／900 单位画面看起来幾乎没差，但每个像素的运算量少了三分之一）
    vec3 p; float d, t = 0.;
    for (int i = 0; i < 38; i++) {
        p = ro + t * rd;
        t += d = map(p);
        if (d < .01 || t > 900.) break;
    }

    // Base color
    vec3 col = vec3(.13,.11,.26) - vec3(1,1,0)*abs(p.x-40.)*.001;
    col *= clamp(1. + dot(normal(p), normalize(vec3(0,0,1))), .5, 1.);

    // Texture
    col *= 1. - texture(iChannel0, vec2(p.x+p.z, p.y+p.z)*.05).rgb*.7;

    // Occlusion
    col *= occ;

    // Exponential fog
    col = mix(vec3(.002,.005,.015), col, exp(-t*.0025*vec3(.8,1,1.2) - length(u)*.5));

    // Light accumulation
    col += acc * mix(vec3(1,.97,.76), vec3(1,.57,.36), t*.0006);

    // Color correction
    col = pow(col, .46*vec3(.98,.96,1));

    // Vignette
    u = F/R; u *= 1. - u.yx;
    col *= pow(clamp(u.x * u.y * 80., 0., 1.), .2);

    O = vec4(col, 1);
}

void main() {
    vec4 O;
    mainImage(O, gl_FragCoord.xy);
    fragColor = vec4(O.rgb, uOpacity);
}
`;

  const CITY_SHADER_VERTEX = `in vec3 position;
void main() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

  function buildCityShaderPass() {
    const shaderScene = new THREE.Scene();
    const shaderCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const uniforms = {
      iTime: { value: 0 },
      iResolution: { value: new THREE.Vector3(1, 1, 1) },
      iMouse: { value: new THREE.Vector4(0, 0, 0, 0) },
      iChannel0: { value: buildCityNoiseTexture() },
      uOpacity: { value: 0 },
    };

    const material = new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3,
      uniforms,
      vertexShader: CITY_SHADER_VERTEX,
      fragmentShader: CITY_SHADER_FRAGMENT,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });

    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    shaderScene.add(quad);

    return { shaderScene, shaderCamera, uniforms };
  }

  /* ---------------- 经纬度 → 球面座标（跟下面画大陆用的等距圆柱投影对齐） ---------------- */
  function latLongToVector3(lat, lon, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    return new THREE.Vector3(
      -radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta),
    );
  }

  /* ---------------- 地球贴图：真实世界地图（NASA Blue Marble 等距柱状投影），
     经纬度换算跟 latLongToVector3 用的是同一套标准公式，本初子午线对齐贴图水平中线，
     所以下面 buildGlobeMarkers 的经纬度可以直接对上贴图里真正的国家位置 ---------------- */
  const earthTextureLoader = new THREE.TextureLoader();
  function buildEarthTexture() {
    const texture = earthTextureLoader.load('assets/img/world-map.jpg');
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  /* ---------------- 地图标注用的文字贴图（地名牌） ---------------- */
  function makeLabelSprite(text) {
    const scale = 4;
    const canvas = document.createElement('canvas');
    canvas.width = 220 * scale;
    canvas.height = 60 * scale;
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    ctx.font = '600 22px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const textWidth = ctx.measureText(text).width;
    const boxW = textWidth + 28;
    const boxH = 32;
    const boxX = 110 - boxW / 2;
    const boxY = 30 - boxH / 2;
    const r = 7;
    ctx.fillStyle = 'rgba(4, 18, 11, .8)';
    ctx.strokeStyle = 'rgba(255, 255, 255, .4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(boxX + r, boxY);
    ctx.arcTo(boxX + boxW, boxY, boxX + boxW, boxY + boxH, r);
    ctx.arcTo(boxX + boxW, boxY + boxH, boxX, boxY + boxH, r);
    ctx.arcTo(boxX, boxY + boxH, boxX, boxY, r);
    ctx.arcTo(boxX, boxY, boxX + boxW, boxY, r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, 110, 31);

    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0, depthTest: true });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(6.6, 1.8, 1);
    return sprite;
  }

  /* ---------------- 曾经做过的专案在地图上的位置标注 ---------------- */
  function buildGlobeMarkers(radius) {
    const group = new THREE.Group();
    const items = [
      { lat: 23.7, lon: 121.0, label: 'Taiwan' },
      { lat: 46.6, lon: 2.2, label: 'France' },
      { lat: 23.4, lon: 53.8, label: 'UAE' },
      { lat: 49.4, lon: 8.7, label: 'Germany' },
    ];

    const markers = items.map(({ lat, lon, label }) => {
      const pos = latLongToVector3(lat, lon, radius * 1.02);
      const dotGeo = new THREE.SphereGeometry(radius * 0.018, 12, 12);
      const dotMat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0 });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.copy(pos);
      group.add(dot);

      const labelSprite = makeLabelSprite(label);
      labelSprite.position.copy(pos.clone().multiplyScalar(1.14));
      group.add(labelSprite);

      return { dotMat, labelMat: labelSprite.material, direction: pos.clone().normalize(), opacity: 0 };
    });

    group.userData.markers = markers;
    return group;
  }

  /* ---------------- 旋转地球（Project & Program 背景） ---------------- */
  function buildGlobe() {
    const group = new THREE.Group();
    const radius = CONFIG.globeRadius;

    // 实心内核贴上简化的世界地图（海洋 + 七大洲色块）
    const coreGeo = new THREE.SphereGeometry(radius, 64, 40);
    const coreMat = new THREE.MeshStandardMaterial({
      map: buildEarthTexture(),
      roughness: 0.85,
      metalness: 0,
      transparent: true,
      opacity: 0,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    // 经纬线框，营造「地球仪／全球网络」的科技感
    const wireGeo = new THREE.SphereGeometry(radius * 1.006, 32, 20);
    const wireMat = new THREE.MeshBasicMaterial({
      color: '#bfe3d0',
      wireframe: true,
      transparent: true,
      opacity: 0,
    });
    const wire = new THREE.Mesh(wireGeo, wireMat);
    group.add(wire);

    // 我做过的专案所在地标注，转到面向镜头那一侧才会亮起来（见 updateGlobeMarkers）
    const markers = buildGlobeMarkers(radius);
    group.add(markers);
    group.userData.markers = markers.userData.markers;

    group.userData.fadeMats = [coreMat, wireMat];
    return group;
  }

  // 首页山脉正上方（不是地形本身的部分）用一层大型天空半球做出蓝天的感觉，
  // 只在 Hero 区块出现，Contact 虽然也共用山脉背景但不需要天空（见 updateFade）
  function buildSky() {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#0d3d73');
    grad.addColorStop(0.4, '#3f7fb0');
    grad.addColorStop(0.75, '#bcdcec');
    grad.addColorStop(1, 'rgba(188,220,236,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 2, 512);
    const texture = new THREE.CanvasTexture(canvas);

    // 用完整球体（不只上半部），避免几何体在中途开口切出一圈硬边圆弧——
    // 靠贴图本身在下缘淡到全透明去跟地形／雾融合，而不是靠裁掉幾何范围
    const geo = new THREE.SphereGeometry(240, 24, 24);
    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      fog: false,
    });
    return new THREE.Mesh(geo, mat);
  }

  const landscape = new THREE.Group();
  landscape.position.x = CONFIG.groupOffsetX;
  scene.add(landscape);

  const terrain = buildTerrain();
  // 两条河流的可见范围都刻意留在镜头看向的那一小片区域（跟原本验证过、不会盖到
  // 左侧标题文字的范围一致），地图放大后的其余区域就单纯是山，没有河流也没关系
  const river1 = buildRiver(riverCenterZ1, -75, 75);
  const river2 = buildRiver(riverCenterZ2, -65, 90);
  const particles = buildParticles(CONFIG.particleCount);
  landscape.add(terrain, river1, river2, particles);

  const cityShader = buildCityShaderPass();
  cityShader.uniforms.iResolution.value.set(renderer.domElement.width, renderer.domElement.height, 1);

  // 地球放在跟摄影机目标点差不多的位置，不管镜头怎么自动漂移都还是大致置中，
  // 不需要为了这个背景另外调一套摄影机参数。半径加倍之后原本 +14 的垫高量
  // 相对小了很多，会把地球顶到画面上緣，改成只垫高一点点让它更靠近画面中央
  const globe = buildGlobe();
  globe.position.set(CONFIG.cameraTarget[0], CONFIG.cameraTarget[1] + 4, CONFIG.cameraTarget[2]);
  scene.add(globe);
  const Y_AXIS = new THREE.Vector3(0, 1, 0);

  // 以摄影机环绕中心为球心，半径远大于摄影机环绕半径，不管拖曳怎么转都还是「站在天空里」
  const sky = buildSky();
  sky.position.set(CONFIG.cameraTarget[0], CONFIG.cameraTarget[1], CONFIG.cameraTarget[2]);
  scene.add(sky);

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

  /* ---------------- 依照目前捲到哪个区块，决定显示山脉／城市／地球／都不显示 ---------------- */
  // hero、contact 都用山脉+河流；about 是城市剪影；experience 整个背景收起来
  // （改用白底绿字，见 style.css）；projects 是旋转地球
  const BACKDROP_BY_SECTION = {
    hero: 'mountain',
    about: 'city',
    experience: 'city',
    projects: 'globe',
    contact: 'mountain',
  };

  let mountainMix = 1;
  let mountainMixTarget = 1;
  let cityMix = 0;
  let cityMixTarget = 0;
  let globeMix = 0;
  let globeMixTarget = 0;
  let heroSkyMix = 0;
  let heroSkyMixTarget = 0;

  const sectionRatios = {};
  Object.keys(BACKDROP_BY_SECTION).forEach((id) => { sectionRatios[id] = 0; });

  function applyBackdropTargets() {
    let winnerId = 'hero';
    let best = -1;
    Object.keys(sectionRatios).forEach((id) => {
      if (sectionRatios[id] > best) {
        best = sectionRatios[id];
        winnerId = id;
      }
    });
    const backdrop = BACKDROP_BY_SECTION[winnerId];
    mountainMixTarget = backdrop === 'mountain' ? 1 : 0;
    cityMixTarget = backdrop === 'city' ? 1 : 0;
    globeMixTarget = backdrop === 'globe' ? 1 : 0;
    // 蓝天只在真的捲到 Hero 时出现——Contact 虽然也用山脉背景，但不需要天空
    heroSkyMixTarget = winnerId === 'hero' ? 1 : 0;
  }

  Object.keys(BACKDROP_BY_SECTION).forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { sectionRatios[id] = entry.intersectionRatio; });
      applyBackdropTargets();
    }, { threshold: [0, .1, .2, .3, .4, .5, .6, .7, .8, .9, 1] });
    observer.observe(el);
  });

  function updateFade() {
    mountainMix += (mountainMixTarget - mountainMix) * CONFIG.cityMixEase;
    cityMix += (cityMixTarget - cityMix) * CONFIG.cityMixEase;
    globeMix += (globeMixTarget - globeMix) * CONFIG.cityMixEase;
    heroSkyMix += (heroSkyMixTarget - heroSkyMix) * CONFIG.cityMixEase;
    sky.material.opacity = heroSkyMix * 0.85;

    // 山脉/河流是不透明网格，没有 opacity 可以柔化，改成快要盖满画面时才整个隐藏/显示，
    // 其他背景（半透明）继续用 opacity 慢慢淡入淡出，视觉上还是一段柔和的过渡
    const showLandscape = mountainMix > 0.4;
    terrain.visible = showLandscape;
    const riverBrightness = CONFIG.riverBrightness * THREE.MathUtils.clamp((mountainMix - 0.4) / 0.6, 0, 1);
    [river1, river2].forEach((r) => {
      r.visible = showLandscape;
      r.material.uniforms.uBrightness.value = riverBrightness;
    });

    particles.material.opacity = 0.5 * Math.max(mountainMix, cityMix, globeMix);

    cityShader.uniforms.uOpacity.value = cityMix;

    const [globeCoreMat, globeWireMat] = globe.userData.fadeMats;
    globeCoreMat.opacity = globeMix * 0.95;
    globeWireMat.opacity = globeMix * 0.4;
  }

  // 哪个标注目前转到面向镜头那一侧，就把它的地名牌淡入──呼应「转动地球，
  // 做过的专案会跑出来」的效果；转到背面就淡出，避免一次全部挤在画面上
  function updateGlobeMarkers() {
    const toCamera = camera.position.clone().sub(globe.position).normalize();
    globe.userData.markers.forEach((m) => {
      const worldDir = m.direction.clone().applyAxisAngle(Y_AXIS, globe.rotation.y);
      const facing = worldDir.dot(toCamera);
      const target = facing > 0.15 ? 1 : 0;
      m.opacity += (target - m.opacity) * 0.08;
      const finalOpacity = m.opacity * globeMix;
      m.dotMat.opacity = finalOpacity * 0.95;
      m.labelMat.opacity = finalOpacity * 0.95;
    });
  }

  /* ---------------- 缩放 ---------------- */
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    cityShader.uniforms.iResolution.value.set(renderer.domElement.width, renderer.domElement.height, 1);
  });

  /* ---------------- 主循环 ---------------- */
  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const dt = clock.getDelta();

    if (!dragging) theta += CONFIG.autoDriftSpeed * dt;
    updateCameraPosition();

    river1.material.uniforms.uTime.value += dt;
    river2.material.uniforms.uTime.value += dt;
    globe.rotation.y += CONFIG.globeRotationSpeed * dt;
    updateGlobeMarkers();
    updateFade();

    cityShader.uniforms.iTime.value += dt;

    // 城市 shader 用独立场景/正交相机先画一层当背景，主场景（山脉/河流/地球）
    // 不清除画布地叠上去，透明处才会露出下面的城市背景；cityMix 是 0 时直接跳过
    // 这个 raymarching pass，省一份效能
    renderer.clear();
    if (cityShader.uniforms.uOpacity.value > 0.01) {
      renderer.render(cityShader.shaderScene, cityShader.shaderCamera);
    }
    renderer.render(scene, camera);
  }
  animate();
}
