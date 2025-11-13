import NavigationBar from "../components/navigationBar";
import BusinessDashboardSideBar from "../components/businessDashboardSideBar";
import makeAuthenticatedRequest from "../utils/api.js";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";

const BusinessDashboardPage = () => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    const navigate = useNavigate();
    const location = useLocation();

    const userDataRef = useRef(null);

    const fetchUserData = async () => {
        try {
            const accessToken = localStorage.getItem("accessToken");
            if (!accessToken) {
                setUserData(null);
                return;
            }

            const response = await makeAuthenticatedRequest(
                `${backendUrl}/api/user-auth/fetchCurrentUserInformation`
            );

            if (response.ok) {
                const data = await response.json();

                const oldDataStr = JSON.stringify(userDataRef.current);
                const newDataStr = JSON.stringify(data);

                if (oldDataStr !== newDataStr) {
                    console.log("User data changed, updating state...");
                    setUserData(data);
                    userDataRef.current = data;
                }
            } else {
                console.error("Failed to fetch user data - Status:", response.status);
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
            setLoading(false);
        }
    };

    // Fetch once on mount or when path changes
    useEffect(() => {
        fetchUserData();
    }, [backendUrl, location.pathname]);

    // Poll every few seconds (only when visible)
    useEffect(() => {
        const interval = setInterval(() => {
            if (document.visibilityState === "visible" && localStorage.getItem("accessToken")) {
                fetchUserData();
            }
        }, 10_000); // every 10s

        return () => clearInterval(interval);
    }, [backendUrl]);

    // Redirect if user is not part of a business
    useEffect(() => {
        if (!loading && userData && !userData?.user?.business) {
            navigate("/marketplace");
        }
    }, [userData, loading, navigate]);

    // Handle loading and unauthenticated states
    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen text-gray-700 dark:text-gray-300">
                Loading...
            </div>
        );
    }

    if (!userData || !userData?.user?.business) {
        return null; // render nothing while redirecting
    }

    return (
        <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-800">
            <NavigationBar />
            <div className="flex flex-1 overflow-hidden">
                <BusinessDashboardSideBar />
                <main className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
                    <Outlet context={{ userData, loading }} />
                </main>
            </div>
        </div>
    );
};

export default BusinessDashboardPage;
