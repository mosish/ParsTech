import React from 'react';
import type { Product } from '../utils/commerce';

interface ProductArtworkProps {
  artworkKey: Product['artworkKey'] | 'hero_showcase';
  accentHex?: string;
  className?: string;
}

export const ProductArtwork: React.FC<ProductArtworkProps> = ({
  artworkKey,
  accentHex = '#C8C2B8',
  className = 'w-full h-full',
}) => {
  const uid = `${artworkKey}-${accentHex.replace(/[^a-zA-Z0-9]/g, '')}`;

  switch (artworkKey) {
    case 'hero_showcase':
      return (
        <svg
          viewBox="0 0 640 400"
          className={className}
          role="img"
          aria-label="ParsTech Flagship Hardware Collection"
        >
          <defs>
            <linearGradient id="heroBg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#F5F5F7" />
              <stop offset="100%" stopColor="#E8E8ED" />
            </linearGradient>
            <linearGradient id="macBody" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#2C2C2E" />
              <stop offset="50%" stopColor="#1C1C1E" />
              <stop offset="100%" stopColor="#3A3A3C" />
            </linearGradient>
            <linearGradient id="macScreen" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0F172A" />
              <stop offset="50%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>
            <linearGradient id="titaniumFrame" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#D6D1C7" />
              <stop offset="50%" stopColor="#B8B2A6" />
              <stop offset="100%" stopColor="#8E897F" />
            </linearGradient>
            <filter id="studioShadow" x="-15%" y="-15%" width="130%" height="140%">
              <feDropShadow dx="0" dy="18" stdDeviation="16" floodColor="#000000" floodOpacity="0.12" />
            </filter>
          </defs>
          <rect width="640" height="400" rx="20" fill="url(#heroBg)" />
          <ellipse cx="320" cy="345" rx="220" ry="18" fill="#000000" opacity="0.07" />

          {/* Ultra-thin Pro Laptop */}
          <g filter="url(#studioShadow)" transform="translate(95, 68)">
            <rect x="36" y="0" width="290" height="190" rx="14" fill="url(#macBody)" stroke="#48484A" strokeWidth="1.5" />
            <rect x="44" y="8" width="274" height="172" rx="8" fill="url(#macScreen)" />
            {/* Notch */}
            <rect x="156" y="8" width="50" height="8" rx="3" fill="#09090B" />
            {/* Subtle abstract wallpaper */}
            <circle cx="180" cy="95" r="58" fill="#38BDF8" opacity="0.18" />
            <circle cx="210" cy="85" r="42" fill="#F8FAFC" opacity="0.12" />
            {/* Laptop Base */}
            <path d="M12 190 H350 L364 202 C364 206 358 209 348 209 H14 C4 209 -2 206 -2 202 Z" fill="url(#titaniumFrame)" />
            <rect x="152" y="190" width="58" height="4" rx="2" fill="#636366" />
          </g>

          {/* Flagship Titanium Smartphone */}
          <g filter="url(#studioShadow)" transform="translate(390, 92)">
            <rect x="0" y="0" width="118" height="226" rx="24" fill="url(#titaniumFrame)" stroke="#78716C" strokeWidth="1.5" />
            <rect x="5" y="5" width="108" height="216" rx="20" fill="#18181B" />
            {/* Camera Bump */}
            <rect x="14" y="14" width="54" height="54" rx="14" fill="#BEB8AC" opacity="0.88" />
            <circle cx="28" cy="28" r="10" fill="#18181B" stroke="#57534E" strokeWidth="2" />
            <circle cx="28" cy="54" r="10" fill="#18181B" stroke="#57534E" strokeWidth="2" />
            <circle cx="52" cy="41" r="10" fill="#18181B" stroke="#57534E" strokeWidth="2" />
            <circle cx="52" cy="23" r="4" fill="#E7E5E4" />
            <circle cx="52" cy="58" r="4.5" fill="#44403C" />
            {/* Minimal Apple-NIC style center ring */}
            <circle cx="59" cy="126" r="16" fill="none" stroke="#D6D1C7" strokeWidth="1.5" opacity="0.5" />
          </g>
        </svg>
      );

    case 'iphone16pro':
      return (
        <svg viewBox="0 0 400 300" className={className} role="img" aria-label="iPhone Pro Series">
          <defs>
            <linearGradient id={`ipPro-${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={accentHex} />
              <stop offset="100%" stopColor={accentHex} stopOpacity="0.82" />
            </linearGradient>
          </defs>
          <ellipse cx="200" cy="266" rx="86" ry="10" fill="#000" opacity="0.08" />
          {/* Back glass view */}
          <rect x="118" y="34" width="104" height="212" rx="22" fill={`url(#ipPro-${uid})`} stroke="#78716C" strokeWidth="1.5" />
          <rect x="128" y="44" width="48" height="48" rx="12" fill="#FFFFFF" opacity="0.22" stroke="#57534E" strokeWidth="0.8" />
          <circle cx="141" cy="57" r="8.5" fill="#1C1917" stroke="#78716C" strokeWidth="1.5" />
          <circle cx="141" cy="79" r="8.5" fill="#1C1917" stroke="#78716C" strokeWidth="1.5" />
          <circle cx="162" cy="68" r="8.5" fill="#1C1917" stroke="#78716C" strokeWidth="1.5" />
          {/* Front screen overlapping */}
          <rect x="178" y="48" width="104" height="212" rx="22" fill="#18181B" stroke="#78716C" strokeWidth="2" />
          <rect x="183" y="53" width="94" height="202" rx="18" fill="#09090B" />
          <circle cx="230" cy="154" r="38" fill={accentHex} opacity="0.32" />
          <rect x="213" y="60" width="34" height="9" rx="4.5" fill="#000000" />
        </svg>
      );

    case 'iphone_dual':
      return (
        <svg viewBox="0 0 400 300" className={className} role="img" aria-label="iPhone Dual-Camera Series">
          <defs>
            <linearGradient id={`ipDual-${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={accentHex} />
              <stop offset="100%" stopColor={accentHex} stopOpacity="0.84" />
            </linearGradient>
          </defs>
          <ellipse cx="200" cy="266" rx="84" ry="10" fill="#000" opacity="0.08" />
          {/* Back glass view with vertical/capsule dual camera */}
          <rect x="120" y="36" width="102" height="208" rx="22" fill={`url(#ipDual-${uid})`} stroke="#71717A" strokeWidth="1.4" />
          <rect x="130" y="46" width="30" height="52" rx="15" fill="#FFFFFF" opacity="0.26" stroke="#52525B" strokeWidth="0.9" />
          <circle cx="145" cy="60" r="9" fill="#18181B" stroke="#71717A" strokeWidth="1.5" />
          <circle cx="145" cy="83" r="9" fill="#18181B" stroke="#71717A" strokeWidth="1.5" />
          <circle cx="168" cy="72" r="3.5" fill="#FDE68A" opacity="0.85" />
          {/* Front screen overlapping */}
          <rect x="178" y="50" width="102" height="208" rx="22" fill="#18181B" stroke="#71717A" strokeWidth="1.8" />
          <rect x="183" y="55" width="92" height="198" rx="18" fill="#09090B" />
          <circle cx="229" cy="154" r="36" fill={accentHex} opacity="0.34" />
          <rect x="213" y="62" width="32" height="8.5" rx="4.25" fill="#000000" />
        </svg>
      );

    case 's25ultra':
      return (
        <svg viewBox="0 0 400 300" className={className} role="img" aria-label="Samsung Galaxy S25 Ultra">
          <ellipse cx="200" cy="266" rx="90" ry="10" fill="#000" opacity="0.08" />
          <rect x="122" y="32" width="110" height="218" rx="10" fill={accentHex} stroke="#64748B" strokeWidth="1.5" />
          <circle cx="144" cy="56" r="9" fill="#0F172A" stroke="#94A3B8" strokeWidth="1.5" />
          <circle cx="144" cy="80" r="9" fill="#0F172A" stroke="#94A3B8" strokeWidth="1.5" />
          <circle cx="144" cy="104" r="9" fill="#0F172A" stroke="#94A3B8" strokeWidth="1.5" />
          <circle cx="166" cy="68" r="6" fill="#0F172A" />
          <circle cx="166" cy="92" r="6" fill="#0F172A" />
          {/* S-Pen Stylus */}
          <rect x="254" y="54" width="10" height="188" rx="5" fill="#334155" />
          <rect x="253" y="50" width="12" height="10" rx="3" fill="#94A3B8" />
        </svg>
      );

    case 'galaxy_a':
      return (
        <svg viewBox="0 0 400 300" className={className} role="img" aria-label="Samsung Galaxy Series">
          <defs>
            <linearGradient id={`galA-${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={accentHex} />
              <stop offset="100%" stopColor={accentHex} stopOpacity="0.84" />
            </linearGradient>
          </defs>
          <ellipse cx="200" cy="266" rx="86" ry="10" fill="#000" opacity="0.08" />
          {/* Back shell with Samsung floating triple cameras + Key Island */}
          <rect x="120" y="36" width="104" height="210" rx="18" fill={`url(#galA-${uid})`} stroke="#64748B" strokeWidth="1.4" />
          <rect x="132" y="46" width="22" height="68" rx="11" fill="#0F172A" opacity="0.18" />
          <circle cx="143" cy="59" r="8" fill="#0F172A" stroke="#CBD5E1" strokeWidth="1.4" />
          <circle cx="143" cy="80" r="8" fill="#0F172A" stroke="#CBD5E1" strokeWidth="1.4" />
          <circle cx="143" cy="101" r="8" fill="#0F172A" stroke="#CBD5E1" strokeWidth="1.4" />
          <circle cx="164" cy="80" r="3.5" fill="#FDE68A" opacity="0.85" />
          {/* Front Super AMOLED screen with Infinity-O punch hole */}
          <rect x="178" y="48" width="104" height="210" rx="18" fill="#18181B" stroke="#64748B" strokeWidth="1.8" />
          <rect x="183" y="53" width="94" height="200" rx="14" fill="#0F172A" />
          <circle cx="230" cy="153" r="38" fill={accentHex} opacity="0.34" />
          <circle cx="230" cy="61" r="3.5" fill="#000000" />
        </svg>
      );

    case 'galaxy_fold':
      return (
        <svg viewBox="0 0 400 300" className={className} role="img" aria-label="Samsung Galaxy Z Fold and Flip Series">
          <ellipse cx="200" cy="266" rx="98" ry="10" fill="#000" opacity="0.08" />
          {/* Unfolded dual-wing foldable display */}
          <rect x="110" y="38" width="88" height="212" rx="12" fill={accentHex} stroke="#64748B" strokeWidth="1.5" />
          <rect x="198" y="38" width="92" height="212" rx="12" fill="#0F172A" stroke="#64748B" strokeWidth="1.8" />
          {/* Hinge spine */}
          <rect x="195" y="38" width="6" height="212" rx="2" fill="#475569" />
          {/* Camera array */}
          <rect x="122" y="50" width="22" height="64" rx="11" fill="#0F172A" opacity="0.85" />
          <circle cx="133" cy="62" r="6.5" fill="#1E293B" stroke="#94A3B8" strokeWidth="1.2" />
          <circle cx="133" cy="82" r="6.5" fill="#1E293B" stroke="#94A3B8" strokeWidth="1.2" />
          <circle cx="133" cy="102" r="6.5" fill="#1E293B" stroke="#94A3B8" strokeWidth="1.2" />
          {/* Inner foldable screen glow */}
          <circle cx="244" cy="144" r="34" fill={accentHex} opacity="0.35" />
        </svg>
      );

    case 'macbookprom4':
      return (
        <svg viewBox="0 0 400 300" className={className} role="img" aria-label="MacBook Pro M4">
          <ellipse cx="200" cy="252" rx="145" ry="12" fill="#000" opacity="0.09" />
          <rect x="76" y="48" width="248" height="162" rx="12" fill="#1C1C1E" stroke="#52525B" strokeWidth="1.5" />
          <rect x="84" y="56" width="232" height="146" rx="6" fill="#0F172A" />
          <path d="M84 160 Q200 100 316 160 L316 202 L84 202 Z" fill="#1E293B" />
          <rect x="178" y="56" width="44" height="7" rx="3" fill="#09090B" />
          <path d="M52 210 H348 L360 222 C360 226 352 228 342 228 H58 C48 228 40 226 40 222 Z" fill={accentHex} />
          <rect x="174" y="210" width="52" height="4" rx="2" fill="#52525B" />
        </svg>
      );

    case 'rogzephyrus':
      return (
        <svg viewBox="0 0 400 300" className={className} role="img" aria-label="ASUS ROG Zephyrus G16">
          <ellipse cx="200" cy="252" rx="145" ry="12" fill="#000" opacity="0.09" />
          <rect x="76" y="48" width="248" height="162" rx="10" fill="#27272A" stroke="#71717A" strokeWidth="1.5" />
          <rect x="83" y="55" width="234" height="148" rx="4" fill="#18181B" />
          {/* Slash lighting aesthetic */}
          <line x1="110" y1="70" x2="280" y2="185" stroke="#38BDF8" strokeWidth="3" opacity="0.65" />
          <path d="M54 210 H346 L356 221 H44 Z" fill="#3F3F46" />
        </svg>
      );

    case 'ps5pro':
      return (
        <svg viewBox="0 0 400 300" className={className} role="img" aria-label="PlayStation 5 Pro Console">
          <ellipse cx="200" cy="264" rx="105" ry="11" fill="#000" opacity="0.08" />
          {/* Console tower */}
          <path d="M135 36 L152 30 L152 252 L135 252 Z" fill="#F4F4F5" stroke="#D4D4D8" strokeWidth="1" />
          <rect x="152" y="34" width="26" height="218" rx="4" fill="#18181B" />
          <path d="M178 30 L195 36 L195 252 L178 252 Z" fill="#F4F4F5" stroke="#D4D4D8" strokeWidth="1" />
          {/* PS5 Pro 3 black stripes */}
          <rect x="134" y="118" width="62" height="3" fill="#18181B" />
          <rect x="134" y="125" width="62" height="3" fill="#18181B" />
          <rect x="134" y="132" width="62" height="3" fill="#18181B" />
          {/* DualSense Controller */}
          <g transform="translate(212, 174)">
            <rect x="0" y="0" width="76" height="52" rx="22" fill="#F4F4F5" stroke="#D4D4D8" strokeWidth="1.5" />
            <circle cx="24" cy="30" r="7" fill="#18181B" />
            <circle cx="52" cy="30" r="7" fill="#18181B" />
            <rect x="24" y="6" width="28" height="14" rx="4" fill="#27272A" />
          </g>
        </svg>
      );

    case 'xboxseriesx':
      return (
        <svg viewBox="0 0 400 300" className={className} role="img" aria-label="Xbox Series X 1TB">
          <ellipse cx="200" cy="264" rx="95" ry="11" fill="#000" opacity="0.09" />
          <rect x="134" y="42" width="102" height="212" rx="8" fill="#18181B" stroke="#3F3F46" strokeWidth="1.5" />
          <ellipse cx="185" cy="48" rx="44" ry="5" fill="#10B981" opacity="0.45" />
          <circle cx="152" cy="68" r="5" fill="#FAFAFA" />
          <rect x="148" y="160" width="3" height="68" fill="#09090B" />
        </svg>
      );

    case 'airpodsmax':
      return (
        <svg viewBox="0 0 400 300" className={className} role="img" aria-label="AirPods Max USB-C">
          <ellipse cx="200" cy="264" rx="88" ry="10" fill="#000" opacity="0.08" />
          <path
            d="M132 145 A68 68 0 0 1 268 145"
            fill="none"
            stroke="#A1A1AA"
            strokeWidth="14"
            strokeLinecap="round"
          />
          <rect x="114" y="132" width="44" height="92" rx="22" fill={accentHex} stroke="#A1A1AA" strokeWidth="1.5" />
          <rect x="242" y="132" width="44" height="92" rx="22" fill={accentHex} stroke="#A1A1AA" strokeWidth="1.5" />
        </svg>
      );

    case 'watchultra2':
      return (
        <svg viewBox="0 0 400 300" className={className} role="img" aria-label="Apple Watch Ultra 2">
          <ellipse cx="200" cy="262" rx="72" ry="9" fill="#000" opacity="0.08" />
          <rect x="172" y="34" width="56" height="224" rx="14" fill="#EA580C" opacity="0.85" />
          <rect x="150" y="86" width="100" height="118" rx="26" fill="#D6D3D1" stroke="#78716C" strokeWidth="2" />
          <rect x="160" y="96" width="80" height="98" rx="18" fill="#09090B" />
          <circle cx="200" cy="145" r="26" fill="none" stroke="#EA580C" strokeWidth="3" />
          <rect x="250" y="114" width="6" height="24" rx="3" fill="#EA580C" />
        </svg>
      );

    case 'ankercharger':
    default:
      return (
        <svg viewBox="0 0 400 300" className={className} role="img" aria-label="Anker Prime GaN Charger">
          <ellipse cx="200" cy="260" rx="75" ry="9" fill="#000" opacity="0.08" />
          <rect x="144" y="68" width="112" height="164" rx="20" fill="#27272A" stroke="#52525B" strokeWidth="1.5" />
          <rect x="158" y="84" width="84" height="58" rx="10" fill="#18181B" />
          <rect x="188" y="98" width="24" height="7" rx="3.5" fill="#38BDF8" />
          <rect x="188" y="114" width="24" height="7" rx="3.5" fill="#38BDF8" />
          <rect x="186" y="130" width="28" height="9" rx="2" fill="#71717A" />
        </svg>
      );
  }
};
