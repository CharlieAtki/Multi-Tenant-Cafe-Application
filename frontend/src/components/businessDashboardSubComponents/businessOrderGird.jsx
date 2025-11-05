import { useState, useEffect } from "react";
import makeAuthenticatedRequest from "../../utils/api";
import { useOutletContext } from "react-router-dom";

const BusinessOrderGrid = () => {
  const { userData } = useOutletContext();

  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  // New: time range state
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30); // default: last 30 days
    return d.toISOString().split("T")[0];
  });

  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  });

  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const businessId = userData?.user?.businessId;

  const fetchAnalytics = async () => {
    if (!businessId) {
      setError("Business ID not provided");
      setLoading(false);
      return;
    }

    if (!startDate || !endDate) {
      setError("Please select both start and end dates");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await makeAuthenticatedRequest(
        `${backendUrl}/api/business-unAuth/analytics/timerange`,
        {
          method: "POST",
          body: JSON.stringify({
            businessId,
            startDate,
            endDate,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data.analyticsData);
      } else {
        setError("Failed to fetch analytics data");
      }
    } catch (err) {
      console.error("Error fetching analytics:", err);
      setError("An error occurred while fetching analytics");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch when component mounts
  useEffect(() => {
    fetchAnalytics();
  }, [businessId, backendUrl]);

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const closeModal = () => {
    setShowOrderModal(false);
    setSelectedOrder(null);
  };

  const { orders } = analyticsData || {};

  return (
    <div className="flex flex-col gap-6 p-6 bg-gray-100 dark:bg-gray-900 rounded-2xl">
      {/* Time Range Selector */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-end gap-4">
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 dark:text-gray-300 mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-gray-600 dark:text-gray-300 mb-1">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>

        <button
          onClick={fetchAnalytics}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors disabled:opacity-50"
        >
          {loading ? "Fetching..." : "Fetch Orders"}
        </button>
      </div>

      {/* Loading / Error States */}
      {loading && (
        <div className="flex items-center justify-center p-12">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading Orders...</p>
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="flex items-center justify-center p-12">
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-6 py-4 rounded-lg">
            <p className="font-semibold">Error loading analytics</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium mb-4 text-gray-700 dark:text-gray-200">
          Recent Orders
        </h3>
        {orders && orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Total Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-gray-100">
                      #{order._id.slice(-8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {order.userId?.email || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400">
                      £{order.totalValue.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        order.status === 'Delivered' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        order.status === 'Processing' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                        order.status === 'Shipped' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleViewOrder(order)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No recent orders available</p>
        )}
      </div>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Order Details
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Order ID: #{selectedOrder._id}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Order Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Customer</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {selectedOrder.userId?.email || 'N/A'}
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Order Date</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {new Date(selectedOrder.createdAt).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Status</span>
                  </div>
                  <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
                    selectedOrder.status === 'Delivered' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    selectedOrder.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                    selectedOrder.status === 'Processing' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                    selectedOrder.status === 'Shipped' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {selectedOrder.status}
                  </span>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Value</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    £{selectedOrder.totalValue.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Products List */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Ordered Products
                </h3>
                <div className="space-y-3">
                  {selectedOrder.orderedProducts.map((product, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {product.productName}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Quantity: {product.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          £{product.productPrice.toFixed(2)} each
                        </p>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          £{(product.productPrice * product.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 p-6">
              <button
                onClick={closeModal}
                className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-100 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessOrderGrid;
