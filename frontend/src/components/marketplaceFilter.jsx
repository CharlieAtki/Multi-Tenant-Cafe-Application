import { useCallback, useEffect, useState } from "react";
import { Search, RefreshCcw } from "lucide-react";

const MarketplaceFilter = ({ filters, onChange }) => {
  const [local, setLocal] = useState(filters || {});

  // Keep local state in sync with parent
  useEffect(() => {
    setLocal(filters || {});
  }, [filters]);

  // Debounced propagate for search field
  useEffect(() => {
    const id = setTimeout(() => {
      onChange && onChange(prev => ({ ...prev, search: local.search || "" }));
    }, 300);
    return () => clearTimeout(id);
  }, [local.search, onChange]);

  const handleField = useCallback((key, value) => {
    setLocal(prev => ({ ...prev, [key]: value }));
    if (key !== "search") {
      onChange && onChange(prev => ({ ...prev, [key]: value }));
    }
  }, [onChange]);

  const resetFilters = useCallback(() => {
    const cleared = {
      search: "",
      minPrice: "",
      maxPrice: "",
      category: "",
      business: "",
      sort: "relevance",
    };
    setLocal(cleared);
    onChange && onChange(() => cleared);
  }, [onChange]);

  return (
    <div className="backdrop-blur-md bg-white/60 dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4 sticky top-0 z-40 shadow-sm">
      <div className="flex flex-col gap-4">
        {/* Filter grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">

          {/* Search Field */}
          <div className="col-span-1 lg:col-span-2 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={local.search || ""}
              onChange={(e) => handleField("search", e.target.value)}
              placeholder="Search products..."
              className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Min Price */}
          <div>
            <input
              type="number"
              min="0"
              step="0.01"
              value={local.minPrice}
              onChange={(e) => handleField("minPrice", e.target.value)}
              placeholder="Min price"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          {/* Max Price */}
          <div>
            <input
              type="number"
              min="0"
              step="0.01"
              value={local.maxPrice}
              onChange={(e) => handleField("maxPrice", e.target.value)}
              placeholder="Max price"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          {/* Category */}
          <div>
            <input
              type="text"
              value={local.category}
              onChange={(e) => handleField("category", e.target.value)}
              placeholder="Category"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          {/* Business */}
          <div>
            <input
              type="text"
              value={local.business}
              onChange={(e) => handleField("business", e.target.value)}
              placeholder="Business name"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          {/* Sort */}
          <div>
            <select
              value={local.sort || "relevance"}
              onChange={(e) => handleField("sort", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 transition-all"
            >
              <option value="relevance">Sort: Relevance</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
              <option value="name-asc">Name: A → Z</option>
              <option value="name-desc">Name: Z → A</option>
            </select>
          </div>
        </div>

        {/* Reset Button */}
        <div className="flex justify-end">
          <button
            onClick={resetFilters}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm transition-all"
          >
            <RefreshCcw className="w-5 h-5" />
            Reset Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceFilter;
