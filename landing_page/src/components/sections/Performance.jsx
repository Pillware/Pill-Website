import { useState, useMemo } from 'react';
import {
    Gauge,
    HeartCrack,
    Pill,
    Plus,
    RotateCcw,
    FlaskConical,
    GitBranch,
    ShieldCheck
} from 'lucide-react';
import PillWebDemo from '../elements/PillWebDemo';
import BumpCounter from '../elements/BumpCounter';
import * as pill from '../../pill_demo/pill_web_app.js';
import FeatureCard from '../elements/FeatureCard';
import { generateGranuleField } from '../effects/granules';

const method = [
    {
        icon: <FlaskConical className="w-5 h-5" />,
        title: 'Research first',
        description: 'Papers, engine postmortems, hardware documentation. A feature starts as implementation notes, not as a wishlist entry.',
    },
    {
        icon: <GitBranch className="w-5 h-5" />,
        title: 'Prototyped in the engine',
        description: 'Ideas land as a working branch in Pill before they reach the roadmap. What does not hold up in a real project gets dropped.',
    },
    {
        icon: <ShieldCheck className="w-5 h-5" />,
        title: 'Guarded in CI',
        description: 'Every feature ships with a benchmark, and a regression blocks the merge.',
    },
];

const researchAreas = [
    'ECS scheduling',
    'Live patching',
    'CPU branch prediction',
    'Cache misses',
    'Data migration',
    'Multithreading',
    'Cache line alignment',
    'Tracing',
    'Build compression',
];

const backgrounds = [
    'AAA games',
    'Big Tech',
    'UGC at scale',
    'Demoscene',
    'Embedded',
    'Game jams',
    'Open source',
    'Linux kernel',
    'Graphics drivers'
];

const ChipGroup = ({ title, chips }) => (
    <div>
        <h3 className="text-xl font-semibold text-gray-300 flex items-center gap-3 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
            {title}
        </h3>
        <div className="flex flex-wrap gap-[12px]">
            {chips.map((chip) => (
                <span
                    key={chip}
                    className="px-4 py-1.5 text-xs sm:text-md font-medium rounded-full bg-white/[0.03] text-gray-400 border border-white/[0.06]"
                >
                    {chip}
                </span>
            ))}
        </div>
    </div>
);


const Stat = ({ icon, value, label }) => (
    <div className="flex items-start gap-3">
        <div className="text-brand-400">
            {icon}
        </div>

        <div className="text-left">
            <div className="text-lg font-semibold text-white tabular-nums leading-none">
                {value}
            </div>

            <div className="mt-1 text-xs text-gray-500">
                {label}
            </div>
        </div>
    </div>
);


const PerformanceWebDemo = () => {
    const [ready, setReady] = useState(false);
    const [error, setError] = useState(null);

    const [stats, setStats] = useState({
        fps: null,
        pillCount: null,
        frameTimeMs: null,
    });

    const handleSpawn = () => {
        // Report demo engagement; pills is the latest displayed count.
        window.umami?.track(
            'demo-spawn',
            stats.pillCount == null ? undefined : { pills: stats.pillCount },
        );

        pill.spawn_more_pills?.();
    };

    const handleReset = () => {
        window.umami?.track('demo-reset');

        pill.reset_pills?.();
    };

    return (
        <div className="max-w-6xl mx-auto">

            {/* Viewport */}
            <div className="relative w-full aspect-video overflow-hidden rounded-2xl border border-white/10 bg-[#050505] shadow-md">
                <PillWebDemo
                    onReady={() => setReady(true)}
                    onStats={setStats}
                    onError={setError}
                />

                {!ready && !error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black text-sm text-gray-500">
                        Loading Pill Engine…
                    </div>
                )}

                {error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black px-6 text-center text-sm text-gray-400">
                        <HeartCrack className="w-8 h-8" />
                        WebGPU demo unavailable on this browser/device.
                    </div>
                )}
            </div>

            {/* Stats + controls, below the viewport */}
            <div className="mt-5 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                {/* Stats */}
                <div className="flex items-center justify-start gap-6 sm:gap-10 ml-[10px]">
                    <Stat
                        icon={<Pill className="w-5 h-5" />}
                        value={<BumpCounter value={stats.pillCount} />}
                        label="Pills"
                    />

                    <Stat
                        icon={<Gauge className="w-5 h-5" />}
                        value={ stats.fps == null ? '—' : Math.round(stats.fps) }
                        label="FPS"
                    />
                </div>

                {/* Controls */}
                <div className="flex justify-between gap-2">
                    <button
                        type="button"
                        onClick={handleSpawn}
                        disabled={!ready || !!error}
                        className="inline-flex items-center justify-center gap-1 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <Plus className="w-5 h-5" />
                        Spawn more pills
                    </button>

                     <button
                        type="button"
                        onClick={handleReset}
                        disabled={!ready || !!error}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

const PillLabs = () => {
    const granuleField = useMemo(() => generateGranuleField({ seed: 31 }), []);

    return (
        <div id="labs" className="scroll-mt-24">

            <h2 className="text-3xl sm:text-4xl md:text-5xl text-white leading-[1.15] tracking-tight mb-6">
                <a href="/" className="flex items-center">
                    <img
                        src="/logos/pill_labs_logo_white.svg"
                        alt="Pill Labs"
                        className="h-[60px]"
                    />
                </a>
            </h2>

            <p className="text-xl text-gray-400 max-w-2xl mb-10">
                We don't tell fairytales about how fast Pill is. Every figure here comes from
                automated benchmarks that run after every engine change - entity throughput,
                frame times, build sizes, load latencies, all tracked in CI.   <br/><br/>
                Regressions are caught before they reach you, and the results are published right here by the team in Pill Labs.
            </p>

            {/* Method cards */}
            <div className="relative mb-6 mt-[60px]">
                {/* Granule-field backdrop */}
                <div
                    className="absolute -inset-8 pointer-events-none"
                    dangerouslySetInnerHTML={granuleField}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
                    {method.map((step) => (
                        <FeatureCard
                            key={step.title}
                            icon={step.icon}
                            title={step.title}
                            description={step.description}
                            titleClassName="text-xl"
                        />
                    ))}
                </div>
            </div>

            {/* Research areas and where the team comes from */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12">
                <ChipGroup title="Research areas" chips={researchAreas} />
                <ChipGroup title="Drawn from our experience in" chips={backgrounds} />
            </div>
        </div>
    );
};


const Performance = () => {
    return (
        <section
            id="performance"
            className="relative scroll-mt-24 py-8 sm:py-10 px-4 sm:px-6 lg:px-8 overflow-hidden"
        >
            <div className="max-w-6xl mx-auto">

                {/* Section heading */}
                <h2 className="text-3xl sm:text-4xl md:text-5xl text-white leading-[1.15] tracking-tight mb-6">
                    Roaring Speed. No Compromises.
                </h2>
                <p className="text-xl text-gray-400 max-w-2xl mb-10">
                    <i>Real talk: performance isn't just a bullet point - it's the foundation. </i> <br/><br/>
                    Every layer of the engine - entity processing, multithreaded scheduling, asset streaming, build footprint - is built to run fast and stay lean.
                </p>

                <p className="text-xl text-gray-400 max-w-2xl mb-10">
                    Everything in Pill is ‎
                    <span className="text-xl text-brand-400 font-semibold leading-relaxed">
                        Benchmarked. Measured. Proven. 
                    </span>
                    <br/> by the Pill Labs, our internal research and benchmarking division.
                </p>

                {/* <p className="text-xl text-gray-400 max-w-2xl mb-6">
                    Try it yourself:
                </p> */}

                {/* Web demo */}
                {/* <PerformanceWebDemo /> */}

                {/* <div className="h-[70px] md:h-[70px]" /> */}
                <div className="section-divider" />
                <div className="h-[70px] md:h-[70px]" />

                <PillLabs />
            </div>
        
        </section>
    );
};


export default Performance;
