import { useState } from "react";
import { useOutletContext, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, X, CheckCircle, AlertCircle, Loader } from "lucide-react";

const BusinessProductCreation = () => {
    const { userData } = useOutletContext();
    const navigate = useNavigate();

    const [input, setInput] = useState({
        productName: "",
        description: "",
        price: "",
        category: "",
        imageUrl: ""
    });

    const [isUploading, setIsUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [notification, setNotification] = useState(null); // { type: 'success' | 'error', message: '' }
    const [imagePreview, setImagePreview] = useState(null);

    const cloudinaryUrl = import.meta.env.VITE_CLOUDINARY_UPLOAD_URL;
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    const categories = [
        { value: "", label: "Select a category" },
        { value: "drink", label: "Drink" },
        { value: "food", label: "Food" },
        { value: "dessert", label: "Dessert" }
    ];

    const inputFormElement = [
        { name: "productName", label: "Product Name", type: "text", placeholder: "e.g., Cappuccino", required: true, maxLength: 100 },
        { name: "description", label: "Description", type: "textarea", placeholder: "Describe your product...", required: true, maxLength: 500 },
        { name: "price", label: "Price (£)", type: "number", placeholder: "0.00", required: true, min: "0", step: "0.01" },
        { name: "category", label: "Category", type: "select", required: true },
        { name: "imageUrl", label: "Product Image", type: "file", required: true }
    ];


    const showNotification = (type, message) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 5000);
    };

    const validateField = (name, value) => {
        const newErrors = { ...errors };

        switch (name) {
            case "productName":
                if (!value.trim()) {
                    newErrors.productName = "Product name is required";
                } else if (value.length > 100) {
                    newErrors.productName = "Product name must be under 100 characters";
                } else {
                    delete newErrors.productName;
                }
                break;
            case "description":
                if (!value.trim()) {
                    newErrors.description = "Description is required";
                } else if (value.length > 500) {
                    newErrors.description = "Description must be under 500 characters";
                } else {
                    delete newErrors.description;
                }
                break;
            case "price":
                const priceNum = parseFloat(value);
                if (!value) {
                    newErrors.price = "Price is required";
                } else if (isNaN(priceNum) || priceNum < 0) {
                    newErrors.price = "Price must be a positive number";
                } else if (priceNum > 10000) {
                    newErrors.price = "Price seems too high";
                } else {
                    delete newErrors.price;
                }
                break;
            case "category":
                if (!value) {
                    newErrors.category = "Please select a category";
                } else {
                    delete newErrors.category;
                }
                break;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = async (event) => {
        const { name, value, type, files } = event.target;

        if (type === "file") {
            const file = files[0];
            if (!file) return;

            // Validate file type
            if (!file.type.startsWith('image/')) {
                showNotification('error', 'Please upload an image file');
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                showNotification('error', 'Image size must be less than 5MB');
                return;
            }

            // Show preview immediately
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);

            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", "unsigned_preset");

            setIsUploading(true);

            try {
                const res = await fetch(`${cloudinaryUrl}`, {
                    method: "POST",
                    body: formData
                });

                const data = await res.json();

                if (res.ok && data.secure_url) {
                    setInput((prev) => ({ ...prev, imageUrl: data.secure_url }));
                    showNotification('success', 'Image uploaded successfully!');
                } else {
                    throw new Error('Upload failed');
                }
            } catch (err) {
                console.error("Image upload failed", err);
                showNotification('error', 'Image upload failed. Please try again.');
                setImagePreview(null);
            } finally {
                setIsUploading(false);
            }
        } else {
            setInput((prev) => ({ ...prev, [name]: value }));
            validateField(name, value);
        }
    };

    const removeImage = () => {
        setInput((prev) => ({ ...prev, imageUrl: "" }));
        setImagePreview(null);
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = '';
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (isUploading) {
            showNotification('error', 'Please wait for the image to finish uploading.');
            return;
        }

        // Validate all fields
        let hasError = false;
        Object.keys(input).forEach(key => {
            if (!validateField(key, input[key])) {
                hasError = true;
            }
        });

        if (!input.imageUrl) {
            setErrors(prev => ({ ...prev, imageUrl: 'Please upload an image' }));
            hasError = true;
        }

        if (hasError) {
            showNotification('error', 'Please fix the errors before submitting');
            return;
        }

        const businessId = userData?.user?.business?.businessId;

        if (!businessId) {
            showNotification('error', 'Unable to create product: Business information not available');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(`${backendUrl}/api/product-unAuth/createProduct`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({
                    ...input,
                    businessId
                })
            });

            const data = await response.json();

            if (data.success) {
                // Reset form after successful creation
                setInput({
                    productName: "",
                    description: "",
                    price: "",
                    category: "",
                    imageUrl: ""
                });
                setImagePreview(null);
                setErrors({});
                
                // Reset file input
                const fileInput = document.querySelector('input[type="file"]');
                if (fileInput) fileInput.value = '';

                showNotification('success', `Product "${input.productName}" created successfully!`);
            } else {
                showNotification('error', data.message || 'Failed to create product. Please try again.');
            }
        } catch (err) {
            console.error("Product creation failed", err);
            showNotification('error', 'Failed to create product. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <div className="p-6 w-full max-w-4xl mx-auto">
            {/* Notification Toast */}
            {notification && (
                <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg animate-slide-in ${
                    notification.type === 'success' 
                        ? 'bg-green-500 text-white' 
                        : 'bg-red-500 text-white'
                }`}>
                    {notification.type === 'success' ? (
                        <CheckCircle className="w-5 h-5" />
                    ) : (
                        <AlertCircle className="w-5 h-5" />
                    )}
                    <span>{notification.message}</span>
                    <button onClick={() => setNotification(null)} className="ml-2">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Back Button */}
            <div className="mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Back to Dashboard</span>
                </button>
            </div>

            {/* Main Form Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8">
                <h2 className="text-3xl font-bold mb-2 text-gray-800 dark:text-gray-200">Create New Product</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Add a new product to your business catalog</p>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    {inputFormElement.map((inputField, index) => (
                        <div key={index}>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {inputField.label} {inputField.required && <span className="text-red-500">*</span>}
                            </label>

                            {inputField.type === "textarea" ? (
                                <>
                                    <textarea
                                        name={inputField.name}
                                        value={input[inputField.name]}
                                        className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none ${
                                            errors[inputField.name] ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        placeholder={inputField.placeholder}
                                        required={inputField.required}
                                        onChange={handleChange}
                                        maxLength={inputField.maxLength}
                                        rows={4}
                                    />
                                    <div className="flex justify-between mt-1">
                                        {errors[inputField.name] && (
                                            <p className="text-red-500 text-sm">{errors[inputField.name]}</p>
                                        )}
                                        <p className="text-gray-500 text-sm ml-auto">
                                            {input[inputField.name].length}/{inputField.maxLength}
                                        </p>
                                    </div>
                                </>
                            ) : inputField.type === "file" ? (
                                <div className="space-y-3">
                                    {!imagePreview ? (
                                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                                            <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                            <label className="cursor-pointer">
                                                <span className="text-blue-600 hover:text-blue-700 font-medium">
                                                    Click to upload
                                                </span>
                                                <span className="text-gray-500"> or drag and drop</span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    name={inputField.name}
                                                    onChange={handleChange}
                                                    className="hidden"
                                                    required={inputField.required}
                                                />
                                            </label>
                                            <p className="text-sm text-gray-500 mt-2">PNG, JPG, GIF up to 5MB</p>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <img 
                                                src={imagePreview} 
                                                alt="Product Preview" 
                                                className="w-full h-64 object-cover rounded-lg"
                                            />
                                            <button
                                                type="button"
                                                onClick={removeImage}
                                                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                    {isUploading && (
                                        <div className="flex items-center justify-center gap-2 text-blue-600">
                                            <Loader className="w-5 h-5 animate-spin" />
                                            <span>Uploading image...</span>
                                        </div>
                                    )}
                                    {errors[inputField.name] && (
                                        <p className="text-red-500 text-sm">{errors[inputField.name]}</p>
                                    )}
                                </div>
                            ) : inputField.type === "select" ? (
                                <>
                                    <select
                                        name={inputField.name}
                                        value={input[inputField.name]}
                                        className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                                            errors[inputField.name] ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        required={inputField.required}
                                        onChange={handleChange}
                                    >
                                        {categories.map((cat) => (
                                            <option key={cat.value} value={cat.value}>
                                                {cat.label}
                                            </option>
                                        ))}
                                    </select>
                                    {errors[inputField.name] && (
                                        <p className="text-red-500 text-sm mt-1">{errors[inputField.name]}</p>
                                    )}
                                </>
                            ) : (
                                <>
                                    <input
                                        type={inputField.type}
                                        name={inputField.name}
                                        value={input[inputField.name]}
                                        className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                                            errors[inputField.name] ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        placeholder={inputField.placeholder}
                                        required={inputField.required}
                                        onChange={handleChange}
                                        min={inputField.min}
                                        step={inputField.step}
                                        maxLength={inputField.maxLength}
                                    />
                                    {errors[inputField.name] && (
                                        <p className="text-red-500 text-sm mt-1">{errors[inputField.name]}</p>
                                    )}
                                    {inputField.name === "productName" && (
                                        <p className="text-gray-500 text-sm mt-1">
                                            {input[inputField.name].length}/{inputField.maxLength}
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    ))}

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-4">
                        <button
                            type="submit"
                            className={`flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium transition ${
                                isUploading || isSubmitting || !input.imageUrl 
                                    ? 'opacity-50 cursor-not-allowed' 
                                    : 'hover:bg-blue-700'
                            }`}
                            disabled={isUploading || isSubmitting || !input.imageUrl}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader className="w-5 h-5 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-5 h-5" />
                                    Create Product
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition font-medium"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BusinessProductCreation;
