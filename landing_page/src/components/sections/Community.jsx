import { useMemo } from 'react';
import { Code2, Rocket, Package, Terminal, Book } from 'lucide-react';
import FeatureCard from '../elements/FeatureCard';
import { generateGranuleField } from '../effects/granules';

const capabilities = [
    {
        icon: <Code2 className="w-5 h-5" />,
        title: 'Developer-Friendly API',
        description: 'Clean, intuitive API designed for productivity. Write less boilerplate and focus on what matters - creating amazing gameplay experiences.',
    },
    {
        icon: <Rocket className="w-5 h-5" />,
        title: 'Production Ready',
        description: 'Battle-tested architecture for real-world game development. Built with performance and stability in mind from day one.',
    },
    {
        icon: <Package className="w-5 h-5" />,
        title: 'Modular Design',
        description: 'Use only what you need with fully modular components. Cherry-pick systems and features without bloating your build.',
    },
    {
        icon: <Terminal className="w-5 h-5" />,
        title: 'CLI Tools',
        description: 'Powerful command-line tools for project management, asset pipeline, and build automation.',
    },
    {
        icon: <Book className="w-5 h-5" />,
        title: 'Open Source',
        description: 'Fully open source with an active community. Transparent development, community-driven features, and complete freedom.',
    },
];

const Community = () => {
    const granuleField = useMemo(() => generateGranuleField(), []);

    return (
        <section
            id="community"
            className="relative scroll-mt-24 py-8 sm:py-10 px-4 sm:px-6 lg:px-8 overflow-hidden"
        >
            <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl sm:text-4xl md:text-5xl  text-white leading-[1.15] tracking-tight mb-4">
                    Built for{' '}
                    <span className="text-brand-400">Developers</span>
                    {' '}by{' '}
                    <span className="text-brand-400">Developers</span>
                </h2>
                <p className="text-xl text-gray-400 max-w-3xl mb-14 leading-relaxed">
                    Every aspect of Pill is designed with developer experience in mind. From the API
                    design to the tooling ecosystem, everything is focused on making game development
                    faster, safer, and more enjoyable.
                </p>

                <div className="relative">
                    {/* Granule-field backdrop */}
                    <div
                        className="absolute -inset-8 pointer-events-none"
                        dangerouslySetInnerHTML={granuleField}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
                        {capabilities.map((capability) => (
                            <FeatureCard
                                key={capability.title}
                                icon={capability.icon}
                                title={capability.title}
                                description={capability.description}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Community;
