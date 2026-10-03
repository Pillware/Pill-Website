import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/sections/Navbar';
import Hero from './components/sections/Hero';
import Showcase from './components/sections/Showcase';
import FlagshipFeatures from './components/sections/FlagshipFeatures';
import CTA from './components/sections/CTA';
import CommunityCTA from './components/sections/CommunityCTA';
import Footer from './components/sections/Footer';
import SectionDivider from './components/effects/SectionDivider';
import Features from './components/sections/Features';
import Iteration from './components/sections/Iteration';
import PillLabs from './components/sections/PillLabs';
import Roadmap from './components/sections/Roadmap';
import Sponsor from './components/sections/Sponsor';
import Community from './components/sections/Community';
import Performance from './components/sections/Performance';
import Demos from './pages/Demos';

function Home() {
    return (
        <>
            <Navbar />
            <Hero />
            <div className="h-[70px]" />
            <Showcase />
            <div className="h-[70px]" />
            <SectionDivider label="Flagship features" />
            <FlagshipFeatures />
            <div className="h-[70px]" />
            <SectionDivider label="Performance" />
            <Performance />
            <div className="h-[70px]" />
            <SectionDivider label="Roadmap" />
            <Roadmap />
            {/* <div className="h-[70px] sm:h-0" />
            <SectionDivider label="Features"  />
            <Features /> */}
            <div className="h-[70px]" />
            {/* <SectionDivider label="Performance" />
            <Iteration /> */}
            <div className="h-[70px] sm:h-0" />
            <div className="section-divider" />
            <PillLabs />
            {/* <div className="h-[70px] sm:h-0" />
            <SectionDivider label="Community" />
            <Community />
            <Sponsor /> */}
            {/* <div className="h-[70px] sm:h-0" />
            <SectionDivider label="Let's go!" />
            <CTA /> */}
            <div className="h-[70px] sm:h-0" />
            <SectionDivider label="Join us" />
            <CommunityCTA />
            <Footer />
        </>
    );
}

// After a fresh load, scrolls to the URL-hash section (for example "/#roadmap"
// opened from a subpage), repeating the browser's fragment scroll once React
// has mounted the sections. Mount only on purpose: hash clicks fire popstate,
// so a location-driven effect would catch them and replace smooth scrolling.
const HashScrollHandler = () => {
    useEffect(() => {
        const { hash } = window.location;
        if (!hash) return;

        document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'instant' });
    }, []);

    return null;
};

function App() {
    return (
        <BrowserRouter>
            <HashScrollHandler />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/demos" element={<Demos />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
