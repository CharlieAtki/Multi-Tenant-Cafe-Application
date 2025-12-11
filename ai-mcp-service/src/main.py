from fastmcp import FastMCP
import requests
import os
from typing import Any, Dict

# Define the MCP server
mcp = FastMCP("Backend Tools Server")

EXPRESS_BASE_URL = os.getenv("EXPRESS_BASE_URL", "http://localhost:3000")

# Store token from context if available
_token = None

def set_token(token: str):
    """Set the authentication token for requests"""
    global _token
    _token = token.strip()
    if _token.startswith("Bearer "):
        # Normalize to raw token internally
        _token = _token[7:]

def format_menu(products: list[dict]) -> str:
    # Group products by category
    grouped = {}
    for p in products:
        category = p.get("category", "Other").capitalize()
        grouped.setdefault(category, []).append(p)

    # Build structured text
    response = "Here’s the menu:\n\n"
    emoji_map = {"Drink": "☕", "Food": "🥐", "Dessert": "🍰", "Other": "🛍️"}

    for category, items in grouped.items():
        emoji = emoji_map.get(category, "🛍️")
        response += f"{emoji} {category}\n"
        for item in items:
            name = item.get("productName", "Unnamed Product")
            desc = item.get("description", "")
            price = item.get("price", 0)
            response += f"- {name}: {desc} – £{price:.2f}\n"
        response += "\n"

    response += "Let me know if you’d like to add something to your order or see more details!"
    return response

# Try to capture session params (including token) when a client connects.
# Some FastMCP versions expose a connection hook; we defensively support multiple shapes.
try:
    # Newer-style API: decorator-based
    @mcp.on_connect
    def _on_connect(session: Any):  # type: ignore
        try:
            params: Dict[str, Any] = {}
            # Common attribute names across implementations
            for attr in ("params", "client_params", "connection_params", "metadata"):
                if hasattr(session, attr) and isinstance(getattr(session, attr), dict):
                    params.update(getattr(session, attr))
            token = params.get("token") or params.get("auth") or params.get("authorization")
            if token:
                set_token(str(token))
        except Exception:
            # Best-effort only; continue without blocking
            pass
except Exception:
    # If on_connect isn't available, we'll rely on the explicit tool below
    pass

@mcp.tool()
def set_auth_token(token: str):
    """
    Sets the authentication token to be used when calling protected backend endpoints.
    Pass either the raw JWT or the full "Bearer <token>" string.
    """
    set_token(token)
    # Do not echo the token back in responses
    return "✅ Authentication token received and set."

@mcp.tool()
def search_product_by_name(product_name: str):
    """
    Searches for a product by name and returns its MongoDB ObjectId and details.
    Use this to find the product_id before adding to checkout.
    """
    try:
        endpoint = f"{EXPRESS_BASE_URL}/api/product-unAuth/getAllProducts"
        response = requests.get(endpoint, timeout=5)

        if response.status_code == 200:
            data = response.json()
            products = data.get('products', [])

            # Search for product by name (case-insensitive)
            matching = [
                p for p in products
                if product_name.lower() in p.get('productName', '').lower()
            ]

            if matching:
                product = matching[0]
                return f"✅ Found: {product.get('productName')} | ID: {product.get('_id')} | Price: £{product.get('price', 'N/A')}"
            else:
                return f"❌ Product '{product_name}' not found in catalog"
        else:
            return f"❌ Failed to search products (Status: {response.status_code})"

    except Exception as e:
        return f"⚠️ Error searching products: {str(e)}"

@mcp.tool()
def search_all_products():
    """
    Searches the mongoDB via the express backend REST API for all products.
    This tool will provide the agent with a list of all products, allowing them to understand what is available
    """
    try:
        endpoint = f"{EXPRESS_BASE_URL}/api/product-unAuth/getAllProducts"
        response = requests.get(endpoint, timeout=5)

        if response.status_code == 200:
            data = response.json()
            raw_products = data.get('products', [])
            products = format_menu(raw_products) # Formatting the agent response
            return f"✅ Found: {products}"
        else:
            return f"❌ Failed to search products (Status: {response.status_code})"
    except Exception as e:
        return f"⚠️ Error searching products: {str(e)}"

@mcp.tool()
def add_item_to_checkout(product_id: str, product_name: str, quantity: int, user_email: str):
    """
    Adds an item to the user's checkout basket.

    Args:
        product_id: The MongoDB ObjectId of the product (must be 24 hex characters)
        product_name: The name of the product (for reference)
        quantity: How many items to add (default: 1)
        user_email: The email of the user making the purchase

    Important: Always search for the product first using search_product_by_name()
    to get the correct product_id before calling this function.
    """

    try:
        # Validate ObjectId format (should be 24 character hex string)
        if not isinstance(product_id, str) or len(product_id) != 24:
            return f"❌ Invalid product ID format. Expected 24-character hex string, got: {product_id}"

        # Check if token is available
        if not _token:
            return "❌ Authentication token not available. Please ensure you're logged in."

        payload = {
            "productId": product_id,
            "productName": product_name,
            "userEmail": user_email,
            "quantity": int(quantity)
        }

        headers = {
            "Authorization": f"Bearer {_token}",  # Token is raw, so add Bearer prefix
            "Content-Type": "application/json"
        }

        endpoint = f"{EXPRESS_BASE_URL}/api/user-auth/addItemToCheckout"
        response = requests.post(endpoint, json=payload, headers=headers, timeout=10)

        if response.status_code == 200:
            data = response.json()
            return f"✅ {data.get('message', 'Item added successfully to checkout!')}"
        else:
            # try to parse json message if present
            error_msg = None
            try:
                error_msg = response.json().get('message')
            except Exception:
                pass
            if not error_msg:
                error_msg = response.text
            return f"❌ Failed to add item: {error_msg} (Status: {response.status_code})"

    except Exception as e:
        return f"⚠️ Error adding item to checkout: {str(e)}"


@mcp.tool()
def remove_from_checkout(product_id: str, product_name: str, user_email: str):
    """
        Removes an item from the user's checkout basket.

        Args:
            product_id: The MongoDB ObjectId of the product (must be 24 hex characters)
            product_name: The name of the product (for reference)
            user_email: The email of the user making the purchase

        Important: Always search for the product first using search_product_by_name()
        to get the correct product_id before calling this function.
    """

    try:
        # Validate ObjectId format (should be 24 character hex string)
        if not isinstance(product_id, str) or len(product_id) != 24:
            return f"❌ Invalid product ID format. Expected 24-character hex string, got: {product_id}"

        # Check if token is available
        if not _token:
            return "❌ Authentication token not available. Please ensure you're logged in."

        payload = {
            "productId": product_id,
            "productName": product_name,
            "userEmail": user_email,
        }

        headers = {
            "Authorization": f"Bearer {_token}",  # Token is raw, so add Bearer prefix
            "Content-Type": "application/json"
        }

        endpoint = f"{EXPRESS_BASE_URL}/api/user-auth/removeFromCheckout"
        response = requests.post(endpoint, json=payload, headers=headers, timeout=10)

        if response.status_code == 200:
            data = response.json()
            return f"✅ {data.get('message', 'Item removed successfully from the checkout!')}"
        else:
            # try to parse json message if present
            error_msg = None
            try:
                error_msg = response.json().get('message')
            except Exception:
                pass
            if not error_msg:
                error_msg = response.text
            return f"❌ Failed to remove item: {error_msg} (Status: {response.status_code})"

    except Exception as e:
        return f"⚠️ Error removing item from the checkout: {str(e)}"

@mcp.tool()
def fetch_user_checkout(user_email: str):
    """
    Fetches the current user's checkout basket.
    """

    try: 
        # Check if token is available
        if not _token:
            return "❌ Authentication token not available. Please ensure you're logged in."

        payload = {
            "userEmail": user_email,
        }

        headers = {
            "Authorization": f"Bearer {_token}",  # Token is raw, so add Bearer prefix
            "Content-Type": "application/json"
        }

        endpoint = f"{EXPRESS_BASE_URL}/api/user-auth/fetchCurrentUserCheckout"
        response = requests.get(endpoint, json=payload, headers=headers, timeout=10)

        if response.status_code == 200:
            data = response.json()
            return {
                "success": True,
                "checkoutBaskedt": data.get('checkoutBasket', []) # Fetch the checkout basket, return empty list if not present
            }
        else:
            # try to parse json message if present
            error_msg = None
            try:
                error_msg = response.json().get('message')
            except Exception:
                pass
            if not error_msg:
                error_msg = response.text
            return f"❌ Failed to fetch checkout basket: {error_msg} (Status: {response.status_code})"

    except Exception as e:
        return f"⚠️ Error fetching checkout basket: {str(e)}"

@mcp.tool()
def fetch_user_orders(user_email: str):
    """
        Fetches the current user's orders.
    """

    try:
        # Check if token is available
        if not _token:
            return "❌ Authentication token not available. Please ensure you're logged in."

        payload = {
            "userEmail": user_email,
        }

        headers = {
            "Authorization": f"Bearer {_token}",  # Token is raw, so add Bearer prefix
            "Content-Type": "application/json"
        }

        endpoint = f"{EXPRESS_BASE_URL}/api/order-auth/getUserOrders"
        response = requests.get(endpoint, json=payload, headers=headers, timeout=10) # Making the request

        if response.status_code == 200:
            data = response.json()
            return {
                "success": True,
                "orders": data.get('orders', []), # Fetch the checkout basket, return an empty list if not present
                "totalOrders": data.get('totalOrders', 0)
            }
        else:
            # try to parse the JSON message if present
            error_msg = None
            try:
                error_msg = response.json().get('message')
            except Exception:
                pass
            if not error_msg:
                error_msg = response.text
            return f"❌ Failed to fetch user orders: {error_msg} (Status: {response.status_code})"

    except Exception as e:
        return f"⚠️ Error fetching checkout basket: {str(e)}"

@mcp.tool()
def complete_user_order(user_email: str):
    """
        Completes the current user's order.
    """

    try:
        # Check if token is available
        if not _token:
            return "❌ Authentication token not available. Please ensure you're logged in."

        payload = {
            "userEmail": user_email,
        }

        headers = {
            "Authorization": f"Bearer {_token}",  # Token is raw, so add Bearer prefix
            "Content-Type": "application/json"
        }

        endpoint = f"{EXPRESS_BASE_URL}/api/order-auth/completeUserOrder"
        response = requests.post(endpoint, json=payload, headers=headers, timeout=10)  # Making the request

        if response.status_code == 201:
            data = response.json()
            return {
                "success": True,
                "message": data.get('message', "No returned message"),
                "orders": data.get('orders', []),  # Fetch the checkout basket, return an empty list if not present
                "totalValue": data.get('totalValue', 0),
                "orderCount": data.get('orderCount', 0),
            }

        else:
            # try to parse the JSON message if present
            error_msg = None
            try:
                error_msg = response.json().get('message')
            except Exception:
                pass
            if not error_msg:
                error_msg = response.text
            return f"❌ Failed to complete order: {error_msg} (Status: {response.status_code})"

    except Exception as e:
        return f"⚠️ Error completing order: {str(e)}"


# ====================================================================
# BUSINESS-FOCUSED TOOLS
# ====================================================================

@mcp.tool()
def get_business_analytics(business_id: str):
    """
    Fetches comprehensive analytics data for a specific business.
    
    Returns overview metrics (revenue, orders, average order value), 
    sales trends over time, revenue by day of week, top products, 
    order status distribution, and recent orders.
    
    Use this to provide business owners with performance insights.
    """
    try:
        if not _token:
            return "❌ Authentication token not available. Please ensure you're logged in."
        
        payload = {"businessId": business_id}
        headers = {
            "Authorization": f"Bearer {_token}",
            "Content-Type": "application/json"
        }
        
        endpoint = f"{EXPRESS_BASE_URL}/api/business-unAuth/analytics"
        response = requests.post(endpoint, json=payload, headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            analytics = data.get('analytics', {})
            
            # Format for agent readability - CONCISE KEY METRICS
            overview = analytics.get('overview', {})
            sales_by_week = analytics.get('salesByWeek', [])
            top_products = analytics.get('topProducts', [])
            revenue_by_day = analytics.get('revenueByDayOfWeek', [])
            
            # Build concise, structured insights
            metrics = []
            
            # Core metrics
            metrics.append(f"💰 Revenue: £{overview.get('totalRevenue', 0):.2f}")
            metrics.append(f"📦 Orders: {overview.get('totalOrders', 0)}")
            metrics.append(f"📊 Avg Order: £{overview.get('averageOrderValue', 0):.2f}")
            
            # Weekly trend (if available)
            if len(sales_by_week) >= 2:
                last_week = sales_by_week[-1].get('totalSales', 0)
                prev_week = sales_by_week[-2].get('totalSales', 0)
                if prev_week > 0:
                    change = ((last_week - prev_week) / prev_week) * 100
                    emoji = "📈" if change > 0 else "📉"
                    metrics.append(f"{emoji} Week Change: {change:+.1f}%")
            
            # Best day
            if revenue_by_day:
                best_day = max(revenue_by_day, key=lambda x: x.get('totalSales', 0))
                metrics.append(f"⭐ Best Day: {best_day.get('_id', 'N/A')} (£{best_day.get('totalSales', 0):.2f})")
            
            # Top product
            if top_products:
                top = top_products[0]
                metrics.append(f"🏆 Top Product: {top.get('productName', 'N/A')} ({top.get('totalQuantity', 0)} sold)")
            
            summary = "\n".join(metrics)
            
            return {
                "success": True,
                "summary": summary,
                "raw_data": analytics
            }
        else:
            error_msg = response.text
            try:
                error_msg = response.json().get('message', error_msg)
            except Exception:
                pass
            return f"❌ Failed to fetch analytics: {error_msg} (Status: {response.status_code})"
            
    except Exception as e:
        return f"⚠️ Error fetching business analytics: {str(e)}"


@mcp.tool()
def get_business_products(business_id: str):
    """
    Lists all products belonging to a specific business with their details.
    
    Returns product names, descriptions, prices, categories, and image URLs.
    Useful for understanding current product catalog and identifying gaps.
    """
    try:
        endpoint = f"{EXPRESS_BASE_URL}/api/product-unAuth/getAllProducts"
        response = requests.get(endpoint, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            all_products = data.get('products', [])
            
            # Filter products by business ID
            business_products = [
                p for p in all_products
                if p.get('business', {}).get('businessId') == business_id
            ]
            
            if not business_products:
                return f"ℹ️ No products found for this business. Consider adding products to start selling!"
            
            summary = f"📦 Your Product Catalog ({len(business_products)} items):\n\n"
            
            # Group by category
            by_category = {}
            for p in business_products:
                cat = p.get('category', 'other').capitalize()
                by_category.setdefault(cat, []).append(p)
            
            for category, products in by_category.items():
                emoji_map = {"Drink": "☕", "Food": "🥐", "Dessert": "🍰"}
                emoji = emoji_map.get(category, "🛍️")
                summary += f"{emoji} {category}:\n"
                for p in products:
                    summary += f"  • {p.get('productName', 'Unknown')} - £{p.get('price', 0):.2f}\n"
                    summary += f"    {p.get('description', 'No description')}\n"
                summary += "\n"
            
            return {
                "success": True,
                "product_count": len(business_products),
                "summary": summary,
                "products": business_products
            }
        else:
            return f"❌ Failed to fetch products (Status: {response.status_code})"
            
    except Exception as e:
        return f"⚠️ Error fetching business products: {str(e)}"


@mcp.tool()
def get_competitor_insights(business_id: str):
    """
    Provides ANONYMIZED competitor insights based on aggregated category-level data.
    
    Analyzes businesses selling similar product categories to provide benchmarks:
    - Average order values by category
    - Popular products in the same category (platform-wide)
    - Category growth trends
    
    PRIVACY: No individual business names or identifiable data is exposed.
    All data is aggregated across multiple businesses for compliance.
    """
    try:
        if not _token:
            return "❌ Authentication token not available. Please ensure you're logged in."
        
        # Step 1: Get this business's products to determine categories
        endpoint = f"{EXPRESS_BASE_URL}/api/product-unAuth/getAllProducts"
        response = requests.get(endpoint, timeout=5)
        
        if response.status_code != 200:
            return "❌ Failed to fetch product data for analysis"
        
        all_products = response.json().get('products', [])
        
        # Find this business's categories
        business_products = [
            p for p in all_products
            if p.get('business', {}).get('businessId') == business_id
        ]
        
        if not business_products:
            return "ℹ️ Add products first to get competitor insights based on your categories."
        
        business_categories = set(p.get('category', '').lower() for p in business_products)
        business_categories.discard('')
        
        # Step 2: Find products in same categories from OTHER businesses
        competitor_products = [
            p for p in all_products
            if p.get('category', '').lower() in business_categories
            and p.get('business', {}).get('businessId') != business_id
        ]
        
        if not competitor_products:
            return f"ℹ️ No other businesses found in your categories: {', '.join(business_categories)}"
        
        # Step 3: Aggregate anonymized insights
        category_stats = {}
        for cat in business_categories:
            cat_products = [p for p in competitor_products if p.get('category', '').lower() == cat]
            
            if cat_products:
                avg_price = sum(p.get('price', 0) for p in cat_products) / len(cat_products)
                
                # Count product name frequency (popular products)
                product_names = {}
                for p in cat_products:
                    name = p.get('productName', 'Unknown')
                    product_names[name] = product_names.get(name, 0) + 1
                
                top_products = sorted(product_names.items(), key=lambda x: x[1], reverse=True)[:5]
                
                category_stats[cat] = {
                    "business_count": len(set(p.get('business', {}).get('businessId') for p in cat_products)),
                    "product_count": len(cat_products),
                    "avg_price": avg_price,
                    "popular_products": [name for name, _ in top_products]
                }
        
        # Format insights - CONCISE KEY METRICS
        lines = ["🔍 Competitor Insights (Anonymized):"]
        
        for cat, stats in category_stats.items():
            cat_emoji = {"drink": "☕", "food": "🥐", "dessert": "🍰"}.get(cat, "📦")
            lines.append(f"{cat_emoji} {cat.capitalize()}: {stats['business_count']} businesses, avg £{stats['avg_price']:.2f}")
            # Top 3 popular products only
            for prod in stats['popular_products'][:3]:
                lines.append(f"  • {prod}")
        
        summary = "\n".join(lines)
        
        return {
            "success": True,
            "categories_analyzed": list(business_categories),
            "summary": summary,
            "stats": category_stats
        }
        
    except Exception as e:
        return f"⚠️ Error fetching competitor insights: {str(e)}"


@mcp.tool()
def get_product_recommendations(business_id: str):
    """
    Recommends products to add based on:
    1. Popular products in competitor businesses (same category)
    2. Platform-wide trending items
    3. Gaps in current business product catalog
    
    Helps businesses expand their offerings strategically.
    """
    try:
        # Get competitor insights first (which includes popular products)
        insights_result = get_competitor_insights(business_id)
        
        if isinstance(insights_result, str) and "❌" in insights_result:
            return insights_result
        
        if not isinstance(insights_result, dict) or not insights_result.get('success'):
            return "❌ Unable to generate recommendations at this time"
        
        # Get current business products
        current_products_result = get_business_products(business_id)
        current_products = []
        
        if isinstance(current_products_result, dict) and current_products_result.get('success'):
            current_products = [
                p.get('productName', '').lower() 
                for p in current_products_result.get('products', [])
            ]
        
        # Extract recommendations from competitor insights
        stats = insights_result.get('stats', {})
        recommendations = []
        
        for category, data in stats.items():
            popular = data.get('popular_products', [])
            
            # Filter out products already in catalog
            new_suggestions = [
                p for p in popular
                if p.lower() not in current_products
            ][:3]  # Top 3 per category
            
            if new_suggestions:
                recommendations.append({
                    "category": category,
                    "products": new_suggestions,
                    "avg_price": data.get('avg_price', 0)
                })
        
        if not recommendations:
            return "✅ Your catalog is comprehensive! You offer the most popular items in your categories."
        
        # Format as concise bullet points
        lines = ["💡 Recommended Products:"]
        for rec in recommendations:
            cat_emoji = {"drink": "☕", "food": "🥐", "dessert": "🍰"}.get(rec['category'], "📦")
            for product in rec['products']:
                lines.append(f"{cat_emoji} {product} (~£{rec['avg_price']:.2f})")
        
        summary = "\n".join(lines)
        
        return {
            "success": True,
            "recommendation_count": sum(len(r['products']) for r in recommendations),
            "summary": summary,
            "recommendations": recommendations
        }
        
    except Exception as e:
        return f"⚠️ Error generating product recommendations: {str(e)}"


@mcp.tool()
def get_performance_insights(business_id: str):
    """
    Analyzes business performance trends and provides actionable insights.
    
    Examines:
    - Week-over-week growth trends
    - Best performing days of the week
    - Top and underperforming products
    - Revenue patterns
    
    Returns concise key insights with specific recommendations.
    """
    try:
        # Get analytics data
        analytics_result = get_business_analytics(business_id)
        
        if isinstance(analytics_result, str) and "❌" in analytics_result:
            return analytics_result
        
        if not isinstance(analytics_result, dict) or not analytics_result.get('success'):
            return "❌ Unable to analyze performance at this time"
        
        analytics = analytics_result.get('raw_data', {})
        overview = analytics.get('overview', {})
        sales_by_week = analytics.get('salesByWeek', [])
        revenue_by_day = analytics.get('revenueByDayOfWeek', [])
        top_products = analytics.get('topProducts', [])
        
        # Build concise key insights
        insights = []
        
        total_revenue = overview.get('totalRevenue', 0)
        total_orders = overview.get('totalOrders', 0)
        avg_order = overview.get('averageOrderValue', 0)
        
        # Week-over-week trend
        if len(sales_by_week) >= 2:
            last_week = sales_by_week[-1].get('totalSales', 0)
            prev_week = sales_by_week[-2].get('totalSales', 0)
            
            if prev_week > 0:
                growth = ((last_week - prev_week) / prev_week) * 100
                emoji = "📈" if growth > 0 else "📉"
                insights.append(f"{emoji} Week-over-week: {growth:+.1f}%")
        
        # Best/worst days
        if revenue_by_day and len(revenue_by_day) > 1:
            sorted_days = sorted(revenue_by_day, key=lambda x: x.get('totalSales', 0), reverse=True)
            best_day = sorted_days[0]
            worst_day = sorted_days[-1]
            insights.append(f"⭐ Best: {best_day.get('_id')} (£{best_day.get('totalSales', 0):.2f})")
            insights.append(f"⚠️ Weakest: {worst_day.get('_id')} (£{worst_day.get('totalSales', 0):.2f})")
        
        # Top product
        if top_products:
            top = top_products[0]
            insights.append(f"🏆 Top: {top.get('productName')} ({top.get('totalQuantity')} sold)")
        
        # Key recommendations (max 2)
        recs = []
        if avg_order < 10 and total_orders > 0:
            recs.append("💡 Boost avg order: Bundle products or create combos")
        if total_orders > 0 and total_orders < 50:
            recs.append("💡 Increase visibility: Focus on marketing campaigns")
        elif total_orders > 100:
            recs.append("💡 Scale up: Consider expanding product range")
        
        if revenue_by_day and len(revenue_by_day) > 1:
            sorted_days = sorted(revenue_by_day, key=lambda x: x.get('totalSales', 0), reverse=True)
            worst = sorted_days[-1]
            if worst.get('totalSales', 0) < sorted_days[0].get('totalSales', 0) * 0.5:
                recs.append(f"💡 Run promotions on {worst.get('_id')} to boost slower days")
        
        insights.extend(recs[:2])  # Limit to 2 recommendations
        
        summary = "\n".join(insights)
        
        return {
            "success": True,
            "summary": summary,
            "metrics": {
                "total_revenue": total_revenue,
                "total_orders": total_orders,
                "avg_order_value": avg_order
            }
        }
        
    except Exception as e:
        return f"⚠️ Error analyzing performance: {str(e)}"


# Run the MCP server with HTTP transport
if __name__ == "__main__":
    # The server will be available at http://localhost:8000/mcp by default for HTTP transport
    port = int(os.getenv("PORT", 8000))
    mcp.run(transport="http", host="0.0.0.0", port=port)
