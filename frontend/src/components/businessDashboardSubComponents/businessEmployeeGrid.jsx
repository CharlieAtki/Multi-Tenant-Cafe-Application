import { useState, useEffect } from "react";
import { Users, UserPlus, Check, X, Mail, Crown, Loader2 } from "lucide-react";
import makeAuthenticatedRequest from "../../utils/api";

const BusinessEmployeeGrid = () => {
    const [businessData, setBusinessData] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch current user data
            const userResponse = await makeAuthenticatedRequest(
                `${backendUrl}/api/user-auth/fetchCurrentUserInformation`
            );

            if (!userResponse.ok) {
                throw new Error("Failed to fetch user data");
            }

            const userDataResult = await userResponse.json();
            const user = userDataResult.user ?? userDataResult;
            setUserData(user);

            // Check if user has a business
            if (!user.business?.businessId) {
                setError("You are not associated with any business");
                setLoading(false);
                return;
            }

            // Fetch business data with populated employees and onboarding requests
            const businessResponse = await makeAuthenticatedRequest(
                `${backendUrl}/api/business-unAuth/fetchCurrentBusinessInfo`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ businessId: user.business.businessId }),
                }
            );

            if (!businessResponse.ok) {
                throw new Error("Failed to fetch business data");
            }

            const businessDataResult = await businessResponse.json();
            setBusinessData(businessDataResult.businessData);

        } catch (err) {
            console.error("Error fetching data:", err);
            setError(err.message || "Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptRequest = async (userEmail) => {
        try {
            setActionLoading(userEmail);
            setError(null);
            setSuccessMessage(null);

            const response = await makeAuthenticatedRequest(
                `${backendUrl}/api/business-unAuth/acceptOnboardingRequest`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        businessId: userData.business.businessId,
                        userEmail: userEmail,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to accept request");
            }

            setSuccessMessage(`Successfully added ${userEmail} to your business!`);
            
            // Refresh business data
            await fetchData();

            // Clear success message after 3 seconds
            setTimeout(() => setSuccessMessage(null), 3000);

        } catch (err) {
            console.error("Error accepting request:", err);
            setError(err.message || "Failed to accept request");
        } finally {
            setActionLoading(null);
        }
    };

    const handleRejectRequest = async (userEmail) => {
        try {
            setActionLoading(userEmail);
            setError(null);
            setSuccessMessage(null);

            const response = await makeAuthenticatedRequest(
                `${backendUrl}/api/business-unAuth/rejectOnboardingRequest`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        businessId: userData.business.businessId,
                        userEmail: userEmail,
                    }),
                }
            );

            if (!response.ok) {
                throw new Error(data.message || "Failed to reject request");
            }

            setSuccessMessage(`Successfully rejected ${userEmail} from your business!`);

            // Refresh business data
            await fetchData();

            // Clear success message after 3 seconds
            setTimeout(() => setSuccessMessage(null), 3000);

        } catch (err) {
            console.error("Error rejecting request:", err);
            setError(err.message || "Failed to reject request");
        } finally {
            setActionLoading(null);
        }
    };

    const handleRemoveEmployee = async (userEmail) => {
        try {
            setActionLoading(userEmail);
            setError(null);
            setSuccessMessage(null);

            const response = await makeAuthenticatedRequest(
                `${backendUrl}/api/business-unAuth/removeEmployeeFromBusiness`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        businessId: userData.business.businessId,
                        userEmail: userEmail,
                    }),
                }
            );

            if (!response.ok) {
                throw new Error(data.message || "Failed to remove employee");
            }

            setSuccessMessage(`Successfully removed ${userEmail} from your business!`);

            // Refresh business data
            await fetchData();

            // Clear success message after 3 seconds
            setTimeout(() => setSuccessMessage(null), 3000);

        } catch (err) {
            console.error("Error removing employee:", err);
            setError(err.message || "Failed to remove employee");
        } finally {
            setActionLoading(null);
        }
    }

    // Defining if the current user is the business owner (True/False)
    const isOwner = userData?.business?.userRole === "owner";

    const isEmployee = userData?.business?.userRole === "employee";

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-700 dark:text-gray-300">Loading business data...</p>
                </div>
            </div>
        );
    }

    if (error && !businessData) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg max-w-md">
                    <div className="text-center">
                        <X className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                            Error
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                        {businessData?.businessName}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Manage your team and onboarding requests
                    </p>
                </div>

                {/* Success/Error Messages */}
                {successMessage && (
                    <div className="bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg mb-6">
                        <div className="flex items-center gap-2">
                            <Check className="w-5 h-5" />
                            <span>{successMessage}</span>
                        </div>
                    </div>
                )}

                {error && businessData && (
                    <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-6">
                        <div className="flex items-center gap-2">
                            <X className="w-5 h-5" />
                            <span>{error}</span>
                        </div>
                    </div>
                )}

                {/* Pending Onboarding Requests
                    If the user is the owner of the business, show onboarding requests. */}
                {isOwner && businessData?.onBoardingRequests?.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6">
                        <div className="flex items-center gap-2 mb-4">
                            <UserPlus className="w-6 h-6 text-blue-600" />
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                                Pending Requests
                            </h2>
                            <span className="bg-blue-600 text-white text-sm font-semibold px-2 py-1 rounded-full">
                                {businessData.onBoardingRequests.length}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {businessData.onBoardingRequests.map((request) => (
                                <div
                                    key={request._id}
                                    className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl border-2 border-blue-200 dark:border-blue-800"
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
                                            <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                                                {request.email}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleAcceptRequest(request.email)}
                                            disabled={actionLoading === request.email}
                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {actionLoading === request.email ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <Check className="w-4 h-4" />
                                                    Accept
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleRejectRequest(request.email)}
                                            disabled={actionLoading === request.email}
                                            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <X className="w-4 h-4" />
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Current Employees */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Users className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                            Team Members
                        </h2>
                        <span className="bg-gray-600 text-white text-sm font-semibold px-2 py-1 rounded-full">
                            {businessData?.employees?.length || 0}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {businessData?.employees?.map((employee) => {
                            const isBusinessOwner = employee._id === businessData.owner._id;
                            
                            return (
                                <div
                                    key={employee._id}
                                    className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl border border-gray-200 dark:border-gray-600"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${
                                            isBusinessOwner 
                                                ? 'bg-yellow-100 dark:bg-yellow-900' 
                                                : 'bg-gray-200 dark:bg-gray-600'
                                        }`}>
                                            {isBusinessOwner ? (
                                                <Crown className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                                            ) : (
                                                <Mail className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                                                {employee.email}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {isBusinessOwner ? 'Owner' : 'Employee'}
                                            </p>
                                        </div>

                                        {/* Remove user from the business */}
                                        {isOwner && employee.email !== userData.email && (
                                            <div>
                                                <button
                                                onClick={() => handleRemoveEmployee(employee.email)}
                                                className="
                                                    flex items-center justify-center
                                                    w-8 h-8
                                                    rounded-full
                                                    bg-red-500 text-white
                                                    hover:bg-red-600 hover:scale-110
                                                    active:scale-95
                                                    transition-all duration-200
                                                    shadow-md hover:shadow-lg
                                                "
                                                title="Remove Employee"
                                                >
                                                <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {businessData?.employees?.length === 0 && (
                        <div className="text-center py-8">
                            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 dark:text-gray-400">
                                No team members yet
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BusinessEmployeeGrid;
