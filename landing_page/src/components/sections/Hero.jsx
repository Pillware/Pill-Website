import { useState } from 'react';
import { ArrowRight, Github } from 'lucide-react';
import DiscordIcon from '../DiscordIcon';
import Aurora, { defaultAuroraParams } from '../effects/Aurora';
import AuroraControls from '../effects/AuroraControls';
import UspStrip from './UspStrip';

// Shared base class for the hero action buttons (Get Started / Discord /
// GitHub). Fixed width on sm+ so all three buttons render at the same size.
// transition-colors (NOT transition-all): a width change (scrollbar flip,
// resize) must never be animated, or the buttons visibly "scale to fit".
// The drop shadow lifts all three off the animated glass backdrop.
const actionButtonBaseClassName = 'inline-flex items-center justify-center gap-2 w-full sm:w-48 px-8 py-3.5 text-white font-semibold rounded-xl transition-colors duration-200 text-base shadow-lg shadow-black/40';
const actionButtonClassName = `${actionButtonBaseClassName} bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.14]`;
// Discord is the community channel, so it wears the brand red like the
// other Discord CTAs on the site. The border matches the background so the
// button keeps the exact same size as its glass siblings.
const discordButtonClassName = `${actionButtonBaseClassName} bg-brand-500 hover:bg-brand-400 border border-brand-500 hover:border-brand-400`;

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
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
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
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white leading-[1.1] tracking-tight mb-4 sm:mb-[48px] animate-fade-in-up hero-headline-shadow">
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
                layer so the sliders stay clickable across the whole hero. */}
            <AuroraControls
                params={auroraParams}
                onChange={handleAuroraParamChange}
                onReset={handleAuroraReset}
                isPaused={isAuroraPaused}
                onTogglePause={handleAuroraPauseToggle}
                fps={auroraFps}
            />
        </section>
    );
};

export default Hero;
