import { useEffect, useRef } from 'react';
import init, * as pill from '../../pill_demo/pill_web_app.js';

const MAX_DPR = 1.5;

// Module-level promise = one WASM initialization even with React StrictMode.
let pillInitPromise = null;

function initPillOnce() {
    if (!pillInitPromise) {
        pillInitPromise = init().catch((error) => {
            // Allow retry if initialization genuinely failed.
            pillInitPromise = null;
            throw error;
        });
    }

    return pillInitPromise;
}

export default function PillDemo({
    onReady,
    onStats,
    onError,
}) {
    const containerRef = useRef(null);
    const canvasRef = useRef(null);

    const startedRef = useRef(false);
    const readyRef = useRef(false);
    const visibleRef = useRef(false);

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
            return;
        }

        let cancelled = false;
        let resizeRaf = null;
        let statsTimer = null;

        const resize = () => {
            const rect = container.getBoundingClientRect();

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

            if (canvas.width !== width) {
                canvas.width = width;
            }

            if (canvas.height !== height) {
                canvas.height = height;
            }
        };

        const queueResize = () => {
            if (resizeRaf !== null) {
                cancelAnimationFrame(resizeRaf);
            }

            resizeRaf = requestAnimationFrame(() => {
                resizeRaf = null;
                resize();
            });
        };

        // Give Winit/WebGPU a valid canvas size before initialization.
        resize();

        // Observe the CONTAINER, not the canvas we're resizing.
        const resizeObserver = new ResizeObserver(queueResize);
        resizeObserver.observe(container);

        /*
         * Lazy initialization.
         *
         * Start loading Pill when the demo is getting close to the viewport,
         * so WebAssembly/WebGPU initialization happens before the user sees it.
         */
        const preloadObserver = new IntersectionObserver(
            async ([entry]) => {
                if (
                    !entry.isIntersecting ||
                    startedRef.current
                ) {
                    return;
                }

                startedRef.current = true;

                // Ensure correct dimensions immediately before WebGPU starts.
                resize();

                try {
                    await initPillOnce();

                    if (cancelled) {
                        return;
                    }

                    readyRef.current = true;
                    onReadyRef.current?.();

                    /*
                     * UI statistics do not need updating every frame.
                     * Twice per second is plenty.
                     */
                    statsTimer = window.setInterval(() => {
                        if (
                            !visibleRef.current ||
                            !readyRef.current
                        ) {
                            return;
                        }

                        onStatsRef.current?.({
                            fps: pill.get_fps?.() ?? null,
                            pillCount:
                                pill.get_num_pills?.() ?? null,
                            frameTimeMs:
                                pill.get_frame_time_ms?.() ?? null,
                        });
                    }, 500);

                    // The demo may already have entered the viewport while
                    // WASM was initializing.
                    pill.set_active?.(
                        visibleRef.current &&
                        !document.hidden,
                    );
                } catch (error) {
                    console.error(
                        'Failed to initialize Pill demo:',
                        error,
                    );

                    onErrorRef.current?.(error);
                }
            },
            {
                rootMargin: '500px 0px',
                threshold: 0,
            },
        );

        preloadObserver.observe(container);

        /*
         * Actual rendering visibility.
         *
         * Different from preloadObserver:
         * - preload at 500 px away
         * - render only while actually visible
         */
        const visibilityObserver = new IntersectionObserver(
            ([entry]) => {
                visibleRef.current = entry.isIntersecting;

                if (readyRef.current) {
                    pill.set_active?.(
                        entry.isIntersecting &&
                        !document.hidden,
                    );
                }
            },
            {
                threshold: 0.05,
            },
        );

        visibilityObserver.observe(container);

        const handleVisibilityChange = () => {
            if (!readyRef.current) {
                return;
            }

            pill.set_active?.(
                visibleRef.current &&
                !document.hidden,
            );
        };

        document.addEventListener(
            'visibilitychange',
            handleVisibilityChange,
        );

        return () => {
            cancelled = true;

            resizeObserver.disconnect();
            preloadObserver.disconnect();
            visibilityObserver.disconnect();

            document.removeEventListener(
                'visibilitychange',
                handleVisibilityChange,
            );

            if (resizeRaf !== null) {
                cancelAnimationFrame(resizeRaf);
            }

            if (statsTimer !== null) {
                clearInterval(statsTimer);
            }

            /*
             * Don't try to destroy/reinitialize the Winit event loop.
             * Just stop rendering.
             */
            if (readyRef.current) {
                pill.set_active?.(false);
            }
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
                className="absolute inset-0 block h-full w-full pointer-events-none"
            />
        </div>
    );
}
