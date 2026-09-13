import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import { CONFIG } from '../data/catalog';
import { useStore } from '../store/store';

const N = 10;

/**
 * The entry: the brand mark floats in 3D on a red glow, then shatters into a
 * 10×10 grid of shards that tumble away and fade the whole screen out.
 */
export function Splash() {
  const { state } = useStore();
  const secs = CONFIG.splashSeconds;

  const tiles = useMemo(() => {
    const out: { key: number; style: CSSProperties }[] = [];
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const i = r * N + c;
        const h = Math.sin(i * 12.9898) * 43758.5453;
        const f = h - Math.floor(h);
        const dx = (c - (N - 1) / 2) / N;
        const dy = (r - (N - 1) / 2) / N;
        out.push({
          key: i,
          style: {
            backgroundImage: 'url(assets/logo.jpg)',
            backgroundSize: `${N * 100}% ${N * 100}%`,
            backgroundPosition: `${(c * 100) / (N - 1)}% ${(r * 100) / (N - 1)}%`,
            backfaceVisibility: 'hidden',
            '--tx': `${dx * 160 + (f - 0.5) * 60}vmin`,
            '--ty': `${dy * 160 + 40 + f * 60}vmin`,
            '--tz': `${f * 900 - 300}px`,
            '--rx': `${(f - 0.5) * 720}deg`,
            '--ry': `${dx * 540 + f * 180}deg`,
            animation: `cdvShard 1.3s cubic-bezier(.4,0,.8,1) ${(secs - 0.8 + f * 0.35 + Math.abs(dy) * 0.25).toFixed(2)}s both`,
          } as CSSProperties,
        });
      }
    }
    return out;
  }, [secs]);

  if (!state.splash) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: '#050202',
        display: 'grid',
        placeItems: 'center',
        perspective: '1200px',
        overflow: 'hidden',
        animation: `cdvOut .7s ease ${secs + 0.45}s both`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: '70vmin',
          height: '70vmin',
          borderRadius: '50%',
          background: 'radial-gradient(circle, #7c1405 0%, transparent 70%)',
          animation: 'cdvGlow 3s ease-in-out infinite',
        }}
      />
      <div
        style={{
          width: 'min(82vmin, 640px)',
          aspectRatio: '1',
          display: 'grid',
          gridTemplateColumns: `repeat(${N},1fr)`,
          transformStyle: 'preserve-3d',
          animation: 'cdvFloat 4s ease-in-out infinite alternate',
        }}
      >
        {tiles.map((t) => (
          <div key={t.key} style={t.style} />
        ))}
      </div>
    </div>
  );
}
