'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

const SAVE_KEY = 'next_neon_platformer_save_v1';

const defaultSettings = {
  musicVolume: 0.25,
  sfxVolume: 0.8,
  quality: 'high',
  neonIntensity: 1.2,
  showFPS: false,
  vibration: true,
  screenShake: true,
};

const defaultSave = {
  highScore: 0,
  unlockedLevel: 1,
  ranking: [],
  settings: defaultSettings,
};

const QUALITY_CONFIG = {
  low: { pixelRatio: 1, particles: 0.5, bloomStrength: 0.85 },
  medium: { pixelRatio: 1.4, particles: 0.8, bloomStrength: 1.1 },
  high: { pixelRatio: 1.8, particles: 1, bloomStrength: 1.35 },
};

const UPGRADES = [
  { id: 'move', name: 'Turbo Dash', desc: '+12% velocidade de movimento', apply: (s) => (s.moveSpeed *= 1.12) },
  { id: 'jump', name: 'Quantum Jump', desc: '+10% força do pulo', apply: (s) => (s.jumpPower *= 1.1) },
  { id: 'life', name: 'Nano Repair', desc: '+1 vida instantânea', apply: (s) => (s.maxLives += 1, s.lives += 1) },
  { id: 'score', name: 'Data Cache', desc: '+150 score instantâneo', apply: (s) => (s.score += 150) },
  { id: 'magnet', name: 'Magnet Core', desc: '+40% raio de coleta', apply: (s) => (s.collectRadius *= 1.4) },
  { id: 'stomp', name: 'Shock Boots', desc: '+25% força no stomp', apply: (s) => (s.stompForce *= 1.25) },
];

const LEVELS = [
  {
    width: 2600,
    height: 1100,
    spawn: { x: 90, y: 660 },
    portal: { x: 2440, y: 560, w: 72, h: 116 },
    platforms: [
      { x: 0, y: 900, w: 650, h: 60 },
      { x: 720, y: 830, w: 180, h: 30 },
      { x: 980, y: 760, w: 180, h: 30 },
      { x: 1220, y: 680, w: 200, h: 30 },
      { x: 1480, y: 740, w: 220, h: 30 },
      { x: 1770, y: 660, w: 180, h: 30 },
      { x: 2030, y: 610, w: 180, h: 30 },
      { x: 2250, y: 560, w: 210, h: 30 },
      { x: 2360, y: 900, w: 280, h: 60 },
    ],
    hazards: [
      { x: 668, y: 888, w: 44, h: 12 },
      { x: 938, y: 888, w: 44, h: 12 },
      { x: 1430, y: 888, w: 44, h: 12 },
      { x: 1960, y: 888, w: 44, h: 12 },
    ],
    coins: [
      { x: 780, y: 780 }, { x: 1060, y: 710 }, { x: 1320, y: 630 }, { x: 1570, y: 690 },
      { x: 1820, y: 610 }, { x: 2090, y: 560 }, { x: 2330, y: 510 }
    ],
    enemies: [
      { type: 'patrol', x: 1540, y: 704, minX: 1490, maxX: 1650 },
      { type: 'hover', x: 2100, y: 552, minX: 2040, maxX: 2180, baseY: 552 },
    ],
  },
  {
    width: 3000,
    height: 1280,
    spawn: { x: 100, y: 760 },
    portal: { x: 2825, y: 400, w: 78, h: 120 },
    platforms: [
      { x: 0, y: 980, w: 460, h: 70 },
      { x: 540, y: 880, w: 180, h: 30 },
      { x: 780, y: 790, w: 180, h: 30 },
      { x: 1050, y: 700, w: 200, h: 30 },
      { x: 1320, y: 810, w: 220, h: 30 },
      { x: 1600, y: 720, w: 180, h: 30 },
      { x: 1860, y: 620, w: 200, h: 30 },
      { x: 2110, y: 520, w: 220, h: 30 },
      { x: 2380, y: 460, w: 180, h: 30 },
      { x: 2610, y: 410, w: 210, h: 30 },
      { x: 2800, y: 980, w: 260, h: 70 },
    ],
    hazards: [
      { x: 485, y: 968, w: 44, h: 12 },
      { x: 742, y: 968, w: 44, h: 12 },
      { x: 1015, y: 968, w: 44, h: 12 },
      { x: 1552, y: 968, w: 44, h: 12 },
      { x: 2070, y: 968, w: 44, h: 12 },
      { x: 2550, y: 968, w: 44, h: 12 },
    ],
    coins: [
      { x: 620, y: 820 }, { x: 860, y: 730 }, { x: 1140, y: 640 }, { x: 1420, y: 750 },
      { x: 1680, y: 660 }, { x: 1960, y: 560 }, { x: 2210, y: 460 }, { x: 2450, y: 400 }, { x: 2710, y: 350 }
    ],
    enemies: [
      { type: 'patrol', x: 1390, y: 774, minX: 1350, maxX: 1490 },
      { type: 'hover', x: 1900, y: 570, minX: 1890, maxX: 2010, baseY: 570 },
      { type: 'tank', x: 2450, y: 414, minX: 2400, maxX: 2520 },
    ],
  },
  {
    width: 3400,
    height: 1420,
    spawn: { x: 90, y: 900 },
    portal: { x: 3200, y: 300, w: 84, h: 130 },
    platforms: [
      { x: 0, y: 1080, w: 420, h: 70 },
      { x: 500, y: 980, w: 170, h: 30 },
      { x: 760, y: 900, w: 170, h: 30 },
      { x: 1010, y: 820, w: 170, h: 30 },
      { x: 1260, y: 730, w: 180, h: 30 },
      { x: 1520, y: 650, w: 180, h: 30 },
      { x: 1770, y: 560, w: 190, h: 30 },
      { x: 2030, y: 470, w: 190, h: 30 },
      { x: 2290, y: 560, w: 210, h: 30 },
      { x: 2570, y: 470, w: 180, h: 30 },
      { x: 2830, y: 390, w: 180, h: 30 },
      { x: 3080, y: 320, w: 180, h: 30 },
      { x: 3190, y: 1080, w: 260, h: 70 },
    ],
    hazards: [
      { x: 450, y: 1068, w: 44, h: 12 }, { x: 712, y: 1068, w: 44, h: 12 }, { x: 970, y: 1068, w: 44, h: 12 },
      { x: 1210, y: 1068, w: 44, h: 12 }, { x: 1470, y: 1068, w: 44, h: 12 }, { x: 1980, y: 1068, w: 44, h: 12 },
      { x: 2520, y: 1068, w: 44, h: 12 }, { x: 3040, y: 1068, w: 44, h: 12 },
    ],
    coins: [
      { x: 580, y: 920 }, { x: 840, y: 840 }, { x: 1090, y: 760 }, { x: 1350, y: 670 }, { x: 1600, y: 590 },
      { x: 1860, y: 500 }, { x: 2120, y: 410 }, { x: 2400, y: 500 }, { x: 2660, y: 410 }, { x: 2920, y: 330 }, { x: 3160, y: 260 }
    ],
    enemies: [
      { type: 'patrol', x: 1320, y: 694, minX: 1280, maxX: 1400 },
      { type: 'hover', x: 1830, y: 510, minX: 1780, maxX: 1910, baseY: 510 },
      { type: 'tank', x: 2350, y: 524, minX: 2310, maxX: 2450 },
      { type: 'hover', x: 2890, y: 350, minX: 2850, maxX: 2980, baseY: 350 },
    ],
  },
];

function readStorage() {
  if (typeof window === 'undefined') return defaultSave;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultSave;
    const parsed = JSON.parse(raw);
    return {
      ...defaultSave,
      ...parsed,
      settings: { ...defaultSettings, ...(parsed.settings || {}) },
      ranking: Array.isArray(parsed.ranking) ? parsed.ranking : [],
    };
  } catch {
    return defaultSave;
  }
}

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function rand(min, max) { return min + Math.random() * (max - min); }
function rectsOverlap(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }

function makeLevel(levelIndex) {
  const base = structuredClone(LEVELS[levelIndex]);
  base.coins = base.coins.map((c, i) => ({ ...c, id: `coin-${levelIndex}-${i}`, r: 12, collected: false }));
  base.enemies = base.enemies.map((e, i) => {
    const specs = {
      patrol: { w: 46, h: 46, speed: 90, hp: 1, score: 90, color: 0xff71cf },
      hover: { w: 46, h: 46, speed: 110, hp: 1, score: 110, color: 0x8f83ff },
      tank: { w: 56, h: 56, speed: 75, hp: 2, score: 170, color: 0xff9365 },
    }[e.type];
    return { ...e, ...specs, id: `enemy-${levelIndex}-${i}`, vx: specs.speed, dead: false, hitCooldown: 0 };
  });
  return base;
}

function pickUpgradeOptions() {
  const shuffled = [...UPGRADES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

function makeBeepSystem(volumeRef) {
  let ctx = null;
  const ensure = () => {
    if (ctx || typeof window === 'undefined') return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    return ctx;
  };
  const play = (freq = 440, duration = 0.08, type = 'sine', gainValue = 0.03) => {
    const audio = ensure();
    if (!audio) return;
    if (audio.state === 'suspended') audio.resume();
    const gain = audio.createGain();
    const osc = audio.createOscillator();
    const now = audio.currentTime;
    const volume = clamp(volumeRef.current.sfxVolume ?? 0.8, 0, 1);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(Math.max(0.0001, gainValue * volume), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(now);
    osc.stop(now + duration);
  };
  return { play };
}

function useIsTouch() {
  const [touch, setTouch] = useState(false);
  useEffect(() => {
    const update = () => setTouch(window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 900);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return touch;
}

export default function Page() {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const settingsRef = useRef(defaultSettings);
  const saveRef = useRef(defaultSave);
  const isTouch = useIsTouch();

  const [screen, setScreen] = useState('menu');
  const [hud, setHud] = useState({
    level: 1,
    lives: 3,
    maxLives: 3,
    coins: 0,
    score: 0,
    best: 0,
    fps: 60,
    buffs: [],
    levelCoins: 0,
  });
  const [saveData, setSaveData] = useState(defaultSave);
  const [settings, setSettings] = useState(defaultSettings);
  const [upgradeOptions, setUpgradeOptions] = useState([]);

  useEffect(() => {
    const stored = readStorage();
    saveRef.current = stored;
    settingsRef.current = stored.settings;
    setSaveData(stored);
    setSettings(stored.settings);
    setHud((h) => ({ ...h, best: stored.highScore }));
  }, []);

  useEffect(() => {
    settingsRef.current = settings;
    const next = { ...saveRef.current, settings };
    saveRef.current = next;
    setSaveData(next);
    if (typeof window !== 'undefined') localStorage.setItem(SAVE_KEY, JSON.stringify(next));
    engineRef.current?.applySettings?.(settings);
  }, [settings]);

  useEffect(() => {
    saveRef.current = saveData;
    if (typeof window !== 'undefined') localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
  }, [saveData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-20, 20, 12, -12, 0.1, 200);
    camera.position.set(0, 0, 20);
    camera.lookAt(0, 0, 0);

    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.15, 0.8, 0.05);
    composer.addPass(bloomPass);

    const worldRoot = new THREE.Group();
    scene.add(worldRoot);

    const bgFar = new THREE.Group();
    const bgNear = new THREE.Group();
    const gameplay = new THREE.Group();
    const effects = new THREE.Group();
    bgFar.position.z = -10;
    bgNear.position.z = -5;
    gameplay.position.z = 0;
    effects.position.z = 1.5;
    worldRoot.add(bgFar, bgNear, gameplay, effects);

    const ambient = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambient);

    const qualityState = { ...QUALITY_CONFIG[settingsRef.current.quality] };
    const beep = makeBeepSystem(settingsRef);

    const engineState = {
      running: true,
      state: 'menu',
      levelIndex: 0,
      level: null,
      worldWidth: 100,
      worldHeight: 60,
      score: 0,
      totalCoins: 0,
      lives: 3,
      maxLives: 3,
      unlockedLevel: saveRef.current.unlockedLevel || 1,
      buffs: [],
      moveSpeed: 360,
      jumpPower: 660,
      collectRadius: 44,
      stompForce: 1,
      invincible: 0,
      player: null,
      keys: {},
      touch: { left: false, right: false, jumpQueued: false },
      cameraX: 0,
      cameraY: 0,
      particles: [],
      stars: [],
      lastHudUpdate: 0,
      fps: 60,
      shake: 0,
      upgradeOptions: [],
      nextUpgradeAt: 700,
    };

    const meshes = {
      platforms: [], hazards: [], coins: [], enemies: [], particles: [], stars: [], decor: []
    };

    const reusableGeometry = {
      plane: new THREE.PlaneGeometry(1, 1),
      coin: new THREE.CircleGeometry(0.24, 24),
      particle: new THREE.CircleGeometry(0.12, 10),
    };

    const makeGlowMat = (color, opacity = 1, additive = false) => new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      depthWrite: false,
    });

    const materials = {
      player: makeGlowMat(0x79ecff),
      playerCore: makeGlowMat(0xffffff),
      platform: makeGlowMat(0x17446a),
      platformLine: makeGlowMat(0x67daff, 0.42, true),
      coin: makeGlowMat(0xffea76, 0.95, true),
      hazard: makeGlowMat(0xff5c78, 0.95, true),
      portal: makeGlowMat(0x5bff9f, 0.72, true),
      particleWhite: makeGlowMat(0xffffff, 0.9, true),
      particleCyan: makeGlowMat(0x5ce7ff, 0.9, true),
      particleMagenta: makeGlowMat(0xff65ca, 0.8, true),
      bgStar: makeGlowMat(0xdff7ff, 0.8, true),
      bgHillFar: makeGlowMat(0x152d48, 0.8),
      bgHillNear: makeGlowMat(0x103350, 0.9),
      portalCore: makeGlowMat(0xffffff, 0.6, true),
    };

    function toSceneX(x) { return x / 40; }
    function toSceneY(y) { return -y / 40; }
    function toWorldX(x) { return x * 40; }
    function toWorldY(y) { return -y * 40; }

    function updateRendererSize() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const aspect = width / height;
      const viewHeight = 24;
      const viewWidth = viewHeight * aspect;
      camera.left = -viewWidth / 2;
      camera.right = viewWidth / 2;
      camera.top = viewHeight / 2;
      camera.bottom = -viewHeight / 2;
      camera.updateProjectionMatrix();
      const conf = QUALITY_CONFIG[settingsRef.current.quality] || QUALITY_CONFIG.high;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, conf.pixelRatio));
      renderer.setSize(width, height, false);
      composer.setSize(width, height);
      bloomPass.setSize(width, height);
      bloomPass.strength = conf.bloomStrength * settingsRef.current.neonIntensity;
      bloomPass.threshold = 0.04;
      bloomPass.radius = 0.5;
    }

    function clearGroup(group) {
      while (group.children.length) group.remove(group.children[0]);
    }

    function spawnStars() {
      clearGroup(bgFar);
      clearGroup(bgNear);
      meshes.stars = [];
      const count = Math.floor(100 * (QUALITY_CONFIG[settingsRef.current.quality]?.particles || 1));
      for (let i = 0; i < count; i++) {
        const star = new THREE.Mesh(reusableGeometry.particle, materials.bgStar.clone());
        star.scale.setScalar(rand(0.03, 0.1));
        star.position.set(rand(-60, 60), rand(-30, 30), 0);
        star.userData = { speed: rand(0.08, 0.25), alpha: rand(0.18, 0.8) };
        star.material.opacity = star.userData.alpha;
        bgFar.add(star);
        meshes.stars.push(star);
      }
      for (let i = 0; i < 5; i++) {
        const hill = new THREE.Mesh(reusableGeometry.plane, (i % 2 ? materials.bgHillNear : materials.bgHillFar).clone());
        hill.scale.set(25 + i * 5, 4 + i, 1);
        hill.position.set(i * 12 - 24, -8 + i * 1.2, 0);
        hill.material.opacity = 0.22 + i * 0.08;
        bgNear.add(hill);
      }
    }

    function platformMesh(plat) {
      const group = new THREE.Group();
      const base = new THREE.Mesh(reusableGeometry.plane, materials.platform.clone());
      base.scale.set(toSceneX(plat.w), toSceneX(plat.h), 1);
      base.position.set(toSceneX(plat.x + plat.w / 2), toSceneY(plat.y + plat.h / 2), 0);
      group.add(base);
      const line = new THREE.Mesh(reusableGeometry.plane, materials.platformLine.clone());
      line.scale.set(toSceneX(plat.w), 0.05, 1);
      line.position.set(base.position.x, base.position.y + toSceneX(plat.h) / 2 - 0.025, 0.02);
      group.add(line);
      return group;
    }

    function hazardMesh(h) {
      const group = new THREE.Group();
      const tri = new THREE.BufferGeometry();
      const verts = new Float32Array([
        -0.5, -0.5, 0,
         0.0,  0.5, 0,
         0.5, -0.5, 0,
      ]);
      tri.setAttribute('position', new THREE.BufferAttribute(verts, 3));
      tri.computeVertexNormals();
      const count = 3;
      for (let i = 0; i < count; i++) {
        const m = new THREE.Mesh(tri, materials.hazard.clone());
        const section = h.w / count;
        m.scale.set(toSceneX(section), toSceneX(h.h), 1);
        m.position.set(toSceneX(h.x + section * i + section / 2), toSceneY(h.y + h.h / 2), 0);
        group.add(m);
      }
      return group;
    }

    function coinMesh(c) {
      const outer = new THREE.Mesh(reusableGeometry.coin, materials.coin.clone());
      outer.position.set(toSceneX(c.x), toSceneY(c.y), 0);
      outer.scale.setScalar(0.42);
      const inner = new THREE.Mesh(reusableGeometry.coin, materials.portalCore.clone());
      inner.position.set(0, 0, 0.01);
      inner.scale.setScalar(0.45);
      outer.add(inner);
      return outer;
    }

    function enemyMesh(enemy) {
      const group = new THREE.Group();
      const colorMap = { patrol: 0xff71cf, hover: 0x8f83ff, tank: 0xff9365 };
      const body = new THREE.Mesh(reusableGeometry.plane, makeGlowMat(colorMap[enemy.type] || 0xffffff));
      body.scale.set(toSceneX(enemy.w), toSceneX(enemy.h), 1);
      body.position.set(toSceneX(enemy.x + enemy.w / 2), toSceneY(enemy.y + enemy.h / 2), 0);
      const eye = new THREE.Mesh(reusableGeometry.plane, materials.portalCore.clone());
      eye.scale.set(0.18, 0.08, 1);
      eye.position.set(0, 0.05, 0.02);
      body.add(eye);
      group.add(body);
      return group;
    }

    function portalMesh(portal) {
      const group = new THREE.Group();
      const outer = new THREE.Mesh(reusableGeometry.plane, materials.portal.clone());
      outer.scale.set(toSceneX(portal.w), toSceneX(portal.h), 1);
      outer.position.set(toSceneX(portal.x + portal.w / 2), toSceneY(portal.y + portal.h / 2), 0);
      group.add(outer);
      const core = new THREE.Mesh(reusableGeometry.plane, materials.portalCore.clone());
      core.scale.set(toSceneX(portal.w * 0.55), toSceneX(portal.h * 0.7), 1);
      core.position.set(outer.position.x, outer.position.y, 0.02);
      group.add(core);
      return group;
    }

    function playerMesh() {
      const group = new THREE.Group();
      const body = new THREE.Mesh(reusableGeometry.plane, materials.player.clone());
      body.scale.set(toSceneX(40), toSceneX(52), 1);
      const face = new THREE.Mesh(reusableGeometry.plane, materials.playerCore.clone());
      face.scale.set(0.18, 0.12, 1);
      face.position.set(0.08, 0.1, 0.02);
      body.add(face);
      group.add(body);
      return group;
    }

    function particleMesh(color = 0xffffff) {
      return new THREE.Mesh(reusableGeometry.particle, makeGlowMat(color, 0.9, true));
    }

    function setupLevel(levelIndex, resetProgress = false) {
      engineState.levelIndex = levelIndex;
      engineState.level = makeLevel(levelIndex);
      engineState.worldWidth = engineState.level.width;
      engineState.worldHeight = engineState.level.height;
      engineState.upgradeOptions = [];
      setUpgradeOptions([]);

      clearGroup(gameplay);
      clearGroup(effects);
      spawnStars();

      engineState.level.platforms = engineState.level.platforms.map((p) => ({ ...p }));
      engineState.level.hazards = engineState.level.hazards.map((h) => ({ ...h }));

      for (const plat of engineState.level.platforms) gameplay.add(platformMesh(plat));
      for (const h of engineState.level.hazards) gameplay.add(hazardMesh(h));

      engineState.level.coinMeshes = engineState.level.coins.map((c) => {
        const mesh = coinMesh(c);
        gameplay.add(mesh);
        return mesh;
      });

      engineState.level.enemyMeshes = engineState.level.enemies.map((enemy) => {
        const mesh = enemyMesh(enemy);
        gameplay.add(mesh);
        return mesh;
      });

      engineState.level.portalMesh = portalMesh(engineState.level.portal);
      gameplay.add(engineState.level.portalMesh);

      engineState.player = {
        x: engineState.level.spawn.x,
        y: engineState.level.spawn.y,
        w: 40,
        h: 52,
        vx: 0,
        vy: 0,
        dir: 1,
        onGround: false,
        coyote: 0,
        jumpBuffer: 0,
        mesh: playerMesh(),
      };
      gameplay.add(engineState.player.mesh);

      if (resetProgress) {
        engineState.score = 0;
        engineState.totalCoins = 0;
        engineState.lives = 3;
        engineState.maxLives = 3;
        engineState.moveSpeed = 360;
        engineState.jumpPower = 660;
        engineState.collectRadius = 44;
        engineState.stompForce = 1;
        engineState.buffs = [];
        engineState.nextUpgradeAt = 700;
      }

      updateHud(true);
    }

    function addParticle(x, y, color = 0xffffff, count = 10, spread = 60) {
      const factor = QUALITY_CONFIG[settingsRef.current.quality]?.particles || 1;
      const actual = Math.max(4, Math.floor(count * factor));
      for (let i = 0; i < actual; i++) {
        const mesh = particleMesh(color);
        mesh.position.set(toSceneX(x), toSceneY(y), 0);
        effects.add(mesh);
        engineState.particles.push({
          mesh,
          x,
          y,
          vx: rand(-spread, spread),
          vy: rand(-spread, spread),
          life: rand(0.25, 0.6),
          ttl: rand(0.25, 0.6),
          size: rand(0.08, 0.18),
        });
      }
    }

    function vibrate(ms = 25) {
      if (settingsRef.current.vibration && navigator?.vibrate) navigator.vibrate(ms);
    }

    function applySettings(nextSettings) {
      updateRendererSize();
      const conf = QUALITY_CONFIG[nextSettings.quality] || QUALITY_CONFIG.high;
      bloomPass.strength = conf.bloomStrength * nextSettings.neonIntensity;
    }

    function updateHud(force = false) {
      const now = performance.now();
      if (!force && now - engineState.lastHudUpdate < 80) return;
      engineState.lastHudUpdate = now;
      setHud({
        level: engineState.levelIndex + 1,
        lives: engineState.lives,
        maxLives: engineState.maxLives,
        coins: engineState.totalCoins,
        score: engineState.score,
        best: saveRef.current.highScore || 0,
        fps: engineState.fps,
        buffs: engineState.buffs,
        levelCoins: engineState.level?.coins?.filter((c) => !c.collected).length ?? 0,
      });
    }

    function saveRanking(status = 'gameover') {
      const entry = {
        score: engineState.score,
        coins: engineState.totalCoins,
        level: engineState.levelIndex + 1,
        status,
        date: new Date().toISOString(),
      };
      const ranking = [...(saveRef.current.ranking || []), entry]
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
      const highScore = Math.max(saveRef.current.highScore || 0, engineState.score);
      const unlockedLevel = Math.max(saveRef.current.unlockedLevel || 1, Math.min(LEVELS.length, engineState.levelIndex + 2));
      const nextSave = { ...saveRef.current, highScore, unlockedLevel, ranking };
      saveRef.current = nextSave;
      setSaveData(nextSave);
    }

    function goGameOver() {
      saveRanking('gameover');
      setScreen('gameOver');
      engineState.state = 'gameOver';
      updateHud(true);
    }

    function goVictory() {
      saveRanking('victory');
      setScreen('victory');
      engineState.state = 'victory';
      updateHud(true);
    }

    function loseLife() {
      if (engineState.invincible > 0 || engineState.state !== 'playing') return;
      engineState.lives -= 1;
      engineState.invincible = 1.1;
      engineState.shake = settingsRef.current.screenShake ? 0.24 : 0;
      beep.play(160, 0.1, 'sawtooth', 0.05);
      addParticle(engineState.player.x + engineState.player.w / 2, engineState.player.y + engineState.player.h / 2, 0xff5c78, 16, 120);
      vibrate(30);
      if (engineState.lives <= 0) {
        goGameOver();
      } else {
        engineState.player.x = engineState.level.spawn.x;
        engineState.player.y = engineState.level.spawn.y;
        engineState.player.vx = 0;
        engineState.player.vy = 0;
      }
      updateHud(true);
    }

    function nextLevel() {
      if (engineState.levelIndex < LEVELS.length - 1) {
        engineState.levelIndex += 1;
        setupLevel(engineState.levelIndex, false);
        beep.play(720, 0.09, 'triangle', 0.035);
      } else {
        goVictory();
      }
    }

    function showUpgradeMenu() {
      engineState.upgradeOptions = pickUpgradeOptions();
      engineState.nextUpgradeAt += 700;
      setUpgradeOptions(engineState.upgradeOptions);
      setScreen('upgrade');
      engineState.state = 'upgrade';
    }

    function applyUpgrade(id) {
      const upgrade = UPGRADES.find((u) => u.id === id);
      if (!upgrade) return;
      upgrade.apply(engineState);
      engineState.buffs = [...new Set([...engineState.buffs, upgrade.name])].slice(-5);
      setUpgradeOptions([]);
      setScreen('playing');
      engineState.state = 'playing';
      beep.play(980, 0.1, 'triangle', 0.04);
      updateHud(true);
    }

    function startGame(fromLevel = 0) {
      engineState.state = 'playing';
      setScreen('playing');
      setupLevel(Math.min(fromLevel, (saveRef.current.unlockedLevel || 1) - 1), true);
      updateHud(true);
    }

    function restartLevel() {
      if (engineState.levelIndex >= 0) {
        setScreen('playing');
        engineState.state = 'playing';
        setupLevel(engineState.levelIndex, false);
      }
    }

    function resetToMenu() {
      engineState.state = 'menu';
      setScreen('menu');
    }

    function togglePause(force) {
      if (engineState.state === 'playing' || force === 'pause') {
        engineState.state = 'paused';
        setScreen('paused');
      } else if (engineState.state === 'paused' || force === 'play') {
        engineState.state = 'playing';
        setScreen('playing');
      }
    }

    function syncMeshes(time) {
      if (!engineState.level || !engineState.player) return;
      const p = engineState.player;
      p.mesh.position.set(toSceneX(p.x + p.w / 2), toSceneY(p.y + p.h / 2), 0);
      p.mesh.rotation.z = THREE.MathUtils.lerp(p.mesh.rotation.z, p.vx * 0.01, 0.08);
      p.mesh.scale.y = 1 + Math.min(0.12, Math.abs(p.vy) / 2200);
      p.mesh.children[0].material.opacity = engineState.invincible > 0 && Math.floor(time * 0.03) % 2 === 0 ? 0.45 : 1;

      engineState.level.coins.forEach((coin, index) => {
        const mesh = engineState.level.coinMeshes[index];
        if (!mesh) return;
        mesh.visible = !coin.collected;
        if (!coin.collected) {
          mesh.position.y = toSceneY(coin.y + Math.sin(time * 0.003 + index) * 6);
          mesh.rotation.z += 0.02;
        }
      });

      engineState.level.enemies.forEach((enemy, index) => {
        const mesh = engineState.level.enemyMeshes[index];
        if (!mesh) return;
        mesh.visible = !enemy.dead;
        if (!enemy.dead) {
          const bob = enemy.type === 'hover' ? Math.sin(time * 0.004 + index) * 0.1 : 0;
          mesh.children[0].position.set(toSceneX(enemy.x + enemy.w / 2), toSceneY(enemy.y + enemy.h / 2) + bob, 0);
          mesh.rotation.z = THREE.MathUtils.lerp(mesh.rotation.z, enemy.vx * 0.004, 0.12);
        }
      });

      const portalActive = engineState.level.coins.every((c) => c.collected);
      const portal = engineState.level.portalMesh;
      if (portal) {
        const pulse = 1 + Math.sin(time * 0.005) * 0.08;
        portal.scale.setScalar(portalActive ? pulse : 0.85 + pulse * 0.08);
        portal.children[0].material.opacity = portalActive ? 0.88 : 0.35;
        portal.children[1].material.opacity = portalActive ? 0.7 : 0.18;
      }

      engineState.particles.forEach((part) => {
        part.mesh.position.set(toSceneX(part.x), toSceneY(part.y), 0);
        const alpha = Math.max(0, part.life / part.ttl);
        part.mesh.material.opacity = alpha;
        part.mesh.scale.setScalar(part.size * alpha * 1.6);
      });

      const targetX = toSceneX(p.x + p.w / 2) + clamp(p.vx / 120, -2.2, 2.2);
      const targetY = toSceneY(p.y + p.h / 2) + 0.5;
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 0.08);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.08);
      const viewW = camera.right - camera.left;
      const viewH = camera.top - camera.bottom;
      const minX = viewW / 2;
      const maxX = toSceneX(engineState.worldWidth) - viewW / 2;
      const minY = toSceneY(engineState.worldHeight) + viewH / 2;
      const maxY = -viewH / 2;
      camera.position.x = clamp(camera.position.x, minX, maxX);
      camera.position.y = clamp(camera.position.y, minY, maxY);
      if (engineState.shake > 0) {
        camera.position.x += rand(-engineState.shake, engineState.shake);
        camera.position.y += rand(-engineState.shake, engineState.shake);
      }

      bgFar.position.x = camera.position.x * 0.18;
      bgFar.position.y = camera.position.y * 0.08;
      bgNear.position.x = camera.position.x * 0.35;
      bgNear.position.y = camera.position.y * 0.2;
      meshes.stars.forEach((star, i) => {
        star.material.opacity = star.userData.alpha * (0.9 + Math.sin(time * 0.001 + i) * 0.1);
      });
    }

    function resolvePlatforms(entity, dt) {
      entity.onGround = false;
      entity.x += entity.vx * dt;
      for (const plat of engineState.level.platforms) {
        if (rectsOverlap(entity, plat)) {
          if (entity.vx > 0) entity.x = plat.x - entity.w;
          else if (entity.vx < 0) entity.x = plat.x + plat.w;
          entity.vx = 0;
        }
      }
      entity.y += entity.vy * dt;
      for (const plat of engineState.level.platforms) {
        if (rectsOverlap(entity, plat)) {
          if (entity.vy > 0) {
            entity.y = plat.y - entity.h;
            entity.vy = 0;
            entity.onGround = true;
          } else if (entity.vy < 0) {
            entity.y = plat.y + plat.h;
            entity.vy = 0;
          }
        }
      }
    }

    function updateGame(dt, time) {
      if (!engineState.level || !engineState.player) return;
      const player = engineState.player;
      const left = engineState.keys.ArrowLeft || engineState.keys.KeyA || engineState.touch.left;
      const right = engineState.keys.ArrowRight || engineState.keys.KeyD || engineState.touch.right;
      const jump = engineState.keys.ArrowUp || engineState.keys.Space || engineState.keys.KeyW || engineState.touch.jumpQueued;
      const move = (right ? 1 : 0) - (left ? 1 : 0);
      const accel = player.onGround ? 2500 : 1600;

      if (move !== 0) {
        player.vx += move * accel * dt;
        player.dir = move > 0 ? 1 : -1;
      } else {
        player.vx = THREE.MathUtils.damp(player.vx, 0, 10, dt);
      }
      player.vx = clamp(player.vx, -engineState.moveSpeed, engineState.moveSpeed);

      if (jump) player.jumpBuffer = 0.12;
      else player.jumpBuffer = Math.max(0, player.jumpBuffer - dt);
      if (player.onGround) player.coyote = 0.1;
      else player.coyote = Math.max(0, player.coyote - dt);

      if (player.jumpBuffer > 0 && player.coyote > 0) {
        player.vy = -engineState.jumpPower;
        player.onGround = false;
        player.coyote = 0;
        player.jumpBuffer = 0;
        addParticle(player.x + player.w / 2, player.y + player.h, 0x5ce7ff, 10, 90);
        beep.play(520, 0.06, 'triangle', 0.035);
      }
      engineState.touch.jumpQueued = false;

      const gravity = 1800;
      player.vy += gravity * dt;
      player.vy = Math.min(player.vy, 1200);
      resolvePlatforms(player, dt);

      if (player.y > engineState.worldHeight + 260) loseLife();

      for (const hz of engineState.level.hazards) {
        if (rectsOverlap(player, hz)) { loseLife(); break; }
      }

      engineState.level.enemies.forEach((enemy) => {
        if (enemy.dead) return;
        enemy.hitCooldown = Math.max(0, enemy.hitCooldown - dt);
        enemy.dir = enemy.dir || 1;
        if (enemy.type === 'patrol' || enemy.type === 'tank') {
          enemy.x += enemy.dir * enemy.speed * dt;
          if (enemy.x < enemy.minX || enemy.x + enemy.w > enemy.maxX) {
            enemy.dir *= -1;
            enemy.x = clamp(enemy.x, enemy.minX, enemy.maxX - enemy.w);
          }
          enemy.vx = enemy.dir * enemy.speed;
        } else if (enemy.type === 'hover') {
          enemy.x += Math.sin(time * 0.002 + enemy.x * 0.01) * 22 * dt;
          enemy.x = clamp(enemy.x, enemy.minX, enemy.maxX - enemy.w);
          enemy.y = enemy.baseY + Math.sin(time * 0.004 + enemy.x) * 12;
          enemy.vx = 80;
        }

        if (rectsOverlap(player, enemy)) {
          const stomp = player.vy > 180 && player.y + player.h - enemy.y < 22;
          if (stomp) {
            enemy.hp -= engineState.stompForce >= 1.2 ? 2 : 1;
            player.vy = -engineState.jumpPower * 0.55;
            addParticle(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, enemy.color, 14, 140);
            beep.play(250, 0.05, 'square', 0.03);
            if (enemy.hp <= 0) {
              enemy.dead = true;
              engineState.score += enemy.score;
            }
          } else if (enemy.hitCooldown <= 0) {
            enemy.hitCooldown = 0.8;
            loseLife();
          }
        }
      });

      engineState.level.coins.forEach((coin) => {
        if (coin.collected) return;
        const cx = player.x + player.w / 2;
        const cy = player.y + player.h / 2;
        const dx = cx - coin.x;
        const dy = cy - coin.y;
        const dist = Math.hypot(dx, dy);
        if (dist < engineState.collectRadius) {
          coin.collected = true;
          engineState.totalCoins += 1;
          engineState.score += 50;
          addParticle(coin.x, coin.y, 0xffea76, 12, 120);
          beep.play(840, 0.05, 'triangle', 0.03);
          vibrate(12);
        }
      });

      const allCoins = engineState.level.coins.every((c) => c.collected);
      if (allCoins && rectsOverlap(player, engineState.level.portal)) {
        engineState.score += 250;
        addParticle(engineState.level.portal.x + 30, engineState.level.portal.y + 30, 0x5bff9f, 24, 140);
        beep.play(760, 0.07, 'triangle', 0.04);
        nextLevel();
        return;
      }

      const alive = [];
      for (const part of engineState.particles) {
        part.life -= dt;
        part.x += part.vx * dt;
        part.y += part.vy * dt;
        part.vx *= 0.96;
        part.vy *= 0.96;
        if (part.life > 0) alive.push(part);
        else effects.remove(part.mesh);
      }
      engineState.particles = alive;
      engineState.invincible = Math.max(0, engineState.invincible - dt);
      engineState.shake = Math.max(0, engineState.shake - dt * 0.45);

      if (engineState.score >= engineState.nextUpgradeAt && engineState.state === 'playing' && engineState.upgradeOptions.length === 0) {
        showUpgradeMenu();
      }
      updateHud();
    }

    let last = performance.now();
    let fpsTimer = 0;
    let fpsFrames = 0;

    function tick(now) {
      if (!engineState.running) return;
      const dt = Math.min((now - last) / 1000, 0.032);
      last = now;
      fpsTimer += dt;
      fpsFrames += 1;
      if (fpsTimer > 0.5) {
        engineState.fps = Math.round(fpsFrames / fpsTimer);
        fpsTimer = 0;
        fpsFrames = 0;
      }

      if (engineState.state === 'playing') updateGame(dt, now);
      syncMeshes(now);
      composer.render();
      requestAnimationFrame(tick);
    }

    const keyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
      engineState.keys[e.code] = true;
      if ((e.code === 'Escape' || e.code === 'KeyP') && (engineState.state === 'playing' || engineState.state === 'paused')) {
        togglePause();
      }
    };
    const keyUp = (e) => { engineState.keys[e.code] = false; };
    window.addEventListener('keydown', keyDown, { passive: false });
    window.addEventListener('keyup', keyUp);
    window.addEventListener('resize', updateRendererSize);

    updateRendererSize();
    spawnStars();
    requestAnimationFrame(tick);

    engineRef.current = {
      startGame,
      restartLevel,
      resetToMenu,
      togglePause,
      applySettings,
      applyUpgrade,
      touch: engineState.touch,
      state: engineState,
    };

    return () => {
      engineState.running = false;
      window.removeEventListener('keydown', keyDown);
      window.removeEventListener('keyup', keyUp);
      window.removeEventListener('resize', updateRendererSize);
      composer.dispose();
      renderer.dispose();
    };
  }, []);

  const ranking = useMemo(() => [...(saveData.ranking || [])].sort((a, b) => b.score - a.score).slice(0, 10), [saveData.ranking]);

  const setSetting = (key, value) => setSettings((prev) => ({ ...prev, [key]: value }));

  const pressControl = (type, active) => {
    const touch = engineRef.current?.touch;
    if (!touch) return;
    if (type === 'jump' && active) touch.jumpQueued = true;
    else if (type !== 'jump') touch[type] = active;
  };

  const settingsPanel = (
    <div className="section">
      <div className="section-title">Configurações</div>
      <div className="settings-list">
        <div className="setting-row">
          <label>Volume música</label>
          <input type="range" min="0" max="1" step="0.01" value={settings.musicVolume} onChange={(e) => setSetting('musicVolume', Number(e.target.value))} />
          <strong>{Math.round(settings.musicVolume * 100)}%</strong>
        </div>
        <div className="setting-row">
          <label>Volume SFX</label>
          <input type="range" min="0" max="1" step="0.01" value={settings.sfxVolume} onChange={(e) => setSetting('sfxVolume', Number(e.target.value))} />
          <strong>{Math.round(settings.sfxVolume * 100)}%</strong>
        </div>
        <div className="setting-row">
          <label>Qualidade</label>
          <select value={settings.quality} onChange={(e) => setSetting('quality', e.target.value)}>
            <option value="low">Baixa</option>
            <option value="medium">Média</option>
            <option value="high">Alta</option>
          </select>
          <span className="small">pixelRatio + bloom + partículas</span>
        </div>
        <div className="setting-row">
          <label>Intensidade neon</label>
          <input type="range" min="0.5" max="1.8" step="0.05" value={settings.neonIntensity} onChange={(e) => setSetting('neonIntensity', Number(e.target.value))} />
          <strong>{settings.neonIntensity.toFixed(2)}x</strong>
        </div>
        <div className="setting-row">
          <label>Mostrar FPS</label>
          <input type="checkbox" checked={settings.showFPS} onChange={(e) => setSetting('showFPS', e.target.checked)} />
          <span className="small">overlay de debug</span>
        </div>
        <div className="setting-row">
          <label>Vibração mobile</label>
          <input type="checkbox" checked={settings.vibration} onChange={(e) => setSetting('vibration', e.target.checked)} />
          <span className="small">usa navigator.vibrate</span>
        </div>
        <div className="setting-row">
          <label>Screen shake</label>
          <input type="checkbox" checked={settings.screenShake} onChange={(e) => setSetting('screenShake', e.target.checked)} />
          <span className="small">feedback de dano</span>
        </div>
        <div className="buttons" style={{ marginTop: 6 }}>
          <button className="ghost-button" onClick={() => setSettings(defaultSettings)}>Restaurar padrão</button>
          <button
            className="ghost-button"
            onClick={() => {
              const next = { ...defaultSave, settings };
              saveRef.current = next;
              setSaveData(next);
            }}
          >
            Resetar save
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <main className="page-root">
      <canvas ref={canvasRef} className="game-canvas" />

      <div className="hud">
        <div className="hud-row">
          <div className="hud-card"><div className="hud-label">Fase</div><div className="hud-value">{hud.level}</div></div>
          <div className="hud-card"><div className="hud-label">Vidas</div><div className="hud-value">{hud.lives}/{hud.maxLives}</div></div>
          <div className="hud-card"><div className="hud-label">Moedas</div><div className="hud-value">{hud.coins}</div></div>
          <div className="hud-card"><div className="hud-label">Restantes</div><div className="hud-value">{hud.levelCoins}</div></div>
        </div>
        <div className="hud-row">
          <div className="hud-card"><div className="hud-label">Score</div><div className="hud-value">{hud.score}</div></div>
          <div className="hud-card"><div className="hud-label">Recorde</div><div className="hud-value">{hud.best}</div></div>
          {settings.showFPS && <div className="hud-card"><div className="hud-label">FPS</div><div className="hud-value">{hud.fps}</div></div>}
          <div className="hud-card hud-buff">
            <div className="hud-label">Buffs</div>
            <div className="hud-buff-list">{hud.buffs.length ? hud.buffs.map((b) => <span key={b}>{b}</span>) : <span className="small">Sem upgrades ainda</span>}</div>
          </div>
        </div>
      </div>

      {(screen === 'menu' || screen === 'settings' || screen === 'ranking' || screen === 'credits' || screen === 'paused' || screen === 'gameOver' || screen === 'victory' || screen === 'upgrade') && <div className="fade-bg" />}

      {screen === 'menu' && (
        <div className="overlay">
          <div className="panel">
            <p className="kicker">Next.js + Three.js • plataforma 2D fake</p>
            <h1 className="title">NEON<br />PLATFORMER</h1>
            <p className="subtitle">Corra, pule, colete todas as moedas e alcance o portal. O jogo usa câmera ortográfica, render em Three.js com aparência 2D, parallax neon, HUD profissional, ranking local e save automático.</p>
            <div className="grid grid-2">
              <div className="section">
                <div className="section-title">Controles</div>
                <div className="small">Desktop: A/D ou ←/→ para mover, W/↑/Espaço para pular, P ou Esc para pausar.<br />Mobile: botões neon na tela.</div>
              </div>
              <div className="section">
                <div className="section-title">Objetivo</div>
                <div className="small">Pegue todas as moedas da fase. O portal só ativa quando tudo for coletado. Inimigos causam dano, mas podem ser derrotados com stomp.</div>
              </div>
            </div>
            <div className="buttons">
              <button className="button primary" onClick={() => engineRef.current?.startGame?.(0)}>Jogar</button>
              <button className="button" onClick={() => setScreen('ranking')}>Ranking</button>
              <button className="button" onClick={() => setScreen('settings')}>Configurações</button>
              <button className="button magenta" onClick={() => setScreen('credits')}>Créditos</button>
            </div>
          </div>
        </div>
      )}

      {screen === 'settings' && (
        <div className="overlay">
          <div className="panel">
            <p className="kicker">Sistema completo</p>
            <h2 className="title" style={{ fontSize: 'clamp(30px, 5vw, 54px)' }}>CONFIG</h2>
            {settingsPanel}
            <div className="buttons">
              <button className="button primary" onClick={() => setScreen('menu')}>Voltar</button>
              <button className="ghost-button" onClick={() => engineRef.current?.startGame?.(Math.max(0, (saveData.unlockedLevel || 1) - 1))}>Jogar do último nível</button>
            </div>
          </div>
        </div>
      )}

      {screen === 'ranking' && (
        <div className="overlay">
          <div className="panel">
            <p className="kicker">Top runs locais</p>
            <h2 className="title" style={{ fontSize: 'clamp(30px, 5vw, 54px)' }}>RANKING</h2>
            <div className="section">
              <div className="list">
                {ranking.length ? ranking.map((entry, i) => (
                  <div key={`${entry.date}-${i}`} className="rank-row">
                    <div className="rank-index">#{i + 1}</div>
                    <div className="rank-main">
                      <div className="rank-title">{entry.status === 'victory' ? 'Vitória completa' : `Fase ${entry.level}`}</div>
                      <div className="rank-meta">{new Date(entry.date).toLocaleString('pt-BR')} • {entry.coins} moedas</div>
                    </div>
                    <div className="rank-value">{entry.score}</div>
                    <div className="badge">{entry.status}</div>
                  </div>
                )) : <div className="small">Ainda não existe nenhuma run salva. Jogue uma partida para popular o ranking.</div>}
              </div>
            </div>
            <div className="buttons">
              <button className="button primary" onClick={() => setScreen('menu')}>Voltar</button>
              <button className="ghost-button" onClick={() => engineRef.current?.startGame?.(0)}>Nova partida</button>
            </div>
          </div>
        </div>
      )}

      {screen === 'credits' && (
        <div className="overlay">
          <div className="panel">
            <p className="kicker">Créditos</p>
            <h2 className="title" style={{ fontSize: 'clamp(30px, 5vw, 54px)' }}>ABOUT</h2>
            <div className="section small">
              Projeto de exemplo em <strong>Next.js + Three.js</strong>, com câmera ortográfica, render 2D fake, HUD em HTML/CSS, save local, ranking, bloom neon e controles mobile.
            </div>
            <div className="buttons">
              <button className="button primary" onClick={() => setScreen('menu')}>Voltar</button>
            </div>
          </div>
        </div>
      )}

      {screen === 'paused' && (
        <div className="overlay">
          <div className="panel">
            <p className="kicker">Jogo pausado</p>
            <h2 className="title" style={{ fontSize: 'clamp(30px, 5vw, 54px)' }}>PAUSE</h2>
            <div className="buttons">
              <button className="button primary" onClick={() => engineRef.current?.togglePause?.('play')}>Continuar</button>
              <button className="button" onClick={() => engineRef.current?.restartLevel?.()}>Reiniciar fase</button>
              <button className="button" onClick={() => setScreen('settings')}>Configurações</button>
              <button className="button magenta" onClick={() => engineRef.current?.resetToMenu?.()}>Sair</button>
            </div>
          </div>
        </div>
      )}

      {screen === 'gameOver' && (
        <div className="overlay">
          <div className="panel">
            <p className="kicker">Fim da run</p>
            <h2 className="title" style={{ fontSize: 'clamp(30px, 5vw, 54px)' }}>GAME OVER</h2>
            <div className="grid grid-2">
              <div className="section"><div className="section-title">Score final</div><div className="hud-value">{hud.score}</div></div>
              <div className="section"><div className="section-title">Recorde</div><div className="hud-value">{saveData.highScore}</div></div>
            </div>
            <div className="buttons">
              <button className="button primary" onClick={() => engineRef.current?.startGame?.(0)}>Jogar de novo</button>
              <button className="button" onClick={() => setScreen('ranking')}>Ver ranking</button>
              <button className="button magenta" onClick={() => engineRef.current?.resetToMenu?.()}>Menu</button>
            </div>
          </div>
        </div>
      )}

      {screen === 'victory' && (
        <div className="overlay">
          <div className="panel">
            <p className="kicker">Você fechou todas as fases</p>
            <h2 className="title" style={{ fontSize: 'clamp(30px, 5vw, 54px)' }}>VICTORY</h2>
            <div className="grid grid-2">
              <div className="section"><div className="section-title">Score final</div><div className="hud-value">{hud.score}</div></div>
              <div className="section"><div className="section-title">Moedas totais</div><div className="hud-value">{hud.coins}</div></div>
            </div>
            <div className="buttons">
              <button className="button primary" onClick={() => engineRef.current?.startGame?.(0)}>Jogar novamente</button>
              <button className="button" onClick={() => setScreen('ranking')}>Ranking</button>
              <button className="button magenta" onClick={() => engineRef.current?.resetToMenu?.()}>Menu</button>
            </div>
          </div>
        </div>
      )}

      {screen === 'upgrade' && (
        <div className="overlay">
          <div className="panel">
            <p className="kicker">Escolha um upgrade</p>
            <h2 className="title" style={{ fontSize: 'clamp(30px, 5vw, 54px)' }}>LEVEL UP</h2>
            <div className="upgrade-grid">
              {upgradeOptions.map((upgrade) => (
                <div key={upgrade.id} className="upgrade-card" onClick={() => engineRef.current?.applyUpgrade?.(upgrade.id)}>
                  <div className="upgrade-name">{upgrade.name}</div>
                  <div className="upgrade-desc">{upgrade.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isTouch && (
        <div className="mobile-controls">
          <div className="control-group">
            <button className="control-btn" onPointerDown={() => pressControl('left', true)} onPointerUp={() => pressControl('left', false)} onPointerLeave={() => pressControl('left', false)}>◀</button>
            <button className="control-btn" onPointerDown={() => pressControl('right', true)} onPointerUp={() => pressControl('right', false)} onPointerLeave={() => pressControl('right', false)}>▶</button>
          </div>
          <div className="control-group">
            <button className="control-btn" onPointerDown={() => pressControl('jump', true)}>▲</button>
          </div>
        </div>
      )}
    </main>
  );
}
