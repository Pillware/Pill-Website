import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Foldout card: the FeatureCard surface (glass panel, icon tile, title) with
 * a collapsible description. The whole foldout surface toggles the body -
 * the header button carries the card padding, so clicks anywhere on the card
 * (padding included) count, not just on the row with the icon and title. The
 * button sits inside the <h3> per the ARIA accordion pattern. The body
 * animation is pure CSS (grid-rows 0fr -> 1fr trick), so it works with
 * content of any height without measuring it in JS. The root carries
 * `foldout-card` and `data-open`, which a parent `.foldout-grid` reads for
 * the sibling spotlight (currently disabled in index.css).
 *
 * @param {React.ReactNode} props.icon     - Icon shown in the tile
 * @param {string}          props.title    - Foldout title
 * @param {React.ReactNode} props.children - Collapsible body content
 */
const FeatureFoldout = ({ icon, title, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    // Unique id linking the toggle button to the region it controls.
    const contentId = useId();

    return (
        <div className="glass-card-top group foldout-card" data-open={isOpen}>
            {/* The button carries the card padding, so the whole foldout
                surface - padding included - is one click target. */}
            <h3 className="text-lg font-semibold text-white">
                <button
                    type="button"
                    onClick={() => setIsOpen((open) => !open)}
                    aria-expanded={isOpen}
                    aria-controls={contentId}
                    className="w-full text-left cursor-pointer p-4 sm:p-6"
                >
                    {/* Icon tile, title and toggle chevron all in one row */}
                    <span className="flex items-center gap-3">
                        <span className="feature-icon w-10 h-10 flex-shrink-0 flex items-center justify-center text-brand-400">
                            {icon}
                        </span>
                        <span className="flex-1 min-w-0">{title}</span>
                        <ChevronDown
                            aria-hidden="true"
                            className={`w-5 h-5 flex-shrink-0 text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                        />
                    </span>
                </button>
            </h3>

            {/* Collapsible body - invisible when closed so its text can't be
                selected or read by assistive tech. */}
            <div
                id={contentId}
                aria-hidden={!isOpen}
                className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100 visible' : 'grid-rows-[0fr] opacity-0 invisible'}`}
            >
                <div className="overflow-hidden">
                    <p className="px-6 pb-6 text-md text-gray-400 leading-relaxed">{children}</p>
                </div>
            </div>
        </div>
    );
};

export default FeatureFoldout;
