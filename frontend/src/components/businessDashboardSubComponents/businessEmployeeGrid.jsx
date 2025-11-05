import { useOutletContext } from "react-router-dom";
import makeAuthenticatedRequest from "../../utils/api";
import { useEffect, useState } from "react";

const BusinessEmployeeGrid = () => {
    const { userData } = useOutletContext();

    const [businessData, setBusinessData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const businessId = userData?.user?.businessId;

    const fetchCurrentBusinessInfo = async () => {
        try {
            setLoading(true);
            setError(null);

            if (!businessId) {
                setError("Business ID is missing.");
                return;
            }

            const response = await makeAuthenticatedRequest(
                `${backendUrl}/api/business-unAuth/fetchCurrentBusinessInfo`,
                {
                    method: "POST",
                    body: JSON.stringify({ businessId }),
                }
            );

            if (response.ok) {
                const data = await response.json();
                setBusinessData(data.businessData);
                console.log("Fetched business info:", data);
            } else {
                setError("Failed to fetch business information.");
            }
        } catch (err) {
            console.error("Error fetching business info:", err);
            setError("Failed to load business information.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCurrentBusinessInfo();
    }, [businessId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                    <p className="text-gray-600 dark:text-gray-300">Loading Business Info...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-6 py-4 rounded-lg">
                    <p className="font-semibold">Error loading business info</p>
                    <p className="text-sm">{error}</p>
                </div>
            </div>
        );
    }

    if (!businessData) return null;

    return (
        <div className="flex flex-col gap-6 p-6 bg-gray-100 dark:bg-gray-900 rounded-2xl">
            <h1 className="text-gray-600 text-xl font-semibold">
                Business Info: {businessData.businessName}
            </h1>

            <table className="min-w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800">
                <thead className="bg-gray-200 dark:bg-gray-700">
                    <tr>
                        <th className="border px-4 py-2 text-left">Business Name</th>
                        <th className="border px-4 py-2 text-left">Owner</th>
                        <th className="border px-4 py-2 text-left">Employees</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="border px-4 py-2">{businessData.businessName}</td>
                        <td className="border px-4 py-2">
                            {businessData.owner?.email || "N/A"}
                        </td>
                        <td className="border px-4 py-2">
                            {businessData.employees && businessData.employees.length > 0 ? (
                                <ul className="list-disc list-inside">
                                    {businessData.employees.map((emp) => (
                                        <li key={emp._id}>{emp.email}</li>
                                    ))}
                                </ul>
                            ) : (
                                <span>No employees</span>
                            )}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

export default BusinessEmployeeGrid;
