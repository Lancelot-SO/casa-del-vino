import { useMemo } from 'react';
import type { CSSProperties, ReactNode } from 'react';

const GLASS = 'M20 4h24c0 14-4 24-10 26v14h10v4H20v-4h10V30C24 28 20 18 20 4Z';
const BOTTLE = 'M26 2h12v14c4 2 6 6 6 12v36c0 2-2 4-4 4H24c-2 0-4-2-4-4V28c0-6 2-10 6-12Z';

/**
 * The constant 3D layer behind every page: translucent glasses and bottles
 * spinning in perspective while drifting, over slow wine-coloured glows.
 * Built once — the figures never depend on state.
 */
export function Background() {
  const items = useMemo<ReactNode[]>(() => {
    const out: ReactNode[] = [];
    for (let i = 0; i < 9; i++) {
      const h = Math.sin(i * 78.233) * 43758.5453;
      const f = h - Math.floor(h);
      const g = (f * 7.13) % 1;
      const bottle = i % 3 === 0;
      const size = 90 + f * 110;
      out.push(
        <div
          key={i}
          style={
            {
              position: 'absolute',
              left: `${5 + g * 88}%`,
              top: `${5 + f * 85}%`,
              width: size,
              height: size * 1.6,
              '--dx': `${(g - 0.5) * 180}px`,
              '--dy': `${(f - 0.5) * 140}px`,
              animation: `cdvDrift ${26 + f * 20}s ease-in-out ${-f * 30}s infinite`,
              transformStyle: 'preserve-3d',
            } as CSSProperties
          }
        >
          <svg
            viewBox="0 0 64 72"
            width="100%"
            height="100%"
            style={
              {
                display: 'block',
                '--tilt': `${(f - 0.5) * 40}deg`,
                animation: `cdvSpin ${14 + g * 16}s linear ${-g * 20}s infinite`,
                filter: 'drop-shadow(0 0 18px rgba(194,43,69,.5))',
              } as CSSProperties
            }
          >
            <path
              d={bottle ? BOTTLE : GLASS}
              fill={`rgba(120,16,34,${0.18 + f * 0.2})`}
              stroke={`rgba(224,82,107,${0.35 + g * 0.3})`}
              strokeWidth={1.2}
              strokeLinejoin="round"
            />
            {bottle ? null : <path d="M23 14c2 8 5 13 9 14c4-1 7-6 9-14Z" fill="rgba(160,20,45,.55)" />}
          </svg>
        </div>,
      );
    }
    for (let i = 0; i < 4; i++) {
      const f = ((i + 1) * 0.37) % 1;
      out.push(
        <div
          key={'o' + i}
          style={{
            position: 'absolute',
            left: `${10 + i * 25}%`,
            top: `${15 + f * 60}%`,
            width: 320 + f * 240,
            height: 320 + f * 240,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(140,20,40,.35) 0%, transparent 65%)',
            animation: `cdvPulse ${9 + f * 8}s ease-in-out ${-f * 10}s infinite`,
            filter: 'blur(10px)',
          }}
        />,
      );
    }
    return out;
  }, []);

  return (
    <div
      aria-hidden
      style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', perspective: '900px', pointerEvents: 'none' }}
    >
      {items}
    </div>
  );
}
