import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { POLAROID_SCENE_ASSET } from '../utils/companionScript';

export const KawaiiBow: React.FC<{ className?: string }> = ({ className = 'h-7 w-9' }) => (
  <svg viewBox="0 0 64 46" fill="none" className={className} aria-hidden="true">
    <path
      d="M27 21C20 10 8 8 5 16C2 24 12 31 27 25"
      fill="#FFBCD8"
      stroke="#D67EA2"
      strokeWidth="2.4"
      strokeLinejoin="round"
    />
    <path
      d="M37 21C44 10 56 8 59 16C62 24 52 31 37 25"
      fill="#FFBCD8"
      stroke="#D67EA2"
      strokeWidth="2.4"
      strokeLinejoin="round"
    />
    <path
      d="M28 25L18 40L27 36L31 27"
      fill="#FFD6E8"
      stroke="#D67EA2"
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
    <path
      d="M36 25L46 40L37 36L33 27"
      fill="#FFD6E8"
      stroke="#D67EA2"
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
    <circle cx="32" cy="23" r="6" fill="#FFF0F6" stroke="#D67EA2" strokeWidth="2.4" />
  </svg>
);

export const KawaiiSparkle: React.FC<{
  className?: string;
  color?: 'pink' | 'mint' | 'white';
}> = ({ className = 'h-5 w-5', color = 'pink' }) => {
  const fill = color === 'mint' ? '#BDF7EE' : color === 'white' ? '#FFFFFF' : '#FFC2DC';
  return (
    <svg viewBox="0 0 28 28" fill="none" className={className} aria-hidden="true">
      <path
        d="M14 2L16.8 11.2L26 14L16.8 16.8L14 26L11.2 16.8L2 14L11.2 11.2L14 2Z"
        fill={fill}
        stroke="#DC89AB"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const KawaiiMiniStar: React.FC<{ className?: string; fill?: string }> = ({
  className = 'h-4 w-4',
  fill = '#C2F7EE',
}) => (
  <svg viewBox="0 0 28 28" fill="none" className={className} aria-hidden="true">
    <path
      d="M14 2.5L17.4 9.5L25 10.6L19.5 16L20.8 23.6L14 20L7.2 23.6L8.5 16L3 10.6L10.6 9.5L14 2.5Z"
      fill={fill}
      stroke="#DC89AB"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </svg>
);

export const KawaiiHeartNavButton: React.FC<{
  onClick: () => void;
  ariaLabel: string;
}> = ({ onClick, ariaLabel }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={ariaLabel}
    className="group relative flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center transition-transform duration-150 hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F3A4C3]"
  >
    <svg viewBox="0 0 56 52" fill="none" className="h-9 w-9 sm:h-12 sm:w-12 drop-shadow-[0_2.5px_0_#F5B8D2]" aria-hidden="true">
      <defs>
        <linearGradient id="kawaiiHeartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFC2DC" />
          <stop offset="55%" stopColor="#FFE8F2" />
          <stop offset="100%" stopColor="#B8F6EE" />
        </linearGradient>
      </defs>
      <path
        d="M28 47C28 47 6 33.8 6 17.8C6 10.2 12 4.5 19.2 4.5C23.5 4.5 26.7 6.8 28 9.8C29.3 6.8 32.5 4.5 36.8 4.5C44 4.5 50 10.2 50 17.8C50 33.8 28 47 28 47Z"
        fill="url(#kawaiiHeartGrad)"
        stroke="#DC82A6"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
    </svg>
    <ChevronLeft
      className="pointer-events-none absolute h-4 w-4 sm:h-5 sm:w-5 -translate-y-0.5 text-[#9B4D70] stroke-[2.6]"
      aria-hidden="true"
    />
  </button>
);

export const KawaiiStarNavButton: React.FC<{
  onClick: () => void;
  ariaLabel: string;
}> = ({ onClick, ariaLabel }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={ariaLabel}
    className="group relative flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center transition-transform duration-150 hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F3A4C3]"
  >
    <svg viewBox="0 0 56 54" fill="none" className="h-9 w-9 sm:h-12 sm:w-12 drop-shadow-[0_2.5px_0_#F5B8D2]" aria-hidden="true">
      <defs>
        <linearGradient id="kawaiiStarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFC2DC" />
          <stop offset="50%" stopColor="#FFEDF5" />
          <stop offset="100%" stopColor="#B8F6EE" />
        </linearGradient>
      </defs>
      <path
        d="M28 4L34.8 18.2L50.4 20.4L39.1 31.3L41.8 46.8L28 39.4L14.2 46.8L16.9 31.3L5.6 20.4L21.2 18.2L28 4Z"
        fill="url(#kawaiiStarGrad)"
        stroke="#DC82A6"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
    </svg>
    <ChevronRight
      className="pointer-events-none absolute h-4 w-4 sm:h-5 sm:w-5 translate-y-0.5 text-[#9B4D70] stroke-[2.6]"
      aria-hidden="true"
    />
  </button>
);

export const KawaiiPolaroid: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    aria-hidden="true"
    className={`pointer-events-none select-none rounded-lg border-2 border-[#F4B6D0] bg-white dark:bg-[#2A1D3D] p-1.5 pb-4 shadow-[0_6px_16px_rgba(243,164,195,0.28)] ${className}`}
  >
    <div className="h-16 w-16 overflow-hidden rounded-sm bg-gradient-to-br from-pink-100 via-purple-100 to-teal-100">
      <img
        src={POLAROID_SCENE_ASSET}
        alt=""
        referrerPolicy="no-referrer"
        className="h-full w-full object-cover"
      />
    </div>
  </div>
);
