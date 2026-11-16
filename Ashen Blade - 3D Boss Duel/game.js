import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// ============================================================================
// 1. DIFFICULTY PRESETS, 3-HERO ROSTER & GAME STATE
// ============================================================================
const DIFFICULTY_MODES = {
  EASY: {
    label: 'EASY',
    playerMaxHp: 150,
    bossMaxHp: 800,
    bossDmgMult: 0.6,
    bossAttackInterval: 3.3,
    parryWindow: 0.55,
    manaRegen: 12,
    scoreMult: 0.8,
    allowHeal: true
  },
  MEDIUM: {
    label: 'MEDIUM',
    playerMaxHp: 100,
    bossMaxHp: 1000,
    bossDmgMult: 1.0,
    bossAttackInterval: 2.4,
    parryWindow: 0.42,
    manaRegen: 8.5,
    scoreMult: 1.0,
    allowHeal: true
  },
  HARD: {
    label: 'HARD',
    playerMaxHp: 85,
    bossMaxHp: 1350,
    bossDmgMult: 1.45,
    bossAttackInterval: 1.85,
    parryWindow: 0.32,
    manaRegen: 6.5,
    scoreMult: 1.5,
    allowHeal: true
  },
  HARDCORE: {
    label: 'HARDCORE',
    playerMaxHp: 1,
    bossMaxHp: 1550,
    bossDmgMult: 999,
    bossAttackInterval: 1.45,
    parryWindow: 0.28,
    manaRegen: 9.5,
    scoreMult: 3.0,
    allowHeal: false
  }
};

const HERO_ROSTER = {
  TOJI: {
    id: 'TOJI',
    name: 'TOJI FUSHIGURO',
    title: 'The Sorcerer Killer (Heavenly Restriction)',
    hpLabel: 'TOJI HP',
    manaLabel: 'STAMINA',
    accentColor: '#9b5de5',
    comboColors: [0x9b5de5, 0xff0055, 0x00f5d4],
    dashName: 'HEAVENLY RESTRICTION FLASH STEP',
    basicName: 'INVERTED SPEAR SLASH',
    spells: [
      { name: 'Spear Wave', cost: 20, cd: 2.5, feed: '[1] INVERTED SPEAR NULLIFY WAVE' },
      { name: 'Zero-Curse Ambush', cost: 30, cd: 4.5, feed: '[2] ZERO-CURSE BLINK AMBUSH' },
      { name: 'Heavenly Pact', cost: 35, cd: 8.0, feed: '[3] HEAVENLY PACT RESOLVE' },
      { name: '1000-Mile Chain', cost: 50, cd: 11.0, feed: '[4] CHAIN OF A THOUSAND MILES' }
    ]
  },
  GOKU: {
    id: 'GOKU',
    name: 'SON GOKU (SSJ)',
    title: 'Super Saiyan Martial Artist',
    hpLabel: 'GOKU HP',
    manaLabel: 'SAIYAN KI',
    accentColor: '#ffbe0b',
    comboColors: [0xffbe0b, 0x00bbf9, 0xff5400],
    dashName: 'Z-VANISH AFTERIMAGE STEP',
    basicName: 'GOD FIST / POWER POLE COMBO',
    spells: [
      { name: 'Kamehameha', cost: 20, cd: 2.5, feed: '[1] KAMEHAMEHA ENERGY BEAM!' },
      { name: 'Instant Trans.', cost: 30, cd: 4.5, feed: '[2] INSTANT TRANSMISSION SLEDGEHAMMER!' },
      { name: 'Kaioken Aura', cost: 35, cd: 8.0, feed: '[3] SUPER SAIYAN KAIOKEN SHIELD!' },
      { name: 'Spirit Bomb', cost: 50, cd: 11.0, feed: '[4] SUPER SPIRIT BOMB (GENKI DAMA)!' }
    ]
  },
  GOJO: {
    id: 'GOJO',
    name: 'SATORU GOJO',
    title: 'The Strongest (Six Eyes & Limitless)',
    hpLabel: 'GOJO HP',
    manaLabel: 'CURSED ENERGY',
    accentColor: '#00f5d4',
    comboColors: [0x00bbf9, 0xff0055, 0x9b5de5],
    dashName: 'BLUE HIGH-SPEED TELEPORT',
    basicName: 'BLACK FLASH (KOKUSEN) STRIKE',
    spells: [
      { name: 'Lapse: Blue', cost: 20, cd: 2.5, feed: '[1] CURSED TECHNIQUE LAPSE: BLUE (AO)!' },
      { name: 'Reversal: Red', cost: 30, cd: 4.5, feed: '[2] CURSED TECHNIQUE REVERSAL: RED (AKA)!' },
      { name: 'Infinity Ward', cost: 35, cd: 8.0, feed: '[3] LIMITLESS: INFINITY BARRIER & RCT!' },
      { name: 'Hollow Purple', cost: 50, cd: 11.0, feed: '[4] HOLLOW TECHNIQUE: PURPLE (MURASAKI)!' }
    ]
  }
};

let currentDifficulty = 'MEDIUM';
let currentHero = 'TOJI';

const STORY_ACTS = [
  {
    start: 0.0,
    end: 3.8,
    badge: 'ACT I — THE STAR PLASMA SANCTUM',
    jp: '星漿体の聖域 — 呪いの覚醒',
    en: 'Deep within the Cursed Sanctum, the ancient seal holding Kagu-Ryu shatters...'
  },
  {
    start: 3.8,
    end: 7.5,
    badge: 'ACT II — LEGENDS AWAKEN',
    jp: '伝説の戦士たち — 究極の決戦',
    en: 'Toji Fushiguro, Son Goku, and Satoru Gojo step onto the obsidian dais to face the calamity.'
  },
  {
    start: 7.5,
    end: 11.5,
    badge: 'ACT III — DESCENT OF THE STORM DRAGON',
    jp: '嵐竜カグリュウの降臨',
    en: 'The Special-Grade Dragon Kagu-Ryu descends upon the monolith pillars in molten fury!'
  },
  {
    start: 11.5,
    end: 15.0,
    badge: 'ACT IV — BREAK ALL LIMITS',
    jp: '限界突破 — 全ての力を解放せよ',
    en: 'Unleash Inverted Spear, Kamehameha, and Hollow Purple before the Abyss consumes the sky!'
  }
];

const state = {
  mode: 'STORY_CUTSCENE', // STORY_CUTSCENE | TITLE | COMBAT | PHASE2_CUTSCENE | FINALE_CUTSCENE | END
  cutsceneTime: 0,
  phase2CutsceneTime: 0,
  finaleTime: 0,
  finaleVictory: true,
  phase: 1,
  score: 0,
  combo: 1,
  comboTimer: 0,
  cameraShake: 0,
  hitStop: 0,
  yaw: 0,
  pitch: 0.16,
  lockedOnBoss: false,
  player: {
    pos: new THREE.Vector3(0, 0, 14),
    vel: new THREE.Vector3(),
    moveSpeed: 0,
    yaw: Math.PI,
    hp: 100,
    maxHp: 100,
    mana: 100,
    maxMana: 100,
    dashTimer: 0,
    dashCooldown: 0,
    invulnTimer: 0,
    attackStep: 0,
    attackTimer: 0,
    attackDuration: 0.36,
    parryTimer: 0,
    jadeShield: false,
    cooldowns: [0, 0, 0, 0]
  },
  boss: {
    pos: new THREE.Vector3(0, 9.5, -12),
    hp: 1000,
    maxHp: 1000,
    baseMaxHp: 1000,
    orbitAngle: 0,
    state: 'ORBIT', // ORBIT | TELEGRAPH | LUNGE | BREATH_SWEEP
    stateTimer: 2.2,
    attackType: 'FIREBALL',
    lungeTarget: new THREE.Vector3(),
    sweepAngle: 0,
    jawOpen: 0.15
  }
};

// ============================================================================
// 2. WARM CINEMATIC WEB AUDIO ENGINE (SOFT, FILTERED, ZERO HARSH BUZZ)
// ============================================================================
class CinematicAudioEngine {
  constructor() {
    this.ctx = null;
    this.noiseBuffer = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      const sampleRate = this.ctx.sampleRate;
      const length = sampleRate * 1.5;
      this.noiseBuffer = this.ctx.createBuffer(1, length, sampleRate);
      const output = this.noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.997 * b0 + white * 0.029;
        b1 = 0.985 * b1 + white * 0.032;
        b2 = 0.950 * b2 + white * 0.048;
        b3 = 0.850 * b3 + white * 0.065;
        output[i] = (b0 + b1 + b2 + b3) * 0.25;
      }
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  slash(pitch = 1) {
    this.init();
    const now = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(2.2, now);
    filter.frequency.setValueAtTime(260 * pitch, now);
    filter.frequency.exponentialRampToValueAtTime(920 * pitch, now + 0.07);
    filter.frequency.exponentialRampToValueAtTime(180, now + 0.22);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.24, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.23);

    noise.connect(filter).connect(gain).connect(this.ctx.destination);
    noise.start(now);
    noise.stop(now + 0.24);
  }

  parryClang() {
    this.init();
    const now = this.ctx.currentTime;
    const freqs = [528, 792, 1056];
    freqs.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.exponentialRampToValueAtTime(f * 0.992, now + 0.55);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.11 / (idx + 1), now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.55);

      osc.connect(gain).connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.56);
    });
  }

  energyBeamHum(freq = 140, duration = 0.65) {
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.65, now + duration);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(360, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(filter).connect(gain).connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  taikoDrum() {
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(98, now);
    osc.frequency.exponentialRampToValueAtTime(34, now + 0.55);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.58);

    osc.connect(gain).connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.6);
  }

  roar() {
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(72, now);
    osc.frequency.exponentialRampToValueAtTime(36, now + 1.1);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(150, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.28, now + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.15);

    osc.connect(filter).connect(gain).connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 1.18);
  }

  thunder() {
    this.init();
    const now = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(240, now);
    filter.frequency.exponentialRampToValueAtTime(55, now + 0.9);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.32, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.95);

    noise.connect(filter).connect(gain).connect(this.ctx.destination);
    noise.start(now);
    noise.stop(now + 0.98);
  }
}
const sfx = new CinematicAudioEngine();

// ============================================================================
// 3. ULTRA-HIGH-END RENDERER, CURSED SANCTUM ARENA & FLOATING MONOLITHS
// ============================================================================
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0b0716, 0.012);

const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 380);
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'high-performance'
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio || 2);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.24;
renderer.domElement.style.transition = 'filter 0.8s ease';
document.body.appendChild(renderer.domElement);

const composer = new EffectComposer(renderer);
composer.setPixelRatio(window.devicePixelRatio || 2);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.05,
  0.38,
  0.75
);
composer.addPass(bloomPass);

function createCursedSanctumFloorTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0e0c14';
  ctx.fillRect(0, 0, 1024, 1024);

  const step = 128;
  ctx.strokeStyle = '#1d1729';
  ctx.lineWidth = 6;
  for (let y = 0; y < 1024; y += step) {
    for (let x = 0; x < 1024; x += step) {
      const shade = 14 + Math.floor(Math.random() * 12);
      ctx.fillStyle = `rgb(${shade}, ${shade + 2}, ${shade + 10})`;
      ctx.fillRect(x + 3, y + 3, step - 6, step - 6);
      ctx.strokeRect(x, y, step, step);

      ctx.strokeStyle = 'rgba(110, 80, 255, 0.12)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 18, y + 18, step - 36, step - 36);
      ctx.strokeStyle = '#1d1729';
      ctx.lineWidth = 6;
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(10, 10);
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return tex;
}

function createHighResScaleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#140c1e';
  ctx.fillRect(0, 0, 512, 512);
  ctx.strokeStyle = '#4a3068';
  ctx.lineWidth = 4;
  for (let y = 0; y < 512; y += 24) {
    for (let x = 0; x < 512; x += 24) {
      const offset = (y / 24) % 2 === 0 ? 0 : 12;
      ctx.beginPath();
      ctx.arc(x + offset, y, 12, 0, Math.PI);
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return tex;
}

const stoneTex = createCursedSanctumFloorTexture();
const scaleTex = createHighResScaleTexture();

// Cursed Sanctum Sky Dome
const skyGeo = new THREE.SphereGeometry(220, 48, 36);
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide,
  uniforms: {
    topColor: { value: new THREE.Color(0x05030d) },
    midColor: { value: new THREE.Color(0x1f113d) },
    bottomColor: { value: new THREE.Color(0x5a1846) }
  },
  vertexShader: `
    varying vec3 vWorldPosition;
    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 topColor;
    uniform vec3 midColor;
    uniform vec3 bottomColor;
    varying vec3 vWorldPosition;
    void main() {
      float h = normalize(vWorldPosition).y;
      vec3 col = mix(bottomColor, midColor, smoothstep(-0.08, 0.28, h));
      col = mix(col, topColor, smoothstep(0.28, 0.85, h));
      gl_FragColor = vec4(col, 1.0);
    }
  `
});
scene.add(new THREE.Mesh(skyGeo, skyMat));

const eclipseHalo = new THREE.Mesh(
  new THREE.RingGeometry(19, 22, 64),
  new THREE.MeshBasicMaterial({ color: 0x9b5de5, side: THREE.DoubleSide })
);
eclipseHalo.position.set(0, 34, -140);
scene.add(eclipseHalo);

// Lighting
const ambientLight = new THREE.AmbientLight(0xb8a6ff, 0.8);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffe0b2, 2.9);
sunLight.position.set(22, 46, -38);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(4096, 4096);
sunLight.shadow.camera.near = 5;
sunLight.shadow.camera.far = 140;
const d = 35;
sunLight.shadow.camera.left = -d;
sunLight.shadow.camera.right = d;
sunLight.shadow.camera.top = d;
sunLight.shadow.camera.bottom = -d;
scene.add(sunLight);

const rimLight = new THREE.DirectionalLight(0x7b2cbf, 1.85);
rimLight.position.set(-28, 18, 28);
scene.add(rimLight);

// Star Plasma Tomb / Cursed Monolith Sanctum Arena
const ARENA_RADIUS = 29;
const floorMesh = new THREE.Mesh(
  new THREE.CylinderGeometry(ARENA_RADIUS, ARENA_RADIUS * 1.12, 3.6, 64),
  new THREE.MeshStandardMaterial({
    map: stoneTex,
    bumpMap: stoneTex,
    bumpScale: 0.08,
    roughness: 0.55,
    metalness: 0.35
  })
);
floorMesh.position.y = -1.8;
floorMesh.receiveShadow = true;
scene.add(floorMesh);

const outerSealRing = new THREE.Mesh(
  new THREE.RingGeometry(ARENA_RADIUS - 1.5, ARENA_RADIUS - 1.05, 96),
  new THREE.MeshBasicMaterial({ color: 0x7209b7, side: THREE.DoubleSide })
);
outerSealRing.rotation.x = -Math.PI / 2;
outerSealRing.position.y = 0.03;
scene.add(outerSealRing);

const innerSealRing = new THREE.Mesh(
  new THREE.RingGeometry(11.5, 11.85, 64),
  new THREE.MeshBasicMaterial({ color: 0x4cc9f0, side: THREE.DoubleSide, transparent: true, opacity: 0.65 })
);
innerSealRing.rotation.x = -Math.PI / 2;
innerSealRing.position.y = 0.03;
scene.add(innerSealRing);

const floatingMonoliths = [];
const pillarMat = new THREE.MeshStandardMaterial({
  color: 0x161224,
  roughness: 0.5,
  metalness: 0.4,
  bumpMap: stoneTex,
  bumpScale: 0.05
});
const sealGlowMat = new THREE.MeshBasicMaterial({ color: 0x7209b7 });

for (let i = 0; i < 8; i++) {
  const ang = (i / 8) * Math.PI * 2 + Math.PI / 8;
  const dist = ARENA_RADIUS - 1.2;
  const px = Math.cos(ang) * dist;
  const pz = Math.sin(ang) * dist;

  const pillarGroup = new THREE.Group();
  const height = 13 + (i % 2) * 3.5;

  const baseBlock = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.8, 2.8), pillarMat);
  baseBlock.position.y = 0.9;

  const shaft = new THREE.Mesh(new THREE.BoxGeometry(1.9, height, 1.9), pillarMat);
  shaft.position.y = height * 0.5 + 1.2;
  shaft.castShadow = true;

  const runeStrip = new THREE.Mesh(new THREE.BoxGeometry(0.28, height * 0.78, 2.02), sealGlowMat);
  runeStrip.position.y = height * 0.5 + 1.2;

  const floatingCrystal = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.85, 0),
    new THREE.MeshBasicMaterial({ color: 0x4cc9f0, wireframe: true })
  );
  floatingCrystal.position.y = height + 3.2;

  pillarGroup.add(baseBlock, shaft, runeStrip, floatingCrystal);
  pillarGroup.position.set(px, 0, pz);
  pillarGroup.lookAt(0, 0, 0);
  scene.add(pillarGroup);

  floatingMonoliths.push({ mesh: floatingCrystal, baseY: height + 3.2, phase: i * 0.9 });
}

for (let i = 0; i < 14; i++) {
  const ang = (i / 14) * Math.PI * 2;
  const radius = 38 + (i % 3) * 11;
  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(2.5 + Math.random() * 2, 5 + Math.random() * 6, 2.5),
    pillarMat
  );
  const baseY = 6 + (i % 4) * 5;
  slab.position.set(Math.cos(ang) * radius, baseY, Math.sin(ang) * radius);
  slab.rotation.set(Math.random() * 0.3, Math.random() * Math.PI, Math.random() * 0.3);
  scene.add(slab);
  floatingMonoliths.push({ mesh: slab, baseY, phase: i * 1.4 });
}

const LEAF_COUNT = 280;
const leafGeo = new THREE.BufferGeometry();
const leafPositions = new Float32Array(LEAF_COUNT * 3);
for (let i = 0; i < LEAF_COUNT; i++) {
  leafPositions[i * 3] = (Math.random() - 0.5) * 68;
  leafPositions[i * 3 + 1] = Math.random() * 26;
  leafPositions[i * 3 + 2] = (Math.random() - 0.5) * 68;
}
leafGeo.setAttribute('position', new THREE.BufferAttribute(leafPositions, 3));
const leafParticles = new THREE.Points(
  leafGeo,
  new THREE.PointsMaterial({ color: 0x7b2cbf, size: 0.34, transparent: true, opacity: 0.88 })
);
scene.add(leafParticles);

// ============================================================================
// 4. PLAYABLE CHARACTER MODELS: TOJI FUSHIGURO, SON GOKU & SATORU GOJO
// ============================================================================
const samuraiGroup = new THREE.Group();
scene.add(samuraiGroup);

const samuraiBodyGroup = new THREE.Group();
samuraiGroup.add(samuraiBodyGroup);

// Shared Dynamic Materials that Morph per Selected Hero
const heroShirtMat = new THREE.MeshStandardMaterial({
  color: 0x111116,
  roughness: 0.5,
  metalness: 0.15
});
const heroUndershirtMat = new THREE.MeshStandardMaterial({
  color: 0x111116,
  roughness: 0.55
});
const heroPantsMat = new THREE.MeshStandardMaterial({
  color: 0xedeae4,
  roughness: 0.75,
  metalness: 0.05
});
const heroBeltMat = new THREE.MeshStandardMaterial({
  color: 0x111116,
  roughness: 0.5
});
const heroBootMat = new THREE.MeshStandardMaterial({
  color: 0x111116,
  roughness: 0.5
});
const heroSkinMat = new THREE.MeshStandardMaterial({
  color: 0xdcb697,
  roughness: 0.55
});
const heroHairMat = new THREE.MeshStandardMaterial({
  color: 0x09090d,
  roughness: 0.35,
  emissive: 0x000000
});
const wormSpiritMat = new THREE.MeshStandardMaterial({
  color: 0x5e3a78,
  roughness: 0.4,
  metalness: 0.2,
  emissive: 0x1e0b30
});

// 1. Legs & Boots
const leftLegGroup = new THREE.Group();
leftLegGroup.position.set(0.24, 0.95, 0);
const rightLegGroup = new THREE.Group();
rightLegGroup.position.set(-0.24, 0.95, 0);

function populateHeroLeg(legGroup) {
  const baggyUpper = new THREE.Mesh(new THREE.SphereGeometry(0.27, 14, 14), heroPantsMat);
  baggyUpper.scale.set(0.95, 1.55, 1.05);
  baggyUpper.position.y = -0.32;

  const baggyLower = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.11, 0.48, 14), heroPantsMat);
  baggyLower.position.y = -0.62;

  const ankleCuff = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.1, 0.24, 12), heroBootMat);
  ankleCuff.position.y = -0.82;

  const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.11, 0.35), heroBootMat);
  shoe.position.set(0, -0.9, -0.06);

  legGroup.add(baggyUpper, baggyLower, ankleCuff, shoe);
}
populateHeroLeg(leftLegGroup);
populateHeroLeg(rightLegGroup);
samuraiBodyGroup.add(leftLegGroup, rightLegGroup);

// Obi Belt + Goku Hanging Sash
const beltMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.37, 0.39, 0.18, 16), heroBeltMat);
beltMesh.position.y = 1.04;
samuraiBodyGroup.add(beltMesh);

// 2. Muscular Torso & Chest
const lowerTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.33, 0.52, 16), heroShirtMat);
lowerTorso.position.y = 1.3;
lowerTorso.scale.set(1.12, 1, 0.82);

const upperChest = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.42, 0.56, 16), heroShirtMat);
upperChest.position.y = 1.72;
upperChest.scale.set(1.18, 1, 0.85);

// Goku Navy Undershirt V-Collar & Gojo High Collar
const vCollarMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.22, 0.32, 12), heroUndershirtMat);
vCollarMesh.position.set(0, 1.88, -0.12);
samuraiBodyGroup.add(lowerTorso, upperChest, vCollarMesh);

for (let side of [-1, 1]) {
  const deltoid = new THREE.Mesh(new THREE.SphereGeometry(0.21, 14, 14), heroShirtMat);
  deltoid.position.set(side * 0.58, 1.88, 0);
  samuraiBodyGroup.add(deltoid);
}

// Left Arm + Wristband
const leftArmGroup = new THREE.Group();
leftArmGroup.position.set(-0.62, 1.82, 0);
const leftBicep = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 0.42, 12), heroSkinMat);
leftBicep.position.y = -0.22;
const leftForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.095, 0.42, 12), heroSkinMat);
leftForearm.position.set(0, -0.55, -0.1);
leftForearm.rotation.x = 0.4;
const leftWristband = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.11, 0.14, 12), heroBeltMat);
leftWristband.position.set(0, -0.68, -0.15);
leftWristband.rotation.x = 0.4;
leftArmGroup.add(leftBicep, leftForearm, leftWristband);
samuraiBodyGroup.add(leftArmGroup);

// 3. Head, Blindfold (Gojo), & Spiky Anime Hair (Morphs for Toji, Goku SSJ, and Gojo)
const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 0.22, 12), heroSkinMat);
neckMesh.position.y = 2.05;
samuraiBodyGroup.add(neckMesh);

const tojiHeadGroup = new THREE.Group();
tojiHeadGroup.position.y = 2.24;
samuraiBodyGroup.add(tojiHeadGroup);

const headSphere = new THREE.Mesh(new THREE.SphereGeometry(0.26, 20, 20), heroSkinMat);
headSphere.scale.set(0.94, 1.06, 0.98);
tojiHeadGroup.add(headSphere);

// Gojo's Signature Black Blindfold Wrap & High Collar
const gojoBlindfold = new THREE.Mesh(
  new THREE.CylinderGeometry(0.268, 0.268, 0.13, 20),
  new THREE.MeshStandardMaterial({ color: 0x050508, roughness: 0.4 })
);
gojoBlindfold.position.set(0, 0.03, -0.01);
gojoBlindfold.visible = false;
tojiHeadGroup.add(gojoBlindfold);

const gojoHighCollar = new THREE.Mesh(
  new THREE.CylinderGeometry(0.28, 0.26, 0.26, 16),
  new THREE.MeshStandardMaterial({ color: 0x0b0d17, roughness: 0.5 })
);
gojoHighCollar.position.set(0, -0.16, 0);
gojoHighCollar.visible = false;
tojiHeadGroup.add(gojoHighCollar);

// Hair Crown + 22 Dynamic Anime Hair Spikes
const hairCrown = new THREE.Mesh(new THREE.SphereGeometry(0.275, 16, 16), heroHairMat);
hairCrown.position.set(0, 0.05, 0.03);
tojiHeadGroup.add(hairCrown);

const hairSpikeMeshes = [];
for (let i = 0; i < 22; i++) {
  const spike = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.38, 6), heroHairMat);
  const phi = (i / 22) * Math.PI * 2;
  const elev = (i % 3) * 0.28;
  spike.position.set(Math.sin(phi) * 0.24, 0.08 + elev * 0.35, Math.cos(phi) * 0.24);
  spike.rotation.x = Math.cos(phi) * 0.85 - 0.2;
  spike.rotation.z = -Math.sin(phi) * 0.85;
  tojiHeadGroup.add(spike);
  hairSpikeMeshes.push({ mesh: spike, phi, elev });
}

// 4. Toji's Coiled Inventory Curse Worm (Visible only when playing as Toji)
const tojiWormGroup = new THREE.Group();
samuraiBodyGroup.add(tojiWormGroup);
const inventoryWormSegments = [];
const WORM_SEGS = 16;
for (let i = 0; i < WORM_SEGS; i++) {
  const frac = i / (WORM_SEGS - 1);
  const coilAngle = frac * Math.PI * 2.15 + 0.6;
  const bx = Math.cos(coilAngle) * 0.56;
  const bz = Math.sin(coilAngle) * 0.44;
  const yPos = 1.92 - Math.sin(frac * Math.PI) * 0.58;

  const segRadius = i === 0 ? 0.19 : Math.max(0.11, 0.175 - frac * 0.05);
  const wormSeg = new THREE.Mesh(new THREE.SphereGeometry(segRadius, 14, 14), wormSpiritMat);
  wormSeg.scale.set(1.15, 0.95, 1.15);
  wormSeg.position.set(bx, yPos, bz);

  if (i === 0) {
    const wormEyeMat = new THREE.MeshBasicMaterial({ color: 0xffe66d });
    const wEye1 = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), wormEyeMat);
    wEye1.position.set(0.08, 0.05, -0.15);
    const wEye2 = wEye1.clone();
    wEye2.position.x = -0.08;
    wormSeg.add(wEye1, wEye2);
  }
  tojiWormGroup.add(wormSeg);
  inventoryWormSegments.push({ mesh: wormSeg, basePos: new THREE.Vector3(bx, yPos, bz), idx: i });
}

// 5. Goku Super Saiyan Ki Aura & Gojo Six Eyes / Infinity Aura Rings
const heroAuraGroup = new THREE.Group();
samuraiBodyGroup.add(heroAuraGroup);

const gokuAuraCone = new THREE.Mesh(
  new THREE.ConeGeometry(1.15, 2.8, 16, 1, true),
  new THREE.MeshBasicMaterial({
    color: 0xffbe0b,
    wireframe: true,
    transparent: true,
    opacity: 0.42
  })
);
gokuAuraCone.position.y = 1.35;
gokuAuraCone.visible = false;
heroAuraGroup.add(gokuAuraCone);

const gojoInfinityOrbs = new THREE.Group();
const blueMiniOrb = new THREE.Mesh(
  new THREE.SphereGeometry(0.22, 16, 16),
  new THREE.MeshBasicMaterial({ color: 0x00bbf9 })
);
blueMiniOrb.position.set(-0.85, 1.55, -0.35);
const redMiniOrb = new THREE.Mesh(
  new THREE.SphereGeometry(0.22, 16, 16),
  new THREE.MeshBasicMaterial({ color: 0xff0055 })
);
redMiniOrb.position.set(0.85, 1.55, -0.35);
gojoInfinityOrbs.add(blueMiniOrb, redMiniOrb);
gojoInfinityOrbs.visible = false;
samuraiBodyGroup.add(gojoInfinityOrbs);

// 6. Right Weapon Pivot (Holds Toji's Inverted Spear, Goku's Power Pole / Ki Fist, or Gojo's Black Flash Hand)
const swordPivot = new THREE.Group();
swordPivot.position.set(0.62, 1.72, -0.05);
samuraiBodyGroup.add(swordPivot);

const rightArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.11, 0.52, 12), heroSkinMat);
rightArmMesh.rotation.x = Math.PI / 2;
rightArmMesh.position.set(0, 0, 0.15);
swordPivot.add(rightArmMesh);

// Weapon Group A: Toji's Inverted Spear of Heaven
const tojiSpearGroup = new THREE.Group();
const spearGoldMat = new THREE.MeshStandardMaterial({
  color: 0xd4a359,
  metalness: 0.85,
  roughness: 0.25
});
const spearHilt = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.65, 12), heroShirtMat);
spearHilt.rotation.x = Math.PI / 2;
spearHilt.position.z = 0.25;
const pommelRing = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.025, 10, 20), spearGoldMat);
pommelRing.position.z = 0.65;
for (let c = 0; c < 5; c++) {
  const link = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.018, 8, 14), spearGoldMat);
  link.position.set(0, -c * 0.09, 0.72 + c * 0.06);
  link.rotation.y = (c % 2) * (Math.PI / 2);
  tojiSpearGroup.add(link);
}
const spearGuard = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.12, 0.14), spearGoldMat);
spearGuard.position.z = -0.08;
const mainBlade = new THREE.Mesh(
  new THREE.BoxGeometry(0.055, 0.14, 2.25),
  new THREE.MeshBasicMaterial({ color: 0xf4f0ff })
);
mainBlade.position.set(0, 0.02, -1.2);
const hookProng = new THREE.Mesh(
  new THREE.BoxGeometry(0.045, 0.07, 0.95),
  new THREE.MeshBasicMaterial({ color: 0xc77dff })
);
hookProng.position.set(0, 0.14, -0.75);
hookProng.rotation.x = 0.18;
tojiSpearGroup.add(spearHilt, pommelRing, spearGuard, mainBlade, hookProng);
swordPivot.add(tojiSpearGroup);

// Weapon Group B: Goku's Nyoibo (Power Pole) + Golden Ki Fist Aura
const gokuPoleGroup = new THREE.Group();
const powerPoleMesh = new THREE.Mesh(
  new THREE.CylinderGeometry(0.05, 0.05, 2.8, 12),
  new THREE.MeshStandardMaterial({ color: 0xd90429, emissive: 0x4a000b, roughness: 0.3 })
);
powerPoleMesh.rotation.x = Math.PI / 2;
powerPoleMesh.position.z = -1.1;
const kiFistSphere = new THREE.Mesh(
  new THREE.SphereGeometry(0.28, 14, 14),
  new THREE.MeshBasicMaterial({ color: 0xffbe0b, transparent: true, opacity: 0.85 })
);
kiFistSphere.position.z = -0.35;
gokuPoleGroup.add(powerPoleMesh, kiFistSphere);
gokuPoleGroup.visible = false;
swordPivot.add(gokuPoleGroup);

// Weapon Group C: Gojo's Cursed Energy / Black Flash Hand Core
const gojoHandGroup = new THREE.Group();
const gojoFistCore = new THREE.Mesh(
  new THREE.SphereGeometry(0.26, 16, 16),
  new THREE.MeshBasicMaterial({ color: 0x00bbf9 })
);
gojoFistCore.position.z = -0.38;
const gojoRing = new THREE.Mesh(
  new THREE.TorusGeometry(0.42, 0.03, 10, 24),
  new THREE.MeshBasicMaterial({ color: 0x9b5de5 })
);
gojoRing.position.z = -0.45;
gojoHandGroup.add(gojoFistCore, gojoRing);
gojoHandGroup.visible = false;
swordPivot.add(gojoHandGroup);

// Continuous Kamehameha / Hollow Purple Beam Mesh attached to Player
const playerBeamMesh = new THREE.Mesh(
  new THREE.CylinderGeometry(0.65, 1.35, 34, 20),
  new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.92 })
);
playerBeamMesh.geometry.translate(0, -17, 0);
playerBeamMesh.geometry.rotateX(-Math.PI / 2);
playerBeamMesh.position.set(0, 1.5, -0.8);
playerBeamMesh.visible = false;
samuraiGroup.add(playerBeamMesh);

const bladeBaseNode = new THREE.Object3D();
bladeBaseNode.position.set(0, 0, -0.15);
const bladeTipNode = new THREE.Object3D();
bladeTipNode.position.set(0, 0, -2.35);
swordPivot.add(bladeBaseNode, bladeTipNode);

// Dynamic 3D Weapon / Martial Arts Ribbon Trail Mesh
const TRAIL_SEGS = 18;
const trailGeo = new THREE.BufferGeometry();
const trailPositions = new Float32Array(TRAIL_SEGS * 2 * 3);
const trailIndices = [];
for (let i = 0; i < TRAIL_SEGS - 1; i++) {
  const a = i * 2;
  const b = i * 2 + 1;
  const c = (i + 1) * 2;
  const d = (i + 1) * 2 + 1;
  trailIndices.push(a, b, c, b, d, c);
}
trailGeo.setIndex(trailIndices);
trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
const trailMat = new THREE.MeshBasicMaterial({
  color: 0x9b5de5,
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.0
});
const swordTrailMesh = new THREE.Mesh(trailGeo, trailMat);
swordTrailMesh.frustumCulled = false;
scene.add(swordTrailMesh);

// Applies Visual Outfit, Hair, Aura, and HUD Spell Names for Toji, Goku, or Gojo
function applyHeroSelection(heroKey) {
  currentHero = heroKey;
  const cfg = HERO_ROSTER[heroKey];

  // Update Top Bar & Title Screen Active Cards
  const heroBtnSpan = document.getElementById('current-hero-label');
  if (heroBtnSpan) heroBtnSpan.textContent = cfg.name;
  document.querySelectorAll('.hero-card').forEach((c) => {
    c.classList.toggle('active', c.dataset.hero === heroKey);
  });

  // Update HUD Labels & 4 Spell Names
  const vitalLabels = document.querySelectorAll('.vital-label');
  if (vitalLabels[0]) vitalLabels[0].textContent = cfg.hpLabel;
  if (vitalLabels[1]) vitalLabels[1].textContent = cfg.manaLabel;

  cfg.spells.forEach((sp, i) => {
    const slotEl = document.querySelector(`#spell-${i + 1} .spell-name`);
    if (slotEl) slotEl.textContent = sp.name;
  });

  // Morph 3D Character Appearance
  if (heroKey === 'TOJI') {
    heroShirtMat.color.setHex(0x111116); // Tight black shirt
    heroUndershirtMat.color.setHex(0x111116);
    heroPantsMat.color.setHex(0xedeae4); // Baggy white Tobi pants
    heroBeltMat.color.setHex(0x111116);
    heroBootMat.color.setHex(0x111116);
    heroHairMat.color.setHex(0x09090d); // Spiky jet-black hair
    heroHairMat.emissive.setHex(0x000000);

    tojiWormGroup.visible = true;
    tojiSpearGroup.visible = true;
    gokuPoleGroup.visible = false;
    gokuAuraCone.visible = false;
    gojoHandGroup.visible = false;
    gojoBlindfold.visible = false;
    gojoHighCollar.visible = false;
    gojoInfinityOrbs.visible = false;

    hairSpikeMeshes.forEach((s) => {
      s.mesh.scale.set(1, 1, 1);
      s.mesh.rotation.x = Math.cos(s.phi) * 0.85 - 0.2;
    });
  } else if (heroKey === 'GOKU') {
    heroShirtMat.color.setHex(0xff5400); // Turtle Hermit Orange Gi
    heroUndershirtMat.color.setHex(0x123499); // Navy blue undershirt
    heroPantsMat.color.setHex(0xff5400); // Orange Gi pants
    heroBeltMat.color.setHex(0x123499); // Blue Obi belt & wristbands
    heroBootMat.color.setHex(0x123499); // Navy Saiyan/Martial Arts boots
    heroHairMat.color.setHex(0xffe033); // Glowing Super Saiyan Gold hair!
    heroHairMat.emissive.setHex(0x8a5a00);

    tojiWormGroup.visible = false;
    tojiSpearGroup.visible = false;
    gokuPoleGroup.visible = true;
    gokuAuraCone.visible = true;
    gojoHandGroup.visible = false;
    gojoBlindfold.visible = false;
    gojoHighCollar.visible = false;
    gojoInfinityOrbs.visible = false;

    // Taller upturned Super Saiyan spikes
    hairSpikeMeshes.forEach((s) => {
      s.mesh.scale.set(1.28, 1.75, 1.28);
      s.mesh.rotation.x = Math.cos(s.phi) * 0.45 + 0.35;
    });
  } else if (heroKey === 'GOJO') {
    heroShirtMat.color.setHex(0x0b0d17); // Dark Jujutsu High uniform jacket
    heroUndershirtMat.color.setHex(0x0b0d17);
    heroPantsMat.color.setHex(0x0b0d17); // Dark uniform trousers
    heroBeltMat.color.setHex(0x050508);
    heroBootMat.color.setHex(0x050508);
    heroHairMat.color.setHex(0xf8f9ff); // Pure snow-white spiky hair
    heroHairMat.emissive.setHex(0x2a3550);

    tojiWormGroup.visible = false;
    tojiSpearGroup.visible = false;
    gokuPoleGroup.visible = false;
    gokuAuraCone.visible = false;
    gojoHandGroup.visible = true;
    gojoBlindfold.visible = true;
    gojoHighCollar.visible = true;
    gojoInfinityOrbs.visible = true;

    hairSpikeMeshes.forEach((s) => {
      s.mesh.scale.set(1.12, 1.45, 1.12);
      s.mesh.rotation.x = Math.cos(s.phi) * 0.55 + 0.2;
    });
  }

  if (state.mode === 'COMBAT') {
    updateFeed(`SWITCHED TO ${cfg.name}`);
    spawnShockwave(state.player.pos, new THREE.Color(cfg.accentColor).getHex(), 6);
  }
}

function updateHeroAnimations(t, moveSpeed, dt) {
  if (tojiWormGroup.visible) {
    inventoryWormSegments.forEach((seg) => {
      const pulse = Math.sin(t * 5.0 - seg.idx * 0.45) * 0.018;
      seg.mesh.position.set(
        seg.basePos.x * (1 + pulse),
        seg.basePos.y + pulse * 0.8,
        seg.basePos.z * (1 + pulse)
      );
    });
  }

  if (gokuAuraCone.visible) {
    gokuAuraCone.rotation.y = t * 4.5;
    gokuAuraCone.scale.setScalar(1 + Math.sin(t * 16) * 0.08);
  }

  if (gojoInfinityOrbs.visible) {
    blueMiniOrb.position.y = 1.55 + Math.sin(t * 4.5) * 0.15;
    redMiniOrb.position.y = 1.55 + Math.cos(t * 4.5) * 0.15;
    gojoHandGroup.rotation.z = t * 5;
  }

  if (moveSpeed > 0.5) {
    const stride = Math.sin(t * 14);
    leftLegGroup.rotation.x = stride * 0.58;
    rightLegGroup.rotation.x = -stride * 0.58;
    leftArmGroup.rotation.x = -stride * 0.45;
  } else {
    leftLegGroup.rotation.x = THREE.MathUtils.lerp(leftLegGroup.rotation.x, 0, dt * 10);
    rightLegGroup.rotation.x = THREE.MathUtils.lerp(rightLegGroup.rotation.x, 0, dt * 10);
    leftArmGroup.rotation.x = THREE.MathUtils.lerp(leftArmGroup.rotation.x, 0, dt * 10);
  }
}

function updateKatanaSwingAndTrail(dt) {
  const p = state.player;
  const heroCfg = HERO_ROSTER[currentHero];

  if (p.attackTimer > 0) {
    const progress = 1 - p.attackTimer / p.attackDuration;
    const ease = 1 - Math.pow(1 - progress, 3);

    if (p.attackStep === 1) {
      samuraiBodyGroup.rotation.y = THREE.MathUtils.lerp(-0.5, 0.6, ease);
      swordPivot.rotation.set(
        THREE.MathUtils.lerp(-0.5, 0.3, ease),
        THREE.MathUtils.lerp(-1.35, 1.45, ease),
        -0.45
      );
      trailMat.color.setHex(heroCfg.comboColors[0]);
    } else if (p.attackStep === 2) {
      samuraiBodyGroup.rotation.y = THREE.MathUtils.lerp(0.6, -0.6, ease);
      swordPivot.rotation.set(
        THREE.MathUtils.lerp(0.4, -0.6, ease),
        THREE.MathUtils.lerp(1.45, -1.4, ease),
        0.52
      );
      trailMat.color.setHex(heroCfg.comboColors[1]);
    } else {
      samuraiBodyGroup.rotation.y = ease * Math.PI * 2;
      swordPivot.rotation.set(THREE.MathUtils.lerp(-2.2, 0.75, ease), 0, 0);
      trailMat.color.setHex(heroCfg.comboColors[2]);
    }
    trailMat.opacity = 0.85;
  } else if (p.parryTimer > 0) {
    samuraiBodyGroup.rotation.y = THREE.MathUtils.lerp(samuraiBodyGroup.rotation.y, 0, dt * 12);
    swordPivot.rotation.set(-0.2, 0.65, 1.15);
    trailMat.color.setHex(0x00f5d4);
    trailMat.opacity = 0.68;
  } else {
    samuraiBodyGroup.rotation.y = THREE.MathUtils.lerp(samuraiBodyGroup.rotation.y, 0, dt * 10);
    swordPivot.rotation.x = THREE.MathUtils.lerp(swordPivot.rotation.x, -0.25, dt * 10);
    swordPivot.rotation.y = THREE.MathUtils.lerp(swordPivot.rotation.y, -0.15, dt * 10);
    swordPivot.rotation.z = THREE.MathUtils.lerp(swordPivot.rotation.z, 0.1, dt * 10);
    trailMat.opacity = THREE.MathUtils.lerp(trailMat.opacity, 0.0, dt * 12);
  }

  const posArr = trailGeo.attributes.position.array;
  for (let i = TRAIL_SEGS - 1; i > 0; i--) {
    const dst = i * 6;
    const src = (i - 1) * 6;
    for (let k = 0; k < 6; k++) posArr[dst + k] = posArr[src + k];
  }
  const baseW = new THREE.Vector3();
  const tipW = new THREE.Vector3();
  bladeBaseNode.getWorldPosition(baseW);
  bladeTipNode.getWorldPosition(tipW);
  posArr[0] = baseW.x;
  posArr[1] = baseW.y;
  posArr[2] = baseW.z;
  posArr[3] = tipW.x;
  posArr[4] = tipW.y;
  posArr[5] = tipW.z;
  trailGeo.attributes.position.needsUpdate = true;
}

const jadeShieldMesh = new THREE.Mesh(
  new THREE.IcosahedronGeometry(1.75, 1),
  new THREE.MeshBasicMaterial({ color: 0x2ec4b6, wireframe: true, transparent: true, opacity: 0.65 })
);
jadeShieldMesh.position.y = 1.3;
jadeShieldMesh.visible = false;
samuraiGroup.add(jadeShieldMesh);

// ============================================================================
// 5. SCULPTED DRAGON + PHASE 2 NIGHTMARE ABYSSAL MUTATION (KEPT UNCHANGED)
// ============================================================================
const dragonGroup = new THREE.Group();
scene.add(dragonGroup);

const dragonScaleMat = new THREE.MeshStandardMaterial({
  color: 0x1b1226,
  bumpMap: scaleTex,
  bumpScale: 0.14,
  roughness: 0.3,
  metalness: 0.72,
  emissive: 0x12051a
});

const dragonBellyMat = new THREE.MeshStandardMaterial({
  color: 0x7a281d,
  roughness: 0.42,
  metalness: 0.45,
  emissive: 0x330c05
});

const hornBoneMat = new THREE.MeshStandardMaterial({
  color: 0xe6be7a,
  roughness: 0.28,
  metalness: 0.55,
  emissive: 0x3b2208
});

const moltenGlowMat = new THREE.MeshBasicMaterial({ color: 0xffc83b });
const abyssalSpikeMat = new THREE.MeshBasicMaterial({ color: 0xff003c });

const dragonHead = new THREE.Group();
dragonGroup.add(dragonHead);

const cranium = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.5, 2.4), dragonScaleMat);
dragonHead.add(cranium);

const upperSnout = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.9, 2.8), dragonScaleMat);
upperSnout.position.set(0, 0.08, 2.3);
dragonHead.add(upperSnout);

const phase2MutationMeshes = [];

const voidHaloRing = new THREE.Mesh(
  new THREE.TorusGeometry(2.6, 0.14, 12, 48),
  abyssalSpikeMat
);
voidHaloRing.position.set(0, 1.4, -1.1);
voidHaloRing.visible = false;
dragonHead.add(voidHaloRing);
phase2MutationMeshes.push(voidHaloRing);

for (let side of [-1, 1]) {
  const brow = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.28, 1.35), dragonScaleMat);
  brow.position.set(side * 0.85, 0.65, 0.85);
  brow.rotation.z = side * -0.35;
  brow.rotation.y = side * 0.2;

  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 16), moltenGlowMat);
  eye.scale.set(0.8, 0.55, 1.3);
  eye.position.set(side * 0.88, 0.35, 0.85);

  for (let extra = 1; extra <= 2; extra++) {
    const abyssEye = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), abyssalSpikeMat);
    abyssEye.position.set(side * (0.92 + extra * 0.08), 0.55 + extra * 0.22, 0.35 - extra * 0.45);
    abyssEye.visible = false;
    dragonHead.add(abyssEye);
    phase2MutationMeshes.push(abyssEye);
  }

  const nightmareTusk = new THREE.Mesh(new THREE.ConeGeometry(0.24, 2.3, 8), abyssalSpikeMat);
  nightmareTusk.position.set(side * 1.25, -0.35, 1.9);
  nightmareTusk.rotation.x = Math.PI * 0.38;
  nightmareTusk.rotation.z = side * -0.45;
  nightmareTusk.visible = false;
  dragonHead.add(nightmareTusk);
  phase2MutationMeshes.push(nightmareTusk);

  const nostril = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), dragonScaleMat);
  nostril.position.set(side * 0.48, 0.48, 3.35);

  for (let f = 0; f < 6; f++) {
    const fang = new THREE.Mesh(
      new THREE.ConeGeometry(0.09, f === 0 ? 0.55 : 0.34, 6),
      hornBoneMat
    );
    fang.rotation.x = Math.PI;
    fang.position.set(side * 0.62, -0.48, 1.2 + f * 0.4);
    dragonHead.add(fang);
  }

  const hornGroup = new THREE.Group();
  hornGroup.position.set(side * 0.75, 0.72, -0.5);
  for (let h = 0; h < 6; h++) {
    const hSeg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.26 - h * 0.038, 0.31 - h * 0.038, 0.85, 10),
      hornBoneMat
    );
    hSeg.position.set(side * h * 0.18, h * 0.42, -h * 0.58);
    hSeg.rotation.x = -0.78 + Math.sin(h * 0.6) * 0.25;
    hSeg.rotation.z = side * -0.28;
    hornGroup.add(hSeg);
  }

  for (let c = 0; c < 3; c++) {
    const frill = new THREE.Mesh(new THREE.ConeGeometry(0.18, 1.15, 6), hornBoneMat);
    frill.position.set(side * 1.15, 0.15 - c * 0.3, -0.3 - c * 0.3);
    frill.rotation.z = side * -1.1;
    frill.rotation.x = -0.5;
    dragonHead.add(frill);
  }

  dragonHead.add(brow, eye, nostril, hornGroup);
}

const leftWhiskerSegs = [];
const rightWhiskerSegs = [];
for (let side of [-1, 1]) {
  const arr = side === -1 ? rightWhiskerSegs : leftWhiskerSegs;
  for (let w = 0; w < 7; w++) {
    const wSeg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055 - w * 0.006, 0.06 - w * 0.006, 0.65, 8),
      moltenGlowMat
    );
    wSeg.rotation.z = side * 1.2;
    wSeg.position.set(side * (0.75 + w * 0.45), -0.05 - w * 0.12, 3.1 - w * 0.25);
    dragonHead.add(wSeg);
    arr.push(wSeg);
  }
}

const throatCore = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 12), moltenGlowMat);
throatCore.position.set(0, -0.25, 0.9);
const dragonMouthLight = new THREE.PointLight(0xff7722, 3.8, 22);
dragonMouthLight.position.set(0, -0.2, 2.5);
dragonHead.add(throatCore, dragonMouthLight);

const lowerJawPivot = new THREE.Group();
lowerJawPivot.position.set(0, -0.45, 0.65);
const lowerJawMesh = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.48, 2.75), dragonBellyMat);
lowerJawMesh.position.set(0, -0.1, 1.35);
lowerJawPivot.add(lowerJawMesh);

for (let side of [-1, 1]) {
  for (let f = 0; f < 5; f++) {
    const bFang = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.32, 6), hornBoneMat);
    bFang.position.set(side * 0.54, 0.24, 0.5 + f * 0.42);
    lowerJawPivot.add(bFang);
  }
}
dragonHead.add(lowerJawPivot);

const SPINE_COUNT = 28;
const dragonSpine = [];

function createDragonLeg(side) {
  const legGroup = new THREE.Group();
  const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.38, 1.9, 10), dragonScaleMat);
  thigh.position.set(side * 0.5, -0.8, 0);
  thigh.rotation.z = side * 0.35;
  thigh.rotation.x = 0.4;

  const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.26, 1.6, 10), dragonScaleMat);
  shin.position.set(side * 0.85, -2.0, -0.35);
  shin.rotation.x = -0.35;

  for (let t = -1; t <= 1; t++) {
    const talon = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.75, 6), hornBoneMat);
    talon.position.set(side * 0.85 + t * 0.24, -2.75, 0.15);
    talon.rotation.x = Math.PI * 0.38;
    legGroup.add(talon);
  }
  legGroup.add(thigh, shin);
  return legGroup;
}

for (let i = 0; i < SPINE_COUNT; i++) {
  let radius = 1.05;
  if (i < 5) radius = 1.08 + Math.sin((i / 5) * Math.PI) * 0.42;
  else radius = Math.max(0.18, 1.28 * Math.pow(1 - (i - 4) / (SPINE_COUNT - 4), 0.85));

  const segGroup = new THREE.Group();
  const torsoSeg = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.94, radius, 1.35, 16),
    dragonScaleMat
  );
  torsoSeg.rotation.x = Math.PI / 2;
  torsoSeg.scale.set(1.12, 1.0, 0.92);

  const bellyPlate = new THREE.Mesh(
    new THREE.BoxGeometry(radius * 1.35, radius * 0.45, 1.18),
    dragonBellyMat
  );
  bellyPlate.position.y = -radius * 0.72;

  const spineHeight = radius * 1.65;
  const dorsalSpine = new THREE.Mesh(
    new THREE.ConeGeometry(radius * 0.28, spineHeight, 6),
    i % 2 === 0 ? moltenGlowMat : hornBoneMat
  );
  dorsalSpine.position.set(0, radius * 0.95 + spineHeight * 0.3, -0.2);
  dorsalSpine.rotation.x = -0.58;

  if (i % 2 === 0 && i < 22) {
    for (let side of [-1, 1]) {
      const ribHorn = new THREE.Mesh(
        new THREE.ConeGeometry(radius * 0.26, radius * 2.5, 5),
        abyssalSpikeMat
      );
      ribHorn.position.set(side * radius * 1.15, 0.25, -0.2);
      ribHorn.rotation.z = side * -1.05;
      ribHorn.rotation.x = -0.45;
      ribHorn.visible = false;
      segGroup.add(ribHorn);
      phase2MutationMeshes.push(ribHorn);
    }
  }

  segGroup.add(torsoSeg, bellyPlate, dorsalSpine);

  if (i === 3 || i === 11) {
    const leftLeg = createDragonLeg(1);
    const rightLeg = createDragonLeg(-1);
    leftLeg.position.set(radius * 0.65, -0.2, 0);
    rightLeg.position.set(-radius * 0.65, -0.2, 0);
    segGroup.add(leftLeg, rightLeg);
  }

  if (i === SPINE_COUNT - 1) {
    const tailBlade = new THREE.Mesh(new THREE.ConeGeometry(0.85, 2.6, 4), moltenGlowMat);
    tailBlade.rotation.x = -Math.PI / 2;
    tailBlade.scale.set(1.6, 0.25, 1);
    tailBlade.position.z = -1.2;
    segGroup.add(tailBlade);
  }

  segGroup.position.z = -1.2 - i * 1.05;
  dragonGroup.add(segGroup);
  dragonSpine.push(segGroup);
}

const wingMembraneMat = new THREE.MeshStandardMaterial({
  color: 0x591128,
  emissive: 0x2b0410,
  roughness: 0.45,
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.92
});

function createDetailedDragonWing(side) {
  const wingRoot = new THREE.Group();
  const outerWing = new THREE.Group();

  const innerBone = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.18, 4.2, 10), hornBoneMat);
  innerBone.rotation.z = side * -Math.PI / 2;
  innerBone.position.x = side * 2.1;
  wingRoot.add(innerBone);

  const innerWeb = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 4.4), wingMembraneMat);
  innerWeb.rotation.x = Math.PI / 2;
  innerWeb.position.set(side * 2.1, 0, -2.1);
  wingRoot.add(innerWeb);

  outerWing.position.set(side * 4.2, 0, 0);
  wingRoot.add(outerWing);

  const thumbClaw = new THREE.Mesh(new THREE.ConeGeometry(0.16, 1.1, 6), moltenGlowMat);
  thumbClaw.rotation.x = Math.PI / 2;
  thumbClaw.position.z = 0.65;
  outerWing.add(thumbClaw);

  const fingerAngles = [0.05, 0.32, 0.62, 0.95];
  const fingerLengths = [7.8, 7.2, 6.2, 4.8];

  fingerAngles.forEach((ang, idx) => {
    const len = fingerLengths[idx];
    const fingerPivot = new THREE.Group();
    fingerPivot.rotation.y = side * -ang;

    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.05, len, 8), hornBoneMat);
    strut.rotation.z = side * -Math.PI / 2;
    strut.position.x = side * (len * 0.5);
    fingerPivot.add(strut);

    const webPanel = new THREE.Mesh(new THREE.PlaneGeometry(len, 2.3), wingMembraneMat);
    webPanel.rotation.x = Math.PI / 2;
    webPanel.position.set(side * (len * 0.5), -0.02, -1.1);
    fingerPivot.add(webPanel);

    outerWing.add(fingerPivot);
  });

  return { wingRoot, outerWing };
}

const leftWingData = createDetailedDragonWing(1);
const rightWingData = createDetailedDragonWing(-1);
leftWingData.wingRoot.position.set(1.1, 0.7, -3.2);
rightWingData.wingRoot.position.set(-1.1, 0.7, -3.2);
dragonGroup.add(leftWingData.wingRoot, rightWingData.wingRoot);

function setDragonAbyssalForm(isAbyssal) {
  phase2MutationMeshes.forEach((m) => {
    m.visible = isAbyssal;
  });

  if (isAbyssal) {
    dragonGroup.scale.setScalar(1.28);
    dragonScaleMat.color.setHex(0x06020a);
    dragonScaleMat.emissive.setHex(0x2b0012);
    dragonBellyMat.color.setHex(0xb80028);
    dragonBellyMat.emissive.setHex(0x660018);
    moltenGlowMat.color.setHex(0xff0044);
    wingMembraneMat.color.setHex(0x1f0018);
    wingMembraneMat.emissive.setHex(0x5c0024);
    dragonMouthLight.color.setHex(0xff0044);
    dragonMouthLight.intensity = 5.5;
  } else {
    dragonGroup.scale.setScalar(1.0);
    dragonScaleMat.color.setHex(0x1b1226);
    dragonScaleMat.emissive.setHex(0x12051a);
    dragonBellyMat.color.setHex(0x7a281d);
    dragonBellyMat.emissive.setHex(0x330c05);
    moltenGlowMat.color.setHex(0xffc83b);
    wingMembraneMat.color.setHex(0x591128);
    wingMembraneMat.emissive.setHex(0x2b0410);
    dragonMouthLight.color.setHex(0xff7722);
    dragonMouthLight.intensity = 3.8;
  }
}

// --- CRACKLING LIGHTNING ARCS COILING AROUND DRAGON SPINE ---
const LIGHTNING_ARC_COUNT = 5;
const ARC_NODES = 18;
const dragonLightningLines = [];

for (let a = 0; a < LIGHTNING_ARC_COUNT; a++) {
  const arcGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(ARC_NODES * 3);
  arcGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const arcMat = new THREE.LineBasicMaterial({
    color: a % 2 === 0 ? 0xffe066 : 0x00f5d4,
    transparent: true,
    opacity: 0.9
  });
  const line = new THREE.Line(arcGeo, arcMat);
  dragonGroup.add(line);
  dragonLightningLines.push({ line, geo: arcGeo, mat: arcMat, phaseOffset: a * 1.3 });
}

// --- CONTINUOUS FIRE-BREATH PARTICLE STREAM & SWEEPING LASER BEAM ---
const BREATH_PARTICLE_COUNT = 180;
const breathParticles = [];
const breathGroup = new THREE.Group();
scene.add(breathGroup);

const flameGeo = new THREE.SphereGeometry(0.35, 8, 8);
for (let i = 0; i < BREATH_PARTICLE_COUNT; i++) {
  const mat = new THREE.MeshBasicMaterial({
    color: i % 3 === 0 ? 0xfff3b0 : i % 2 === 0 ? 0xff7b00 : 0xd90429,
    transparent: true,
    opacity: 0
  });
  const mesh = new THREE.Mesh(flameGeo, mat);
  mesh.visible = false;
  breathGroup.add(mesh);
  breathParticles.push({
    mesh,
    vel: new THREE.Vector3(),
    life: 0,
    maxLife: 0.45 + Math.random() * 0.35
  });
}

const breathBeamMesh = new THREE.Mesh(
  new THREE.CylinderGeometry(0.5, 1.5, 38, 16),
  new THREE.MeshBasicMaterial({
    color: 0xff0044,
    transparent: true,
    opacity: 0.9
  })
);
breathBeamMesh.geometry.translate(0, -19, 0);
breathBeamMesh.geometry.rotateX(-Math.PI / 2);
breathBeamMesh.position.set(0, -0.2, 2.8);
breathBeamMesh.visible = false;
dragonHead.add(breathBeamMesh);

// --- GOLDEN EMBER DISSOLUTION SWARM (FOR BOSS DEATH FINALE) ---
const EMBER_COUNT = 280;
const emberBurstParticles = [];
const emberGeo = new THREE.DodecahedronGeometry(0.24, 0);
for (let i = 0; i < EMBER_COUNT; i++) {
  const mat = new THREE.MeshBasicMaterial({
    color: i % 3 === 0 ? 0xfff3b0 : i % 2 === 0 ? 0xffae00 : 0xff3b1f,
    transparent: true,
    opacity: 0
  });
  const mesh = new THREE.Mesh(emberGeo, mat);
  mesh.visible = false;
  scene.add(mesh);
  emberBurstParticles.push({
    mesh,
    vel: new THREE.Vector3(),
    life: 0,
    maxLife: 2.5 + Math.random() * 1.8
  });
}

function triggerDragonEmberExplosion(origin) {
  emberBurstParticles.forEach((p, idx) => {
    p.life = p.maxLife;
    p.mesh.visible = true;
    const spineOffset = (idx / EMBER_COUNT) * -28;
    const spawnPos = origin.clone().add(
      new THREE.Vector3(
        (Math.random() - 0.5) * 4.5,
        (Math.random() - 0.5) * 3.5,
        spineOffset * 0.45
      )
    );
    p.mesh.position.copy(spawnPos);
    p.vel.set(
      (Math.random() - 0.5) * 14,
      3.5 + Math.random() * 11,
      (Math.random() - 0.5) * 14
    );
    p.mesh.scale.setScalar(0.8 + Math.random() * 1.4);
    p.mesh.material.opacity = 1.0;
  });
}

// ============================================================================
// 6. PROJECTILES, SLASH ARCS & VFX POOLS
// ============================================================================
const projectiles = [];
const transientVfx = [];

function spawnSlashArc(pos, yaw, color = 0x9b5de5, scale = 1, tilt = 0) {
  const arc = new THREE.Mesh(
    new THREE.RingGeometry(1.3 * scale, 2.45 * scale, 32, 1, -Math.PI * 0.48, Math.PI * 0.96),
    new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.95 })
  );
  arc.position.copy(pos).add(new THREE.Vector3(0, 1.35, 0));
  arc.rotation.x = Math.PI / 2 + tilt;
  arc.rotation.z = yaw;
  scene.add(arc);
  transientVfx.push({ mesh: arc, life: 0.24, maxLife: 0.24, expand: 4.6 });
}

function spawnShockwave(pos, color = 0xffbe3b, maxScale = 14) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.65, 1.25, 48),
    new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
  );
  ring.position.set(pos.x, 0.14, pos.z);
  ring.rotation.x = -Math.PI / 2;
  scene.add(ring);
  transientVfx.push({ mesh: ring, life: 0.55, maxLife: 0.55, expand: maxScale });
}

function spawnMeteorStrike(targetPos) {
  spawnShockwave(targetPos, 0xff0044, 6.0);
  const meteor = new THREE.Mesh(
    new THREE.DodecahedronGeometry(1.15, 1),
    new THREE.MeshBasicMaterial({ color: 0xff1e42 })
  );
  meteor.position.set(
    targetPos.x + (Math.random() - 0.5) * 6,
    28,
    targetPos.z + (Math.random() - 0.5) * 6
  );
  const vel = targetPos.clone().sub(meteor.position).normalize().multiplyScalar(27);
  scene.add(meteor);
  projectiles.push({
    mesh: meteor,
    vel,
    fromPlayer: false,
    isMeteor: true,
    dmg: 28,
    life: 2.5
  });
}

function triggerScreenFlash(opacity = 0.75) {
  const el = document.getElementById('screen-flash');
  el.style.opacity = String(opacity);
  setTimeout(() => {
    el.style.opacity = '0';
  }, 140);
}

// ============================================================================
// 7. DYNAMICALLY INJECT 3-HERO SELECTOR UI INTO TITLE SCREEN & TOP BAR
// ============================================================================
function injectHeroRosterUI() {
  // 1. Add Live Hero Switcher Button to Top Bar
  const topBar = document.getElementById('top-bar');
  if (topBar && !document.getElementById('btn-switch-hero')) {
    const heroBtn = document.createElement('button');
    heroBtn.id = 'btn-switch-hero';
    heroBtn.className = 'ui-btn';
    heroBtn.innerHTML = '🔥 [TAB] Hero: <span id="current-hero-label">TOJI FUSHIGURO</span>';
    heroBtn.addEventListener('click', () => {
      const order = ['TOJI', 'GOKU', 'GOJO'];
      const next = order[(order.indexOf(currentHero) + 1) % order.length];
      applyHeroSelection(next);
    });
    topBar.insertBefore(heroBtn, topBar.children[1]);
  }

  // 2. Add 3-Hero Selection Cards to Title Card
  const diffSection = document.querySelector('.difficulty-section');
  if (diffSection && !document.getElementById('hero-select-section')) {
    const heroSection = document.createElement('div');
    heroSection.id = 'hero-select-section';
    heroSection.style.marginBottom = '18px';
    heroSection.innerHTML = `
      <div class="diff-heading" style="margin-bottom:8px; color:#72ddf7;">SELECT YOUR FIGHTER [PRESS TAB ANYTIME]</div>
      <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:10px;">
        <button class="diff-card hero-card active" data-hero="TOJI">
          <div class="diff-name" style="color:#c77dff;">TOJI FUSHIGURO</div>
          <div class="diff-sub">The Sorcerer Killer</div>
          <div class="diff-stats">Inverted Spear • Inventory Worm • 1000-Mile Chain</div>
        </button>
        <button class="diff-card hero-card" data-hero="GOKU">
          <div class="diff-name" style="color:#ffbe0b;">SON GOKU (SSJ)</div>
          <div class="diff-sub">Super Saiyan Legend</div>
          <div class="diff-stats">Kamehameha Beam • Instant Transmission • Spirit Bomb</div>
        </button>
        <button class="diff-card hero-card" data-hero="GOJO">
          <div class="diff-name" style="color:#00f5d4;">SATORU GOJO</div>
          <div class="diff-sub">The Honored One</div>
          <div class="diff-stats">Black Flash • Lapse Blue & Red • Hollow Purple</div>
        </button>
      </div>
    `;
    diffSection.parentNode.insertBefore(heroSection, diffSection);

    heroSection.querySelectorAll('.hero-card').forEach((card) => {
      card.addEventListener('click', () => {
        applyHeroSelection(card.dataset.hero);
      });
    });
  }
}
injectHeroRosterUI();

// ============================================================================
// 8. INPUT, MOUSE AIMING & UI HANDLERS
// ============================================================================
const keys = {};
window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  keys[k] = true;

  if (e.code === 'Tab') {
    e.preventDefault();
    const order = ['TOJI', 'GOKU', 'GOJO'];
    const next = order[(order.indexOf(currentHero) + 1) % order.length];
    applyHeroSelection(next);
    return;
  }

  if (e.code === 'Space') {
    if (state.mode === 'STORY_CUTSCENE') {
      openTitleOverlay();
      return;
    }
    if (state.mode === 'FINALE_CUTSCENE') {
      showEndCardOverlay(state.finaleVictory);
      return;
    }
    if (state.mode === 'COMBAT') triggerDash();
  }
  if (e.code === 'Enter') {
    if (state.mode === 'STORY_CUTSCENE' || state.mode === 'TITLE') startCombatDuel();
    else if (state.mode === 'END') startCombatDuel();
  }
  if (k === 'c') startStoryCutscene();
  if (state.mode === 'COMBAT') {
    if (k === '1') castSpell(1);
    if (k === '2') castSpell(2);
    if (k === '3') castSpell(3);
    if (k === '4') castSpell(4);
  }
});

window.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

window.addEventListener('mousemove', (e) => {
  if (state.mode !== 'COMBAT') return;
  const sensitivity = 0.0028;
  state.yaw -= e.movementX * sensitivity;
  state.pitch = THREE.MathUtils.clamp(state.pitch - e.movementY * sensitivity, -0.35, 0.65);
});

renderer.domElement.addEventListener('mousedown', (e) => {
  if (state.mode !== 'COMBAT') return;
  if (document.pointerLockElement !== renderer.domElement) {
    renderer.domElement.requestPointerLock?.();
  }
  if (e.button === 0) performKatanaCombo();
  if (e.button === 2) performParry();
});

window.addEventListener('contextmenu', (e) => e.preventDefault());

document.querySelectorAll('.diff-card:not(.hero-card)').forEach((card) => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.diff-card:not(.hero-card)').forEach((c) => c.classList.remove('active'));
    card.classList.add('active');
    currentDifficulty = card.dataset.mode;
    document.getElementById('current-mode-label').textContent = currentDifficulty;
  });
});

document.getElementById('btn-start-duel').addEventListener('click', startCombatDuel);
document.getElementById('btn-watch-lore').addEventListener('click', startStoryCutscene);
document.getElementById('btn-replay-cutscene').addEventListener('click', startStoryCutscene);
document.getElementById('btn-change-mode').addEventListener('click', openTitleOverlay);
document.getElementById('btn-retry').addEventListener('click', startCombatDuel);
document.getElementById('btn-end-mode').addEventListener('click', openTitleOverlay);

// ============================================================================
// 9. CUTSCENE, PHASE 2 MUTATION & GAME FLOW CONTROLLERS
// ============================================================================
function resetCharacterVisualPoses() {
  renderer.domElement.style.filter = 'none';
  dragonGroup.visible = true;
  setDragonAbyssalForm(false);
  dragonGroup.rotation.set(0, 0, 0);
  dragonHead.visible = true;
  leftWingData.wingRoot.visible = true;
  rightWingData.wingRoot.visible = true;
  dragonSpine.forEach((seg) => {
    seg.visible = true;
    seg.scale.setScalar(1);
  });

  samuraiGroup.position.y = 0;
  samuraiGroup.rotation.set(0, Math.PI, 0);
  samuraiBodyGroup.rotation.set(0, 0, 0);
  tojiHeadGroup.rotation.set(0, 0, 0);
  swordPivot.position.set(0.62, 1.72, -0.05);
  swordPivot.rotation.set(-0.25, -0.15, 0.1);
  playerBeamMesh.visible = false;

  applyHeroSelection(currentHero);

  emberBurstParticles.forEach((p) => {
    p.life = 0;
    p.mesh.visible = false;
  });
}

function startStoryCutscene() {
  document.exitPointerLock?.();
  resetCharacterVisualPoses();
  state.mode = 'STORY_CUTSCENE';
  state.cutsceneTime = 0;
  breathBeamMesh.visible = false;
  document.body.classList.remove('combat-mode');
  document.getElementById('title-overlay').classList.add('hidden');
  document.getElementById('combat-hud').classList.add('hidden');
  document.getElementById('end-overlay').classList.add('hidden');
  document.getElementById('cutscene-hud').classList.remove('hidden');
  sfx.taikoDrum();
}

function openTitleOverlay() {
  document.exitPointerLock?.();
  resetCharacterVisualPoses();
  state.mode = 'TITLE';
  breathBeamMesh.visible = false;
  document.body.classList.remove('combat-mode');
  document.getElementById('title-overlay').classList.remove('hidden');
  document.getElementById('combat-hud').classList.add('hidden');
  document.getElementById('end-overlay').classList.add('hidden');
}

function applyAtmosphereForPhase(phase) {
  if (phase === 1) {
    scene.fog.color.setHex(0x0b0716);
    skyMat.uniforms.topColor.value.setHex(0x05030d);
    skyMat.uniforms.midColor.value.setHex(0x1f113d);
    skyMat.uniforms.bottomColor.value.setHex(0x5a1846);
    outerSealRing.material.color.setHex(0x7209b7);
    eclipseHalo.material.color.setHex(0x9b5de5);
    document.getElementById('boss-phase-badge').textContent = 'PHASE I — SPECIAL-GRADE AWAKENING';
    document.getElementById('boss-name').textContent = 'KAGU-RYU, ANCIENT STORM DRAGON';
  } else {
    scene.fog.color.setHex(0x09000d);
    skyMat.uniforms.topColor.value.setHex(0x020005);
    skyMat.uniforms.midColor.value.setHex(0x3b0018);
    skyMat.uniforms.bottomColor.value.setHex(0x990024);
    outerSealRing.material.color.setHex(0xff0044);
    eclipseHalo.material.color.setHex(0xff0044);
    document.getElementById('boss-phase-badge').textContent = 'PHASE II — ABYSSAL NIGHTMARE (1.5x HP)';
    document.getElementById('boss-name').textContent = 'ABYSSAL KAGU-RYU, VOID CALAMITY';
  }
}

function startCombatDuel() {
  const preset = DIFFICULTY_MODES[currentDifficulty];
  resetCharacterVisualPoses();
  state.mode = 'COMBAT';
  state.phase = 1;
  state.score = 0;
  state.combo = 1;
  state.comboTimer = 0;
  state.yaw = Math.PI;
  state.pitch = 0.16;

  state.player.pos.set(0, 0, 14);
  state.player.hp = preset.playerMaxHp;
  state.player.maxHp = preset.playerMaxHp;
  state.player.mana = 100;
  state.player.jadeShield = false;
  state.player.cooldowns = [0, 0, 0, 0];
  jadeShieldMesh.visible = false;
  breathBeamMesh.visible = false;

  state.boss.pos.set(0, 8.5, -12);
  state.boss.baseMaxHp = preset.bossMaxHp;
  state.boss.maxHp = preset.bossMaxHp;
  state.boss.hp = preset.bossMaxHp;
  state.boss.state = 'ORBIT';
  state.boss.stateTimer = 2.0;

  projectiles.forEach((p) => scene.remove(p.mesh));
  projectiles.length = 0;

  applyAtmosphereForPhase(1);
  document.body.classList.add('combat-mode');
  document.getElementById('title-overlay').classList.add('hidden');
  document.getElementById('end-overlay').classList.add('hidden');
  document.getElementById('combat-hud').classList.remove('hidden');
  updateFeed(`${HERO_ROSTER[currentHero].name} — ${preset.label} MODE`);
  sfx.taikoDrum();
}

function updateFeed(msg) {
  document.getElementById('action-feed').textContent = msg;
}

function addScore(pts, reason) {
  const mult = DIFFICULTY_MODES[currentDifficulty].scoreMult;
  state.score += Math.round(pts * state.combo * mult);
  state.combo = Math.min(5, state.combo + 1);
  state.comboTimer = 4.5;
  if (reason) updateFeed(`${reason} (+${Math.round(pts * state.combo * mult)})`);
}

// ============================================================================
// 10. ANIME HERO COMBAT ACTIONS & SIGNATURE SPELLS (TOJI / GOKU / GOJO)
// ============================================================================
function getAimDirection() {
  const dir = new THREE.Vector3(0, 0, -1);
  dir.applyAxisAngle(new THREE.Vector3(1, 0, 0), state.pitch);
  dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), state.yaw);
  return dir.normalize();
}

function triggerDash() {
  if (state.player.dashCooldown > 0) return;
  const heroCfg = HERO_ROSTER[currentHero];
  state.player.dashTimer = 0.22;
  state.player.invulnTimer = 0.38;
  state.player.dashCooldown = 0.78;
  sfx.slash(1.25);
  spawnShockwave(state.player.pos, heroCfg.comboColors[0], 4.8);
  updateFeed(heroCfg.dashName);
}

function performKatanaCombo() {
  if (state.player.attackTimer > 0.08) return;
  const heroCfg = HERO_ROSTER[currentHero];
  state.player.attackStep = (state.player.attackStep % 3) + 1;
  state.player.attackDuration = state.player.attackStep === 3 ? 0.42 : 0.3;
  state.player.attackTimer = state.player.attackDuration;

  const tilts = [0.25, -0.28, 1.35];
  sfx.slash(0.85 + state.player.attackStep * 0.14);
  spawnSlashArc(
    state.player.pos,
    state.yaw,
    heroCfg.comboColors[state.player.attackStep - 1],
    1.05 + state.player.attackStep * 0.22,
    tilts[state.player.attackStep - 1]
  );

  // Gojo Black Flash crimson-black spatial sparks on 3rd hit
  if (currentHero === 'GOJO' && state.player.attackStep === 3) {
    spawnShockwave(state.player.pos, 0xff003c, 7.5);
  }

  const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), state.yaw);
  state.player.pos.addScaledVector(forward, 0.9);

  const distToBoss = state.player.pos.distanceTo(state.boss.pos);
  if (distToBoss < 12.5) {
    const dmg = 36 + state.player.attackStep * 16;
    damageBoss(dmg, `${heroCfg.basicName} #${state.player.attackStep}`);
    state.hitStop = 0.04;
  }
}

function performParry() {
  state.player.parryTimer = DIFFICULTY_MODES[currentDifficulty].parryWindow;
  spawnSlashArc(state.player.pos, state.yaw, 0x00f5d4, 0.95, 0);
  sfx.slash(1.35);
}

function castSpell(slot) {
  const idx = slot - 1;
  const heroCfg = HERO_ROSTER[currentHero];
  const spellCfg = heroCfg.spells[idx];

  if (state.player.cooldowns[idx] > 0 || state.player.mana < spellCfg.cost) {
    updateFeed('INSUFFICIENT ENERGY OR ON COOLDOWN');
    return;
  }

  state.player.mana -= spellCfg.cost;
  state.player.cooldowns[idx] = spellCfg.cd;
  updateFeed(spellCfg.feed);

  const aimDir = state.lockedOnBoss
    ? state.boss.pos.clone().sub(state.player.pos.clone().add(new THREE.Vector3(0, 1.5, 0))).normalize()
    : getAimDirection();

  // --------------------------------------------------------------------------
  // SPELL [1]: RANGED SIGNATURE TECHNIQUE
  // --------------------------------------------------------------------------
  if (slot === 1) {
    if (currentHero === 'GOKU') {
      // GOKU [1]: KAMEHAMEHA ENERGY BEAM + GIANT BLUE KI WAVE!
      sfx.energyBeamHum(155, 0.65);
      playerBeamMesh.material.color.setHex(0x00e5ff);
      playerBeamMesh.visible = true;
      setTimeout(() => {
        playerBeamMesh.visible = false;
      }, 450);

      const kameOrb = new THREE.Mesh(
        new THREE.SphereGeometry(1.45, 20, 20),
        new THREE.MeshBasicMaterial({ color: 0x00f5d4 })
      );
      kameOrb.position.copy(state.player.pos).add(new THREE.Vector3(0, 1.5, 0));
      scene.add(kameOrb);
      projectiles.push({
        mesh: kameOrb,
        vel: aimDir.multiplyScalar(48),
        fromPlayer: true,
        dmg: 105,
        life: 3.0
      });
      state.cameraShake = 0.35;
    } else if (currentHero === 'GOJO') {
      // GOJO [1]: CURSED TECHNIQUE LAPSE: BLUE (AO) IMPLOSION SINGULARITY
      sfx.energyBeamHum(180, 0.55);
      const blueOrb = new THREE.Mesh(
        new THREE.SphereGeometry(1.35, 24, 24),
        new THREE.MeshBasicMaterial({ color: 0x00bbf9 })
      );
      const swirlRing = new THREE.Mesh(
        new THREE.TorusGeometry(2.1, 0.12, 10, 28),
        new THREE.MeshBasicMaterial({ color: 0x90e0ef })
      );
      blueOrb.add(swirlRing);
      blueOrb.position.copy(state.player.pos).add(new THREE.Vector3(0, 1.6, 0));
      scene.add(blueOrb);
      projectiles.push({
        mesh: blueOrb,
        vel: aimDir.multiplyScalar(42),
        fromPlayer: true,
        dmg: 100,
        life: 3.2
      });
    } else {
      // TOJI [1]: INVERTED SPEAR SHOCKWAVE
      sfx.slash(1.1);
      const wave = new THREE.Mesh(
        new THREE.TorusGeometry(1.5, 0.2, 10, 28, Math.PI),
        new THREE.MeshBasicMaterial({ color: 0x9b5de5 })
      );
      wave.position.copy(state.player.pos).add(new THREE.Vector3(0, 1.5, 0));
      scene.add(wave);
      projectiles.push({
        mesh: wave,
        vel: aimDir.multiplyScalar(44),
        fromPlayer: true,
        dmg: 95,
        life: 3.0
      });
    }
  }
  // --------------------------------------------------------------------------
  // SPELL [2]: TELEPORT / HIGH-SPEED STRIKE
  // --------------------------------------------------------------------------
  else if (slot === 2) {
    sfx.parryClang();
    const burstColor =
      currentHero === 'GOKU' ? 0xffbe0b : currentHero === 'GOJO' ? 0xff0055 : 0x00bbf9;
    spawnShockwave(state.player.pos, burstColor, 6.5);
    state.player.pos.set(state.boss.pos.x * 0.75, 0, state.boss.pos.z * 0.75);
    spawnSlashArc(state.player.pos, state.yaw, burstColor, 2.35, 0.35);
    spawnShockwave(state.boss.pos, burstColor, 11);
    damageBoss(150, spellCfg.feed);
    state.cameraShake = 0.42;
  }
  // --------------------------------------------------------------------------
  // SPELL [3]: DEFENSIVE AURA BARRIER & HEAL
  // --------------------------------------------------------------------------
  else if (slot === 3) {
    sfx.parryClang();
    state.player.jadeShield = true;
    jadeShieldMesh.visible = true;
    jadeShieldMesh.material.color.setHex(
      currentHero === 'GOKU' ? 0xffbe0b : currentHero === 'GOJO' ? 0x00bbf9 : 0x2ec4b6
    );
    if (DIFFICULTY_MODES[currentDifficulty].allowHeal) {
      state.player.hp = Math.min(
        state.player.maxHp,
        state.player.hp + Math.round(state.player.maxHp * 0.22)
      );
    }
    spawnShockwave(state.player.pos, jadeShieldMesh.material.color.getHex(), 7.5);
  }
  // --------------------------------------------------------------------------
  // SPELL [4]: ANIME ULTIMATE FINISHER
  // --------------------------------------------------------------------------
  else if (slot === 4) {
    sfx.thunder();
    sfx.energyBeamHum(95, 1.1);
    triggerScreenFlash(0.92);
    state.cameraShake = 0.85;

    if (currentHero === 'GOKU') {
      // GOKU [4]: SUPER SPIRIT BOMB (GENKI DAMA) DROPPING FROM THE SKY!
      const spiritBomb = new THREE.Mesh(
        new THREE.SphereGeometry(6.2, 32, 32),
        new THREE.MeshBasicMaterial({ color: 0x4cc9f0, transparent: true, opacity: 0.94 })
      );
      spiritBomb.position.set(state.boss.pos.x, state.boss.pos.y + 4, state.boss.pos.z);
      scene.add(spiritBomb);
      transientVfx.push({ mesh: spiritBomb, life: 0.85, maxLife: 0.85, expand: 2.2 });
      spawnShockwave(new THREE.Vector3(state.boss.pos.x, 0, state.boss.pos.z), 0x00f5d4, 24);
      damageBoss(260, '[4] SUPER SPIRIT BOMB (GENKI DAMA)!');
    } else if (currentHero === 'GOJO') {
      // GOJO [4]: HOLLOW TECHNIQUE: PURPLE (MURASAKI) GIANT ANNIHILATION SPHERE!
      const hollowPurple = new THREE.Mesh(
        new THREE.SphereGeometry(5.6, 32, 32),
        new THREE.MeshBasicMaterial({ color: 0x9b5de5, transparent: true, opacity: 0.95 })
      );
      hollowPurple.position.copy(state.boss.pos);
      scene.add(hollowPurple);
      transientVfx.push({ mesh: hollowPurple, life: 0.85, maxLife: 0.85, expand: 2.5 });

      playerBeamMesh.material.color.setHex(0x9b5de5);
      playerBeamMesh.visible = true;
      setTimeout(() => {
        playerBeamMesh.visible = false;
      }, 650);

      spawnShockwave(new THREE.Vector3(state.boss.pos.x, 0, state.boss.pos.z), 0x9b5de5, 25);
      damageBoss(265, '[4] HOLLOW TECHNIQUE: PURPLE (MURASAKI)!');
    } else {
      // TOJI [4]: CHAIN OF A THOUSAND MILES SKY-SPLITTER
      const bolt = new THREE.Mesh(
        new THREE.CylinderGeometry(2.4, 2.4, 48, 20),
        new THREE.MeshBasicMaterial({ color: 0x9b5de5, transparent: true, opacity: 0.92 })
      );
      bolt.position.set(state.boss.pos.x, 24, state.boss.pos.z);
      scene.add(bolt);
      transientVfx.push({ mesh: bolt, life: 0.65, maxLife: 0.65, expand: 1.6 });
      spawnShockwave(new THREE.Vector3(state.boss.pos.x, 0, state.boss.pos.z), 0x9b5de5, 20);
      damageBoss(245, '[4] CHAIN OF A THOUSAND MILES!');
    }
  }
}

function damageBoss(amount, reason) {
  if (state.mode !== 'COMBAT') return;
  state.boss.hp = Math.max(0, state.boss.hp - amount);
  addScore(amount * 2, reason);

  if (state.phase === 1 && state.boss.hp <= 0) {
    state.phase = 2;
    state.boss.maxHp = Math.round(state.boss.baseMaxHp * 1.5);
    state.boss.hp = state.boss.maxHp;
    state.mode = 'PHASE2_CUTSCENE';
    state.phase2CutsceneTime = 0;
    breathBeamMesh.visible = false;

    setDragonAbyssalForm(true);
    applyAtmosphereForPhase(2);

    document.body.classList.remove('combat-mode');
    document.getElementById('act-badge').textContent =
      'PHASE II — ABYSSAL VOID MUTATION (1.5x HP AWAKENED)';
    document.getElementById('subtitle-jp').textContent = '深淵の蝕 — 虚無竜カグリュウ覚醒';
    document.getElementById('subtitle-en').textContent =
      'Kagu-Ryu sheds its mortal scales, mutating into an Abyssal Calamity with 1.5x life force!';
    triggerScreenFlash(0.95);
    sfx.roar();
    sfx.thunder();
    return;
  }

  if (state.phase === 2 && state.boss.hp <= 0) {
    startFinaleAnimation(true);
  }
}

function damagePlayer(rawDmg) {
  if (state.mode !== 'COMBAT' || state.player.invulnTimer > 0) return;
  if (state.player.jadeShield) {
    state.player.jadeShield = false;
    jadeShieldMesh.visible = false;
    sfx.parryClang();
    spawnShockwave(state.player.pos, 0x2ec4b6, 8);
    updateFeed('BARRIER NULLIFIED DRAGON HIT!');
    return;
  }

  const phaseDmgBoost = state.phase === 2 ? 1.35 : 1.0;
  const dmg = Math.round(rawDmg * DIFFICULTY_MODES[currentDifficulty].bossDmgMult * phaseDmgBoost);
  state.player.hp = Math.max(0, state.player.hp - dmg);
  state.player.invulnTimer = 0.65;
  state.combo = 1;
  state.cameraShake = 0.45;
  triggerScreenFlash(0.45);
  updateFeed(`STRUCK BY DRAGON (-${dmg} HP)`);

  if (state.player.hp <= 0) {
    startFinaleAnimation(false);
  }
}

function startFinaleAnimation(victory) {
  document.exitPointerLock?.();
  state.mode = 'FINALE_CUTSCENE';
  state.finaleTime = 0;
  state.finaleVictory = victory;
  breathBeamMesh.visible = false;
  jadeShieldMesh.visible = false;
  playerBeamMesh.visible = false;

  projectiles.forEach((p) => scene.remove(p.mesh));
  projectiles.length = 0;

  document.body.classList.remove('combat-mode');
  document.getElementById('combat-hud').classList.add('hidden');
  document.getElementById('cutscene-hud').classList.remove('hidden');

  if (victory) {
    triggerScreenFlash(0.95);
    sfx.thunder();
    sfx.roar();
    spawnShockwave(state.boss.pos, 0xffe66d, 26);
    triggerDragonEmberExplosion(state.boss.pos);
    document.getElementById('act-badge').textContent = `FINAL BLOW — ${HERO_ROSTER[currentHero].name} WINS`;
    document.getElementById('subtitle-jp').textContent = '特級呪竜討伐 — 伝説の完勝';
    document.getElementById('subtitle-en').textContent =
      `Defeated by ${HERO_ROSTER[currentHero].name}, Kagu-Ryu shatters into a thousand golden embers...`;
  } else {
    triggerScreenFlash(0.75);
    sfx.taikoDrum();
    sfx.roar();
    renderer.domElement.style.filter = 'grayscale(85%) contrast(125%)';
    document.getElementById('act-badge').textContent = 'FALLEN IN BATTLE — THE SANCTUM FALLS';
    document.getElementById('subtitle-jp').textContent = '敗北 — 深淵に呑まれし聖域';
    document.getElementById('subtitle-en').textContent =
      'The Abyssal Dragon claims the Star Plasma Sanctum...';
  }
}

function showEndCardOverlay(victory) {
  document.exitPointerLock?.();
  state.mode = 'END';
  const hpBonus = victory ? state.player.hp * 25 : 0;
  const finalScore = state.score + hpBonus;

  let rank = 'B';
  if (victory && currentDifficulty === 'HARDCORE' && finalScore >= 12000) rank = 'SSS — ANIME GOD';
  else if (finalScore >= 9000) rank = 'S';
  else if (finalScore >= 5000) rank = 'A';

  document.getElementById('end-kanji').textContent = victory ? '勝' : '死';
  document.getElementById('end-kanji').style.color = victory ? '#ffd166' : '#ff3b3b';
  document.getElementById('end-title').textContent = victory
    ? `${HERO_ROSTER[currentHero].name} VICTORIOUS`
    : 'FALLEN IN BATTLE';
  document.getElementById('end-subtitle').textContent = victory
    ? 'Kagu-Ryu dissolved into golden embers.'
    : 'The Abyssal Dragon consumed the Star Plasma Sanctum.';
  document.getElementById('end-score').textContent = String(finalScore);
  document.getElementById('end-mode').textContent = `${currentDifficulty} (${currentHero})`;
  document.getElementById('end-rank').textContent = rank;
  document.getElementById('end-overlay').classList.remove('hidden');
}

// ============================================================================
// 11. DRAGON LIGHTNING ARCS, FIRE-BREATH & EMBER SWARM UPDATER
// ============================================================================
function updateDragonLightningAndBreath(dt, t) {
  const isPhase2 = state.phase === 2;
  const isCharging =
    state.boss.state === 'TELEGRAPH' ||
    state.boss.state === 'BREATH_SWEEP' ||
    state.mode === 'PHASE2_CUTSCENE' ||
    (state.mode === 'FINALE_CUTSCENE' && state.finaleVictory);

  if (voidHaloRing.visible) {
    voidHaloRing.rotation.z = t * 3.5;
  }

  dragonLightningLines.forEach((arc, arcIdx) => {
    const posAttr = arc.geo.attributes.position;
    arc.mat.color.setHex(
      isPhase2 ? (arcIdx % 2 === 0 ? 0xff003c : 0x9b00ff) : arcIdx % 2 === 0 ? 0xffe066 : 0x00f5d4
    );
    arc.mat.opacity = isCharging ? 0.98 : 0.68 + Math.sin(t * 15 + arcIdx) * 0.25;

    const jitterAmp = isCharging ? 0.9 : 0.35;
    for (let n = 0; n < ARC_NODES; n++) {
      const spineIdx = Math.min(SPINE_COUNT - 1, Math.floor((n / (ARC_NODES - 1)) * (SPINE_COUNT - 1)));
      const seg = dragonSpine[spineIdx];
      const coilAngle = t * 8 + n * 0.75 + arc.phaseOffset;
      const radius = Math.max(0.35, 1.35 - spineIdx * 0.038);

      const lx =
        seg.position.x +
        Math.cos(coilAngle) * radius +
        (Math.random() - 0.5) * jitterAmp;
      const ly =
        seg.position.y +
        Math.sin(coilAngle) * radius +
        (Math.random() - 0.5) * jitterAmp;
      const lz = seg.position.z + (Math.random() - 0.5) * 0.35;

      posAttr.setXYZ(n, lx, ly, lz);
    }
    posAttr.needsUpdate = true;
  });

  const mouthWorldPos = new THREE.Vector3(0, -0.25, 2.7);
  dragonHead.localToWorld(mouthWorldPos);

  const forwardDir = new THREE.Vector3(0, -0.08, 1)
    .applyQuaternion(dragonGroup.quaternion)
    .normalize();

  const shouldBreatheFire =
    state.boss.state === 'TELEGRAPH' ||
    state.boss.state === 'BREATH_SWEEP' ||
    state.mode === 'PHASE2_CUTSCENE' ||
    (state.mode === 'FINALE_CUTSCENE' && !state.finaleVictory) ||
    (state.mode === 'STORY_CUTSCENE' && state.cutsceneTime > 8.2 && state.cutsceneTime < 12.2);

  breathParticles.forEach((p, idx) => {
    if (isPhase2) {
      p.mesh.material.color.setHex(idx % 2 === 0 ? 0xff0044 : 0x7b00ff);
    }
    if (p.life > 0) {
      p.life -= dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      const progress = 1 - p.life / p.maxLife;
      p.mesh.scale.setScalar(0.6 + progress * 3.4);
      p.mesh.material.opacity = Math.max(0, (p.life / p.maxLife) * 0.88);
      if (p.life <= 0) p.mesh.visible = false;
    } else if (shouldBreatheFire && Math.random() < 0.45) {
      p.life = p.maxLife;
      p.mesh.visible = true;
      p.mesh.position.copy(mouthWorldPos);
      const spread = new THREE.Vector3(
        (Math.random() - 0.5) * 0.36,
        (Math.random() - 0.5) * 0.36,
        (Math.random() - 0.5) * 0.36
      );
      const speed = state.boss.state === 'BREATH_SWEEP' ? 34 : 18 + Math.random() * 10;
      p.vel.copy(forwardDir).add(spread).normalize().multiplyScalar(speed);
      p.mesh.scale.setScalar(0.5);
      p.mesh.material.opacity = 0.9;
    }
  });

  emberBurstParticles.forEach((p) => {
    if (p.life > 0) {
      p.life -= dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      p.mesh.rotation.x += dt * 3;
      p.mesh.rotation.y += dt * 4;
      p.mesh.material.opacity = Math.max(0, p.life / p.maxLife);
      if (p.life <= 0) p.mesh.visible = false;
    }
  });
}

// ============================================================================
// 12. MAIN ANIMATION LOOP
// ============================================================================
let lastTime = performance.now();

function animate(now) {
  requestAnimationFrame(animate);
  const rawDt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;

  if (state.hitStop > 0) {
    state.hitStop -= rawDt;
    composer.render();
    return;
  }

  const timeScale =
    state.mode === 'FINALE_CUTSCENE' && state.finaleTime < 1.8 ? 0.38 : 1.0;
  const dt = rawDt * timeScale;
  const t = now * 0.001;

  floatingMonoliths.forEach((item) => {
    item.mesh.position.y = item.baseY + Math.sin(t * 2.2 + item.phase) * 0.65;
    item.mesh.rotation.y += rawDt * 0.5;
  });

  const posAttr = leafGeo.attributes.position;
  for (let i = 0; i < LEAF_COUNT; i++) {
    let x = posAttr.getX(i) + Math.sin(t + i) * 0.045;
    let y = posAttr.getY(i) + 0.055 * (state.phase === 2 ? 2.2 : 1);
    if (y > 26) y = 0.2;
    posAttr.setXY(i, x, y);
  }
  posAttr.needsUpdate = true;

  // Dragon Kinematics
  const flapSpeed = state.boss.state === 'TELEGRAPH' ? 9.8 : state.phase === 2 ? 6.8 : 5.2;
  const flapAngle = Math.sin(t * flapSpeed);
  leftWingData.wingRoot.rotation.z = flapAngle * 0.5;
  leftWingData.outerWing.rotation.z = Math.sin(t * flapSpeed - 0.65) * 0.54;
  rightWingData.wingRoot.rotation.z = -flapAngle * 0.5;
  rightWingData.outerWing.rotation.z = -Math.sin(t * flapSpeed - 0.65) * 0.54;

  const targetJaw =
    state.boss.state === 'TELEGRAPH' ||
    state.boss.state === 'BREATH_SWEEP' ||
    state.mode === 'PHASE2_CUTSCENE' ||
    state.mode === 'FINALE_CUTSCENE'
      ? 0.68 + Math.sin(t * 18) * 0.14
      : 0.16 + Math.sin(t * 3) * 0.05;
  lowerJawPivot.rotation.x = THREE.MathUtils.lerp(lowerJawPivot.rotation.x, targetJaw, dt * 10);

  leftWhiskerSegs.forEach((w, idx) => {
    w.position.y = -0.05 - idx * 0.12 + Math.sin(t * 6 - idx * 0.5) * 0.08;
  });
  rightWhiskerSegs.forEach((w, idx) => {
    w.position.y = -0.05 - idx * 0.12 + Math.cos(t * 6 - idx * 0.5) * 0.08;
  });

  dragonSpine.forEach((seg, i) => {
    const waveX = Math.sin(t * 4.8 - i * 0.34) * (0.28 + i * 0.055);
    const waveY = Math.cos(t * 3.9 - i * 0.28) * (0.18 + i * 0.03);
    seg.position.x = waveX;
    seg.position.y = waveY;
    seg.rotation.y = Math.cos(t * 4.8 - i * 0.34) * 0.22;
  });

  updateDragonLightningAndBreath(rawDt, t);
  updateHeroAnimations(t, state.player.moveSpeed, rawDt);
  updateKatanaSwingAndTrail(rawDt);

  for (let i = transientVfx.length - 1; i >= 0; i--) {
    const v = transientVfx[i];
    v.life -= rawDt;
    const p = 1 - v.life / v.maxLife;
    v.mesh.scale.setScalar(1 + p * v.expand);
    v.mesh.material.opacity = Math.max(0, v.life / v.maxLife);
    if (v.life <= 0) {
      scene.remove(v.mesh);
      transientVfx.splice(i, 1);
    }
  }

  // --------------------------------------------------------------------------
  // MODE A: 15-SECOND 4-ACT STORYLINE CUTSCENE
  // --------------------------------------------------------------------------
  if (state.mode === 'STORY_CUTSCENE') {
    state.cutsceneTime += rawDt;
    const ct = state.cutsceneTime;

    const act = STORY_ACTS.find((a) => ct >= a.start && ct <= a.end) || STORY_ACTS[3];
    document.getElementById('act-badge').textContent = act.badge;
    document.getElementById('subtitle-jp').textContent = act.jp;
    document.getElementById('subtitle-en').textContent = act.en;
    document.getElementById('cutscene-timeline-fill').style.width = `${Math.min(100, (ct / 15) * 100)}%`;
    document.getElementById('cutscene-timer').textContent = `${ct.toFixed(1)}s / 15.0s`;

    samuraiGroup.position.set(0, 0, 12);
    samuraiGroup.rotation.y = Math.PI;

    if (ct < 3.8) {
      camera.position.set(Math.sin(ct * 0.5) * 4, 5.5 - ct * 0.6, 26 - ct * 3.2);
      camera.lookAt(0, 3, -10);
      dragonGroup.position.set(0, 28, -45);
    } else if (ct < 7.5) {
      const localT = ct - 3.8;
      camera.position.set(Math.sin(localT * 1.1) * 4.2, 1.85, 12 + Math.cos(localT * 1.1) * 4.2);
      camera.lookAt(0, 1.85, 12);
      swordPivot.rotation.x = -0.7 + Math.sin(localT * 3) * 0.35;
    } else if (ct < 11.5) {
      const localT = ct - 7.5;
      dragonGroup.position.set(0, 24 - localT * 3.6, -12);
      dragonGroup.lookAt(0, 1.5, 12);
      camera.position.set(6, 3.8, 5);
      camera.lookAt(dragonGroup.position);
    } else if (ct < 15.0) {
      dragonGroup.position.set(Math.sin(ct) * 4, 8.2, -10);
      dragonGroup.lookAt(samuraiGroup.position);
      camera.position.set(-7, 3.2, 18);
      camera.lookAt(0, 4.5, -2);
    } else {
      openTitleOverlay();
    }

    composer.render();
    return;
  }

  // --------------------------------------------------------------------------
  // MODE B: 4.2-SECOND MID-BATTLE PHASE 2 ABYSSAL TRANSFORMATION CUTSCENE
  // --------------------------------------------------------------------------
  if (state.mode === 'PHASE2_CUTSCENE') {
    state.phase2CutsceneTime += rawDt;
    const pt = state.phase2CutsceneTime;
    dragonGroup.position.set(0, 13.5 + Math.sin(t * 7) * 1.3, -8);
    dragonGroup.lookAt(samuraiGroup.position);

    if (Math.random() < 0.18) {
      spawnShockwave(dragonGroup.position, 0xff0044, 16);
    }

    camera.position.set(
      Math.sin(pt * 1.65) * 13,
      4.6,
      Math.cos(pt * 1.65) * 13
    );
    camera.lookAt(dragonGroup.position);

    if (pt >= 4.2) {
      state.mode = 'COMBAT';
      document.body.classList.add('combat-mode');
      spawnShockwave(new THREE.Vector3(0, 0, -8), 0xff0044, 24);
      updateFeed('ABYSSAL NIGHTMARE AWAKENED — 1.5x HP!');
    }
    composer.render();
    return;
  }

  // --------------------------------------------------------------------------
  // MODE C: 5.5-SECOND KILL OR DEATH FINALE CUTSCENE
  // --------------------------------------------------------------------------
  if (state.mode === 'FINALE_CUTSCENE') {
    state.finaleTime += rawDt;
    const ft = state.finaleTime;

    document.getElementById('cutscene-timeline-fill').style.width = `${Math.min(100, (ft / 5.5) * 100)}%`;
    document.getElementById('cutscene-timer').textContent = `${ft.toFixed(1)}s / 5.5s`;

    if (state.finaleVictory) {
      if (ft < 3.2) {
        dragonGroup.position.x = state.boss.pos.x + Math.sin(ft * 28) * 0.65;
        dragonGroup.position.y = state.boss.pos.y + Math.cos(ft * 20) * 0.45 - ft * 1.2;
        dragonGroup.rotation.z = Math.sin(ft * 12) * 0.35;

        const dissolvedCount = Math.floor((ft / 3.0) * SPINE_COUNT);
        for (let i = SPINE_COUNT - 1; i >= SPINE_COUNT - dissolvedCount; i--) {
          if (dragonSpine[i] && dragonSpine[i].visible) {
            dragonSpine[i].visible = false;
            const segWorld = new THREE.Vector3();
            dragonSpine[i].getWorldPosition(segWorld);
            spawnShockwave(segWorld, 0xffbe3b, 6);
            sfx.slash(0.7 + (i / SPINE_COUNT) * 0.6);
          }
        }

        camera.position.set(
          state.boss.pos.x + Math.sin(ft * 1.2) * 14,
          state.boss.pos.y - 2.5,
          state.boss.pos.z + Math.cos(ft * 1.2) * 14
        );
        camera.lookAt(dragonGroup.position);
      } else {
        if (dragonHead.visible) {
          dragonHead.visible = false;
          leftWingData.wingRoot.visible = false;
          rightWingData.wingRoot.visible = false;
          dragonGroup.visible = false;
          triggerScreenFlash(0.95);
          sfx.parryClang();
          sfx.taikoDrum();
          spawnShockwave(dragonGroup.position, 0xffe66d, 28);
          triggerDragonEmberExplosion(dragonGroup.position);
          document.getElementById('subtitle-en').textContent =
            `${HERO_ROSTER[currentHero].name} stands victorious as the Cursed Sanctum clears.`;
        }

        const restProgress = Math.min(1, (ft - 3.2) / 1.8);
        swordPivot.position.lerp(new THREE.Vector3(0.58, 1.82, 0.05), rawDt * 5);
        swordPivot.rotation.x = THREE.MathUtils.lerp(-1.2, 0.85, restProgress);
        swordPivot.rotation.z = THREE.MathUtils.lerp(0.6, -0.25, restProgress);

        const camAng = (ft - 3.2) * 0.85;
        camera.position.set(
          samuraiGroup.position.x + Math.sin(camAng) * 4.2,
          1.85,
          samuraiGroup.position.z - Math.cos(camAng) * 4.2
        );
        camera.lookAt(samuraiGroup.position.x, 1.65, samuraiGroup.position.z);
      }
    } else {
      const fallProgress = Math.min(1, ft / 2.2);
      samuraiGroup.position.y = THREE.MathUtils.lerp(0, -0.58, fallProgress);
      samuraiGroup.rotation.x = THREE.MathUtils.lerp(0, 0.28, fallProgress);
      tojiHeadGroup.rotation.x = THREE.MathUtils.lerp(0, 0.45, fallProgress);

      swordPivot.position.lerp(new THREE.Vector3(0.45, 1.35, -0.55), rawDt * 6);
      swordPivot.rotation.x = THREE.MathUtils.lerp(swordPivot.rotation.x, -Math.PI * 0.48, rawDt * 6);

      dragonGroup.position.set(
        Math.sin(ft * 1.1) * 8,
        9.5 + Math.sin(ft * 3) * 1.2,
        samuraiGroup.position.z - 9
      );
      dragonGroup.lookAt(samuraiGroup.position);

      camera.position.set(
        samuraiGroup.position.x + Math.sin(ft * 0.65) * 5.2,
        1.4 + ft * 0.25,
        samuraiGroup.position.z + Math.cos(ft * 0.65) * 5.2
      );
      camera.lookAt(samuraiGroup.position.x, 1.4, samuraiGroup.position.z - 1.5);
    }

    if (ft >= 5.5) {
      showEndCardOverlay(state.finaleVictory);
    }

    composer.render();
    return;
  }

  // --------------------------------------------------------------------------
  // MODE D: ACTIVE COMBAT LOOP
  // --------------------------------------------------------------------------
  if (state.mode === 'COMBAT') {
    const preset = DIFFICULTY_MODES[currentDifficulty];

    state.player.mana = Math.min(100, state.player.mana + preset.manaRegen * dt);
    if (state.player.dashTimer > 0) state.player.dashTimer -= dt;
    if (state.player.dashCooldown > 0) state.player.dashCooldown -= dt;
    if (state.player.invulnTimer > 0) state.player.invulnTimer -= dt;
    if (state.player.attackTimer > 0) state.player.attackTimer -= dt;
    if (state.player.parryTimer > 0) state.player.parryTimer -= dt;
    if (state.comboTimer > 0) {
      state.comboTimer -= dt;
      if (state.comboTimer <= 0) state.combo = 1;
    }

    for (let i = 0; i < 4; i++) {
      state.player.cooldowns[i] = Math.max(0, state.player.cooldowns[i] - dt);
      const cdEl = document.getElementById(`cd-${i + 1}`);
      if (state.player.cooldowns[i] > 0) {
        cdEl.style.height = '100%';
        cdEl.textContent = state.player.cooldowns[i].toFixed(1);
      } else {
        cdEl.style.height = '0%';
        cdEl.textContent = '';
      }
    }

    // Player Camera-Relative Movement
    const moveInput = new THREE.Vector3();
    if (keys['w']) moveInput.z -= 1;
    if (keys['s']) moveInput.z += 1;
    if (keys['a']) moveInput.x -= 1;
    if (keys['d']) moveInput.x += 1;

    if (moveInput.lengthSq() > 0) {
      moveInput.normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), state.yaw);
      const speed = state.player.dashTimer > 0 ? 29 : 12.2;
      state.player.moveSpeed = speed;
      state.player.pos.addScaledVector(moveInput, speed * dt);
      state.player.yaw = Math.atan2(moveInput.x, moveInput.z);
    } else {
      state.player.moveSpeed = THREE.MathUtils.lerp(state.player.moveSpeed, 0, dt * 8);
    }

    if (state.player.pos.length() > ARENA_RADIUS - 2.2) {
      state.player.pos.setLength(ARENA_RADIUS - 2.2);
    }

    samuraiGroup.position.copy(state.player.pos);
    samuraiGroup.rotation.y = state.yaw;
    jadeShieldMesh.rotation.y += dt * 2.5;

    // Dragon Boss AI
    state.boss.orbitAngle += dt * (state.phase === 2 ? 1.15 : 0.62);
    state.boss.stateTimer -= dt;

    const telegraphBanner = document.getElementById('boss-telegraph-banner');
    if (state.boss.state === 'ORBIT') {
      breathBeamMesh.visible = false;
      telegraphBanner.classList.add('hidden');
      const targetX = Math.cos(state.boss.orbitAngle) * 14.5;
      const targetZ = Math.sin(state.boss.orbitAngle) * 12.5 - 4;
      const targetY = 7.2 + Math.sin(t * 2.5) * 1.5;
      state.boss.pos.lerp(new THREE.Vector3(targetX, targetY, targetZ), dt * 3.2);
      dragonGroup.position.copy(state.boss.pos);
      dragonGroup.lookAt(state.player.pos.x, state.player.pos.y + 1.2, state.player.pos.z);

      if (state.boss.stateTimer <= 0) {
        state.boss.state = 'TELEGRAPH';
        state.boss.stateTimer = state.phase === 2 ? 0.78 : 0.95;
        const roll = Math.random();
        if (state.phase === 2 && roll < 0.42) {
          state.boss.attackType = 'BREATH_SWEEP';
        } else if (roll < 0.72) {
          state.boss.attackType = 'FIREBALL';
        } else {
          state.boss.attackType = 'LUNGE';
        }
        state.boss.lungeTarget.copy(state.player.pos);
        telegraphBanner.classList.remove('hidden');
        sfx.roar();
      }
    } else if (state.boss.state === 'TELEGRAPH') {
      dragonGroup.position.copy(state.boss.pos);
      dragonGroup.lookAt(state.player.pos.x, state.player.pos.y + 1.2, state.player.pos.z);

      if (state.boss.stateTimer <= 0) {
        telegraphBanner.classList.add('hidden');
        if (state.boss.attackType === 'FIREBALL') {
          const count = state.phase === 2 ? 5 : 1;
          for (let i = 0; i < count; i++) {
            const orb = new THREE.Mesh(
              new THREE.SphereGeometry(0.85, 16, 16),
              new THREE.MeshBasicMaterial({ color: state.phase === 2 ? 0xff0044 : 0xff6b2b })
            );
            orb.position.copy(state.boss.pos);
            const dir = state.player.pos
              .clone()
              .add(new THREE.Vector3((i - Math.floor(count / 2)) * 2.4, 1.2, 0))
              .sub(orb.position)
              .normalize();
            scene.add(orb);
            projectiles.push({
              mesh: orb,
              vel: dir.multiplyScalar(state.phase === 2 ? 31 : 22),
              fromPlayer: false,
              dmg: 24,
              life: 4.5
            });
          }
          if (state.phase === 2) {
            spawnMeteorStrike(state.player.pos.clone());
            spawnMeteorStrike(state.player.pos.clone());
          }
          state.boss.state = 'ORBIT';
          state.boss.stateTimer =
            preset.bossAttackInterval * (state.phase === 2 ? 0.78 : 1.0);
        } else if (state.boss.attackType === 'BREATH_SWEEP') {
          state.boss.state = 'BREATH_SWEEP';
          state.boss.stateTimer = 2.2;
          state.boss.sweepAngle = -0.7;
          breathBeamMesh.visible = true;
          sfx.thunder();
        } else {
          state.boss.state = 'LUNGE';
          state.boss.stateTimer = 0.65;
        }
      }
    } else if (state.boss.state === 'BREATH_SWEEP') {
      state.boss.sweepAngle += dt * 0.72;
      dragonGroup.position.copy(state.boss.pos);
      const sweepTarget = state.player.pos
        .clone()
        .add(new THREE.Vector3(Math.sin(state.boss.sweepAngle) * 12, 0.5, 0));
      dragonGroup.lookAt(sweepTarget);

      if (Math.random() < 0.14) {
        spawnShockwave(sweepTarget, 0xff0044, 4.5);
      }
      if (state.player.pos.distanceTo(sweepTarget) < 3.5) {
        damagePlayer(24);
      }
      if (state.boss.stateTimer <= 0) {
        breathBeamMesh.visible = false;
        state.boss.state = 'ORBIT';
        state.boss.stateTimer = preset.bossAttackInterval * 0.8;
      }
    } else if (state.boss.state === 'LUNGE') {
      state.boss.pos.lerp(state.boss.lungeTarget, dt * (state.phase === 2 ? 9.2 : 7.5));
      dragonGroup.position.copy(state.boss.pos);
      dragonGroup.lookAt(state.player.pos.x, state.player.pos.y + 1.2, state.player.pos.z);

      if (state.boss.pos.distanceTo(state.player.pos) < 4.0) {
        damagePlayer(34);
      }
      if (state.boss.stateTimer <= 0) {
        spawnShockwave(state.boss.pos, 0xff0044, 10);
        state.boss.state = 'ORBIT';
        state.boss.stateTimer =
          preset.bossAttackInterval * (state.phase === 2 ? 0.78 : 1.0);
      }
    }

    // Update Projectiles & Parry Reflection
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i];
      p.life -= dt;
      p.mesh.position.addScaledVector(p.vel, dt);

      if (p.isMeteor && p.mesh.position.y <= 0.4) {
        spawnShockwave(p.mesh.position, 0xff0044, 7.5);
        if (p.mesh.position.distanceTo(state.player.pos) < 3.6) {
          damagePlayer(p.dmg);
        }
        scene.remove(p.mesh);
        projectiles.splice(i, 1);
        continue;
      }

      if (p.fromPlayer) {
        if (p.mesh.position.distanceTo(state.boss.pos) < 4.6) {
          damageBoss(p.dmg, `${HERO_ROSTER[currentHero].spells[0].name.toUpperCase()} HIT!`);
          spawnShockwave(p.mesh.position, HERO_ROSTER[currentHero].comboColors[0], 7);
          scene.remove(p.mesh);
          projectiles.splice(i, 1);
          continue;
        }
      } else {
        const distPlayer = p.mesh.position.distanceTo(
          state.player.pos.clone().add(new THREE.Vector3(0, 1.2, 0))
        );
        if (distPlayer < 2.8 && state.player.parryTimer > 0 && !p.isMeteor) {
          p.fromPlayer = true;
          p.dmg = 125;
          p.mesh.material.color.setHex(0x00f5d4);
          p.vel.copy(
            state.boss.pos.clone().sub(p.mesh.position).normalize().multiplyScalar(40)
          );
          sfx.parryClang();
          state.hitStop = 0.06;
          addScore(250, 'PERFECT DEFLECT!');
          continue;
        } else if (distPlayer < 1.5) {
          damagePlayer(p.dmg);
          scene.remove(p.mesh);
          projectiles.splice(i, 1);
          continue;
        }
      }

      if (p.life <= 0) {
        scene.remove(p.mesh);
        projectiles.splice(i, 1);
      }
    }

    // Over-the-Shoulder Mouse Camera + Reticle Lock Detection
    const camOffset = new THREE.Vector3(1.35, 2.6, 5.8);
    camOffset.applyAxisAngle(new THREE.Vector3(1, 0, 0), state.pitch * 0.5);
    camOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), state.yaw);

    if (state.cameraShake > 0) {
      state.cameraShake = Math.max(0, state.cameraShake - dt * 2.2);
      camOffset.x += (Math.random() - 0.5) * state.cameraShake;
      camOffset.y += (Math.random() - 0.5) * state.cameraShake;
    }

    camera.position.lerp(state.player.pos.clone().add(camOffset), 0.22);
    const lookTarget = state.player.pos
      .clone()
      .add(new THREE.Vector3(0, 1.8, 0))
      .add(getAimDirection().multiplyScalar(20));
    camera.lookAt(lookTarget);

    const toBoss = state.boss.pos.clone().sub(camera.position).normalize();
    const aimDot = toBoss.dot(getAimDirection());
    state.lockedOnBoss = aimDot > 0.92;
    document.getElementById('reticle').classList.toggle('locked', state.lockedOnBoss);

    // Sync HUD
    document.getElementById('boss-hp-fill').style.width = `${(state.boss.hp / state.boss.maxHp) * 100}%`;
    document.getElementById('boss-hp-Ghost').style.width = `${(state.boss.hp / state.boss.maxHp) * 100}%`;
    document.getElementById('boss-hp-text').textContent = `${Math.ceil(state.boss.hp)} / ${state.boss.maxHp}`;

    document.getElementById('player-hp-fill').style.width = `${(state.player.hp / state.player.maxHp) * 100}%`;
    document.getElementById('player-hp-text').textContent = `${Math.ceil(state.player.hp)}/${state.player.maxHp}`;
    document.getElementById('player-mana-fill').style.width = `${state.player.mana}%`;
    document.getElementById('player-mana-text').textContent = `${Math.floor(state.player.mana)}/100`;

    document.getElementById('score-value').textContent = String(state.score).padStart(5, '0');
    document.getElementById('combo-badge').textContent = `COMBO x${state.combo}`;
  }

  composer.render();
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

startStoryCutscene();
requestAnimationFrame(animate);
// ============================================================================
// 13. TITLE MENU VISUAL FX, 3D PARALLAX TILT & UI SOUND EFFECTS
// ============================================================================
(function initMenuEnhancements() {
  // 1. Add UI Sound Methods to our CinematicAudioEngine (sfx)
  sfx.uiHover = function () {
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(680, now);
    osc.frequency.exponentialRampToValueAtTime(920, now + 0.045);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.055, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.05);

    osc.connect(gain).connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.055);
  };

  sfx.uiSelectHero = function (heroKey) {
    this.init();
    const now = this.ctx.currentTime;
    // Distinct harmonic chords for Toji (Dark Purple), Goku (Heroic Gold), Gojo (Limitless Cyan)
    const chords = {
      TOJI: [220, 330, 440],
      GOKU: [330, 440, 659.25],
      GOJO: [293.66, 440, 587.33]
    }[heroKey] || [330, 440, 550];

    chords.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.035);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.03, now + 0.38);

      gain.gain.setValueAtTime(0.001, now + i * 0.035);
      gain.gain.linearRampToValueAtTime(0.09, now + i * 0.035 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.42);

      osc.connect(gain).connect(this.ctx.destination);
      osc.start(now + i * 0.035);
      osc.stop(now + 0.44);
    });
  };

  sfx.uiSelectDifficulty = function (mode) {
    this.init();
    const now = this.ctx.currentTime;
    const baseFreq =
      mode === 'HARDCORE' ? 110 : mode === 'HARD' ? 155 : mode === 'MEDIUM' ? 196 : 240;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq * 1.6, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq, now + 0.22);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.16, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    osc.connect(gain).connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  };

  // 2. Dynamic Menu Aura Color Sync when Switching Heroes
  const HERO_MENU_THEMES = {
    TOJI: { accent: '#c77dff', glow: 'rgba(155, 93, 229, 0.5)', particle: '#c77dff' },
    GOKU: { accent: '#ffbe0b', glow: 'rgba(255, 190, 11, 0.55)', particle: '#ffbe0b' },
    GOJO: { accent: '#00f5d4', glow: 'rgba(0, 245, 212, 0.5)', particle: '#00f5d4' }
  };

  let activeMenuParticleColor = '#ffbe0b';

  function updateMenuThemeForHero(heroKey) {
    const theme = HERO_MENU_THEMES[heroKey] || HERO_MENU_THEMES.TOJI;
    document.documentElement.style.setProperty('--menu-accent', theme.accent);
    document.documentElement.style.setProperty('--menu-glow', theme.glow);
    activeMenuParticleColor = theme.particle;
  }

  // Set initial theme
  updateMenuThemeForHero(currentHero);

  // Attach Hover & Click Sounds to all Menu Cards and Buttons
  document.querySelectorAll('.diff-card, .cta-btn, .secondary-btn, .ui-btn').forEach((el) => {
    el.addEventListener('mouseenter', () => sfx.uiHover());
  });

  document.querySelectorAll('.hero-card').forEach((card) => {
    card.addEventListener('click', () => {
      const heroKey = card.dataset.hero;
      sfx.uiSelectHero(heroKey);
      updateMenuThemeForHero(heroKey);
      spawnMenuBurst(window.innerWidth / 2, window.innerHeight / 2, HERO_MENU_THEMES[heroKey].particle);
    });
  });

  document.querySelectorAll('.diff-card:not(.hero-card)').forEach((card) => {
    card.addEventListener('click', () => {
      sfx.uiSelectDifficulty(card.dataset.mode);
    });
  });

  // 3. Interactive 3D Mouse Parallax Tilt on the Title Card
  const titleOverlay = document.getElementById('title-overlay');
  const titleCard = document.querySelector('.title-card');

  window.addEventListener('mousemove', (e) => {
    if (!titleOverlay || titleOverlay.classList.contains('hidden') || !titleCard) return;
    const nx = (e.clientX / window.innerWidth - 0.5) * 2;
    const ny = (e.clientY / window.innerHeight - 0.5) * 2;
    titleCard.style.transform = `rotateY(${nx * 5.5}deg) rotateX(${-ny * 5.5}deg)`;
  });

  // 4. 2D Floating Ember & Aura Spark Canvas Behind the Title Card
  const fxCanvas = document.createElement('canvas');
  fxCanvas.id = 'menu-fx-canvas';
  if (titleOverlay) {
    titleOverlay.insertBefore(fxCanvas, titleOverlay.firstChild);
  }
  const fxCtx = fxCanvas.getContext('2d');

  function resizeFxCanvas() {
    fxCanvas.width = window.innerWidth;
    fxCanvas.height = window.innerHeight;
  }
  resizeFxCanvas();
  window.addEventListener('resize', resizeFxCanvas);

  const menuSparks = Array.from({ length: 75 }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    vx: (Math.random() - 0.5) * 0.8,
    vy: -0.6 - Math.random() * 1.6,
    r: 1.2 + Math.random() * 2.8,
    alpha: 0.25 + Math.random() * 0.7
  }));

  function spawnMenuBurst(cx, cy, color) {
    for (let i = 0; i < 24; i++) {
      const ang = (i / 24) * Math.PI * 2;
      const spd = 2 + Math.random() * 5;
      menuSparks.push({
        x: cx,
        y: cy,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        r: 2 + Math.random() * 2.5,
        alpha: 1,
        burstColor: color,
        isBurst: true
      });
    }
  }

  function renderMenuParticles() {
    requestAnimationFrame(renderMenuParticles);
    if (!titleOverlay || titleOverlay.classList.contains('hidden')) return;

    fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);

    for (let i = menuSparks.length - 1; i >= 0; i--) {
      const p = menuSparks[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.isBurst) {
        p.alpha -= 0.025;
        if (p.alpha <= 0) {
          menuSparks.splice(i, 1);
          continue;
        }
      } else {
        if (p.y < -10) {
          p.y = fxCanvas.height + 10;
          p.x = Math.random() * fxCanvas.width;
        }
      }

      fxCtx.save();
      fxCtx.globalAlpha = Math.max(0, p.alpha);
      fxCtx.fillStyle = p.burstColor || activeMenuParticleColor;
      fxCtx.shadowColor = p.burstColor || activeMenuParticleColor;
      fxCtx.shadowBlur = 12;
      fxCtx.beginPath();
      fxCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      fxCtx.fill();
      fxCtx.restore();
    }
  }
  renderMenuParticles();
})();