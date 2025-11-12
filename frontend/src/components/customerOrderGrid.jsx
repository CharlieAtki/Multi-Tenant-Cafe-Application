import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, X, Plus, Minus } from "lucide-react";
import { useState } from "react";
import makeAuthenticatedRequest from "../utils/api";
import { useEffect } from "react";

const CustomerOrderGrid = () => {

    const navigate = useNavigate();

    const goBack = () => {
        navigate(-1)
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
            <div className="w-full max-w-3xl mb-4">
                <button
                    onClick={goBack}
                    className="flex items-center gap-2 text-gray-400 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Back</span>
                </button>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-10 w-full max-w-3xl">

            </div>
        </div>
    );
};


export default CustomerOrderGrid
