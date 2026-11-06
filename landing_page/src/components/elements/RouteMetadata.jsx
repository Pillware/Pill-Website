import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ROUTE_METADATA, SITE_NAME, buildCanonicalUrl } from '../../lib/siteMetadata';

// Creates or updates one <meta> tag selected by its attribute.
function setMetaTag(attributeName, attributeValue, content) {
    let element = document.head.querySelector(`meta[${attributeName}="${attributeValue}"]`);
    if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attributeName, attributeValue);
        document.head.append(element);
    }
    element.setAttribute('content', content);
}

// Creates or updates the <link rel="canonical"> element.
function setCanonicalLink(href) {
    let element = document.head.querySelector('link[rel="canonical"]');
    if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', 'canonical');
        document.head.append(element);
    }
    element.setAttribute('href', href);
}

// Mirrors the static route metadata while the visitor navigates inside the SPA.
// Crawlers already receive these values in the per-route HTML written by
// scripts/generate-route-pages.mjs; this keeps the live document consistent for
// client-side navigation and for tools that inspect the DOM.
const RouteMetadata = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        // A trailing slash resolves to the same route. Unknown paths keep the
        // static head untouched instead of claiming the home canonical.
        const normalizedPath = pathname.length > 1 ? pathname.replace(/\/+$/, '') : '/';
        const metadata = ROUTE_METADATA[normalizedPath];
        if (!metadata) return;

        const canonicalUrl = buildCanonicalUrl(metadata);
        document.title = metadata.title;
        setMetaTag('name', 'description', metadata.description);
        setMetaTag('property', 'og:site_name', SITE_NAME);
        setMetaTag('property', 'og:title', metadata.title);
        setMetaTag('property', 'og:description', metadata.description);
        setMetaTag('property', 'og:url', canonicalUrl);
        setCanonicalLink(canonicalUrl);
    }, [pathname]);

    return null;
};

export default RouteMetadata;
