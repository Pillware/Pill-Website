
import VideoPlayer from '../VideoPlayer';

const SHOWCASE_ITEMS = [
    {
        title: 'Pill Teaser',
        video: '/images/xenium_30fps_1920.mp4',
        videoHighQuality: '/images/xenium_30fps_4k.mp4',
    },
];

const Showcase = () => {
    return (
        <section
            id="showcase"
            className="relative scroll-mt-24 py-8 sm:py-10 px-4 sm:px-6 lg:px-8"
        >
            <div className="max-w-6xl mx-auto">
                {/* Release status - a pill chip with a live pulsing dot, then
                    a departure-board style date: small caps label over the
                    oversized date, flanked by hairlines that fade outward. */}
                <div className="text-center mb-10 sm:mb-14">
                    <p className="inline-flex items-center gap-2.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-1.5 mb-4 sm:mb-5">
                        <span className="relative flex h-2 w-2" aria-hidden="true">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-400" />
                        </span>
                        <span className="text-xs sm:text-sm font-semibold tracking-wider sm:tracking-widest uppercase text-brand-300">
                            Pill is currently under heavy architecture rework
                        </span>
                    </p>
                    <h2 className="flex flex-col items-center gap-2 sm:gap-3">
                        <span className="text-sm sm:text-base font-semibold tracking-widest uppercase text-gray-400">
                            v1.0 ETA
                        </span>
                        <span className="flex w-full items-center justify-center gap-4 sm:gap-8">
                            <span className="h-px w-12 sm:w-32 bg-gradient-to-r from-transparent to-brand-300/50" aria-hidden="true" />
                            <span className="text-5xl sm:text-6xl text-gradient leading-none tracking-tight">Q1/2027</span>
                            <span className="h-px w-12 sm:w-32 bg-gradient-to-l from-transparent to-brand-300/50" aria-hidden="true" />
                        </span>
                    </h2>
                </div>

                <div className="space-y-14">
                    {/* On mobile the player is given a tall fixed height and the
                        video crops (object-fit: cover) to fill it, so it reads
                        larger on the height dimension; desktop shows it whole. */}
                    {SHOWCASE_ITEMS.map((item) => (
                        <VideoPlayer
                            key={item.title}
                            src={item.video}
                            src4k={item.videoHighQuality}
                            showQualityControl={Boolean(item.videoHighQuality)}
                            cover
                            className="h-[70vh] sm:h-auto"
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Showcase;
