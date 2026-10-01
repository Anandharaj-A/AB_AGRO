import React from 'react';

interface HarvesterLogoProps {
  className?: string;
  size?: number;
}

export const HarvesterLogo: React.FC<HarvesterLogoProps> = ({ className = 'h-9 w-9', size }) => {
  const style = size ? { width: size, height: size } : undefined;
  return (
    <div
      style={style}
      className={`relative inline-flex items-center justify-center shrink-0 rounded-2xl bg-gradient-to-br from-[#18532c] via-[#1e6b37] to-[#124222] shadow-sm p-1.5 border border-[#2f8549]/40 ${className}`}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="50%" stopColor="#EAB308" />
            <stop offset="100%" stopColor="#CA8A04" />
          </linearGradient>
          <linearGradient id="bladeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
        </defs>

        {/* Outer subtle glow circle */}
        <circle cx="50" cy="50" r="44" stroke="#4ade80" strokeWidth="1.5" strokeOpacity="0.25" strokeDasharray="4 2" />

        {/* Harvester combine / tractor stylized graphic */}
        {/* Cab */}
        <path
          d="M32 30 H56 C60 30 63 33 64 37 L67 52 H28 L30 33 C30.5 31.3 31.2 30 32 30 Z"
          fill="#FFFFFF"
          fillOpacity="0.95"
        />
        {/* Cab Window */}
        <path
          d="M35 34 H54 L52 46 H33 Z"
          fill="#0F2E1B"
          fillOpacity="0.85"
        />

        {/* Body Chassis */}
        <rect x="22" y="50" width="56" height="15" rx="3" fill="url(#goldGrad)" />

        {/* Front Harvester Reel / Cutter Drum */}
        <circle cx="80" cy="56" r="12" fill="none" stroke="url(#bladeGrad)" strokeWidth="3.5" />
        <line x1="80" y1="44" x2="80" y2="68" stroke="url(#bladeGrad)" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="68" y1="56" x2="92" y2="56" stroke="url(#bladeGrad)" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="80" cy="56" r="3.5" fill="#FFFFFF" />

        {/* Big Rear Crawler / Track Wheels */}
        <circle cx="36" cy="68" r="11" fill="#0D2817" stroke="url(#goldGrad)" strokeWidth="3" />
        <circle cx="36" cy="68" r="4" fill="url(#goldGrad)" />
        <line x1="36" y1="57" x2="36" y2="79" stroke="#0D2817" strokeWidth="2" />
        <line x1="25" y1="68" x2="47" y2="68" stroke="#0D2817" strokeWidth="2" />

        <circle cx="58" cy="68" r="9" fill="#0D2817" stroke="url(#goldGrad)" strokeWidth="3" />
        <circle cx="58" cy="68" r="3" fill="url(#goldGrad)" />

        {/* Golden Wheat Stalk on Left */}
        <path
          d="M16 75 Q 14 45 22 24"
          stroke="url(#goldGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Wheat Grains */}
        <path d="M19 26 C 24 23 25 30 19 32 Z" fill="url(#goldGrad)" />
        <path d="M15 32 C 10 30 11 37 16 38 Z" fill="url(#goldGrad)" />
        <path d="M20 38 C 25 36 26 43 20 44 Z" fill="url(#goldGrad)" />
        <path d="M16 44 C 11 43 12 50 17 50 Z" fill="url(#goldGrad)" />

        {/* Rupee Coin in Top Right */}
        <circle cx="75" cy="24" r="10" fill="url(#goldGrad)" stroke="#FEF08A" strokeWidth="1" />
        <text
          x="75"
          y="28"
          fill="#144026"
          fontSize="11"
          fontWeight="bold"
          fontFamily="system-ui, -apple-system, sans-serif"
          textAnchor="middle"
        >
          ₹
        </text>
      </svg>
    </div>
  );
};
