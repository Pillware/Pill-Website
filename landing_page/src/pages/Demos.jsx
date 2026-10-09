import Navbar from '../components/sections/Navbar';
import Footer from '../components/sections/Footer';
import VideoPlayer from '../components/elements/VideoPlayer';

const DEMO_ITEMS = [
    {
        title: 'Pill Teaser',
        video: '/images/xenium_30fps_1920.mp4',
        video4k: '/images/xenium_30fps_4k.mp4',
        image: '/images/xenium_rc1.gif',
    },
    {
        title: 'Ancient Pills',
        image: 'https://raw.githubusercontent.com/Pillware/Pill/circus_demo/examples/circus_demo/media/ancient_pills.gif',
    },
    {
        title: '<WORK IN PROGRESS>',
        image: '/images/secret_1.png'
    }
];

const Demos = () => {
    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white">
            <Navbar />
            <main className="pt-28 pb-24 px-6">
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-3xl md:text-4xl font-bold text-center mb-2">Demos</h1>
                    <p className="text-white/50 text-center mb-14">
                        A few examples of what Pill can do.
                    </p>
                    <div className="space-y-14">
                        {DEMO_ITEMS.map((item) => (
                            <section key={item.title}>
                                <h2 className="text-lg font-semibold text-white/80 mb-4">
                                    {item.title}
                                </h2>
                                <div className="rounded-xl overflow-hidden border border-white/[0.06] bg-white/[0.02]">
                                    {item.video ? (
                                        <VideoPlayer
                                            src={item.video}
                                            src4k={item.video4k}
                                            showQualityControl={!!item.video4k}
                                        />
                                    ) : (
                                        <img
                                            src={item.image}
                                            alt={item.title}
                                            className="w-full h-auto"
                                            loading="lazy"
                                        />
                                    )}
                                </div>
                            </section>
                        ))}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Demos;
