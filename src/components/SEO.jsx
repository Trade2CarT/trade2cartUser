import React from 'react';
import { Helmet } from 'react-helmet-async';

/**
 * A reusable component to manage SEO-related head tags.
 * It sets the page title, meta description, and keywords.
 * @param {object} props - The component props.
 * @param {string} props.title - The title for the page.
 * @param {string} props.description - The meta description for search engines.
 * @param {string} [props.keywords] - Comma-separated keywords for the page.
 * @param {React.ReactNode} [props.children] - To include additional head elements like schemas.
 */
const SEO = ({ title, description, keywords, children }) => {
    return (
        <Helmet>
            <title>{title}</title>
            <meta name="description" content={description} />
            {keywords && <meta name="keywords" content={keywords} />}
            <meta name="author" content="Trade2Cart" />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:type" content="website" />
            <meta property="og:url" content="https://trade2cart.in" />
            <meta property="og:image" content="https://trade2cart.in/logo.png" />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content="https://trade2cart.in/logo.png" />
            {children}
        </Helmet>
    );
};

SEO.defaultProps = {
    title: 'Scrap Pickup & Recycling Platform – Sell Scrap Online | Trade2Cart India',
    description: 'Trade2Cart connects you with verified scrap buyers. Book scrap pickup online, get instant payment, and contribute to eco-friendly recycling in India.',
    keywords: 'Trade2Cart, scrap pickup service, sell scrap online, scrap buyer India, online scrap selling, eco-friendly recycling, waste management service'
};


export default SEO;