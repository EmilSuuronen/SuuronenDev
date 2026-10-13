import { upgradeStatOptions } from "../engine/constants";
import { MAX_UPGRADE_LEVEL, getUpgradeCost, upgradeLevelField } from "../engine/upgrades";
import type { HudState, UpgradeStatId, WeaponId, WeaponProgress } from "../types";

type RoundUpgradeRow = {
  canUnlock: boolean;
  id: WeaponId;
  label: string;
  progress: WeaponProgress;
  runtime: { damageMultiplier: number; sizeMultiplier: number; speedMultiplier: number };
  unlockCost: number;
};

type Props = {
  hud: HudState;
  isDefeat: boolean;
  isGameFinished: boolean;
  isRoundBreak: boolean;
  isVictory: boolean;
  objectiveLabel: string;
  onStartNextWave: () => void;
  onUnlockWeapon: (weaponId: WeaponId) => void;
  onUpgradeWeapon: (weaponId: WeaponId, stat: UpgradeStatId) => void;
  onResetRunProgress: () => void;
  roundUpgradeRows: RoundUpgradeRow[];
};

function AntGameOverlays({
  hud,
  isDefeat,
  isGameFinished,
  isRoundBreak,
  isVictory,
  objectiveLabel,
  onStartNextWave,
  onUnlockWeapon,
  onUpgradeWeapon,
  onResetRunProgress,
  roundUpgradeRows,
}: Props) {
  return (
    <>
      {!isGameFinished ? (
        <div className={`antgame-objective${isVictory ? " is-victory" : ""}${isDefeat ? " is-defeat" : ""}`}>{objectiveLabel}</div>
      ) : null}
      {isRoundBreak ? (
        <div className="antgame-roundscreen" role="dialog" aria-modal="true">
          <h2 className="antgame-endscreen-title">Wave {hud.wave} Cleared</h2>
          <p className="antgame-endscreen-text">
            Upgrade before wave {hud.nextWave}. Spawn pressure rises over time and ant value drops to zero if you stall.
          </p>
          <div className="antgame-roundscreen-grid">
            {roundUpgradeRows.map((row) => (
              <section key={row.id} className={`antgame-round-weapon antgame-round-weapon--${row.id}`}>
                <h3 className="antgame-round-weapon-title">{row.label}</h3>
                {!row.progress.unlocked ? (
                  <button
                    className={`antgame-upgrade-button antgame-round-button antgame-upgrade-weapon--${row.id}`}
                    type="button"
                    disabled={!row.canUnlock || hud.coins < row.unlockCost}
                    onClick={() => onUnlockWeapon(row.id)}
                  >
                    Unlock
                    <span>{row.canUnlock ? `${row.unlockCost} coins` : "Unlock previous first"}</span>
                  </button>
                ) : (
                  <div className="antgame-round-upgrades">
                    {upgradeStatOptions.map((stat) => {
                      const levelKey = upgradeLevelField[stat.id];
                      const currentLevel = row.progress[levelKey];
                      const atMax = currentLevel >= MAX_UPGRADE_LEVEL;
                      const nextCost = atMax ? 0 : getUpgradeCost(row.id, stat.id, currentLevel);
                      const currentValue =
                        stat.id === "damage" ? row.runtime.damageMultiplier : stat.id === "size" ? row.runtime.sizeMultiplier : row.runtime.speedMultiplier;
                      return (
                        <button
                          key={`${row.id}-${stat.id}`}
                          className={`antgame-upgrade-button antgame-round-button antgame-upgrade-weapon--${row.id} antgame-upgrade-stat--${stat.id}`}
                          type="button"
                          disabled={atMax || hud.coins < nextCost}
                          onClick={() => onUpgradeWeapon(row.id, stat.id)}
                        >
                          {stat.label} L{currentLevel}
                          <span>{Math.round(currentValue * 100)}%</span>
                          <span>{atMax ? "MAX" : `${nextCost} coins`}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
            ))}
          </div>
          <button className="antgame-endscreen-button" type="button" onClick={onStartNextWave}>
            Start Wave {hud.nextWave}
          </button>
        </div>
      ) : null}
      {isGameFinished ? (
        <div className={`antgame-endscreen${isVictory ? " is-victory" : " is-defeat"}`} role="alert">
          <h2 className="antgame-endscreen-title">{isVictory ? "Victory" : "Game Over"}</h2>
          <p className="antgame-endscreen-text">
            {isVictory ? "All waves cleared. Every nest is destroyed and no ants remain." : `The ants consumed your sandwich on wave ${hud.wave}.`}
          </p>
          <button className="antgame-endscreen-button" type="button" onClick={onResetRunProgress}>
            Play Again
          </button>
        </div>
      ) : null}
    </>
  );
}

export default AntGameOverlays;
