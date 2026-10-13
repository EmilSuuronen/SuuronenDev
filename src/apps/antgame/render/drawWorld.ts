import { clamp, getDeathColors } from "../engine/world";
import type { Ant, DeathSplat, Explosion, LightningStrike, Nest, Particle, Sandwich } from "../types";
import { ART_SCALE, type Rgba, type SpriteBatch } from "./renderer";
import type { SpriteName } from "./sprites";

export type WorldSnapshot = {
  ants: Ant[];
  deathSplats: DeathSplat[];
  explosions: Explosion[];
  lightning: LightningStrike[];
  nests: Nest[];
  particles: Particle[];
  sandwich: Sandwich;
  timeSeconds: number;
};

const S = ART_SCALE;
const colorCache = new Map<string, Rgba>();

function rgba(hex: string, alpha = 1): Rgba {
  const key = `${hex}/${alpha}`;
  let color = colorCache.get(key);
  if (!color) {
    const value = Number.parseInt(hex.slice(1), 16);
    color = [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255, alpha];
    colorCache.set(key, color);
  }
  return color;
}

const SHADOW = rgba("#0b1f08", 0.32);
const BAR_BACK = rgba("#1a120c");
const BAR_EMPTY = rgba("#4a3a2c");
const BURN = rgba("#ff7a2a");
const ACID = rgba("#8ee04a");
const LIGHTNING_CORE = rgba("#ffffff");
const LIGHTNING_GLOW = rgba("#8fd3ff", 0.75);
const EXPLOSION_RING = rgba("#f7ba52");
const EXPLOSION_HOT = rgba("#fff1c4");
const splatSprites: SpriteName[] = ["splatA", "splatB", "splatC"];

function healthBar(batch: SpriteBatch, centerX: number, top: number, width: number, ratio: number, fill: Rgba) {
  const x = Math.round(centerX - width / 2);
  batch.rect(x, top, width, 4, BAR_BACK);
  batch.rect(x + 1, top + 1, width - 2, 2, BAR_EMPTY);
  const filled = Math.round((width - 2) * clamp(ratio, 0, 1));
  if (filled > 0) batch.rect(x + 1, top + 1, filled, 2, fill);
}

function centered(batch: SpriteBatch, name: SpriteName, centerX: number, centerY: number, rotation = 0, color?: Rgba, mix?: number) {
  const f = batch.frame(name);
  const odd = rotation % 2 === 1;
  batch.sprite(name, centerX - (odd ? f.h : f.w) / 2, centerY - (odd ? f.w : f.h) / 2, rotation, color, mix);
}

// Bresenham line in art pixels with a soft glow on both sides.
function lightningBolt(batch: SpriteBatch, x0: number, y0: number, x1: number, y1: number) {
  let x = Math.round(x0);
  let y = Math.round(y0);
  const tx = Math.round(x1);
  const ty = Math.round(y1);
  const dx = Math.abs(tx - x);
  const dy = -Math.abs(ty - y);
  const sx = x < tx ? 1 : -1;
  const sy = y < ty ? 1 : -1;
  let error = dx + dy;
  for (let guard = 0; guard < 2048; guard += 1) {
    batch.rect(x - 1, y, 3, 1, LIGHTNING_GLOW);
    batch.rect(x, y, 1, 1, LIGHTNING_CORE);
    if (x === tx && y === ty) break;
    const e2 = 2 * error;
    if (e2 >= dy) {
      error += dy;
      x += sx;
    }
    if (e2 <= dx) {
      error += dx;
      y += sy;
    }
  }
}

// Midpoint circle outline, two pixels thick.
function ring(batch: SpriteBatch, cx: number, cy: number, radius: number, color: Rgba) {
  let x = Math.round(radius);
  let y = 0;
  let error = 1 - x;
  while (x >= y) {
    for (const [px, py] of [
      [x, y], [y, x], [-y, x], [-x, y], [-x, -y], [-y, -x], [y, -x], [x, -y],
    ]) {
      batch.rect(cx + px - 1, cy + py - 1, 2, 2, color);
    }
    y += 1;
    if (error < 0) {
      error += 2 * y + 1;
    } else {
      x -= 1;
      error += 2 * (y - x) + 1;
    }
  }
}

export function drawWorld(batch: SpriteBatch, world: WorldSnapshot) {
  const { ants, deathSplats, explosions, lightning, nests, particles, sandwich, timeSeconds } = world;

  for (const splat of deathSplats) {
    const lifeRatio = clamp(splat.life / splat.maxLife, 0, 1);
    const colors = getDeathColors(splat.type);
    const tone = lifeRatio > 0.66 ? colors[2] : lifeRatio > 0.4 ? colors[1] : colors[0];
    centered(
      batch,
      splatSprites[splat.patternIndex % splatSprites.length],
      (splat.x + 1.5) * S,
      (splat.y + 1.5) * S,
      splat.patternIndex % 4,
      rgba(tone, clamp(lifeRatio * 4, 0, 1)),
    );
  }

  // ground-level shadows first so nothing casts onto its neighbors' bodies
  for (const nest of nests) centered(batch, "shadowLarge", nest.x * S + 1, nest.y * S + 9, 0, SHADOW);
  centered(batch, "shadowLarge", sandwich.x * S + 2, sandwich.y * S + 8, 0, SHADOW);
  for (const ant of ants) centered(batch, "shadowSmall", ant.x * S + 1, ant.y * S + 3, 0, SHADOW);

  for (const nest of nests) {
    const cx = nest.x * S;
    const cy = nest.y * S;
    if (!nest.isAlive) {
      centered(batch, "anthillRuin", cx, cy);
      continue;
    }
    const ratio = nest.hp / nest.maxHp;
    centered(batch, ratio > 0.5 ? "anthill" : "anthillCracked", cx, cy);
    healthBar(batch, cx, cy - 15, 24, ratio, rgba(ratio > 0.45 ? "#66bb55" : ratio > 0.2 ? "#d5b84a" : "#d2623f"));
  }

  const sandwichRatio = sandwich.hp / sandwich.maxHp;
  const sandwichSprite: SpriteName =
    sandwich.hp <= 0 ? "sandwichCrumbs" : sandwichRatio > 0.66 ? "sandwich" : sandwichRatio > 0.33 ? "sandwichBitten" : "sandwichEaten";
  centered(batch, sandwichSprite, sandwich.x * S, sandwich.y * S);
  if (sandwich.hp > 0) healthBar(batch, sandwich.x * S, sandwich.y * S - 14, 30, sandwichRatio, rgba("#4fbf57"));

  for (const ant of ants) {
    // face the travel direction in quarter turns: 0 east, 1 south, 2 west, 3 north
    const rotation = Math.abs(ant.vx) >= Math.abs(ant.vy) ? (ant.vx >= 0 ? 0 : 2) : ant.vy >= 0 ? 1 : 3;
    const step = Math.floor(timeSeconds * 9 + ant.seed) % 2 === 0;
    const status = ant.burn > ant.acid ? ant.burn : ant.acid;
    const tint = ant.burn > ant.acid ? BURN : ACID;
    centered(
      batch,
      step ? "antEastA" : "antEastB",
      ant.x * S,
      ant.y * S,
      rotation,
      status > 0 ? tint : undefined,
      status > 0 ? clamp(status / 240, 0, 1) * 0.6 : 0,
    );
  }

  for (const particle of particles) {
    const size = particle.size * 2;
    batch.rect(particle.x * S - size / 2, particle.y * S - size / 2, size, size, rgba(particle.color));
  }

  for (const strike of lightning) {
    for (let i = 1; i < strike.points.length; i += 1) {
      const a = strike.points[i - 1];
      const b = strike.points[i];
      lightningBolt(batch, (a.x + 0.5) * S, (a.y + 0.5) * S, (b.x + 0.5) * S, (b.y + 0.5) * S);
    }
  }

  for (const explosion of explosions) {
    const progress = clamp(1 - explosion.life / 0.28, 0, 1);
    ring(batch, Math.round(explosion.x * S), Math.round(explosion.y * S), explosion.radius * S * progress, progress < 0.35 ? EXPLOSION_HOT : EXPLOSION_RING);
  }
}
