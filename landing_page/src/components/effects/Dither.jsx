/* eslint-disable react/no-unknown-property */
import { useRef, useEffect, useState } from 'react';

const vertexShader = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragmentShader = `
precision highp float;
uniform vec2 resolution;
uniform float time;
uniform float waveSpeed;
uniform float waveFrequency;
uniform float waveAmplitude;
uniform vec3 waveColor;
uniform vec2 mousePos;
uniform int enableMouseInteraction;
uniform float mouseRadius;
uniform float colorNum;
uniform int isDarkTheme;
uniform sampler2D patternTexture;
uniform vec2 textureSize;
uniform float patternScale;

// --- Noise functions ---
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
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
    float amp = 0.5;
    float freq = 1.0;
    for (int i = 0; i < 3; i++) {
        value += amp * noise(p * freq);
        freq *= 2.0;
        amp *= 0.5;
    }
    return value;
}

void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    float t = time;

    // --- Animated grain - faster, more alive ---
    float grain = hash(uv + t * 0.3 + sin(uv.y * 50.0 + t) * 0.02) * 0.05;

    // --- Noise field with drifting motion ---
    float n = fbm(uv * 3.0 + vec2(t * 0.08, t * 0.05)) * waveAmplitude * 0.45;
    float n2 = fbm(uv * 5.5 + vec2(-t * 0.06, t * 0.07) + n) * 0.15;

    // --- Drifting orbs ---
    // Brand red orb - slowly orbits
    vec2 orb1Center = vec2(0.75 + sin(t * 0.15) * 0.06, 0.35 + cos(t * 0.18) * 0.05);
    vec2 orb1 = uv - orb1Center;
    float glow1 = exp(-length(orb1) * 2.5) * (0.10 + sin(t * 0.4) * 0.08);
    vec3 orbColor1 = vec3(1.0, 0.39, 0.39);

    // Blue orb - slowly orbits opposite direction
    vec2 orb2Center = vec2(0.22 + cos(t * 0.13) * 0.05, 0.75 + sin(t * 0.16) * 0.06);
    vec2 orb2 = uv - orb2Center;
    float glow2 = exp(-length(orb2) * 3.0) * (0.07 + cos(t * 0.35) * 0.09);
    vec3 orbColor2 = vec3(0.25, 0.45, 0.9);

    // Warm center glow - gently pulsing
    vec2 center = uv - vec2(0.5 + sin(t * 0.1) * 0.03, 0.45 + cos(t * 0.12) * 0.02);
    float glowCenter = exp(-length(center) * 4.0) * (0.04 + sin(t * 0.5) * 0.015);

    // --- Floating specks ---
    float specks = 0.0;
    for (int i = 0; i < 6; i++) {
        float fi = float(i);
        vec2 speckPos = vec2(
            sin(t * (0.3 + fi * 0.03) + fi) * 0.45 + 0.5,
            cos(t * (0.22 + fi * 0.04) + fi * 2.0) * 0.45 + 0.5
        );
        float dist = length(uv - speckPos);
        float speckGlow = exp(-dist * 40.0) * (0.02 + sin(t * 1.5 + fi) * 0.01);
        specks += speckGlow;
    }

    // --- Compose ---
    float base = n + n2 + grain;
    vec3 col = vec3(0.0);

    col += orbColor1 * glow1;
    col += orbColor2 * glow2;
    col += vec3(1.0, 0.7, 0.5) * glowCenter;
    col += vec3(1.0, 0.9, 0.8) * specks * 0.6;
    col += base * 0.055;

    // Subtle vignette
    float vignette = 1.0 - length(uv - 0.5) * 0.4;
    col *= vignette;

    // --- Pill pattern mask ---
    // gl_FragCoord is in device pixels while the drawing buffer is DPR-scaled,
    // so the tile is multiplied by patternScale (= DPR) to keep the pattern at
    // a constant size in CSS pixels on every screen (otherwise high-DPI phones
    // render it DPR times smaller than desktop).
    vec2 tileSize = textureSize * patternScale;
    vec2 patternUV = mod(gl_FragCoord.xy, tileSize) / tileSize;
    float patternMask = texture2D(patternTexture, patternUV).r;
    float pillMask = 1.0 - patternMask * 0.25;
    col *= pillMask;

    col = clamp(col, 0.0, 1.0);

    gl_FragColor = vec4(col, 1.0);
}
`;


function useWebGLShader(canvasRef, {
    waveSpeed,
    waveFrequency,
    waveAmplitude,
    waveColor,
    colorNum,
    disableAnimation,
    enableMouseInteraction,
    mouseRadius
}) {
    const [isDark, setIsDark] = useState(true);
    const glRef = useRef(null);
    const programRef = useRef(null);
    const uniformsRef = useRef({});
    const mouseRef = useRef({ x: 0, y: 0 });
    const startTimeRef = useRef(Date.now());
    const rafRef = useRef(null);
    const textureRef = useRef(null);
    const textureSizeRef = useRef({ width: 14, height: 14 });

    useEffect(() => {
        const checkTheme = () => {
            setIsDark(document.documentElement.classList.contains('dark'));
        };
        checkTheme();
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) {
            console.error('WebGL not supported');
            return;
        }
        glRef.current = gl;

        // Compile shaders
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

        const vs = createShader(gl.VERTEX_SHADER, vertexShader);
        const fs = createShader(gl.FRAGMENT_SHADER, fragmentShader);

        const program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Program link error:', gl.getProgramInfoLog(program));
            return;
        }

        programRef.current = program;
        gl.useProgram(program);

        // Setup geometry (fullscreen quad)
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1,
            1, -1,
            -1, 1,
            1, 1
        ]), gl.STATIC_DRAW);

        const positionLoc = gl.getAttribLocation(program, 'position');
        gl.enableVertexAttribArray(positionLoc);
        gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

        // Get uniform locations
        uniformsRef.current = {
            resolution: gl.getUniformLocation(program, 'resolution'),
            time: gl.getUniformLocation(program, 'time'),
            waveSpeed: gl.getUniformLocation(program, 'waveSpeed'),
            waveFrequency: gl.getUniformLocation(program, 'waveFrequency'),
            waveAmplitude: gl.getUniformLocation(program, 'waveAmplitude'),
            waveColor: gl.getUniformLocation(program, 'waveColor'),
            mousePos: gl.getUniformLocation(program, 'mousePos'),
            enableMouseInteraction: gl.getUniformLocation(program, 'enableMouseInteraction'),
            mouseRadius: gl.getUniformLocation(program, 'mouseRadius'),
            colorNum: gl.getUniformLocation(program, 'colorNum'),
            isDarkTheme: gl.getUniformLocation(program, 'isDarkTheme'),
            patternTexture: gl.getUniformLocation(program, 'patternTexture'),
            textureSize: gl.getUniformLocation(program, 'textureSize'),
            patternScale: gl.getUniformLocation(program, 'patternScale')
        };

        // Load pattern texture
        const texture = gl.createTexture();
        textureRef.current = texture;
        gl.bindTexture(gl.TEXTURE_2D, texture);

        // Set texture parameters
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        // Load the brand pill tile - the same SVG asset the Aurora hero
        // shader uses. The SVG is rasterised once through a 2D canvas at
        // its natural 16x16 size (the path Aurora also takes) because
        // direct SVG-to-texture uploads are inconsistent across browsers.
        // Its transparent background reads as black in the red channel,
        // so the mask maths and polarity match the old PNG exactly.
        const image = new Image();
        image.onload = () => {
            const rasterWidth = image.naturalWidth || 16;
            const rasterHeight = image.naturalHeight || 16;
            const rasterCanvas = document.createElement('canvas');
            rasterCanvas.width = rasterWidth;
            rasterCanvas.height = rasterHeight;
            rasterCanvas.getContext('2d').drawImage(image, 0, 0, rasterWidth, rasterHeight);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, rasterCanvas);
            textureSizeRef.current = { width: rasterWidth, height: rasterHeight };
        };
        image.src = '/logos/pill_pattern_1x1.svg';

        // Handle resize
        const handleResize = () => {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = canvas.clientWidth * dpr;
            canvas.height = canvas.clientHeight * dpr;
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.uniform2f(uniformsRef.current.resolution, canvas.width, canvas.height);
            // Keep the pill pattern tiled at a constant CSS-pixel size (see shader).
            gl.uniform1f(uniformsRef.current.patternScale, dpr);
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        // Handle mouse
        const handleMouseMove = (e) => {
            if (!enableMouseInteraction) return;
            const rect = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            mouseRef.current.x = (e.clientX - rect.left) * dpr;
            mouseRef.current.y = (e.clientY - rect.top) * dpr;
        };

        canvas.addEventListener('mousemove', handleMouseMove);

        // Render loop
        const render = () => {
            const gl = glRef.current;
            const program = programRef.current;
            const uniforms = uniformsRef.current;

            if (!gl || !program) return;

            gl.useProgram(program);

            // Update uniforms
            const currentTime = disableAnimation ? 0 : (Date.now() - startTimeRef.current) / 1000;
            gl.uniform1f(uniforms.time, currentTime);
            gl.uniform1f(uniforms.waveSpeed, waveSpeed);
            gl.uniform1f(uniforms.waveFrequency, waveFrequency);
            gl.uniform1f(uniforms.waveAmplitude, waveAmplitude);
            gl.uniform3f(uniforms.waveColor, waveColor[0], waveColor[1], waveColor[2]);
            gl.uniform2f(uniforms.mousePos, mouseRef.current.x, mouseRef.current.y);
            gl.uniform1i(uniforms.enableMouseInteraction, enableMouseInteraction ? 1 : 0);
            gl.uniform1f(uniforms.mouseRadius, mouseRadius);
            gl.uniform1f(uniforms.colorNum, colorNum);
            gl.uniform1i(uniforms.isDarkTheme, isDark ? 1 : 0);

            // Set texture uniforms
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, textureRef.current);
            gl.uniform1i(uniforms.patternTexture, 0);
            gl.uniform2f(uniforms.textureSize, textureSizeRef.current.width, textureSizeRef.current.height);

            // Draw
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

            rafRef.current = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', handleResize);
            canvas.removeEventListener('mousemove', handleMouseMove);
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
            if (gl && program) {
                gl.deleteProgram(program);
            }
            if (gl && textureRef.current) {
                gl.deleteTexture(textureRef.current);
            }
        };
    }, [waveSpeed, waveFrequency, waveAmplitude, waveColor, colorNum, disableAnimation, enableMouseInteraction, mouseRadius, isDark]);
}

export default function Dither({
    waveSpeed = 0.05,
    waveFrequency = 3,
    waveAmplitude = 0.3,
    waveColor = [0.5, 0.5, 0.5],
    colorNum = 4,
    disableAnimation = false,
    enableMouseInteraction = true,
    mouseRadius = 1
}) {
    const canvasRef = useRef(null);

    useWebGLShader(canvasRef, {
        waveSpeed,
        waveFrequency,
        waveAmplitude,
        waveColor,
        colorNum,
        disableAnimation,
        enableMouseInteraction,
        mouseRadius
    });

    return (
        <canvas
            ref={canvasRef}
            className="dither-container"
            style={{
                width: '100%',
                height: '100%',
                display: 'block'
            }}
        />
    );
}
