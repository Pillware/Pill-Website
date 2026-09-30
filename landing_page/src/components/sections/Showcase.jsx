
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
                {/* Release status - small label above the large ETA line */}
                <div className="text-center mb-10 sm:mb-14">
                    <p className="text-sm sm:text-base font-semibold tracking-widest uppercase text-brand-300 mb-3">
                        Pill is currently under very heavy rework
                    </p>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl text-white leading-[1.15] tracking-tight">
                        v1.0 ETA <span className="text-gradient">Q1/2027</span>
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
