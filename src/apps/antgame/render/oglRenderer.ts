import { Camera, Renderer, Transform } from "ogl";
import { GRID_HEIGHT, GRID_WIDTH } from "../engine/constants";
import { createBackgroundPass } from "./passes/backgroundPass";
import { createEntityPass } from "./passes/entityPass";

import type { GameRenderSnapshot } from "../types";

type OglRendererOptions = {
  canvas: HTMLCanvasElement;
};

export type AntGameOglRenderer = {
  dispose: () => void;
  render: (snapshot: GameRenderSnapshot) => void;
  resize: (width: number, height: number, dpr: number) => void;
};

export function createAntGameOglRenderer({ canvas }: OglRendererOptions): AntGameOglRenderer {
  const renderer = new Renderer({
    alpha: false,
    antialias: false,
    canvas,
    depth: false,
    dpr: 1,
    height: GRID_HEIGHT,
    width: GRID_WIDTH,
  });
  const { gl } = renderer;
  const scene = new Transform();
  const camera = new Camera(gl, {
    near: -10,
    far: 10,
  });
  const backgroundPass = createBackgroundPass(gl, scene);
  const entityPass = createEntityPass(gl, scene);

  gl.clearColor(0.43, 0.64, 0.29, 1);
  camera.position.set(0, 0, 1);
  camera.orthographic({
    left: 0,
    right: GRID_WIDTH,
    bottom: GRID_HEIGHT,
    top: 0,
    near: -10,
    far: 10,
  });

  return {
    dispose() {
      entityPass.dispose();
      backgroundPass.dispose();
    },
    render(snapshot) {
      entityPass.render(snapshot);
      renderer.render({
        scene,
        camera,
        clear: true,
        frustumCull: false,
      });
    },
    resize(width, height, dpr) {
      renderer.dpr = Math.max(1, Math.min(2, dpr));
      renderer.setSize(width, height);
      camera.orthographic({
        left: 0,
        right: GRID_WIDTH,
        bottom: GRID_HEIGHT,
        top: 0,
        near: -10,
        far: 10,
      });
    },
  };
}
