/**
 * GraphSkeleton Component
 * Beautiful loading placeholder for graphs
 */
const GraphSkeleton = ({ height = "400px" }) => {
    return (
        <div className="animate-pulse w-full" style={{ height }}>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 h-full">
                {/* Title skeleton */}
                <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
                
                {/* Chart area */}
                <div className="flex items-end justify-between h-[calc(100%-3rem)] gap-2">
                    {/* Bars */}
                    {[60, 80, 40, 90, 70, 50, 85].map((height, index) => (
                        <div 
                            key={index}
                            className="flex-1 bg-gradient-to-t from-blue-300 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-t-lg"
                            style={{ height: `${height}%` }}
                        ></div>
                    ))}
                </div>
                
                {/* X-axis labels */}
                <div className="flex justify-between mt-4">
                    {[1, 2, 3, 4, 5, 6, 7].map((_, index) => (
                        <div 
                            key={index}
                            className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-12"
                        ></div>
                    ))}
                </div>
            </div>
        </div>
    );
};

/**
 * StatCardSkeleton Component
 * Loading placeholder for stat cards
 */
export const StatCardSkeleton = () => {
    return (
        <div className="animate-pulse bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-2/3 mb-3"></div>
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
    );
};

/**
 * TableSkeleton Component
 * Loading placeholder for data tables
 */
export const TableSkeleton = ({ rows = 5, columns = 3 }) => {
    return (
        <div className="animate-pulse">
            {/* Header */}
            <div className="flex gap-4 mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                {Array.from({ length: columns }).map((_, i) => (
                    <div key={i} className="flex-1 h-4 bg-gray-300 dark:bg-gray-700 rounded"></div>
                ))}
            </div>
            
            {/* Rows */}
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div key={rowIndex} className="flex gap-4 mb-3">
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <div key={colIndex} className="flex-1 h-4 bg-gray-200 dark:bg-gray-800 rounded"></div>
                    ))}
                </div>
            ))}
        </div>
    );
};

export default GraphSkeleton;
