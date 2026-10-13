# Ant Exterminator: Game Design Document

| | |
|---|---|
| Version | 0.1 (first full draft) |
| Status | Design proposal; nothing here is implemented yet unless marked **(exists)** |
| Working title | Ant Exterminator (see [Open questions](#19-open-questions)) |
| Genre | Pixel-art tower-defense roguelite with an active hand-held tool |
| Platforms | Web (embedded in suuronen.dev) → Desktop (Steam) → Mobile (iOS/Android) |
| Session | One run = 9–14 minutes; meta progression across runs |

**Conventions used throughout**

- **cell**: one unit of the simulation grid. The play field is **176 × 108 cells** **(exists)**.
- **art px**: one pixel of the art canvas. **1 cell = 4 art px**; the art canvas is **704 × 432** **(exists)**.
- Speeds are in cells/second, times in seconds, damage per hit unless marked DPS.
- `w` = wave number within a biome (1–10), `b` = biome index (1–5), `h` = Heat level (0–10).
- All numbers are first-pass balance targets. Section 9 explains how they get tuned.

---

## Contents

1. [Vision and pillars](#1-vision-and-pillars)
2. [Core loops](#2-core-loops)
3. [Run structure](#3-run-structure)
4. [Maps, trails and pathing](#4-maps-trails-and-pathing)
5. [Combat model](#5-combat-model)
6. [Enemies](#6-enemies)
7. [Bosses](#7-bosses)
8. [Player arsenal: tools and defenses](#8-player-arsenal-tools-and-defenses)
9. [Difficulty, economy and balancing](#9-difficulty-economy-and-balancing)
10. [Persistent progression and the skill tree](#10-persistent-progression-and-the-skill-tree)
11. [Biomes and environmental objects](#11-biomes-and-environmental-objects)
12. [Visual design](#12-visual-design)
13. [UI and UX](#13-ui-and-ux)
14. [Audio](#14-audio)
15. [Technical architecture](#15-technical-architecture)
16. [Platforms and release](#16-platforms-and-release)
17. [Migration from the current prototype](#17-migration-from-the-current-prototype)
18. [Milestones](#18-milestones)
19. [Open questions](#19-open-questions)

---

## 1. Vision and pillars

**Pitch.** You are the last line of defense between a picnic sandwich and an endless colony. Ants march along winding trails through backyards, parks and kitchens. Swat them with a newspaper, slam a hammer, focus sunlight through a magnifying glass, build mousetraps and bug zappers along the trails, and grow a huge persistent skill tree until you can torch a whole army with a flamethrower.

**Pillars** (every feature must serve at least one; a feature that hurts one needs a strong reason):

1. **Readable chaos.** Hundreds of ants on screen, yet the player can always see what's dangerous, what's about to happen and what their tools do. Silhouettes, colors and telegraphs over text.
2. **Tools you can feel.** Every tool has a distinct verb (swat, slam, suck, burn, freeze, blow) with weight: hit-stop, screen shake, sound and splats.
3. **Every run grows the tree.** Even a failed run pays out seeds. The first hour unlocks something almost every run.
4. **Short, tight sessions.** One run fits in a coffee break. No run lasts more than about 15 minutes, and quitting mid-run is safe (autosave between waves).
5. **No words needed.** The game is playable without reading. Text is optional garnish for tooltips and lore.

**Comparables (for tone, not cloning).** Kingdom Rush (trail TD readability), Bloons TD (household-object arsenal, upgrade forks), Vampire Survivors and Brotato (fast meta loop, between-wave drafting), Defense Grid (enemies stealing a core and carrying it home).

**Out of scope for 1.0.** Multiplayer, user-generated maps, story campaign with dialogue, microtransactions.

---

## 2. Core loops

### 2.1 Moment to moment (seconds)

1. Ants enter from nests and walk along trails toward the sandwich.
2. The player aims the **active tool** with the pointer (mouse, touch or virtual cursor) and uses it (tap, hold or drag, depending on the tool).
3. Ants die into splats and drop **crumbs** (the in-run currency). Crumbs pop out and auto-collect after 0.6 s (skill tree nodes speed this up).
4. Ants that reach the sandwich take a **bite** (sandwich HP loss) and turn around carrying a **morsel** back toward their nest. Killing a carrier drops the morsel; collecting it (tap, hover or the vacuum) restores the bitten HP. A carrier that reaches its nest makes the loss permanent. This is the main tactical twist: a leak can be undone.

### 2.2 Wave loop (about 1 minute)

1. **Wave**: 35–75 s of spawning, scripted per wave (section 9.3).
2. **Intermission**: no timer on desktop; on mobile an optional 20 s auto-start. The player:
   - picks **1 of 3 draft cards** (new tool, tool level, defense blueprint or perk), with one free reroll per intermission (more from the tree);
   - builds, upgrades, moves or sells **defenses** with crumbs;
   - buys sandwich repairs (15 crumbs per 5 HP, max 3 per intermission).
3. **Ready** → next wave. A wave can also be called early for +10% crumbs on that wave (risk and reward, like Kingdom Rush).

### 2.3 Run loop (10–14 minutes)

Pick a **biome** and **Heat level** → 10 waves (mini-boss at wave 5, boss at wave 10) → **Run summary** → seeds and XP go to the meta progression.

### 2.4 Meta loop (sessions)

Seeds → **skill tree** (permanent power, new tools and defenses added to the draft pool, quality-of-life). Boss kills unlock the next biome; clearing a biome at Heat `h` unlocks Heat `h+1` for it. The bestiary fills in as you meet enemies. After biome 5, **Endless** and **Daily Seed** modes open.

---

## 3. Run structure

### 3.1 Starting a run

| Step | What the player chooses | Notes |
|---|---|---|
| Biome | Any unlocked biome | Each biome has 6 handcrafted map templates; one is picked per run (section 4.2). |
| Heat | 0 to the highest unlocked for that biome | Heat modifiers in section 9.6. |
| Loadout | 1 starting tool + 1 starting defense blueprint from those unlocked | At first: Rolled Newspaper + Sticky Trap only. |

Every run starts with **60 crumbs**, **sandwich HP 100** (the tree raises it) and the chosen tool at level 1.

### 3.2 Waves in a run

| Wave | Type | Content |
|---|---|---|
| 1–4 | Normal | Biome enemy pool, threat budget rising. |
| 5 | Mini-boss | Normal budget × 0.6 plus one mini-boss from the biome's pool (section 7.2). |
| 6–9 | Normal | Elites start appearing (section 6.3). |
| 10 | Boss | Biome boss plus escorts (budget × 0.5). Killing the boss ends the run as a victory even if escorts remain. |

**Endless** (unlocked after the biome 5 boss): waves continue past 10 with the formulas in section 9 unchanged. A boss returns every 10th wave, cycling biomes, with +25% HP per cycle.

### 3.3 Draft cards

Shown after every wave except the last. There are 3 cards; each card's rarity is rolled independently, then a card of that rarity is drawn from the unlocked pool.

| Rarity | Base weight | Border color | Examples |
|---|---|---|---|
| Common | 60 | Grey `#c0c0c0` | Tool level +1, small perk (+10% crumbs) |
| Uncommon | 28 | Green `#4fbf57` | New tier 1–2 tool, defense blueprint |
| Rare | 10 | Blue `#3a7bd5` | New tier 3 tool, tool fork pick, strong perk |
| Legendary | 2 | Gold `#ffcc33` | Tier 4 tool, run-defining perk |

The rarity weights shift by `+1.5 × w` toward Rare and Legendary (taken from Common). Duplicates of an owned tool become "Level +1" cards. With a full hotbar (4 tools), a new tool card asks which tool to replace (a visual drag-onto-slot gesture).

**Perk card pool (in-run only, max stack in brackets):**

| Perk | Effect | Rarity |
|---|---|---|
| Sticky Fingers [3] | +40% crumb pickup radius | Common |
| Lunch Money [5] | +10% crumbs from kills | Common |
| Thick Crust [3] | +15 max sandwich HP and heal 15 | Common |
| Quick Hands [3] | −8% tool cooldowns | Uncommon |
| Overclock [3] | Defenses attack 10% faster | Uncommon |
| Morsel Magnet [1] | Dropped morsels fly back to the sandwich on their own | Uncommon |
| Second Helping [1] | The first time the sandwich would hit 0 HP, it goes to 30 instead | Rare |
| Chain Reaction [2] | Kills by explosions or fire have a 15% chance to explode for 20 damage | Rare |
| Pest Control License [1] | +1 hotbar slot (5 total) | Legendary |
| Golden Picnic [1] | Golden elites appear 3× more often | Legendary |

---

## 4. Maps, trails and pathing

### 4.1 Map anatomy

- **Field**: 176 × 108 cells **(exists)**.
- **Sandwich**: always within the central 60% of the field, at least 34 cells from every nest **(the distance rule exists)**.
- **Nests**: 2–4, each at the start of a trail, on or near the field edge.
- **Trails**: 2–4 dirt paths, 5–7 cells wide, from each nest to the sandwich. Trails may merge but never cross a nest.
- **Obstacles and props**: section 11.2.
- **Build ground**: any grass cell that is not trail, obstacle or within 8 cells of the sandwich.

### 4.2 Map generation (seeded)

Maps must be fair, readable and different every run, yet hand-tunable. Use **templates plus procedural trails**:

1. A **template** (6 per biome, authored as small JSON files) sets the sandwich zone, nest anchor zones, prop density and any fixed set pieces (a hose, a bench).
2. **Waypoints**: for each nest, place 2–4 waypoints by rejection sampling. Each waypoint must be ≥ 18 cells from the previous one and ≥ 12 cells from other trails' waypoints, and keep the route moving overall toward the sandwich (the angle between the step and the direct line under 75°).
3. **Carve**: run A* between consecutive waypoints over a cost field = `1 + 3 × valueNoise(cell / 9) + 40 × obstacle`. Trails therefore meander naturally and avoid props.
4. **Smooth** the cell path with 2 Chaikin passes into a polyline, then resample at 1-cell spacing.
5. **Validate**: trail length from nest to sandwich is 120–260 cells; at least 2 trails; no trail passes within 10 cells of another nest; build ground ≥ 45% of the field. If invalid, retry (max 30), then fall back to the template's stored trails.
6. **Rasterize** a trail mask (for rendering and placement rules) and store each trail as `{ points, cumulativeLength }`.

All randomness comes from a seeded PRNG (section 15.4), so a seed reproduces a map exactly (Daily Seed mode, bug reports).

### 4.3 How ants walk trails

- Each ant gets a trail, a **lane offset** in [−2, +2] cells (perpendicular to the trail), and a **progress** `s` (cells walked along the trail).
- Every tick: `s += speed × dt`. Position = trail point at `s` + normal × (lane + wobble), where wobble is a small sine (amplitude 0.4 cells, 1.5 Hz, random phase) so columns look alive rather than robotic.
- Ants avoid heavy overlap with a cheap separation pass using a spatial hash with 4-cell buckets: neighbors within 1.2 cells push each other's lane offset apart, clamped to the trail width.
- Defenses that **block** (Garden Gnome, Salt Line) stop progress; ants pile up and chew through or wait (enemy-specific).
- **Off-trail units** (flying ants, diggers while burrowed, some bosses) use a **flow field** toward the sandwich: a BFS over the cell grid, computed once per map and recomputed only when blocking objects change (about 19k cells; under 2 ms).
- **Returning carriers** walk the same trail backward (`s` decreasing) at 80% speed.
- **Targeting order** for defenses ("first", "last", "strongest", "closest") uses `s` / trail length, so "first" means closest to the sandwich.

### 4.4 Readability rules for trails

- Trails are drawn as darker packed dirt with 1-art-px pebble specks and slightly darker edges, never the same value as the grass.
- Nests always sit at trail heads, so the player reads "trail = where they come from".
- At the start of each wave, an arrow sweep (bright yellow pixel chevrons) runs down each active trail in 0.8 s and shows which trails will spawn this wave.

---

## 5. Combat model

### 5.1 Damage types

| Type | Icon (8×8) | Color | Sources |
|---|---|---|---|
| Blunt | Fist | `#d9d9d9` | Newspaper, swatter, slipper, hammer, mousetrap |
| Pierce | Pin | `#b0c4de` | Toy soldier, laser pointer, venus flytrap |
| Fire | Flame | `#ff7a2a` | Magnifier, flamethrower, citronella, fire ants (vs ants) |
| Acid | Droplet | `#8ee04a` | Acid squirter |
| Shock | Bolt | `#8fd3ff` | Zapper lamp, tesla coil, lightning jar |
| Cold | Flake | `#bfe8ff` | Freeze spray |
| Poison | Skull | `#b07ad9` | Bug spray, bait station |
| Explosive | Burst | `#ffcc33` | Cherry bomb |

Non-damaging effects: **Water** (spray bottle, sprinkler), **Wind** (leaf blower), **Suction** (vacuum).

### 5.2 Armor

`damage taken = max(1, rawDamage × typeMultiplier − armor)`, applied per hit. DoT ticks (burn, poison, acid) ignore armor, so they're the anti-armor answer. **Melt** (acid) reduces armor by 1 per stack (max 6 stacks, 4 s duration, refreshed on reapply).

### 5.3 Status effects and combos

| Status | Applied by | Effect | Combos |
|---|---|---|---|
| Burning | Fire | 8 DPS for 3 s; spreads to a touching ant 25% per second | Wet: extinguished instantly. Twig or leaf pile: ignites the prop. |
| Melted | Acid | −1 armor per stack | Blunt hits on a 4+ stack target deal ×1.3 |
| Wet | Water | 4 s; −15% speed | Shock ×1.5; Fire ×0.5; Cold chill ×2 |
| Chilled → Frozen | Cold | Chill 0–100; −0.6% speed per point; at 100 frozen for 2 s | Blunt on frozen: ×2 (shatter) |
| Poisoned | Poison | 3 DPS per stack (max 10), 5 s | Bait-poisoned ants spread 2 stacks to their nest and to ants they touch |
| Stunned | Slipper, hammer, mousetrap | Cannot move or bite | — |
| Stuck | Sticky trap, honey | Cannot move; can still be pushed by wind | Fire frees and ignites (glue is flammable) |
| Feared | Citronella | −25% speed; a 20% chance per second to turn back 2 cells | — |
| Knocked back | Wind, water, explosions | `s` decreases by the push distance (stays on the trail) | Wet: +50% push |

### 5.4 Hit feel (applies to every tool)

- **Hit flash**: the enemy sprite turns white for 1 frame (60 Hz) via the sprite shader's mix value **(supported by the current renderer)**.
- **Hit-stop**: 0 ms normally; 40 ms on single hits ≥ 100 damage; 70 ms on boss phase breaks.
- **Screen shake**: 1–3 art px, decaying over 120 ms; never on DoT. Toggle in settings.
- **Splats**: every death leaves a splat sprite tinted by killing damage type **(exists for 3 types)**, which fades over 4.8–9 s **(exists)**.

---

## 6. Enemies

### 6.1 Enemy roster

Base stats at `w = 1`, `b = 1`, `h = 0`; scaling is in section 9.2. **First seen** follows the biome spawn pools in section 6.2. **Threat** is the cost against the wave budget. **Bite** is the sandwich HP removed when the ant reaches it. **Crumbs** are dropped on kill (before modifiers). Size class: **S** ≤ 3 cells, **M** 3–5, **L** 5–8, **XL** boss.

| # | Enemy | HP | Speed | Armor | Size | Bite | Threat | Crumbs | First seen | Behavior | Counter |
|---|---|---|---|---|---|---|---|---|---|---|---|
| E1 | Worker Ant | 30 | 6.0 | 0 | S | 2 | 1 | 2 | B1 W1 | Walks the trail, bites, carries a morsel home | Anything |
| E2 | Scout Ant | 14 | 10.0 | 0 | S | 1 | 1 | 2 | B1 W1 | Fast, comes in packs of 5 | Area tools, sticky trap |
| E3 | Soldier Ant | 70 | 5.0 | 3 | M | 4 | 3 | 5 | B1 W4 | Big head; its front blocks the first Pierce hit every 2 s | Blunt, DoT |
| E4 | Flying Ant (Alate) | 25 | 7.0 | 0 | S | 2 | 2 | 4 | B1 W4 | Flies via the flow field, ignores trails and ground traps; only anti-air tools hit it (section 8) | Swatter, zapper, toy soldier, leaf blower |
| E5 | Carpenter Ant | 220 | 3.5 | 5 | L | 8 | 8 | 14 | B2 W1 | Slow tank; chews through twigs, logs and gnomes 3× faster | Acid, hammer, fire |
| E6 | Fire Ant | 45 | 6.5 | 1 | S | 3 | 2 | 4 | B3 W1 (B1 W8 as a rare) | Immune to Fire; on death leaves an ember (2 s) that ignites flammable props (twigs, leaf piles) | Water, cold, blunt |
| E7 | Bullet Ant | 60 | 5.0 | 2 | M | 5 | 4 | 7 | B2 W4 | Every 3 s dashes at ×3 speed for 0.6 s (0.3 s telegraph: rears up, red eye pixel) | Mousetrap, slows |
| E8 | Leafcutter Ant | 50 + 60 leaf | 4.5 | 0 | M | 3 | 4 | 7 | B2 W1 | Carries a leaf shield that absorbs damage from the front and blocks beams (magnifier, laser); wind strips the leaf | Leaf blower, flanking defenses |
| E9 | Digger Ant | 55 | 5.5 | 1 | S | 3 | 3 | 6 | B3 W1 | Burrows for the middle 40% of its trail: untargetable, shown as a moving dirt bump; surfaces with a 0.5 s telegraph | Mousetrap at exit, hammer (hits burrowed ants) |
| E10 | Honeypot Ant | 120 | 3.0 | 0 | L | 6 | 6 | 20 | B2 W4 | On death bursts into honey that heals ants within 6 cells by 40% of their max HP | Kill it away from groups, burst damage |
| E11 | Army Ant Column | 20 × 8 | 7.0 | 1 | S | 2 each | 10 per column | 2 each | B4 W1 | Spawns as a linked conga line; the line keeps formation and fills gaps | Area damage, flamethrower |
| E12 | Weaver Ant | 80 | 4.0 | 1 | M | 3 | 5 | 9 | B4 W1 | Stops next to the first defense in range (6 cells) and webs it: defense disabled until the weaver dies or 6 s pass | Prioritize; area tools |
| E13 | Queen's Guard | 160 | 4.0 | 6 | L | 6 | 9 | 16 | B4 W4 | Aura: allies within 6 cells get +3 armor (stacks once) | Acid, poison, kill first |
| E14 | Brood Larva | 8 | 2.5 | 0 | S | 1 | — | 1 | Boss spawn | Wriggles slowly; spawned by bosses | Anything with area |
| E15 | Night Ant | 40 | 6.0 | 1 | S | 2 | 2 | 4 | B5 W1 | Only visible within 10 cells of a light source (firefly, zapper lamp, candle, fire); otherwise a pair of glowing eyes | Light sources, lamps |
| E16 | Shadow Swarm | 6 × 25 | 8.0 | 0 | S | 1 each | 6 per swarm | 1 each | B5 W4 | Tight blob of tiny ants that scatters when hit by area damage, then regroups | Vacuum, blower, fire |

The Honeypot only heals other ants; it never hinders the player directly. It reads simply: gold blob = heal bomb.

### 6.2 Enemy pools by biome

Weights for budget spending; enemies not listed don't appear in that biome before Endless.

| Biome | W1–3 | W4–6 | W7–9 |
|---|---|---|---|
| B1 Backyard | Worker 70, Scout 30 | Worker 45, Scout 25, Soldier 20, Flying 10 | Worker 30, Scout 20, Soldier 30, Flying 15, Fire (rare) 5 |
| B2 City Park | Worker 40, Soldier 25, Carpenter 15, Leafcutter 20 | + Bullet 15, Honeypot 10 | Carpenter 20, Bullet 20, Leafcutter 20, Honeypot 10, Soldier 15, Flying 15 |
| B3 Sunny Driveway | Fire 40, Worker 30, Digger 30 | Fire 30, Digger 25, Bullet 20, Soldier 15, Flying 10 | Fire 25, Digger 25, Bullet 20, Carpenter 15, Flying 15 |
| B4 Kitchen Floor | Army Column 35, Worker 35, Weaver 30 | + Queen's Guard 15 | Army 25, Weaver 20, Guard 20, Honeypot 10, Carpenter 15, Flying 10 |
| B5 Night Garden | Night 60, Worker 40 | Night 40, Swarm 25, Weaver 15, Guard 20 | Night 30, Swarm 25, Guard 20, Digger 15, Flying 10 |

### 6.3 Elite modifiers

From wave 6 (Heat 3+: wave 4), each spawned enemy has `eliteChance = 0.02 + 0.01 × (w − 6) + 0.01 × h` to roll one modifier. Max one modifier per ant (Heat 8+: two).

| Elite | Visual cue | Effect | Reward |
|---|---|---|---|
| Golden | Gold palette swap, sparkle pixel every 0.5 s | HP ×2 | Crumbs ×5, +1 seed on kill |
| Giant | Sprite drawn at 2× (pixel-doubled), deeper footstep sfx | HP ×2.5, speed ×0.85, bite ×2 | Crumbs ×3 |
| Swift | Motion-trail afterimage (2 ghost frames) | Speed ×1.5 | Crumbs ×2 |
| Shielded | Blue pixel outline | +4 armor | Crumbs ×2 |
| Regenerating | Green + sign above every 1 s | Heals 3% max HP per second when not hit for 2 s | Crumbs ×2 |

### 6.4 Enemy animation spec

All ants share one skeleton timing so new types are cheap to add.

| Animation | Frames | FPS | Notes |
|---|---|---|---|
| Walk | 4 | 12 | Alternating tripod gait (frames A, mid, B, mid); antennae bob 1 px on frames 2 and 4 |
| Carry walk | 4 | 10 | Walk with a 3×3 morsel sprite on the head and mandibles; 15% slower cadence |
| Bite | 2 | 8 | Head lunge 1 px, mandibles open/close; plays while at the sandwich (0.5 s) |
| Hit | 1 | — | Shader white flash, no extra frames |
| Death | 4 | 14 | Flips on back, legs curl (2 frames), last frame becomes the splat |
| Burrow / emerge (digger) | 4 | 12 | Dirt mound grows / bursts |
| Fly (alate) | 2 | 20 | Wing blur frames; shadow drawn 6 art px below the sprite |

**Directions**: 8-way facing. Draw 5 directions (E, NE, N, SE, S); W, NW and SW mirror horizontally. Facing snaps to the nearest 45° of the velocity with hysteresis (only change when 30° past the boundary) so ants don't flicker between frames. The current prototype draws 4 directions by rotating one east-facing sprite **(exists)**; the 5-direction set replaces it.

**Sprite budgets (art px)**: S 11×9 to 13×11 **(worker exists at 13×11)**, M 15×13, L 21×17, XL bosses 32×32 to 64×48.

**Palette rule**: enemies are dark-bodied (browns and blacks) with one signature accent color per type (soldier: red mandibles, fire ant: orange, weaver: white silk tufts, guard: purple carapace highlight, honeypot: gold abdomen). Player-owned things are always bright and light-outlined; enemies are dark-outlined.

---

## 7. Bosses

### 7.1 Biome bosses (wave 10)

HP below is at `h = 0`; Heat multiplies it by `1 + 0.15h`. Every boss has a **health bar across the top of the field** (40 art px tall boss banner with portrait), 3 phases, and phase breaks with a 1.5 s invulnerable roar (screen shake 3 px, hit-stop 70 ms, music layer change). A boss that reaches the sandwich takes a **mega-bite** (25 HP) every 3 s until pushed off or killed.

#### B1 boss: Queen Bertha (Backyard)
- **HP** 3,000 · **Armor** 2 · **Speed** 1.5 · **Size** 48×40 art px · **Weak** Blunt ×1.25
- **Phase 1 (100–60%)**: walks the longest trail. Every 4 s lays 6 Brood Larvae behind her.
- **Phase 2 (60–25%)**: burrows (1 s mound telegraph), travels underground for 4 s and emerges at a random point on a trail 30–60 cells from the sandwich. The emergence point shows cracking dirt for 1.2 s; defenses within 4 cells are stunned 2 s on emergence. Summons 2 Soldiers on surfacing.
- **Phase 3 (25–0%)**: enraged, red tint pulse. Speed 2.5; lays brood every 2 s.
- **Reward**: 15 seeds (first kill 30), unlocks biome 2.

#### B2 boss: The Carpenter Colossus (City Park)
- **HP** 7,500 · **Armor** 8 · **Speed** 1.2 · **Size** 56×40 · **Weak** Acid (melt stacks to 10 on bosses)
- **Phase 1**: chews through any obstacle in its way and creates a new trail segment (the trail graph updates live; flow fields recompute).
- **Phase 2 (66%)**: spits woodchips: 3 projectiles land in a 0.8 s telegraphed circle and leave **sawdust piles** that block building on those cells for 20 s (build denial only; ants walk over them).
- **Phase 3 (33%)**: armor drops to 3, speed 2.0. Each chew heals it 2% of max HP: keep it off obstacles.
- **Reward**: 20 seeds (first kill 40), unlocks biome 3.

#### B3 boss: Fire Ant Matriarch (Sunny Driveway)
- **HP** 11,000 · **Armor** 4 · **Speed** 1.8 · **Size** 48×36 · **Immune** Fire · **Weak** Water and Cold ×1.5
- **Phase 1**: leaves a burning trail (3 s) that speeds fire ants in it by 30%.
- **Phase 2 (60%)**: **molten shell**: a glowing orange outline; takes 75% less damage until hit by 200 total Water or Cold "points" (spray bottle, sprinkler, freeze spray). The shell meter shows in the boss banner.
- **Phase 3 (25%)**: every 6 s calls a heat wave: the whole field shimmers (shader distortion), all defenses −30% attack speed for 3 s.
- **Reward**: 25 seeds (first kill 50), unlocks biome 4.

#### B4 boss: General Formica and the Grand Column (Kitchen Floor)
- **HP** head 4,000 + 12 segments × 800 · **Armor** head 6, segments 2 · **Speed** 2.2 · **Size** head 32×32, segments 20×16
- A centipede-like line of armored soldier ants following the head. Killing a segment splits the column; each split part keeps walking. The head commands: while the head lives, segments regenerate 1% per second.
- **Phase 2 (head 50%)**: the head detaches and runs ahead at speed 4 for 5 s, then re-links with the nearest segment group.
- **Phase 3 (head 20%)**: all remaining segments become Swift.
- **Reward**: 30 seeds (first kill 60), unlocks biome 5.

#### B5 boss: The Colony Mind (Night Garden)
- **HP** core 9,000 + swarm of 220 tiny ants (6 HP each) · **Speed** 2.0 · **Size** swarm area about 30 cells across
- A dark cloud of tiny ants forming a giant ant silhouette, with a glowing core inside. The core takes 10% damage while the swarm is above 40%. Below 40%, the core is exposed (×1 damage).
- **Phase 2 (core 60%)**: the swarm splits into 3 smaller silhouettes along different trails; the core hops between them every 6 s (glow telegraph).
- **Phase 3 (core 25%)**: lights go out: the visibility radius around light sources shrinks 50%; the core flashes every 2 s, revealing itself.
- **Reward**: 40 seeds (first kill 80), unlocks Endless and Daily Seed.

### 7.2 Mini-bosses (wave 5; each biome draws 1 of its 2)

| Mini-boss | Biomes | HP | Armor | Mechanic | Telegraph | Weak |
|---|---|---|---|---|---|---|
| Stag Beetle | B1, B2 | 900 | 8 | Every 7 s charges straight ahead at speed 20 for 1 s, off-trail, knocking defenses in its path offline for 3 s | Stomps twice, red pixel arrow 1 s | Blunt (hammer stuns it) |
| Wasp Raider | B1, B3 | 600 | 0 | Flying. Every 10 s picks up a random defense and drops it 20 cells away (must be moved back, free) | Hovers over target 1.5 s, shadow grows | Anti-air, zapper |
| Garden Spider | B2, B5 | 1,400 | 3 | Every 8 s webs one defense (disabled until the web takes 50 damage from any source, or fire burns it instantly) | Silk line drawn to target 1 s | Fire, poison |
| Pill Bug Roller | B3, B4 | 1,800 | 12 | Rolls into a ball (armor 30) for 3 s every 6 s; uncurled armor 4 | Curls over 0.5 s | Acid, hit between rolls |
| Rove Beetle | B4, B5 | 1,100 | 5 | Sprays a stink cloud every 9 s: ants inside get +50% speed for 4 s | Tail raises 0.8 s | Kill in open, blower clears cloud |

Mini-boss reward: 5 seeds (in the run formula) and a guaranteed Rare-or-better draft card in that intermission.

---

## 8. Player arsenal: tools and defenses

Two kinds of player power:

- **Tools**: the active weapon under the pointer. A hotbar holds 4 (5 with a perk), and you swap with 1–5, the mouse wheel or tapping the slot. A tool is gained through draft cards or as the run's starting tool. Each tool levels **1→5 within a run**; at level 3 the player picks **one of two forks** (section 8.3).
- **Defenses**: placed objects that work on their own. They're bought with crumbs, upgraded twice (levels 1–3) with crumbs, sold for 70%, and moved during intermissions for free.

**Tiers** decide when things appear: tier 1 is available from the start or through cheap tree nodes; tier 4 needs deep tree nodes **and** only drafts from wave 4 onward. The current prototype's weapons (flamethrower, acid, bomb, lightning) **become tier 3–4 late-game tools**, as requested.

### 8.1 Tools (16)

Range and area are in cells. "AA" = can hit flying enemies.

| # | Tool | Tier | Use | Base effect | Cooldown / resource | AA | Signature trait |
|---|---|---|---|---|---|---|---|
| T1 | Rolled Newspaper | 1 | Tap | 14 Blunt, radius 3 | 0.35 s | No | Starting tool. Fast, weak; every 5th consecutive hit within 2 s is a "big swat" ×2 |
| T2 | Fly Swatter | 1 | Tap | 10 Blunt, radius 5 (rectangle 6×4) | 0.5 s | Yes | Wide; knocks flying ants out of the air (they become ground ants for 3 s) |
| T3 | Slipper | 1 | Tap | 40 Blunt, radius 6 | 1.4 s | No | Stun 0.4 s; 0.15 s wind-up with a shadow growing on the ground |
| T4 | Spray Bottle | 1 | Hold | 6 DPS Water-cone, length 10, 30° | Tank 4 s, refills 2 s | Yes | Applies Wet; knockback 1 cell/s; extinguishes fires |
| T5 | Hammer | 2 | Tap | 120 Blunt, radius 2 | 1.1 s | No | Cracks armor (−50% for 4 s), stun 0.8 s, ×2 vs nests and boss chew-shields; hits burrowed diggers |
| T6 | Magnifying Glass | 2 | Hold still | Heat beam on a 2-cell spot: DPS ramps 5→60 over 2 s of not moving the pointer more than 1 cell | None (day biomes only; ×0.2 at night) | No | Ignites; sets twigs and leaf piles on fire; blocked by leaf shields |
| T7 | Vacuum Cleaner | 2 | Hold | Cone length 14, 40°: pulls enemies 4 cells/s toward the nozzle; S enemies within 2 cells are sucked up (instant kill) | Bag 40 ants; full bag = 3 s empty animation | Yes | Also sucks up crumbs and morsels from any distance in the cone; M+ enemies only slowed 40% |
| T8 | Salt Shaker | 2 | Drag | Draws a salt line up to 30 cells long; ants won't cross it for 6 s (they wait, or reroute if another trail branch exists) | 3 charges, 1 charge per 6 s | No | The only hard block in the early game. Flying and burrowed ants ignore it |
| T9 | Bug Spray | 2 | Hold | Poison cloud cone, length 8; the cloud lingers 3 s; 2 poison stacks per second | Can 5 s, refills 3 s | Yes | Clouds drift with wind (leaf blower pushes them) |
| T10 | Cherry Bomb | 3 | Tap (throw) | 90 Explosive, radius 9, fuse 0.8 s | 1.6 s | No | Reworked current **Bomb**; knockback 3 cells; cooks off nearby bombs |
| T11 | Acid Squirter | 3 | Hold | Leaves acid pools (3 s) that melt 1 stack per 0.5 s and deal 10 DPS | Tank 6 s, refills 3 s | No | Reworked current **Acid**; best anti-armor |
| T12 | Freeze Spray | 3 | Hold | Cold cone length 9, 40 chill per second | Can 4 s, refills 3 s | Yes | Frozen enemies shatter for ×2 Blunt; puts out fires (and is shut down by fire) |
| T13 | Leaf Blower | 3 | Hold | Wind cone length 16: pushes enemies 6 cells/s back along their trail | Fuel 5 s, refills 4 s | Yes | Strips leafcutter shields, blows away gas, scatters swarms, knocks flying ants off the map edge (killed, no crumbs) |
| T14 | Flamethrower | 4 | Hold | Fire cone length 12, 22 DPS + Burning | Fuel 6 s, refills 4 s | No | Reworked current **Flamethrower**; spreads to props |
| T15 | Lightning Jar | 4 | Tap | Strikes the nearest enemy to the pointer for 60 Shock, chains to 4 more (−20% per jump, 8-cell jumps) | 0.9 s | Yes | Reworked current **Lightning**; Wet targets chain +2 extra |
| T16 | Laser Pointer | 4 | Hold | Hitscan beam from the field edge through the pointer: 45 DPS Pierce, pierces all | Battery 5 s, refills 5 s | Yes | Heats targets: 2 s on one ant ignites it; blocked by leaf shields |

**Tool level scaling** (levels 2–5, unless the fork says otherwise): +18% damage per level; levels 2 and 4 also give −10% cooldown or +15% resource; level 5 adds the tool's "mastery" bonus (+25% area).

### 8.2 Defenses (12)

Placed on build ground. Footprints are in cells (most 6×6). The range circle shows while placing and while hovering a defense. A defense never blocks the trail unless marked **Blocks**.

| # | Defense | Tier | Cost | Footprint | Range | Base effect | Targets | AA | Upgrade 2 / 3 (cost) |
|---|---|---|---|---|---|---|---|---|---|
| D1 | Sticky Trap | 1 | 25 | 6×4, **on trail** | — | Sticks the first 12 ants that walk on it for 3 s, then is used up | Ground | No | 18 uses (20) / ants stuck also take 3 DPS (35) |
| D2 | Mousetrap | 1 | 40 | 6×6, on trail | 2 | Snaps when an enemy enters: 150 Blunt, stun 1 s; re-arms in 4 s | Ground | No | Re-arm 3 s (35) / 260 damage + shatter frozen (60) |
| D3 | Toy Soldier | 1 | 60 | 6×6 | 18 | BB gun: 8 Pierce, 2 shots/s | First | Yes | 3 shots/s (45) / bullets pierce 1 (80) |
| D4 | Sugar Cube Decoy | 2 | 30 | 4×4 | 20 lure | Ants within range leave the trail to nibble it (6 s), then return. One-time use, 60 nibble HP | Ground | No | 100 HP (20) / poisoned sugar: 2 stacks per nibble (40) |
| D5 | Bug Zapper Lamp | 2 | 90 | 6×8 | 14 | Every 1.2 s a chain zap: 20 Shock, 3 targets. Lights a 10-cell radius (night) and attracts flying ants | Strongest | Yes | 4 targets (60) / 30 damage + 15% stun (110) |
| D6 | Sprinkler | 2 | 70 | 6×6 | 12 | Rotating water arc (2 s per turn): Wet, knockback 1 cell; puts out fires within range (including the player's own) | All in arc | Yes | Range 15 (45) / applies 30 chill per pass (80) |
| D7 | Citronella Candle | 2 | 65 | 4×6 | 10 | Aura: Feared, 4 Fire DPS; lights a 12-cell radius (night) | All | No | Range 13 (40) / 8 DPS + Burning on 10% (70) |
| D8 | Garden Gnome | 3 | 100 | 6×6, on trail, **Blocks** | — | 600 HP blocker; ants stop and chew it (bite damage to the gnome instead of the sandwich); taunts enemies within 6 cells | Ground | No | 1,000 HP (60) / thorny: 10 damage back per bite (90) |
| D9 | Ant Bait Station | 3 | 120 | 6×6 | 8 | Ants passing pick up bait (poisoned, no instant damage). A poisoned ant that dies spreads 2 stacks; a carrier reaching its nest damages the nest's next spawn group (−30% HP) | All ground | No | Range 11 (70) / bait stacks 4 (120) |
| D10 | Venus Flytrap | 3 | 130 | 6×6 | 4 | Chomps the biggest enemy in range: 220 Pierce (×2 vs S/M kills them outright up to 300 HP), then digests 5 s | Strongest | No | Digest 3.5 s (80) / chomps 2 targets (140) |
| D11 | Sunlens Tripod | 3 | 140 | 6×6 | 16 | Focus beam on one target; damage ramps 10→90 DPS over 3 s on the same target; ignites | First | No | Ramp 2 s (90) / beam splits to 2 targets at full ramp (150) |
| D12 | Tesla Coil | 4 | 200 | 8×8 | 16 | Every 2 s discharges: 45 Shock to every enemy in range; Wet ×1.5 | All | Yes | 1.5 s (130) / leaves a 3 s static field: 6 DPS (180) |

**Placement rules**: on-trail defenses (D1, D2, D8) must sit fully on trail cells; others must sit fully on build ground. Defenses can't overlap each other or props. Max 12 defenses per map (tree: +4).

### 8.3 Tool forks (chosen at tool level 3)

| Tool | Fork A | Fork B |
|---|---|---|
| Rolled Newspaper | **Sunday Edition**: radius 5, big swat every 3rd hit | **Rapid Read**: cooldown 0.2 s, hits chain to 1 neighbor for 50% |
| Fly Swatter | **Holey Swatter**: hits twice (2 × 60%) | **Electric Racket**: +10 Shock, AA kills give +1 crumb |
| Slipper | **Steel Toe**: 90 damage, stun 0.8 s | **Flip-Flop**: two quick stomps 0.25 s apart (2 × 55%) |
| Spray Bottle | **Pressure Washer**: knockback 3 cells/s, 12 DPS | **Ice Water**: also 20 chill per second |
| Hammer | **Sledge**: radius 4, shockwave knocks back 2 cells | **Jackhammer**: hold for 6 hits per second at 25 damage |
| Magnifying Glass | **Burning Lens**: ramp in 1 s | **Wide Lens**: 4-cell spot, ramp max 40 DPS |
| Vacuum Cleaner | **Shop Vac**: bag 100, M enemies also sucked up | **Reverse Gear**: right-click / two-finger tap blows instead (blower lite) |
| Salt Shaker | **Rock Salt**: lines also deal 5 DPS | **Long Pour**: lines 50 cells, last 9 s |
| Bug Spray | **Fogger**: cloud lingers 6 s | **Raid**: 4 stacks per second, cone length 6 |
| Cherry Bomb | **Cluster**: splits into 3 mini-bombs (40 each) | **Mega**: radius 14, fuse 1.2 s, 200 damage |
| Acid Squirter | **Corrosive**: pools 6 s | **Sulfuric**: 25 DPS, melt 2 stacks per tick |
| Freeze Spray | **Flash Freeze**: chill 80/s | **Cryo Mist**: cloud lingers 2 s |
| Leaf Blower | **Hurricane**: push 10 cells/s | **Mulcher**: 8 DPS while pushing |
| Flamethrower | **Napalm**: fire patches stay 4 s | **Blue Flame**: 40 DPS, length 9 |
| Lightning Jar | **Storm**: chains to 8 | **Thunderclap**: 140 to the first target, stuns 1 s |
| Laser Pointer | **Prism**: 3 beams in a 20° fan, 60% damage each | **Overcharge**: 90 DPS, battery 3 s |

### 8.4 Upgrades that span both

The skill tree (section 10) holds all permanent modifiers. In-run power comes only from tool levels, defense upgrades, perks and forks, so a run's decisions stay meaningful.

---

## 9. Difficulty, economy and balancing

### 9.1 Goals

| Player | Expected result |
|---|---|
| First run ever (no tree) | Loses at B1 wave 5–7 (often to the mini-boss). Earns about 8–14 seeds, enough for 2–3 tier 1 ranks. |
| After 2–4 runs | Beats the B1 boss. |
| Each next biome | 3–6 runs of tree growth to clear. |
| Full tree (about 55–65 runs) | Heat 6–8 on B5 is hard but beatable; Heat 10 is for the best players. |

The curve is "you nearly made it" on purpose. Losses must feel like the player's fault (a leak they saw coming) and must always pay out.

### 9.2 Enemy scaling

```
enemyHp(w, b, h)    = baseHp × (1 + 0.11 × (w − 1)) × biomeHp[b] × (1 + 0.15 × h)
enemySpeed(w, b, h) = baseSpeed × (1 + 0.015 × (w − 1)) × (1 + 0.02 × h)      // speed scales gently: fast = unreadable
enemyArmor(b, h)    = baseArmor + armorBonus[b] + floor(h / 3)
crumbs(enemy, w)    = baseCrumbs × (1 + 0.04 × (w − 1)) × crumbMult(h)

biomeHp     = [1.0, 1.8, 3.0, 4.6, 6.5]
armorBonus  = [0, 1, 1, 2, 3]
crumbMult(h) = 1 − 0.03 × h        // fewer crumbs at high heat, balanced by seed bonus
```

### 9.3 Wave composition

```
budget(w, b, h)   = (18 + 9 × (w − 1) + 1.6 × (w − 1)²) × biomeBudget[b] × (1 + 0.1 × h)
biomeBudget       = [1.0, 1.35, 1.75, 2.2, 2.7]
waveDuration(w)   = 35 + 4 × w seconds of spawning
```

Wave builder (deterministic from the run seed):

1. Split the duration into **2–4 groups** (wave 1–3: 2 groups; 4–7: 3; 8+: 4) with **lulls** of 4–8 s between them. Lulls give the player breathing room and a rhythm (tension → release).
2. Give each group a share of the budget: equal, except the last group gets +30% ("the final push").
3. Fill each group by drawing enemies from the biome pool (section 6.2) until the group's budget is spent. Packs: scouts spawn in fives, army columns as a whole.
4. Assign each enemy a trail: round-robin across active trails, with a 30% chance per group of a "focused" group that uses a single trail (forces adaptation).
5. Spawn interval inside a group: `groupDuration / count`, jittered ±25%.

**Sanity check, B1, h = 0** (B1 W7–9 pool averages about 22 HP per threat point):

| Wave | Budget | Enemy HP total | Spawn time | Needed DPS (70% uptime) |
|---|---|---|---|---|
| W5 | (18 + 36 + 25.6) × 0.6 ≈ 48 + Stag Beetle 900 | ≈ 1,550 + 900 | 55 s | ≈ 65 |
| W9 | 18 + 72 + 102.4 ≈ 192 | 192 × 22 × 1.88 ≈ 7,950 | 71 s | ≈ 160 |
| W10 | 228.6 × 0.5 ≈ 114 + Queen 3,000 | ≈ 4,700 + 3,000 | 75 s | ≈ 145, plus burst for the boss phases |

Player side without the tree: the newspaper at level 5 deals 24 per swat every 0.28 s ≈ **85 DPS** single target (more against clumps); 3–4 defenses add about **100–130 DPS** (toy soldier 16, mousetrap ≈ 37 burst, zapper ≈ 50 across 3 targets). That's enough for W9 only with good placement and just short for the Queen. As intended, the first win needs a handful of tree ranks (Firm Grip, Handyman, Thick Bread).

### 9.4 Economy

- **Crumbs (in-run)**: start 60. Income per wave at B1 is roughly `budget × 1.9` crumbs (plus 25 for a wave clear and +10% for calling early). Spending targets: by wave 5, 3–4 defenses; by wave 10, 7–9 defenses with 1–2 at level 3.
- **Sandwich repairs**: 15 crumbs per 5 HP (max 3 buys per intermission), so leaks cost real tempo.
- **Seeds (meta)**, awarded at run end:
  ```
  seeds = (1 × wavesCleared + 5 × miniBossKills + bossReward + 1 × goldenKills + 0.5 × perfectWaves)
          × (1 + 0.1 × h) × biomeSeedMult[b], rounded down
  biomeSeedMult = [1.0, 1.2, 1.4, 1.6, 1.8]
  bossReward    = [15, 20, 25, 30, 40], doubled on the first kill of each boss
  ```
  A *perfect wave* = no bite landed. Typical B1 loss at W6: about 11 seeds. B1 win: about 33 (first kill about 48). A B5 win at Heat 5: about 170.
- **XP (meta)** = seeds × 10. Player levels gate tree tiers (section 10.2) and give cosmetic rewards. Level curve: `xpToNext(L) = 200 + 120 × L`.

### 9.5 Pacing targets

| Moment | Target |
|---|---|
| First kill after starting the game | ≤ 10 s |
| First draft choice | ≤ 60 s |
| First new tool | ≤ 3 minutes (wave 2–3 uncommon) |
| First tree purchase | after run 1 (tree node costs start at 3 seeds) |
| Run length | 9–14 minutes |
| First boss kill | runs 3–5 (60–90 minutes of play) |

### 9.6 Heat levels (difficulty ladder)

Each Heat level keeps all lower modifiers. Clearing a biome at Heat `h` unlocks `h+1` for that biome.

| Heat | Modifier |
|---|---|
| 1 | Enemy HP +15% (formula), seeds +10% |
| 2 | Waves have 1 extra spawn group |
| 3 | Elites from wave 4 |
| 4 | Mini-boss gains its phase 2 behavior faster (cooldowns −30%) |
| 5 | Sandwich max HP −20 |
| 6 | Bosses gain +1 shielded escort pack per phase |
| 7 | Morsel carriers move at 100% speed (not 80%) |
| 8 | Elites may roll two modifiers |
| 9 | Repairs cost double |
| 10 | "Ant Picnic": +30% budget, the boss arrives on wave 9 and wave 10 has two bosses (repeat of 9 + biome boss) |

### 9.7 Balancing method

1. **All numbers live in data tables** (`content/*.ts`, typed), never inside systems.
2. **Headless simulator**: the core runs without rendering (section 15). A CLI runs N seeded runs with scripted bots (`random`, `greedy-defense`, `tool-only`) and outputs CSV: waves reached, leaks per wave, DPS share per source, crumbs over time.
3. **Target bands** in CI: e.g. the `greedy-defense` bot with an empty tree must reach B1 W5–8 in 80% of 200 seeds. Changes that move a band fail the check unless the band is updated deliberately.
4. **Playtest telemetry** (opt-in, local file only in 1.0): run summaries exportable as JSON for tuning sessions.

---

## 10. Persistent progression and the skill tree

### 10.1 Structure

- **5 branches × 16 nodes = 80 nodes**, plus **5 keystones** (one per branch), 85 in total.
- Nodes have 1–5 ranks. The listed cost is the base: **rank n costs base × n** (a 5-rank node at base 3 costs 3 + 6 + 9 + 12 + 15 = 45). First ranks stay cheap; depth costs more.
- **Tiers**: each branch has 4 tiers. A tier unlocks when the player has spent at least 0 / 8 / 25 / 60 seeds *in that branch* **and** reached player level 1 / 4 / 9 / 15.
- **Keystones** (tier 4) are mutually exclusive across branches: only **one keystone** can be active; switching is free in the tree screen.
- **Respec**: free, any time outside a run. Removes friction and encourages experimenting.
- Total cost to max everything: **3,677 seeds** (80 nodes: 3,177; all 5 keystones: 500). With the seed formula in section 9.4 that's about **55–65 runs (≈ 11–14 hours)**; it completes roughly while the player climbs Heat on biomes 4–5. Heat 10 clears, tool mastery skins, the bestiary and achievements form the long tail beyond that (≈ 30+ hours).

Layout: branches radiate from a central sandwich icon like a picnic blanket pattern; nodes are 16×16 pixel icons on a grid, connected by dotted crumb lines (section 13.6).

### 10.2 Node list

Format: **ID · Name** (ranks × cost) · effect per rank · prerequisite. Tier in the heading.

#### Branch A: Arsenal (tools)

- **Tier 1**
  - A1 · Firm Grip (5 × 3) · +4% tool damage
  - A2 · Swatter License (1 × 4) · Fly Swatter added to the draft pool
  - A3 · Slipper License (1 × 5) · Slipper added to the draft pool · A1 ≥ 1
  - A4 · Quick Draw (3 × 4) · −4% tool cooldowns
- **Tier 2**
  - A5 · Spray Bottle License (1 × 8) · Spray Bottle to pool
  - A6 · Hammer License (1 × 10) · Hammer to pool · A3
  - A7 · Sunny Disposition (1 × 10) · Magnifying Glass to pool
  - A8 · Big Tank (3 × 6) · +10% tool resource (tanks, cans, fuel, bags)
  - A9 · Starter Kit (1 × 12) · start runs with the starting tool at level 2
- **Tier 3**
  - A10 · Vacuum License (1 × 36) · Vacuum Cleaner to pool · A8 ≥ 1
  - A11 · Spray Can License (1 × 32) · Bug Spray to pool
  - A12 · Pyro Permit (1 × 44) · Cherry Bomb and Acid Squirter to pool
  - A13 · Fork Insight (1 × 40) · at level 3, see both forks' full stats and may reroll the tool's next level card once
- **Tier 4**
  - A14 · Hazmat Certified (1 × 70) · Flamethrower and Freeze Spray to pool
  - A15 · Storm Chaser (1 × 70) · Lightning Jar, Leaf Blower and Laser Pointer to pool
  - A16 · Toolbelt (1 × 80) · +1 hotbar slot
  - **AK · Keystone: Two-Handed** (1 × 100) · the active tool fires a second "echo" use 0.3 s later at 50% power; defenses −20% damage

#### Branch B: Engineering (defenses)

- **Tier 1**
  - B1 · Handyman (5 × 3) · +4% defense damage
  - B2 · Mousetrap Blueprint (1 × 4) · Mousetrap to pool and as a starting option
  - B3 · Toy Box (1 × 6) · Toy Soldier to pool
  - B4 · Bulk Discount (3 × 4) · −4% defense costs
- **Tier 2**
  - B5 · Sweet Tooth (1 × 8) · Sugar Cube Decoy to pool
  - B6 · Bright Idea (1 × 10) · Bug Zapper Lamp to pool
  - B7 · Garden Hose Blueprint (1 × 10) · Sprinkler to pool
  - B8 · Rapid Assembly (3 × 6) · +6% defense attack speed
  - B9 · Scrap Value (2 × 6) · sell refund 70% → 80% → 90%
- **Tier 3**
  - B10 · Summer Evenings (1 × 32) · Citronella Candle to pool
  - B11 · Lawn Ornament (1 × 36) · Garden Gnome to pool
  - B12 · Botanist (1 × 40) · Venus Flytrap to pool
  - B13 · Extra Lots (2 × 30) · +2 max defenses per map
- **Tier 4**
  - B14 · Chemistry Set (1 × 60) · Ant Bait Station to pool
  - B15 · Optics Lab (1 × 60) · Sunlens Tripod to pool
  - B16 · Mad Science (1 × 90) · Tesla Coil to pool
  - **BK · Keystone: Automaton** (1 × 100) · defenses +35% damage; the active tool deals −40%

#### Branch C: Picnic (sandwich and economy)

- **Tier 1**
  - C1 · Thick Bread (5 × 3) · +6 max sandwich HP
  - C2 · Pocket Change (5 × 3) · +8 starting crumbs
  - C3 · Crumb Catcher (2 × 4) · crumb auto-collect delay 0.6 s → 0.35 s → 0.1 s
  - C4 · Reroll (2 × 5) · +1 draft reroll per intermission
- **Tier 2**
  - C5 · Leftovers (3 × 6) · +5% crumbs from kills
  - C6 · Chef's Kiss (3 × 6) · heal 3 sandwich HP after every wave
  - C7 · Morsel Radar (1 × 8) · dropped morsels glow and show an arrow if off-screen
  - C8 · Cheap Repairs (2 × 8) · repairs cost −20% per rank
  - C9 · Fourth Card (1 × 15) · drafts show 4 cards
- **Tier 3**
  - C10 · Lucky Lunch (3 × 20) · +2% rare and +0.5% legendary draft weight
  - C11 · Picnic Basket (1 × 30) · the first wave clear each run gives a free uncommon defense blueprint
  - C12 · Seed Saver (3 × 24) · +5% seeds
  - C13 · Interest (2 × 30) · 5% interest on unspent crumbs at wave end (max 15 per wave per rank)
- **Tier 4**
  - C14 · Sourdough (1 × 60) · Second Helping is always active (once per run)
  - C15 · Golden Ratio (1 × 60) · golden elites appear 2× more often
  - C16 · Family Size (1 × 80) · +25 max sandwich HP; ants take 1 extra second to bite
  - **CK · Keystone: All You Can Eat** (1 × 100) · every 50 crumbs collected heals 1 HP; repairs disabled

#### Branch D: Exterminator (damage and status)

- **Tier 1**
  - D1 · Sharp Eye (5 × 3) · +2% critical chance (crit = ×2, shown as a bigger splat)
  - D2 · Blunt Instrument (3 × 4) · +8% Blunt damage
  - D3 · Fine Point (3 × 4) · +8% Pierce damage
  - D4 · Field Guide (1 × 5) · bestiary pages show resistances; enemy tooltips on hover
- **Tier 2**
  - D5 · Kindling (3 × 6) · +10% Fire and Burning damage
  - D6 · Live Wire (3 × 6) · +10% Shock damage; chains +1 at rank 3
  - D7 · Chemist (3 × 6) · +10% Acid and Poison damage
  - D8 · Cold Snap (3 × 6) · +10% chill applied
  - D9 · Wet Work (1 × 10) · Wet lasts 6 s and also gives +20% Blunt damage taken
- **Tier 3**
  - D10 · Armor Breaker (3 × 20) · +1 flat armor penetration on all hits
  - D11 · Giant Slayer (3 × 20) · +8% damage vs L, XL and elites
  - D12 · Exterminator's Mark (1 × 36) · every 10th kill marks the nearest elite: +30% damage taken for 5 s
  - D13 · Splash Zone (2 × 24) · +10% area for all area effects
- **Tier 4**
  - D14 · Combo Master (1 × 60) · every status combo (section 5.3) deals +25%
  - D15 · Executioner (1 × 60) · non-boss enemies under 10% HP die instantly on any hit
  - D16 · Boss Hunter (1 × 70) · +20% damage to bosses and mini-bosses
  - **DK · Keystone: Overkill** (1 × 100) · overkill damage spills into the nearest enemy (up to 3 hops); −15% max sandwich HP

#### Branch E: Naturalist (environment, biomes and quality of life)

- **Tier 1**
  - E1 · Green Thumb (1 × 3) · flowers on the map heal 1 sandwich HP when an ant is killed on them (once per flower per wave)
  - E2 · Lay of the Land (1 × 4) · trail preview arrows show the full wave composition (enemy icons per trail)
  - E3 · Pebble Pusher (1 × 5) · during intermissions, move up to 2 small props per map
  - E4 · Early Bird (2 × 4) · calling a wave early: +5% more crumbs per rank (base +10%)
- **Tier 2**
  - E5 · Bird Feeder (1 × 10) · a friendly sparrow visits every 40 s and pecks 3 ants (biomes 1, 2, 5)
  - E6 · Firefly Friends (1 × 10) · night biome: +4 roaming fireflies (light sources)
  - E7 · Twig Engineer (2 × 8) · burning props deal +50% damage to ants
  - E8 · Rain Dance (1 × 12) · once per run, trigger 10 s of rain: everything Wet, fires out
  - E9 · Puddle Jumper (1 × 8) · puddles also slow ants 35% (base 20%)
- **Tier 3**
  - E10 · Anthill Raider (2 × 24) · +20% damage to nests; destroying a nest gives +2 seeds
  - E11 · Scout Report (1 × 28) · the mini-boss is revealed one wave early; first hit on it deals ×3
  - E12 · Composting (2 × 24) · splats older than 3 s turn into fertilizer: defenses within 4 cells of 10+ splats get +10% attack speed
  - E13 · Second Map (1 × 32) · choose between 2 generated maps at run start
- **Tier 4**
  - E14 · Weather Vane (1 × 60) · 25% chance per run of a beneficial weather (breeze: flying ants −30% speed; overcast: magnifier ×1.0 at night)
  - E15 · Daily Bread (1 × 50) · Daily Seed runs give +50% seeds
  - E16 · Ecologist (1 × 70) · +1 random beneficial prop per map (flower patch, puddle or twig pile)
  - **EK · Keystone: Nature's Wrath** (1 × 100) · every 60 s a random weather event hits the ants (hail: 30 Blunt to all ground ants; gust: push all 8 cells; heat: Burning to 20 ants); the active tool's cooldowns +15%

### 10.3 Other persistent systems

- **Bestiary**: a page per enemy and boss (sprite, animated preview, icon-based stats, counters). Unlocked on first encounter; "mastered" (gold frame) at 500 kills (bosses: 3).
- **Tool mastery**: each tool tracks lifetime kills; at 1,000 / 5,000 / 20,000 kills it unlocks a palette-swap skin (e.g. the newspaper becomes a comic page, then a gold-leaf edition).
- **Achievements** (30 for Steam, a sample): first boss kill; win without placing defenses; win with only tier 1 tools; 1,000 ants with the vacuum; perfect wave on B5; reach Heat 10; complete the bestiary; 100 morsels returned; daily seed top 10% (local); kill 50 ants with one flamethrower tank.
- **Cosmetics**: sandwich skins (BLT, PB&J, baguette, club, sub), picnic blanket patterns (UI frame tint), cursor skins. All purely visual; unlocked by achievements and player levels. No purchase.

---

## 11. Biomes and environmental objects

### 11.1 Biomes

| # | Biome | Ground palette (base / dark / light) | Trail look | Props (density) | Special rule | Music mood |
|---|---|---|---|---|---|---|
| 1 | **Backyard Lawn** | `#4d9238` / `#3b762e` / `#62ae46` | Packed dirt | Rocks, twigs, dandelions, flowers, hose puddles (medium) | None (tutorial biome) | Sunny chip-pop, 128 BPM, C major |
| 2 | **City Park** | `#5a9a3c` / `#467c30` / `#73b552` + gravel `#b3a58a` | Gravel paths | Bench legs (blockers), leaf piles, flower beds, pigeons (neutral NPC) | Leaf piles hide ants | Breezy swing, 116 BPM, F major |
| 3 | **Sunny Driveway** | Concrete `#b8b2a6` / cracks `#8d877c` + grass strips | Sun-baked cracks | Sidewalk chalk, puddles, pebbles, sprinkler heads | Hot pavement: ants on concrete +15% speed; magnifier ×1.3 | Heat-haze funk, 122 BPM, D Dorian |
| 4 | **Kitchen Floor** | Checker tiles `#e9e2d0` / `#c94f3d` | Grout lines | Spilled soda (sticky puddles), crumbs (lures), cabinet shadow zones, a sleeping cat's tail (giant blocker that twitches) | Shadow zones: defenses inside −20% range | Tense march, 136 BPM, A minor |
| 5 | **Night Garden** | `#24402f` / `#1a3024` / `#33573f`, moonlight overlay | Mossy stones | Mushrooms, dew drops, garden lanterns, fireflies (mobile lights) | Darkness: enemies only visible near light | Mysterious arpeggios, 100 BPM, E minor |

### 11.2 Environmental objects

| Object | Biomes | Footprint | Blocks building | Blocks ants | Interactions |
|---|---|---|---|---|---|
| Rock | 1, 2, 3 | 4×4 to 8×6 | Yes | Yes (trails route around) | Toy soldier BBs ricochet once off rocks within 3 cells |
| Twig / Log | 1, 2 | 10×3 to 16×4 | Yes | Yes | Flammable: burns 5 s (6 DPS to ants touching); carpenters chew through (gives them a new trail link) |
| Leaf Pile | 2 | 8×8 | Yes | No | Ants inside are hidden (untargetable); wind or fire clears it (fire: burns 3 s) |
| Puddle | 1, 3, 5 | 6×4 to 12×8 | No (only sprinklers and gnomes) | No | Wet + 20% slow; Shock hitting an ant in a puddle chains through the whole puddle |
| Dandelion | 1 | 3×5 | No | No | Hit by wind or any tool: seeds burst and drift, slowing ants under them 15% for 3 s |
| Flower | 1, 2 | 3×3 | No | No | Healing hook for tree node E1 |
| Sugar Spill | 4 | 6×6 | No | No | Ants passing within 5 cells detour to eat for 2 s (a natural decoy) |
| Soda Puddle | 4 | 8×6 | No | No | Stuck for 1 s on entry (once per ant); not flammable, to keep the rules simple |
| Bench Leg | 2 | 6×6 | Yes | Yes | Pure blocker; creates natural choke points |
| Sprinkler Head | 3 | 3×3 | Yes | No | Every 15 s sprays a 10-cell circle: Wet, knocks back; puts out fire |
| Mushroom | 5 | 4×4 | Yes | No | Hit by any tool: spore puff (6-cell radius) stuns ants 1 s; 10 s regrow |
| Garden Lantern | 5 | 4×6 | Yes | No | Permanent light source (12 cells) |
| Firefly | 5 | Moving NPC | — | — | Light source (8 cells) wandering slowly; never targeted |
| Pigeon | 2 | Moving NPC | — | — | Lands every 30–50 s, pecks 2–4 ants, flies off when the player's tool hits near it |
| Cat Tail | 4 | 20×6, moves | Yes | Yes | Twitches every 20 s to a new position along an arc; ants under it on landing are squashed (counts as player kills) |
| Nest | All | 7×6 | Yes | — | Spawn point; optional target: destroying it (HP `600 × biomeHp`) cancels its remaining spawns this wave, +40 crumbs, +2 seeds (with E10); rebuilds before the next wave **(nests and nest HP exist)** |

---

## 12. Visual design

### 12.1 Rendering

- **Art canvas** 704 × 432, upscaled with sharp-bilinear filtering to any window size **(exists)**.
- **Ground** drawn by a shader each frame: biome base tones, tufts, flowers, plus fire/acid/scorch/water/frost fields uploaded as one small texture per frame **(grass, fire, acid and scorch exist)**. New fields: Wet (darker, glossy pixel highlights), Frost (white rim pixels), Honey (gold), Poison cloud (purple dither, drawn in a separate low-alpha layer).
- **Trails** baked once per map into a 176×108 trail mask texture; the ground shader renders dirt or gravel with 1-px edge darkening.
- **Sprites** in one instanced draw call from a generated atlas **(exists)**. Draw order: ground → splats → shadows → props (y-sorted) → ground enemies (y-sorted) → defenses (y-sorted with enemies) → projectiles and effects → flying enemies → UI-in-world (range circles, health bars).
- **Lighting (night biome)**: a 176×108 light texture, rasterized each frame from light sources, multiplied in the ground and sprite shaders with a 3-step posterized falloff (bright, dim, dark) for a pixel-art look.
- **Post effects** (all optional in settings): heat shimmer (boss B3), 1-frame flash on boss phase change, slight vignette at low sandwich HP (red pulse at ≤ 20%).

### 12.2 Art rules

- 1 art px outlines in the darkest tone of the object's ramp (never pure black, except night biome eyes).
- Light comes from the top-left; shadows are drop-shadow ellipses at 32% opacity **(exists)**.
- Max 4–5 tones per material ramp. Master palette of 48 colors, stored as `content/palette.ts`; every sprite must use only palette colors (validated by a test).
- Animations at 8–14 FPS (pixel-art cadence), independent of the 60 Hz simulation.
- Player things: warm, saturated, light outline. Enemies: dark bodies, one accent color. Danger telegraphs: red `#e8402a` pixel rings or arrows, blinking at 6 Hz.
- No text inside the world except damage numbers (off by default) and boss names in the banner.

### 12.3 Sprite production list (first pass)

| Group | Count | Notes |
|---|---|---|
| Enemies | 16 types × (5 directions × walk 4 + carry 4 + bite 2 + death 4) ≈ 16 × 50 frames | Shared timing makes this tractable; S ants are 11–13 px |
| Elite overlays | 5 | Palette swaps and outlines are done in the shader where possible |
| Bosses | 5 + 5 mini-bosses, each 8–24 frames | 32–64 px |
| Tools (in-world) | 16 cursors/effects (e.g. newspaper swing 4 frames) | Drawn at the pointer |
| Defenses | 12 × (idle 2–4 + attack 2–4) × 3 upgrade looks | Upgrade looks change 1–2 details each |
| Props | ~20 | Some animated (fireflies, cat tail) |
| UI icons | ~150 at 16×16, ~60 at 8×8 | Section 13 |

---

## 13. UI and UX

### 13.1 Look

Keep the **Windows 95 grey** look that the prototype has **(exists)**, but make it cleaner and bolder:

- **Panels**: face `#c0c0c0`, 1-px bevel (light `#ffffff`, dark `#808080`, outer `#000000`). Panels are drawn as pixel art at the art scale (not CSS), so they scale crisply with the game.
- **Pops of color** for meaning only: crumbs gold `#ffcc33`, sandwich health green `#4fbf57` → yellow `#e8c547` → red `#e8402a`, rarity colors (section 3.3), damage-type colors (section 5.1), and a "sticky note" yellow `#fff3a0` for tooltips and highlights.
- **Pixel font**: one bitmap font at 6×8 (UI) and a large 12×16 for numbers in banners. Candidates: *m5x7* / *m6x11* (Daniel Linssen) or *Pixel Operator*. **Verify license for commercial use before shipping** and bundle the files (no web font CDN).
- **Minimal text**: numbers, icons and pictograms. Labels appear only in tooltips (hover or long-press), and tooltips themselves are icon lines (e.g. `[fist] 14  [clock] 0.35  [circle] 3`).

### 13.2 Screen map

```
Title ─┬─ Play ── Biome select ── Loadout ── RUN (HUD ⇄ Intermission ⇄ Pause) ── Run summary ─┐
       ├─ Skill tree ◄─────────────────────────────────────────────────────────────────────────┘
       ├─ Bestiary
       ├─ Settings
       └─ Quit (desktop only)
```

### 13.3 In-run HUD (desktop, 16:9)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ [🥪 ███████████░░ 82]        ● ● ● ● ◉ ○ ○ ○ ○ ☠           [◎ 245]  [⏸][⏩] │  top bar (32 art px)
│                                                                            │
│                                                                            │
│                         PLAY FIELD 704×432 art px                          │
│                                                                            │
│                                                                            │
├────────────────────────────────────────────────────────────────────────────┤
│ [1 📰 ▓▓] [2 🪰 ░░] [3 🔨 ▓░] [4 ··]     │  [🪤25] [🎯40] [💂60] [🔒] [🔒]   │  bottom tray (40 art px)
└────────────────────────────────────────────────────────────────────────────┘
```

- **Top-left**: sandwich icon + segmented HP bar (5 HP per segment) + number. Flashes red and shakes 1 px on a bite. A small morsel icon with a count shows carried morsels that can still be recovered.
- **Top-center**: wave pips (● cleared, ◉ current, ○ upcoming; a beetle pip at 5, a skull at 10). During a wave, the current pip fills as a progress ring.
- **Top-right**: crumbs counter (gold), pause, speed toggle (1× / 2×).
- **Bottom-left**: tool hotbar. Each slot: the tool icon, number key, level pips (1–5), and a cooldown or resource meter as a vertical wipe. The active slot has a gold frame that pops (2-frame bounce) on swap.
- **Bottom-right**: defense tray: icon + cost. Unaffordable defenses are greyed with the cost in red; locked ones show a padlock. Drag (or tap, then tap the map) to place; a green or red footprint and a range circle preview placement.
- **In-world**: hovering a defense shows its range and an upgrade bubble (`▲ 45`) above it; clicking opens a compact radial: upgrade, sell, target mode (first, last, strongest, closest as 4 pictograms).
- **Boss banner**: slides down from the top bar on boss spawn: portrait (24×24), HP bar with phase notches, and mechanic meters (e.g. the molten shell).

### 13.4 Intermission

The play field dims to 60%. Three draft cards rise from the bottom tray (animated 6 frames):

```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   [rarity]   │ │   [rarity]   │ │   [rarity]   │
│   ┌──────┐   │ │   ┌──────┐   │ │   ┌──────┐   │
│   │ icon │   │ │   │ icon │   │ │   │ icon │   │   32×32 icon
│   └──────┘   │ │   └──────┘   │ │   └──────┘   │
│  NEW / ▲3    │ │ [fist] 120   │ │ [◎] +10%     │   1 line of icon stats
└──────────────┘ └──────────────┘ └──────────────┘
         [⟳ 1]                     [▶ READY]
```

Card types read at a glance: a "NEW" ribbon for new tools, a level arrow for level-ups, a blueprint (blue grid) background for defenses, and a sticky-note background for perks.

### 13.5 Run summary

A Win95 dialog: wave reached (pips), kills by enemy icon, best tool (icon with kill count), seeds earned (count-up animation with a gold crumb shower), XP bar, and new unlocks as popping icons. Buttons: [⟲ Again] [🌳 Tree] [⌂ Title].

### 13.6 Skill tree screen

- Full screen, pannable and zoomable (mouse drag and wheel; pinch on mobile). The center shows the sandwich; branches extend in 5 directions with distinct accent colors: Arsenal red, Engineering blue, Picnic gold, Exterminator purple, Naturalist green.
- Nodes are 16×16 icons in bevelled sockets: **locked** (grey silhouette), **available** (bevel lit, gentle 2-frame pulse), **ranked** (filled rank pips under the icon), **maxed** (gold frame).
- Hover or press shows a sticky-note tooltip: icon line of the effect per rank, cost, and the next rank's value. Buying a rank plays a 3-frame "pop" and a crumb-coin sound.
- Tier gates are drawn as fence lines with a padlock and the requirement as icons (seed count and level).

### 13.7 Mobile layout

- Landscape only. HUD bars are 25% larger; the tray splits so tools sit at the bottom-left and defenses at the bottom-right within thumb reach.
- Tools: tap or hold on the field to use. **Drag** tools (salt shaker) use one-finger drag; hold tools use press-and-hold, aimed at the finger with a 24-px upward offset so the finger doesn't hide the effect.
- Defenses: drag from the tray onto the field; the placement ghost floats 48 px above the finger.
- Pause and speed sit at the top-right; a two-finger tap also pauses.

### 13.8 Accessibility and settings

- Volume sliders (master, music, SFX), mute when unfocused.
- Screen shake on/off; flashes reduced (no full-screen flashes, boss flashes replaced by banner pulses).
- Colorblind support: every damage type and rarity also has a unique icon shape; health uses segment count, not only color.
- UI scale 100–150%; damage numbers on/off; hold-to-toggle for hold tools.
- Key remapping (desktop); gamepad: left stick moves a virtual cursor, triggers use the tool, bumpers swap tools.
- Pause on focus loss (desktop, mobile background).

---

## 14. Audio

### 14.1 Synth

All audio is synthesized at runtime with the Web Audio API, styled like an 8-bit console, so there are **no sample files** (tiny build, no licensing):

| Channel | Waveform | Use |
|---|---|---|
| Pulse 1 | Square with duty 12.5 / 25 / 50% | Lead melody, UI blips |
| Pulse 2 | Same | Harmony, arpeggios |
| Triangle | Triangle (4-bit stepped, via a 32-step periodic wave) | Bass, kick-like drops |
| Noise | Two noise modes: long LFSR (hiss) and short LFSR (metallic) | Drums, hits, explosions, fire crackle |

Music uses one instance of each channel. SFX use a pool of 8 extra voices (pulse or noise) with priorities, so music never cuts out. Output goes through a gentle low-pass (cutoff 9 kHz) and a soft limiter to keep many simultaneous hits pleasant.

### 14.2 Music

Stored as tracker-style pattern data (`content/music/*.ts`: rows of note, instrument, effect per channel; 4–8 patterns per song).

| Track | Length (loop) | Tempo | Notes |
|---|---|---|---|
| Title | 48 s | 112 | Catchy pulse lead, the main motif |
| Biome 1–5 | 64–96 s each | Per section 11.1 | Motif variations per biome. Two intensity layers: calm (bass + drums) between groups, full during spawn groups |
| Intermission | 16 s | Same as biome | Same key, drums out, arpeggio pad |
| Mini-boss | 32 s | +8 BPM | Biome theme in a minor key |
| Boss (×5) | 48–64 s | 140–150 | Each phase adds a layer; phase break plays a 1-bar stinger |
| Victory / Defeat | 4 s / 3 s | — | Stingers |
| Skill tree | 40 s | 96 | Calm, plucky |

### 14.3 Sound effects

Defined as small parameter objects (sfxr-style: wave, attack, sustain, decay, start frequency, slide, vibrato, duty, noise mode), rendered on demand and cached as `AudioBuffer`s.

| Category | Sounds |
|---|---|
| Ants | Footstep patter (1 per 30 ants nearby, very quiet), bite (crunch), morsel pickup (ding), death squish (3 variants, pitch-randomized ±8%), burrow, emerge, flying buzz loop (volume by count) |
| Tools | Newspaper swat, swatter thwack, slipper stomp (low), spray pssh, hammer bonk (+ metallic ring on crit), magnifier sizzle (rising pitch with ramp), vacuum whir (loop, pitch rises with bag fill), salt sprinkle, bug spray hiss, bomb fuse + boom, acid fizz, freeze crackle, blower whoosh, flame roar loop, lightning zap, laser hum |
| Defenses | Place (wooden clunk), upgrade (two-note rise), sell (coin drop), mousetrap snap, BB pop, zapper buzz, sprinkler tick-tick, candle crackle, gnome chomped (thud), flytrap snap, tesla charge-up + discharge |
| UI | Hover blip, click, card flip, card select, reroll shuffle, crumb collect (pitch climbs with a quick streak), seed count-up ticks, tree node buy (pop + coin), error buzz |
| Events | Wave start horn (3 notes), wave clear jingle, boss roar (noise sweep + pulse growl), phase break stinger, sandwich low-HP heartbeat (triangle thump at ≤ 20%), defeat |

**Mixing rules**: max 3 instances of the same SFX at once; ant deaths limited to one per 40 ms (later ones are skipped and the next one plays slightly louder to keep the feel); music ducks −6 dB for 400 ms on boss roars.

---

## 15. Technical architecture

### 15.1 Goals

- **Self-contained**: the game must lift out of this repository with no changes except deleting the host wrapper.
- **Framework-free core**: simulation, rendering and audio have no React dependency.
- **Deterministic** simulation for seeds, replays, balancing bots and bug reproduction.
- **Fast**: 60 FPS with 600 enemies on an integrated GPU and mid-range phones.

### 15.2 Package layout (target)

```
ant-exterminator/                    # becomes its own repo
├─ package.json                      # name: ant-exterminator, type: module
├─ docs/GAME_DESIGN.md               # this document
├─ src/
│  ├─ index.ts                       # public API: mountGame(), types
│  ├─ core/                          # pure TS, no DOM, no Math.random
│  │  ├─ rng.ts                      # sfc32 seeded PRNG
│  │  ├─ sim.ts                      # fixed-step loop, system order
│  │  ├─ state.ts                    # SoA entity stores, run state
│  │  ├─ systems/                    # spawn, movement, pathing, combat, status, economy, waves, bosses
│  │  ├─ map/                        # generation, trails, flow fields
│  │  └─ events.ts                   # typed event queue → audio, VFX, UI
│  ├─ content/                       # data only: enemies, tools, defenses, bosses, biomes, tree, perks, palette, music, sfx
│  ├─ render/                        # WebGL2: ground shader, sprite batch, atlas, lighting, post  (current renderer lives here)
│  ├─ audio/                         # Web Audio synth, sequencer, sfx cache, mixer
│  ├─ ui/                            # pixel UI: HUD, menus, tree (drawn in the sprite batch, not DOM)
│  ├─ input/                         # pointer, touch, keyboard, gamepad → unified intents
│  ├─ platform/                      # Platform interface + web/tauri/capacitor adapters
│  └─ save/                          # versioned save schema + migrations
├─ tools/
│  ├─ sim-cli.ts                     # headless balancing runs → CSV
│  └─ sprite-preview.ts              # atlas preview PNG (the preview script from development)
└─ tests/                            # unit tests (formulas, rng, save migrations, palette validation)
```

**Public API** (the only thing hosts use):

```ts
export type GameOptions = {
  platform?: Platform;           // defaults to the web adapter (localStorage, no achievements)
  seed?: number;                 // daily / debug seeds
  onExit?: () => void;           // host may close the window
};
export function mountGame(container: HTMLElement, options?: GameOptions): { destroy(): void };
```

The suuronen.dev desktop window becomes a 10-line wrapper calling `mountGame` in an effect.

### 15.3 UI technology decision

The UI is drawn **inside the WebGL canvas** with the same sprite batch and a bitmap font, not as DOM/React:

- one rendering path, identical on web, Tauri and Capacitor;
- pixel-perfect scaling with the game;
- no layout or focus issues inside a host page.

Cost: building a small immediate-mode UI layer (buttons, panels, scroll view, tooltip). That's about 1,000 lines, acceptable for the control and portability gained. The current React toolbar and overlays **(exist)** are replaced in milestone M3.

### 15.4 Simulation

- **Fixed timestep** 60 Hz with an accumulator; rendering interpolates positions between the last two ticks. A slow device drops render frames, never simulation accuracy (max 5 catch-up steps per frame, then slow down time).
- **Game speed** 2× = 2 sim steps per frame.
- **RNG**: sfc32 seeded per run; separate streams for map generation, waves, drafts and combat so that, e.g., drafting doesn't change the next map.
- **Entities**: structure-of-arrays typed arrays with a free list (`x`, `y`, `hp`, `trail`, `s`, `lane`, `status flags`, ...). Pools for enemies (max 1,024), projectiles (2,048), effects (2,048). No per-frame allocation in the hot path.
- **System order per tick**: input intents → tool use → defenses → projectiles → status ticks → movement (trail / flow field) → separation → bites and carriers → deaths and drops → wave director → boss scripts → event flush.
- **Spatial hash** (4-cell buckets) rebuilt each tick for area queries.
- **Events** (`AntDied`, `ToolUsed`, `Bite`, `BossPhase`, ...) are queued by the core and consumed by audio, VFX and UI, so the core never calls them directly.

### 15.5 Rendering budgets

| Item | Budget |
|---|---|
| Draw calls per frame | ≤ 6 (ground, lighting, sprites, UI sprites, post, blit) |
| Sprite instances | ≤ 12,000 (renderer capacity **exists**) |
| Field texture upload | 176×108 RGBA per frame (≈ 76 KB) **(exists)** |
| Sim tick | ≤ 4 ms on a mid phone at 600 enemies |
| Memory | ≤ 150 MB |

### 15.6 Saves

- One JSON document with `schemaVersion`, written through the Platform storage adapter: `profile` (seeds, XP, tree ranks, unlocks, bestiary, settings, achievements) and an optional `run` (snapshot taken at each intermission: seed, wave, map seed, owned tools and levels, defenses, crumbs, sandwich HP, perks).
- Saves **only at intermissions**, which keeps snapshots small and avoids saving mid-chaos. Quitting mid-wave restarts that wave on resume.
- Migrations: an ordered list of `(fromVersion) → transform` functions, covered by tests with fixtures.
- Steam Cloud: the save file lives in the app's data folder, synced with Steam Auto-Cloud (no API calls needed).

### 15.7 Platform adapter

```ts
interface Platform {
  storage: { read(key: string): Promise<string | null>; write(key: string, value: string): Promise<void> };
  achievements: { unlock(id: string): void };     // Steam via plugin, no-op on web
  haptics?: { tap(strength: "light" | "heavy"): void }; // mobile
  setFullscreen?(on: boolean): void;
  quit?(): void;
}
```

### 15.8 Testing

- Unit tests: scaling formulas, budgets, draft weights, rng determinism, save migrations, palette compliance of sprites, skill tree cost totals.
- Determinism test: the same seed and scripted inputs produce the same state hash after 10 waves.
- Headless balance bands in CI (section 9.7).

---

## 16. Platforms and release

| Target | Wrapper | Notes |
|---|---|---|
| Web | Vite build of `ant-exterminator` | Embedded in suuronen.dev; also a standalone page for sharing |
| Desktop (Steam) | **Tauri 2** (small binaries, system WebView) | Steamworks via a Rust plugin (achievements, cloud via Auto-Cloud). If WebView2/WebKitGTK GPU issues appear on test machines, fall back to Electron |
| Mobile | **Capacitor** | Landscape lock, safe-area insets, haptics plugin; storage via Preferences |

**Steam readiness checklist**: 1280×720 minimum resolution and windowed/fullscreen toggle; gamepad support (Steam Deck verified target: 1280×800 layout, readable 6×8 font at that size); offline play; achievements; cloud saves; store assets (capsules, 5+ screenshots, trailer).

**Monetization**: premium, one-time purchase (desktop). Mobile: premium, or free demo (biome 1–2) with a one-time unlock. No ads, no loot boxes.

---

## 17. Migration from the current prototype

What exists today and where it goes:

| Today **(exists)** | Becomes |
|---|---|
| `AntGameApp.tsx` (~1,500 lines; sim, input, HUD state in one React component) | Split into `core/` systems; the React file becomes the `mountGame` wrapper |
| Free-roaming ants toward the sandwich in straight lines | Trail walking with lanes (section 4.3) |
| Nests to destroy as the win condition | Nests as spawn points with an optional raid (section 11.2) |
| 4 weapons with 3 upgrade stats × 8 levels, bought with coins | Late-game tools (T10, T11, T14, T15) with in-run levels and forks |
| 15 waves | 10-wave biome runs + Endless |
| Coins (in-run, decaying with spawn speed) | Crumbs (section 9.4); the decay mechanic is dropped (it punishes good play) |
| React toolbar and overlays, Win95 look | Pixel UI in the canvas, same look (section 13) |
| WebGL2 renderer, sprite atlas, grass shader | Kept and extended (`render/`) |
| No audio | Web Audio synth (section 14) |
| No saves | Versioned saves (section 15.6) |

---

## 18. Milestones

Each milestone ends with a playable build and the listed exit criteria.

| # | Milestone | Scope | Exit criteria |
|---|---|---|---|
| M0 | **Extraction** | Move the game into `ant-exterminator/` with the target layout; core sim split from React; seeded RNG; fixed timestep; `mountGame` API | Current gameplay unchanged; the desktop wrapper is ≤ 20 lines; determinism test passes |
| M1 | **Trail TD vertical slice** | Map generation (B1 templates), trail walking, morsel carriers, 4 tools (T1, T2, T3, T5), 4 defenses (D1, D2, D3, D5), enemies E1–E4, waves 1–10 of B1, Queen Bertha, draft cards (simple) | A full B1 run is fun in playtests (3+ people): average run 10–13 min |
| M2 | **Meta progression** | Seeds, XP, saves, the full skill tree data + screen (functional UI), bestiary stub | Tree purchases persist; first win reachable in 2–5 runs by playtesters |
| M3 | **UI rework** | Pixel UI layer, all screens per section 13, mobile layout | All flows usable without reading text (5-person hallway test) |
| M4 | **Audio** | Synth, SFX list, B1 + title + boss music | No clipping with 300 ants dying; music layers react to waves |
| M5 | **Content** | Biomes 2–5, remaining tools, defenses, enemies, bosses, mini-bosses, props, Heat levels, Endless, Daily Seed | Balance bands pass for every biome |
| M6 | **Platforms** | Tauri build + Steamworks, Capacitor builds, gamepad, settings, accessibility | Runs on Windows, macOS, Linux/Steam Deck, Android, iOS test devices at 60 FPS |
| M7 | **Polish and launch** | Achievements, cosmetics, store assets, trailer, localization-ready strings, bug bash | Release candidate |

---

## 19. Open questions

1. **Title**: keep "Ant Exterminator" or rename (e.g. *Crumb Defense*, *Picnic Panic*) before a store page exists?
2. **Pixel font license**: pick and verify one (section 13.1).
3. **Speed toggle on mobile**: 2× only, or also 3×?
4. **Nest raids**: keep as optional objective (current proposal) or remove to keep the TD focus pure?
5. **Daily Seed leaderboards**: local only in 1.0, or online (needs a backend or Steam leaderboards)?
6. **Hold tools on touch**: the 24-px aim offset needs playtesting; alternative is a "lock-on" mode.
7. **Tauri vs Electron**: confirm WebGL2 performance in WebView2 and WebKitGTK on low-end hardware during M6.
