import MarketplaceGrid from "../components/marketPlaceGrid";
import NavigationBar from "../components/navigationBar";
import { ShoppingCart, ArrowUpIcon } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import makeAuthenticatedRequest from "../utils/api.js";
import MarketplaceFilter from "../components/marketplaceFilter.jsx";

const MarketplacePage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tokenCheck, setTokenCheck] = useState(Date.now());
    const [filters, setFilters] = useState({
        search: "",
        minPrice: "",
        maxPrice: "",
        category: "",
        business: "",
        sort: "relevance"
    });

    // UseSates for managing the scroll user-feedback
    const [scrollProgress, setScrollProgress] = useState(0);
    const [scrollVisible, setScrollVisible] = useState(false)

    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    const fetchUserData = async (showLoader = true) => {
        try {
            if (showLoader) {
                setLoading(true);
            }
            const accessToken = localStorage.getItem("accessToken");

            if (!accessToken) {
                setUserData(null);
                if (showLoader) {
                    setLoading(false);
                }
                return;
            }

            const response = await makeAuthenticatedRequest(
                `${backendUrl}/api/user-auth/fetchCurrentUserInformation`
            );

            if (response.ok) {
                const data = await response.json();
                setUserData(data);
                console.log("User data fetched:", data);
            } else {
                console.error("Failed to fetch user data");
                setUserData(null);
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
                localStorage.removeItem("user");
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
            setUserData(null);
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("user");
        } finally {
            if (showLoader) {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        fetchUserData();
    }, [backendUrl, location.pathname, tokenCheck]);

    useEffect(() => {
        const checkTokenChange = () => {
            setTokenCheck(Date.now());
        };

        const interval = setInterval(() => {
            const currentAccessToken = localStorage.getItem("accessToken");
            if (currentAccessToken && !userData) {
                checkTokenChange();
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [userData]);

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

    // Callback function to refresh user data after checkout update
    const handleCheckoutUpdate = async () => {
        await fetchUserData(false); // false = don't show loading spinner
    };

    const handleCheckout = (userData) => {
        if (!userData || !userData.user) {
            alert("Please sign in to view your cart");
            return;
        }
        navigate("/checkout", { state: userData });
    };

    // Safely calculate the total quantity of items in the user's checkout basket.
    // If any item is missing a quantity, treat it as 0. If the basket is undefined, default to 0.
    const cartItemCount = userData?.user?.checkoutBasket?.reduce((sum, item) => {
        return sum + (item?.quantity || 0);
    }, 0) || 0;

    // Full-screen loader while backend or token check is in progress
    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-800">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-gray-300 border-t-green-500 rounded-full animate-spin"></div>
                    <p className="text-gray-700 dark:text-gray-200 font-medium text-lg">
                        Connecting to server...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen dark:bg-gray-800">
            {/* Progress Bar */}
            <div className="fixed top-0 left-0 w-full h-1 z-50">
                <div
                    className="h-full bg-indigo-600 transition-all duration-150 ease-out"
                    style={{ width: `${scrollProgress}%` }}
                />
            </div>

            <NavigationBar />

            <MarketplaceFilter 
                filters={filters}
                onChange={setFilters}
            />

            <MarketplaceGrid 
                userData={userData} 
                onCheckoutUpdate={handleCheckoutUpdate}
                filters={filters}
            />

            {/* Floating Cart Button with Badge */}
            <button
                onClick={() => handleCheckout(userData)}
                className={`fixed bottom-6 right-6 p-4 rounded-full shadow-lg transition-all duration-300 ${
                    userData && userData.user 
                        ? 'bg-gray-600 hover:bg-green-500 hover:scale-110' 
                        : 'bg-gray-400 cursor-not-allowed'
                }`}
                disabled={!userData || !userData.user}
            >
                <ShoppingCart className="w-6 h-6 text-white" />
                {cartItemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                        {cartItemCount}
                    </span>
                )}
            </button>

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

export default MarketplacePage;
