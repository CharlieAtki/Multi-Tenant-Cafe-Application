import {
    PieChart,
    Pie,
    ResponsiveContainer,
    Cell,
    Tooltip,
    Legend,
} from "recharts";
import { useState } from "react";

/**
 * BusinessPieChart Component
 * Displays data in a circular pie chart with interactive segments
 */
const BusinessPieChart = ({ 
    graphData, 
    dataKey = "value",
    nameKey = "name",
    enableAnimation = true,
    showPercentage = true,
    innerRadius = 0, // Set > 0 for donut chart
    colors = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#6366f1", "#f43f5e"]
}) => {
    const [activeIndex, setActiveIndex] = useState(null);

    const onPieEnter = (_, index) => {
        setActiveIndex(index);
    };

    const onPieLeave = () => {
        setActiveIndex(null);
    };

    // Calculate total for percentage
    const total = graphData?.reduce((sum, entry) => sum + (entry[dataKey] || 0), 0) || 0;

    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={graphData}
                    dataKey={dataKey}
                    nameKey={nameKey}
                    cx="50%"
                    cy="50%"
                    innerRadius={innerRadius}
                    outerRadius="80%"
                    paddingAngle={2}
                    animationDuration={enableAnimation ? 800 : 0}
                    onMouseEnter={onPieEnter}
                    onMouseLeave={onPieLeave}
                    label={showPercentage ? renderCustomLabel : false}
                >
                    {graphData?.map((entry, index) => (
                        <Cell 
                            key={`cell-${index}`} 
                            fill={colors[index % colors.length]}
                            opacity={activeIndex === null || activeIndex === index ? 1 : 0.6}
                            style={{ 
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                        />
                    ))}
                </Pie>
                <Tooltip content={<CustomTooltip dataKey={dataKey} total={total} />} />
                <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    iconType="circle"
                    wrapperStyle={{
                        paddingTop: "10px",
                    }}
                />
            </PieChart>
        </ResponsiveContainer>
    );
};

// Custom label renderer for pie segments
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.05) return null; // Hide labels for small segments

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text
            x={x}
            y={y}
            fill="white"
            textAnchor={x > cx ? 'start' : 'end'}
            dominantBaseline="central"
            fontSize="14"
            fontWeight="bold"
            style={{ 
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                pointerEvents: 'none' 
            }}
        >
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

// Enhanced Custom Tooltip
const CustomTooltip = ({ active, payload, dataKey, total }) => {
    if (active && payload && payload.length) {
        const data = payload[0];
        const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : 0;

        return (
            <div className="p-4 bg-slate-900 border-2 border-blue-500 flex flex-col gap-2 rounded-lg shadow-xl">
                <p className="text-medium text-lg text-white font-bold border-b border-gray-700 pb-2">
                    {data.name}
                </p>
                <p className="text-sm text-gray-300">
                    <span className="font-medium">Value:</span>
                    <span className="ml-2 font-bold text-white">
                        {typeof data.value === 'number' && dataKey === 'revenue' 
                            ? `£${data.value.toFixed(2)}`
                            : data.value.toLocaleString()
                        }
                    </span>
                </p>
                <p className="text-sm text-blue-400">
                    <span className="font-medium">Share:</span>
                    <span className="ml-2 font-bold">{percentage}%</span>
                </p>
            </div>
        );
    }
    return null;
};

export default BusinessPieChart;
