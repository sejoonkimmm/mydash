interface Props {
  size?: number;
}

// Liquid Glass mascot — friendly holographic orb companion
export default function Mascot({ size = 36 }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer glow */}
      <circle cx="20" cy="20" r="17" fill="url(#orbGlow)" opacity="0.3">
        <animate attributeName="r" values="17;18;17" dur="4s" repeatCount="indefinite" />
      </circle>

      {/* Glass sphere body */}
      <circle cx="20" cy="20" r="14" fill="url(#orbBody)" stroke="url(#orbStroke)" strokeWidth="1" />

      {/* Inner glass reflection — top highlight */}
      <ellipse cx="17" cy="14" rx="8" ry="5" fill="white" opacity="0.06" />

      {/* Face — two happy arc eyes */}
      <path d="M 14 18 Q 15.5 16 17 18" stroke="#2dd4bf" strokeWidth="1.8" strokeLinecap="round" fill="none">
        <animate attributeName="d" values="M 14 18 Q 15.5 16 17 18;M 14 18.5 Q 15.5 18 17 18.5;M 14 18 Q 15.5 16 17 18" dur="3s" repeatCount="indefinite" />
      </path>
      <path d="M 23 18 Q 24.5 16 26 18" stroke="#2dd4bf" strokeWidth="1.8" strokeLinecap="round" fill="none">
        <animate attributeName="d" values="M 23 18 Q 24.5 16 26 18;M 23 18.5 Q 24.5 18 26 18.5;M 23 18 Q 24.5 16 26 18" dur="3s" repeatCount="indefinite" />
      </path>

      {/* Smile */}
      <path d="M 17 23 Q 20 26 23 23" stroke="#2dd4bf" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.6" />

      {/* Tiny floating particles around */}
      <circle cx="8" cy="12" r="1" fill="#c4b5fd" opacity="0.4">
        <animate attributeName="cy" values="12;10;12" dur="3s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.4;0.7;0.4" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle cx="33" cy="28" r="0.8" fill="#fb7185" opacity="0.3">
        <animate attributeName="cy" values="28;26;28" dur="2.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.3;0.6;0.3" dur="2.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="30" cy="8" r="0.6" fill="#2dd4bf" opacity="0.3">
        <animate attributeName="cy" values="8;6;8" dur="3.5s" repeatCount="indefinite" />
      </circle>

      <defs>
        <radialGradient id="orbGlow" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#2dd4bf" />
          <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="orbBody" cx="40%" cy="35%" r="55%">
          <stop offset="0%" stopColor="rgba(45,212,191,0.12)" />
          <stop offset="60%" stopColor="rgba(22,22,34,0.9)" />
          <stop offset="100%" stopColor="rgba(10,10,15,0.95)" />
        </radialGradient>
        <linearGradient id="orbStroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
          <stop offset="50%" stopColor="rgba(45,212,191,0.3)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
        </linearGradient>
      </defs>
    </svg>
  );
}
