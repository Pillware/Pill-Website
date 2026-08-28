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
import PillDemo from './components/sections/PillDemo';

function App() {
    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white">
            <Navbar />
            <Hero />
            <PillDemo />
            <Features />
            <SectionDivider label="Performance" />
            <Iteration />
            <div className="section-divider"/>
            <PillLabs />
            <SectionDivider label="Roadmap" />
            <Roadmap />
            <SectionDivider label="Community" />
            <Community />
            <div className="section-divider"/>

            <Sponsor />
            <SectionDivider label="Let's go!" />
            <CTA />
            <Footer />
        </div>
    );
}

export default App;
