import { useId } from 'react';

// One half of the divider: a fading gradient line rendered on each side of
// the label. `reverse` mirrors the gradient direction for the right side.
// Each instance gets its own id so the two gradient definitions never collide
// (a url(#...) reference resolves to the first matching element in the DOM).
const DividerLine = ({ reverse = false }) => {
    const id = useId().replace(/[^a-zA-Z0-9]/g, '');
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="372"
            height="2"
            viewBox="0 0 272 2"
            fill="none"
            className="flex-shrink-0 min-w-0"
            preserveAspectRatio="none"
        >
            <path
                d={reverse ? 'M0 1L271.5 1' : 'M272 1L0.5 0.999976'}
                stroke={`url(#divider-${id})`}
            />
            <defs>
                <linearGradient
                    id={`divider-${id}`}
                    x1={reverse ? '-0.500003' : '272.5'}
                    y1={reverse ? '0.501689' : '1.49831'}
                    x2={reverse ? '271.5' : '0.500004'}
                    y2={reverse ? '1.00169' : '0.998287'}
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#ECA5A7" />
                    <stop offset="0.165137" stopColor="#581D27" />
                    <stop offset="1" stopColor="#190E14" />
                </linearGradient>
            </defs>
        </svg>
    );
};

const SectionDivider = ({ label }) => (
    <div className="flex items-center justify-center gap-4 py-8 px-4 max-w-full overflow-hidden">
        <DividerLine />
        <span className="text-md font-semibold text-brand-300 tracking-widest uppercase flex-shrink-0">
            {label}
        </span>
        <DividerLine reverse />
    </div>
);

export default SectionDivider;
