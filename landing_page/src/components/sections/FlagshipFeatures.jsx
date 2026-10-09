import { useEffect, useState } from 'react';
import {
    Heart, Code2, Box, Flame, ShieldCheck, Boxes, ListTree,
    Puzzle, Gauge, Feather, Cpu, Rocket, AppWindow, Waves, Columns2,
} from 'lucide-react';
import FeatureFoldout from '../FeatureFoldout';
import GranuleField from '../effects/GranuleField';

// IMPORTANT: For now this section is contains "goals" word as pill does not deliver all the features yet.
// Once the engine is feature complete, this section will be renamed to "Flagship Features".

const FLAGSHIP_FEATURES = [
    {
        icon: <Heart className="w-5 h-5" />,
        title: '100% free and open source',
        description: 'The whole idea is to empower people to make amazing stuff. Out of passion. For the community, by the community.',
    },
    {
        icon: <Code2 className="w-5 h-5" />,
        title: 'C# and Rust scripting languages',
        description: 'You get a real choice between convenience and maximum control. Pick C# when you want to move fast, iterate quickly and just get things done. Pick Rust when you want full low-level control, predictable performance and maximum efficiency. Both are first-class citizens.',
    },
    {
        icon: <Flame className="w-5 h-5" />,
        title: 'Hot reloading pushed to the max',
        description: 'Edit your code and see the changes running in around 1-2 seconds. When only functions change, reloads can be even faster - less than a single second. The goal is simple: keep the feedback loop short so everything feels instant.',
    },
    {
        icon: <ShieldCheck className="w-5 h-5" />,
        title: 'Crash-resistant with full project sandboxing',
        description: (
            <>
                Your code has an error or crashes? The engine and editor don't. Project code is isolated,
                so failures stay inside the project instead of taking the whole engine down with them. You
                get a clear error, fix the code, and keep going without restarting everything and waiting
                for the entire project to load again. Pill itself is written in{' '}
                <span className="text-orange-400">Rust</span>, adding strong memory-safety guarantees on top.
            </>
        ),
    },
    {
        icon: <Boxes className="w-5 h-5" />,
        title: 'Hybrid Entity Component System architecture',
        description: "Pill is built around a high-performance, archetype-based ECS designed for cache locality, parallelism and raw throughput. Simulating hundreds of thousands of objects on the CPU should not be an issue. What is more, Pill's ECS is hybrid. You are not forced to program in a data-oriented way. You can put logic directly into components to use a classic object-oriented style when needed, or freely mix both approaches. Underneath, the data stays packed, predictable and automatically optimized by the engine.",
    },
    {
        icon: <Gauge className="w-5 h-5" />,
        title: 'Proven performance',
        description: (
            <>
                Pill does not just say "I'm fast", it proves it with real numbers. Each update to the
                engine goes through automated continuous integration and benchmarking systems. The{' '}
                <a
                    href="#labs"
                    className="text-brand-400 hover:text-brand-300 underline underline-offset-2 transition-colors duration-150"
                >
                    Pill Labs
                </a>{' '}
                initiative is in charge of benchmarks and researching dark-arts performance improvements.
            </>
        ),
    },
    {
        icon: <Puzzle className="w-5 h-5" />,
        title: 'Anti-bloat, modular architecture',
        description: "The engine core is intentionally tiny - holding mostly lifecycle and infrastructure logic. Everything else is a module. Rendering, physics, audio, networking, tooling. Just plug in what you need and leave out what you don't. You can even remove the renderer completely and run Pill headless. This way we can keep the bloat and technical debt in check.",
    },
    {
        icon: <ListTree className="w-5 h-5" />,
        title: 'Next-level error logs',
        description: 'Finally useful errors instead of cryptic walls of text. Deep, descriptive and configurable call stacks with enough context to understand what went wrong, and even with the tips on what to do in order to fix the issue.',
    },
    {
        icon: <Box className="w-5 h-5" />,
        title: 'JSON asset format',
        description: "Pill uses JSON for all the assets' data, making them easy to read, edit, and version control. No more binary blobs that you can't understand or modify.",
    },
    {
        icon: <Columns2 className="w-5 h-5" />,
        title: 'Live game + scene editing workflow',
        description: 'Run your game in one viewport while continuing to inspect and edit the scene in another. Changes can be made while the project is running, without constantly switching between play and edit modes. Project code is fully sandboxed, so crashes stay contained and do not take down the editor. Super convenient.',
    },
    {
        icon: <Feather className="w-5 h-5" />,
        title: 'Tiny build sizes',
        description: 'In the era of monstrous bloated games, builds produced by Pill can be as small as roughly 1.0 MB - that is around 1,000 times smaller than 1 GB! Small binaries mean faster downloads, faster deployment, less storage and access to platforms where traditional engines simply do not fit.',
    },
    {
        icon: <Waves className="w-5 h-5" />,
        title: 'Absolute streaming beast',
        description: 'It is often the case that not everything fits in memory, especially for large projects. Pill is designed to very efficiently stream huge amounts of assets, scenes and world data only when it is actually needed.',
    },
    {
        icon: <Rocket className="w-5 h-5" />,
        title: 'Blazing startup times',
        description: 'Huge project? The editor should still open in seconds, not minutes. The target is to keep startup times in a relatively sane and healthy range even as projects become large and complex.',
    },
    {
        icon: <Cpu className="w-5 h-5" />,
        title: 'Embedded device support',
        description: 'Pill is designed to scale far beyond desktop PCs. The goal is to run Pill projects even on constrained hardware such as ESP32-class microcontrollers with just 0.5 MB of RAM.',
    },
];

// Tracks whether the viewport is at the two-column breakpoint (Tailwind's
// `md`). Splitting the cards into two independent column stacks has to be
// decided in JS: a CSS grid shares row heights between columns, so opening
// one card would push everything below it in BOTH columns.
const useTwoColumnLayout = () => {
    const [isTwoColumn, setIsTwoColumn] = useState(
        () => window.matchMedia('(min-width: 768px)').matches
    );

    useEffect(() => {
        const mediaQuery = window.matchMedia('(min-width: 768px)');
        const handleChange = (event) => setIsTwoColumn(event.matches);
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    return isTwoColumn;
};

const FlagshipFeatures = () => {
    const isTwoColumn = useTwoColumnLayout();

    // The Expand all / Collapse all button owns the open state of every
    // card, keyed by title; individual cards also report their toggles
    // back here through onToggle.
    const [openStates, setOpenStates] = useState({});
    const allFeaturesOpen = FLAGSHIP_FEATURES.every(
        (feature) => Boolean(openStates[feature.title])
    );

    // Flips a single card, leaving every other card untouched.
    const toggleFeature = (title) => {
        setOpenStates((previous) => ({ ...previous, [title]: !previous[title] }));
    };

    // Opens every card, or closes them all once every card is open.
    const toggleAllFeatures = () => {
        if (allFeaturesOpen) {
            setOpenStates({});
        } else {
            setOpenStates(
                Object.fromEntries(FLAGSHIP_FEATURES.map((feature) => [feature.title, true]))
            );
        }
    };

    // Two columns take alternating items, keeping the current left-right
    // pairing while letting each column stack independently. On small
    // screens one flat list keeps the original top-to-bottom order.
    const columns = isTwoColumn
        ? [
              FLAGSHIP_FEATURES.filter((feature, index) => index % 2 === 0),
              FLAGSHIP_FEATURES.filter((feature, index) => index % 2 === 1),
          ]
        : [FLAGSHIP_FEATURES];

    return (
        <section
            id="flagship-features"
            className="relative scroll-mt-24 py-8 sm:py-10 px-4 sm:px-6 lg:px-8 overflow-hidden"
        >
            <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl sm:text-4xl md:text-5xl text-white leading-[1.15] tracking-tight mb-4">
                    Avoiding the bad, taking the best
                </h2>
                <p className="text-xl text-gray-400 max-w-2xl mb-10">
                    The main goal of Pill is to be an engine that avoids the bad sides, limitations and mistakes of currently
                    available engines, while taking the best ideas from all of them and improving on them. <br />
                </p>

                <p className="text-xl text-gray-400 max-w-2xl mb-10">
                    <span className="text-xl text-brand-400 font-semibold leading-relaxed">
                        The agenda is very ambitious
                    </span>
                </p>


                {/* Right-aligned utility control above the grid: opens every
                    card at once, then flips to collapse them all again. */}
                <div className="flex justify-end mb-3">
                    <button
                        type="button"
                        onClick={toggleAllFeatures}
                        aria-expanded={allFeaturesOpen}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition-colors duration-150 cursor-pointer"
                    >
                        {allFeaturesOpen ? 'Collapse all' : 'Expand all'}
                    </button>
                </div>

                {/* Foldout columns - each column is its own stack, so
                    expanding a card only moves the cards below it in the
                    same column; the neighbouring column never gets a gap.
                    `foldout-grid` also drives the sibling spotlight (now
                    disabled in index.css). */}
                <div className="foldout-grid relative flex flex-col md:flex-row gap-4">
                    {/* Granule-field backdrop; the columns carry z-10 so the
                        cards paint above it, and it ignores pointer events.
                        It spawns and despawns granules as the columns grow
                        and shrink, so their density stays constant. */}
                    <GranuleField className="absolute -inset-8 pointer-events-none" />
                    {columns.map((column, columnIndex) => (
                        <div key={columnIndex} className="relative z-10 flex flex-col gap-4 flex-1 min-w-0">
                            {column.map((feature) => (
                                <FeatureFoldout
                                    key={feature.title}
                                    icon={feature.icon}
                                    title={feature.title}
                                    isOpen={Boolean(openStates[feature.title])}
                                    onToggle={() => toggleFeature(feature.title)}
                                >
                                    {feature.description}
                                </FeatureFoldout>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FlagshipFeatures;
