import type { PointerEvent as ReactPointerEvent, RefObject } from "react";

type PointHandlerEvent = ReactPointerEvent<HTMLCanvasElement>;

type Props = {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  canvasRenderHeight: number;
  canvasRenderWidth: number;
  canvasShellRef: RefObject<HTMLDivElement | null>;
  onPointerDown: (event: PointHandlerEvent) => void;
  onPointerMove: (event: PointHandlerEvent) => void;
  onPointerUp: () => void;
};

function AntGameStage({
  canvasRef,
  canvasRenderHeight,
  canvasRenderWidth,
  canvasShellRef,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: Props) {
  return (
    <div ref={canvasShellRef} className="antgame-canvas-shell">
      <div className="antgame-stage" style={{ width: `${canvasRenderWidth}px`, height: `${canvasRenderHeight}px` }}>
        <canvas
          ref={canvasRef}
          className="antgame-canvas"
          style={{ width: `${canvasRenderWidth}px`, height: `${canvasRenderHeight}px` }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onPointerLeave={onPointerUp}
        />
      </div>
    </div>
  );
}

export default AntGameStage;
