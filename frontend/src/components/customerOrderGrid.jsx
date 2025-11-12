import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, X, Plus, Minus } from "lucide-react";
import { useState, useEffect } from "react";
import makeAuthenticatedRequest from "../utils/api";

const CustomerOrderGrid = () => {
    const [userData, setUserData] = useState(null)
    const [loading, setLoading] = useState(true);
    const [tokenCheck, setTokenCheck] = useState(Date.now()); // Add this state

    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    const navigate = useNavigate();

    const goBack = () => {
        navigate(-1)
    }

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
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
            <div className="w-full max-w-3xl mb-4">
                <button
                    onClick={goBack}
                    className="flex items-center gap-2 text-gray-400 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Back</span>
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-10 w-full max-w-3xl">
                <div>
                    <h1 className="text-gray-400 dark:text-gray-300 font-semibold text-2xl">
                        Orders
                    </h1>
                </div>

            </div>
        </div>
    );
};


export default CustomerOrderGrid
