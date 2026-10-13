import { GRID_HEIGHT, GRID_WIDTH } from "../engine/constants";
import { buildAtlas, type SpriteFrame, type SpriteName } from "./sprites";

// Art pixels per simulation grid cell. The game logic stays on the 176x108 grid;
// everything is drawn at 4x that so sprites have room for detail.
export const ART_SCALE = 4;
export const ART_WIDTH = GRID_WIDTH * ART_SCALE;
export const ART_HEIGHT = GRID_HEIGHT * ART_SCALE;

// Per-instance floats: x, y, w, h (art px), u, v (atlas px), rotation (0-3 quarter turns),
// r, g, b, a, mix. Shading is mix(texel * color, color, mix): white + 0 keeps the art,
// a color + 0 tints it, a color + mix pushes it toward a flat color (burning ants).
const FLOATS_PER_INSTANCE = 12;
// rotation value telling the sprite shader to fill the rect from the atlas's single white pixel
const SOLID_RECT = 4;
const MAX_INSTANCES = 12000;

const fullscreenVertex = `#version 300 es
const vec2 corners[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
void main() {
  gl_Position = vec4(corners[gl_VertexID], 0.0, 1.0);
}`;

// Grass, plus scorch / acid / fire read from the simulation field (R = fire, G = acid, B = scorch).
const groundFragment = `#version 300 es
precision highp float;
uniform sampler2D uField;
uniform vec2 uArtSize;
uniform float uTime;
out vec4 outColor;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}

float bayer4(vec2 p) {
  int x = int(mod(p.x, 4.0));
  int y = int(mod(p.y, 4.0));
  int index = x + y * 4;
  int m[16] = int[16](0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5);
  return (float(m[index]) + 0.5) / 16.0;
}

vec3 grass(vec2 p) {
  // three tones in soft patches, dithered where they meet
  float n = valueNoise(p / 90.0) * 0.7 + valueNoise(p / 31.0) * 0.3;
  float d = bayer4(p) * 0.08 - 0.04;
  vec3 col = n + d < 0.4 ? vec3(0.275, 0.533, 0.208) : n + d < 0.62 ? vec3(0.302, 0.573, 0.224) : vec3(0.333, 0.612, 0.243);

  // grass tufts: one per 7x7 cell at a random spot, tips sway a pixel in the wind
  vec2 cell = floor(p / 7.0);
  float r = hash(cell);
  if (r < 0.2) {
    vec2 t = cell * 7.0 + floor(vec2(hash(cell + 7.1), hash(cell + 3.7)) * 4.0) + 1.0;
    float sway = step(0.75, sin(uTime * 1.3 + cell.x * 0.55 + cell.y * 0.3));
    vec2 q = p - t;
    bool tip = (q.y == 0.0 && (q.x == -1.0 + sway || q.x == 1.0 + sway)) || (q.y == -1.0 && q.x == sway);
    bool blade = q.y == 1.0 && abs(q.x) <= 1.0;
    bool root = q.y == 2.0 && abs(q.x) <= 1.0;
    if (tip) col = vec3(0.427, 0.71, 0.29);
    else if (blade) col = vec3(0.373, 0.651, 0.267);
    else if (root) col = vec3(0.22, 0.447, 0.173);
  }

  // rare flowers on a coarser grid
  vec2 fcell = floor(p / 23.0);
  float fr = hash(fcell + 19.3);
  if (fr < 0.045) {
    vec2 c = fcell * 23.0 + floor(vec2(hash(fcell + 1.3), hash(fcell + 8.9)) * 17.0) + 3.0;
    vec2 q = abs(p - c);
    vec3 petal = fr < 0.02 ? vec3(0.98, 0.96, 0.9) : fr < 0.033 ? vec3(1.0, 0.82, 0.25) : vec3(0.93, 0.55, 0.78);
    if (q.x + q.y == 0.0) col = vec3(0.98, 0.78, 0.2);
    else if (q.x + q.y == 1.0) col = petal;
    else if (q.x == 1.0 && q.y == 1.0) col = vec3(0.2, 0.41, 0.16);
  }
  return col;
}

void main() {
  vec2 p = vec2(floor(gl_FragCoord.x), uArtSize.y - 1.0 - floor(gl_FragCoord.y));
  vec3 col = grass(p);
  vec4 field = texture(uField, (p + 0.5) / uArtSize);
  float dither = bayer4(p) * 0.18 - 0.09;

  // dry grass at the edges, charred earth in the middle; light enough that ants still show on it
  float scorch = field.b + dither * 0.5;
  if (scorch > 0.27) col = vec3(0.29, 0.22, 0.14);
  else if (scorch > 0.1) col = vec3(0.45, 0.42, 0.18);

  float acid = field.g + dither;
  if (acid > 0.47) {
    col = vec3(0.227, 0.604, 0.141);
    if (hash(p + floor(uTime * 3.0)) > 0.985) col = vec3(0.8, 1.0, 0.48);
  } else if (acid > 0.16) {
    col = vec3(0.482, 0.863, 0.227);
  }

  float flicker = valueNoise(p / 3.0 + vec2(0.0, uTime * 9.0)) * 0.22 - 0.11;
  // dither and flicker only shape existing flames; an empty cell must never light up
  float fire = field.r > 0.04 ? field.r + dither + flicker : 0.0;
  if (fire > 0.67) col = vec3(1.0, 0.94, 0.59);
  else if (fire > 0.35) col = vec3(1.0, 0.6, 0.18);
  else if (fire > 0.16) col = vec3(0.83, 0.3, 0.04);

  outColor = vec4(col, 1.0);
}`;

const spriteVertex = `#version 300 es
layout(location = 0) in vec2 aCorner;
layout(location = 1) in vec4 iRect;
layout(location = 2) in vec3 iUvRot;
layout(location = 3) in vec4 iColor;
layout(location = 4) in float iMix;
uniform vec2 uArtSize;
uniform vec2 uAtlasSize;
out vec2 vUv;
out vec4 vColor;
out float vMix;

void main() {
  vec2 q = aCorner;
  int rot = int(iUvRot.z);
  // map the screen-space corner back into east-facing sprite space
  vec2 s = rot == 1 ? vec2(q.y, 1.0 - q.x) : rot == 2 ? 1.0 - q : rot == 3 ? vec2(1.0 - q.y, q.x) : rot == 4 ? vec2(0.5) : q;
  vec2 frameSize = rot == 4 ? vec2(1.0) : (rot == 1 || rot == 3) ? iRect.wz : iRect.zw;
  vUv = (iUvRot.xy + s * frameSize) / uAtlasSize;
  vColor = iColor;
  vMix = iMix;
  vec2 pos = iRect.xy + q * iRect.zw;
  gl_Position = vec4(pos.x / uArtSize.x * 2.0 - 1.0, 1.0 - pos.y / uArtSize.y * 2.0, 0.0, 1.0);
}`;

const spriteFragment = `#version 300 es
precision mediump float;
uniform sampler2D uAtlas;
in vec2 vUv;
in vec4 vColor;
in float vMix;
out vec4 outColor;

void main() {
  vec4 texel = texture(uAtlas, vUv);
  if (texel.a < 0.5) discard;
  outColor = vec4(mix(texel.rgb * vColor.rgb, vColor.rgb, vMix), vColor.a);
}`;

// Sharp-bilinear upscale: crisp pixel edges at any (fractional) display scale without shimmer.
const blitFragment = `#version 300 es
precision highp float;
uniform sampler2D uScene;
uniform vec2 uSrcSize;
uniform vec2 uOutSize;
out vec4 outColor;

void main() {
  vec2 uv = vec2(gl_FragCoord.x, gl_FragCoord.y) / uOutSize;
  vec2 texel = uv * uSrcSize;
  vec2 scale = max(uOutSize / uSrcSize, vec2(1.0));
  vec2 region = 0.5 - 0.5 / scale;
  vec2 centerDist = fract(texel) - 0.5;
  vec2 f = (centerDist - clamp(centerDist, -region, region)) * scale + 0.5;
  outColor = texture(uScene, (floor(texel) + f) / uSrcSize);
}`;

function compile(gl: WebGL2RenderingContext, vertexSource: string, fragmentSource: string) {
  const program = gl.createProgram()!;
  for (const [type, source] of [
    [gl.VERTEX_SHADER, vertexSource],
    [gl.FRAGMENT_SHADER, fragmentSource],
  ] as const) {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(`Ant game shader failed to compile: ${gl.getShaderInfoLog(shader)}`);
    }
    gl.attachShader(program, shader);
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(`Ant game shader failed to link: ${gl.getProgramInfoLog(program)}`);
  }
  return program;
}

function createTexture(gl: WebGL2RenderingContext, filter: number) {
  const texture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return texture;
}

export type SpriteBatch = {
  /** Draw a sprite with its top-left corner at (x, y) in art pixels. */
  sprite: (name: SpriteName, x: number, y: number, rotation?: number, color?: Rgba, mix?: number) => void;
  /** Draw a solid rectangle in art pixels. */
  rect: (x: number, y: number, w: number, h: number, color: Rgba) => void;
  frame: (name: SpriteName) => SpriteFrame;
};

export type Rgba = readonly [number, number, number, number];

const WHITE: Rgba = [1, 1, 1, 1];

export function createAntGameRenderer(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl2", { alpha: false, antialias: false, premultipliedAlpha: false });
  if (!gl || gl.isContextLost()) {
    console.warn("Ant game: WebGL2 is not available, the board cannot be drawn.");
    return null;
  }

  try {
    return setUpRenderer(gl, canvas);
  } catch (error) {
    console.warn(error);
    return null;
  }
}

function setUpRenderer(gl: WebGL2RenderingContext, canvas: HTMLCanvasElement) {
  const atlas = buildAtlas();
  const groundProgram = compile(gl, fullscreenVertex, groundFragment);
  const spriteProgram = compile(gl, spriteVertex, spriteFragment);
  const blitProgram = compile(gl, fullscreenVertex, blitFragment);

  const atlasTexture = createTexture(gl, gl.NEAREST);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, atlas.width, atlas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, atlas.pixels);

  // linear so field edges become smooth blobs at art resolution instead of 4x4 blocks
  const fieldTexture = createTexture(gl, gl.LINEAR);
  const fieldPixels = new Uint8Array(GRID_WIDTH * GRID_HEIGHT * 4);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, GRID_WIDTH, GRID_HEIGHT, 0, gl.RGBA, gl.UNSIGNED_BYTE, fieldPixels);

  const sceneTexture = createTexture(gl, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, ART_WIDTH, ART_HEIGHT, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  const sceneFramebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, sceneFramebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, sceneTexture, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  const emptyVao = gl.createVertexArray();
  const spriteVao = gl.createVertexArray();
  gl.bindVertexArray(spriteVao);
  const cornerBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cornerBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const instances = new Float32Array(MAX_INSTANCES * FLOATS_PER_INSTANCE);
  const instanceBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, instances.byteLength, gl.DYNAMIC_DRAW);
  const stride = FLOATS_PER_INSTANCE * 4;
  for (const [location, size, offset] of [
    [1, 4, 0],
    [2, 3, 4],
    [3, 4, 7],
    [4, 1, 11],
  ]) {
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, size, gl.FLOAT, false, stride, offset * 4);
    gl.vertexAttribDivisor(location, 1);
  }
  gl.bindVertexArray(null);

  const uniforms = (program: WebGLProgram, names: string[]) =>
    Object.fromEntries(names.map((name) => [name, gl.getUniformLocation(program, name)]));
  const groundUniforms = uniforms(groundProgram, ["uField", "uArtSize", "uTime"]);
  const spriteUniforms = uniforms(spriteProgram, ["uAtlas", "uArtSize", "uAtlasSize"]);
  const blitUniforms = uniforms(blitProgram, ["uScene", "uSrcSize", "uOutSize"]);

  let count = 0;
  const push = (x: number, y: number, w: number, h: number, u: number, v: number, rotation: number, color: Rgba, mix: number) => {
    if (count >= MAX_INSTANCES) return;
    const o = count * FLOATS_PER_INSTANCE;
    instances[o] = Math.round(x);
    instances[o + 1] = Math.round(y);
    instances[o + 2] = w;
    instances[o + 3] = h;
    instances[o + 4] = u;
    instances[o + 5] = v;
    instances[o + 6] = rotation;
    instances[o + 7] = color[0];
    instances[o + 8] = color[1];
    instances[o + 9] = color[2];
    instances[o + 10] = color[3];
    instances[o + 11] = mix;
    count += 1;
  };

  const solid = atlas.frames.solid;
  const batch: SpriteBatch = {
    sprite: (name, x, y, rotation = 0, color = WHITE, mix = 0) => {
      const f = atlas.frames[name];
      const odd = rotation % 2 === 1;
      push(x, y, odd ? f.h : f.w, odd ? f.w : f.h, f.u, f.v, rotation, color, mix);
    },
    rect: (x, y, w, h, color) => push(x, y, w, h, solid.u, solid.v, SOLID_RECT, color, 1),
    frame: (name) => atlas.frames[name],
  };

  return {
    resize(width: number, height: number) {
      canvas.width = Math.max(1, Math.round(width));
      canvas.height = Math.max(1, Math.round(height));
    },

    /**
     * fire/acid/scorch are the 0-255 simulation fields; drawSprites queues every sprite for this frame.
     */
    render(fire: Uint8Array, acid: Uint8Array, scorch: Uint8Array, timeSeconds: number, drawSprites: (batch: SpriteBatch) => void) {
      for (let i = 0, o = 0; i < fire.length; i += 1, o += 4) {
        fieldPixels[o] = fire[i];
        fieldPixels[o + 1] = acid[i];
        fieldPixels[o + 2] = scorch[i];
      }
      gl.bindTexture(gl.TEXTURE_2D, fieldTexture);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, GRID_WIDTH, GRID_HEIGHT, gl.RGBA, gl.UNSIGNED_BYTE, fieldPixels);

      gl.bindFramebuffer(gl.FRAMEBUFFER, sceneFramebuffer);
      gl.viewport(0, 0, ART_WIDTH, ART_HEIGHT);
      gl.disable(gl.BLEND);
      gl.useProgram(groundProgram);
      gl.bindVertexArray(emptyVao);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, fieldTexture);
      gl.uniform1i(groundUniforms.uField, 0);
      gl.uniform2f(groundUniforms.uArtSize, ART_WIDTH, ART_HEIGHT);
      gl.uniform1f(groundUniforms.uTime, timeSeconds);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      count = 0;
      drawSprites(batch);
      if (count > 0) {
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.useProgram(spriteProgram);
        gl.bindVertexArray(spriteVao);
        gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, instances, 0, count * FLOATS_PER_INSTANCE);
        gl.bindTexture(gl.TEXTURE_2D, atlasTexture);
        gl.uniform1i(spriteUniforms.uAtlas, 0);
        gl.uniform2f(spriteUniforms.uArtSize, ART_WIDTH, ART_HEIGHT);
        gl.uniform2f(spriteUniforms.uAtlasSize, atlas.width, atlas.height);
        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count);
      }

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.disable(gl.BLEND);
      gl.useProgram(blitProgram);
      gl.bindVertexArray(emptyVao);
      gl.bindTexture(gl.TEXTURE_2D, sceneTexture);
      gl.uniform1i(blitUniforms.uScene, 0);
      gl.uniform2f(blitUniforms.uSrcSize, ART_WIDTH, ART_HEIGHT);
      gl.uniform2f(blitUniforms.uOutSize, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },

    // the context itself stays alive: React may mount this component again on the same canvas
    dispose() {
      for (const program of [groundProgram, spriteProgram, blitProgram]) gl.deleteProgram(program);
      for (const texture of [atlasTexture, fieldTexture, sceneTexture]) gl.deleteTexture(texture);
      for (const buffer of [cornerBuffer, instanceBuffer]) gl.deleteBuffer(buffer);
      for (const vao of [emptyVao, spriteVao]) gl.deleteVertexArray(vao);
      gl.deleteFramebuffer(sceneFramebuffer);
    },
  };
}

export type AntGameRenderer = NonNullable<ReturnType<typeof createAntGameRenderer>>;
