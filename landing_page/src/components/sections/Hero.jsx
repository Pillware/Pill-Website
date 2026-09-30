import { ArrowRight, Github } from 'lucide-react';
import DiscordIcon from '../DiscordIcon';
import Dither from '../effects/Dither';
import UspStrip from './UspStrip';

// Shared base class for the hero action buttons (Get Started / Discord /
// GitHub). Fixed width on sm+ so all three buttons render at the same size.
// transition-colors (NOT transition-all): a width change (scrollbar flip,
// resize) must never be animated, or the buttons visibly "scale to fit".
const actionButtonClassName = 'inline-flex items-center justify-center gap-2 w-full sm:w-48 px-8 py-3.5 bg-white/[0.04] border border-white/[0.08] text-white font-semibold rounded-xl hover:bg-white/[0.08] hover:border-white/[0.14] transition-colors duration-200 text-base';

const Hero = () => {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
            {/* Dither background */}
            <div className="absolute inset-0 overflow-hidden z-0" style={{ willChange: 'transform', transform: 'translateZ(0)' }}>
                <Dither
                    waveColor={[0.6, 0.6, 0.6]}
                    disableAnimation={false}
                    enableMouseInteraction={false}
                    mouseRadius={0.25}
                    colorNum={5}
                    waveAmplitude={0.24}
                    waveFrequency={2.5}
                    waveSpeed={0.03}
                />
            </div>

            {/* Background glow orbs - Raycast style */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="glow-orb w-[800px] h-[800px] bg-brand-400/10 -top-40 -right-40 animate-orb-pulse" />
                <div className="glow-orb w-[600px] h-[600px] bg-brand-500/8 bottom-0 -left-40 animate-orb-pulse" style={{ animationDelay: '3s' }} />
                <div className="glow-orb w-[400px] h-[400px] bg-brand-400/5 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-orb-pulse" style={{ animationDelay: '1.5s' }} />
            </div>

            {/* Subtle grid pattern */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                    backgroundSize: '64px 64px',
                }}
            />

            <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                {/* Logo */}
                <div className="mb-4 sm:mb-6 animate-fade-in">
                    <img
                        src="/logos/pill_logo.svg"
                        alt="Pill Engine"
                        className="h-[120px] sm:h-[200px] md:h-[220px] xl:h-[280px] mx-auto"
                    />
                </div>

                {/* Headline */}
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white leading-[1.1] tracking-tight mb-4 sm:mb-[48px] animate-fade-in-up">
                    Modern, <span className="text-gradient">free</span> and <span className="text-gradient">blazingly fast</span> game engine<br/>
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
                        className={actionButtonClassName}
                    >
                        <DiscordIcon className="w-4 h-4" />
                        Discord
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
        </section>
    );
};

export default Hero;
