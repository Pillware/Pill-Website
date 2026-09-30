import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Foldout card: the FeatureCard surface (glass panel, icon box, title) with
 * a collapsible description. Clicking the icon/title header toggles the
 * body; the header sits inside the <h3> per the ARIA accordion pattern.
 * The body animation is pure CSS (grid-rows 0fr -> 1fr trick), so it works
 * with content of any height without measuring it in JS.
 *
 * @param {React.ReactNode} props.icon     - Icon shown in the header box
 * @param {string}          props.title    - Foldout title
 * @param {React.ReactNode} props.children - Collapsible body content
 */
const FeatureFoldout = ({ icon, title, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    // Unique id linking the toggle button to the region it controls.
    const contentId = useId();

    return (
        <div className="glass-card-top group p-6">
            <h3 className="text-lg font-semibold text-white">
                <button
                    type="button"
                    onClick={() => setIsOpen((open) => !open)}
                    aria-expanded={isOpen}
                    aria-controls={contentId}
                    className="w-full text-left cursor-pointer"
                >
                    {/* Icon box (FeatureCard style) + toggle chevron */}
                    <span className="flex items-start justify-between mb-4">
                        <span className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400 group-hover:bg-brand-500/20 transition-colors duration-300">
                            {icon}
                        </span>
                        <ChevronDown
                            aria-hidden="true"
                            className={`w-5 h-5 text-gray-500 mt-2.5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                        />
                    </span>
                    {title}
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
                    <p className="pt-2 text-md text-gray-500 leading-relaxed">{children}</p>
                </div>
            </div>
        </div>
    );
};

export default FeatureFoldout;
