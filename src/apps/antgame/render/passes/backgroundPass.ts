import { Mesh, Plane, Program } from "ogl";
import { GRID_HEIGHT, GRID_WIDTH } from "../../engine/constants";

import type { OGLRenderingContext, Transform } from "ogl";

const vertex = /* glsl */ `
  attribute vec3 position;
  attribute vec2 uv;

  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;

  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragment = /* glsl */ `
  precision highp float;

  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  void main() {
    vec2 grid = floor(vUv * vec2(176.0, 108.0));
    float checker = mod(grid.x + grid.y, 2.0);
    float speckle = step(0.84, hash(grid));
    vec3 base = vec3(0.43, 0.64, 0.29);
    vec3 light = vec3(0.49, 0.72, 0.34);
    vec3 dark = vec3(0.37, 0.59, 0.25);
    vec3 color = mix(base, light, checker * 0.34);
    color = mix(color, dark, speckle * 0.32);
    gl_FragColor = vec4(color, 1.0);
  }
`;

export function createBackgroundPass(gl: OGLRenderingContext, scene: Transform) {
  const geometry = new Plane(gl, {
    width: GRID_WIDTH,
    height: GRID_HEIGHT,
  });
  const program = new Program(gl, {
    vertex,
    fragment,
    depthTest: false,
    depthWrite: false,
  });
  const mesh = new Mesh(gl, {
    geometry,
    program,
  });

  mesh.position.set(GRID_WIDTH / 2, GRID_HEIGHT / 2, 0);
  mesh.setParent(scene);

  return {
    dispose() {
      geometry.remove();
      program.remove();
    },
  };
}
