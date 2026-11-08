import React, { useRef, useState, useEffect } from 'react';
import { CornerPoint } from '../../types';

interface CourtCanvasProps {
  imageUrl: string;
  corners: CornerPoint[]; // [TL, TR, BR, BL] in normalized 0.0 to 1.0 coordinates
  onChange: (corners: CornerPoint[]) => void;
  courtType?: 'SINGLES' | 'DOUBLES';
}

export const CourtCanvas: React.FC<CourtCanvasProps> = ({
  imageUrl,
  corners,
  onChange,
  courtType = 'SINGLES'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeCornerIdx, setActiveCornerIdx] = useState<number | null>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 800, height: 450 });

  const cornerLabels = ['Top Left (Far Left)', 'Top Right (Far Right)', 'Bottom Right (Near Right)', 'Bottom Left (Near Left)'];

  // Handle window resizing to keep canvas responsive
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handlePointerDown = (idx: number, e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setActiveCornerIdx(idx);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (activeCornerIdx === null || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    // Calculate normalized coordinates clamped between 0 and 1
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    const updated = [...corners];
    updated[activeCornerIdx] = { x: Number(x.toFixed(4)), y: Number(y.toFixed(4)) };
    onChange(updated);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (activeCornerIdx !== null) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      setActiveCornerIdx(null);
    }
  };

  // Convert normalized corners to pixel coordinates for SVG path
  const pts = corners.map(c => ({
    x: c.x * containerSize.width,
    y: c.y * containerSize.height
  }));

  // Net midpoint lines (midpoint between TL & BL, and TR & BR)
  const netLeft = {
    x: (pts[0].x + pts[3].x) / 2,
    y: (pts[0].y + pts[3].y) / 2
  };
  const netRight = {
    x: (pts[1].x + pts[2].x) / 2,
    y: (pts[1].y + pts[2].y) / 2
  };

  return (
    <div className="flex flex-col gap-3 select-none">
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="relative w-full aspect-video bg-black/60 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl cursor-crosshair touch-none"
      >
        {/* Background Video Keyframe */}
        <img
          src={imageUrl}
          alt="Court Calibration Keyframe"
          className="w-full h-full object-contain pointer-events-none"
          draggable={false}
        />

        {/* SVG Perspective Court Overlay */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {/* Main Court Perimeter Polygon */}
          <polygon
            points={`${pts[0].x},${pts[0].y} ${pts[1].x},${pts[1].y} ${pts[2].x},${pts[2].y} ${pts[3].x},${pts[3].y}`}
            fill="rgba(16, 185, 129, 0.12)"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeDasharray="none"
          />

          {/* Perspective Net Line */}
          <line
            x1={netLeft.x}
            y1={netLeft.y}
            x2={netRight.x}
            y2={netRight.y}
            stroke="#06b6d4"
            strokeWidth="2"
            strokeDasharray="4 4"
          />

          {/* Center Longitudinal Line */}
          <line
            x1={(pts[0].x + pts[1].x) / 2}
            y1={(pts[0].y + pts[1].y) / 2}
            x2={(pts[3].x + pts[2].x) / 2}
            y2={(pts[3].y + pts[2].y) / 2}
            stroke="rgba(255, 255, 255, 0.4)"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
        </svg>

        {/* 4 Interactive Draggable Corner Anchors */}
        {pts.map((pt, idx) => (
          <div
            key={idx}
            onPointerDown={(e) => handlePointerDown(idx, e)}
            style={{
              left: `${pt.x}px`,
              top: `${pt.y}px`,
              transform: 'translate(-50%, -50%)'
            }}
            className={`absolute z-20 w-8 h-8 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing transition-transform touch-none ${
              activeCornerIdx === idx
                ? 'scale-125 bg-emerald-400 ring-4 ring-emerald-400/40 shadow-lg'
                : 'bg-emerald-500 hover:scale-110 shadow-md ring-2 ring-white/80'
            }`}
          >
            <span className="text-[11px] font-bold text-slate-950 pointer-events-none">
              {idx + 1}
            </span>
          </div>
        ))}

        {/* Instruction pill at bottom */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-900/85 backdrop-blur-md px-4 py-1.5 rounded-full border border-slate-700/80 text-xs text-slate-300 pointer-events-none flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Drag the 4 corner pins to align with the outer boundary lines
        </div>
      </div>

      {/* Coordinate Readouts & Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {corners.map((c, i) => (
          <div
            key={i}
            className={`p-2.5 rounded-xl border text-xs transition-colors ${
              activeCornerIdx === i
                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                : 'bg-[#0f172a] border-[#1e293b] text-slate-400'
            }`}
          >
            <div className="flex items-center gap-1.5 font-semibold text-white mb-1">
              <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-[10px]">
                {i + 1}
              </span>
              <span>Corner {i + 1}</span>
            </div>
            <div className="text-[11px] text-slate-400">{cornerLabels[i]}</div>
            <div className="font-mono text-[10px] text-slate-400 mt-1">
              X: {(c.x * 100).toFixed(1)}% | Y: {(c.y * 100).toFixed(1)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

