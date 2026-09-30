import { useEffect, useRef, useState } from 'react';
import { BookOpen, ArrowRight } from 'lucide-react';
import PixelSwap from '../effects/PixelSwap';

const CTA = () => {
    const [swapActive, setSwapActive] = useState(false);
    const cardRef = useRef(null);

    // Trigger the pixel swap once when the card scrolls into view, and never
    // again for the rest of the page display. A scroll-position check is used
    // instead of an IntersectionObserver so it works deterministically.
    useEffect(() => {
        const card = cardRef.current;
        if (!card || typeof window === 'undefined') return undefined;

        let triggered = false;

        const checkInView = () => {
            if (triggered) return;
            const rect = card.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            // Fire once the card's top edge has entered the bottom 80% of the viewport.
            if (rect.top < viewportHeight * 0.8 && rect.bottom > 0) {
                triggered = true;
                setSwapActive(true);
                window.removeEventListener('scroll', checkInView);
                window.removeEventListener('resize', checkInView);
            }
        };

        checkInView();
        window.addEventListener('scroll', checkInView, { passive: true });
        window.addEventListener('resize', checkInView);
        return () => {
            window.removeEventListener('scroll', checkInView);
            window.removeEventListener('resize', checkInView);
        };
    }, []);

    return (
        <section className="relative py-8 sm:py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                {/* Main CTA card */}
                <div
                    ref={cardRef}
                    className="glass-card p-7 sm:p-12 md:p-16 relative overflow-hidden glass-reflection"
                >
                    {/* Pixel-swap background - swaps from subtle to brand glow once
                        when the card scrolls into view */}
                    <PixelSwap
                        className="absolute inset-0"
                        trigger="manual"
                        gap={2}
                        pattern="random"
                        pixelSize={64}
                        pixelScale={0.35}
                        pixelRadius={0}
                        duration={1400}
                        pixelDuration={450}
                        persistPixels
                        active={swapActive}
                        firstContent={
                            <div
                                className="w-full h-full"
                                style={{ background: 'radial-gradient(circle at 30% 20%, rgba(0,0,0,0.345), transparent 55%)' }}
                            />
                        }
                        secondContent={
                            <div
                                className="w-full h-full"
                                style={{ background: 'radial-gradient(circle at 70% 80%, rgba(255,68,68,0.28), rgba(255,68,68,0.04) 45%, transparent 70%)' }}
                            />
                        }
                    />

                    <div className="relative z-10">
                        <h2 className="text-3xl sm:text-4xl md:text-5xl  text-white leading-[1.15] tracking-tight mb-4">
                            Start Building Today
                        </h2>
                        <p className="text-xl text-gray-400 max-w-2xl mb-10 leading-relaxed">
                            Thinking about new projects? Want to switch to a modern engine? <br />
                            Or just curious about what Pill can do?
                            We've got documentation, examples, and a supportive community to help you get started.
                        </p>

                        <a
                            href={`https://docs.${window.location.hostname}/guide/`}
                            className="group inline-flex items-center gap-2 px-8 py-3.5 bg-brand-500 hover:bg-brand-400 text-white font-semibold rounded-xl transition-all duration-200 text-base"
                        >
                            <BookOpen className="w-4 h-4" />
                            Start with Pill Guide
                            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CTA;
