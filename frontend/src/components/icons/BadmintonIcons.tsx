import React from 'react';

export const ShuttlecockIcon: React.FC<{ className?: string; size?: number }> = ({ className = "w-5 h-5", size }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    {/* Shuttlecock cork base */}
    <ellipse cx="12" cy="19.5" rx="3" ry="2.2" fill="currentColor" opacity="0.9" />
    <path d="M9 19.5 C9 21.5 15 21.5 15 19.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    
    {/* Feathers skirt */}
    <path
      d="M9.3 18.5 L5 6 C5 5 19 5 19 6 L14.7 18.5"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
      fill="currentColor"
      fillOpacity="0.15"
    />
    
    {/* Rib lines */}
    <line x1="7.2" y1="12" x2="16.8" y2="12" stroke="currentColor" strokeWidth="1" strokeOpacity="0.7" />
    <line x1="6.1" y1="8" x2="17.9" y2="8" stroke="currentColor" strokeWidth="1" strokeOpacity="0.7" />
    
    {/* Central feather shafts */}
    <line x1="12" y1="18.5" x2="12" y2="5" stroke="currentColor" strokeWidth="1.2" />
    <line x1="10.5" y1="18.5" x2="8.5" y2="5.5" stroke="currentColor" strokeWidth="1" strokeOpacity="0.7" />
    <line x1="13.5" y1="18.5" x2="15.5" y2="5.5" stroke="currentColor" strokeWidth="1" strokeOpacity="0.7" />
  </svg>
);

export const BadmintonRacketIcon: React.FC<{ className?: string; size?: number }> = ({ className = "w-5 h-5", size }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    {/* Racket Head (Oval) */}
    <ellipse cx="15.5" cy="8.5" rx="6" ry="7" transform="rotate(-30 15.5 8.5)" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.1" />
    
    {/* String Bed Grid */}
    <line x1="13.5" y1="3.5" x2="17.5" y2="13.5" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.5" />
    <line x1="11.5" y1="5.5" x2="15.5" y2="15.5" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.5" />
    <line x1="10.5" y1="9.5" x2="20.5" y2="7.5" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.5" />
    <line x1="11.5" y1="12" x2="19.5" y2="10" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.5" />
    
    {/* Throat & Shaft */}
    <path d="M12.5 13.5 L7.5 18.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    
    {/* Handle / Grip */}
    <path d="M7.5 18.5 L4 22" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <line x1="4.8" y1="19.5" x2="6.2" y2="20.8" stroke="#ffffff" strokeWidth="0.8" strokeOpacity="0.8" />
  </svg>
);

export const CrossedRacketsLogoIcon: React.FC<{ className?: string; size?: number; glow?: boolean }> = ({
  className = "w-10 h-10",
  size,
  glow = true
}) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <defs>
      <linearGradient id="racketCyanGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#00f0ff" />
        <stop offset="100%" stopColor="#3b82f6" />
      </linearGradient>
      <linearGradient id="racketIndigoGrad" x1="100" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#a855f7" />
        <stop offset="100%" stopColor="#6366f1" />
      </linearGradient>
      <filter id="racketGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    {/* Racket 1: Slanted Right-Down (Handle at bottom left, Head at top right) */}
    <g transform="rotate(38 50 50)" filter={glow ? "url(#racketGlow)" : undefined}>
      {/* Head */}
      <ellipse cx="50" cy="22" rx="15" ry="19" stroke="url(#racketCyanGrad)" strokeWidth="3" fill="#00f0ff" fillOpacity="0.06" />
      {/* Strings */}
      <line x1="44" y1="6" x2="44" y2="38" stroke="#00f0ff" strokeWidth="1" strokeOpacity="0.4" />
      <line x1="50" y1="3" x2="50" y2="41" stroke="#00f0ff" strokeWidth="1.2" strokeOpacity="0.5" />
      <line x1="56" y1="6" x2="56" y2="38" stroke="#00f0ff" strokeWidth="1" strokeOpacity="0.4" />
      <line x1="38" y1="16" x2="62" y2="16" stroke="#00f0ff" strokeWidth="1" strokeOpacity="0.4" />
      <line x1="36" y1="22" x2="64" y2="22" stroke="#00f0ff" strokeWidth="1.2" strokeOpacity="0.5" />
      <line x1="38" y1="28" x2="62" y2="28" stroke="#00f0ff" strokeWidth="1" strokeOpacity="0.4" />
      {/* Shaft */}
      <line x1="50" y1="41" x2="50" y2="72" stroke="url(#racketCyanGrad)" strokeWidth="3" strokeLinecap="round" />
      {/* Grip */}
      <rect x="47" y="72" width="6" height="24" rx="2" fill="#00f0ff" />
      <line x1="47" y1="78" x2="53" y2="82" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.7" />
      <line x1="47" y1="84" x2="53" y2="88" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.7" />
    </g>

    {/* Racket 2: Slanted Left-Down (Handle at bottom right, Head at top left) */}
    <g transform="rotate(-38 50 50)" filter={glow ? "url(#racketGlow)" : undefined}>
      {/* Head */}
      <ellipse cx="50" cy="22" rx="15" ry="19" stroke="url(#racketIndigoGrad)" strokeWidth="3" fill="#6366f1" fillOpacity="0.06" />
      {/* Strings */}
      <line x1="44" y1="6" x2="44" y2="38" stroke="#a855f7" strokeWidth="1" strokeOpacity="0.4" />
      <line x1="50" y1="3" x2="50" y2="41" stroke="#a855f7" strokeWidth="1.2" strokeOpacity="0.5" />
      <line x1="56" y1="6" x2="56" y2="38" stroke="#a855f7" strokeWidth="1" strokeOpacity="0.4" />
      <line x1="38" y1="16" x2="62" y2="16" stroke="#a855f7" strokeWidth="1" strokeOpacity="0.4" />
      <line x1="36" y1="22" x2="64" y2="22" stroke="#a855f7" strokeWidth="1.2" strokeOpacity="0.5" />
      <line x1="38" y1="28" x2="62" y2="28" stroke="#a855f7" strokeWidth="1" strokeOpacity="0.4" />
      {/* Shaft */}
      <line x1="50" y1="41" x2="50" y2="72" stroke="url(#racketIndigoGrad)" strokeWidth="3" strokeLinecap="round" />
      {/* Grip */}
      <rect x="47" y="72" width="6" height="24" rx="2" fill="#6366f1" />
      <line x1="47" y1="78" x2="53" y2="82" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.7" />
      <line x1="47" y1="84" x2="53" y2="88" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.7" />
    </g>

    {/* Center Luminous Feather Shuttlecock Emblem */}
    <g transform="translate(37, 37)">
      <circle cx="13" cy="13" r="14" fill="#070c1e" stroke="#00f0ff" strokeWidth="1.8" />
      <ellipse cx="13" cy="19" rx="3" ry="2" fill="#facc15" />
      <path d="M10 18 L6 8 C6 7 20 7 20 8 L16 18" stroke="#ffffff" strokeWidth="1.2" fill="#ffffff" fillOpacity="0.25" />
      <line x1="8" y1="13" x2="18" y2="13" stroke="#facc15" strokeWidth="0.8" />
      <line x1="13" y1="18" x2="13" y2="7" stroke="#ffffff" strokeWidth="1" />
    </g>
  </svg>
);

export const LiftIcon: React.FC<{ className?: string; size?: number }> = ({ className = "w-5 h-5", size }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    {/* High Upward Curved Lob Arc */}
    <path d="M3 20 C6 18 10 5 21 4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    {/* Arrowhead at apex */}
    <path d="M17 3 L21 4 L20 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    {/* Shuttlecock at origin */}
    <circle cx="4" cy="19" r="2.5" fill="currentColor" />
    {/* Court Net Line at center */}
    <line x1="10" y1="15" x2="10" y2="21" stroke="currentColor" strokeWidth="1.5" strokeDasharray="1 1.5" opacity="0.6" />
  </svg>
);

export const ShuttlecockSpinIcon: React.FC<{ className?: string; size?: number }> = ({ className = "w-5 h-5", size }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    {/* Tumbling Vortex Spiral */}
    <path d="M12 2 A 10 10 0 0 1 22 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeDasharray="2 3" opacity="0.6" />
    <path d="M12 22 A 10 10 0 0 1 2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeDasharray="2 3" opacity="0.6" />
    {/* Diagonal Shuttlecock */}
    <ellipse cx="12" cy="12" rx="4" ry="3" transform="rotate(-45 12 12)" fill="currentColor" opacity="0.85" />
    <path d="M8 8 L3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M16 16 L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const CourtDimensionsIcon: React.FC<{ className?: string; size?: number }> = ({ className = "w-5 h-5", size }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    {/* Court Outer Boundary */}
    <rect x="3" y="2" width="18" height="20" rx="1.5" stroke="currentColor" strokeWidth="1.4" fill="currentColor" fillOpacity="0.08" />
    
    {/* Singles Lines */}
    <line x1="5.5" y1="2" x2="5.5" y2="22" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.7" />
    <line x1="18.5" y1="2" x2="18.5" y2="22" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.7" />
    
    {/* Center Net */}
    <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeDasharray="1.5 1.5" />
    
    {/* Short Service Lines */}
    <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" strokeWidth="1" strokeOpacity="0.8" />
    <line x1="3" y1="15" x2="21" y2="15" stroke="currentColor" strokeWidth="1" strokeOpacity="0.8" />
    
    {/* Center Line */}
    <line x1="12" y1="2" x2="12" y2="9" stroke="currentColor" strokeWidth="0.9" />
    <line x1="12" y1="15" x2="12" y2="22" stroke="currentColor" strokeWidth="0.9" />
  </svg>
);

export const SmashRadarIcon: React.FC<{ className?: string; size?: number }> = ({ className = "w-5 h-5", size }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    {/* Gauge Arc */}
    <path d="M4 16 A 9 9 0 0 1 20 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 3" opacity="0.6" />
    <path d="M4 16 A 9 9 0 0 1 17 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    {/* Needle */}
    <circle cx="12" cy="16" r="2" fill="currentColor" />
    <path d="M12 16 L17.5 9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    {/* Speed lines */}
    <path d="M19 5 L22 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M20 9 L23 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
