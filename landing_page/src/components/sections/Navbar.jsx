import { Fragment, useState, useEffect } from 'react';

// Section links use absolute home-page paths so they also open the main
// page when the navbar is rendered on a subpage like /demos. A bare "#hash"
// would only rewrite the current URL and leave the visitor where they are.
const NAV_LINKS = [
    { label: 'Features', href: '/#flagship-features' },
    { label: 'Roadmap', href: '/#roadmap' },
    { label: 'Demos', href: '/demos' },
    { label: 'Guide', href: `https://docs.${window.location.hostname}` },
    { label: 'Examples', href: 'https://github.com/Pillware/Pill/tree/main/examples' },
    // Discord + GitHub are the community pair; on desktop a hairline splits
    // them from the section links (dividerBefore renders the line).
    { label: 'Discord', href: 'https://discord.gg/VUKNQrctms', dividerBefore: true },
    { label: 'GitHub', href: 'https://github.com/Pillware/Pill' },
];

// Obfuscated to avoid email-harvesting bots: full address is assembled at runtime.
const CONTACT_EMAIL = ['contact', '@', 'pillengine', '.', 'org'].join('');

const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav
            id="navbar"
            className={`fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-24px)] max-w-[var(--container-max)] rounded-xl navbar-glass ${scrolled ? 'navbar-scrolled' : ''}`}
        >
            <div className="flex items-center justify-between h-14 px-5">
                {/* Logo */}
                <div className="flex items-center gap-3">
                    <a href="/" className="flex items-center gap-2.5 group">
                        <img
                            src="/logos/pill_logo_white.svg"
                            alt="Pill Engine"
                            className="h-12 w-12 transition-transform duration-200 group-hover:scale-105"
                        />
                    </a>
                </div>

                {/* Desktop nav links */}
                <div className="hidden md:flex items-center gap-1">
                    {NAV_LINKS.map((link) => (
                        <Fragment key={link.label}>
                            {/* Light hairline between the section links and the Discord/GitHub pair */}
                            {link.dividerBefore && (
                                <span className="w-px h-5 bg-white/10 mx-1" aria-hidden="true" />
                            )}
                            <a
                                href={link.href}
                                className="px-3.5 py-1.5 text-[13px] font-medium text-white/50 hover:text-white rounded-md hover:bg-white/[0.06] transition-all duration-150"
                            >
                                {link.label}
                            </a>
                        </Fragment>
                    ))}
                </div>

                {/* Mobile hamburger - right side, animates into an X when open */}
                <button
                    type="button"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="md:hidden flex flex-col gap-1 p-1.5"
                    aria-label="Toggle menu"
                    aria-expanded={mobileOpen}
                >
                    <div className={`w-4 h-px bg-white/60 transition-all duration-300 ease-in-out ${mobileOpen ? 'translate-y-[5px] rotate-45' : ''}`} />
                    <div className={`w-4 h-px bg-white/60 transition-all duration-300 ease-in-out ${mobileOpen ? 'opacity-0' : ''}`} />
                    <div className={`w-4 h-px bg-white/60 transition-all duration-300 ease-in-out ${mobileOpen ? '-translate-y-[5px] -rotate-45' : ''}`} />
                </button>
            </div>

            {/* Mobile menu - animated fold (grid rows 0fr -> 1fr) */}
            <div
                className={`md:hidden grid transition-all duration-300 ease-in-out ${mobileOpen ? 'grid-rows-[1fr] opacity-100 visible' : 'grid-rows-[0fr] opacity-0 invisible'}`}
                aria-hidden={!mobileOpen}
            >
                <div className="overflow-hidden">
                    <div className="border-t border-white/[0.06] px-5 py-4 space-y-1">
                        {/* Close the fold after selection: hash links load instantly and would
                            otherwise leave the menu open, covering the section it scrolled to. */}
                        {NAV_LINKS.map((link) => (
                            <Fragment key={link.label}>
                                {/* Light hairline between the section links and the Discord/GitHub pair */}
                                {link.dividerBefore && (
                                    <div className="h-px bg-white/10 my-2 " aria-hidden="true" />
                                )}
                                <a
                                    href={link.href}
                                    onClick={() => setMobileOpen(false)}
                                    className="block px-3 py-3 text-md font-medium text-white/50 hover:text-white rounded-md hover:bg-white/[0.06] transition-all duration-150"
                                >
                                    {link.label}
                                </a>
                            </Fragment>
                        ))}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
