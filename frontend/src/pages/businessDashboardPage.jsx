import NavigationBar from "../components/navigationBar";
import BusinessDashboardSideBar from "../components/businessDashboardSideBar";
import makeAuthenticatedRequest from "../utils/api.js";
import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";

const BusinessDashboardPage = () => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tokenCheck, setTokenCheck] = useState(Date.now());

    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                setLoading(true);
                const accessToken = localStorage.getItem("accessToken");

                if (!accessToken) {
                    setUserData(null);
                    setLoading(false);
                    return;
                }

                const response = await makeAuthenticatedRequest(
                    `${backendUrl}/api/user-auth/fetchCurrentUserInformation`
                );

                if (response.ok) {
                    const data = await response.json();
                    
                    setUserData(data);
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

    return (
        <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-800">
            <NavigationBar />
            <div className="flex flex-1 overflow-hidden">
                <BusinessDashboardSideBar />
                <main className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
                    <Outlet context={{ userData }} />
                </main>
            </div>
        </div>
    );
};

export default BusinessDashboardPage;
