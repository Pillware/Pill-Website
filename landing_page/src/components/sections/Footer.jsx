import { Github } from 'lucide-react';
import DiscordIcon from '../elements/DiscordIcon';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    const footerLinks = {
        Product: [
            { label: 'Guide', href: `https://docs.${window.location.hostname}/guide/` },
            { label: 'Examples', href: 'https://github.com/Pillware/Pill/tree/main/examples' },
            { label: 'GitHub', href: 'https://github.com/Pillware/Pill' },
            { label: 'Contributing', href: `https://docs.${window.location.hostname}/guide/contributing/contributing.html` },
        ],
    };

    return (
        <footer
            id="footer"
            className="relative py-16 px-4 sm:px-6 lg:px-8 border-t border-white/[0.06]"
        >
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col lg:flex-row justify-between gap-y-8 md:gap-x-8 mb-16">
                    {/* Brand */}
                    <div className="col-span-2 md:col-span-1">
                        <a href="/" className="flex items-center">
                            <img
                                src="/logos/pill_logo_white.svg"
                                alt="Pill Engine"
                                className="size-20"
                            />
                        </a>
                        <p className="text-lg text-gray-500 mb-4 max-w-xs leading-relaxed">
                            Modern, free and blazingly fast game engine.
                        </p>
                        <p className="text-md text-gray-500 mb-4 max-w-xs leading-relaxed">
                            Dual licensed MIT or Apache-2.0. No royalties, no revenue share, no seat
                            licences.
                        </p>
                    </div>

                    <div className="flex gap-2 md:gap-8 mb-16">
                        {/* Link columns */}
                        {Object.entries(footerLinks).map(([category, links]) => (
                            <div className="min-w-[40%] sm:min-w-[180px]" key={category}>
                                <div key={category}>
                                    <h3 className="text-lg font-semibold text-white mb-4">
                                        {category}
                                    </h3>
                                    <ul className="space-y-3">
                                        {links.map((link) => (
                                            <li key={link.label}>
                                                <a
                                                    href={link.href}
                                                    className="text-md text-gray-500 hover:text-gray-300 transition-colors duration-200"
                                                >
                                                    {link.label}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}

                        {/* Newsletter / Subscribe */}
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-4">
                                Stay updated
                            </h3>
                            <p className="text-md text-gray-500 mb-3 leading-relaxed">
                                Get product updates and news. <br/>No spam.
                            </p>
                            <div className="flex flex-col items-start gap-3">
                                <a
                                    href="https://github.com/Pillware/Pill"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-[180px] inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-white/[0.05] border border-white/[0.08] rounded-lg hover:bg-white/[0.08] transition-all duration-200"
                                >
                                    <Github className="w-4 h-4" />
                                    Star on GitHub
                                </a>
                                <a
                                    href="https://discord.gg/VUKNQrctms"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-[180px] inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-white/[0.05] border border-white/[0.08] rounded-lg hover:bg-white/[0.08] transition-all duration-200"
                                >
                                    <DiscordIcon className="w-4 h-4" />
                                    Join Discord
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-lg text-gray-500">
                        &copy; {currentYear} Pill. Fueled by passion.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
