export type WeaponId = "flamethrower" | "lightning" | "acid" | "bomb";
export type RendererMode = "canvas2d" | "ogl";

export type Ant = {
  acid: number;
  age: number;
  burn: number;
  homeX: number;
  homeY: number;
  hp: number;
  seed: number;
  vx: number;
  vy: number;
  x: number;
  y: number;
};

export type Particle = {
  color: string;
  life: number;
  size: 1 | 2;
  vx: number;
  vy: number;
  x: number;
  y: number;
};

export type LightningStrike = {
  life: number;
  points: Array<{ x: number; y: number }>;
};

export type Explosion = {
  life: number;
  radius: number;
  x: number;
  y: number;
};

export type DeathType = "burn" | "acid" | "impact";

export type DeathSplat = {
  life: number;
  maxLife: number;
  patternIndex: number;
  type: DeathType;
  x: number;
  y: number;
};

export type Nest = {
  hp: number;
  id: string;
  isAlive: boolean;
  maxHp: number;
  radius: number;
  x: number;
  y: number;
};

export type Sandwich = {
  hp: number;
  maxHp: number;
  radius: number;
  x: number;
  y: number;
};

export type NestOptions = {
  avoid?: {
    padding: number;
    radius: number;
    x: number;
    y: number;
  };
  hpScale?: number;
  minSpacing?: number;
  radiusScale?: number;
};

export type WaveSettings = {
  baseMaxAliveAnts: number;
  baseSpawnIntervalSeconds: number;
  nestCount: number;
  nestHpScale: number;
  nestRadiusScale: number;
  rampPerSecond: number;
};

export type WaveRampState = {
  coinPerAnt: number;
  maxAliveAnts: number;
  spawnIntervalSeconds: number;
};

export type UpgradeStatId = "damage" | "size" | "speed";
export type UpgradeLevelKey = "damageLevel" | "sizeLevel" | "speedLevel";

export type WeaponProgress = {
  damageLevel: number;
  sizeLevel: number;
  speedLevel: number;
  unlocked: boolean;
};

export type WeaponRuntimeStats = {
  damageMultiplier: number;
  sizeMultiplier: number;
  speedMultiplier: number;
};

export type HudState = {
  ants: number;
  coinPerAnt: number;
  coins: number;
  isRoundBreak: boolean;
  isVictory: boolean;
  kills: number;
  nestsAlive: number;
  nestsTotal: number;
  nextWave: number;
  sandwichHp: number;
  sandwichMaxHp: number;
  spawnRate: number;
  spawned: number;
  wave: number;
  waveSpawned: number;
  waveTimeSeconds: number;
  wavesTotal: number;
};

export type GameRenderSnapshot = {
  acid: Uint8Array;
  ants: Ant[];
  deathSplats: DeathSplat[];
  explosions: Explosion[];
  fire: Uint8Array;
  lightning: LightningStrike[];
  nests: Nest[];
  particles: Particle[];
  sandwich: Sandwich;
  scorch: Uint8Array;
  timeMs: number;
  wave: number;
};
