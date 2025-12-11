# AI Agent Instructions for Multi-Tenant Café Application

## Architecture Overview

This is a **microservices-based food ordering platform** (JustEat-style) with AI-powered shopping assistance. Four services communicate via HTTP:

```
Frontend (React/Vite) → Backend (Express) → AI Agent (FastAPI) → MCP Server (FastMCP)
                              ↓
                         MongoDB Atlas
```

**Service boundaries:**
- `frontend/`: React SPA with Tailwind CSS, handles UI/UX and client-side routing
- `backend/`: Express API, manages auth, data persistence, and business logic
- `ai-agent-service/`: FastAPI service running OpenAI Agents for conversational AI
- `ai-mcp-service/`: FastMCP server exposing backend tools to AI agents via Model Context Protocol

**Critical data flow:** User JWT tokens flow from frontend → backend → AI agent → MCP server. The MCP server uses `set_auth_token()` before calling protected endpoints.

## Authentication System

**Dual-layer JWT authentication** with automatic refresh:

1. **Backend**: `authenticateToken` middleware in `server.js` validates JWT on all protected routes (`/api/*-auth`)
2. **Frontend**: `makeAuthenticatedRequest` in `utils/api.js` auto-refreshes expired tokens via `/api/user-unAuth/refresh`

**Token format:** Always `Bearer <token>` in Authorization header, except AI services strip "Bearer " prefix internally.

**Key files:**
- `backend/controller/authCheck.js`: Token generation/validation helpers
- `frontend/src/utils/api.js`: Auto-refresh wrapper for all authenticated requests

## Data Models

**User schema** (`backend/models/User.js`):
- `checkoutBasket[]`: In-progress order items (productId, quantity)
- `orders[]`: Completed order references
- `business{}`: Optional business affiliation (owner/employee)

**Order schema** (`backend/models/Order.js`):
- Denormalizes product info (name, price) to preserve historical data
- `businessId` at both order and product level for multi-vendor support

## Development Workflows

### Local Development
```bash
# Start all services with hot reload
docker compose up --build

# Access points:
# Frontend: http://localhost:4173
# Backend: http://localhost:3000
# AI Agent: http://localhost:5050
# MCP Server: http://localhost:8000
```

### Backend Development
```bash
cd backend
npm run dev  # Uses node --watch for hot reload
```

**Environment variables:** Each service requires its own `.env` file (see `README.md` for templates). Never commit `.env` files.

### Frontend Development
```bash
cd frontend
npm run dev  # Vite dev server on :5173
npm run build  # Production build
npm run preview  # Preview production build
```

**Environment pattern:** All backend URLs accessed via `import.meta.env.VITE_BACKEND_URL` (injected at build time in Docker).

## AI Agent Architecture

**Agent → MCP communication pattern:**
1. Frontend sends user message + conversation history to `/api/agentChat-auth`
2. Backend forwards token + message to AI Agent service (with 30-min caching)
3. AI Agent calls `set_auth_token()` on MCP server, then invokes tools
4. MCP server makes authenticated requests to backend endpoints

**Key implementation:** 
- `ai-agent-service/src/main.py` defines two specialized agents:
  - `product_agent`: Customer-focused product browsing and ordering
  - `business_agent`: Business intelligence and analytics for owners/employees
- `triage_agent`: Routes queries based on user role (business vs customer) and intent
- `ai-mcp-service/src/main.py`: MCP tools wrap backend API calls

**Triage routing logic:**
- Detects `userData.user.business.businessId` → Routes to business_agent
- Keywords: "analytics", "performance", "sales" → business_agent
- Keywords: "menu", "checkout", "order" → product_agent

**CRITICAL: User Data Structure**
The AI Agent receives `userData` with this structure:
```javascript
userData = {
  user: {
    _id: "user_mongodb_id",
    email: "user@example.com",
    business: {
      businessId: "business_mongodb_id",  // <-- Required for business tools!
      businessName: "Coffee Shop",
      userRole: "owner" | "employee"
    }
  }
}
```
**All business MCP tools require `business_id` parameter.** The agent must extract it from `userData.user.business.businessId` and pass it explicitly to each tool call.

**Available MCP tools:**

*Customer tools:*
- `search_product_by_name`, `search_all_products`: Product discovery
- `add_item_to_checkout`, `fetch_user_checkout`, `remove_from_checkout`: Cart management
- `fetch_user_orders`, `complete_user_order`: Order operations

*Business tools:*
- `get_business_analytics`: Fetch revenue, orders, top products, trends
- `get_business_products`: List current business product catalog
- `get_competitor_insights`: Anonymized category-level benchmarking (GDPR-compliant)
- `get_product_recommendations`: Suggest products based on competitor analysis and gaps
- `get_performance_insights`: Natural language performance analysis with recommendations

**Caching strategy:**
- Backend: 30-minute in-memory cache for common queries (performance, recommendations, competitors)
- Frontend: localStorage cache with TTL, refresh button to force update
- Fallback: Returns expired cache if AI service unavailable
- **Token savings:** ~95% reduction (1-2 API calls per 30 minutes vs every page load)

## Project-Specific Conventions

### API Response Format
```javascript
{
  success: boolean,
  message: string,
  payload?: any  // Optional data
}
```

### Route Naming Pattern
- `/api/<resource>-unAuth/<action>`: Public endpoints
- `/api/<resource>-auth/<action>`: Protected endpoints requiring JWT

**Example:** `userRoutes.js` handles `/api/user-auth/*`, `unAuthRoutes.js` handles `/api/user-unAuth/*`

### Component Organization (Frontend)
- `components/`: Reusable UI components
- `components/businessDashboardSubComponents/`: Business-specific nested components
- `pages/`: Route-level page components
- `utils/`: Shared utilities (API wrapper, logout, etc.)

### Docker Build Strategy
**Multi-stage builds** for production optimization:
- Frontend: Build with Vite → serve with `serve` package
- Backend: Copy only source + `node_modules`, run as non-root user
- Python services: Use official Python 3.12 base images

**Health checks:** All services expose health endpoints checked by Docker Compose `depends_on` conditions.

## Common Gotchas

1. **Token passing to AI services:** Backend sends raw JWT to AI agent (no "Bearer " prefix), agent strips it if present before forwarding to MCP
2. **Checkout vs Orders:** `checkoutBasket` is ephemeral cart state, `orders[]` are completed purchases
3. **Business multi-tenancy:** Users can be business owners/employees OR customers (not both). Check `user.business` existence
4. **Product categorization:** Categories are lowercase in DB ("drink", "food", "dessert") but displayed capitalized
5. **CORS origins:** Backend explicitly whitelists `localhost:5173` (dev), `localhost:4173` (prod), and Vercel production URL
6. **AI agent caching:** Backend caches insights for 30 mins - conversational queries (with history) bypass cache
7. **MCP tool privacy:** `get_competitor_insights` aggregates by category only - never exposes individual business names/data
8. **BusinessId path in frontend:** Always use `userData?.user?.business?.businessId` (not `userData?.business?.businessId`)
9. **BusinessId in AI agents:** Agent must extract from `userData['user']['business']['businessId']` and pass to all business tools

## Common Gotchas

**Cloudinary for images:** Frontend uploads product images directly to Cloudinary, stores URL in Product model. Configured via `VITE_CLOUDINARY_UPLOAD_URL`.

**MongoDB connection:** Single shared connection in `server.js`, models import from `mongoose` singleton.

**Inter-service URLs in Docker:** Services use internal Docker network names:
- `js-backend:3000`, `js-frontend:4173`, `js-ai-service:8000`, `ai-agent-service:5050`

## Testing & Debugging

No automated tests currently implemented. Manual testing workflow:
1. Check Docker logs: `docker compose logs -f <service-name>`
2. Backend health: `curl http://localhost:3000/health`
3. Test auth: Use `/api/user-unAuth/authCheck` with Bearer token

**Database inspection:** Connect to MongoDB Atlas using URI from `.env`, database name logged on startup.
