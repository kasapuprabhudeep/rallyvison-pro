import React from 'react';

interface CourtHeatmapProps {
  zoneOccupancy: Record<string, number>; // e.g. {"FRONT_LEFT": 15.2, ...}
  courtType?: 'SINGLES' | 'DOUBLES';
}

export const CourtHeatmap: React.FC<CourtHeatmapProps> = ({
  zoneOccupancy = {},
  courtType = 'SINGLES'
}) => {
  // Compute max for normalization
  const values = Object.values(zoneOccupancy);
  const maxVal = Math.max(1, ...values);

  const getHeatColor = (pct: number) => {
    const intensity = Math.min(1, pct / Math.max(25, maxVal));
    if (intensity < 0.2) return 'rgba(30, 41, 59, 0.6)';
    if (intensity < 0.4) return 'rgba(6, 182, 212, 0.45)'; // Cyan
    if (intensity < 0.65) return 'rgba(16, 185, 129, 0.55)'; // Emerald
    if (intensity < 0.85) return 'rgba(245, 158, 11, 0.65)'; // Amber
    return 'rgba(239, 68, 68, 0.75)'; // Hot Coral
  };

  const zones = [
    { id: 'FRONT_LEFT', label: 'Front Left (Net)', pct: zoneOccupancy['FRONT_LEFT'] || 0 },
    { id: 'FRONT_RIGHT', label: 'Front Right (Net)', pct: zoneOccupancy['FRONT_RIGHT'] || 0 },
    { id: 'MID_LEFT', label: 'Mid Left', pct: zoneOccupancy['MID_LEFT'] || 0 },
    { id: 'MID_RIGHT', label: 'Mid Right', pct: zoneOccupancy['MID_RIGHT'] || 0 },
    { id: 'REAR_LEFT', label: 'Rear Left (Base)', pct: zoneOccupancy['REAR_LEFT'] || 0 },
    { id: 'REAR_RIGHT', label: 'Rear Right (Base)', pct: zoneOccupancy['REAR_RIGHT'] || 0 },
  ];

  return (
    <div className="flex flex-col items-center glass-panel bg-[#091129]/80 rounded-3xl border border-cyan-500/25 p-5 sm:p-6 shadow-xl">
      <div className="flex items-center justify-between w-full mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
          6-Zone Court Coverage Heatmap
        </span>
        <span className="text-xs text-slate-400 font-mono">
          Top: Net area | Bottom: Baseline
        </span>
      </div>

      {/* 2 columns (Left/Right) x 3 rows (Front, Mid, Rear) */}
      <div className="w-full max-w-[320px] aspect-[1/1.8] border-2 border-cyan-500/40 rounded-xl overflow-hidden bg-[#05091a] p-1.5 grid grid-cols-2 grid-rows-3 gap-1.5">
        {zones.map((z) => (
          <div
            key={z.id}
            style={{ backgroundColor: getHeatColor(z.pct) }}
            className="rounded-lg p-2 flex flex-col items-center justify-center text-center transition-all duration-300 border border-white/10 hover:border-white/30"
          >
            <span className="text-[10px] font-semibold text-slate-300 tracking-tight">{z.label}</span>
            <span className="text-lg font-bold text-white mt-0.5">{z.pct.toFixed(1)}%</span>
            <div className="w-12 h-1 bg-black/30 rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-cyan-400 rounded-full"
                style={{ width: `${Math.min(100, (z.pct / maxVal) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Heat gradient legend */}
      <div className="flex items-center gap-2 mt-4 text-[10px] text-slate-400">
        <span>Low Heat (0%)</span>
        <div className="w-24 h-2 rounded-full bg-gradient-to-r from-slate-700 via-cyan-500 via-amber-400 to-rose-500" />
        <span>High Heat ({maxVal.toFixed(0)}%+)</span>
      </div>
    </div>
  );
};

