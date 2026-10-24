import { useCallback, useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import init from '../demos/wavey/pill_web_app.js';

// One WASM initialization per page load, shared across React StrictMode remounts. A failed boot
// clears the promise so a later mount can retry.
let waveyInitPromise = null;

// Canvas the engine booted into. The winit loop binds to that element and cannot be moved, so
// returning to this route after leaving it needs a fresh document.
let bootedCanvas = null;

function initWaveyOnce() {
    if (!waveyInitPromise) {
        waveyInitPromise = init().catch((error) => {
            waveyInitPromise = null;
            throw error;
        });
    }

    return waveyInitPromise;
}

/*
 * WebGPU gate.
 *
 * Without this check a missing API or adapter still lets init() resolve: the canvas stays an empty
 * box and the failure only surfaces as an uncaught error inside the wasm glue, where nothing can
 * report it to the visitor.
 */
async function probeWebGpuAvailability() {
    if (!navigator.gpu) {
        return 'no-webgpu-api';
    }

    try {
        const adapter = await navigator.gpu.requestAdapter();

        return adapter ? null : 'no-webgpu-adapter';
    } catch {
        return 'no-webgpu-adapter';
    }
}

const WaveyDemo = () => {
    const viewportRef = useRef(null);
    const canvasRef = useRef(null);

    // 'loading' | 'running' | 'unsupported' | 'failed'
    const [status, setStatus] = useState('loading');
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const viewport = viewportRef.current;
        const canvas = canvasRef.current;

        if (!viewport || !canvas) {
            return undefined;
        }

        /*
         * The engine focuses the canvas when it boots so keyboard input works without a click, but
         * a plain focus() also scrolls the canvas into view - shadowing it to always pass
         * preventScroll keeps the keyboard behaviour while the page stays put.
         */
        canvas.focus = () => HTMLElement.prototype.focus.call(canvas, { preventScroll: true });

        let cancelled = false;
        let resizeRaf1 = null;
        let resizeRaf2 = null;

        /*
         * CSS controls the visible size, canvas.width/height control the WebGPU backing resolution.
         *
         * The backing store must match the canvas's device-pixel content box (CSS size times
         * devicePixelRatio): winit's web backend observes exactly that box and sizes the renderer's
         * frame for it, so capping the ratio makes phones render cropped.
         */
        const resize = () => {
            const rect = viewport.getBoundingClientRect();

            if (rect.width <= 0 || rect.height <= 0) {
                return;
            }

            const dpr = window.devicePixelRatio || 1;

            const width = Math.max(1, Math.round(rect.width * dpr));
            const height = Math.max(1, Math.round(rect.height * dpr));

            if (canvas.width === width && canvas.height === height) {
                return;
            }

            canvas.width = width;
            canvas.height = height;
        };

        /*
         * Zoom/layout changes can happen over multiple browser layout passes; waiting two animation
         * frames makes browser zoom much less prone to handing us an intermediate size.
         */
        const queueResize = () => {
            if (resizeRaf1 !== null) {
                cancelAnimationFrame(resizeRaf1);
            }

            if (resizeRaf2 !== null) {
                cancelAnimationFrame(resizeRaf2);
            }

            resizeRaf1 = requestAnimationFrame(() => {
                resizeRaf1 = null;

                resizeRaf2 = requestAnimationFrame(() => {
                    resizeRaf2 = null;
                    resize();
                });
            });
        };

        // The canvas needs real non-zero dimensions before winit creates its window/surface.
        resize();

        // Observe the container, not the canvas whose backing dimensions we mutate.
        const resizeObserver = new ResizeObserver(queueResize);
        resizeObserver.observe(viewport);

        window.addEventListener('resize', queueResize, { passive: true });
        window.visualViewport?.addEventListener('resize', queueResize, { passive: true });

        (async () => {
            const unavailableReason = await probeWebGpuAvailability();

            if (cancelled) {
                return;
            }

            if (unavailableReason) {
                setStatus('unsupported');
                return;
            }

            // The engine is already running on a canvas this mount does not own (the visitor left
            // the route and came back): only a reload can boot it again.
            if (bootedCanvas && bootedCanvas !== canvas) {
                window.location.reload();
                return;
            }

            // Freshest dimensions right before winit/WebGPU creates its surface.
            resize();

            try {
                bootedCanvas = canvas;
                await initWaveyOnce();

                if (cancelled) {
                    return;
                }

                setStatus('running');
                queueResize();
            } catch (error) {
                console.error('Failed to start the Wavey demo:', error);

                if (!cancelled) {
                    setStatus('failed');
                }
            }
        })();

        return () => {
            cancelled = true;

            resizeObserver.disconnect();

            window.removeEventListener('resize', queueResize);
            window.visualViewport?.removeEventListener('resize', queueResize);

            if (resizeRaf1 !== null) {
                cancelAnimationFrame(resizeRaf1);
            }

            if (resizeRaf2 !== null) {
                cancelAnimationFrame(resizeRaf2);
            }
        };
    }, []);

    const toggleFullscreen = useCallback(async () => {
        try {
            if (document.fullscreenElement) {
                await document.exitFullscreen();
            } else {
                await viewportRef.current?.requestFullscreen();
            }
        } catch (error) {
            console.error('Fullscreen request failed:', error);
        }
    }, []);

    useEffect(() => {
        const handleFullscreenChange = () => setIsFullscreen(document.fullscreenElement === viewportRef.current);

        document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    return (
        <div className="flex h-dvh w-full flex-col bg-[#0A0A0A] text-white">
            {/* The game viewport: fills everything above the "made with pill" line. */}
            <div ref={viewportRef} className="relative min-h-0 flex-1 overflow-hidden bg-black">
                <canvas
                    id="canvas"
                    ref={canvasRef}
                    tabIndex={-1}
                    className="pill-canvas absolute inset-0"
                />

                <button
                    type="button"
                    onClick={toggleFullscreen}
                    aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                    title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                    className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-black/50 text-white/70 backdrop-blur-sm transition-colors hover:bg-black/70 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                >
                    {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>

                {status !== 'running' && (
                    <div className="pointer-events-none absolute inset-0 grid place-items-center px-6 text-center">
                        {status === 'loading' && (
                            <p className="text-sm text-white/40">Loading demo…</p>
                        )}
                        {status === 'unsupported' && (
                            <p className="max-w-md text-sm text-white/60">
                                This demo needs WebGPU. Try a recent version of Chrome, Edge or
                                another Chromium-based browser.
                            </p>
                        )}
                        {status === 'failed' && (
                            <p className="max-w-md text-sm text-white/60">
                                The demo failed to start. Reload the page to try again.
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Attribution strip under the viewport. */}
            <div className="flex shrink-0 items-center justify-center py-4">
                <a
                    href="/"
                    className="group flex items-center gap-2 text-xs font-medium tracking-[0.14em] text-white/40 transition-colors hover:text-white/80"
                >
                    <img
                        src="/logos/pill_icon_white.svg"
                        alt=""
                        className="h-4 w-4 opacity-60 transition-opacity group-hover:opacity-100"
                    />
                    made with pill
                </a>
            </div>
        </div>
    );
};

export default WaveyDemo;
