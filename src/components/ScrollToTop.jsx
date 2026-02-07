import { useLocation } from 'react-router-dom';
import { useLayoutEffect } from 'react';

const ScrollToTop = () => {
    const { pathname } = useLocation();

    useLayoutEffect(() => {
        // Fallback for window scrolling
        window.scrollTo(0, 0);

        // Targeted scrolling for the main content container in MainLayout
        const mainContainer = document.getElementById('main-scroll-container');
        if (mainContainer) {
            mainContainer.scrollTo({
                top: 0,
                left: 0,
                behavior: 'instant' // Use instant to prevent smooth scroll conflict during nav
            });
        }
    }, [pathname]);

    return null;
}

export default ScrollToTop;