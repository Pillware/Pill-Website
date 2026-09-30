import { RefreshCw, Zap, LaptopMinimal, Rocket, CodeXml } from 'lucide-react';

// prettier-ignore
const loop = [
    { icon: <RefreshCw className="w-5 h-5" />, metric: '1–2s', label: 'Code rebuild and relink' },
    { icon: <Zap className="w-5 h-5" />, metric: '0.5s', label: 'Fast-path rebuild and relink' },
    { icon: <CodeXml className="w-5 h-5" />, metric: '1-2s', label: 'Shader recompilation' },
    { icon: <Rocket className="w-5 h-5" />, metric: '2s', label: 'Build loading and startup' },
    { icon: <LaptopMinimal className="w-5 h-5" />, metric: '< 10s', label: 'Editor opening' },
];

const Tile = ({ item }) => (
    <div className="glass-card-top p-4 group items-center justify-center flex flex-col text-center gap-2 sm:gap-1">
        <div className="feature-icon w-9 h-9 mb-1">
            {item.icon}
        </div>
        <h3 className="text-2xl font-semibold text-white">
            {item.metric}
        </h3>
        <p className="text-md text-gray-500 leading-relaxed">
            {item.label}
        </p>
    </div>
);

const Iteration = () => {
    return (
        <section
            id="iteration"
            className="relative scroll-mt-24 py-8 sm:py-10 px-4 sm:px-6 lg:px-8"
        >
            <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl sm:text-4xl md:text-5xl text-white leading-[1.15] tracking-tight mb-4">
                    Incredible iteration speed
                    <br/>Pleasant to work with
                </h2>

                <p className="text-xl text-gray-400 max-w-2xl mb-10">
                    Pill's core is engineered around one goal: iteration speed. <br />
                    Hot-reloadable and maximally responsive by design.
                </p>

                <p className="text-xl text-gray-400 max-w-2xl mb-10">
                    <span className="text-xl text-brand-400 font-semibold leading-relaxed">
                        Sub-second hot reload
                    </span> <br />
                    From save to in-game effect in under a second. <br />
                </p>


                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-3 mb-10">
                    {loop.map((item) => <Tile key={item.label} item={item} />)}
                </div>

                {/* 
                <h3 className="text-xl font-semibold text-gray-300 flex items-center gap-3 mb-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                    Minimal editor loading time
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mb-10">
                    {size.map((item) => <Tile key={item.label} item={item} />)}
                </div>

                <h3 className="text-xl font-semibold text-gray-300 flex items-center gap-3 mb-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                    Crash free
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="glass-card p-6">
                        <h3 className="text-xl font-semibold text-white mb-2">
                            Pill can't crash...
                        </h3>
                        <p className="text-md text-gray-500 leading-relaxed">
                            Engine core and the editor are written in Rust, which guarantees memory safety.
                            <div className="my-2" />
                            Project code is fully sandboxed, so a crash in your game does not take down the editor.
                            It will just print a nicely formatted error message and keep running.
                        </p>
                    </div>
                    <div className="glass-card p-6">
                        <h3 className="text-xl font-semibold text-white mb-2">
                            ...and it can't leak memory
                        </h3>
                        <p className="text-md text-gray-500 leading-relaxed">
                            Pill's memory management is fully deterministic. No garbage collector, no leaks, no surprises.
                            <div className="my-2" />
                            Rust at the core, and the scripting API is designed to be memory-safe.
                        </p>
                    </div>
                </div> */}
            </div>
        </section>
    );
};

export default Iteration;
