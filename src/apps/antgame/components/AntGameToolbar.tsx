import { weaponOptions, weaponUnlockCost } from "../engine/constants";
import { MAX_UPGRADE_LEVEL, getUpgradeCost, upgradeLevelField } from "../engine/upgrades";
import type { HudState, UpgradeStatId, WeaponId, WeaponProgress } from "../types";

type UpgradeStatView = { id: UpgradeStatId; label: string; valueLabel: string };

type Props = {
  canUnlockActiveWeapon: boolean;
  activeUnlockCost: number;
  activeWeaponLabel: string;
  activeWeaponProgress: WeaponProgress;
  hud: HudState;
  onReset: () => void;
  onSelectWeapon: (weaponId: WeaponId) => void;
  onUnlockWeapon: (weaponId: WeaponId) => void;
  onUpgradeWeapon: (weaponId: WeaponId, stat: UpgradeStatId) => void;
  weapon: WeaponId;
  weaponProgress: Record<WeaponId, WeaponProgress>;
  upgradeStats: UpgradeStatView[];
};

function AntGameToolbar({
  canUnlockActiveWeapon,
  activeUnlockCost,
  activeWeaponLabel,
  activeWeaponProgress,
  hud,
  onReset,
  onSelectWeapon,
  onUnlockWeapon,
  onUpgradeWeapon,
  weapon,
  weaponProgress,
  upgradeStats,
}: Props) {
  const stats = [
    { label: `Coins: ${hud.coins}`, primary: true },
    { label: `Wave: ${hud.wave}/${hud.wavesTotal}`, primary: true },
    { label: `Ants: ${hud.ants}`, primary: true },
    { label: `Nests: ${hud.nestsAlive}/${hud.nestsTotal}`, primary: true },
    { label: `Sandwich: ${Math.round((hud.sandwichHp / Math.max(1, hud.sandwichMaxHp)) * 100)}%`, primary: true },
    { label: `Rate: ${hud.spawnRate.toFixed(1)}/s`, primary: false },
    { label: `Ant Value: ${hud.coinPerAnt}`, primary: false },
    { label: `Time: ${hud.waveTimeSeconds.toFixed(1)}s`, primary: false },
    { label: `Spawned: ${hud.waveSpawned}`, primary: false },
    { label: `Eliminated: ${hud.kills}`, primary: false },
    { label: `Total Spawned: ${hud.spawned}`, primary: false },
  ];

  return (
    <div className="antgame-toolbar">
      <div className="antgame-weapon-group" role="toolbar" aria-label="Weapons">
        {weaponOptions.map((option) => (
          <button
            key={option.id}
            className={`antgame-weapon-button${weapon === option.id ? " is-active" : ""}${weaponProgress[option.id].unlocked ? "" : " is-locked"}`}
            type="button"
            onClick={() => onSelectWeapon(option.id)}
          >
            {weaponProgress[option.id].unlocked ? option.label : `${option.label} (Locked)`}
          </button>
        ))}
      </div>

      <div className="antgame-toolbar-stats">
        {stats.map((item) => (
          <span
            key={item.label}
            className={item.primary ? "antgame-stat-chip antgame-stat-chip--primary" : "antgame-stat-chip antgame-stat-chip--secondary"}
          >
            {item.label}
          </span>
        ))}
      </div>

      <button className="antgame-reset-button" type="button" onClick={onReset}>
        Clear Canvas
      </button>

      <div className={`antgame-upgrade-panel antgame-upgrade-panel--${weapon}`}>
        {!activeWeaponProgress.unlocked ? (
          <div className="antgame-upgrade-lock">
            <span>{canUnlockActiveWeapon ? `Unlock ${activeWeaponLabel} for ${activeUnlockCost} coins` : "Unlock the previous weapon first"}</span>
            <button
              className={`antgame-upgrade-button antgame-upgrade-weapon--${weapon}`}
              type="button"
              disabled={!canUnlockActiveWeapon || hud.coins < activeUnlockCost}
              onClick={() => onUnlockWeapon(weapon)}
            >
              Unlock
            </button>
          </div>
        ) : (
          <div className="antgame-upgrade-grid">
            {upgradeStats.map((stat) => {
              const levelKey = upgradeLevelField[stat.id];
              const currentLevel = activeWeaponProgress[levelKey];
              const atMax = currentLevel >= MAX_UPGRADE_LEVEL;
              const nextCost = atMax ? 0 : getUpgradeCost(weapon, stat.id, currentLevel);
              return (
                <button
                  key={stat.id}
                  className={`antgame-upgrade-button antgame-upgrade-weapon--${weapon} antgame-upgrade-stat--${stat.id}`}
                  type="button"
                  disabled={atMax || hud.coins < nextCost}
                  onClick={() => onUpgradeWeapon(weapon, stat.id)}
                >
                  {stat.label} L{currentLevel}
                  <span>{stat.valueLabel}</span>
                  <span>{atMax ? "MAX" : `${nextCost} coins`}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default AntGameToolbar;
