import {
    HeartHandshake, Code2, Box, Flame, ShieldCheck, Boxes, ListTree,
    Puzzle, Gauge, Feather, Cpu, Rocket, AppWindow, Waves, Columns2,
} from 'lucide-react';
import FeatureFoldout from '../FeatureFoldout';

// Shipped flagship features. Each entry becomes one foldout card: icon and
// title always visible, description revealed when the card is opened.
const FLAGSHIP_FEATURES = [
    {
        icon: <HeartHandshake className="w-5 h-5" />,
        title: 'Free',
        description: 'The idea is to empower people so they can make amazing stuff. Out of passion. For community, by community.',
    },
    {
        icon: <Code2 className="w-5 h-5" />,
        title: 'C# and Rust as first-class citizen scripting languages',
        description: 'You have a choice: extremely convenient and maximally efficient. Pick C# when you want to move conveniently and fast, Rust for full low-level control and maxed out performance.',
    },
    {
        icon: <Box className="w-5 h-5" />,
        title: 'Full project sandboxing',
        description: 'When your project crashes, the engine and editor do not! You will just get a clear error message and can keep going.',
    },
    {
        icon: <Flame className="w-5 h-5" />,
        title: 'Hot reloading pushed to the max',
        description: 'Only 1-2s of wait time after you edit the code and your changes are up and running. Instant feedback, blazingly fast iteration on your projects. When changing functions, hot reload is even faster - just 0.5s, a blink of an eye!',
    },
    {
        icon: <ShieldCheck className="w-5 h-5" />,
        title: 'Crash free',
        description: "Sounds crazy, but Pill is written in Rust - a modern, low-level, highly efficient programming language with extremely strong memory safety guarantees. Combined with project sandboxing, Pill can't really crash.",
    },
    {
        icon: <Boxes className="w-5 h-5" />,
        title: 'Entity Component System at the core',
        description: "The fastest possible architecture, capable of simulating millions of entities on the CPU. Optimized for cache locality, parallelism and raw performance. Archetype-based. Also, Pill's ECS implementation is hybrid. This means that you are not limited to the classic system approach - break the wall and write logic inside the components if you want, or mix the two approaches. Underlying data and logic stay the same - packed in an efficient, data-oriented way.",
    },
    {
        icon: <ListTree className="w-5 h-5" />,
        title: 'Next level error logs',
        description: 'Extremely descriptive and configurable error call stacks. Debugging was never that easy.',
    },
    {
        icon: <Puzzle className="w-5 h-5" />,
        title: 'Fully modular architecture',
        description: 'Engine core is just minimal scaffolding. Everything else is a plug-and-play module. You can even unplug the renderer and run the engine headless.',
    },
    {
        icon: <Gauge className="w-5 h-5" />,
        title: 'Proven performance',
        description: (
            <>
                All engine features and pipelines are constantly measured during development. No performance regressions allowed. For more info, check{' '}
                <a
                    href="#labs"
                    className="text-brand-400 hover:text-brand-300 transition-colors duration-150"
                >
                    Pill Labs
                </a>
                .
            </>
        ),
    },
    {
        icon: <Feather className="w-5 h-5" />,
        title: 'Tiny build sizes',
        description: 'Builds as small as 0.5 MB - around 2000 times smaller than one GB.',
    },
    {
        icon: <Cpu className="w-5 h-5" />,
        title: 'Embedded devices support',
        description: 'Pill can run even on microcontrollers like ESP32 with just 0.5 MB of RAM.',
    },
    {
        icon: <Rocket className="w-5 h-5" />,
        title: 'Blazing startup times',
        description: 'Opening the editor with a huge project in below 10 seconds? Pill got you covered.',
    },
    {
        icon: <AppWindow className="w-5 h-5" />,
        title: 'Editor',
        description: 'We have it. And it works in the web browser as well.',
    },
    {
        icon: <Waves className="w-5 h-5" />,
        title: 'Absolute streaming beast',
        description: 'Stream huge amounts of assets and world data on demand without loading everything upfront. Keep memory usage low and massive projects moving fast.',
    },
    {
        icon: <Columns2 className="w-5 h-5" />,
        title: 'Game viewport and camera viewport in the editor!',
        description: 'You can run your project in one viewport and still edit your scene in another one at the same time. Play the game and keep working on it without constantly switching back and forth.',
    },
];

const FlagshipFeatures = () => {
    return (
        <section
            id="flagship-features"
            className="relative scroll-mt-24 py-8 sm:py-10 px-4 sm:px-6 lg:px-8"
        >
            <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl sm:text-4xl md:text-5xl text-white leading-[1.15] tracking-tight mb-4">
                    Solving what is bad, improving what is good
                </h2>
                <p className="text-xl text-gray-400 max-w-2xl mb-10">
                    Main goal of Pill is to fix the problems of existing engines and to improve on the good things.
                    The flagship features are below.
                </p>

                {/* Foldout grid. items-start keeps the collapsed card of a row
                    at its own height when the other card is expanded. */}
                <div className="grid grid-cols-1 md:grid-cols-2 items-start gap-4">
                    {FLAGSHIP_FEATURES.map((feature) => (
                        <FeatureFoldout key={feature.title} icon={feature.icon} title={feature.title}>
                            {feature.description}
                        </FeatureFoldout>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FlagshipFeatures;
