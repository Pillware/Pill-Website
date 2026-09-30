/**
 * Generates an HTML string for an animated granule-field SVG backdrop.
 * Returns a { __html } object suitable for dangerouslySetInnerHTML.
 *
 * @param {object} options
 * @param {number} [options.seed=42]       - PRNG seed for deterministic output
 * @param {number} [options.count=120]     - Number of granules
 * @param {string} [options.keyframesName='granule-float'] - CSS @keyframes name
 * @returns {{ __html: string }}
 */

// ── Defaults ──
const DEFAULT_SEED        = 42;
const DEFAULT_COUNT       = 120;
const DEFAULT_KEYFRAMES   = 'granule-float';

// ── Edge bias ──
const EDGE_BAND_PCT       = 20;    // % - width of edge band (0-X% and 100-X%)

// ── Granule appearance ──
const RADIUS_MIN          = 0.3;   // px
const RADIUS_MAX          = 2.3;   // px
const OPACITY_MIN         = 0.2;   // 0–1
const OPACITY_MAX         = 0.8;   // 0–1
const DURATION_MIN        = 3;     // s - animation cycle
const DURATION_MAX        = 7;     // s
const DELAY_MAX           = 5;     // s - stagger
const DRIFT_MAX           = 4;     // px - ± drift range

// ── Color blend ──
const BRAND_R             = 255;   // brand red
const BRAND_G             = 99;
const BRAND_B             = 99;

// ── Keyframe ──
const KEYFRAME_MID_X      = -0.6;  // multiplier at 66%
const KEYFRAME_MID_Y      = -0.8;

// Deterministic granule factory: every spawnGranule() call advances the
// seeded PRNG and returns one granule with percent coordinates (edge biased),
// radius, opacity, animation timing and drift offsets.
export function createGranuleFactory({ seed = DEFAULT_SEED } = {}) {
    // Mulberry32 PRNG
    const mulberry32 = (s) => {
        return () => {
            s |= 0; s = s + 0x6D2B79F5 | 0;
            let t = Math.imul(s ^ s >>> 15, 1 | s);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    };
    const random = mulberry32(seed);

    const uniformCoordinate = () => random() * 100;

    // Bias positions toward edges, away from center
    const edgeCoordinate = () => {
        const value = random();
        return value < 0.5
            ? value * 2 * EDGE_BAND_PCT
            : 100 - (1 - value) * 2 * EDGE_BAND_PCT;
    };

    // Blend brand red toward white based on mix ratio (0=white, 1=red)
    const granuleColor = (mix) => {
        const g = Math.round(BRAND_G + (255 - BRAND_G) * (1 - mix));
        const b = Math.round(BRAND_B + (255 - BRAND_B) * (1 - mix));
        return `rgb(${BRAND_R},${g},${b})`;
    };

    const spawnGranule = () => {
        // Place on edges: one axis at edge, other full-range
        const onVerticalEdge = random() < 0.5;
        const x = onVerticalEdge ? edgeCoordinate().toFixed(1) : uniformCoordinate().toFixed(1);
        const y = onVerticalEdge ? uniformCoordinate().toFixed(1) : edgeCoordinate().toFixed(1);
        const radius = (random() * (RADIUS_MAX - RADIUS_MIN) + RADIUS_MIN).toFixed(1);
        const opacity = (random() * (OPACITY_MAX - OPACITY_MIN) + OPACITY_MIN).toFixed(2);
        const duration = (random() * (DURATION_MAX - DURATION_MIN) + DURATION_MIN).toFixed(1);
        const delay = (random() * DELAY_MAX).toFixed(1);
        const driftX = (random() * DRIFT_MAX * 2 - DRIFT_MAX).toFixed(1);
        const driftY = (random() * DRIFT_MAX * 2 - DRIFT_MAX).toFixed(1);
        const colorMix = random();

        return {
            x,
            y,
            radius,
            opacity,
            duration,
            delay,
            driftX,
            driftY,
            color: granuleColor(colorMix),
        };
    };

    return { spawnGranule };
}

// CSS for the drifting float animation shared by every granule, used both by
// the static SVG string builder and the live GranuleField component.
export function granuleKeyframesCss(keyframesName = DEFAULT_KEYFRAMES) {
    return `@keyframes ${keyframesName}{0%,100%{transform:translate3d(0,0,0)}33%{transform:translate3d(var(--drift-x),var(--drift-y),0)}66%{transform:translate3d(calc(var(--drift-x) * ${KEYFRAME_MID_X}),calc(var(--drift-y) * ${KEYFRAME_MID_Y}),0)}}`;
}

// Builds the granule field as a static { __html } string for sections whose
// size does not change (used through dangerouslySetInnerHTML).
export function generateGranuleField({
    seed = DEFAULT_SEED,
    count = DEFAULT_COUNT,
    keyframesName = DEFAULT_KEYFRAMES,
} = {}) {
    const { spawnGranule } = createGranuleFactory({ seed });

    const circles = [];
    for (let i = 0; i < count; i++) {
        const granule = spawnGranule();
        circles.push(
            `<circle cx="${granule.x}%" cy="${granule.y}%" r="${granule.radius}" fill="${granule.color}" opacity="${granule.opacity}" style="animation: ${keyframesName} ${granule.duration}s ${granule.delay}s ease-in-out infinite; --drift-x: ${granule.driftX}px; --drift-y: ${granule.driftY}px;" />`
        );
    }

    return {
        __html: `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" style="position:absolute;inset:0;pointer-events:none;"><defs><style>${granuleKeyframesCss(keyframesName)}</style></defs>${circles.join('')}</svg>`
    };
}
