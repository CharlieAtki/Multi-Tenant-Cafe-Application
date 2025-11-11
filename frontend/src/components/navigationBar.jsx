import {useEffect, useState} from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import makeAuthenticatedRequest from '../utils/api.js';
import {handleLogout} from "../utils/logout.js";

const NavigationBar = () => {
    const navigate = useNavigate();
    const location = useLocation(); // Add this to trigger re-render on route change
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [tokenCheck, setTokenCheck] = useState(Date.now()); // Add this state
    const [currentLocation, setCurrentLocation] = useState(location.pathname); // Track current location

    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    // Navigation bar elements
    const navbarElements = [
        {
            name: "Marketplace",
            link: "/marketplace"
        },
        {
            name: "Agent",
            link: "/agent"
        },
    ];

    // Placeholder user profile data
    const userProfile = {
        name: "John Doe",
        imageUrl: "/robot.png"
    };

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                setLoading(true);
                const accessToken = localStorage.getItem('accessToken');

                // Don't fetch user data if no token exists
                if (!accessToken) {
                    setUserData(null);
                    setLoading(false);
                    return;
                }

                const response = await makeAuthenticatedRequest(`${backendUrl}/api/user-auth/fetchCurrentUserInformation`);

                if (response.ok) {
                    const data = await response.json();
                    setUserData(data);
                    console.log('User data fetched:', data); // Debug log
                } else {
                    console.error('Failed to fetch user data');
                    setUserData(null);
                    // Clear invalid tokens
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('user');
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
                setUserData(null);
                // Clear invalid tokens
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [backendUrl, location.pathname, tokenCheck]); // Add tokenCheck to dependencies

    // Add this effect to check for token changes
    useEffect(() => {
        const checkTokenChange = () => {
            setTokenCheck(Date.now());
        };

        // Check for token changes every time the component might need to update
        const interval = setInterval(() => {
            const currentAccessToken = localStorage.getItem('accessToken');
            if (currentAccessToken && !userData) {
                checkTokenChange();
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [userData]);


    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const handleNavigation = (path) => {
        navigate(path);
        setIsMenuOpen(false); // Close menu after navigation    
    };

    const onLogout = () => {
        handleLogout(backendUrl, navigate, setUserData);
    };

    // Updates when the location changes
    useEffect(() => {
        const currentLocation = location.pathname; // The current location of the user
        setCurrentLocation(currentLocation);
    }, [location.pathname]);

    return (
        <nav className="w-full dark:bg-gray-900 bg-gray-50 dark:text-white shadow-lg">
            {/* Main navbar */}
            <div className="py-2 px-2 sm:px-4 lg:px-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center h-16">
                    {/* Logo/Brand */}
                    <div onClick={() => {navigate('/')}} className="flex-shrink-0">
                        <h1 className="text-xl sm:text-2xl font-bold">
                            Cafe App
                        </h1>
                        <p className="text-xs text-gray-400 hidden sm:block">
                            Your one-stop solution.
                        </p>
                    </div>

                    {/* Desktop Navigation Links */}
                    <div className="hidden md:flex items-center space-x-8">
                        {navbarElements.map((element, index) => (
                            <button
                                key={index}
                                onClick={() => handleNavigation(element.link)}
                                className="text-sm dark:text-gray-300 hover:text-white hover:bg-gray-700 px-3 py-2 rounded-md transition-colors duration-200"
                            >
                                {element.name}
                            </button>
                        ))}
                        {/* Business Creation Link */}
                        {userData ? (
                            userData.user.business.userRole === 'owner' || userData.user.business.userRole === 'employee' ? (
                                currentLocation !== '/businessDashboard' && currentLocation !== '/businessDashboard/createProduct' ? (
                                    // Go to the business dashboard
                                    <button
                                        onClick={() => handleNavigation("/businessDashboard")}
                                        className="text-sm dark:text-gray-300 hover:text-white hover:bg-gray-700 px-3 py-2 rounded-md transition-colors duration-200"
                                    >
                                        Business
                                    </button>
                                ) : null
                            ) : (
                                // Create the business account with the User
                                <button
                                    onClick={() => handleNavigation("/businessCreation")}
                                    className="text-sm dark:text-gray-300 hover:text-white hover:bg-gray-700 px-3 py-2 rounded-md transition-colors duration-200"
                                >
                                    Create Business
                                </button>
                            )
                        ) : null}
                        {userData && (
                            (!userData.user.business ||
                                (userData.user.business.userRole !== 'owner' &&
                                userData.user.business.userRole !== 'employee')) &&
                            currentLocation !== '/businessDashboard' && (
                                <button
                                    onClick={() => handleNavigation("/businessJoin")}
                                    className="text-sm dark:text-gray-300 hover:text-white hover:bg-gray-700 px-3 py-2 rounded-md transition-colors duration-200"
                                >
                                    Join Business
                                </button>
                            )
                            )}
                        {!userData && (
                            <button
                                onClick={() => handleNavigation("/accountLogin")}
                                className="text-sm dark:text-gray-300 hover:text-white hover:bg-gray-700 px-3 py-2 rounded-md transition-colors duration-200"
                            >
                                Login
                            </button>
                        )}
                        {userData && (
                            <button
                                onClick={() => onLogout()}
                                className="text-sm dark:text-gray-300 hover:text-white hover:bg-gray-700 px-3 py-2 rounded-md transition-colors duration-200"
                            >
                                Logout
                            </button>
                        )}
                    </div>
                    {/* Profile and Mobile Menu Button */}
                    <div className="flex items-center space-x-4">
                        {/* Profile Section */}
                        <div className="flex items-center space-x-2">
                            <div className="hidden sm:block text-right">
                                <p className="text-xs dark:text-gray-300 font-semibold">
                                    {loading ? 'Loading...' : (userData?.user?.email || 'Guest')}
                                </p>
                            </div>
                            <img
                                src={userProfile.imageUrl ? userProfile.imageUrl : "/robot.png"}
                                alt="Profile"
                                className="w-8 h-8 sm:w-11 sm:h-11 rounded-full border-2 border-gray-600 hover:border-gray-400 transition-colors cursor-pointer"
                            />
                        </div>

                        {/* Mobile menu button */}
                        <button
                            onClick={toggleMenu}
                            className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-white transition-colors duration-200"
                            aria-expanded="false"
                        >
                            <span className="sr-only">Open main menu</span>
                            {/* Hamburger icon */}
                            {!isMenuOpen ? (
                                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            ) : (
                                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu dropdown */}
            <div className={`md:hidden transition-all duration-300 ease-in-out ${isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="px-2 pt-2 pb-3 space-y-1 bg-gray-800 border-t border-gray-700">
                    {/* Mobile user info */}
                    <div className="sm:hidden px-3 py-2 border-b border-gray-700 mb-2">
                        <p className="text-sm text-gray-300">
                            {loading ? 'Loading...' : (
                                <span className="font-semibold text-white">
                                    User:
                                </span>
                            )} {userData?.user?.email || 'Guest'}
                        </p>
                    </div>

                    {/* Mobile navigation links */}
                    {navbarElements.map((element, index) => (
                        <button
                            key={index}
                            onClick={() => handleNavigation(element.link)}
                            className="text-gray-300 hover:text-white hover:bg-gray-700 block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors duration-200"
                        >
                            {element.name}
                        </button>
                    ))}
                    {userData ? (
                        userData.user.business.userRole === 'owner' || userData.user.business.userRole === 'employee' ? (
                            currentLocation !== '/businessDashboard' ? (
                                // Go to the business dashboard
                                <button
                                    onClick={() => handleNavigation("/businessDashboard")}
                                    className="dark:text-gray-300 hover:text-white hover:bg-gray-700 block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors duration-200"
                                >
                                    Business
                                </button>
                            ) : null
                        ) : (
                            // Create the business account with the User
                            <button
                                onClick={() => handleNavigation("/businessCreation")}
                                className="dark:text-gray-300 hover:text-white hover:bg-gray-700 block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors duration-200"
                            >
                                Create Business
                            </button>
                        )
                    ) : null}
                    {userData ? (
                        !userData.user.business && currentLocation !== '/businessDashboard' ? (
                            <button
                                onClick={() => handleNavigation("/businessJoin")}
                                className="dark:text-gray-300 hover:text-white hover:bg-gray-700 block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors duration-200"
                            >                                    
                                Join Business
                            </button>
                        ) : null
                    ) : null}
                    {!userData && (
                        <button
                            onClick={() => handleNavigation("/accountLogin")}
                            className="dark:text-gray-300 hover:text-white hover:bg-gray-700 block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors duration-200"
                        >
                            Login
                        </button>
                    )}
                    {userData && (
                        <button
                            onClick={() => onLogout()}
                            className="dark:text-gray-300 hover:text-white hover:bg-gray-700 block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors duration-200"
                        >
                            Logout
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default NavigationBar;
