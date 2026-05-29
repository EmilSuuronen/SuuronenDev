import { Geometry, Mesh, Program } from "ogl";
import { clamp } from "../../engine/world";

import type { GameRenderSnapshot } from "../../types";
import type { OGLRenderingContext, Transform } from "ogl";

const MAX_RECTS = 3200;
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

type Rgba = [number, number, number, number];

const colors = {
  ant: [0.1, 0.1, 0.1, 1] as Rgba,
  antAcid: [0.19, 0.34, 0.13, 1] as Rgba,
  antBurn: [0.44, 0.09, 0, 1] as Rgba,
  black: [0, 0, 0, 1] as Rgba,
  barBack: [0.18, 0.18, 0.18, 1] as Rgba,
  barBorder: [0.12, 0.12, 0.12, 1] as Rgba,
  barGreen: [0.31, 0.75, 0.34, 1] as Rgba,
  barRed: [0.82, 0.38, 0.25, 1] as Rgba,
  barYellow: [0.84, 0.72, 0.29, 1] as Rgba,
  lettuce: [0.42, 0.69, 0.35, 1] as Rgba,
  nestDark: [0.37, 0.23, 0.12, 1] as Rgba,
  nestDeadA: [0.31, 0.31, 0.31, 1] as Rgba,
  nestDeadB: [0.18, 0.18, 0.18, 1] as Rgba,
  nestHole: [0.16, 0.1, 0.05, 1] as Rgba,
  nestLight: [0.64, 0.43, 0.25, 1] as Rgba,
  nestMid: [0.55, 0.36, 0.21, 1] as Rgba,
  sandwichBread: [0.96, 0.81, 0.48, 1] as Rgba,
  sandwichCrust: [0.62, 0.37, 0.19, 1] as Rgba,
  sandwichDeadA: [0.46, 0.44, 0.39, 1] as Rgba,
  sandwichDeadB: [0.36, 0.35, 0.31, 1] as Rgba,
  sandwichFilling: [0.85, 0.67, 0.32, 1] as Rgba,
  tomato: [0.75, 0.25, 0.2, 1] as Rgba,
};

function getHpColor(ratio: number): Rgba {
  if (ratio > 0.45) return colors.barGreen;
  if (ratio > 0.2) return colors.barYellow;
  return colors.barRed;
}

export function createEntityPass(gl: OGLRenderingContext, scene: Transform) {
  const positions = new Float32Array(MAX_RECTS * VERTICES_PER_RECT * POSITION_COMPONENTS);
  const colorData = new Float32Array(MAX_RECTS * VERTICES_PER_RECT * COLOR_COMPONENTS);
  const geometry = new Geometry(gl, {
    position: { size: POSITION_COMPONENTS, data: positions },
    color: { size: COLOR_COMPONENTS, data: colorData },
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
    frustumCulled: false,
  });
  let rectCount = 0;

  mesh.setParent(scene);

  const pushRect = (x: number, y: number, width: number, height: number, color: Rgba) => {
    if (rectCount >= MAX_RECTS || width <= 0 || height <= 0) return;

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
  };

  const drawSandwich = (snapshot: GameRenderSnapshot) => {
    const sandwich = snapshot.sandwich;
    const x = Math.round(sandwich.x);
    const y = Math.round(sandwich.y);
    const alive = sandwich.hp > 0;

    pushRect(x - 5, y - 2, 11, 5, alive ? colors.sandwichBread : colors.sandwichDeadA);
    pushRect(x - 4, y - 1, 9, 3, alive ? colors.sandwichFilling : colors.sandwichDeadB);
    pushRect(x - 3, y, 7, 1, alive ? colors.sandwichCrust : colors.nestDeadB);
    pushRect(x - 2, y - 1, 5, 1, alive ? colors.lettuce : colors.sandwichDeadB);
    pushRect(x - 1, y, 3, 1, alive ? colors.tomato : colors.sandwichDeadB);

    const ratio = clamp(sandwich.hp / sandwich.maxHp, 0, 1);
    const barWidth = 18;
    const barX = x - Math.floor(barWidth / 2);
    const barY = y - 6;
    pushRect(barX - 1, barY - 1, barWidth + 2, 4, colors.barBorder);
    pushRect(barX, barY, barWidth, 2, colors.barBack);
    pushRect(barX, barY, Math.max(0, Math.round(barWidth * ratio)), 2, alive ? colors.barGreen : colors.barRed);
  };

  const drawNests = (snapshot: GameRenderSnapshot) => {
    snapshot.nests.forEach((nest) => {
      const x = Math.round(nest.x);
      const y = Math.round(nest.y);

      if (!nest.isAlive) {
        pushRect(x - 2, y - 1, 6, 4, colors.nestDeadA);
        pushRect(x - 1, y, 4, 2, colors.nestDeadB);
        pushRect(x + 1, y + 1, 1, 1, colors.black);
        return;
      }

      pushRect(x - 3, y - 2, 8, 6, colors.nestMid);
      pushRect(x - 2, y - 3, 6, 2, colors.nestLight);
      pushRect(x - 1, y, 4, 3, colors.nestDark);
      pushRect(x, y + 1, 2, 2, colors.nestHole);

      const ratio = clamp(nest.hp / nest.maxHp, 0, 1);
      const barWidth = 12;
      const barX = x - Math.floor(barWidth / 2);
      const barY = y - 6;
      pushRect(barX - 1, barY - 1, barWidth + 2, 4, colors.barBorder);
      pushRect(barX, barY, barWidth, 2, colors.barBack);
      pushRect(barX, barY, Math.max(0, Math.round(barWidth * ratio)), 2, getHpColor(ratio));
    });
  };

  const drawAnts = (snapshot: GameRenderSnapshot) => {
    const blink = Math.floor(snapshot.timeMs / 80) % 2 === 0;

    snapshot.ants.forEach((ant) => {
      const x = Math.round(ant.x);
      const y = Math.round(ant.y);
      const bodyColor = ant.burn > ant.acid ? colors.antBurn : ant.acid > 40 ? colors.antAcid : colors.ant;

      pushRect(x, y, 2, 1, bodyColor);
      pushRect(x + 1, y + 1, 1, 1, bodyColor);
      pushRect(x - 1, y, 1, 1, colors.black);
      pushRect(x + 2, y, 1, 1, colors.black);
      if (blink) pushRect(x, y + 1, 1, 1, colors.black);

      if (ant.hp < 110) {
        const ratio = clamp(ant.hp / 110, 0, 1);
        const barWidth = 3;
        const barY = y - 3;
        pushRect(x - 1, barY - 1, barWidth + 2, 3, colors.barBorder);
        pushRect(x, barY, barWidth, 1, colors.barBack);
        pushRect(x, barY, Math.max(0, Math.round(barWidth * ratio)), 1, getHpColor(ratio));
      }
    });
  };

  return {
    dispose() {
      geometry.remove();
      program.remove();
    },
    render(snapshot: GameRenderSnapshot) {
      rectCount = 0;
      drawSandwich(snapshot);
      drawNests(snapshot);
      drawAnts(snapshot);
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.color.needsUpdate = true;
      geometry.setDrawRange(0, rectCount * VERTICES_PER_RECT);
    },
  };
}
