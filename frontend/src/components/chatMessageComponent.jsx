import {Bot, User} from "lucide-react";

const ChatMessageComponent = ({ message }) => {
    const isUser = message.sender === "user";
    const isError = message.isError;

    const formatTime = (date) => {
        return date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    // Parse and format the message text
    const renderMessageContent = (text) => {
        if (!text) return null;

        // Split by double newlines for paragraphs
        const paragraphs = text.split(/\n\n+/);

        return paragraphs.map((paragraph, idx) => {
            // Split by single newlines for line breaks
            const lines = paragraph.split(/\n/);

            return (
                <div key={idx} className="mb-3 last:mb-0">
                    {lines.map((line, lineIdx) => {
                        // Handle bullet points
                        if (line.trim().match(/^[-*•]/)) {
                            return (
                                <div key={lineIdx} className="flex gap-2 mb-2">
                                    <span className="text-current flex-shrink-0">•</span>
                                    <span className="flex-1">{line.replace(/^[-*•]\s*/, "")}</span>
                                </div>
                            );
                        }

                        // Handle numbered lists
                        if (line.trim().match(/^\d+\./)) {
                            return (
                                <div key={lineIdx} className="flex gap-2 mb-2">
                                    <span className="flex-shrink-0 font-semibold">
                                        {line.match(/^\d+/)[0]}.
                                    </span>
                                    <span className="flex-1">{line.replace(/^\d+\.\s*/, "")}</span>
                                </div>
                            );
                        }

                        // Handle bold text
                        if (line.trim().startsWith("**") || line.trim().startsWith("__")) {
                            return (
                                <p key={lineIdx} className="font-semibold mb-1">
                                    {line.replace(/(\*\*|__)/g, "")}
                                </p>
                            );
                        }

                        // Regular text
                        return line.trim() ? (
                            <p key={lineIdx} className="mb-1">
                                {line}
                            </p>
                        ) : null;
                    })}
                </div>
            );
        });
    };

    return (
        <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
            <div
                className={`flex gap-2 sm:gap-3 max-w-xs sm:max-w-md lg:max-w-2xl ${
                    isUser ? "flex-row-reverse" : "flex-row"
                }`}
            >
                {/* Avatar */}
                <div
                    className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-lg ${
                        isUser
                            ? "bg-blue-600 dark:bg-blue-700"
                            : isError
                            ? "bg-red-600 dark:bg-red-700"
                            : "bg-green-600 dark:bg-green-700"
                    }`}
                >
                    {isUser ? <User /> : isError ? "⚠️" : <Bot />}
                </div>

                {/* Message Bubble */}
                <div className="flex flex-col gap-1">
                    <div
                        className={`rounded-lg p-3 sm:p-4 ${
                            isUser
                                ? "bg-blue-600 dark:bg-blue-700 text-white rounded-br-none"
                                : isError
                                ? "bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-100 rounded-bl-none border border-red-300 dark:border-red-700"
                                : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none"
                        }`}
                    >
                        <div className="text-sm sm:text-base leading-relaxed break-words">
                            {renderMessageContent(message.text)}
                        </div>
                    </div>
                    <span className={`text-xs text-gray-500 dark:text-gray-400 ${
                        isUser ? "text-right pr-1" : "text-left pl-1"
                    }`}>
                        {formatTime(message.timestamp)}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ChatMessageComponent;