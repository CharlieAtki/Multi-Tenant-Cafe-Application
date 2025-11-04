import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, X, Plus, Minus } from "lucide-react";
import { useState } from "react";
import makeAuthenticatedRequest from "../utils/api";
import { useEffect } from "react";

const CheckoutOrdersGrid = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    const [userData, setUserData] = useState(location.state);
    const [updatingItem, setUpdatingItem] = useState(null);
    const [updatingCheckoutValue, setUpdatingCheckoutValue] = useState(null); // Used for spinners
    const [totalCheckoutValue, setTotalCheckoutValue] = useState(null);

    // Call the route on component mount
    useEffect(() => {
        const fetchTheCheckoutTotalCost = async () => {
            setUpdatingCheckoutValue(true); // Show loading animation

            try {
                const response = await makeAuthenticatedRequest(
                    `${backendUrl}/api/user-auth/calculateTotalCheckoutValue`,
                    {
                        method: "POST",
                        body: JSON.stringify({
                            userCheckoutBasket: userData.user.checkoutBasket,
                            userEmail: userData.user.email
                        })
                    }
                );

                const data = await response.json();

                if (data.success) {
                    setTotalCheckoutValue(data.total); // ✅ Fix: use setTotalCheckoutValue
                } else {
                    alert("Failed to calculate total checkout value");
                }
            } catch (error) {
                console.error("Error calculating the total cost of the checkout:", error);
            } finally {
                setUpdatingCheckoutValue(false); // Done loading
            }
        };

        fetchTheCheckoutTotalCost();
    }, [userData.user.checkoutBasket]);  // Optional: rerun when basket changes

    

    const goBack = () => {
        navigate(-1);
    };

    const updateQuantity = async (productId, newQuantity) => {
        if (newQuantity < 1) return;

        setUpdatingItem(productId);

        try {
            const response = await makeAuthenticatedRequest(
                `${backendUrl}/api/user-auth/updateCheckoutQuantity`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        productId,
                        quantity: newQuantity,
                        userEmail: userData.user.email
                    })
                }
            );

            const data = await response.json();

            if (data.success) {
                // Update local state with new basket
                setUserData({
                    ...userData,
                    user: {
                        ...userData.user,
                        checkoutBasket: data.checkoutBasket
                    }
                });
            } else {
                alert("Failed to update quantity");
            }
        } catch (error) {
            console.error("Error updating quantity:", error);
            alert("An error occurred while updating quantity");
        } finally {
            setUpdatingItem(null);
        }
    };

    const removeItem = async (productId) => {
        setUpdatingItem(productId);

        try {
            const response = await makeAuthenticatedRequest(
                `${backendUrl}/api/user-auth/removeFromCheckout`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        productId,
                        userEmail: userData.user.email
                    })
                }
            );

            const data = await response.json();

            if (data.success) {
                // Update local state with new basket
                setUserData({
                    ...userData,
                    user: {
                        ...userData.user,
                        checkoutBasket: data.checkoutBasket
                    }
                });
            } else {
                alert("Failed to remove item");
            }
        } catch (error) {
            console.error("Error removing item:", error);
            alert("An error occurred while removing item");
        } finally {
            setUpdatingItem(null);
        }
    };

    // Access the nested user object
    if (!userData || !userData.user || !userData.user.checkoutBasket) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <p className="text-gray-400">No items in your basket.</p>
            </div>
        );
    }

    const checkoutBasket = userData.user.checkoutBasket;

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
                <h1 className="text-3xl font-semibold mb-6 text-gray-500 dark:text-gray-100">
                    Checkout
                </h1>
                
                {checkoutBasket.length === 0 ? (
                    <p className="text-gray-400 dark:text-gray-300 mb-6">
                        Your cart is empty.
                    </p>
                ) : (
                    <>
                        <p className="text-gray-400 dark:text-gray-300 mb-6">
                            Review your items before completing your order.
                        </p>

                        <ul className="space-y-4">
                            {checkoutBasket.map((item, index) => (
                                <li
                                    key={index}
                                    className="border border-gray-300 dark:border-gray-700 rounded-lg p-4 flex items-center justify-between gap-4"
                                >
                                    <div className="flex-1">
                                        <span className="text-gray-700 dark:text-gray-200 font-medium">
                                            {item.productName}
                                        </span>
                                    </div>

                                    {/* Quantity Controls */}
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                            disabled={item.quantity <= 1 || updatingItem === item.productId}
                                            className="p-1 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                        >
                                            <Minus className="w-4 h-4 text-gray-700 dark:text-gray-200" />
                                        </button>

                                        <span className="text-gray-700 dark:text-gray-200 font-semibold min-w-[2rem] text-center">
                                            {item.quantity}
                                        </span>

                                        <button
                                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                            disabled={updatingItem === item.productId}
                                            className="p-1 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                        >
                                            <Plus className="w-4 h-4 text-gray-700 dark:text-gray-200" />
                                        </button>
                                    </div>

                                    {/* Remove Button */}
                                    <button
                                        onClick={() => removeItem(item.productId)}
                                        disabled={updatingItem === item.productId}
                                        className="p-2 rounded-full bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                    >
                                        {updatingItem === item.productId ? (
                                            <svg className="animate-spin h-5 w-5 text-red-600 dark:text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        ) : (
                                            <X className="w-5 h-5 text-red-600 dark:text-red-400" />
                                        )}
                                    </button>
                                </li>
                            ))}
                        </ul>

                        {/* Total cost section */}
                        <div className="pt-6 mt-6 border-t border-gray-300 dark:border-gray-700">
                            <div className="flex justify-between items-center text-lg font-semibold text-gray-800 dark:text-white">
                                <span>Total:</span>
                                {updatingCheckoutValue ? (
                                    <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <span className="text-green-600 dark:text-green-400">
                                        £{totalCheckoutValue?.toFixed(2) ?? "0.00"}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Checkout button */}
                        <button className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-md transition"
                            onClick={handleOrderCompletion}>
                            Proceed to Checkout
                        </button>

                    </>
                )}
            </div>
        </div>
    );
};

export default CheckoutOrdersGrid;
