/**
 * Shared feature card: glass surface with a top hairline highlight, an icon,
 * a title and a description. Used by the sponsor, community, labs and
 * iteration sections.
 *
 * @param {React.ReactNode} props.icon           - Icon shown in the header box
 * @param {string}         props.title           - Card title
 * @param {string}         props.description     - Body text
 * @param {string}         props.titleClassName  - Extra classes for the title
 */
const FeatureCard = ({ icon, title, description, titleClassName = 'text-lg' }) => (
    <div className="glass-card-top p-6 group">
        <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400 mb-4 group-hover:bg-brand-500/20 transition-colors duration-300">
            {icon}
        </div>
        <h3 className={`${titleClassName} font-semibold text-white mb-2`}>
            {title}
        </h3>
        <p className="text-md text-gray-500 leading-relaxed">
            {description}
        </p>
    </div>
);

export default FeatureCard;
