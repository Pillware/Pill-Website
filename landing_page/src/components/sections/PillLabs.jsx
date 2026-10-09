import { useMemo } from 'react';
import { FlaskConical, GitBranch, ShieldCheck } from 'lucide-react';
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

const PillLabs = () => {
    const granuleField = useMemo(() => generateGranuleField({ seed: 31 }), []);

    return (
        <section
            id="labs"
            className="relative scroll-mt-24 py-8 sm:py-10 px-4 sm:px-6 lg:px-8 overflow-hidden"
        >
            <div className="max-w-6xl mx-auto">
                {/* Section heading */}
                <h2 className="text-3xl sm:text-4xl md:text-5xl text-white leading-[1.15] tracking-tight mb-6">
                    Pill Labs
                </h2>
                <p className="text-xl text-gray-400 max-w-2xl mb-10">
                    <i>Real talk: performance isn't just a bullet point - it's the foundation. </i> <br/><br/>
                    Every layer of the engine - entity processing, multithreaded scheduling, asset streaming, build footprint - is built to run fast and stay lean.
                    <br/><br/>
                    But we don't tell fairytales about how fast Pill is. Every figure here comes from automated benchmarks that run after every engine change - entity throughput, frame times, build sizes, load latencies, all tracked in CI. Regressions are caught before they reach you, and the results are published right here, in Pill Labs.
                </p>


                <p className="text-xl text-gray-400 max-w-2xl mb-10">
                    Everything in Pill is ‎
                    <span className="text-xl text-brand-400 font-semibold leading-relaxed">
                        Benchmarked. Measured. Proven.
                    </span>
                </p>


                {/* Method cards */}
                <div className="relative mb-6">
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
        </section>
    );
};

export default PillLabs;
