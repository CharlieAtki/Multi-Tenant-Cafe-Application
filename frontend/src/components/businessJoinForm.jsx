import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {ArrowLeft} from "lucide-react";
import makeAuthenticatedRequest from "../utils/api";

const BusinessJoinForm = () => {
    const [userData, setUserData] = useState(null)
    const [input, setInput] = useState({ businessName: "" }); // initialize empty owner
    const [businessNameInputError, setBusinessNameInputError] = useState(false);
    const [businessNameInputValidityError, setBusinessNameInputValidityError] = useState(false);
    const [loading, setLoading] = useState(true);
    const [tokenCheck, setTokenCheck] = useState(Date.now()); // Add this state

    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                setLoading(true);
                const accessToken = localStorage.getItem('accessToken');

                // Don't fetch user data if no token exists
                if (!accessToken) {
                    setUserData(null);
                    setLoading(false);
                    return;
                }

                const response = await makeAuthenticatedRequest(`${backendUrl}/api/user-auth/fetchCurrentUserInformation`);

                if (response.ok) {
                    const data = await response.json();
                    // backend returns { success: true, user: { id, email, ... } }
                    setUserData(data.user ?? data);
                    console.log('User data fetched:', data); // Debug log
                } else {
                    console.error('Failed to fetch user data');
                    setUserData(null);
                    // Clear invalid tokens
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('user');
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
                setUserData(null);
                // Clear invalid tokens
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [backendUrl, tokenCheck]); // removed undefined `location` dependency

    // Add this effect to check for token changes
    useEffect(() => {
        const checkTokenChange = () => {
            setTokenCheck(Date.now());
        };

        // Check for token changes every time the component might need to update
        const interval = setInterval(() => {
            const currentAccessToken = localStorage.getItem('accessToken');
            if (currentAccessToken && !userData) {
                checkTokenChange();
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [userData]);

    // Update input.owner once userData is available
    useEffect(() => {
        // userData is set to the backend's `user` object (which contains `id`)
        if (userData?.id) {
            setInput((prev) => ({ ...prev, owner: userData.id }));
        }
    }, [userData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setInput((prevInput) => ({ ...prevInput, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault(); // prevent page reload
        setBusinessNameInputError(false);
        setBusinessNameInputValidityError(false);

        let hasError = false;

        if (!input.businessName.trim()) {
            setBusinessNameInputError(true);
            hasError = true;
        }

        // You can add more validation here if needed

        if (hasError) return;

        try {
        const response = await fetch(`${backendUrl}/api/business-unAuth/joinBusiness`, {
            method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
            credentials: "include",
            body: JSON.stringify({ businessName: input.businessName, userEmail: userData.email}),
        });

        const data = await response.json();
        console.log('Create business response:', response.status, data);

        if (response.ok) {
            // Business created successfully
            // You can navigate the user or update UI here
            navigate("/businessDashboard"); // e.g., redirect to dashboard
        } else {
            // Handle backend errors (e.g., business name already taken)
            if (data.field === "businessName") {
                setBusinessNameInputError(true);
            } else {
            // handle other errors or show generic error
                alert(data.message || "Failed to create business");
            }
        }
        } catch (err) {
            console.error("Error creating business:", err);
            alert("Something went wrong. Please try again.");
        }
    };

    const navigate = useNavigate();

    const goBack = () => {
        navigate(-1);
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            {/* Back Button Above Box */}
            <div className="w-full max-w-md mb-4">
                <button
                    onClick={goBack}
                    className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Back</span>
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg w-full max-w-md">
                <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-6">
                    Join a Business
                </h2>
                <form className="space-y-4">
                    <div className="flex flex-col">
                        <label htmlFor="businessName" className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                            Business Name
                        </label>
                        <input
                            type="text"
                            id="businessName"
                            name="businessName"
                            className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            required
                            value={input.businessName}
                            onChange={handleChange}
                        />
                        {businessNameInputError && <p className="text-red-500 text-sm mt-1">Business name already taken</p>}
                        {businessNameInputValidityError && <p className="text-red-500 text-sm mt-1">Invalid business name</p>}
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
                        onClick={handleSubmit}
                    >
                        Join Business
                    </button>
                </form>
            </div>
        </div>
    );
};

export default BusinessJoinForm;
