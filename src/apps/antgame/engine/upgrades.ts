import {
  baseUpgradeCost,
  MAX_UPGRADE_LEVEL,
  upgradeLevelField,
  weaponCostMultiplier,
  weaponUnlockOrder,
} from "./constants";
import { clamp } from "./world";
import type { UpgradeStatId, WeaponId, WeaponProgress, WeaponRuntimeStats } from "../types";

export function createInitialWeaponProgress(): Record<WeaponId, WeaponProgress> {
  return {
    flamethrower: { damageLevel: 1, sizeLevel: 1, speedLevel: 1, unlocked: true },
    acid: { damageLevel: 1, sizeLevel: 1, speedLevel: 1, unlocked: false },
    bomb: { damageLevel: 1, sizeLevel: 1, speedLevel: 1, unlocked: false },
    lightning: { damageLevel: 1, sizeLevel: 1, speedLevel: 1, unlocked: false },
  };
}

export function getWeaponRuntimeStats(progress: WeaponProgress): WeaponRuntimeStats {
  return {
    damageMultiplier: 1 + (progress.damageLevel - 1) * 0.23,
    sizeMultiplier: 1 + (progress.sizeLevel - 1) * 0.12,
    speedMultiplier: 1 + (progress.speedLevel - 1) * 0.18,
  };
}

export function getUpgradeCost(weapon: WeaponId, stat: UpgradeStatId, currentLevel: number) {
  const boundedLevel = clamp(currentLevel, 1, MAX_UPGRADE_LEVEL);
  const progressionScale = 1 + (boundedLevel - 1) * 0.62;
  return Math.round(baseUpgradeCost[stat] * weaponCostMultiplier[weapon] * progressionScale);
}

export function canUnlockWeapon(weapon: WeaponId, progressByWeapon: Record<WeaponId, WeaponProgress>) {
  const unlockIndex = weaponUnlockOrder.indexOf(weapon);
  if (unlockIndex <= 0) return true;
  const previousWeapon = weaponUnlockOrder[unlockIndex - 1];
  if (!previousWeapon) return true;
  return progressByWeapon[previousWeapon].unlocked;
}

export { MAX_UPGRADE_LEVEL, upgradeLevelField };
