import { useNavigate } from "react-router-dom";
import { ArrowLeft, Package, Clock, CheckCircle, XCircle, Truck, Calendar, CreditCard, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import makeAuthenticatedRequest from "../utils/api";

const CustomerOrderGrid = () => {
    const [userData, setUserData] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [ordersLoading, setOrdersLoading] = useState(true);

    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const navigate = useNavigate();

    const goBack = () => {
        navigate(-1);
    };

    // Fetch user data
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                setLoading(true);
                const accessToken = localStorage.getItem("accessToken");

                if (!accessToken) {
                    setUserData(null);
                    setLoading(false);
                    navigate("/accountLogin");
                    return;
                }

                const response = await makeAuthenticatedRequest(
                    `${backendUrl}/api/user-auth/fetchCurrentUserInformation`
                );

                if (response.ok) {
                    const data = await response.json();
                    setUserData(data);
                } else {
                    console.error("Failed to fetch user data");
                    setUserData(null);
                    navigate("/accountLogin");
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
                setUserData(null);
                navigate("/accountLogin");
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [backendUrl, navigate]);

    // Fetch orders
    useEffect(() => {
        const fetchOrders = async () => {
            if (!userData?.user?.id) return;

            try {
                setOrdersLoading(true);
                const response = await makeAuthenticatedRequest(
                    `${backendUrl}/api/order-auth/getUserOrders`
                );

                if (response.ok) {
                    const data = await response.json();
                    setOrders(data.orders || []);
                } else {
                    console.error("Failed to fetch orders");
                    setOrders([]);
                }
            } catch (error) {
                console.error("Error fetching orders:", error);
                setOrders([]);
            } finally {
                setOrdersLoading(false);
            }
        };

        if (userData) {
            fetchOrders();
        }
    }, [userData, backendUrl]);

    // Status configuration
    const getStatusConfig = (status) => {
        const configs = {
            Pending: {
                icon: Clock,
                color: "text-yellow-500",
                bg: "bg-yellow-50 dark:bg-yellow-900/20",
                border: "border-yellow-200 dark:border-yellow-800",
                label: "Pending"
            },
            Processing: {
                icon: Package,
                color: "text-blue-500",
                bg: "bg-blue-50 dark:bg-blue-900/20",
                border: "border-blue-200 dark:border-blue-800",
                label: "Processing"
            },
            Shipped: {
                icon: Truck,
                color: "text-purple-500",
                bg: "bg-purple-50 dark:bg-purple-900/20",
                border: "border-purple-200 dark:border-purple-800",
                label: "Shipped"
            },
            Delivered: {
                icon: CheckCircle,
                color: "text-green-500",
                bg: "bg-green-50 dark:bg-green-900/20",
                border: "border-green-200 dark:border-green-800",
                label: "Delivered"
            },
            Cancelled: {
                icon: XCircle,
                color: "text-red-500",
                bg: "bg-red-50 dark:bg-red-900/20",
                border: "border-red-200 dark:border-red-800",
                label: "Cancelled"
            }
        };
        return configs[status] || configs.Pending;
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP'
        }).format(amount);
    };

    if (loading || ordersLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading your orders...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={goBack}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-4"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Back</span>
                    </button>

                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                My Orders
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                Track and manage your order history
                            </p>
                        </div>
                        <div className="hidden sm:flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow">
                            <Package className="w-5 h-5 text-blue-600" />
                            <span className="text-gray-900 dark:text-white font-semibold">
                                {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Orders List */}
                {orders.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center">
                        <Package className="w-20 h-20 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            No orders yet
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Start shopping to see your orders here
                        </p>
                        <button
                            onClick={() => navigate('/marketplace')}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                        >
                            Browse Marketplace
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order) => {
                            const statusConfig = getStatusConfig(order.status);
                            const StatusIcon = statusConfig.icon;

                            return (
                                <div
                                    key={order._id}
                                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                                >
                                    {/* Order Header */}
                                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                            <div className="flex items-start gap-4">
                                                <div className={`p-3 rounded-xl ${statusConfig.bg} ${statusConfig.border} border-2`}>
                                                    <StatusIcon className={`w-6 h-6 ${statusConfig.color}`} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                            Order #{order._id.slice(-8).toUpperCase()}
                                                        </h3>
                                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                                                            {statusConfig.label}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                        <Calendar className="w-4 h-4" />
                                                        <span>{formatDate(order.createdAt)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-left sm:text-right">
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                                    Total Amount
                                                </p>
                                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                                    {formatCurrency(order.totalValue)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Order Details */}
                                    <div className="p-6">
                                        {/* Business Info */}
                                        <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                                Business
                                            </p>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {order.businessId?.businessName || 'Unknown Business'}
                                            </p>
                                        </div>

                                        {/* Products */}
                                        <div className="mb-4">
                                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                                Items Ordered ({order.orderedProducts.length})
                                            </p>
                                            <div className="space-y-3">
                                                {order.orderedProducts.map((product, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                                                    >
                                                        <div className="flex items-center gap-3 flex-1">
                                                            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-lg overflow-hidden flex-shrink-0">
                                                                {product.productId?.imageUrl ? (
                                                                    <img 
                                                                        src={product.productId.imageUrl} 
                                                                        alt={product.productName}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center">
                                                                        <Package className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="font-medium text-gray-900 dark:text-white">
                                                                    {product.productName}
                                                                </p>
                                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                    Quantity: {product.quantity}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                                {formatCurrency(product.productPrice * product.quantity)}
                                                            </p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                {formatCurrency(product.productPrice)} each
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Additional Info */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                            {order.paymentMethod && (
                                                <div className="flex items-center gap-2">
                                                    <CreditCard className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                                    <div>
                                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                                            Payment Method
                                                        </p>
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {order.paymentMethod}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                            {order.deliveryAddress && (
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                                    <div>
                                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                                            Delivery Address
                                                        </p>
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {order.deliveryAddress}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerOrderGrid;
