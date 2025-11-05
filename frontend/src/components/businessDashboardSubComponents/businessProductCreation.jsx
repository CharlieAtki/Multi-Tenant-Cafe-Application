import { useState } from "react";
import { useOutletContext } from 'react-router-dom';

const BusinessProductCreation = () => {
    const { userData } = useOutletContext();

    const [input, setInput] = useState({
        productName: "",
        description: "",
        price: "",
        category: "",
        imageUrl: ""
    });

    const [isUploading, setIsUploading] = useState(false); // ⬅️ New state

    const cloudinaryUrl = import.meta.env.VITE_CLOUDINARY_UPLOAD_URL;
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    const inputFormElement = [
        { name: "productName", label: "Product Name", type: "text", placeholder: "Enter product name", required: true },
        { name: "description", label: "Description", type: "textarea", placeholder: "Enter product description", required: true },
        { name: "price", label: "Price", type: "number", placeholder: "Enter product price", required: true },
        { name: "category", label: "Category", type: "text", placeholder: "Enter product category", required: true },
        { name: "imageUrl", label: "Product Image", type: "file", placeholder: "Upload image", required: true }
    ];

    const handleChange = async (event) => {
        const { name, value, type, files } = event.target;

        if (type === "file") {
            const file = files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", "unsigned_preset");

            setIsUploading(true); // ⬅️ Start loading

            try {
                const res = await fetch(`${cloudinaryUrl}`, {
                    method: "POST",
                    body: formData
                });

                const data = await res.json();
                console.log("Uploaded image URL:", data.secure_url);

                setInput((prev) => ({ ...prev, imageUrl: data.secure_url }));
            } catch (err) {
                console.error("Image upload failed", err);
                alert("Image upload failed. Please try again.");
            } finally {
                setIsUploading(false); // ⬅️ Stop loading
            }
        } else {
            setInput((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (isUploading) {
            alert("Please wait for the image to finish uploading.");
            return;
        }

        let businessId = null;
        if (userData?.business?.businessId) {
            businessId = userData.business.businessId;
        } else if (userData?.businessId) {
            businessId = userData.businessId;
        } else if (userData?.user?.business?.businessId) {
            businessId = userData.user.business.businessId;
        } else if (userData?._id) {
            alert("Your account is not associated with a business. Please contact support.");
            return;
        }

        if (!businessId) {
            alert("Unable to create product: Business information not available");
            return;
        }

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
            console.log("Product created:", data);

            if (data.success) {
                // ✅ Reset form after successful creation
                setInput({
                    productName: "",
                    description: "",
                    price: "",
                    category: "",
                    imageUrl: ""
                });
                alert("Product created successfully!");
            }
        } catch (err) {
            console.error("Product creation failed", err);
            alert("Failed to create product. Please try again.");
        }
    };

    return (
        <div className="p-6 bg-white dark:bg-gray-700 rounded-lg shadow-md w-full max-w-7xl mx-auto">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Create New Product</h2>

            <form className="space-y-4" onSubmit={handleSubmit}>
                {inputFormElement.map((inputField, index) => (
                    <div key={index}>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {inputField.label}
                        </label>
                        {inputField.type === "textarea" ? (
                            <textarea
                                name={inputField.name}
                                value={input[inputField.name]}
                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                                placeholder={inputField.placeholder}
                                required={inputField.required}
                                onChange={handleChange}
                            />
                        ) : inputField.type === "file" ? (
                            <>
                                <input
                                    type="file"
                                    accept="image/*"
                                    name={inputField.name}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                                    required={inputField.required}
                                />
                                {isUploading && (
                                    <p className="text-sm text-blue-600 mt-1">Uploading image...</p>
                                )}
                            </>
                        ) : (
                            <input
                                type={inputField.type}
                                name={inputField.name}
                                value={input[inputField.name]}
                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                                placeholder={inputField.placeholder}
                                required={inputField.required}
                                onChange={handleChange}
                            />
                        )}
                    </div>
                ))}
                
                {input.imageUrl && (
                    <div className="mt-2">
                        <img src={input.imageUrl} alt="Product Preview" className="h-32 object-cover rounded" />
                    </div>
                )}

                <div className="pt-2">
                    <button
                        type="submit"
                        className={`w-1/2 mx-auto flex items-center justify-center bg-blue-600 text-white py-2 px-4 rounded-lg transition ${
                            isUploading || !input.imageUrl ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
                        }`}
                        disabled={isUploading || !input.imageUrl}
                    >
                        {isUploading ? "Uploading..." : "Create Product"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default BusinessProductCreation;
