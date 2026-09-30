import { Check, Gem, ThumbsUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase.js';

// Shared class for emphasized terms in roadmap entries
const highlightedClassName = 'text-brand-400 font-semibold';

// Star border highlight settings, applied as CSS custom properties on any
// roadmap item with `work_in_progress: true`. Tweak these to restyle the
// spinning border ring (the matching .roadmap-item-highlight rules live in
// src/index.css and use these same variables as fallback defaults).
const STAR_BORDER = {
    thickness: 1,                       // border ring thickness in px
    speed: '8s',                        // duration of one full rotation
    color: 'rgb(255 90 90 / 0.9)',      // leading edge color of the ring
    tail: 50,                           // percent of the ring the comet spans
    frequency: 1,                       // number of sweeping segments around the ring
};

const roadmapItems = [
    {
        id: 'modular-base-architecture',
        completed: true,
        label: (
            <>
                Windows, Linux, and macOS build support
            </>
        ),
    },
    {
        id: 'initial-extensive-architecture-research-and-design',
        completed: true,
        label: (
            <>
                Initial extensive architecture research and design
            </>
        ),
    },
    {
        id: 'vulkan-directx-metal-opengl-and-webgpu-graphics-backends-support',
        completed: true,
        label: (
            <>
                Vulkan, DirectX, Metal, OpenGL, and WebGPU graphics backends support
            </>
        ),
    },
    {
        id: 'base-ecs-implementation',
        completed: true,
        label: (
            <>
                Base ECS implementation
            </>
        ),
    },
    {
        id: 'wasm-target-support',
        completed: true,
        label: (
            <>
                WASM target support
            </>
        ),
    },
    {
        id: 'modular-architecture-split-into-separate-reloadable-dlls',
        work_in_progress: true,
        important: true,
        label: (
            <>
                Ultra modular architecture - split into separate{' '}
                <span className={highlightedClassName}>reloadable DLLs</span>
            </>
        ),
    },
    {
        id: 'rust-scripting',
        work_in_progress: true,
        important: true,
        label: (
            <>
                <span className={highlightedClassName}>Rust</span> and{' '}
                <span className={highlightedClassName}>C#</span> scripting support
            </>
        ),
    },
    {
        id: 'hot-reload',
        work_in_progress: true,
        important: true,
        label: (
            <>
                Two level <span className={highlightedClassName}>hot reload</span>:
                DLL rebuilding and single function patching
            </>
        ),
    },
     {
        id: 'tracing',
        label: (
            <>
                <span className={highlightedClassName}>Tracing</span>, with{' '}
                <span className={highlightedClassName}>logging</span> built on the same pipeline
            </>
        ),
    },
    {
        id: 'editor-mvp',
        work_in_progress: true,
        label: (
            <>
                <span className={highlightedClassName}>Editor</span> - minimum viable version, with{' '}
                <span className={highlightedClassName}>scene and game viewports</span>
            </>
        ),
    },
    {
        id: 'automated-ci-benchmarking',
        work_in_progress: true,
        important: true,
        label: (
            <>
               Robust and automated continuous integration <span className={highlightedClassName}>performance and size benchmarking pipeline</span>
            </>
        ),
    },
    {
        id: 'error-handling',
        label: (
            <>
                Next-level error handling with{' '}
                <span className={highlightedClassName}>full callstacks</span>,{' '}
                <span className={highlightedClassName}>telemetry</span> ready
            </>
        ),
    },
    {
        id: 'tests',
        work_in_progress: true,
        label: (
            <>
                <span className={highlightedClassName}>Extensive testing pipeline</span> - unit and integration tests, performance and size benchmarks
            </>
        ),
    },
    {
        id: 'docs',
        label: (
            <>
                <span className={highlightedClassName}>Procedurally generated documentation</span>, published to
                the docs site
            </>
        ),
    },
    {
        id: 'fast-streaming',
        important: true,
        label: (
            <>
                Custom protocol for ultra-low-latency <span className={highlightedClassName}>asset streaming</span>
            </>
        ),
    },
    {
        id: 'headless-engine',
        label: (
            <>
                <span className={highlightedClassName}>Headless mode</span>, for servers, CI and non-gamedev use cases
            </>
        ),
    },
    // {
    //     id: 'webgpu-support',
    //     label: (
    //         <>
    //             <span className={highlightedClassName}>WebGPU</span> support in browsers and native
    //         </>
    //     ),
    // },
    {
        id: 'scriptable-rendering-pipeline',
        important: true,
        label: (
            <>
                SIGGRAPH-grade{' '}
                <span className={highlightedClassName}>scriptable rendering pipeline</span>
            </>
        ),
    },
    {
        id: 'advanced-rendering-pipeline',
        important: false,
        label: (
            <>
                Advanced renderer with NVIDIA technologies support
            </>
        ),
    },
    {
        id: 'ESP32-support',
        important: true,
        label: (
            <>
                <span className={highlightedClassName}>ESP32</span> target support with custom{' '}
                <span className={highlightedClassName}>software rasterizer</span> and display driver
            </>
        ),
    },
    {
        id: 'gpu-compute',
        label: (
            <>
                <span className={highlightedClassName}>GPU compute</span> support, for built-in systems and
                user-defined tasks
            </>
        ),
    },
    {
        id: 'wasm-editor',
        label: (
            <>
                Editor running in the browser
            </>
        ),
    },
    {
        id: 'hardware-ray-tracing',
        label: (
            <>
                Hardware <span className={highlightedClassName}>ray tracing</span> support on
                supported GPUs
            </>
        ),
    },
    {
        id: 'you-decide',
        important: true,
        // The community-decides entry is not a feature to vote on.
        show_vote: false,
        label: (
            <>
                {/* block span - the item text renders inside a <p>, which
                    must not contain flow elements like <div>. */}
                <span className="block text-xl text-gray-400 max-w-2xl p-3 pl-0">
                    <span className={highlightedClassName}>You decide!</span>
                </span>
            </>
        ),
    }
];

/**
 * One timeline entry: a node sitting on the spine, the item text, and a vote
 * affordance. The button is presentational for now - votes are not collected.
 * Items can opt out of the vote affordance with `show_vote: false`.
 */
const RoadmapItem = ({ item, vote, votes, voted, isFirst, isLast }) => (
    <li className="relative pl-10 sm:pl-12">
        {/* Spine segments - every marker sits at 50% of its row, so the line
            between two markers is split at the row boundary: the part above
            this marker and the part below it. The first row skips the upper
            part and the last row skips the lower part, so the spine starts
            and ends exactly at the first and last markers. */}
        {!isFirst && (
            <span
                className="absolute left-[15px] sm:left-[19px] top-0 bottom-1/2 w-px bg-white/[0.08]"
                aria-hidden="true"
            />
        )}
        {!isLast && (
            <span
                className="absolute left-[15px] sm:left-[19px] top-1/2 -bottom-6 w-px bg-white/[0.08]"
                aria-hidden="true"
            />
        )}
        <div className="flex items-center gap-2 mb-1 ">
            {item.important ? (
                <Gem
                    className="absolute left-[5px] sm:left-[9.2px] w-[21px] h-[21px] text-brand-400"
                    aria-hidden="true"
                />
            ) : (
                <span
                    className="absolute left-[11px] sm:left-[15px] w-2.5 h-2.5 rounded-full ring-[3px] bg-brand-400 ring-brand-400/20"
                    aria-hidden="true"
                />
            )}
        
            <div
                className={`
                    glass-card p-5 sm:p-5 group relative flex items-start gap-4 w-full
                    ${item.work_in_progress ? 'roadmap-item-highlight' : ''}
                    ${item.completed ? 'roadmap-item-completed' : ''}
                `}
                style={
                    item.work_in_progress
                        ? {
                              '--star-thickness': `${STAR_BORDER.thickness}px`,
                              '--star-speed': STAR_BORDER.speed,
                              '--star-color': STAR_BORDER.color,
                              '--star-tail': STAR_BORDER.tail,
                              '--star-frequency': STAR_BORDER.frequency,
                          }
                        : undefined
                }
            >
                {/* Work-in-progress tag, pinned to the top-left corner */}
                {item.work_in_progress && (
                    <span
                        className="
                        absolute -top-3 left-3 z-10 inline-flex items-center px-2 py-0.5 rounded-md text-[10px]
                         font-semibold tracking-wider uppercase bg-neutral-400 text-black shadow-lg"
                        aria-hidden="true"
                    >
                        WORK IN PROGRESS
                    </span>
                )}
                {/* Completed check, pinned to the top-left corner */}
                {item.completed && (
                    <span
                        className="absolute -top-3 left-3 z-10 inline-flex items-center justify-center w-5 h-5 rounded-full bg-neutral-500 text-black shadow-lg"
                        aria-hidden="true"
                    >
                        <Check className="w-3.5 h-3.5" strokeWidth={3} />
                    </span>
                )}
                <p
                    className={`
                        min-w-0 flex-1 text-md sm:text-lg leading-relaxed
                        ${item.completed ? 'text-gray-500' : 'text-gray-300'}
                    `}
                >
                    {item.label}
                </p>
                <div className="hidden md:block">
                    {/* Hidden when the item is completed or opts out with show_vote: false. */}
                    {!item.completed && item.show_vote !== false && (
                        <button
                            type="button"
                            disabled={voted.has(item.id)}
                            onClick={() => vote(item.id)}
                            aria-label={`Vote for ${item.label}`}
                            className={`
                                inline-flex items-center gap-1.5 flex-shrink-0
                                px-2.5 py-1.5 rounded-lg text-sm font-medium
                                transition-colors duration-150
                                ${voted.has(item.id)
                                    ? 'text-brand-400 bg-brand-400/10 cursor-default'
                                    : 'text-gray-600 hover:text-white hover:bg-white/[0.06]'
                                }
                            `}
                        >
                            <ThumbsUp className="w-4 h-4" />
                            {/*TODO: disabled until we have heaps of votes * {votes[item.id] ?? 0} */}
                        </button>
                    )}
                </div>
            </div>
        </div>
    </li>
);

const Roadmap = () => {
    const [votes, setVotes] = useState({});
    const [voted, setVoted] = useState(
        () => new Set(JSON.parse(localStorage.getItem('roadmap-votes') ?? '[]'))
    );

    useEffect(() => {
        if (!supabase) return;

        supabase
            .from('roadmap_votes')
            .select('item_id, votes')
            .then(({ data }) => {
                if (!data) return;

                setVotes(
                    Object.fromEntries(
                        data.map(({ item_id, votes }) => [item_id, votes])
                    )
                );
            });
    }, []);

    const vote = async (itemId) => {
        if (!supabase || voted.has(itemId)) {
            return;
        }

        const { data, error } = await supabase.rpc('vote_roadmap_item', {
            p_item_id: itemId,
        });

        if (error) {
            console.error(error);
            return;
        }

        setVotes((old) => ({
            ...old,
            [itemId]: data,
        }));

        const next = new Set(voted);
        next.add(itemId);

        setVoted(next);

        localStorage.setItem(
            'roadmap-votes',
            JSON.stringify([...next]),
        );
    };

    return (
        <section
            id="roadmap"
            className="relative scroll-mt-24 py-8 sm:py-10 px-4 sm:px-6 lg:px-8"
        >
            <div className="max-w-6xl mx-auto">
                {/* Section heading */}
                <div className="mb-6">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl text-white leading-[1.15] tracking-tight mb-4">
                        What's next is worth waiting for
                    </h2>
                    <p className="text-xl text-gray-400 max-w-2xl">
                        We're forging the future. Vote on what matters most to you, or{' '}
                        <a
                            href={`mailto:${['contact', '@', 'pillengine', '.', 'org'].join('')}`}
                            className="text-brand-400 hover:text-brand-300 transition-colors duration-150"
                        >
                            contact us
                        </a>
                        {' '}and give your feedback!
                    </p>
                </div>

                <div className="mb-12 flex items-center gap-2">
                    <p className="text-xl text-gray-400 max-w-2xl">
                        Flagship features are marked with <Gem className="w-5 h-5 text-brand-400 inline translate-y-[-2px]" aria-hidden="true" /> icon.
                    </p>
                </div>
                 

                {/* Vertical timeline - the spine is drawn per item (see
                    RoadmapItem) so it starts and ends at the end markers. */}
                <div className="relative">
                    <ul className="space-y-6">
                        {roadmapItems.map((item, index) => (
                            <RoadmapItem
                                key={item.id}
                                item={item}
                                vote={vote}
                                votes={votes}
                                voted={voted}
                                isFirst={index === 0}
                                isLast={index === roadmapItems.length - 1}
                            />
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
};

export default Roadmap;
