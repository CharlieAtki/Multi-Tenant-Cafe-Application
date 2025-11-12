// frontend/src/components/agentChat/agentChatInterfaceComponent.jsx
import { useState, useEffect, useRef } from "react";
import { Loader, MessageCircle, Trash2 } from "lucide-react";
import ChatMessageComponent from "./chatMessageComponent.jsx";
import ChatInputComponent from "./chatInputComponent.jsx";

const AgentChatInterfaceComponent = ({ userData }) => {
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const messagesEndRef = useRef(null);

    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

    // Auto-scroll to bottom when new messages arrive
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async (messageText) => {
        if (!messageText.trim()) return;

        // Add user message to chat
        const userMessage = {
            id: Date.now(),
            sender: "user",
            text: messageText,
            timestamp: new Date(),
        };

        // Update UI immediately
        setMessages((prev) => [...prev, userMessage]);
        setError(null);
        setIsLoading(true);

        try {
            const accessToken = localStorage.getItem("accessToken");

            // Include past messages in request for context
            const response = await fetch(`${backendUrl}/api/agentChat-auth/agentChat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    message: messageText,
                    userData,
                    history: [...messages, userMessage].map((m) => ({
                        role: m.sender === "user" ? "user" : "assistant",
                        content: m.text,
                    })),
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Add agent response
            const agentMessage = {
                id: Date.now() + 1,
                sender: "agent",
                text: data.payload?.response || "I couldn't process that request. Please try again.",
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, agentMessage]);
        } catch (err) {
            console.error("Error sending message:", err);
            setError(err.message);

            // Add error message
            const errorMessage = {
                id: Date.now() + 1,
                sender: "agent",
                text: `❌ Error: ${err.message}. Please try again.`,
                timestamp: new Date(),
                isError: true,
            };

            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const clearChat = () => {
        setMessages([]);
        setError(null);
    };

    return (
        <div className="flex-1 flex flex-col w-full max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-900 dark:to-blue-950 p-4 sm:p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <MessageCircle className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    <div>
                        <h1 className="text-lg sm:text-2xl font-bold text-white">Shopping Assistant</h1>
                        <p className="text-xs sm:text-sm text-blue-100">AI-powered shopping help</p>
                    </div>
                </div>
                {messages.length > 0 && (
                    <button
                        onClick={clearChat}
                        className="p-2 hover:bg-blue-700 dark:hover:bg-blue-800 rounded-full transition-colors"
                        title="Clear chat"
                    >
                        <Trash2 className="w-5 h-5 text-white" />
                    </button>
                )}
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-center">
                        <div>
                            <MessageCircle className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
                                Start a conversation! Ask me to:
                            </p>
                            <ul className="mt-3 text-gray-600 dark:text-gray-300 text-sm space-y-2">
                                <li>💳 Add items to your checkout</li>
                                <li>🔍 Search for products</li>
                                <li>❓ Get product information</li>
                                <li>🛒 Check your cart</li>
                            </ul>
                        </div>
                    </div>
                ) : (
                    <>
                        {messages.map((message) => (
                            <ChatMessageComponent key={message.id} message={message} />
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-3 sm:p-4 max-w-xs sm:max-w-md">
                                    <div className="flex items-center gap-2">
                                        <Loader className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
                                        <span className="text-gray-700 dark:text-gray-300 text-sm">Thinking...</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Input Area */}
            <ChatInputComponent onSendMessage={sendMessage} isLoading={isLoading} />
        </div>
    );
};

export default AgentChatInterfaceComponent;
