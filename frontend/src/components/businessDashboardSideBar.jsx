import { useState } from "react";
import {FiPlus, FiPackage, FiChevronLeft, FiChevronRight, FiUsers, FiTrendingUp, FiList} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";

const BusinessDashboardSideBar = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    
    const location = useLocation();
    const navigate = useNavigate();

    const isActive = (path) => location.pathname === path;

    const handleNavigate = (path) => {
        navigate(path);
    }

    return (
        <AnimatePresence>
            <motion.aside
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -100, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={`
                    relative
                    ${isCollapsed ? "w-16" : "w-42"}
                    bg-white dark:bg-gray-900 shadow-md border-r border-gray-200 dark:border-gray-700
                    flex flex-col justify-between transition-all duration-300 ease-in-out min-h-screen
                `}
            >
                {/* Top section */}
                <div className="flex flex-col p-4 space-y-4">
                    <button 
                        className={`
                            flex items-center px-3 py-2 text-sm font-medium rounded-md
                            ${isActive('/businessDashboard/createProduct') ? 'bg-gray-200 dark:bg-gray-700' : ''}
                            text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all
                            ${isCollapsed ? "justify-center" : "justify-start"}
                        `}
                        onClick={() => handleNavigate('/businessDashboard/createProduct')}
                        >
                            <FiPackage className="text-xl" />
                            {!isCollapsed && <span className="ml-2">Product</span>}
                    </button>
                    <button 
                        className={`
                            flex items-center px-3 py-2 text-sm font-medium rounded-md
                            ${isActive('/dashboard/createProduct') ? 'bg-gray-200 dark:bg-gray-700' : ''}
                            text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all
                            ${isCollapsed ? "justify-center" : "justify-start"}
                        `}
                        onClick={() => handleNavigate('/businessDashboard/analytics')}
                        >
                            <FiTrendingUp className="text-xl" />
                            {!isCollapsed && <span className="ml-2">Analytics</span>}
                    </button>
                    <button 
                        className={`
                            flex items-center px-3 py-2 text-sm font-medium rounded-md
                            ${isActive('/dashboard/orders') ? 'bg-gray-200 dark:bg-gray-700' : ''}
                            text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all
                            ${isCollapsed ? "justify-center" : "justify-start"}
                        `}
                        onClick={() => handleNavigate('/businessDashboard/orders')}
                        >
                            <FiList className="text-xl" />
                            {!isCollapsed && <span className="ml-2">Orders</span>}
                    </button>
                    <button 
                        className={`
                            flex items-center px-3 py-2 text-sm font-medium rounded-md
                            ${isActive('/dashboard/employee') ? 'bg-gray-200 dark:bg-gray-700' : ''}
                            text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all
                            ${isCollapsed ? "justify-center" : "justify-start"}
                        `}
                        onClick={() => handleNavigate('/businessDashboard/employee')}
                        >
                            <FiUsers className="text-xl" />
                            {!isCollapsed && <span className="ml-2">Employee</span>}
                    </button>
                </div>

                {/* Collapse Button */}
                <div className="absolute top-4 right-[-12px]">
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-full p-1 shadow hover:scale-105 transition"
                    >
                        {isCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
                    </button>
                </div>

                {/* Bottom section */}
                {/* <div className="p-4">
                    <button className={`
                        flex items-center px-3 py-2 text-sm font-medium rounded-md
                        text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all
                        ${isCollapsed ? "justify-center" : "justify-start"}
                    `}>
                        <FiUserPlus className="text-lg" />
                        {!isCollapsed && <span className="ml-2">Invite Members</span>}
                    </button>
                </div> */}
            </motion.aside>
        </AnimatePresence>
    );
};

export default BusinessDashboardSideBar;
