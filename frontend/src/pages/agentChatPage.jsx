// frontend/src/pages/agentChatPage.jsx
import NavigationBar from "../components/navigationBar";
import AgentChatInterfaceComponent from "../components/agentChatInterfaceComponent.jsx";
import { useEffect, useState } from "react";
import makeAuthenticatedRequest from "../utils/api.js";

const AgentChatPage = () => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
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
                    setUserData(null);
                    localStorage.removeItem("accessToken");
                    localStorage.removeItem("refreshToken");
                    localStorage.removeItem("user");
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
                setUserData(null);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [backendUrl]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading your orders...</p>
                </div>
            </div>
        );
    }

    if (!userData || !userData.user) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-700">
                <p className="text-gray-700 dark:text-gray-200 text-lg">Please sign in to chat with the agent.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900">
            <NavigationBar />
            <div className="p-6">
                <AgentChatInterfaceComponent userData={userData.user} />
            </div>
        </div>
    );
};

export default AgentChatPage;
