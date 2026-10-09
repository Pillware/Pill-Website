import { Cpu, Package, Flame, Zap, Heart } from 'lucide-react';

// prettier-ignore
const usps = [
    {
        icon: <Cpu className="w-5 h-5" />,
        metric: '500K+',
        label: 'Entities in 60 FPS',
    },
    {
        icon: <Package className="w-5 h-5" />,
        metric: '<0.5 MB',
        label: 'WASM build',
    },
    {
        icon: <Flame className="w-5 h-5" />,
        metric: 'Instant ~1 sec',
        label: 'HOT reload',
    },
    {
        icon: <Zap className="w-5 h-5" />,
        metric: '<5 secs',
        label: 'Startup times',
    },
    {
        icon: <Heart className="w-5 h-5" />,
        metric: 'MIT',
        label: 'Open source, free forever',
    },
];

// Hairline separators between the spec-bar cells. Mobile is a two-column
// grid (left borders on the second column, top borders between the rows);
// on lg it becomes a single five-cell row, so only left borders remain.
// The last cell spans both columns on mobile, hence no left border.
const cellSeparators = [
    '',
    'border-l',
    'border-t lg:border-t-0 lg:border-l',
    'border-l border-t lg:border-t-0',
    'border-t lg:border-t-0 lg:border-l',
];

/**
 * Compact above-the-fold proof strip, rendered as one continuous spec-sheet
 * bar (see .spec-bar in index.css) split into five cells by hairline
 * separators. Mirrors the benchmark figures from the Performance section
 * cards so a visitor sees the numbers without scrolling.
 */
const UspStrip = () => {
    return (
        <div id="usp-strip" className="scroll-mt-24 spec-bar grid grid-cols-2 lg:grid-cols-5">
            {usps.map((usp, index) => (
                <div
                    key={usp.metric}
                    className={`border-white/[0.08] p-3 sm:p-4 flex flex-col items-center text-center gap-1.5 sm:gap-2 ${cellSeparators[index]} ${
                        index === usps.length - 1 ? 'col-span-2 lg:col-span-1' : ''
                    }`}
                >
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center">
                        {usp.icon}
                    </div>
                    <span className="text-xl sm:text-2xl font-bold text-white tabular-nums tracking-tight leading-none">
                        {usp.metric}
                    </span>
                    <span className="text-xs sm:text-sm text-gray-400 leading-snug">
                        {usp.label}
                    </span>
                </div>
            ))}
        </div>
    );
};

export default UspStrip;
