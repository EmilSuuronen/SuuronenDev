import type {
  Ant,
  DeathSplat,
  Explosion,
  GameRenderSnapshot,
  LightningStrike,
  Nest,
  Particle,
  Sandwich,
} from "../types";

type CreateGameRenderSnapshotInput = {
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

export function createGameRenderSnapshot({
  acid,
  ants,
  deathSplats,
  explosions,
  fire,
  lightning,
  nests,
  particles,
  sandwich,
  scorch,
  timeMs,
  wave,
}: CreateGameRenderSnapshotInput): GameRenderSnapshot {
  return {
    acid,
    ants,
    deathSplats,
    explosions,
    fire,
    lightning,
    nests,
    particles,
    sandwich,
    scorch,
    timeMs,
    wave,
  };
}
