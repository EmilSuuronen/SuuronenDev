import {
  COINS_PER_ANT,
  GRID_HEIGHT,
  GRID_WIDTH,
  MAX_NEST_HP,
  MIN_NEST_HP,
  MIN_SPAWN_INTERVAL_SECONDS,
  NEST_MIN_DISTANCE,
  NEST_PADDING,
  SANDWICH_HP,
  SANDWICH_MIN_DISTANCE_FROM_NEST,
  SANDWICH_PADDING,
  SANDWICH_RADIUS,
  TOTAL_WAVES,
} from "./constants";
import type { Ant, DeathType, Nest, NestOptions, Sandwich, WaveRampState, WaveSettings } from "../types";

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export function gridIndex(x: number, y: number) {
  return y * GRID_WIDTH + x;
}

export function createNests(count: number, options?: NestOptions): Nest[] {
  const radiusScale = options?.radiusScale ?? 1;
  const hpScale = options?.hpScale ?? 1;
  const minSpacing = options?.minSpacing ?? NEST_MIN_DISTANCE;
  const avoid = options?.avoid;
  const nests: Nest[] = [];
  let attempts = 0;
  const maxAttempts = count * 360;

  while (nests.length < count && attempts < maxAttempts) {
    attempts += 1;
    const x = rand(NEST_PADDING, GRID_WIDTH - NEST_PADDING);
    const y = rand(NEST_PADDING, GRID_HEIGHT - NEST_PADDING);
    const radius = rand(3.2, 4.6) * radiusScale;
    const overlapsNest = nests.some((nest) => Math.hypot(nest.x - x, nest.y - y) < minSpacing + nest.radius + radius);
    const overlapsAvoid = !!avoid && Math.hypot(avoid.x - x, avoid.y - y) < avoid.radius + avoid.padding + radius;
    if (overlapsNest || overlapsAvoid) continue;
    const maxHp = rand(MIN_NEST_HP, MAX_NEST_HP) * hpScale;
    nests.push({
      hp: maxHp,
      id: `nest-${nests.length}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      isAlive: true,
      maxHp,
      radius,
      x,
      y,
    });
  }

  if (!nests.length) {
    const fallbackX = avoid ? (avoid.x < GRID_WIDTH / 2 ? GRID_WIDTH - NEST_PADDING : NEST_PADDING) : GRID_WIDTH / 2;
    const fallbackY = avoid ? (avoid.y < GRID_HEIGHT / 2 ? GRID_HEIGHT - NEST_PADDING : NEST_PADDING) : GRID_HEIGHT / 2;
    nests.push({
      hp: MIN_NEST_HP * hpScale,
      id: `nest-fallback-${Date.now().toString(36)}`,
      isAlive: true,
      maxHp: MIN_NEST_HP * hpScale,
      radius: 4 * radiusScale,
      x: fallbackX,
      y: fallbackY,
    });
  }

  return nests;
}

export function createSandwich(nests: Nest[]): Sandwich {
  let attempts = 0;
  const maxAttempts = 420;
  const requiredDistance = SANDWICH_RADIUS + SANDWICH_MIN_DISTANCE_FROM_NEST;
  while (attempts < maxAttempts) {
    attempts += 1;
    const x = rand(SANDWICH_PADDING, GRID_WIDTH - SANDWICH_PADDING);
    const y = rand(SANDWICH_PADDING, GRID_HEIGHT - SANDWICH_PADDING);
    const isFarEnough = nests.every((nest) => Math.hypot(nest.x - x, nest.y - y) > nest.radius + requiredDistance);
    if (isFarEnough) return { hp: SANDWICH_HP, maxHp: SANDWICH_HP, radius: SANDWICH_RADIUS, x, y };
  }
  return { hp: SANDWICH_HP, maxHp: SANDWICH_HP, radius: SANDWICH_RADIUS, x: GRID_WIDTH / 2, y: GRID_HEIGHT / 2 };
}

export function getWaveSettings(wave: number): WaveSettings {
  const normalizedWave = Math.max(1, Math.floor(wave));
  const nestTier = Math.floor((normalizedWave - 1) / 5);
  const earlyWaveNestHpMultiplier = normalizedWave <= 3 ? 0.68 + (normalizedWave - 1) * 0.16 : 1;
  return {
    baseMaxAliveAnts: Math.min(6 + (normalizedWave - 1), 28),
    baseSpawnIntervalSeconds: clamp(1.05 - (normalizedWave - 1) * 0.04, 0.34, 1.05),
    nestCount: Math.min(3 + Math.floor((normalizedWave - 1) * 0.75), 9),
    nestHpScale: (1 + (normalizedWave - 1) * 0.07 + nestTier * 0.06) * earlyWaveNestHpMultiplier,
    nestRadiusScale: 1 + nestTier * 0.18,
    rampPerSecond: 0.03 + (normalizedWave - 1) * 0.0025,
  };
}

export function getWaveRamp(settings: WaveSettings, elapsedSeconds: number): WaveRampState {
  const safeElapsed = Math.max(0, elapsedSeconds);
  const rampFactor = 1 + safeElapsed * settings.rampPerSecond;
  const spawnIntervalSeconds = clamp(settings.baseSpawnIntervalSeconds / rampFactor, MIN_SPAWN_INTERVAL_SECONDS, settings.baseSpawnIntervalSeconds);
  const maxAliveAnts = clamp(Math.round(settings.baseMaxAliveAnts * (1 + safeElapsed * 0.022 + (rampFactor - 1) * 0.25)), settings.baseMaxAliveAnts, 280);
  const speedRatio = settings.baseSpawnIntervalSeconds / spawnIntervalSeconds;
  const coinDecayRatio = clamp((speedRatio - 1) / 14, 0, 1);
  const coinPerAnt = Math.max(0, Math.floor(COINS_PER_ANT * (1 - coinDecayRatio)));
  return { coinPerAnt, maxAliveAnts, spawnIntervalSeconds };
}

export function createWaveNests(settings: WaveSettings, sandwichToAvoid: Sandwich | null): Nest[] {
  const minSpacing = Math.max(8, NEST_MIN_DISTANCE - (settings.nestCount - 3) * 1.2 - Math.max(0, settings.nestRadiusScale - 1) * 4);
  return createNests(settings.nestCount, {
    avoid: sandwichToAvoid
      ? { padding: SANDWICH_MIN_DISTANCE_FROM_NEST, radius: sandwichToAvoid.radius, x: sandwichToAvoid.x, y: sandwichToAvoid.y }
      : undefined,
    hpScale: settings.nestHpScale,
    minSpacing,
    radiusScale: settings.nestRadiusScale,
  });
}

export function makeAnt(sourceNest: Nest): Ant {
  const angle = rand(0, Math.PI * 2);
  const spread = rand(0.2, sourceNest.radius + 2.6);
  const x = clamp(sourceNest.x + Math.cos(angle) * spread, 1, GRID_WIDTH - 2);
  const y = clamp(sourceNest.y + Math.sin(angle) * spread, 1, GRID_HEIGHT - 2);
  const pushX = Math.cos(angle) * rand(1.2, 2.6);
  const pushY = Math.sin(angle) * rand(1.2, 2.6);
  return {
    acid: 0,
    age: 0,
    burn: 0,
    homeX: sourceNest.x,
    homeY: sourceNest.y,
    hp: rand(70, 110),
    seed: Math.random() * 1000,
    vx: rand(-1.8, 1.8) + pushX,
    vy: rand(-1.8, 1.8) + pushY,
    x,
    y,
  };
}

export function getDeathColors(type: DeathType) {
  if (type === "burn") return ["#2e1005", "#7e2307", "#ca4b1d", "#f4b469"];
  if (type === "acid") return ["#17310f", "#2c5d1e", "#4e8d2b", "#89d14e"];
  return ["#151515", "#3a3a3a", "#5e5e5e", "#d3d3d3"];
}

export function getWeaponScale(sizePercent: number) {
  return 0.45 + (clamp(sizePercent, 1, 100) / 100) * 1.75;
}

export function clampWave(wave: number) {
  return clamp(Math.floor(wave), 1, TOTAL_WAVES);
}
