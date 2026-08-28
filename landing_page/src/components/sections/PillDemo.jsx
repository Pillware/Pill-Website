import { useEffect, useRef, useState } from 'react';
import init, * as pill from '../../pill_demo/pill_web_app.js';

export default function PillDemo() {
    const canvasRef = useRef(null);

    const [value, setValue] = useState(0.5);
    const [fps, setFps] = useState(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const resize = () => {
            const rect = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;

            canvas.width = Math.max(
                1,
                Math.floor(rect.width * dpr),
            );

            canvas.height = Math.max(
                1,
                Math.floor(rect.height * dpr),
            );
        };

        resize();

        const observer = new ResizeObserver(resize);
        observer.observe(canvas);

        let timer;

        async function boot() {
            await init();

            timer = setInterval(() => {
                const currentFps = pill.get_fps?.();
                console.log("FPS" + currentFps);

                if (currentFps != null) {
                    setFps(currentFps);
                }
            }, 250);
        }

        boot().catch(console.error);

        return () => {
            observer.disconnect();

            if (timer) {
                clearInterval(timer);
            }
        };
    }, []);

    const handleSlider = (event) => {
        const next = Number(event.target.value);

        setValue(next);
        pill.set_demo_value?.(next);
    };

    return (
        <div className="absolute inset-0 overflow-hidden">
            {/* Pill/WebGPU rendering */}
            <canvas
                id="canvas"
                ref={canvasRef}
                className="
                    absolute inset-0
                    block h-full w-full
                    pointer-events-none
                "
            />

            {/* Browser-controlled UI */}
            <div
                className="
                    absolute
                    left-1/2 bottom-6
                    z-20
                    -translate-x-1/2

                    flex items-center gap-4
                    rounded-xl
                    border border-white/10
                    bg-black/40
                    px-5 py-3
                    backdrop-blur-md

                    pointer-events-auto
                "
            >
                <span className="text-sm text-white/70">
                    Amount
                </span>

                <input
                    type="range"
                    min="0"
                    max="10000"
                    step="1"
                    value={value}
                    onChange={handleSlider}
                    className="w-48"
                />

                <span className="w-12 text-sm text-white tabular-nums">
                    {value.toFixed(2)}
                </span>

                <div className="h-5 w-px bg-white/20" />

                <span className="text-sm text-white/70 tabular-nums">
                    {Math.round(fps)} FPS
                </span>
            </div>
        </div>
    );
}
