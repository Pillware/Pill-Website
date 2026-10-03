import { useState } from 'react';
import {
    Gauge,
    Layers3,
    Plus,
    RotateCcw,
    Timer,
} from 'lucide-react';

import PillDemo from './PillDemo';
import * as pill from '../../pill_demo/pill_web_app.js';


const Stat = ({ icon, value, label }) => (
    <div className="flex items-center gap-3">
        <div className="text-brand-400">
            {icon}
        </div>

        <div>
            <div className="text-lg font-semibold text-white tabular-nums">
                {value}
            </div>

            <div className="text-xs text-gray-500">
                {label}
            </div>
        </div>
    </div>
);


const Performance = () => {
    const [ready, setReady] = useState(false);
    const [error, setError] = useState(null);

    const [stats, setStats] = useState({
        fps: null,
        pillCount: null,
        frameTimeMs: null,
    });

    const handleSpawn = () => {
        pill.spawn_more_pills?.();
    };

    const handleReset = () => {
        pill.reset_pills?.();
    };

    return (
        <section
            id="performance"
            className="
                relative
                scroll-mt-24
                py-10
                px-4 sm:px-6 lg:px-8
            "
        >
            <div className="max-w-6xl mx-auto">
                <h2
                    className="
                        text-3xl
                        sm:text-4xl
                        md:text-5xl
                        text-white
                        leading-[1.15]
                        tracking-tight
                    "
                >
                    Performance
                </h2>

                <p className="text-xl text-gray-400 mt-4 mb-8 max-w-2xl">
                    See how far you can push Pill.
                    Spawn more pills and watch the engine handle
                    the growing simulation in real time.
                </p>

                <div
                    className="
                        relative
                        w-full
                        aspect-video
                        overflow-hidden
                        rounded-2xl
                        border border-white/10
                        bg-black
                    "
                >
                    <PillDemo
                        onReady={() => setReady(true)}
                        onStats={setStats}
                        onError={setError}
                    />

                    <div
                        className="
                            absolute
                            left-4
                            right-4
                            bottom-4
                            z-20

                            flex
                            flex-col
                            gap-4

                            lg:flex-row
                            lg:items-center
                            lg:justify-between

                            rounded-xl
                            border border-white/10
                            bg-black/80
                            px-5
                            py-4
                        "
                    >
                        <div className="flex flex-wrap items-center gap-6">
                            <Stat
                                icon={
                                    <Layers3 className="w-5 h-5" />
                                }
                                value={
                                    stats.pillCount == null
                                        ? '—'
                                        : stats.pillCount.toLocaleString()
                                }
                                label="Pills"
                            />

                            <Stat
                                icon={
                                    <Gauge className="w-5 h-5" />
                                }
                                value={
                                    stats.fps == null
                                        ? '—'
                                        : Math.round(stats.fps)
                                }
                                label="FPS"
                            />

                            <Stat
                                icon={
                                    <Timer className="w-5 h-5" />
                                }
                                value={
                                    stats.frameTimeMs == null
                                        ? '—'
                                        : `${stats.frameTimeMs.toFixed(2)} ms`
                                }
                                label="Frame time"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleReset}
                                disabled={!ready || !!error}
                                className="
                                    inline-flex
                                    items-center
                                    justify-center
                                    gap-2
                                    rounded-lg
                                    border border-white/10
                                    bg-white/[0.04]
                                    px-4 py-2.5
                                    text-sm
                                    font-semibold
                                    text-white
                                    transition-colors
                                    hover:bg-white/[0.08]
                                    disabled:cursor-not-allowed
                                    disabled:opacity-40
                                "
                            >
                                <RotateCcw className="w-4 h-4" />
                                Reset
                            </button>

                            <button
                                type="button"
                                onClick={handleSpawn}
                                disabled={!ready || !!error}
                                className="
                                    inline-flex
                                    items-center
                                    justify-center
                                    gap-2
                                    rounded-lg
                                    bg-brand-400
                                    px-5 py-2.5
                                    text-sm
                                    font-semibold
                                    text-white
                                    transition-colors
                                    hover:bg-brand-300
                                    disabled:cursor-not-allowed
                                    disabled:opacity-40
                                "
                            >
                                <Plus className="w-4 h-4" />
                                Spawn more pills
                            </button>
                        </div>
                    </div>

                    {!ready && !error && (
                        <div
                            className="
                                absolute
                                inset-0
                                flex
                                items-center
                                justify-center
                                text-sm
                                text-gray-500
                            "
                        >
                            Loading Pill Engine…
                        </div>
                    )}

                    {error && (
                        <div
                            className="
                                absolute
                                inset-0
                                flex
                                items-center
                                justify-center
                                px-6
                                text-center
                                text-sm
                                text-gray-400
                            "
                        >
                            WebGPU demo unavailable on this browser/device.
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default Performance;
