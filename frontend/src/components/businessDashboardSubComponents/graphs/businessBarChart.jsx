import {
    BarChart,
    Bar,
    ResponsiveContainer,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from "recharts";
import {useEffect, useState} from "react";

const BusinessBarChart = ({ graphData, metricOne, metricTwo, metricOneUnit, metricTwoUnit}) => {
    // const [graphData, setGraphData] = useState([]) // state to store dynamic graph data
    // const [error, setError] = useState(false) // state to handle errors

    // const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    // const graphData = [
    //     { name: 'Week 1', [metricOne]: 4000, [metricTwo]: 2400 },
    //     { name: 'Week 2', [metricOne]: 3000, [metricTwo]: 1398 },
    //     { name: 'Week 3', [metricOne]: 2000, [metricTwo]: 9800 },
    //     { name: 'Week 4', [metricOne]: 2780, [metricTwo]: 3908 },
    //     { name: 'Week 5', [metricOne]: 1890, [metricTwo]: 4800 },
    //     { name: 'Week 6', [metricOne]: 2390, [metricTwo]: 3800 },
    //     { name: 'Week 7', [metricOne]: 3490, [metricTwo]: 4300 },
    // ];

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
            <BarChart data={graphData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>

                {/* Axes with labels */}
                    <XAxis
                        dataKey="name"
                        label={{
                            value: "Weeks", // X-axis label
                            position: "insideBottom",
                            offset: -5,
                            style: { fontSize: 14, fill: "#555" },
                        }}
                        tick={{ fontSize: 12, fill: "#666" }} // Tick styling
                    />
                    <YAxis
                        label={{
                            value: "Metric Value", // Y-axis label
                            angle: -90,
                            position: "insideLeft",
                            style: { textAnchor: "middle", fontSize: 14, fill: "#555" },
                        }}
                        tick={{ fontSize: 12, fill: "#666" }} // Tick styling
                    />
                <CartesianGrid strokeDasharray="5 5" />
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
                        paddingTop: "20px", // Adds space above the legend
                        textAlign: "center", // Centers the legend horizontally
                    }}
                />


                <Bar
                    type="monotone"
                    dataKey={metricOne}
                    stroke="#2563eb"
                    fill="#3b82f6"
                    stackId="1"
                />

                <Bar
                    type="monotone"
                    dataKey={metricTwo}
                    radius={[5, 5, 0, 0]} // Rounded corners
                    stroke="#7c3aed"
                    fill="#8b5cf6"
                    stackId="1"
                />
            </BarChart>
       </ResponsiveContainer>
    )
};


// Custom Tooltip - Changes the UI of the tooltip to make it more intuitive
const CustomTooltip = ({ active, payload, label, metricOne, metricTwo, metricOneUnit, metricTwoUnit}) => {
    if (active && payload && payload.length) {
        return (
             <div className="p-4 bg-slate-900 flex flex-col gap-4 rounded-md">
                 <p className="text-medium text-lg text-white">{label}</p>
                 <p className="text-sm text-blue-400">
                    {metricOne}:
                    <span className="ml-2">{`${payload[0].value} ${metricOneUnit || ''}`}</span>
                 </p>
                 <p className="text-sm text-indigo-400">
                     {metricTwo}:
                     <span className="ml-2">{`${payload[0].value} ${metricTwoUnit || ''}`}</span>
                 </p>
             </div>
        );
    }
};

// exporting the component.
// This allows it to be used multiple times across my application without needing the code to be rewritten.
export default BusinessBarChart;
