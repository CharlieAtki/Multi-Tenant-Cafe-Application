import { useState } from "react";

/**
 * GraphControls Component
 * Provides filtering controls for business analytics graphs including:
 * - Date range selection (presets + custom)
 * - Metric selection toggles
 * - Data granularity (daily, weekly, monthly)
 * - Export functionality
 */
const GraphControls = ({ 
  onDateRangeChange, 
  onMetricToggle, 
  availableMetrics = [],
  selectedMetrics = [],
  onGranularityChange,
  currentGranularity = "weekly",
  showExport = true,
  onExport
}) => {
  const [dateRange, setDateRange] = useState("7days");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [showCustomRange, setShowCustomRange] = useState(false);

  const dateRangePresets = [
    { value: "7days", label: "Last 7 Days" },
    { value: "30days", label: "Last 30 Days" },
    { value: "90days", label: "Last 90 Days" },
    { value: "6months", label: "Last 6 Months" },
    { value: "1year", label: "Last Year" },
    { value: "custom", label: "Custom Range" }
  ];

  const granularityOptions = [
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" }
  ];

  const handleDateRangeChange = (value) => {
    setDateRange(value);
    
    if (value === "custom") {
      setShowCustomRange(true);
      return;
    }
    
    setShowCustomRange(false);
    
    // Calculate date range
    const end = new Date();
    let start = new Date();
    
    switch(value) {
      case "7days":
        start.setDate(end.getDate() - 7);
        break;
      case "30days":
        start.setDate(end.getDate() - 30);
        break;
      case "90days":
        start.setDate(end.getDate() - 90);
        break;
      case "6months":
        start.setMonth(end.getMonth() - 6);
        break;
      case "1year":
        start.setFullYear(end.getFullYear() - 1);
        break;
      default:
        start.setDate(end.getDate() - 7);
    }
    
    if (onDateRangeChange) {
      onDateRangeChange({ start, end });
    }
  };

  const handleCustomDateApply = () => {
    if (customStartDate && customEndDate) {
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      
      if (start > end) {
        alert("Start date must be before end date");
        return;
      }
      
      if (onDateRangeChange) {
        onDateRangeChange({ start, end });
      }
    }
  };

  const handleMetricToggle = (metric) => {
    if (onMetricToggle) {
      onMetricToggle(metric);
    }
  };

  const handleGranularityChange = (value) => {
    if (onGranularityChange) {
      onGranularityChange(value);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 mb-4">
      <div className="flex flex-wrap gap-4 items-end">
        
        {/* Date Range Selector */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Date Range
          </label>
          <select
            value={dateRange}
            onChange={(e) => handleDateRangeChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     transition-all duration-200"
          >
            {dateRangePresets.map(preset => (
              <option key={preset.value} value={preset.value}>
                {preset.label}
              </option>
            ))}
          </select>
        </div>

        {/* Custom Date Range */}
        {showCustomRange && (
          <>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleCustomDateApply}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg
                       transition-colors duration-200 font-medium"
            >
              Apply
            </button>
          </>
        )}

        {/* Granularity Selector */}
        {onGranularityChange && (
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              View By
            </label>
            <select
              value={currentGranularity}
              onChange={(e) => handleGranularityChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {granularityOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Export Button */}
        {showExport && onExport && (
          <button
            onClick={onExport}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg
                     transition-colors duration-200 font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
        )}
      </div>

      {/* Metric Toggles */}
      {availableMetrics.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Display Metrics
          </label>
          <div className="flex flex-wrap gap-3">
            {availableMetrics.map(metric => (
              <button
                key={metric.key}
                onClick={() => handleMetricToggle(metric.key)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  selectedMetrics.includes(metric.key)
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {metric.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GraphControls;
