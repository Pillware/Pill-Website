import { useEffect, useRef } from 'react';

const vertexShader = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragmentShader = `
precision highp float;

uniform vec2 resolution;
uniform vec2 viewport;
uniform float time;
// How far the two opening reveals have progressed on the JavaScript side -
// the light rises from zero first and the rib refraction follows a second
// later, growing from flat to full strength; both are pinned to 1 when
// frames are frozen.
uniform float introReveal;
uniform float introRefraction;

// Live tunables - driven by the floating controls panel and kept in the
// same keys as defaultAuroraParams on the JavaScript side.
uniform float fluteWidth;
uniform float fluteStrength;
uniform float ribRotation;
uniform float edgeGlint;
uniform float lightLeak;
uniform float leakVariation;
uniform float leakFlicker;
uniform float ribReflection;
uniform float pillStrength;
uniform float pillScale;
uniform sampler2D pillPattern;
uniform float gradientSpeed;
uniform float exposure;
uniform float warpStrength;
uniform float warpSpeed;
uniform float noiseScaleX;
uniform float noiseScaleY;
uniform float grainAmount;
uniform float ditherMode;
uniform float ditherAmount;
uniform float ditherFadeStart;
uniform float ditherFadeEnd;
uniform float ditherLevels;
uniform float ditherScale;

// --- Noise helpers (value noise + 3-octave fbm) ---
// Sin-free hash (Dave Hoskins style): the classic sin-based version costs
// one SFU instruction per call, and the warp, grain and dither together
// call it ~26 times per pixel - this arithmetic-only version removes that
// pipe pressure, and the noise fields it feeds are statistically identical.
float hash(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
        f.y
    );
}

float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 3; i++) {
        value += amplitude * noise(p);
        p *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

// Ordered-dither helpers: a Bayer 2x2/4x4/8x8 family plus interleaved
// gradient noise - the selectable screen-space patterns that quantise the
// finished frame into engraved-looking steps.
float bayer2(vec2 a) {
    a = floor(a);
    return fract(a.x / 2.0 + a.y * a.y * 0.75);
}

float bayer4(vec2 a) {
    return bayer2(0.5 * a) * 0.25 + bayer2(a);
}

float bayer8(vec2 a) {
    return bayer4(0.5 * a) * 0.25 + bayer4(a);
}

float interleavedGradientNoise(vec2 p) {
    return fract(52.9829189 * fract(0.06711056 * p.x + 0.00583715 * p.y));
}

// Rotates a vector by an angle - used to orient each gradient ellipse.
vec2 rotate2d(vec2 v, float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c) * v;
}

// The colour display behind the glass: five soft Gaussian ELLIPSES (the
// tutorial's flow-like mesh gradient) drifting on a deep navy field. Two
// dark-blue accents sit under three reds (brand red, deep crimson and a hot
// red accent), so the mix stays red-primary with dark blue as the secondary
// tone; every ellipse is rotated and anisotropically squashed, so the mix
// reads as flowing glass instead of round halos.
vec3 meshGradient(vec2 uv, vec2 warpNoise) {
    float t = time * gradientSpeed * 0.6 + 3.5;

    // Ellipse centres, each on its own slow trig orbit for an organic drift.
    vec2 p1 = vec2(-0.32 + sin(t * 0.5 + 1.8) * 0.20, -0.12 + cos(t * 0.8 + 0.3) * 0.16);
    vec2 p2 = vec2(0.10 + sin(t * 0.6 + 2.5) * 0.14, 0.24 + cos(t * 0.3 + 1.7) * 0.18);
    vec2 p3 = vec2(-0.15 + sin(t * 0.9 + 0.7) * 0.22, -0.08 + cos(t * 0.5 + 2.9) * 0.11);
    vec2 p4 = vec2(0.28 + sin(t * 0.4 + 3.1) * 0.17, 0.18 + cos(t * 0.6 + 0.9) * 0.20);
    vec2 p5 = vec2(-0.28 + sin(t * 0.7 + 4.2) * 0.13, -0.20 + cos(t * 0.9 + 1.5) * 0.15);

    // Domain warp: a large, slow noise field bends the shapes into glassy
    // streaks; the y offset is kept much smaller so the flow stays mostly
    // horizontal, like the tutorial.
    vec2 warpedUv = uv + vec2(warpNoise.x * warpStrength, warpNoise.y * warpStrength * 0.2);

    // Per-ellipse rotation; the x/y weights of each Gaussian then squash the
    // blob into an ellipse (a bigger weight = faster falloff that way).
    vec2 r1 = rotate2d(warpedUv - p1, 0.3);
    vec2 r2 = rotate2d(warpedUv - p2, -1.1);
    vec2 r3 = rotate2d(warpedUv - p3, 0.8);
    vec2 r4 = rotate2d(warpedUv - p4, -0.5);
    vec2 r5 = rotate2d(warpedUv - p5, 1.4);

    // The upper-left blue band is kept narrow in x so its tail does not spill
    // purple into the red centre; every other ellipse keeps the tutorial's
    // proportions.
    float e1 = r1.x * r1.x * 14.0 + r1.y * r1.y * 1.0;
    float e2 = r2.x * r2.x * 25.0 + r2.y * r2.y * 12.0;
    float e3 = r3.x * r3.x * 6.0 + r3.y * r3.y * 14.0;
    float e4 = r4.x * r4.x * 20.0 + r4.y * r4.y * 8.0;
    float e5 = r5.x * r5.x * 30.0 + r5.y * r5.y * 15.0;

    // Dark navy base + additive ellipses (the weights set how strongly each
    // colour enters the mix). The dark blues sit on the outer blobs (upper
    // left and bottom), the reds own the centre and right, and the reds are
    // kept deep (tiny green/blue fractions) so stacked overlaps stay red
    // instead of fading to pink.
    vec3 color = vec3(0.005, 0.010, 0.055);
    color += vec3(0.02, 0.04, 0.22) * exp(-e1) * 1.4;
    color += vec3(1.00, 0.10, 0.09) * exp(-e2) * 2.0;
    color += vec3(0.60, 0.03, 0.06) * exp(-e3) * 1.6;
    color += vec3(1.00, 0.15, 0.12) * exp(-e4) * 1.3;
    color += vec3(0.02, 0.05, 0.24) * exp(-e5) * 0.8;

    return color;
}

void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;

    // Flute space: screen coordinates in CSS pixels with the origin at the
    // centre - the space flute sizes are authored in, so the glass keeps its
    // physical rib width on any display.
    vec2 mappedCoords = gl_FragCoord.xy * viewport / resolution - viewport * 0.5;

    // Reeded glass: the flute layout can be tilted by ribRotation. The
    // screen is rotated into flute space, inside each flute the sampled x is
    // sheared left/right toward the flute's edges (a zoom-out refraction -
    // every rib shows a slightly wider view), and near the flute's right
    // edge a long tail of y offset (atanh falloff) smears the light into the
    // shiny glint that makes the flutes read as 3D glass. The result is
    // rotated back out before the pattern is sampled.
    float ribAngle = radians(ribRotation);
    float ribCos = cos(ribAngle);
    float ribSin = sin(ribAngle);
    mat2 toFluteSpace = mat2(ribCos, -ribSin, ribSin, ribCos);
    mat2 fromFluteSpace = mat2(ribCos, ribSin, -ribSin, ribCos);
    vec2 fluteSpace = toFluteSpace * mappedCoords;

    vec2 scaledCoords = fluteSpace / vec2(fluteWidth);
    float flutePhase = fract(scaledCoords.x);

    // The rib refraction ramps in one second behind the light reveal - the
    // ribs are flat at zero and reach the full fluteStrength after the
    // light is already rising - so the glass forms instead of snapping into
    // its finished shape. The mirrored reflection below reuses these terms,
    // so it deepens with them.
    float animatedFluteStrength = fluteStrength * introRefraction;
    float flutedX = animatedFluteStrength * (flutePhase - 0.5);
    // phase to the sixth as a multiply chain - cheaper than pow() and exact.
    float phaseSquared = flutePhase * flutePhase;
    float lensTail = min(phaseSquared * phaseSquared * phaseSquared, 0.995);
    float flutedY = -animatedFluteStrength * 0.5 * log((1.0 + lensTail) / (1.0 - lensTail));
    vec2 flutedCoords = fromFluteSpace * vec2(fluteSpace.x + flutedX, fluteSpace.y + flutedY);

    // The gradient's pattern space: ~1000 CSS px per unit (matching the
    // tutorial), sampled through the fluted coordinates.
    vec2 patternUv = flutedCoords / 1000.0;

    // Two drifting fbm cells (x and y wind - the tutorial's two noise-map
    // channels) act as the domain-warp field. The scales are low so the
    // field bends the gradient in broad, flowing curves.
    float warpTime = time * warpSpeed;
    vec2 warpNoise = vec2(
        fbm(vec2(uv.x * noiseScaleX, uv.y * noiseScaleY) + warpTime * 0.5),
        fbm(vec2(uv.x * noiseScaleX * 0.93, uv.y * noiseScaleY) - warpTime * 0.3)
    ) * 2.0 - 1.0;

    vec3 color = meshGradient(patternUv, warpNoise);

    // Glass light pass: the display is not just seen THROUGH the flutes -
    // the glass carries, leaks and reflects the light. Everything is scaled
    // by the light level passing through, so bright areas behave like real
    // glass while dark zones stay quiet.
    float lightLevel = min(max(color.r, max(color.g, color.b)), 2.0);
    float edgeDistance = min(flutePhase, 1.0 - flutePhase);

    // Edge glint: a razor highlight plus a tight core running along each
    // rib's refractive seam. The tint is the light's own colour (slightly
    // boosted), so glints read as saturated scarlet instead of pink-white.
    float glintRazor = exp(-edgeDistance * 160.0);
    float glintCore = exp(-edgeDistance * 60.0);
    vec3 glintTint = color * 1.2;
    color += glintTint * (glintRazor * 0.5 + glintCore) * edgeGlint * lightLevel;

    // Light leak: the light gathering at the rib seams seeps sideways through
    // the glass. A tight spill hugs every seam - stronger along the refractive
    // edge, where the shear piles the light up, than along the back edge - and
    // a wide halo reaches past the seam into the neighbouring ribs. Each rib
    // gets its own leak strength and the spill flickers slowly along the seam
    // like a caustic; the two sliders scale both, so 0 leaks uniformly and 1
    // gives the most variation.
    float seamRightSpill = exp(-(1.0 - flutePhase) * 10.0) * 0.50;
    float seamLeftSpill = exp(-flutePhase * 15.0) * 0.28;
    float seamHalo = exp(-edgeDistance * 3.4) * 0.15;

    float ribIndex = floor(scaledCoords.x);
    float ribVariation = 1.0 + (hash(vec2(ribIndex, 3.7)) - 0.5) * 2.0 * leakVariation;
    float leakStreak = 1.0 + (noise(vec2(fluteSpace.y * 0.014, time * 0.06 + ribIndex * 2.3)) - 0.5) * 2.0 * leakFlicker;

    color += color * (seamRightSpill + seamLeftSpill + seamHalo) * ribVariation * leakStreak * lightLeak;

    // Rib reflections: each flute gathers a faint mirrored copy of the
    // pattern around it (the shear flipped about the rib's centre), and
    // carries a soft specular sheen down its crest - like light reflecting
    // off polished rods.
    vec2 reflectedUv = fromFluteSpace * vec2(fluteSpace.x - flutedX, fluteSpace.y + flutedY) / 1000.0;
    vec3 reflected = meshGradient(reflectedUv, warpNoise);
    color += reflected * ribReflection * 0.35 * (0.35 + 0.65 * lightLevel);

    // pow() with a negative base (half this range) is undefined in GLSL ES
    // and can produce NaN on strict drivers; the explicit square is both
    // safe and cheaper than pow().
    float crestOffset = (flutePhase - 0.5) / 0.20;
    float crestSheen = exp(-crestOffset * crestOffset);
    color += color * 1.15 * crestSheen * ribReflection * 0.25 * lightLevel;

    // Exponential tone mapping compresses the overbright blob overlaps while
    // keeping the colours rich.
    color = 1.0 - exp(-color * exposure);

    // Pill pattern: the brand pill tile (rasterised from its SVG) repeats
    // through flute space with an extra 45-degree tilt, so the lattice
    // drifts against the ribs. The pills interact with the DARK areas only:
    // they glow faintly in the shadow zones carrying the local hue, while
    // the lit streaks and their glass highlights stay completely clean.
    // Runs after the tone map so the darkness test matches the perceived
    // frame - every shadow zone in the composition picks up the glow.
    vec2 pillSpace = rotate2d(fluteSpace, radians(45.0));
    vec2 pillUv = pillSpace / max(pillScale, 1.0);
    float pillMask = texture2D(pillPattern, pillUv).a;
    float pillBrightness = max(color.r, max(color.g, color.b));
    float pillDarkness = 1.0 - smoothstep(0.10, 0.45, pillBrightness);
    vec3 pillHue = color / max(pillBrightness, 0.001);
    color += pillHue * pillMask * pillStrength * pillDarkness * 0.30;

    // Framing (uv.y = 1 is the screen top edge, 0 the bottom edge): soften
    // the sides, dim the very top slightly behind the navbar, ease the light
    // down near the feature strip, and blend into the page colour at the very
    // bottom so the hero joins the next section seamlessly.
    float sideFade = smoothstep(0.0, 0.10, uv.x) * (1.0 - smoothstep(0.90, 1.0, uv.x));
    float topEdge = 1.0 - 0.45 * smoothstep(0.93, 1.0, uv.y);
    float bottomEase = mix(0.45, 1.0, smoothstep(0.0, 0.20, uv.y));
    float vignette = 1.0 - 0.25 * length((uv - vec2(0.5, 0.5)) * vec2(0.9, 1.1));
    color *= sideFade * topEdge * bottomEase * vignette;

    // Intro reveal: the hero opens pitch dark and the light rises to the
    // full look within the first few seconds (the JS render loop eases this
    // 0..1 value and pins it to 1 for frozen frames; the rib refraction
    // ramps on its own value, delayed behind this one). Applied before the
    // bottom blend so the page-colour seam stays seamless while dark.
    color *= introReveal;

    color = mix(color, vec3(0.039, 0.039, 0.039), 1.0 - smoothstep(0.0, 0.14, uv.y));

    // Dither: an optional screen-space pattern quantises the frame into
    // engraved-looking steps inside a brightness band - pick a pattern in
    // the panel (None leaves the glass smooth). The band is set by the
    // panel's two-handle range slider (ditherFadeStart .. ditherFadeEnd):
    // full black below the band and the lit streaks above it stay untouched,
    // with a short soft fade at each edge. ditherScale sets the pattern's
    // cell size in pixels.
    if (ditherMode > 0.5) {
        vec2 ditherCoord = gl_FragCoord.xy / max(ditherScale, 1.0);
        float ditherValue = hash(ditherCoord * 0.371 + vec2(7.7, 3.1));
        if (ditherMode < 1.5) {
            ditherValue = bayer4(ditherCoord);
        } else if (ditherMode < 2.5) {
            ditherValue = bayer8(ditherCoord);
        } else if (ditherMode < 3.5) {
            ditherValue = interleavedGradientNoise(ditherCoord);
        }
        float levels = max(ditherLevels, 2.0);
        vec3 ditheredColor = floor(color * levels + ditherValue) / levels;
        // Brightness band: the engraving lives only between the two range
        // handles (user: "i want just range 0.3 to 0.7 for example") - a
        // short soft fade at each edge keeps the band from aliasing; the
        // fade width shrinks with the band so the two smoothsteps can never
        // invert (GLSL leaves edge0 > edge1 undefined).
        float fadeEnd = max(ditherFadeEnd, ditherFadeStart + 0.02);
        float edgeSoftness = min(0.06, (fadeEnd - ditherFadeStart) * 0.5);
        float brightnessMax = max(color.r, max(color.g, color.b));
        float ditherMask = smoothstep(ditherFadeStart, ditherFadeStart + edgeSoftness, brightnessMax)
            * (1.0 - smoothstep(fadeEnd - edgeSoftness, fadeEnd, brightnessMax));
        color = mix(color, ditheredColor, clamp(ditherAmount, 0.0, 1.0) * ditherMask);
    }

    // Film grain: animated per-pixel noise modulated by brightness (the
    // tutorial's grain recipe) - strongest where the light is.
    float grain = hash(gl_FragCoord.xy + vec2(7.7, 3.1) * floor(time * 24.0)) - 0.5;
    color += grain * grainAmount * max(color.r, max(color.g, color.b));
    color = clamp(color, 0.0, 1.0);

    gl_FragColor = vec4(color, 1.0);
}
`;

// Every tunable value of the shader. The floating controls panel edits a
// copy of this object live, and a reset restores exactly these values.
export const defaultAuroraParams = {
    fluteWidth: 110,
    fluteStrength: 200,
    ribRotation: 49,
    edgeGlint: 1.0,
    lightLeak: 1.11,
    leakVariation: 1.0,
    leakFlicker: 0.55,
    pillStrength: 0.1,
    pillScale: 17,
    ribReflection: 0.5,
    gradientSpeed: 2.35,
    exposure: 0.6,
    noiseScaleX: 0.3,
    noiseScaleY: 0.55,
    warpStrength: 0.40,
    warpSpeed: 0.25,
    grainAmount: 0.2,
    ditherMode: 4,
    ditherAmount: 0.15,
    ditherFadeStart: 0,
    ditherFadeEnd: 0.73,
    ditherLevels: 12,
    ditherScale: 1,
};

// The render buffer is capped at this device-pixel-ratio: fragment cost
// grows with the square of the ratio, and the glass is soft enough that the
// detail beyond this is invisible.
const maximumRenderPixelRatio = 1.5;

/**
 * Aurora hero backdrop: a generative fractal glass gradient - five soft
 * Gaussian blobs in red with dark-blue accents drifting on a deep navy
 * field, bent into filaments by a domain warp, then seen through a reeded
 * (fluted) glass pane that shears each flute and smears a vertical glint
 * along its edge. A brightness-modulated film grain finishes it, the rib
 * layout can be tilted with ribRotation, and the finished frame can be run
 * through a selectable screen-space dither (Bayer 4x4/8x8, interleaved
 * gradient noise or random). Adapted from the "Fractal Glass Gradients"
 * tutorial (franky-adl) to this
 * project's plain WebGL1 setup: no textures and no render targets - the
 * warp noise is computed procedurally and the grain is an animated hash.
 * The glass never moves; only the gradient and its warp animate. One draw
 * call per frame, device pixel ratio capped at `maximumRenderPixelRatio`,
 * and no rendering at all while the canvas is scrolled out of view.
 *
 * `params` overrides any entry of `defaultAuroraParams` (the floating
 * controls panel drives these live), and `isPaused` freezes the shader clock
 * without losing animation position. `onFpsUpdate` receives the rounded
 * render rate about once per second (only when it changes) so the controls
 * panel can show an FPS readout. `disableAnimation` freezes the effect on
 * its t = 0 frame; the same freeze is applied automatically when the user
 * prefers reduced motion, so the backdrop stays decorative and calm for
 * everyone.
 */
const Aurora = ({ disableAnimation = false, isPaused = false, params = defaultAuroraParams, onFpsUpdate }) => {
    const canvasRef = useRef(null);

    // Latest slider values, pushed to the shader every frame; the ref keeps
    // the render loop stable (no effect restarts) while tuning.
    const paramsRef = useRef(params);
    useEffect(() => {
        paramsRef.current = params;
    }, [params]);

    // Latest FPS callback, kept in a ref so the render loop never restarts
    // when the parent re-renders with a new function identity.
    const onFpsUpdateRef = useRef(onFpsUpdate);
    useEffect(() => {
        onFpsUpdateRef.current = onFpsUpdate;
    }, [onFpsUpdate]);

    // Pause bookkeeping: the total paused wall-clock time is subtracted from
    // the shader clock, so pausing freezes exactly and resuming continues
    // from the same moment in the animation.
    const pauseTrackerRef = useRef({ paused: false, totalPausedMilliseconds: 0, pauseStartedAt: 0 });
    useEffect(() => {
        const tracker = pauseTrackerRef.current;
        if (isPaused && !tracker.paused) {
            tracker.paused = true;
            tracker.pauseStartedAt = Date.now();
        } else if (!isPaused && tracker.paused) {
            tracker.paused = false;
            tracker.totalPausedMilliseconds += Date.now() - tracker.pauseStartedAt;
        }
    }, [isPaused]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return undefined;

        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) {
            console.error('WebGL not supported');
            return undefined;
        }

        // Compile the two shaders and link the program.
        const createShader = (type, source) => {
            const shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.error('Shader compile error:', gl.getShaderInfoLog(shader));
                gl.deleteShader(shader);
                return null;
            }
            return shader;
        };

        const vertex = createShader(gl.VERTEX_SHADER, vertexShader);
        const fragment = createShader(gl.FRAGMENT_SHADER, fragmentShader);

        const program = gl.createProgram();
        gl.attachShader(program, vertex);
        gl.attachShader(program, fragment);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Program link error:', gl.getProgramInfoLog(program));
            return undefined;
        }

        gl.useProgram(program);

        // Fullscreen quad: two triangles as a triangle strip.
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1,
            1, -1,
            -1, 1,
            1, 1,
        ]), gl.STATIC_DRAW);

        const positionLocation = gl.getAttribLocation(program, 'position');
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        const resolutionLocation = gl.getUniformLocation(program, 'resolution');
        const viewportLocation = gl.getUniformLocation(program, 'viewport');
        const timeLocation = gl.getUniformLocation(program, 'time');
        const introRevealLocation = gl.getUniformLocation(program, 'introReveal');
        const introRefractionLocation = gl.getUniformLocation(program, 'introRefraction');

        // Resolve one uniform location per tunable value, so the render loop
        // can push the current slider values without any lookups.
        const paramUniforms = Object.keys(defaultAuroraParams).map((key) => ({
            key,
            location: gl.getUniformLocation(program, key),
        }));

        // Pill pattern texture: rasterised from the SVG tile so the shader can
        // repeat it. It starts as a 1x1 transparent texel (pattern invisible)
        // and swaps in the loaded tile; if the fetch ever fails the effect
        // simply runs without the pattern. 256x256 is power-of-two, so mipmaps
        // are allowed and the minified pattern stays clean.
        const pillPatternTexture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, pillPatternTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.uniform1i(gl.getUniformLocation(program, 'pillPattern'), 0);

        const pillImage = new Image();
        pillImage.onload = () => {
            const rasterSize = 256;
            const rasterCanvas = document.createElement('canvas');
            rasterCanvas.width = rasterSize;
            rasterCanvas.height = rasterSize;
            const rasterContext = rasterCanvas.getContext('2d');
            rasterContext.drawImage(pillImage, 0, 0, rasterSize, rasterSize);
            gl.bindTexture(gl.TEXTURE_2D, pillPatternTexture);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, rasterCanvas);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
            // Mipmaps only exist once the raster is uploaded - switching the
            // min filter earlier would leave the texture incomplete.
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        };
        pillImage.src = '/logos/pill_pattern_1x1.svg';

        // Size the drawing buffer to the canvas box. The buffer scale is
        // capped at maximumRenderPixelRatio: fragment cost grows with the
        // square of this number, and the glass is soft enough that the extra
        // detail of a 2x buffer is invisible.
        const handleResize = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, maximumRenderPixelRatio);
            canvas.width = Math.max(1, Math.round(canvas.clientWidth * dpr));
            canvas.height = Math.max(1, Math.round(canvas.clientHeight * dpr));
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
            gl.uniform2f(viewportLocation, canvas.clientWidth, canvas.clientHeight);
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        // Skip the draw while the canvas is scrolled out of view: the
        // full-screen fragment shader is the expensive part, and without
        // this it keeps running at full rate while the user reads the page
        // below. The rect check is one cheap layout read per frame and,
        // unlike an IntersectionObserver, behaves identically in every
        // visibility state (background tabs included - observers can defer
        // or misreport there); all animation is wall-clock based, so the
        // effect resumes in the right place when the hero scrolls back in.
        const isCanvasOnScreen = () => {
            const rect = canvas.getBoundingClientRect();
            const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
            const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
            return rect.bottom > 0 && rect.top < viewportHeight && rect.right > 0 && rect.left < viewportWidth;
        };

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const isFrozen = disableAnimation || prefersReducedMotion;
        const startTime = Date.now();
        let animationFrameId = null;

        // Seconds each opening reveal takes to rise from zero to full
        // strength, and how much later the rib refraction starts compared
        // with the light; frozen frames skip both entirely.
        const introRevealDurationSeconds = 3;
        const introRefractionDelaySeconds = 0.5;

        // FPS sampling: count drawn frames, report the rounded rate once per
        // second, and skip unchanged values so the parent rarely re-renders.
        let fpsFrameCount = 0;
        let fpsWindowStart = performance.now();
        let lastReportedFps = null;

        const render = () => {
            const tracker = pauseTrackerRef.current;
            const pausedMilliseconds = tracker.totalPausedMilliseconds
                + (tracker.paused ? Date.now() - tracker.pauseStartedAt : 0);
            const elapsedSeconds = isFrozen ? 0 : (Date.now() - startTime - pausedMilliseconds) / 1000;
            gl.uniform1f(timeLocation, elapsedSeconds);

            // Intro reveal: smoothstep-eased from zero to the full look
            // across the first few seconds of the first visit (gentle start
            // and settle, so the whole reveal stays visibly in motion); the
            // rib refraction follows the light with a one-second delay, so
            // the flat gradient appears first and the ribs form after it.
            // Frozen frames (reduced motion / disableAnimation) show the
            // full look immediately, and pausing freezes both reveals where
            // they are.
            const revealProgress = Math.min(elapsedSeconds / introRevealDurationSeconds, 1);
            const refractionProgress = Math.min(Math.max((elapsedSeconds - introRefractionDelaySeconds) / introRevealDurationSeconds, 0), 1);
            const easedReveal = isFrozen ? 1 : revealProgress * revealProgress * (3 - 2 * revealProgress);
            const easedRefraction = isFrozen ? 1 : refractionProgress * refractionProgress * (3 - 2 * refractionProgress);
            gl.uniform1f(introRevealLocation, easedReveal);
            gl.uniform1f(introRefractionLocation, easedRefraction);

            const currentParams = paramsRef.current;
            paramUniforms.forEach(({ key, location }) => {
                // Fall back to the defaults: a hot-reload can leave the
                // parent's state without a newly added key, and pushing
                // undefined would poison the shader with NaN.
                gl.uniform1f(location, currentParams[key] ?? defaultAuroraParams[key]);
            });

            // Draw only while the canvas is on screen (see isCanvasOnScreen
            // above); while skipped, the FPS window restarts so the readout
            // never reports the idle rate.
            const frameTime = performance.now();
            if (isCanvasOnScreen()) {
                gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
                fpsFrameCount += 1;
            } else {
                fpsFrameCount = 0;
                fpsWindowStart = frameTime;
            }

            const fpsWindowMilliseconds = frameTime - fpsWindowStart;
            if (fpsWindowMilliseconds >= 1000) {
                const measuredFps = Math.round((fpsFrameCount * 1000) / fpsWindowMilliseconds);
                if (measuredFps !== lastReportedFps) {
                    lastReportedFps = measuredFps;
                    if (onFpsUpdateRef.current) {
                        onFpsUpdateRef.current(measuredFps);
                    }
                }
                fpsFrameCount = 0;
                fpsWindowStart = frameTime;
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', handleResize);
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            pillImage.onload = null;
            gl.deleteTexture(pillPatternTexture);
            gl.deleteProgram(program);
            gl.deleteShader(vertex);
            gl.deleteShader(fragment);
            gl.deleteBuffer(positionBuffer);
        };
    }, [disableAnimation]);

    return (
        <canvas
            ref={canvasRef}
            aria-hidden="true"
            style={{
                width: '100%',
                height: '100%',
                display: 'block',
            }}
        />
    );
};

export default Aurora;
