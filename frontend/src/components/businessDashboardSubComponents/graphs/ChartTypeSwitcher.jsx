import { useState } from "react";

/**
 * ChartTypeSwitcher Component
 * Allows users to switch between different chart visualization types
 */
const ChartTypeSwitcher = ({ 
    currentType = "line", 
    onTypeChange,
    availableTypes = ["line", "bar", "area"]
}) => {
    const chartTypes = [
        { 
            value: "line", 
            label: "Line Chart", 
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
            )
        },
        { 
            value: "bar", 
            label: "Bar Chart", 
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            )
        },
        { 
            value: "area", 
            label: "Area Chart", 
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M7 12l3-3 3 3 4-4M3 21l8-8 3 3 6-6M21 12.5V18a2 2 0 01-2 2H5a2 2 0 01-2-2v-5.5" />
                </svg>
            )
        },
        { 
            value: "pie", 
            label: "Pie Chart", 
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
            )
        }
    ];

    const filteredTypes = chartTypes.filter(type => availableTypes.includes(type.value));

    return (
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            {filteredTypes.map(type => (
                <button
                    key={type.value}
                    onClick={() => onTypeChange(type.value)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200 ${
                        currentType === type.value
                            ? 'bg-white dark:bg-gray-700 shadow-md text-blue-600 dark:text-blue-400'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50'
                    }`}
                    title={type.label}
                >
                    {type.icon}
                    <span className="text-sm font-medium hidden sm:inline">{type.label}</span>
                </button>
            ))}
        </div>
    );
};

export default ChartTypeSwitcher;
