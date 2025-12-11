import {
    AreaChart,
    Area,
    ResponsiveContainer,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    Brush,
} from "recharts";
import {useEffect, useState} from "react";

const BusinessAreaChart = ({ 
    graphData, 
    metricOne, 
    metricTwo, 
    metricOneUnit, 
    metricTwoUnit,
    enableZoom = false,
    enableAnimation = true,
    showGrid = true 
}) => {
    const [opacity, setOpacity] = useState({
        [metricOne]: 1,
        [metricTwo]: 1,
    });
    // const [graphData, setGraphData] = useState([]) // state to store dynamic graph data
    // const [error, setError] = useState(false) // state to handle errors

    // const graphData = [
    //     { name: 'Week 1', [metricOne]: 4000, [metricTwo]: 2400 },
    //     { name: 'Week 2', [metricOne]: 3000, [metricTwo]: 1398 },
    //     { name: 'Week 3', [metricOne]: 2000, [metricTwo]: 9800 },
    //     { name: 'Week 4', [metricOne]: 2780, [metricTwo]: 3908 },
    //     { name: 'Week 5', [metricOne]: 1890, [metricTwo]: 4800 },
    //     { name: 'Week 6', [metricOne]: 2390, [metricTwo]: 3800 },
    //     { name: 'Week 7', [metricOne]: 3490, [metricTwo]: 4300 },
    // ];

    // const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    // useEffect(() => {
    //     const fetchGraphData = async () => {
    //         try {
    //             const response = await fetch(`${API_URL}/api/business/get-graph-data`, {
    //                 method: "GET",
    //                 headers: { "Content-Type": "application/json" },
    //                 credentials: 'include',
    //             });

    //             if (response.ok) {
    //                 const result = await response.json();
    //                 if (result.success) {
    //                     const transformedData = result.data.map((item) => ({
    //                         name: `${item.weekStartDate} - ${item.weekEndDate}`, // label for X-axis
    //                         [metricOne]: item[metricOne], // Dynamically map metricOne
    //                         [metricTwo]: item[metricTwo], // Dynamically map metricTwo
    //                     }));
    //                     setGraphData(transformedData);
    //                 } else {
    //                     setError(true);
    //                     console.error("Error fetching graph data");
    //                 }
    //             } else {
    //                 setError(true);
    //                 console.log("Error fetching graph data");
    //             }
    //         } catch (error) {
    //             setError(true);
    //             console.log('Error fetching graph data', error);
    //         }
    //     };
    //     fetchGraphData();
    // }, [metricOne, metricTwo]); // Refresh data when metrics change

    // if (error) {
    //     return <p className="text-red-500">Failed to fetch graph data. Please try again later.</p>;
    // }

    return (
        // PS made the graph responsive once it's been added into a container

        // YAxis adds the YAxi label onto the graph
        // XAXis adds the XAxi label onto the graph
        // CartesianGrid adds a grid onto the graph, but "stokeDasharray" changes the grids visuals into hyphens
        // Tooltip creates an additional UI element for when you hover over values in the graph
        // Legend adds a key to the bottom on the graph. This provides additional information

        // The 2 Area elements visualise the data provided onto the graph.
        // Stroke and fill are for the colour of the visualised data on the graph
        // StackId allows the visualised data to be added on top of one another.

        <ResponsiveContainer width="100%" height="100%">
            <AreaChart 
                data={graphData} 
                margin={{ 
                    top: 10, 
                    right: 10, 
                    left: 0, 
                    bottom: enableZoom ? 50 : 10 
                }}
            >
                {/* Axes with labels */}
                    <XAxis
                        dataKey="name"
                        tick={{ 
                            fontSize: 11, 
                            fill: "#6b7280",
                            fontWeight: 500
                        }}
                        tickLine={{ stroke: "#e5e7eb" }}
                        axisLine={{ stroke: "#e5e7eb" }}
                        angle={graphData?.length > 10 ? -35 : 0}
                        textAnchor={graphData?.length > 10 ? "end" : "middle"}
                        height={graphData?.length > 10 ? 70 : 50}
                        dy={graphData?.length > 10 ? 5 : 0}
                    />
                    <YAxis
                        tick={{ 
                            fontSize: 11, 
                            fill: "#6b7280",
                            fontWeight: 500
                        }}
                        tickLine={{ stroke: "#e5e7eb" }}
                        axisLine={{ stroke: "#e5e7eb" }}
                        label={{
                            value: "Value", 
                            angle: -90,
                            position: "insideLeft",
                            style: { textAnchor: "middle", fontSize: 14, fill: "#555" },
                        }}
                    />
                {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" opacity={0.7} />}
                <Tooltip
                    content={
                        <CustomTooltip
                            metricOne={metricOne}
                            metricTwo={metricTwo}
                            metricOneUnit={metricOneUnit}
                            metricTwoUnit={metricTwoUnit}
                        />
                    }
                />
                <Legend
                    wrapperStyle={{
                        paddingTop: "10px",
                        fontSize: "12px",
                    }}
                    iconType="circle"
                    iconSize={8}
                    onClick={(e) => {
                        const dataKey = e.dataKey;
                        setOpacity((prev) => ({
                            ...prev,
                            [dataKey]: prev[dataKey] === 0 ? 1 : 0,
                        }));
                    }}
                    onMouseEnter={(e) => {
                        const dataKey = e.dataKey;
                        setOpacity((prev) => ({
                            ...prev,
                            [dataKey]: 0.5,
                        }));
                    }}
                    onMouseLeave={(e) => {
                        const dataKey = e.dataKey;
                        setOpacity((prev) => ({
                            ...prev,
                            [dataKey]: 1,
                        }));
                    }}
                />

                <Area
                    type="monotone"
                    dataKey={metricOne}
                    stroke="#2563eb"
                    fill="#3b82f6"
                    fillOpacity={opacity[metricOne]}
                    strokeWidth={2}
                    stackId="1"
                    animationDuration={enableAnimation ? 800 : 0}
                    dot={{ r: 4, fill: "#2563eb" }}
                    activeDot={{ r: 6, fill: "#1e40af" }}
                />

                <Area
                    type="monotone"
                    dataKey={metricTwo}
                    stroke="#7c3aed"
                    fill="#8b5cf6"
                    fillOpacity={opacity[metricTwo]}
                    strokeWidth={2}
                    stackId="1"
                    animationDuration={enableAnimation ? 800 : 0}
                    dot={{ r: 4, fill: "#7c3aed" }}
                    activeDot={{ r: 6, fill: "#5b21b6" }}
                />
                
                {enableZoom && (
                    <Brush 
                        dataKey="name" 
                        height={35}
                        stroke="#3b82f6"
                        fill="#eff6ff"
                        travellerWidth={8}
                        style={{
                            fontSize: 10,
                            fill: "#6b7280"
                        }}
                    />
                )}
            </AreaChart>
       </ResponsiveContainer>
    )
};

// Enhanced Custom Tooltip with better formatting and styling
const CustomTooltip = ({ active, payload, label, metricOne, metricTwo, metricOneUnit, metricTwoUnit }) => {
    if (active && payload && payload.length) {
        const formatValue = (value, unit) => {
            if (unit === 'GBP' || unit === '£') {
                return `£${Number(value).toFixed(2)}`;
            }
            return `${Number(value).toLocaleString()} ${unit || ''}`;
        };

        return (
             <div className="p-4 bg-slate-900 border-2 border-blue-500 flex flex-col gap-3 rounded-lg shadow-xl">
                 <p className="text-medium text-lg text-white font-bold border-b border-gray-700 pb-2">
                    {label}
                 </p>
                 {payload.map((entry, index) => (
                    <p key={index} className="text-sm flex justify-between items-center gap-4" 
                       style={{ color: entry.color }}>
                        <span className="font-medium">{entry.name}:</span>
                        <span className="font-bold text-white">
                            {formatValue(entry.value, entry.name === metricOne ? metricOneUnit : metricTwoUnit)}
                        </span>
                    </p>
                 ))}
                 {payload.length === 2 && (
                    <div className="pt-2 border-t border-gray-700 text-xs text-gray-400">
                        Click legend to toggle metrics
                    </div>
                 )}
             </div>
        );
    }
    return null;
};

// exporting the component.
// This allows it to be used multiple times across my application without needing the code to be rewritten.
export default BusinessAreaChart;
