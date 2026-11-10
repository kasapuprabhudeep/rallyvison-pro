import React, { useRef, useState, useEffect } from 'react';
import { CornerPoint } from '../../types';
import { Camera, Compass, RotateCcw, CheckCircle2 } from 'lucide-react';

interface CourtCanvasProps {
  imageUrl: string;
  corners: CornerPoint[]; // [TL, TR, BR, BL] in normalized 0.0 to 1.0 coordinates
  onChange: (corners: CornerPoint[]) => void;
  courtType?: 'SINGLES' | 'DOUBLES';
}

interface PerspectivePreset {
  id: string;
  label: string;
  sublabel: string;
  icon: string;
  corners: CornerPoint[];
  descriptions: string[];
}

const PERSPECTIVE_PRESETS: PerspectivePreset[] = [
  {
    id: 'BROADCAST',
    label: 'High Broadcast',
    sublabel: 'Elevated Rear Angle',
    icon: '🎥',
    corners: [
      { x: 0.28, y: 0.22 },
      { x: 0.72, y: 0.22 },
      { x: 0.90, y: 0.88 },
      { x: 0.10, y: 0.88 }
    ],
    descriptions: [
      '1. Far Baseline (Left)',
      '2. Far Baseline (Right)',
      '3. Near Baseline (Right)',
      '4. Near Baseline (Left)'
    ]
  },
  {
    id: 'SIDE_VIEW',
    label: 'Side View',
    sublabel: 'Sideline / Bench Camera',
    icon: '🏸',
    corners: [
      { x: 0.12, y: 0.40 },
      { x: 0.88, y: 0.40 },
      { x: 0.96, y: 0.82 },
      { x: 0.04, y: 0.82 }
    ],
    descriptions: [
      '1. Left Baseline (Far)',
      '2. Right Baseline (Far)',
      '3. Right Baseline (Near)',
      '4. Left Baseline (Near)'
    ]
  },
  {
    id: 'BASELINE_BEHIND',
    label: 'Back Baseline',
    sublabel: 'Behind Player Tripod',
    icon: '📐',
    corners: [
      { x: 0.34, y: 0.26 },
      { x: 0.66, y: 0.26 },
      { x: 0.95, y: 0.90 },
      { x: 0.05, y: 0.90 }
    ],
    descriptions: [
      '1. Opponent Baseline (L)',
      '2. Opponent Baseline (R)',
      '3. Near Baseline (R)',
      '4. Near Baseline (L)'
    ]
  },
  {
    id: 'CORNER_DIAGONAL',
    label: '45° Corner',
    sublabel: 'Bleacher Diagonal View',
    icon: '🏟️',
    corners: [
      { x: 0.30, y: 0.28 },
      { x: 0.82, y: 0.22 },
      { x: 0.90, y: 0.74 },
      { x: 0.12, y: 0.82 }
    ],
    descriptions: [
      '1. Far Corner (Left)',
      '2. Far Corner (Right)',
      '3. Near Corner (Right)',
      '4. Near Corner (Left)'
    ]
  }
];

export const CourtCanvas: React.FC<CourtCanvasProps> = ({
  imageUrl,
  corners,
  onChange,
  courtType = 'SINGLES'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeCornerIdx, setActiveCornerIdx] = useState<number | null>(null);
  const [selectedPerspective, setSelectedPerspective] = useState<string>('BROADCAST');
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 800, height: 450 });

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

  const applyPreset = (preset: PerspectivePreset) => {
    setSelectedPerspective(preset.id);
    onChange(preset.corners);
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

  const currentPreset = PERSPECTIVE_PRESETS.find(p => p.id === selectedPerspective) || PERSPECTIVE_PRESETS[0];

  return (
    <div className="flex flex-col gap-3 select-none">
      {/* Camera Angle & Perspective Toolbar */}
      <div className="flex flex-col gap-2 p-3 bg-[#081026] rounded-2xl border border-cyan-500/25">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-cyan-400" />
            Tournament Camera Perspective Presets
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            Select angle to auto-align 4-point homography
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PERSPECTIVE_PRESETS.map((preset) => {
            const isSelected = selectedPerspective === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset)}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400'
                    : 'bg-[#05091a] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-base">{preset.icon}</span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
                <div>
                  <div className="text-xs font-bold leading-tight text-white">{preset.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{preset.sublabel}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Calibration Video Frame Canvas */}
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
            fill="rgba(6, 182, 212, 0.15)"
            stroke="#00f0ff"
            strokeWidth="2.5"
            strokeDasharray="none"
          />

          {/* Perspective Net Line */}
          <line
            x1={netLeft.x}
            y1={netLeft.y}
            x2={netRight.x}
            y2={netRight.y}
            stroke="#facc15"
            strokeWidth="2.5"
            strokeDasharray="4 4"
          />

          {/* Center Longitudinal Line */}
          <line
            x1={(pts[0].x + pts[1].x) / 2}
            y1={(pts[0].y + pts[1].y) / 2}
            x2={(pts[3].x + pts[2].x) / 2}
            y2={(pts[3].y + pts[2].y) / 2}
            stroke="rgba(255, 255, 255, 0.5)"
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
                ? 'scale-125 bg-cyan-400 ring-4 ring-cyan-400/40 shadow-lg'
                : 'bg-cyan-500 hover:scale-110 shadow-md ring-2 ring-white/90'
            }`}
          >
            <span className="text-[11px] font-black text-slate-950 pointer-events-none">
              {idx + 1}
            </span>
          </div>
        ))}

        {/* Instruction pill at bottom */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md px-4 py-1.5 rounded-full border border-cyan-500/40 text-xs text-cyan-200 pointer-events-none flex items-center gap-2 shadow-xl">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          Drag the 4 corner pins to match the painted tournament court corners
        </div>
      </div>

      {/* Coordinate Readouts & Perspective Corner Guide */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {corners.map((c, i) => (
          <div
            key={i}
            className={`p-2.5 rounded-xl border text-xs transition-colors ${
              activeCornerIdx === i
                ? 'bg-cyan-500/10 border-cyan-400 text-cyan-300'
                : 'bg-[#0f172a] border-[#1e293b] text-slate-400'
            }`}
          >
            <div className="flex items-center gap-1.5 font-semibold text-white mb-1">
              <span className="w-4 h-4 rounded-full bg-cyan-400 text-slate-950 font-black flex items-center justify-center text-[10px]">
                {i + 1}
              </span>
              <span>{currentPreset.descriptions[i]}</span>
            </div>
            <div className="font-mono text-[10px] text-slate-400 mt-1">
              X: {(c.x * 100).toFixed(1)}% | Y: {(c.y * 100).toFixed(1)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
