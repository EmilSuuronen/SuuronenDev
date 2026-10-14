import { Maximize2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type WheelEvent } from "react";

import { useLocale } from "../../i18n/locale";
import { buildImportGraph, createLayout } from "./importGraph";
import { sourceFiles } from "./sourceFiles";

type ArchitectureMapProps = {
  activePath: string | null;
  onOpen: (path: string) => void;
};

const GROUP_COLORS: Record<string, string> = {
  antgame: "var(--candy-red)",
  apps: "var(--candy-blue)",
  browser: "#9ad4ff",
  code: "#f4a3ff",
  core: "var(--accent)",
  data: "var(--candy-yellow)",
  desktop: "var(--candy-pink)",
  hooks: "var(--candy-green)",
  i18n: "var(--candy-peach)",
  terminal: "#b5e86b",
  types: "var(--candy-lilac)",
  utils: "#5ed6d0",
};
const FALLBACK_COLORS = ["#ffffff", "#c9c2b8", "#ffd8a8"];
const MAX_STEPS = 320;

const nodes = buildImportGraph(sourceFiles);
const nodeById = new Map(nodes.map((node) => [node.id, node]));
const edgeCount = nodes.reduce((total, node) => total + node.imports.length, 0);
// Module-level so reopening the map shows the settled layout instead of replaying the animation.
const layout = createLayout(nodes);
let stepsTaken = 0;

const groupColor = (group: string) =>
  GROUP_COLORS[group] ?? FALLBACK_COLORS[layout.groups.indexOf(group) % FALLBACK_COLORS.length];
const degree = (id: string) => nodeById.get(id)!.imports.length + nodeById.get(id)!.importedBy.length;
// Sized by total connections so hubs like App.tsx stand out, not only widely imported leaves.
const nodeRadius = (id: string) => 4 + Math.sqrt(degree(id)) * 1.9;
const baseName = (path: string) => path.slice(path.lastIndexOf("/") + 1).replace(/\.(tsx?|css)$/, "");

function ArchitectureMap({ activePath, onOpen }: ArchitectureMapProps) {
  const { t } = useLocale();
  const [, setFrame] = useState(0);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{ moved: boolean; x: number; y: number } | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      while (stepsTaken < MAX_STEPS) {
        layout.step();
        stepsTaken += 1;
      }
      setFrame((frame) => frame + 1);
      return undefined;
    }

    let animationFrame = 0;
    const tick = () => {
      // A few steps per frame so the graph blooms open in about a second.
      for (let index = 0; index < 4 && stepsTaken < MAX_STEPS; index += 1) {
        layout.step();
        stepsTaken += 1;
      }

      setFrame((frame) => frame + 1);

      if (stepsTaken < MAX_STEPS) {
        animationFrame = requestAnimationFrame(tick);
      }
    };

    animationFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  const bounds = (() => {
    const points = [...layout.positions.values()];
    const padding = 60;
    const minX = Math.min(...points.map((point) => point.x)) - padding;
    const minY = Math.min(...points.map((point) => point.y)) - padding;
    return {
      height: Math.max(...points.map((point) => point.y)) + padding - minY,
      minX,
      minY,
      width: Math.max(...points.map((point) => point.x)) + padding - minX,
    };
  })();

  const focusId = hoveredId;
  const neighbourhood = useMemo(() => {
    if (focusId) {
      const node = nodeById.get(focusId)!;
      return new Set([focusId, ...node.imports, ...node.importedBy]);
    }

    if (hoveredGroup) {
      return new Set(nodes.filter((node) => node.group === hoveredGroup).map((node) => node.id));
    }

    return null;
  }, [focusId, hoveredGroup]);

  // The viewBox scales the drawing, so screen pixels have to be converted to graph units.
  const getUnitsPerPixel = () => {
    const rect = svgRef.current?.getBoundingClientRect();
    return rect && rect.width > 0 ? Math.max(bounds.width / rect.width, bounds.height / rect.height) : 1;
  };

  const handleWheel = (event: WheelEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const unitsPerPixel = getUnitsPerPixel();
    const pointerX = (event.clientX - rect.left - rect.width / 2) * unitsPerPixel;
    const pointerY = (event.clientY - rect.top - rect.height / 2) * unitsPerPixel;
    const nextScale = Math.min(4, Math.max(0.5, view.scale * (event.deltaY < 0 ? 1.15 : 1 / 1.15)));
    const ratio = nextScale / view.scale;

    // Zoom around the cursor: keep the point under it fixed.
    setView({
      scale: nextScale,
      x: view.x * ratio + pointerX * (1 - ratio),
      y: view.y * ratio + pointerY * (1 - ratio),
    });
  };

  const handlePointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    dragRef.current = { moved: false, x: event.clientX, y: event.clientY };
  };

  const handlePointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;

    if (!drag || event.buttons === 0) {
      dragRef.current = null;
      return;
    }

    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;

    if (!drag.moved && Math.hypot(dx, dy) < 4) {
      return;
    }

    if (!drag.moved) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    dragRef.current = { moved: true, x: event.clientX, y: event.clientY };
    const unitsPerPixel = getUnitsPerPixel();
    setView((current) => ({ ...current, x: current.x + dx * unitsPerPixel, y: current.y + dy * unitsPerPixel }));
  };

  const hoveredNode = hoveredId ? nodeById.get(hoveredId) : null;

  return (
    <div className="code-map">
      <svg
        ref={svgRef}
        aria-label={t("Architecture map")}
        className="code-map-canvas"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onWheel={handleWheel}
        preserveAspectRatio="xMidYMid meet"
        role="group"
        viewBox={`${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`}
      >
        <g
          style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`, transformBox: "view-box", transformOrigin: "center" }}
        >
          {nodes.flatMap((node) =>
            node.imports.map((target) => {
              const from = layout.positions.get(node.id)!;
              const to = layout.positions.get(target)!;
              const isOutgoing = focusId === node.id;
              const isIncoming = focusId === target;
              const isDimmed = focusId
                ? !isOutgoing && !isIncoming
                : neighbourhood !== null && !(neighbourhood.has(node.id) && neighbourhood.has(target));

              return (
                <line
                  key={`${node.id}->${target}`}
                  className={`code-map-edge ${isOutgoing ? "is-outgoing" : ""} ${isIncoming ? "is-incoming" : ""} ${isDimmed ? "is-dimmed" : ""}`}
                  x1={from.x}
                  x2={to.x}
                  y1={from.y}
                  y2={to.y}
                />
              );
            }),
          )}

          {nodes.map((node) => {
            const position = layout.positions.get(node.id)!;
            const radius = nodeRadius(node.id);
            const isDimmed = neighbourhood !== null && !neighbourhood.has(node.id);
            const showLabel = !isDimmed && (neighbourhood !== null || degree(node.id) >= 8 || node.id === activePath);

            return (
              <g
                key={node.id}
                aria-label={`${node.id}: ${t("imports")} ${node.imports.length}, ${t("imported by")} ${node.importedBy.length}`}
                className={`code-map-node ${isDimmed ? "is-dimmed" : ""} ${node.id === activePath ? "is-active" : ""}`}
                onBlur={() => setHoveredId(null)}
                onClick={() => {
                  if (!dragRef.current?.moved) {
                    onOpen(node.id);
                  }
                }}
                onFocus={() => setHoveredId(node.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onOpen(node.id);
                  }
                }}
                onPointerEnter={() => setHoveredId(node.id)}
                onPointerLeave={() => setHoveredId(null)}
                role="button"
                tabIndex={0}
                transform={`translate(${position.x} ${position.y})`}
              >
                <circle fill={groupColor(node.group)} r={radius} />
                {showLabel ? (
                  <text className="code-map-label" y={-radius - 5}>
                    {baseName(node.id)}
                  </text>
                ) : null}
              </g>
            );
          })}
        </g>
      </svg>

      <div className="code-map-legend">
        {layout.groups.map((group) => (
          <button
            key={group}
            className={`code-map-chip ${hoveredGroup === group ? "is-active" : ""}`}
            onBlur={() => setHoveredGroup(null)}
            onFocus={() => setHoveredGroup(group)}
            onPointerEnter={() => setHoveredGroup(group)}
            onPointerLeave={() => setHoveredGroup(null)}
            type="button"
          >
            <span className="code-map-swatch" style={{ background: groupColor(group) }} />
            {group}
          </button>
        ))}
      </div>

      <div className="code-map-info">
        {hoveredNode ? (
          <>
            <strong>{hoveredNode.id}</strong>
            <span>
              <i className="code-map-key is-outgoing" /> {t("imports")} {hoveredNode.imports.length} ·{" "}
              <i className="code-map-key is-incoming" /> {t("imported by")} {hoveredNode.importedBy.length}
            </span>
          </>
        ) : (
          <span>
            {nodes.length} {t("files")} · {edgeCount} {t("imports")} · {t("scroll to zoom, drag to pan, click a file to open it")}
          </span>
        )}
      </div>

      <button
        aria-label={t("Fit to view")}
        className="code-map-fit"
        onClick={() => setView({ scale: 1, x: 0, y: 0 })}
        title={t("Fit to view")}
        type="button"
      >
        <Maximize2 className="code-toolbar-icon" />
      </button>
    </div>
  );
}

export default ArchitectureMap;
