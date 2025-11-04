import { useState, useEffect } from "react";
import BusinessSalesLineChart from "./graphs/businessSalesLineChart";
import BusinessAreaChart from "./graphs/businessAreaChart";
import BusinessBarChart from "./graphs/businessBarChart";
import makeAuthenticatedRequest from "../../utils/api";
import { useOutletContext } from 'react-router-dom';

const BusinessAnalyticsGrid = ( ) => {
  const { userData } = useOutletContext();

  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const businessId = userData?.user?.businessId;

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!businessId) {
        setError("Business ID not provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await makeAuthenticatedRequest(
          `${backendUrl}/api/business-unAuth/analytics`,
          {
            method: "POST",
            body: JSON.stringify({ businessId })
          }
        );

        if (response.ok) {
          const data = await response.json();
          setAnalyticsData(data.analytics);
          setError(null);
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

    fetchAnalytics();
  }, [businessId, backendUrl]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-6 py-4 rounded-lg">
          <p className="font-semibold">Error loading analytics</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-gray-600 dark:text-gray-300">No analytics data available</p>
      </div>
    );
  }

  const { overview, salesByWeek, revenueByDayOfWeek, topProducts, ordersByStatus } = analyticsData;

  return (
    <div className="flex flex-col gap-6 p-6 bg-gray-100 dark:bg-gray-900 rounded-2xl">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Total Revenue
          </h3>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
            £{overview.totalRevenue?.toFixed(2) || "0.00"}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Total Orders
          </h3>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {overview.totalOrders || 0}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Average Order Value
          </h3>
          <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
            £{overview.averageOrderValue?.toFixed(2) || "0.00"}
          </p>
        </div>
      </div>

      {/* Top large chart - Sales by Week */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 h-[500px] w-full">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
          Sales Over Time (Last 7 Weeks)
        </h2>
        {salesByWeek && salesByWeek.length > 0 ? (
          <BusinessSalesLineChart
            data={salesByWeek}
            metricOne="Total Sales"
            metricTwo="Number of Orders"
            metricOneUnit="GBP"
            metricTwoUnit="Orders"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No sales data available for the past 7 weeks</p>
          </div>
        )}
      </div>

      {/* Bottom smaller charts grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Revenue by Day of Week */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 h-96">
          <h3 className="text-lg font-medium mb-3 text-gray-700 dark:text-gray-200">
            Sales by Day of Week
          </h3>
          {revenueByDayOfWeek && revenueByDayOfWeek.length > 0 ? (
            <BusinessAreaChart
              data={revenueByDayOfWeek}
              metricOne="Total Sales"
              metricTwo="Number of Orders"
              metricOneUnit="GBP"
              metricTwoUnit="Orders"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">No data available</p>
            </div>
          )}
        </div>

        {/* Order Status Distribution */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 h-96">
          <h3 className="text-lg font-medium mb-3 text-gray-700 dark:text-gray-200">
            Order Status
          </h3>
          {ordersByStatus && ordersByStatus.length > 0 ? (
            <div className="h-full flex flex-col justify-center gap-3">
              {ordersByStatus.map((status, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="font-medium text-gray-700 dark:text-gray-200">
                    {status._id}
                  </span>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {status.count}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">No order status data</p>
            </div>
          )}
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium mb-4 text-gray-700 dark:text-gray-200">
          Top Selling Products
        </h3>
        {topProducts && topProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Quantity Sold
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {topProducts.map((product, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {product.productName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {product.totalQuantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400 font-semibold">
                      £{product.totalRevenue.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No product sales data available</p>
        )}
      </div>
    </div>
  );
};

export default BusinessAnalyticsGrid;
