import { GRID_HEIGHT, GRID_WIDTH, splatPatterns } from "../../engine/constants";
import { clamp, getDeathColors } from "../../engine/world";
import { createPixelBatch, type Rgba } from "./pixelBatch";

import type { GameRenderSnapshot } from "../../types";
import type { OGLRenderingContext, Transform } from "ogl";

const FIELD_RECTS = GRID_WIDTH * GRID_HEIGHT;
const FOREGROUND_RECTS = 6000;

function hexToRgba(hex: string, alpha = 1): Rgba {
  const normalized = hex.replace("#", "");
  const value = Number.parseInt(normalized, 16);
  return [
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255,
    alpha,
  ];
}

const colors = {
  acidA: [0.18, 0.5, 0.12, 1] as Rgba,
  acidB: [0.36, 0.75, 0.23, 1] as Rgba,
  explosion: [0.97, 0.73, 0.32, 1] as Rgba,
  fireA: [0.83, 0.3, 0.04, 1] as Rgba,
  fireB: [1, 0.6, 0.18, 1] as Rgba,
  fireC: [1, 0.94, 0.59, 1] as Rgba,
  lightningA: [0.98, 0.98, 0.98, 1] as Rgba,
  lightningB: [0.71, 0.87, 1, 1] as Rgba,
  scorchA: [0.43, 0.43, 0.43, 1] as Rgba,
  scorchB: [0.56, 0.56, 0.56, 1] as Rgba,
};

function pushLine(batch: ReturnType<typeof createPixelBatch>, ax: number, ay: number, bx: number, by: number, color: Rgba) {
  const steps = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay)));

  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    batch.pushRect(Math.round(ax + (bx - ax) * t), Math.round(ay + (by - ay) * t), 1, 1, color);
  }
}

function pushCircleOutline(batch: ReturnType<typeof createPixelBatch>, cx: number, cy: number, radius: number, color: Rgba) {
  const steps = Math.max(14, Math.ceil(radius * 6));
  let previousX = cx + radius;
  let previousY = cy;

  for (let i = 1; i <= steps; i += 1) {
    const angle = (i / steps) * Math.PI * 2;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    pushLine(batch, previousX, previousY, x, y, color);
    previousX = x;
    previousY = y;
  }
}

export function createEffectPass(
  gl: OGLRenderingContext,
  underlayScene: Transform,
  overlayScene: Transform,
) {
  const underlay = createPixelBatch(gl, underlayScene, FIELD_RECTS + 1800);
  const overlay = createPixelBatch(gl, overlayScene, FOREGROUND_RECTS);

  const renderFields = (snapshot: GameRenderSnapshot) => {
    for (let i = 0; i < snapshot.scorch.length; i += 1) {
      const x = i % GRID_WIDTH;
      const y = Math.floor(i / GRID_WIDTH);
      const soot = snapshot.scorch[i];
      const acid = snapshot.acid[i];
      const fire = snapshot.fire[i];

      if (soot > 70) underlay.pushRect(x, y, 1, 1, colors.scorchA);
      else if (soot > 25) underlay.pushRect(x, y, 1, 1, colors.scorchB);

      if (acid > 120) underlay.pushRect(x, y, 1, 1, colors.acidA);
      else if (acid > 40) underlay.pushRect(x, y, 1, 1, colors.acidB);

      if (fire > 170) underlay.pushRect(x, y, 1, 1, colors.fireC);
      else if (fire > 90) underlay.pushRect(x, y, 1, 1, colors.fireB);
      else if (fire > 40) underlay.pushRect(x, y, 1, 1, colors.fireA);
    }
  };

  const renderDeathSplats = (snapshot: GameRenderSnapshot) => {
    snapshot.deathSplats.forEach((splat) => {
      const lifeRatio = clamp(splat.life / splat.maxLife, 0, 1);
      const deathColors = getDeathColors(splat.type);
      const pattern = splatPatterns[splat.patternIndex] ?? splatPatterns[0];
      const baseColor = hexToRgba(deathColors[0] ?? "#202020");
      const midColor = hexToRgba(deathColors[1] ?? deathColors[0] ?? "#202020");
      const highlightColor = hexToRgba(deathColors[2] ?? deathColors[1] ?? "#202020");
      const sparkleColor = hexToRgba(deathColors[3] ?? deathColors[2] ?? "#202020");
      const color = lifeRatio > 0.66 ? highlightColor : lifeRatio > 0.4 ? midColor : baseColor;

      pattern.forEach((point) => underlay.pushRect(splat.x + point.x, splat.y + point.y, 1, 1, color));
      if (lifeRatio > 0.52) underlay.pushRect(splat.x + 1, splat.y + 1, 1, 1, sparkleColor);
    });
  };

  const renderForeground = (snapshot: GameRenderSnapshot) => {
    snapshot.particles.forEach((particle) => {
      overlay.pushRect(
        Math.round(particle.x),
        Math.round(particle.y),
        particle.size,
        particle.size,
        hexToRgba(particle.color),
      );
    });

    snapshot.lightning.forEach((strike) => {
      const color = strike.life > 0.06 ? colors.lightningA : colors.lightningB;
      for (let i = 1; i < strike.points.length; i += 1) {
        const previous = strike.points[i - 1];
        const current = strike.points[i];
        pushLine(overlay, previous.x, previous.y, current.x, current.y, color);
      }
    });

    snapshot.explosions.forEach((explosion) => {
      const progress = clamp(1 - explosion.life / 0.28, 0, 1);
      pushCircleOutline(overlay, explosion.x, explosion.y, explosion.radius * progress, colors.explosion);
    });
  };

  return {
    dispose() {
      underlay.dispose();
      overlay.dispose();
    },
    render(snapshot: GameRenderSnapshot) {
      underlay.clear();
      overlay.clear();
      renderFields(snapshot);
      renderDeathSplats(snapshot);
      renderForeground(snapshot);
      underlay.upload();
      overlay.upload();
    },
  };
}
