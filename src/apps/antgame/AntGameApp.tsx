import { useEffect, useRef, useState } from "react";
import { useElementSize } from "../../hooks/useElementSize";
import AntGameOverlays from "./components/AntGameOverlays";
import AntGameStage from "./components/AntGameStage";
import AntGameToolbar from "./components/AntGameToolbar";
import {
  ACID_BASE_TICK_MS,
  BOMB_BASE_COOLDOWN_MS,
  COINS_PER_ANT,
  FLAME_BASE_TICK_MS,
  GRID_HEIGHT,
  GRID_SIZE,
  GRID_WIDTH,
  LIGHTNING_BASE_COOLDOWN_MS,
  MAX_ANTS,
  MAX_DEATH_SPLATS,
  MIN_EFFECTIVE_SPAWN_INTERVAL_SECONDS,
  SANDWICH_BITE_DAMAGE_PER_SECOND,
  SANDWICH_MIN_DISTANCE_FROM_NEST,
  TOTAL_WAVES,
  splatPatterns,
  upgradeStatOptions,
  weaponOptions,
  weaponUnlockCost,
} from "./engine/constants";
import {
  MAX_UPGRADE_LEVEL,
  canUnlockWeapon,
  createInitialWeaponProgress,
  getUpgradeCost,
  getWeaponRuntimeStats,
  upgradeLevelField,
} from "./engine/upgrades";
import { createGameRenderSnapshot } from "./engine/renderSnapshot";
import {
  clamp,
  clampWave,
  createSandwich,
  createWaveNests,
  getDeathColors,
  getWaveRamp,
  getWaveSettings,
  getWeaponScale,
  gridIndex,
  makeAnt,
  rand,
} from "./engine/world";
import {
  getActiveRendererMode,
  resolveInitialRendererMode,
  resolveRendererDebugEnabled,
} from "./render/renderModes";
import type {
  Ant,
  DeathSplat,
  DeathType,
  Explosion,
  GameRenderSnapshot,
  HudState,
  LightningStrike,
  Nest,
  Particle,
  RendererMode,
  Sandwich,
  UpgradeStatId,
  WaveSettings,
  WeaponId,
  WeaponProgress,
} from "./types";
import "./styles/antgame.css";

function AntGameApp() {
  const initialWaveSettings = getWaveSettings(1);
  const initialWeaponProgress = createInitialWeaponProgress();
  const requestedRendererModeRef = useRef<RendererMode>(resolveInitialRendererMode());
  const activeRendererModeRef = useRef<RendererMode>(
    getActiveRendererMode(requestedRendererModeRef.current),
  );
  const rendererDebugEnabledRef = useRef(resolveRendererDebugEnabled());
  const rendererDebugRef = useRef({
    frameCount: 0,
    lastReportMs: performance.now(),
  });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasShellRef = useRef<HTMLDivElement>(null);
  const canvasShellSize = useElementSize(canvasShellRef);
  const antsRef = useRef<Ant[]>([]);
  const nestsRef = useRef<Nest[]>(createWaveNests(initialWaveSettings, null));
  const sandwichRef = useRef<Sandwich>(createSandwich(nestsRef.current));
  const waveRef = useRef(1);
  const waveSettingsRef = useRef<WaveSettings>(initialWaveSettings);
  const waveElapsedSecondsRef = useRef(0);
  const waveSpawnedRef = useRef(0);
  const currentCoinPerAntRef = useRef(COINS_PER_ANT);
  const currentSpawnIntervalRef = useRef(initialWaveSettings.baseSpawnIntervalSeconds);
  const roundBreakRef = useRef(false);
  const nextWaveRef = useRef<number | null>(null);
  const victoryRef = useRef(false);
  const coinsRef = useRef(0);
  const weaponProgressRef = useRef<Record<WeaponId, WeaponProgress>>(initialWeaponProgress);
  const particlesRef = useRef<Particle[]>([]);
  const deathSplatsRef = useRef<DeathSplat[]>([]);
  const lightningRef = useRef<LightningStrike[]>([]);
  const explosionsRef = useRef<Explosion[]>([]);
  const fireRef = useRef<Uint8Array>(new Uint8Array(GRID_SIZE));
  const acidRef = useRef<Uint8Array>(new Uint8Array(GRID_SIZE));
  const scorchRef = useRef<Uint8Array>(new Uint8Array(GRID_SIZE));
  const spawnAccumulatorRef = useRef(0);
  const lastWeaponUseRef = useRef<Record<WeaponId, number>>({
    acid: 0,
    bomb: 0,
    flamethrower: 0,
    lightning: 0,
  });
  const statsRef = useRef({
    kills: 0,
    spawned: 0,
  });
  const pointerRef = useRef({
    active: false,
    lastX: GRID_WIDTH / 2,
    lastY: GRID_HEIGHT / 2,
    x: GRID_WIDTH / 2,
    y: GRID_HEIGHT / 2,
  });
  const weaponRef = useRef<WeaponId>("flamethrower");
  const weaponSizeRef = useRef(50);

  const [weapon, setWeapon] = useState<WeaponId>("flamethrower");
  const [weaponProgress, setWeaponProgress] = useState<Record<WeaponId, WeaponProgress>>(initialWeaponProgress);
  const [hud, setHud] = useState(() => ({
    ants: 0,
    coins: 0,
    coinPerAnt: COINS_PER_ANT,
    isRoundBreak: false,
    isVictory: false,
    kills: 0,
    nextWave: 2,
    nestsAlive: nestsRef.current.filter((nest) => nest.isAlive).length,
    nestsTotal: nestsRef.current.length,
    sandwichHp: sandwichRef.current.hp,
    sandwichMaxHp: sandwichRef.current.maxHp,
    spawnRate: 1 / Math.max(0.001, initialWaveSettings.baseSpawnIntervalSeconds),
    spawned: 0,
    wave: waveRef.current,
    waveSpawned: waveSpawnedRef.current,
    waveTimeSeconds: 0,
    wavesTotal: TOTAL_WAVES,
  }));

  useEffect(() => {
    weaponRef.current = weapon;
  }, [weapon]);

  useEffect(() => {
    weaponProgressRef.current = weaponProgress;
  }, [weaponProgress]);

  const beginWave = (waveNumber: number, keepSandwichState: boolean) => {
    const safeWave = clamp(Math.floor(waveNumber), 1, TOTAL_WAVES);
    const nextWaveSettings = getWaveSettings(safeWave);
    const previousSandwich = sandwichRef.current;
    const nextNests = createWaveNests(
      nextWaveSettings,
      keepSandwichState ? previousSandwich : null,
    );

    waveRef.current = safeWave;
    waveSettingsRef.current = nextWaveSettings;
    waveElapsedSecondsRef.current = 0;
    waveSpawnedRef.current = 0;
    currentCoinPerAntRef.current = COINS_PER_ANT;
    currentSpawnIntervalRef.current = nextWaveSettings.baseSpawnIntervalSeconds;
    roundBreakRef.current = false;
    nextWaveRef.current = null;
    victoryRef.current = false;
    antsRef.current = [];
    nestsRef.current = nextNests;
    particlesRef.current = [];
    deathSplatsRef.current = [];
    lightningRef.current = [];
    explosionsRef.current = [];
    fireRef.current.fill(0);
    acidRef.current.fill(0);
    scorchRef.current.fill(0);
    spawnAccumulatorRef.current = 0;
    pointerRef.current.active = false;

    if (!keepSandwichState) {
      sandwichRef.current = createSandwich(nextNests);
      return;
    }

    const canKeepSandwichPosition = nextNests.every(
      (nest) =>
        Math.hypot(nest.x - previousSandwich.x, nest.y - previousSandwich.y) >
        nest.radius + previousSandwich.radius + SANDWICH_MIN_DISTANCE_FROM_NEST,
    );

    if (canKeepSandwichPosition) {
      return;
    }

    const relocated = createSandwich(nextNests);
    sandwichRef.current = {
      ...relocated,
      hp: previousSandwich.hp,
      maxHp: previousSandwich.maxHp,
    };
  };

  const earnCoins = (amount: number) => {
    if (amount <= 0) {
      return;
    }

    coinsRef.current += amount;
  };

  const spendCoins = (amount: number) => {
    if (amount <= 0) {
      return true;
    }

    if (coinsRef.current < amount) {
      return false;
    }

    coinsRef.current -= amount;
    setHud((previous) => ({ ...previous, coins: coinsRef.current }));
    return true;
  };

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const nests = nestsRef.current;
      const sandwich = sandwichRef.current;
      const nestsAlive = nests.reduce(
        (count, nest) => (nest.isAlive ? count + 1 : count),
        0,
      );

      setHud({
        ants: antsRef.current.length,
        coins: coinsRef.current,
        coinPerAnt: currentCoinPerAntRef.current,
        isRoundBreak: roundBreakRef.current,
        isVictory: victoryRef.current,
        kills: statsRef.current.kills,
        nextWave: nextWaveRef.current ?? Math.min(TOTAL_WAVES, waveRef.current + 1),
        nestsAlive,
        nestsTotal: nests.length,
        sandwichHp: sandwich.hp,
        sandwichMaxHp: sandwich.maxHp,
        spawnRate: 1 / Math.max(0.001, currentSpawnIntervalRef.current),
        spawned: statsRef.current.spawned,
        wave: waveRef.current,
        waveSpawned: waveSpawnedRef.current,
        waveTimeSeconds: waveElapsedSecondsRef.current,
        wavesTotal: TOTAL_WAVES,
      });
    }, 90);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const addParticleBurst = (x: number, y: number, color: string, count: number) => {
    const particles = particlesRef.current;

    for (let i = 0; i < count; i += 1) {
      particles.push({
        color,
        life: rand(0.14, 0.45),
        size: 1,
        vx: rand(-40, 40),
        vy: rand(-34, 34),
        x,
        y,
      });
    }
  };

  const addAntDeathEffect = (x: number, y: number, type: DeathType) => {
    const colors = getDeathColors(type);
    const particles = particlesRef.current;
    const deathSplats = deathSplatsRef.current;

    deathSplats.push({
      life: rand(4.8, 9),
      maxLife: rand(4.8, 9),
      patternIndex: Math.floor(rand(0, splatPatterns.length)),
      type,
      x: clamp(Math.round(x), 1, GRID_WIDTH - 4),
      y: clamp(Math.round(y), 1, GRID_HEIGHT - 4),
    });

    if (deathSplats.length > MAX_DEATH_SPLATS) {
      deathSplats.splice(0, deathSplats.length - MAX_DEATH_SPLATS);
    }

    const chunkCount = type === "impact" ? 18 : 12;
    for (let i = 0; i < chunkCount; i += 1) {
      const color = colors[Math.floor(rand(0, colors.length))] ?? colors[0];
      particles.push({
        color,
        life: rand(0.22, 0.75),
        size: Math.random() > 0.74 ? 2 : 1,
        vx: rand(-58, 58),
        vy: rand(-50, 44),
        x: x + rand(-0.4, 0.4),
        y: y + rand(-0.4, 0.4),
      });
    }
  };

  const eliminateAnt = (
    ants: Ant[],
    antIndex: number,
    ant: Ant,
    deathType: DeathType,
  ) => {
    ants.splice(antIndex, 1);
    statsRef.current.kills += 1;
    earnCoins(currentCoinPerAntRef.current);
    addAntDeathEffect(ant.x, ant.y, deathType);
  };

  const destroyNest = (nest: Nest, collapseType: DeathType) => {
    if (!nest.isAlive) {
      return;
    }

    nest.isAlive = false;
    nest.hp = 0;
    explosionsRef.current.push({
      life: 0.34,
      radius: nest.radius * 3.8,
      x: nest.x,
      y: nest.y,
    });

    const collapseColors = getDeathColors(collapseType);
    addParticleBurst(nest.x, nest.y, collapseColors[2] ?? "#6d6d6d", 22);

    for (let i = 0; i < 10; i += 1) {
      const offsetX = rand(-nest.radius * 0.8, nest.radius * 0.8);
      const offsetY = rand(-nest.radius * 0.8, nest.radius * 0.8);
      const color = collapseColors[Math.floor(rand(0, collapseColors.length))] ?? collapseColors[0];
      addParticleBurst(nest.x + offsetX, nest.y + offsetY, color, 3);
    }

    for (let i = 0; i < 8; i += 1) {
      addAntDeathEffect(
        nest.x + rand(-nest.radius * 0.8, nest.radius * 0.8),
        nest.y + rand(-nest.radius * 0.8, nest.radius * 0.8),
        collapseType,
      );
    }
  };

  const dealNestDamage = (nest: Nest, damage: number, damageType: DeathType) => {
    if (!nest.isAlive || damage <= 0) {
      return;
    }

    nest.hp -= damage;

    if (nest.hp <= 0) {
      destroyNest(nest, damageType);
    }
  };

  const splashFire = (centerX: number, centerY: number, radius: number, power: number) => {
    const fire = fireRef.current;
    const scorch = scorchRef.current;
    const minX = clamp(Math.floor(centerX - radius), 0, GRID_WIDTH - 1);
    const maxX = clamp(Math.ceil(centerX + radius), 0, GRID_WIDTH - 1);
    const minY = clamp(Math.floor(centerY - radius), 0, GRID_HEIGHT - 1);
    const maxY = clamp(Math.ceil(centerY + radius), 0, GRID_HEIGHT - 1);

    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        const dx = x - centerX;
        const dy = y - centerY;
        const distance = Math.hypot(dx, dy);

        if (distance > radius) {
          continue;
        }

        const weight = 1 - distance / radius;
        const index = gridIndex(x, y);
        const nextFire = clamp(Math.floor(power * weight + rand(0, 30)), 0, 255);
        const nextScorch = clamp(Math.floor(power * weight * 0.6), 0, 255);
        fire[index] = Math.max(fire[index], nextFire);
        scorch[index] = Math.max(scorch[index], nextScorch);
      }
    }

    const nests = nestsRef.current;
    for (let i = 0; i < nests.length; i += 1) {
      const nest = nests[i];

      if (!nest.isAlive) {
        continue;
      }

      const distance = Math.hypot(nest.x - centerX, nest.y - centerY);
      const overlapRadius = radius + nest.radius + 0.5;

      if (distance > overlapRadius) {
        continue;
      }

      const overlap = 1 - distance / overlapRadius;
      const damage = power * overlap * 0.0012;
      dealNestDamage(nest, damage, "burn");
    }
  };

  const splashAcid = (centerX: number, centerY: number, radius: number, power: number) => {
    const acid = acidRef.current;
    const minX = clamp(Math.floor(centerX - radius), 0, GRID_WIDTH - 1);
    const maxX = clamp(Math.ceil(centerX + radius), 0, GRID_WIDTH - 1);
    const minY = clamp(Math.floor(centerY - radius), 0, GRID_HEIGHT - 1);
    const maxY = clamp(Math.ceil(centerY + radius), 0, GRID_HEIGHT - 1);

    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        const dx = x - centerX;
        const dy = y - centerY;
        const distance = Math.hypot(dx, dy);

        if (distance > radius) {
          continue;
        }

        const weight = 1 - distance / radius;
        const index = gridIndex(x, y);
        const nextAcid = clamp(Math.floor(power * weight + rand(0, 30)), 0, 255);
        acid[index] = Math.max(acid[index], nextAcid);
      }
    }

    const nests = nestsRef.current;
    for (let i = 0; i < nests.length; i += 1) {
      const nest = nests[i];

      if (!nest.isAlive) {
        continue;
      }

      const distance = Math.hypot(nest.x - centerX, nest.y - centerY);
      const overlapRadius = radius + nest.radius + 0.5;

      if (distance > overlapRadius) {
        continue;
      }

      const overlap = 1 - distance / overlapRadius;
      const damage = power * overlap * 0.0012;
      dealNestDamage(nest, damage, "acid");
    }
  };

  const castLightning = (
    targetX: number,
    targetY: number,
    sizeScale: number,
    damageMultiplier: number,
    speedMultiplier: number,
  ) => {
    const now = performance.now();
    const cooldownMs = LIGHTNING_BASE_COOLDOWN_MS / Math.max(0.35, speedMultiplier);

    if (now - lastWeaponUseRef.current.lightning < cooldownMs) {
      return;
    }

    lastWeaponUseRef.current.lightning = now;

    const points: Array<{ x: number; y: number }> = [];
    let x = clamp(targetX + rand(-8 * sizeScale, 8 * sizeScale), 1, GRID_WIDTH - 2);
    let y = 0;
    points.push({ x, y });

    while (y < targetY) {
      y += rand(4, 6 + 2 * sizeScale);
      x += (targetX - x) * 0.28 + rand(-7 * sizeScale, 7 * sizeScale);
      points.push({
        x: clamp(x, 1, GRID_WIDTH - 2),
        y: clamp(y, 0, GRID_HEIGHT - 1),
      });
    }

    lightningRef.current.push({ life: 0.12, points });

    const ants = antsRef.current;
    for (let i = ants.length - 1; i >= 0; i -= 1) {
      const ant = ants[i];
      let nearStrike = false;

      for (let p = 0; p < points.length; p += 1) {
        const point = points[p];
        const distance = Math.hypot(ant.x - point.x, ant.y - point.y);
        if (distance <= 4 + sizeScale * 5) {
          nearStrike = true;
          break;
        }
      }

      if (!nearStrike) {
        continue;
      }

      ant.hp -= rand(80, 150) * (0.75 + sizeScale * 0.35) * damageMultiplier;
      ant.burn = Math.max(ant.burn, 180);
      if (ant.hp <= 0) {
        eliminateAnt(ants, i, ant, "impact");
      }
    }

    const nests = nestsRef.current;
    for (let i = 0; i < nests.length; i += 1) {
      const nest = nests[i];

      if (!nest.isAlive) {
        continue;
      }

      let closestDistance = Number.POSITIVE_INFINITY;

      for (let p = 0; p < points.length; p += 1) {
        const point = points[p];
        const distance = Math.hypot(nest.x - point.x, nest.y - point.y);

        if (distance < closestDistance) {
          closestDistance = distance;
        }
      }

      if (closestDistance > nest.radius + 6 + sizeScale * 6) {
        continue;
      }

      const damage = Math.max(0, (96 + sizeScale * 92 - closestDistance * 9) * damageMultiplier);
      dealNestDamage(nest, damage, "impact");
    }

    splashFire(
      targetX,
      targetY,
      4 + sizeScale * 4.5,
      (170 + sizeScale * 40) * (0.92 + damageMultiplier * 0.18),
    );
    addParticleBurst(targetX, targetY, "#f9f9f9", Math.round(8 + sizeScale * 8));
  };

  const explodeBomb = (
    x: number,
    y: number,
    sizeScale: number,
    damageMultiplier: number,
    speedMultiplier: number,
  ) => {
    const now = performance.now();
    const cooldownMs = BOMB_BASE_COOLDOWN_MS / Math.max(0.35, speedMultiplier);

    if (now - lastWeaponUseRef.current.bomb < cooldownMs) {
      return;
    }

    lastWeaponUseRef.current.bomb = now;
    const blastRadius = 9 + sizeScale * 12;

    explosionsRef.current.push({
      life: 0.28,
      radius: blastRadius,
      x,
      y,
    });

    splashFire(x, y, blastRadius * 0.95, (200 + sizeScale * 55) * damageMultiplier);

    const ants = antsRef.current;
    for (let i = ants.length - 1; i >= 0; i -= 1) {
      const ant = ants[i];
      const distance = Math.hypot(ant.x - x, ant.y - y);

      if (distance > blastRadius + 2) {
        continue;
      }

      ant.hp -= (95 + sizeScale * 100 - distance * (4.5 + sizeScale * 2.2)) * damageMultiplier;
      ant.burn = Math.max(ant.burn, 240);
      ant.vx += (ant.x - x) * (2 + sizeScale * 2.5);
      ant.vy += (ant.y - y) * (2 + sizeScale * 2.5);

      if (ant.hp <= 0) {
        eliminateAnt(ants, i, ant, "burn");
      }
    }

    const nests = nestsRef.current;
    for (let i = 0; i < nests.length; i += 1) {
      const nest = nests[i];

      if (!nest.isAlive) {
        continue;
      }

      const distance = Math.hypot(nest.x - x, nest.y - y);

      if (distance > blastRadius + nest.radius + 4) {
        continue;
      }

      const damage = Math.max(
        0,
        (120 + sizeScale * 130 - distance * (8 + sizeScale * 2.8)) * damageMultiplier,
      );
      dealNestDamage(nest, damage, "burn");
    }

    addParticleBurst(x, y, "#ff8f2e", Math.round(16 + sizeScale * 14));
  };

  const applyFlamethrower = (
    x: number,
    y: number,
    lastX: number,
    lastY: number,
    sizeScale: number,
    damageMultiplier: number,
  ) => {
    const directionX = x - lastX;
    const directionY = y - lastY;
    const directionLength = Math.hypot(directionX, directionY) || 1;
    const normalizedX = directionX / directionLength;
    const normalizedY = directionY / directionLength;
    const coneX = normalizedX || 1;
    const coneY = normalizedY || 0;

    const pelletCount = Math.round(13 + sizeScale * 15);
    for (let i = 0; i < pelletCount; i += 1) {
      const distance = rand(1.5, 4.8 + 3.8 * sizeScale);
      const spread = rand(-2.2 * sizeScale, 2.2 * sizeScale);
      const targetX = clamp(Math.round(x + coneX * distance - coneY * spread), 0, GRID_WIDTH - 1);
      const targetY = clamp(Math.round(y + coneY * distance + coneX * spread), 0, GRID_HEIGHT - 1);
      splashFire(
        targetX,
        targetY,
        rand(0.8, 1.6 + 1.2 * sizeScale),
        rand(240, 320 + sizeScale * 34) * damageMultiplier,
      );
    }

    addParticleBurst(x, y, "#ff9f32", Math.round(2 + sizeScale * 3));
  };

  const applyAcid = (
    x: number,
    y: number,
    lastX: number,
    lastY: number,
    sizeScale: number,
    damageMultiplier: number,
  ) => {
    const directionX = x - lastX;
    const directionY = y - lastY;
    const directionLength = Math.hypot(directionX, directionY) || 1;
    const normalizedX = directionX / directionLength;
    const normalizedY = directionY / directionLength;
    const streamX = normalizedX || 1;
    const streamY = normalizedY || 0;

    const dropletCount = Math.round(10 + sizeScale * 12);
    for (let i = 0; i < dropletCount; i += 1) {
      const distance = rand(2, 6.4 + 4.8 * sizeScale);
      const spread = rand(-2.2 * sizeScale, 2.2 * sizeScale);
      const targetX = clamp(Math.round(x + streamX * distance - streamY * spread), 0, GRID_WIDTH - 1);
      const targetY = clamp(Math.round(y + streamY * distance + streamX * spread), 0, GRID_HEIGHT - 1);
      splashAcid(
        targetX,
        targetY,
        rand(0.8, 1.6 + 1.2 * sizeScale),
        rand(160, 220 + sizeScale * 20) * damageMultiplier,
      );
    }

    addParticleBurst(x, y, "#65ea39", Math.round(1 + sizeScale * 2));
  };

  const canvasPointFromEvent = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return null;
    }

    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) {
      return null;
    }

    return {
      x: clamp(
        Math.floor(((event.clientX - bounds.left) / bounds.width) * GRID_WIDTH),
        0,
        GRID_WIDTH - 1,
      ),
      y: clamp(
        Math.floor(((event.clientY - bounds.top) / bounds.height) * GRID_HEIGHT),
        0,
        GRID_HEIGHT - 1,
      ),
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d", { alpha: false });

    if (!context) {
      return;
    }

    canvas.width = GRID_WIDTH;
    canvas.height = GRID_HEIGHT;
    context.imageSmoothingEnabled = false;

    let animationFrame = 0;
    let previousTimestamp = performance.now();

    const stepSimulation = (deltaSeconds: number, now: number) => {
      spawnAccumulatorRef.current += deltaSeconds;
      const ants = antsRef.current;
      const nests = nestsRef.current;
      const sandwich = sandwichRef.current;
      const waveSettings = waveSettingsRef.current;
      const aliveNests = nests.filter((nest) => nest.isAlive);
      const sandwichAlive = sandwich.hp > 0;
      const gameWon = victoryRef.current;
      const isRoundBreak = roundBreakRef.current;

      if (sandwichAlive && !gameWon && !isRoundBreak && aliveNests.length === 0 && ants.length === 0) {
        if (waveRef.current >= TOTAL_WAVES) {
          victoryRef.current = true;
        } else {
          roundBreakRef.current = true;
          nextWaveRef.current = clamp(waveRef.current + 1, 1, TOTAL_WAVES);
        }
      }

      if (roundBreakRef.current || !sandwichAlive || victoryRef.current) {
        spawnAccumulatorRef.current = 0;
        pointerRef.current.active = false;
        return;
      }

      waveElapsedSecondsRef.current += deltaSeconds;
      const waveRamp = getWaveRamp(waveSettings, waveElapsedSecondsRef.current);
      const nestSpawnScale = Math.max(1, aliveNests.length * 0.42);
      const effectiveSpawnInterval = clamp(
        waveRamp.spawnIntervalSeconds / nestSpawnScale,
        MIN_EFFECTIVE_SPAWN_INTERVAL_SECONDS,
        waveRamp.spawnIntervalSeconds,
      );
      const speedRatio = waveSettings.baseSpawnIntervalSeconds / effectiveSpawnInterval;
      const coinDecayFromSpeed = clamp((speedRatio - 1) / 13, 0, 1);
      const adjustedCoin = Math.max(
        0,
        Math.floor(waveRamp.coinPerAnt * (1 - clamp((nestSpawnScale - 1) * 0.1, 0, 0.65))),
      );
      currentCoinPerAntRef.current = Math.min(
        adjustedCoin,
        Math.max(0, Math.floor(COINS_PER_ANT * (1 - coinDecayFromSpeed))),
      );
      currentSpawnIntervalRef.current = effectiveSpawnInterval;

      while (
        spawnAccumulatorRef.current >= effectiveSpawnInterval &&
        ants.length < Math.min(MAX_ANTS, waveRamp.maxAliveAnts) &&
        aliveNests.length > 0
      ) {
        spawnAccumulatorRef.current -= effectiveSpawnInterval;
        const sourceNest = aliveNests[Math.floor(rand(0, aliveNests.length))];

        if (!sourceNest) {
          break;
        }

        ants.push(makeAnt(sourceNest));
        waveSpawnedRef.current += 1;
        statsRef.current.spawned += 1;
      }

      const pointer = pointerRef.current;
      const currentWeaponProgress = weaponProgressRef.current[weaponRef.current];
      const currentWeaponUnlocked = currentWeaponProgress?.unlocked ?? false;
      const currentWeaponStats = currentWeaponProgress
        ? getWeaponRuntimeStats(currentWeaponProgress)
        : { damageMultiplier: 1, sizeMultiplier: 1, speedMultiplier: 1 };

      if (!currentWeaponUnlocked) {
        pointer.active = false;
      }

      if (pointer.active && sandwichAlive && !victoryRef.current) {
        const finalSizeScale = getWeaponScale(weaponSizeRef.current) * currentWeaponStats.sizeMultiplier;

        if (weaponRef.current === "flamethrower") {
          const flameTickMs = FLAME_BASE_TICK_MS / Math.max(0.35, currentWeaponStats.speedMultiplier);
          if (now - lastWeaponUseRef.current.flamethrower >= flameTickMs) {
            lastWeaponUseRef.current.flamethrower = now;
            applyFlamethrower(
              pointer.x,
              pointer.y,
              pointer.lastX,
              pointer.lastY,
              finalSizeScale,
              currentWeaponStats.damageMultiplier,
            );
          }
        } else if (weaponRef.current === "acid") {
          const acidTickMs = ACID_BASE_TICK_MS / Math.max(0.35, currentWeaponStats.speedMultiplier);
          if (now - lastWeaponUseRef.current.acid >= acidTickMs) {
            lastWeaponUseRef.current.acid = now;
            applyAcid(
              pointer.x,
              pointer.y,
              pointer.lastX,
              pointer.lastY,
              finalSizeScale,
              currentWeaponStats.damageMultiplier,
            );
          }
        } else if (weaponRef.current === "lightning") {
          castLightning(
            pointer.x,
            pointer.y,
            finalSizeScale,
            currentWeaponStats.damageMultiplier,
            currentWeaponStats.speedMultiplier,
          );
        }
      }

      const fire = fireRef.current;
      const acid = acidRef.current;
      const scorch = scorchRef.current;

      for (let i = 0; i < GRID_SIZE; i += 1) {
        fire[i] = fire[i] > 5 ? fire[i] - 5 : 0;
        acid[i] = acid[i] > 2 ? acid[i] - 2 : 0;
        scorch[i] = scorch[i] > 1 ? scorch[i] - 1 : 0;
      }

      for (let i = 0; i < nests.length; i += 1) {
        const nest = nests[i];

        if (!nest.isAlive) {
          continue;
        }

        const minX = clamp(Math.floor(nest.x - nest.radius - 1), 0, GRID_WIDTH - 1);
        const maxX = clamp(Math.ceil(nest.x + nest.radius + 1), 0, GRID_WIDTH - 1);
        const minY = clamp(Math.floor(nest.y - nest.radius - 1), 0, GRID_HEIGHT - 1);
        const maxY = clamp(Math.ceil(nest.y + nest.radius + 1), 0, GRID_HEIGHT - 1);
        let fireExposure = 0;
        let acidExposure = 0;
        let sampleCount = 0;

        for (let y = minY; y <= maxY; y += 1) {
          for (let x = minX; x <= maxX; x += 1) {
            const distance = Math.hypot(x - nest.x, y - nest.y);

            if (distance > nest.radius + 0.7) {
              continue;
            }

            const index = gridIndex(x, y);
            fireExposure += fire[index];
            acidExposure += acid[index];
            sampleCount += 1;
          }
        }

        if (sampleCount === 0) {
          continue;
        }

        const averageFire = fireExposure / sampleCount;
        const averageAcid = acidExposure / sampleCount;
        const fireDamage = averageFire * deltaSeconds * 0.34;
        const acidDamage = averageAcid * deltaSeconds * 0.34;
        const nestDamage = fireDamage + acidDamage;

        if (nestDamage > 0.03) {
          dealNestDamage(nest, nestDamage, fireDamage >= acidDamage ? "burn" : "acid");
        }
      }

      for (let i = ants.length - 1; i >= 0; i -= 1) {
        const ant = ants[i];
        ant.age += deltaSeconds;

        const driftX = Math.sin(now * 0.0017 + ant.seed) * 2.2;
        const driftY = Math.cos(now * 0.0015 + ant.seed * 0.7) * 2.2;
        ant.vx += (rand(-3.6, 3.6) + driftX) * deltaSeconds;
        ant.vy += (rand(-3.2, 3.2) + driftY) * deltaSeconds;

        const awayX = ant.x - ant.homeX;
        const awayY = ant.y - ant.homeY;
        const awayDistance = Math.hypot(awayX, awayY);

        if (ant.age < 3.2 && awayDistance > 0.0001) {
          const outwardUnitX = awayX / awayDistance;
          const outwardUnitY = awayY / awayDistance;
          const outwardStrength = awayDistance < 9 ? (9 - awayDistance) * 0.9 : 0.35;
          ant.vx += outwardUnitX * outwardStrength * deltaSeconds * 7;
          ant.vy += outwardUnitY * outwardStrength * deltaSeconds * 7;
        }

        if (sandwich.hp > 0) {
          const towardX = sandwich.x - ant.x;
          const towardY = sandwich.y - ant.y;
          const towardDistance = Math.hypot(towardX, towardY);

          if (towardDistance > 0.0001) {
            const towardUnitX = towardX / towardDistance;
            const towardUnitY = towardY / towardDistance;
            const seekStrength = clamp(0.8 + towardDistance * 0.085, 0.8, 3.2);

            ant.vx += towardUnitX * seekStrength * deltaSeconds * 2.4;
            ant.vy += towardUnitY * seekStrength * deltaSeconds * 2.4;

            if (towardDistance <= sandwich.radius + 1.2) {
              sandwich.hp = Math.max(0, sandwich.hp - SANDWICH_BITE_DAMAGE_PER_SECOND * deltaSeconds);
              ant.vx *= 0.72;
              ant.vy *= 0.72;
            }
          }
        }

        ant.vx *= 0.992;
        ant.vy *= 0.992;
        ant.vx = clamp(ant.vx, -11, 11);
        ant.vy = clamp(ant.vy, -11, 11);

        ant.x += ant.vx * deltaSeconds;
        ant.y += ant.vy * deltaSeconds;

        if (ant.x <= 1 || ant.x >= GRID_WIDTH - 2) {
          ant.vx *= -0.7;
        }

        if (ant.y <= 1 || ant.y >= GRID_HEIGHT - 2) {
          ant.vy *= -0.7;
        }

        ant.x = clamp(ant.x, 1, GRID_WIDTH - 2);
        ant.y = clamp(ant.y, 1, GRID_HEIGHT - 2);

        const sampleX = clamp(Math.round(ant.x), 0, GRID_WIDTH - 1);
        const sampleY = clamp(Math.round(ant.y), 0, GRID_HEIGHT - 1);
        const index = gridIndex(sampleX, sampleY);

        const fireDamage = fire[index];
        if (fireDamage > 0) {
          ant.burn = Math.max(ant.burn, fireDamage);
          ant.hp -= fireDamage * deltaSeconds * 0.5;
          scorch[index] = Math.max(scorch[index], 90);
        }

        const acidDamage = acid[index];
        if (acidDamage > 0) {
          ant.acid = Math.max(ant.acid, acidDamage);
          ant.hp -= acidDamage * deltaSeconds * 0.5;
        }

        if (ant.burn > 0) {
          ant.burn = Math.max(0, ant.burn - 65 * deltaSeconds);
          ant.hp -= ant.burn * deltaSeconds * 0.13;
        }

        if (ant.acid > 0) {
          ant.acid = Math.max(0, ant.acid - 65 * deltaSeconds);
          ant.hp -= ant.acid * deltaSeconds * 0.13;
        }

        if (ant.hp > 0) {
          continue;
        }

        eliminateAnt(ants, i, ant, ant.burn > ant.acid ? "burn" : "acid");
        scorch[index] = Math.max(scorch[index], 180);
      }

      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const particle = particles[i];
        particle.life -= deltaSeconds;
        particle.x += particle.vx * deltaSeconds;
        particle.y += particle.vy * deltaSeconds;
        particle.vx *= 0.96;
        particle.vy *= 0.96;

        if (particle.life <= 0) {
          particles.splice(i, 1);
        }
      }

      const deathSplats = deathSplatsRef.current;
      for (let i = deathSplats.length - 1; i >= 0; i -= 1) {
        deathSplats[i].life -= deltaSeconds;

        if (deathSplats[i].life <= 0) {
          deathSplats.splice(i, 1);
        }
      }

      const lightning = lightningRef.current;
      for (let i = lightning.length - 1; i >= 0; i -= 1) {
        lightning[i].life -= deltaSeconds;
        if (lightning[i].life <= 0) {
          lightning.splice(i, 1);
        }
      }

      const explosions = explosionsRef.current;
      for (let i = explosions.length - 1; i >= 0; i -= 1) {
        explosions[i].life -= deltaSeconds;
        if (explosions[i].life <= 0) {
          explosions.splice(i, 1);
        }
      }
    };

    const renderFrame = (timestamp: number) => {
      const deltaSeconds = Math.min((timestamp - previousTimestamp) / 1000, 0.05);
      previousTimestamp = timestamp;
      stepSimulation(deltaSeconds, timestamp);
      const renderSnapshot: GameRenderSnapshot = createGameRenderSnapshot({
        acid: acidRef.current,
        ants: antsRef.current,
        deathSplats: deathSplatsRef.current,
        explosions: explosionsRef.current,
        fire: fireRef.current,
        lightning: lightningRef.current,
        nests: nestsRef.current,
        particles: particlesRef.current,
        sandwich: sandwichRef.current,
        scorch: scorchRef.current,
        timeMs: timestamp,
        wave: waveRef.current,
      });

      if (rendererDebugEnabledRef.current) {
        rendererDebugRef.current.frameCount += 1;
        if (timestamp - rendererDebugRef.current.lastReportMs >= 1000) {
          console.debug("[AntGame renderer]", {
            activeRenderer: activeRendererModeRef.current,
            ants: renderSnapshot.ants.length,
            fps: rendererDebugRef.current.frameCount,
            particles: renderSnapshot.particles.length,
            requestedRenderer: requestedRendererModeRef.current,
            wave: renderSnapshot.wave,
          });
          rendererDebugRef.current.frameCount = 0;
          rendererDebugRef.current.lastReportMs = timestamp;
        }
      }

      context.fillStyle = "#6ea44a";
      context.fillRect(0, 0, GRID_WIDTH, GRID_HEIGHT);

      context.fillStyle = "#7eb857";
      for (let y = 0; y < GRID_HEIGHT; y += 2) {
        for (let x = (y / 2) % 2; x < GRID_WIDTH; x += 2) {
          context.fillRect(x, y, 1, 1);
        }
      }

      context.fillStyle = "#5f963f";
      for (let y = 1; y < GRID_HEIGHT; y += 4) {
        for (let x = (y % 3); x < GRID_WIDTH; x += 5) {
          context.fillRect(x, y, 1, 1);
        }
      }

      const fire = fireRef.current;
      const acid = acidRef.current;
      const scorch = scorchRef.current;

      for (let i = 0; i < GRID_SIZE; i += 1) {
        const x = i % GRID_WIDTH;
        const y = Math.floor(i / GRID_WIDTH);

        const soot = scorch[i];
        if (soot > 70) {
          context.fillStyle = "#6d6d6d";
          context.fillRect(x, y, 1, 1);
        } else if (soot > 25) {
          context.fillStyle = "#8f8f8f";
          context.fillRect(x, y, 1, 1);
        }

        const acidValue = acid[i];
        if (acidValue > 120) {
          context.fillStyle = "#2d7f1f";
          context.fillRect(x, y, 1, 1);
        } else if (acidValue > 40) {
          context.fillStyle = "#5dc03b";
          context.fillRect(x, y, 1, 1);
        }

        const fireValue = fire[i];
        if (fireValue > 170) {
          context.fillStyle = "#ffef96";
          context.fillRect(x, y, 1, 1);
        } else if (fireValue > 90) {
          context.fillStyle = "#ff9a2d";
          context.fillRect(x, y, 1, 1);
        } else if (fireValue > 40) {
          context.fillStyle = "#d34d0a";
          context.fillRect(x, y, 1, 1);
        }
      }

      const ants = antsRef.current;
      const blink = Math.floor(timestamp / 80) % 2 === 0;

      const deathSplats = deathSplatsRef.current;
      for (let i = 0; i < deathSplats.length; i += 1) {
        const splat = deathSplats[i];
        const lifeRatio = clamp(splat.life / splat.maxLife, 0, 1);
        const colors = getDeathColors(splat.type);
        const pattern = splatPatterns[splat.patternIndex] ?? splatPatterns[0];
        const baseColor = colors[0] ?? "#202020";
        const midColor = colors[1] ?? baseColor;
        const highlightColor = colors[2] ?? midColor;
        const sparkleColor = colors[3] ?? highlightColor;

        context.fillStyle =
          lifeRatio > 0.66 ? highlightColor : lifeRatio > 0.4 ? midColor : baseColor;

        for (let p = 0; p < pattern.length; p += 1) {
          const point = pattern[p];
          context.fillRect(splat.x + point.x, splat.y + point.y, 1, 1);
        }

        if (lifeRatio > 0.52) {
          context.fillStyle = sparkleColor;
          context.fillRect(splat.x + 1, splat.y + 1, 1, 1);
        }
      }

      const sandwich = sandwichRef.current;
      const sandwichCenterX = Math.round(sandwich.x);
      const sandwichCenterY = Math.round(sandwich.y);
      const sandwichRatio = clamp(sandwich.hp / sandwich.maxHp, 0, 1);

      context.fillStyle = sandwich.hp > 0 ? "#f4cf7a" : "#756f64";
      context.fillRect(sandwichCenterX - 5, sandwichCenterY - 2, 11, 5);
      context.fillStyle = sandwich.hp > 0 ? "#d9ab52" : "#5d5850";
      context.fillRect(sandwichCenterX - 4, sandwichCenterY - 1, 9, 3);
      context.fillStyle = sandwich.hp > 0 ? "#9d5f31" : "#45413c";
      context.fillRect(sandwichCenterX - 3, sandwichCenterY, 7, 1);
      context.fillStyle = sandwich.hp > 0 ? "#6bb15a" : "#5c6858";
      context.fillRect(sandwichCenterX - 2, sandwichCenterY - 1, 5, 1);
      context.fillStyle = sandwich.hp > 0 ? "#bf3f32" : "#5f4f4a";
      context.fillRect(sandwichCenterX - 1, sandwichCenterY, 3, 1);

      const sandwichBarWidth = 18;
      const sandwichBarX = sandwichCenterX - Math.floor(sandwichBarWidth / 2);
      const sandwichBarY = sandwichCenterY - 6;
      const sandwichFilledWidth = Math.max(0, Math.round(sandwichBarWidth * sandwichRatio));
      context.fillStyle = "#1f1f1f";
      context.fillRect(sandwichBarX - 1, sandwichBarY - 1, sandwichBarWidth + 2, 4);
      context.fillStyle = "#2f2f2f";
      context.fillRect(sandwichBarX, sandwichBarY, sandwichBarWidth, 2);
      context.fillStyle = sandwich.hp > 0 ? "#4fbf57" : "#7f4f49";
      context.fillRect(sandwichBarX, sandwichBarY, sandwichFilledWidth, 2);

      const nests = nestsRef.current;
      for (let i = 0; i < nests.length; i += 1) {
        const nest = nests[i];
        const centerX = Math.round(nest.x);
        const centerY = Math.round(nest.y);

        if (!nest.isAlive) {
          context.fillStyle = "#4f4f4f";
          context.fillRect(centerX - 2, centerY - 1, 6, 4);
          context.fillStyle = "#2e2e2e";
          context.fillRect(centerX - 1, centerY, 4, 2);
          context.fillStyle = "#1c1c1c";
          context.fillRect(centerX + 1, centerY + 1, 1, 1);
          continue;
        }

        context.fillStyle = "#8b5c35";
        context.fillRect(centerX - 3, centerY - 2, 8, 6);
        context.fillStyle = "#a36e41";
        context.fillRect(centerX - 2, centerY - 3, 6, 2);
        context.fillStyle = "#5f3a1e";
        context.fillRect(centerX - 1, centerY, 4, 3);
        context.fillStyle = "#2a190d";
        context.fillRect(centerX, centerY + 1, 2, 2);

        const hpRatio = clamp(nest.hp / nest.maxHp, 0, 1);
        const barWidth = 12;
        const barX = centerX - Math.floor(barWidth / 2);
        const barY = centerY - 6;
        const filledWidth = Math.max(0, Math.round(barWidth * hpRatio));

        context.fillStyle = "#1f1f1f";
        context.fillRect(barX - 1, barY - 1, barWidth + 2, 4);
        context.fillStyle = "#2f2f2f";
        context.fillRect(barX, barY, barWidth, 2);
        context.fillStyle = hpRatio > 0.45 ? "#66bb55" : hpRatio > 0.2 ? "#d5b84a" : "#d2623f";
        context.fillRect(barX, barY, filledWidth, 2);
      }

      for (let i = 0; i < ants.length; i += 1) {
        const ant = ants[i];
        const x = Math.round(ant.x);
        const y = Math.round(ant.y);

        context.fillStyle = ant.burn > ant.acid ? "#6f1800" : ant.acid > 40 ? "#315621" : "#1b1b1b";
        context.fillRect(x, y, 1, 1);
        context.fillRect(x + 1, y, 1, 1);
        context.fillRect(x + 1, y + 1, 1, 1);

        context.fillStyle = "#000000";
        context.fillRect(x - 1, y, 1, 1);
        context.fillRect(x + 2, y, 1, 1);
        if (blink) {
          context.fillRect(x, y + 1, 1, 1);
        }

        if (ant.hp < 110) {
          const antHpRatio = clamp(ant.hp / 110, 0, 1);
          const antBarWidth = 3;
          const antBarX = x;
          const antBarY = y - 3;
          const antFilled = Math.max(0, Math.round(antBarWidth * antHpRatio));

          context.fillStyle = "#1f1f1f";
          context.fillRect(antBarX - 1, antBarY - 1, antBarWidth + 2, 3);
          context.fillStyle = "#2f2f2f";
          context.fillRect(antBarX, antBarY, antBarWidth, 1);
          context.fillStyle = antHpRatio > 0.5 ? "#66bb55" : antHpRatio > 0.25 ? "#d5b84a" : "#d2623f";
          context.fillRect(antBarX, antBarY, antFilled, 1);
        }
      }

      const particles = particlesRef.current;
      for (let i = 0; i < particles.length; i += 1) {
        const particle = particles[i];
        context.fillStyle = particle.color;
        context.fillRect(Math.round(particle.x), Math.round(particle.y), particle.size, particle.size);
      }

      const lightning = lightningRef.current;
      for (let i = 0; i < lightning.length; i += 1) {
        const strike = lightning[i];
        context.strokeStyle = strike.life > 0.06 ? "#f9f9f9" : "#b5deff";
        context.lineWidth = 1;
        context.beginPath();
        for (let p = 0; p < strike.points.length; p += 1) {
          const point = strike.points[p];
          if (p === 0) {
            context.moveTo(point.x + 0.5, point.y + 0.5);
          } else {
            context.lineTo(point.x + 0.5, point.y + 0.5);
          }
        }
        context.stroke();
      }

      const explosions = explosionsRef.current;
      for (let i = 0; i < explosions.length; i += 1) {
        const explosion = explosions[i];
        const progress = clamp(1 - explosion.life / 0.28, 0, 1);
        const radius = explosion.radius * progress;
        context.strokeStyle = "#f7ba52";
        context.lineWidth = 1;
        context.beginPath();
        context.arc(explosion.x, explosion.y, radius, 0, Math.PI * 2);
        context.stroke();
      }

      animationFrame = window.requestAnimationFrame(renderFrame);
    };

    animationFrame = window.requestAnimationFrame(renderFrame);

    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  const handleWeaponSelect = (weaponId: WeaponId) => {
    setWeapon(weaponId);
  };

  const handleUnlockWeapon = (weaponId: WeaponId) => {
    const currentProgress = weaponProgressRef.current;
    const state = currentProgress[weaponId];

    if (!state || state.unlocked || !canUnlockWeapon(weaponId, currentProgress)) {
      return;
    }

    const unlockCost = weaponUnlockCost[weaponId];
    if (!spendCoins(unlockCost)) {
      return;
    }

    const nextProgress: Record<WeaponId, WeaponProgress> = {
      ...currentProgress,
      [weaponId]: {
        ...state,
        unlocked: true,
      },
    };

    weaponProgressRef.current = nextProgress;
    setWeaponProgress(nextProgress);
    setWeapon(weaponId);
  };

  const handleUpgradeWeapon = (weaponId: WeaponId, stat: UpgradeStatId) => {
    const currentProgress = weaponProgressRef.current;
    const state = currentProgress[weaponId];

    if (!state || !state.unlocked) {
      return;
    }

    const levelKey = upgradeLevelField[stat];
    const currentLevel = state[levelKey];

    if (currentLevel >= MAX_UPGRADE_LEVEL) {
      return;
    }

    const upgradeCost = getUpgradeCost(weaponId, stat, currentLevel);
    if (!spendCoins(upgradeCost)) {
      return;
    }

    const nextProgress: Record<WeaponId, WeaponProgress> = {
      ...currentProgress,
      [weaponId]: {
        ...state,
        [levelKey]: currentLevel + 1,
      },
    };

    weaponProgressRef.current = nextProgress;
    setWeaponProgress(nextProgress);
  };

  const handleStartNextWave = () => {
    if (!roundBreakRef.current) {
      return;
    }

    const nextWave = nextWaveRef.current;
    if (!nextWave) {
      return;
    }

    beginWave(nextWave, true);
    const nextNests = nestsRef.current;
    const nextSandwich = sandwichRef.current;
    setHud({
      ants: antsRef.current.length,
      coins: coinsRef.current,
      coinPerAnt: currentCoinPerAntRef.current,
      isRoundBreak: false,
      isVictory: false,
      kills: statsRef.current.kills,
      nextWave: Math.min(TOTAL_WAVES, waveRef.current + 1),
      nestsAlive: nextNests.filter((nest) => nest.isAlive).length,
      nestsTotal: nextNests.length,
      sandwichHp: nextSandwich.hp,
      sandwichMaxHp: nextSandwich.maxHp,
      spawnRate: 1 / Math.max(0.001, currentSpawnIntervalRef.current),
      spawned: statsRef.current.spawned,
      wave: waveRef.current,
      waveSpawned: waveSpawnedRef.current,
      waveTimeSeconds: waveElapsedSecondsRef.current,
      wavesTotal: TOTAL_WAVES,
    });
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const activeWeaponProgress = weaponProgressRef.current[weapon];
    if (
      sandwichRef.current.hp <= 0 ||
      victoryRef.current ||
      roundBreakRef.current ||
      !activeWeaponProgress?.unlocked
    ) {
      return;
    }

    const point = canvasPointFromEvent(event);

    if (!point) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    pointerRef.current.x = point.x;
    pointerRef.current.y = point.y;
    pointerRef.current.lastX = point.x;
    pointerRef.current.lastY = point.y;

    if (weapon === "flamethrower" || weapon === "acid" || weapon === "lightning") {
      pointerRef.current.active = true;
    }

    const activeWeaponStats = getWeaponRuntimeStats(activeWeaponProgress);
    const finalSizeScale = getWeaponScale(weaponSizeRef.current) * activeWeaponStats.sizeMultiplier;

    if (weapon === "lightning") {
      castLightning(
        point.x,
        point.y,
        finalSizeScale,
        activeWeaponStats.damageMultiplier,
        activeWeaponStats.speedMultiplier,
      );
    } else if (weapon === "bomb") {
      explodeBomb(
        point.x,
        point.y,
        finalSizeScale,
        activeWeaponStats.damageMultiplier,
        activeWeaponStats.speedMultiplier,
      );
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const point = canvasPointFromEvent(event);

    if (!point) {
      return;
    }

    pointerRef.current.lastX = pointerRef.current.x;
    pointerRef.current.lastY = pointerRef.current.y;
    pointerRef.current.x = point.x;
    pointerRef.current.y = point.y;
  };

  const handlePointerUp = () => {
    pointerRef.current.active = false;
  };

  const resetGame = () => {
    lastWeaponUseRef.current = {
      acid: 0,
      bomb: 0,
      flamethrower: 0,
      lightning: 0,
    };
    statsRef.current = { kills: 0, spawned: 0 };
    beginWave(1, false);
    const nextNests = nestsRef.current;
    const nextSandwich = sandwichRef.current;

    setHud({
      ants: 0,
      coins: coinsRef.current,
      coinPerAnt: currentCoinPerAntRef.current,
      isRoundBreak: false,
      isVictory: false,
      kills: 0,
      nextWave: 2,
      nestsAlive: nextNests.length,
      nestsTotal: nextNests.length,
      sandwichHp: nextSandwich.hp,
      sandwichMaxHp: nextSandwich.maxHp,
      spawnRate: 1 / Math.max(0.001, currentSpawnIntervalRef.current),
      spawned: 0,
      wave: waveRef.current,
      waveSpawned: 0,
      waveTimeSeconds: 0,
      wavesTotal: TOTAL_WAVES,
    });
  };

  const resetRunProgress = () => {
    const freshProgress = createInitialWeaponProgress();
    coinsRef.current = 0;
    weaponProgressRef.current = freshProgress;
    setWeaponProgress(freshProgress);
    setWeapon("flamethrower");
    weaponRef.current = "flamethrower";
    resetGame();
  };

  const activeWeaponLabel =
    weaponOptions.find((option) => option.id === weapon)?.label ?? "Weapon";
  const activeWeaponProgress = weaponProgress[weapon];
  const activeWeaponStats = getWeaponRuntimeStats(activeWeaponProgress);
  const canUnlockActiveWeapon = canUnlockWeapon(weapon, weaponProgress);
  const activeUnlockCost = weaponUnlockCost[weapon];
  const isDefeat = hud.sandwichHp <= 0;
  const isVictory = !isDefeat && hud.isVictory;
  const isRoundBreak = !isDefeat && !isVictory && hud.isRoundBreak;
  const allNestsDestroyed = hud.nestsAlive === 0;
  const isGameFinished = isDefeat || isVictory;
  const objectiveLabel = isRoundBreak
    ? `Wave ${hud.wave} cleared. Spend coins, then start wave ${hud.nextWave}.`
    : isDefeat
      ? "Defeat! The ants ate your sandwich."
      : isVictory
        ? "Victory! You survived every wave."
        : allNestsDestroyed
          ? "Nests destroyed. Eliminate the remaining ants."
          : `Wave ${hud.wave}/${hud.wavesTotal}: destroy all nests quickly.`;
  const upgradeStats: Array<{ id: UpgradeStatId; label: string; valueLabel: string }> = upgradeStatOptions.map(
    (stat) => {
      const value =
        stat.id === "damage"
          ? activeWeaponStats.damageMultiplier
          : stat.id === "size"
            ? activeWeaponStats.sizeMultiplier
            : activeWeaponStats.speedMultiplier;

      return {
        id: stat.id,
        label: stat.label,
        valueLabel: `${Math.round(value * 100)}%`,
      };
    },
  );
  const roundUpgradeRows = weaponOptions.map((option) => {
    const progress = weaponProgress[option.id];
    const runtime = getWeaponRuntimeStats(progress);
    const canUnlock = canUnlockWeapon(option.id, weaponProgress);
    const unlockCost = weaponUnlockCost[option.id];

    return {
      canUnlock,
      id: option.id,
      label: option.label,
      progress,
      runtime,
      unlockCost,
    };
  });
  const rawCanvasScale = Math.min(
    canvasShellSize.width / GRID_WIDTH,
    canvasShellSize.height / GRID_HEIGHT,
  );
  const canvasScale =
    !Number.isFinite(rawCanvasScale) || rawCanvasScale <= 0
      ? 1
      : rawCanvasScale >= 1
        ? Math.max(1, Math.floor(rawCanvasScale))
        : rawCanvasScale;
  const canvasRenderWidth = Math.max(1, Math.round(GRID_WIDTH * canvasScale));
  const canvasRenderHeight = Math.max(1, Math.round(GRID_HEIGHT * canvasScale));

  return (
    <div className="antgame-app">
      <AntGameToolbar
        canUnlockActiveWeapon={canUnlockActiveWeapon}
        activeUnlockCost={activeUnlockCost}
        activeWeaponLabel={activeWeaponLabel}
        activeWeaponProgress={activeWeaponProgress}
        hud={hud}
        onReset={isGameFinished ? resetRunProgress : resetGame}
        onSelectWeapon={handleWeaponSelect}
        onUnlockWeapon={handleUnlockWeapon}
        onUpgradeWeapon={handleUpgradeWeapon}
        weapon={weapon}
        weaponProgress={weaponProgress}
        upgradeStats={upgradeStats}
      />
      <div className="antgame-canvas-shell-wrap">
        <AntGameOverlays
          hud={hud}
          isDefeat={isDefeat}
          isGameFinished={isGameFinished}
          isRoundBreak={isRoundBreak}
          isVictory={isVictory}
          objectiveLabel={objectiveLabel}
          onStartNextWave={handleStartNextWave}
          onUnlockWeapon={handleUnlockWeapon}
          onUpgradeWeapon={handleUpgradeWeapon}
          onResetRunProgress={resetRunProgress}
          roundUpgradeRows={roundUpgradeRows}
        />
        <AntGameStage
          canvasRef={canvasRef}
          canvasRenderHeight={canvasRenderHeight}
          canvasRenderWidth={canvasRenderWidth}
          canvasShellRef={canvasShellRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />
      </div>
    </div>
  );
}

export default AntGameApp;
