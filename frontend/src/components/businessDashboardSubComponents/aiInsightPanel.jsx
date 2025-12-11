import { useState, useEffect } from 'react';
import { MessageSquare, Sparkles, TrendingUp, RefreshCw, X, Minimize2, Maximize2 } from 'lucide-react';
import makeAuthenticatedRequest from '../../utils/api';

const AIInsightPanel = ({ 
  type = 'general', 
  businessId, 
  autoLoad = false, 
  prompt = '',
  quickPrompts = [],
  floating = false 
}) => {
  const [isOpen, setIsOpen] = useState(!floating);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState(null);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

  // Cache key for localStorage
  const cacheKey = `ai_insight_${businessId}_${type}`;
  const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  // Load from cache on mount
  useEffect(() => {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        
        if (age < CACHE_TTL) {
          setInsight(data);
          setLastUpdated(new Date(timestamp));
          setConversationHistory([{ role: 'assistant', content: data }]);
        }
      } catch (e) {
        console.error('Error loading cached insight:', e);
      }
    }

    // Auto-load on mount if specified
    if (autoLoad && !insight) {
      fetchInsight(prompt);
    }
  }, [businessId, type]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchInsight = async (userPrompt) => {
    if (!businessId) {
      setError('Business ID not available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await makeAuthenticatedRequest(
        `${backendUrl}/api/agentChat-auth/agentChat`,
        {
          method: 'POST',
          body: JSON.stringify({
            message: userPrompt,
            history: conversationHistory,
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const aiResponse = data.payload?.response || 'No response from AI';

        setInsight(aiResponse);
        setLastUpdated(new Date());

        // Update conversation history
        const newHistory = [
          ...conversationHistory,
          { role: 'user', content: userPrompt },
          { role: 'assistant', content: aiResponse }
        ];
        setConversationHistory(newHistory);

        // Cache the response
        localStorage.setItem(cacheKey, JSON.stringify({
          data: aiResponse,
          timestamp: Date.now()
        }));
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch insight');
      }
    } catch (err) {
      console.error('Error fetching AI insight:', err);
      setError(err.message);

      // Fallback to cached data even if expired
      const cached = localStorage.getItem(cacheKey);
      if (cached && !insight) {
        try {
          const { data, timestamp } = JSON.parse(cached);
          setInsight(data + '\n\n⚠️ Using cached insight (AI service unavailable)');
          setLastUpdated(new Date(timestamp));
        } catch (e) {
          console.error('Error loading fallback cache:', e);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchInsight(prompt || 'Provide an updated business performance summary');
  };

  const handleQuickPrompt = (quickPrompt) => {
    fetchInsight(quickPrompt);
  };

  const formatTimestamp = (date) => {
    if (!date) return '';
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} mins ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    return `${Math.floor(hours / 24)} days ago`;
  };

  // Floating action button variant
  if (floating) {
    return (
      <>
        {/* Floating button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 z-50"
          aria-label="Open AI Assistant"
        >
          <Sparkles className="w-6 h-6" />
        </button>

        {/* Modal */}
        {isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                    Business AI Assistant
                  </h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Chat content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {conversationHistory.length === 0 && !loading && (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    <Sparkles className="w-12 h-12 mx-auto mb-4 text-blue-600 dark:text-blue-400" />
                    <p className="text-lg font-medium mb-2">Welcome to your AI Business Assistant</p>
                    <p className="text-sm">Ask me about your business performance, analytics, or product recommendations</p>
                  </div>
                )}

                {conversationHistory.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100'
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 dark:bg-gray-700 px-4 py-3 rounded-2xl">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg">
                    <p className="text-sm">{error}</p>
                  </div>
                )}
              </div>

              {/* Input area */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-2 mb-3 flex-wrap">
                  {['Analyze performance', 'Recommend products', 'Compare to competitors', 'Show top products'].map((quick) => (
                    <button
                      key={quick}
                      onClick={() => handleQuickPrompt(quick)}
                      disabled={loading}
                      className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full transition-colors disabled:opacity-50"
                    >
                      {quick}
                    </button>
                  ))}
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const input = e.target.elements.prompt;
                    if (input.value.trim()) {
                      fetchInsight(input.value);
                      input.value = '';
                    }
                  }}
                  className="flex gap-2"
                >
                  <input
                    name="prompt"
                    type="text"
                    placeholder="Ask about your business..."
                    disabled={loading}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Inline panel variant
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-750">
        <div className="flex items-center gap-2">
          {type === 'performance' && <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
          {type === 'recommendations' && <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
          {type === 'general' && <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            {type === 'performance' && 'AI Performance Insights'}
            {type === 'recommendations' && 'AI Product Recommendations'}
            {type === 'general' && 'AI Insights'}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatTimestamp(lastUpdated)}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors disabled:opacity-50"
            aria-label="Refresh insight"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {type !== 'performance' && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
              aria-label={isExpanded ? 'Minimize' : 'Expand'}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={`p-4 ${isExpanded ? 'min-h-[300px]' : 'min-h-[120px]'}`}>
        {loading && !insight && (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          </div>
        )}

        {error && !insight && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-3 py-2 rounded-lg text-sm">
            <p className="font-medium">Unable to fetch AI insights</p>
            <p className="text-xs mt-1">{error}</p>
          </div>
        )}

        {insight && (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
              {insight}
            </p>
          </div>
        )}

        {!loading && !insight && !error && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-4">
            <Sparkles className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">Click a prompt below to get AI insights</p>
          </div>
        )}
      </div>

      {/* Quick prompts */}
      {quickPrompts.length > 0 && (
        <div className="px-4 pb-4 flex flex-wrap gap-2">
          {quickPrompts.map((quickPrompt) => (
            <button
              key={quickPrompt}
              onClick={() => handleQuickPrompt(quickPrompt)}
              disabled={loading}
              className="px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full transition-colors disabled:opacity-50 font-medium"
            >
              {quickPrompt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AIInsightPanel;
