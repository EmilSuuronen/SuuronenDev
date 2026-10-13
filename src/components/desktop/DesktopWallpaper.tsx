import { useEffect, useRef } from "react";
import { Mesh, Program, Renderer, Triangle } from "ogl";

import type { DesktopTheme } from "../../data/themes";

type DesktopWallpaperProps = {
  theme: DesktopTheme;
};

const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

  if (!result) {
    return [1, 1, 1];
  }

  return [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255];
};

const vertex = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

// Slowly drifting noise field, cut into flat color bands with ink outlines.
// Each band casts a hard offset shadow onto the band below, like the windows' sticker shadows.
const fragment = `#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform float uDpr;
uniform vec3 uColor0;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform vec3 uInk;
out vec4 fragColor;

vec2 hash(vec2 p){p=vec2(dot(p,vec2(2127.1,81.17)),dot(p,vec2(1269.5,283.37)));return fract(sin(p)*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.0-2.0*f);float n=mix(mix(dot(-1.0+2.0*hash(i),f),dot(-1.0+2.0*hash(i+vec2(1.0,0.0)),f-vec2(1.0,0.0)),u.x),mix(dot(-1.0+2.0*hash(i+vec2(0.0,1.0)),f-vec2(0.0,1.0)),dot(-1.0+2.0*hash(i+vec2(1.0,1.0)),f-vec2(1.0,1.0)),u.x),u.y);return 0.5+0.5*n;}

const float BANDS = 4.0;

// Band coordinate: 0..BANDS, integer crossings are the blob edges.
float field(vec2 px){
  vec2 p = px / iResolution.y;
  float t = iTime * 0.006;
  p += 0.14 * vec2(sin(p.y * 2.6 + t * 2.1), sin(p.x * 2.2 - t * 1.7));
  float f = noise(p * 1.25 + vec2(t, -t * 0.6)) * 0.7 + noise(p * 2.6 - vec2(t * 0.7, t * 0.3)) * 0.3;
  return clamp((f - 0.3) / 0.4, 0.0, 0.999) * BANDS;
}

vec3 bandColor(float level){
  if (level < 1.0) return uColor0;
  if (level < 2.0) return uColor1;
  if (level < 3.0) return uColor2;
  return uColor3;
}

void main(){
  vec2 px = gl_FragCoord.xy;
  float x = field(px);
  float level = floor(x);
  vec3 col = bandColor(level);

  // hard shadow: a higher band up-left of this pixel shades it
  vec2 shadowOffset = vec2(-7.0, 7.0) * uDpr;
  if (floor(field(px + shadowOffset)) > level) {
    col = mix(col, uInk, 0.82);
  }

  // anti-aliased ink outline on interior band edges
  float edge = abs(x - floor(x + 0.5));
  float w = fwidth(x);
  float halfLine = 1.4 * uDpr;
  float line = 1.0 - smoothstep(w * (halfLine - 0.5), w * (halfLine + 0.5), edge);
  float interior = step(0.5, x) * step(x, BANDS - 0.5);
  col = mix(col, uInk, line * interior);

  fragColor = vec4(col, 1.0);
}
`;

function DesktopWallpaper({ theme }: DesktopWallpaperProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const colors = [theme.wallpaperColor3, theme.wallpaperColor2, theme.wallpaperColor1, theme.panelStrong, theme.ink];

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const renderer = new Renderer({ webgl: 2, alpha: false, antialias: false, dpr });
    const { gl } = renderer;
    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    container.appendChild(canvas);

    const [color0, color1, color2, color3, ink] = colors.map((hex) => new Float32Array(hexToRgb(hex)));
    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new Float32Array([1, 1]) },
        uDpr: { value: dpr },
        uColor0: { value: color0 },
        uColor1: { value: color1 },
        uColor2: { value: color2 },
        uColor3: { value: color3 },
        uInk: { value: ink },
      },
    });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let animationFrame = 0;
    const startedAt = performance.now();

    const renderFrame = (time: number) => {
      program.uniforms.iTime.value = (time - startedAt) * 0.001;
      renderer.render({ scene: mesh });

      if (!reducedMotion) {
        animationFrame = requestAnimationFrame(renderFrame);
      }
    };

    const setSize = () => {
      const rect = container.getBoundingClientRect();
      renderer.setSize(Math.max(1, Math.floor(rect.width)), Math.max(1, Math.floor(rect.height)));
      const resolution = program.uniforms.iResolution.value as Float32Array;
      resolution[0] = gl.drawingBufferWidth;
      resolution[1] = gl.drawingBufferHeight;

      if (reducedMotion) {
        renderFrame(performance.now());
      }
    };

    const resizeObserver = new ResizeObserver(setSize);
    resizeObserver.observe(container);
    setSize();
    animationFrame = requestAnimationFrame(renderFrame);

    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      canvas.remove();
    };
    // colors is rebuilt every render; its joined value is the real dependency
  }, [colors.join()]);

  return (
    <div aria-hidden="true" className="desktop-background">
      <div ref={containerRef} className="desktop-wallpaper" />
    </div>
  );
}

export default DesktopWallpaper;
