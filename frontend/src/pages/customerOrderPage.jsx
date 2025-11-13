import CustomerOrderGrid from "../components/customerOrderGrid"
import NavigationBar from "../components/navigationBar";
import { useState, useEffect } from "react";
import { ArrowUpIcon } from "lucide-react";

const CustomerOrderPage = () => {
    // UseSates for managing the scroll user-feedback
    const [scrollProgress, setScrollProgress] = useState(0);
    const [scrollVisible, setScrollVisible] = useState(false)

    // Handle scroll progress and button visibility
    useEffect(() => {
        const handleScroll = () => {
            // Calculate scroll progress
            const winScroll = document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (winScroll / height) * 100;
            setScrollProgress(scrolled);
            setScrollVisible(winScroll > 700);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <div>
            <NavigationBar />
            <CustomerOrderGrid />

            {/* Floating Scroll-to-Top Button */}
            <button
                onClick={scrollToTop}
                className={`fixed bottom-6 left-6 p-4 rounded-full shadow-lg transition-all duration-300 ${
                scrollVisible
                    ? "opacity-100 scale-100"
                    : "opacity-0 scale-90 pointer-events-none"
                } bg-indigo-600 hover:bg-indigo-700 text-white`}
                aria-label="Scroll to top"
            >
                <ArrowUpIcon className="w-6 h-6" />
            </button>
        </div>
    );
};

export default CustomerOrderPage
