import { useState } from 'react';
import { ArrowRight, Github, Cpu, Package, Flame, Zap, Heart } from 'lucide-react';
import DiscordIcon from '../elements/DiscordIcon';
import Aurora, { defaultAuroraParams } from '../effects/Aurora';
import AuroraControls from '../effects/AuroraControls';

// Shared base class for the hero action buttons (Get Started / Discord /
// GitHub). Fixed width on sm+ so all three buttons render at the same size.
// transition-colors (NOT transition-all): a width change (scrollbar flip,
// resize) must never be animated, or the buttons visibly "scale to fit".
const actionButtonBaseClassName = 'inline-flex items-center justify-center gap-2 w-full sm:w-48 px-8 py-3.5 text-white font-semibold rounded-xl transition-colors duration-200 text-base';
const actionButtonClassName = `${actionButtonBaseClassName} bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.14]`;
// Discord is the community channel, so it wears the brand red like the
// other Discord CTAs on the site. The border matches the background so the
// button keeps the exact same size as its glass siblings.
const discordButtonClassName = `${actionButtonBaseClassName} bg-brand-500 hover:bg-brand-400 border border-brand-500 hover:border-brand-400`;


// prettier-ignore
const usps = [
    {
        icon: <Cpu className="w-5 h-5" />,
        metric: '500K+',
        label: 'Entities in 60 FPS',
    },
    {
        icon: <Package className="w-5 h-5" />,
        metric: '<0.5 MB',
        label: 'WASM build',
    },
    {
        icon: <Flame className="w-5 h-5" />,
        metric: 'Instant ~1 sec',
        label: 'HOT reload',
    },
    {
        icon: <Zap className="w-5 h-5" />,
        metric: '<5 secs',
        label: 'Startup times',
    },
    {
        icon: <Heart className="w-5 h-5" />,
        metric: 'MIT',
        label: 'Open source, free forever',
    },
];

// Hairline separators between the spec-bar cells. Mobile is a two-column
// grid (left borders on the second column, top borders between the rows);
// on lg it becomes a single five-cell row, so only left borders remain.
// The last cell spans both columns on mobile, hence no left border.
const cellSeparators = [
    '',
    'border-l',
    'border-t lg:border-t-0 lg:border-l',
    'border-l border-t lg:border-t-0',
    'border-t lg:border-t-0 lg:border-l',
];

/**
 * Compact above-the-fold proof strip, rendered as one continuous spec-sheet
 * bar (see .spec-bar in index.css) split into five cells by hairline
 * separators. Mirrors the benchmark figures from the Performance section
 * cards so a visitor sees the numbers without scrolling.
 */
const UspStrip = () => {
    return (
        <div className="scroll-mt-24 spec-bar grid grid-cols-2 lg:grid-cols-5">
            {usps.map((usp, index) => (
                <div
                    key={usp.metric}
                    className={`border-white/[0.08] p-3 sm:p-4 flex flex-col items-center text-center gap-1.5 sm:gap-2 ${cellSeparators[index]} ${
                        index === usps.length - 1 ? 'col-span-2 lg:col-span-1' : ''
                    }`}
                >
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center">
                        {usp.icon}
                    </div>
                    <span className="text-xl sm:text-2xl font-bold text-white tabular-nums tracking-tight leading-none">
                        {usp.metric}
                    </span>
                    <span className="text-xs sm:text-sm text-gray-400 leading-snug">
                        {usp.label}
                    </span>
                </div>
            ))}
        </div>
    );
};

const Hero = () => {
    // Live parameters for the Aurora backdrop, edited through the floating
    // controls panel; resetting restores the authored defaults.
    const [auroraParams, setAuroraParams] = useState(defaultAuroraParams);
    const [isAuroraPaused, setIsAuroraPaused] = useState(false);
    // Live render rate of the Aurora effect, reported by its own render loop
    // once per second and shown in the controls panel; null shows as "--".
    const [auroraFps, setAuroraFps] = useState(null);

    // One slider moved: merge the single changed key into the params object.
    const handleAuroraParamChange = (key, value) => {
        setAuroraParams((previous) => ({ ...previous, [key]: value }));
    };

    const handleAuroraReset = () => {
        setAuroraParams(defaultAuroraParams);
    };

    const handleAuroraPauseToggle = () => {
        setIsAuroraPaused((previous) => !previous);
    };

    return (
        <section
            id="hero"
            className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16"
        >
            {/* Aurora background - wide diagonal beams of brand-red light
over near-black broken glass; the glass never moves and only the light
fluctuates. The shader fades into the page colour in the next section. */}
            <div className="absolute inset-0 overflow-hidden z-0" style={{ willChange: 'transform', transform: 'translateZ(0)' }}>
                <Aurora params={auroraParams} isPaused={isAuroraPaused} onFpsUpdate={setAuroraFps} />
            </div>

            <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                {/* Logo - the animated copy traces its outline first, then fades
                    the fill in, and the whole mark gives a springy bump
                    (see pill_logo_animated.svg + .logo-bump); no wrapper fade. */}
                <div className="mb-4 sm:mb-6">
                    <img
                        src="/logos/pill_logo_animated.svg"
                        alt="Pill Engine"
                        width="402"
                        height="209"
                        fetchpriority="high"
                        className="h-[120px] sm:h-[200px] md:h-[220px] xl:h-[280px] w-auto mx-auto logo-bump hero-logo-shadow"
                    />
                </div>

                {/* Headline */}
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white leading-[1.1] hero-headline-shadow tracking-tight mb-4 sm:mb-[48px] animate-fade-in-up">
                    Modern, free and <span className="text-gradient">blazingly fast</span> game engine<br />
                    {/* <span className="text-gradient">Modern</span>, <span className="text-gradient">free</span> and <span className="text-gradient">blazingly fast</span> game engine<br /> */}
                </h1>

                {/* USP strip - the proof, above the fold */}
                <div className="hidden sm:block mb-6 sm:mb-8 animate-fade-in-up delay-200 mt-[48px]">
                    <UspStrip />
                </div>

                {/* Action band - one row: doer, buyer, verifier */}
                <div
                    id="contact"
                    className="mt-[60px] sm:mt-0 scroll-mt-24 flex flex-col sm:flex-row flex-wrap gap-3 justify-center items-center w-[70%] sm:w-full max-w-sm sm:max-w-none mx-auto animate-fade-in-up delay-300 mb-8"
                >
                    <a
                        href={`https://docs.${window.location.hostname}/guide/`}
                        className={`${actionButtonClassName} group`}
                    >
                        Get Started
                        <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </a>
                    <a
                        href="https://discord.gg/VUKNQrctms"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={discordButtonClassName}
                    >
                        <DiscordIcon className="w-4 h-4" />
                        Join Discord!
                    </a>
                    <a
                        href="https://github.com/Pillware/Pill"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={actionButtonClassName}
                    >
                        <Github className="w-4 h-4" />
                        GitHub
                    </a>
                </div>

            </div>

            {/* Floating tuner for the hero effect; sits above the content
                layer so the sliders stay clickable across the whole hero.
                Development only: import.meta.env.DEV is a build-time
                constant that Vite folds to false in production builds, so
                the panel (and the AuroraControls import) is tree-shaken
                away there - the tuner must never ship to visitors. */}
            {import.meta.env.DEV && (
                <AuroraControls
                    params={auroraParams}
                    onChange={handleAuroraParamChange}
                    onReset={handleAuroraReset}
                    isPaused={isAuroraPaused}
                    onTogglePause={handleAuroraPauseToggle}
                    fps={auroraFps}
                />
            )}
        </section>
    );
};

export default Hero;
