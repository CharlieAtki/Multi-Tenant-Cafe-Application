// frontend/src/components/agentChat/ChatInput.jsx
import { useState, useRef, useEffect } from "react";
import { Send, Paperclip } from "lucide-react";

// ChatInput Component
const ChatInputComponent = ({ onSendMessage, isLoading }) => {
    const [input, setInput] = useState("");
    const textareaRef = useRef(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = Math.min(
                textareaRef.current.scrollHeight,
                120
            ) + "px";
        }
    }, [input]);

    const handleSubmit = () => {
        if (input.trim() && !isLoading) {
            onSendMessage(input);
            setInput("");
            if (textareaRef.current) {
                textareaRef.current.style.height = "auto";
            }
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const suggestedQueries = [
        "Add an Espresso to my cart",
        "Please can you complete my order",
        "What's in my checkout?",
        "Given my past orders, what would you recommend to me from the menu.",
    ];

    return (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-6 flex-shrink-0">
            {input === "" && (
                <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {suggestedQueries.map((query, idx) => (
                        <button
                            key={idx}
                            onClick={() => {
                                setInput(query);
                                textareaRef.current?.focus();
                            }}
                            className="text-left text-xs sm:text-sm p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                        >
                            {query}
                        </button>
                    ))}
                </div>
            )}

            <div className="flex gap-2 sm:gap-3">
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message... (Shift+Enter for new line)"
                    disabled={isLoading}
                    className="flex-1 resize-none p-2 sm:p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50 text-sm sm:text-base max-h-24"
                    rows="1"
                />

                <button
                    onClick={handleSubmit}
                    disabled={!input.trim() || isLoading}
                    className="p-2 sm:p-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                    title="Send message (Enter)"
                >
                    📤
                </button>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                💡 Tip: You can ask the agent to search for products, add items to your cart, or get product information!
            </p>
        </div>
    );
};

export default ChatInputComponent;
