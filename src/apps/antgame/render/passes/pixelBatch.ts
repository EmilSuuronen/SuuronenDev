import { Geometry, Mesh, Program } from "ogl";

import type { OGLRenderingContext, Transform } from "ogl";

export type Rgba = [number, number, number, number];

const VERTICES_PER_RECT = 6;
const POSITION_COMPONENTS = 2;
const COLOR_COMPONENTS = 4;

const vertex = /* glsl */ `
  attribute vec2 position;
  attribute vec4 color;

  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;

  varying vec4 vColor;

  void main() {
    vColor = color;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 0.0, 1.0);
  }
`;

const fragment = /* glsl */ `
  precision highp float;

  varying vec4 vColor;

  void main() {
    gl_FragColor = vColor;
  }
`;

export function createPixelBatch(gl: OGLRenderingContext, scene: Transform, maxRects: number) {
  const positions = new Float32Array(maxRects * VERTICES_PER_RECT * POSITION_COMPONENTS);
  const colorData = new Float32Array(maxRects * VERTICES_PER_RECT * COLOR_COMPONENTS);
  const geometry = new Geometry(gl, {
    position: { size: POSITION_COMPONENTS, data: positions },
    color: { size: COLOR_COMPONENTS, data: colorData },
  });
  const program = new Program(gl, {
    vertex,
    fragment,
    cullFace: false,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const mesh = new Mesh(gl, {
    geometry,
    program,
    frustumCulled: false,
  });
  let rectCount = 0;

  mesh.setParent(scene);

  return {
    clear() {
      rectCount = 0;
    },
    dispose() {
      geometry.remove();
      program.remove();
    },
    pushRect(x: number, y: number, width: number, height: number, color: Rgba) {
      if (rectCount >= maxRects || width <= 0 || height <= 0) return;

      const vertexOffset = rectCount * VERTICES_PER_RECT;
      const positionOffset = vertexOffset * POSITION_COMPONENTS;
      const colorOffset = vertexOffset * COLOR_COMPONENTS;
      const x2 = x + width;
      const y2 = y + height;
      positions.set([x, y, x2, y, x, y2, x, y2, x2, y, x2, y2], positionOffset);

      for (let i = 0; i < VERTICES_PER_RECT; i += 1) {
        colorData.set(color, colorOffset + i * COLOR_COMPONENTS);
      }

      rectCount += 1;
    },
    upload() {
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.color.needsUpdate = true;
      geometry.setDrawRange(0, rectCount * VERTICES_PER_RECT);
    },
  };
}
