import type { UpgradeLevelKey, UpgradeStatId, WeaponId } from "../types";

export const GRID_WIDTH = 176;
export const GRID_HEIGHT = 108;
export const GRID_SIZE = GRID_WIDTH * GRID_HEIGHT;
export const MAX_ANTS = 280;
export const MAX_DEATH_SPLATS = 260;
export const TOTAL_WAVES = 15;
export const NEST_PADDING = 14;
export const NEST_MIN_DISTANCE = 20;
export const MIN_NEST_HP = 340;
export const MAX_NEST_HP = 520;
export const SANDWICH_PADDING = 16;
export const SANDWICH_MIN_DISTANCE_FROM_NEST = 34;
export const SANDWICH_RADIUS = 5.5;
export const SANDWICH_HP = 1200;
export const SANDWICH_BITE_DAMAGE_PER_SECOND = 10;
export const COINS_PER_ANT = 9;
export const MAX_UPGRADE_LEVEL = 8;
export const LIGHTNING_BASE_COOLDOWN_MS = 760;
export const BOMB_BASE_COOLDOWN_MS = 560;
export const FLAME_BASE_TICK_MS = 76;
export const ACID_BASE_TICK_MS = 92;
export const MIN_SPAWN_INTERVAL_SECONDS = 0.085;
export const MIN_EFFECTIVE_SPAWN_INTERVAL_SECONDS = 0.05;

export const splatPatterns: Array<Array<{ x: number; y: number }>> = [
  [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 2 }, { x: 2, y: 2 }],
  [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 2 }],
  [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 2 }],
  [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 2 }, { x: 0, y: 2 }],
];

export const weaponOptions: Array<{ id: WeaponId; label: string }> = [
  { id: "flamethrower", label: "Flamethrower" },
  { id: "acid", label: "Acid" },
  { id: "bomb", label: "Explosion Bomb" },
  { id: "lightning", label: "Lightning" },
];

export const weaponUnlockOrder: WeaponId[] = ["flamethrower", "acid", "bomb", "lightning"];

export const weaponUnlockCost: Record<WeaponId, number> = {
  flamethrower: 0,
  acid: 200,
  bomb: 430,
  lightning: 780,
};

export const weaponCostMultiplier: Record<WeaponId, number> = {
  flamethrower: 1,
  acid: 1.14,
  bomb: 1.38,
  lightning: 1.58,
};

export const baseUpgradeCost: Record<UpgradeStatId, number> = {
  damage: 60,
  size: 45,
  speed: 68,
};

export const upgradeLevelField: Record<UpgradeStatId, UpgradeLevelKey> = {
  damage: "damageLevel",
  size: "sizeLevel",
  speed: "speedLevel",
};

export const upgradeStatOptions: Array<{ id: UpgradeStatId; label: string }> = [
  { id: "damage", label: "Damage" },
  { id: "size", label: "Size" },
  { id: "speed", label: "Attack Speed" },
];
