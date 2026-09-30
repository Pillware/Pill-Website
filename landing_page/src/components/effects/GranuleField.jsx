import { useEffect, useRef, useState } from 'react';
import { createGranuleFactory, granuleKeyframesCss } from './granules';

// Average area per granule (px^2), calibrated so the collapsed desktop field
// matches the previous fixed 120 granule density. Spawning is driven by area,
// so the field keeps this density when the container grows or shrinks instead
// of stretching the existing granules apart.
const AREA_PER_GRANULE = 8000;

// Fade out time for despawned granules before they are removed (ms).
const DESPAWN_FADE_MS = 600;

/**
 * Live granule field that spawns and despawns particles while its container
 * resizes, for example when foldout cards expand and collapse. Positions are
 * stored in pixels, so existing particles never move when the area changes:
 * growing spawns new granules, shrinking fades surplus ones out evenly
 * (granules outside the new bounds first, then random picks).
 *
 * @param {number} props.seed      - PRNG seed, keeps the pattern deterministic
 * @param {string} props.className - extra classes for the positioned wrapper
 */
const GranuleField = ({ seed = 42, className = '' }) => {
    const containerRef = useRef(null);
    const factoryRef = useRef(null);
    const nextIdRef = useRef(1);
    const granulesRef = useRef([]);
    const [granules, setGranules] = useState([]);

    if (factoryRef.current === null) {
        factoryRef.current = createGranuleFactory({ seed });
    }

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return undefined;

        // Move one percent based granule from the factory into pixel space.
        const placeGranule = (width, height) => {
            const base = factoryRef.current.spawnGranule();
            return {
                id: nextIdRef.current++,
                x: Math.round((Number(base.x) / 100) * width * 10) / 10,
                y: Math.round((Number(base.y) / 100) * height * 10) / 10,
                radius: base.radius,
                opacity: base.opacity,
                color: base.color,
                duration: base.duration,
                delay: base.delay,
                driftX: base.driftX,
                driftY: base.driftY,
                despawning: false,
            };
        };

        // Reconcile the granule count with the current container area.
        const reconcile = (width, height) => {
            if (width === 0 || height === 0) return;

            const targetCount = Math.max(1, Math.round((width * height) / AREA_PER_GRANULE));
            const current = granulesRef.current;
            const alive = current.filter((granule) => !granule.despawning);

            if (alive.length === targetCount) return;

            let next;
            if (alive.length < targetCount) {
                // Spawn the missing granules across the current area.
                next = [...current];
                for (let i = alive.length; i < targetCount; i++) {
                    next.push(placeGranule(width, height));
                }
            } else {
                // Shrink: the field must stay evenly spread. Granules that
                // ended up outside the new bounds go first (they are already
                // clipped), then random picks - removing the bottom-most ones
                // eroded the dense bottom edge band fold after fold.
                const excess = alive.length - targetCount;
                const victimIds = new Set(
                    alive
                        .filter((granule) => granule.y > height)
                        .sort((a, b) => b.y - a.y)
                        .slice(0, excess)
                        .map((granule) => granule.id)
                );

                const pool = alive.filter((granule) => !victimIds.has(granule.id));
                while (victimIds.size < excess && pool.length > 0) {
                    const index = Math.floor(Math.random() * pool.length);
                    victimIds.add(pool.splice(index, 1)[0].id);
                }

                next = current.map((granule) =>
                    victimIds.has(granule.id) ? { ...granule, despawning: true } : granule
                );
            }

            granulesRef.current = next;
            setGranules(next);
        };

        // Spawn for the current size right away instead of waiting for the
        // first observer tick; ResizeObserver only handles later changes and
        // fires at most once per frame, so it can reconcile directly.
        const initialRect = container.getBoundingClientRect();
        reconcile(initialRect.width, initialRect.height);

        const observer = new ResizeObserver((entries) => {
            const { width, height } = entries[entries.length - 1].contentRect;
            reconcile(width, height);
        });

        observer.observe(container);
        return () => observer.disconnect();
    }, []);

    // Drop granules once their fade out animation has finished.
    useEffect(() => {
        if (!granules.some((granule) => granule.despawning)) return undefined;

        const timeout = setTimeout(() => {
            const next = granulesRef.current.filter((granule) => !granule.despawning);
            granulesRef.current = next;
            setGranules(next);
        }, DESPAWN_FADE_MS);
        return () => clearTimeout(timeout);
    }, [granules]);

    return (
        <div ref={containerRef} className={className}>
            <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                <defs>
                    <style>
                        {`${granuleKeyframesCss()} @keyframes granule-appear{from{opacity:0}} @keyframes granule-disappear{to{opacity:0}}`}
                    </style>
                </defs>
                {granules.map((granule) => (
                    <circle
                        key={granule.id}
                        cx={granule.x}
                        cy={granule.y}
                        r={granule.radius}
                        fill={granule.color}
                        opacity={granule.opacity}
                        style={
                            granule.despawning
                                ? { animation: `granule-disappear ${DESPAWN_FADE_MS}ms ease-in forwards` }
                                : {
                                    animation: `granule-float ${granule.duration}s ${granule.delay}s ease-in-out infinite, granule-appear 700ms ease-out`,
                                    '--drift-x': `${granule.driftX}px`,
                                    '--drift-y': `${granule.driftY}px`,
                                }
                        }
                    />
                ))}
            </svg>
        </div>
    );
};

export default GranuleField;
