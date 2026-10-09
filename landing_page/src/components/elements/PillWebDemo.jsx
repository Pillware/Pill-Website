import { useEffect, useRef } from 'react';
import init, * as pill from '../../pill_demo/pill_web_app.js';

const MAX_DPR = 1.5;
const PRELOAD_MARGIN = '600px 0px';

// Module-level promise = exactly one WASM initialization,
// including React StrictMode development remounts.
let pillInitPromise = null;

function initPillOnce() {
    if (!pillInitPromise) {
        pillInitPromise = init().catch((error) => {
            // If initialization genuinely failed, allow a later retry.
            pillInitPromise = null;
            throw error;
        });
    }

    return pillInitPromise;
}

export default function PillWebDemo({
    onReady,
    onStats,
    onError,
}) {
    const containerRef = useRef(null);
    const canvasRef = useRef(null);

    const startedRef = useRef(false);
    const readyRef = useRef(false);

    // Keep current callbacks without rebuilding the whole lifecycle effect.
    const onReadyRef = useRef(onReady);
    const onStatsRef = useRef(onStats);
    const onErrorRef = useRef(onError);

    useEffect(() => {
        onReadyRef.current = onReady;
        onStatsRef.current = onStats;
        onErrorRef.current = onError;
    }, [onReady, onStats, onError]);

    useEffect(() => {
        const container = containerRef.current;
        const canvas = canvasRef.current;

        if (!container || !canvas) {
            return undefined;
        }

        let cancelled = false;

        let resizeRaf1 = null;
        let resizeRaf2 = null;
        let statsTimer = null;

        /*
         * Resize canvas backing store.
         *
         * Important:
         * - CSS controls the visible size.
         * - canvas.width/height control the WebGPU backing resolution.
         * - only mutate dimensions when they actually changed.
         */
        const resize = () => {
            const rect = container.getBoundingClientRect();

            if (
                rect.width <= 0 ||
                rect.height <= 0
            ) {
                return;
            }

            const dpr = Math.min(
                window.devicePixelRatio || 1,
                MAX_DPR,
            );

            const width = Math.max(
                1,
                Math.round(rect.width * dpr),
            );

            const height = Math.max(
                1,
                Math.round(rect.height * dpr),
            );

            if (
                canvas.width === width &&
                canvas.height === height
            ) {
                return;
            }

            /*
             * Updating either backing-store dimension clears the canvas.
             *
             * Do both together only when required. Winit/WebGPU should then
             * receive the resulting resize and reconfigure its surface.
             */
            canvas.width = width;
            canvas.height = height;
        };

        /*
         * Zoom/layout changes can happen over multiple browser layout passes.
         *
         * Waiting two animation frames makes browser zoom substantially less
         * prone to giving us an intermediate/fractional layout size.
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

        /*
         * Make sure the canvas has real non-zero dimensions BEFORE Winit
         * creates its Window/WebGPU surface.
         */
        resize();

        /*
         * ResizeObserver handles actual layout/container changes.
         *
         * Observe the container, NOT the canvas whose backing dimensions
         * we're mutating.
         */
        const resizeObserver =
            new ResizeObserver(queueResize);

        resizeObserver.observe(container);

        /*
         * Browser zoom generally emits window.resize, even when the DOM box
         * itself doesn't change in the way ResizeObserver expects.
         */
        window.addEventListener(
            'resize',
            queueResize,
            { passive: true },
        );

        /*
         * visualViewport gives us another reliable signal for browser zoom,
         * mobile viewport changes and UI/chrome resizing.
         */
        window.visualViewport?.addEventListener(
            'resize',
            queueResize,
            { passive: true },
        );

        /*
         * Lazy initialization only.
         *
         * This is what prevents Pill from loading at all if the visitor never
         * approaches the Performance section.
         *
         * Do NOT use this observer to pause/resume the Winit loop.
         */
        const preloadObserver =
            new IntersectionObserver(
                async ([entry]) => {
                    if (
                        !entry.isIntersecting ||
                        startedRef.current
                    ) {
                        return;
                    }

                    startedRef.current = true;

                    /*
                     * Stop observing immediately.
                     *
                     * Pill only initializes once, so there is no reason for
                     * IntersectionObserver to keep doing work after this.
                     */
                    preloadObserver.disconnect();

                    /*
                     * Get the freshest dimensions just before Winit/WebGPU
                     * creates its surface.
                     */
                    resize();

                    try {
                        await initPillOnce();

                        if (cancelled) {
                            return;
                        }

                        readyRef.current = true;

                        /*
                         * A resize after initialization is useful because
                         * initialization itself can take long enough for the
                         * browser layout/DPR to have changed.
                         */
                        queueResize();

                        onReadyRef.current?.();

                        /*
                         * React does not need per-frame statistics.
                         *
                         * 2 Hz is enough visually and avoids unnecessary
                         * React rendering / JS↔WASM traffic.
                         */
                        statsTimer =
                            window.setInterval(() => {
                                if (
                                    cancelled ||
                                    !readyRef.current
                                ) {
                                    return;
                                }

                                onStatsRef.current?.({
                                    fps:
                                        pill.get_fps?.() ??
                                        null,

                                    pillCount:
                                        pill.get_num_pills?.() ??
                                        null,

                                    frameTimeMs:
                                        pill.get_frame_time_ms?.() ??
                                        null,
                                });
                            }, 500);
                    } catch (error) {
                        console.error(
                            'Failed to initialize Pill demo:',
                            error,
                        );

                        onErrorRef.current?.(error);
                    }
                },
                {
                    root: null,

                    /*
                     * Start WASM/WebGPU shortly before the user actually sees
                     * the Performance section.
                     */
                    rootMargin: PRELOAD_MARGIN,

                    /*
                     * Any intersection with the enlarged root is enough.
                     *
                     * We only use this to trigger initialization once, so
                     * threshold maths cannot affect playback afterwards.
                     */
                    threshold: 0,
                },
            );

        preloadObserver.observe(container);

        /*
         * Tab visibility is intentionally NOT wired to pill.set_active()
         * here yet.
         *
         * Browsers already throttle background requestAnimationFrame work.
         *
         * Once pill_web::set_active(true) explicitly wakes Winit /
         * request_redraw(), it is safe to add pause/resume here.
         */
        return () => {
            cancelled = true;

            preloadObserver.disconnect();
            resizeObserver.disconnect();

            window.removeEventListener(
                'resize',
                queueResize,
            );

            window.visualViewport?.removeEventListener(
                'resize',
                queueResize,
            );

            if (resizeRaf1 !== null) {
                cancelAnimationFrame(resizeRaf1);
            }

            if (resizeRaf2 !== null) {
                cancelAnimationFrame(resizeRaf2);
            }

            if (statsTimer !== null) {
                clearInterval(statsTimer);
            }

            /*
             * Do NOT call set_active(false) here.
             *
             * React StrictMode runs effect cleanup during development,
             * and an inactive Winit loop may then never receive another event
             * to wake itself back up.
             */
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="relative h-full w-full overflow-hidden"
        >
            <canvas
                id="canvas"
                ref={canvasRef}
                tabIndex={-1}
                className="
                    absolute
                    inset-0
                    block
                    h-full
                    w-full
                    pointer-events-none
                "
            />
        </div>
    );
}
