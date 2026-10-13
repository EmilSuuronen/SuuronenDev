// Pixel art for the ant game, authored as character grids.
// Each character maps to a color in the sprite's palette; "." is transparent.
// Sprites are packed into one atlas texture at startup (see buildAtlas).

export type SpriteDef = {
  palette: Record<string, string>;
  rows: string[];
};

const OUTLINE = "#1a120c";

const antPalette = {
  k: OUTLINE,
  a: "#2a1c15",
  b: "#4f3628",
  c: "#8a6248",
  r: "#b8432e",
};

// Ants face east; the renderer rotates them in 90 degree steps so the art is never resampled.
// Two frames of an alternating-tripod walk.
const antEastA: SpriteDef = {
  palette: antPalette,
  rows: [
    ".............",
    "...k.k...k...",
    "....k.k.k..kk",
    ".aaa.kkk..k..",
    "accba.ba.abak",
    "abbbakbakaaa.",
    "aaaaa.aa.aaak",
    ".aaa.kkk..k..",
    "....k.k.k..kk",
    "....k..kk....",
    ".............",
  ],
};

const antEastB: SpriteDef = {
  palette: antPalette,
  rows: [
    ".............",
    "....k..kk....",
    "....k.k.k..kk",
    ".aaa.kkk..k..",
    "accba.ba.abak",
    "abbbakbakaaa.",
    "aaaaa.aa.aaak",
    ".aaa.kkk..k..",
    "....k.k.k..kk",
    "...k.k...k...",
    ".............",
  ],
};

const dirtPalette = {
  k: "#3b220f",
  d: "#6b4321",
  e: "#8f5d2f",
  f: "#b47d45",
  g: "#d9a868",
  h: "#1c0f06",
  s: "#efcf96",
};

const anthill: SpriteDef = {
  palette: dirtPalette,
  rows: [
    "...........kkkkkk...........",
    ".........kkgfgffgkk.........",
    "........kfgsfgfgffek........",
    ".......kffggfkkkffeek.......",
    "......kffgfkkhhhkkfeedk.....",
    ".....kffgfekhhhhhhkeeedk....",
    "....kffgfeekhhhhhhkeeddk....",
    "...kffgfeeeekkhhkkeeedddk...",
    "..kffgffeeeeeekkeeeeeddddk..",
    ".kffgfgfeeseeeeeeeseeedddk..",
    ".kfgffeeeeeeeeseeeeeedddddk.",
    "kffgfeeeseeeeeeeeeeeddddddk.",
    "kfffeeeeeeeeeeeseeeeddddddk.",
    ".kffeeeseeeeeeeeeeddddddddk.",
    ".kkfeeeeeeeeeeeeddddddddkk..",
    "...kkkeeeeeeeddddddddkkk....",
    "......kkkkkkkkkkkkkkk.......",
  ],
};

const anthillCracked: SpriteDef = {
  palette: dirtPalette,
  rows: [
    "...........kkkkkk...........",
    ".........kkgfkffgkk.........",
    "........kfgskgfgffek........",
    ".......kffggkkkkffeek.......",
    "......kffgfkkhhhkkfeedk.....",
    ".....kffgfekhhhhhhkeeedk....",
    "....kffgfeekhhhhhhkeedddk...",
    "...kffgkeeeekkhhkkeeekddk...",
    "..kffgfkkeeeeekkeeeekkdddk..",
    ".kffgfgfeeseeeeeeeskeeddddk.",
    ".kfgffeeeekkeeseeekeedddddk.",
    "kffgfeeeseekkeeeeeeeddddddk.",
    "kfffeeeeeeeeekeseeeeddkdddk.",
    ".kffeeeseeeeeeeeeedddkddddk.",
    ".kkfeeeeeeeeeeeeddddddddkk..",
    "...kkkeeeeeeeddddddddkkk....",
    "......kkkkkkkkkkkkkkk.......",
  ],
};

const anthillRuin: SpriteDef = {
  palette: dirtPalette,
  rows: [
    "............................",
    "............................",
    "............................",
    "............................",
    "............................",
    "...........k...k............",
    ".........kfek.kek...........",
    "......kk.kedkkkdk.kk........",
    ".....kfekkkhhhhhkkkek.......",
    "....kfeeekhhhhhhhhkeedk.....",
    "...kfeseekhhhhhhhhkedddk....",
    "..kfeeeeeekhhhhhhkeedddk....",
    "..kfeeeseeekkkkkkeeeddddk...",
    "...kfeeeeeeeeeeeseeddddk....",
    "....kkeeeeeseeeeedddkkk.....",
    "......kkkkkkkkkkkkkk........",
    "............................",
  ],
};

const sandwichPalette = {
  k: "#3a2410",
  c: "#a8642a",
  C: "#c98a42",
  w: "#f2d496",
  W: "#fbe8bd",
  y: "#ffcc33",
  Y: "#ffe27a",
  l: "#3f9a32",
  L: "#7cd14e",
  t: "#c7362a",
  T: "#ef6a4f",
  p: "#e98f8f",
};

const sandwich: SpriteDef = {
  palette: sandwichPalette,
  rows: [
    "......kkkkkkkkkkkkkkkkk.......",
    "....kkCWWWWWWWWWWWWWWWCkk.....",
    "...kCWWwWWWWWWWwWWWWWWWCck....",
    "..kCWWWWWWwWWWWWWWWWwWWWCck...",
    "..kCwWWWWWWWWWWwWWWWWWWwCck...",
    "..kcCCCCCCCCCCCCCCCCCCCCCck...",
    ".kLLlLLlLLLlLLLlLLlLLLlLLlLk..",
    ".klLYYYYlYYYYYYlYYYYYlYYYLlk..",
    "..kyyYyyyyyyTTyyyyyyyyyyyyk...",
    "..ktTTttTTTtTTtTTTttTTTttTk...",
    "..kppppppppppppppppppppppck...",
    "..kcwwwwwwwwwwwwwwwwwwwwwck...",
    "..kcwwwwwwWwwwwwwwwwwWwwwck...",
    "..kcccccccccccccccccccccccck..",
    "...kkkkkkkkkkkkkkkkkkkkkkkk...",
  ],
};

// Bites taken out of the top-right corner as the sandwich loses health.
const sandwichBitten: SpriteDef = {
  palette: sandwichPalette,
  rows: [
    "......kkkkkkkkkkkkkk..........",
    "....kkCWWWWWWWWWWWWk..........",
    "...kCWWwWWWWWWWwWWWk.kk.......",
    "..kCWWWWWWwWWWWWWWWWkWCk......",
    "..kCwWWWWWWWWWWwWWWWWWwCk.....",
    "..kcCCCCCCCCCCCCCCCCCCCCk.....",
    ".kLLlLLlLLLlLLLlLLlLLLlLLk....",
    ".klLYYYYlYYYYYYlYYYYYlYYk.....",
    "..kyyYyyyyyyTTyyyyyyyyyyk.....",
    "..ktTTttTTTtTTtTTTttTTTTk.....",
    "..kppppppppppppppppppppppk....",
    "..kcwwwwwwwwwwwwwwwwwwwwwck...",
    "..kcwwwwwwWwwwwwwwwwwWwwwck...",
    "..kcccccccccccccccccccccccck..",
    "...kkkkkkkkkkkkkkkkkkkkkkkk...",
  ],
};

const sandwichEaten: SpriteDef = {
  palette: sandwichPalette,
  rows: [
    "..............................",
    "..............................",
    "......kkkkkkkkkk..............",
    "....kkCWWWWWWWWWk.............",
    "...kCWWwWWWWWWWWWk............",
    "...kcCCCCCCCCCCCCk.kk.........",
    "..kLLlLLlLLLlLLLlLkkLk........",
    "..klLYYYYlYYYYYYlYYYYk........",
    "...kyyYyyyyyyTTyyyyyyk........",
    "...ktTTttTTTtTTtTTTtTk........",
    "...kpppppppppppppppppk........",
    "...kcwwwwwwwwwwwwwwwwwk.......",
    "...kcwwwwwwWwwwwwwwwwwwk......",
    "...kcccccccccccccccccccck.....",
    "....kkkkkkkkkkkkkkkkkkkk......",
  ],
};

const crumbsPalette = { k: "#3a2410", c: "#a8642a", w: "#f2d496" };

const sandwichCrumbs: SpriteDef = {
  palette: crumbsPalette,
  rows: [
    "..............................",
    "..............................",
    "..............................",
    "..............................",
    "..............................",
    "............kk................",
    "......k....kwck.......k.......",
    ".....kwk....kk...kk..kwk......",
    "......k.........kcwk..k.......",
    "...........kk....kk...........",
    "..kk......kwck.........kk.....",
    ".kcwk......kk.....k...kwck....",
    "..kk.............kwk...kk.....",
    "..................k...........",
    "..............................",
  ],
};

// Death splats are drawn white and tinted per death type by the renderer.
const splatPalette = { w: "#ffffff", g: "#9a9a9a" };

const splatA: SpriteDef = {
  palette: splatPalette,
  rows: [
    "..g...g..",
    "...g.g...",
    ".g.www.g.",
    "..wwwwwg.",
    "gwwgwww..",
    "..wwwww.g",
    ".g.www.g.",
    "...g..g..",
    "..g......",
  ],
};

const splatB: SpriteDef = {
  palette: splatPalette,
  rows: [
    ".........",
    ".g..g..g.",
    "..gwww.g.",
    ".wwwwwwg.",
    "gwwwgwwg.",
    ".gwwwww..",
    "..www.gg.",
    ".g...g..g",
    ".........",
  ],
};

const splatC: SpriteDef = {
  palette: splatPalette,
  rows: [
    "....g....",
    ".g..g..g.",
    "..gwww...",
    ".gwwwwwg.",
    "g.wwgwwwg",
    "..wwwww..",
    ".g.www.g.",
    "..g...g..",
    ".........",
  ],
};

const shadowPalette = { s: "#000000" };

const shadowSmall: SpriteDef = {
  palette: shadowPalette,
  rows: [".sssss.", "sssssss", ".sssss."],
};

const shadowLarge: SpriteDef = {
  palette: shadowPalette,
  rows: [
    ".....ssssssssssssssss.....",
    "..ssssssssssssssssssssss..",
    "ssssssssssssssssssssssssss",
    "..ssssssssssssssssssssss..",
    ".....ssssssssssssssss.....",
  ],
};

const solid: SpriteDef = { palette: { w: "#ffffff" }, rows: ["w"] };

export const spriteDefs = {
  antEastA,
  antEastB,
  anthill,
  anthillCracked,
  anthillRuin,
  sandwich,
  sandwichBitten,
  sandwichEaten,
  sandwichCrumbs,
  splatA,
  splatB,
  splatC,
  shadowSmall,
  shadowLarge,
  solid,
};

export type SpriteName = keyof typeof spriteDefs;

export type SpriteFrame = { h: number; u: number; v: number; w: number };

export type Atlas = {
  frames: Record<SpriteName, SpriteFrame>;
  height: number;
  pixels: Uint8Array;
  width: number;
};

function hexToRgb(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

// Shelf-packs every sprite into one RGBA buffer with a 1px gap so nearest
// sampling never bleeds into a neighbor.
export function buildAtlas(width = 128): Atlas {
  const entries = Object.entries(spriteDefs) as Array<[SpriteName, SpriteDef]>;
  const frames = {} as Record<SpriteName, SpriteFrame>;
  let x = 0;
  let y = 0;
  let shelf = 0;

  for (const [name, def] of entries) {
    const w = Math.max(...def.rows.map((row) => row.length));
    const h = def.rows.length;
    if (x + w > width) {
      x = 0;
      y += shelf + 1;
      shelf = 0;
    }
    frames[name] = { h, u: x, v: y, w };
    x += w + 1;
    shelf = Math.max(shelf, h);
  }

  const height = 2 ** Math.ceil(Math.log2(y + shelf));
  const pixels = new Uint8Array(width * height * 4);

  for (const [name, def] of entries) {
    const frame = frames[name];
    def.rows.forEach((row, rowIndex) => {
      for (let column = 0; column < row.length; column += 1) {
        const color = def.palette[row[column] as keyof typeof def.palette];
        if (!color) continue;
        const [r, g, b] = hexToRgb(color);
        const offset = ((frame.v + rowIndex) * width + frame.u + column) * 4;
        pixels[offset] = r;
        pixels[offset + 1] = g;
        pixels[offset + 2] = b;
        pixels[offset + 3] = 255;
      }
    });
  }

  return { frames, height, pixels, width };
}
