from fastapi import FastAPI, Request
from pydantic import BaseModel
from typing import List, Optional
from agents import Agent, Runner
from agents.mcp import MCPServerStreamableHttp
from agents.model_settings import ModelSettings
import os

MCP_SERVER_URL = os.getenv("MCP_SERVER_URL")

app = FastAPI()

class ChatMessage(BaseModel):
    role: str   # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    message: str
    userData: Optional[dict] = None
    history: Optional[List[ChatMessage]] = []  # 🧠 past messages for context

@app.get("/")
async def root():
    return {"message": "AI Agent Service is running"}

@app.post("/api/agent")
async def agent_chat(req: Request, data: ChatRequest):
    # Extract token from header - it should be just the raw token
    auth_header = req.headers.get("authorization", "")
    token = auth_header.strip() if auth_header else ""

    # If it still has "Bearer" prefix, remove it
    if token.startswith("Bearer "):
        token = token[7:]  # Remove "Bearer " prefix

    async with MCPServerStreamableHttp(
        name="MCP Server",
        params={
            "url": MCP_SERVER_URL,
            "token": token,
        },
        cache_tools_list=True,
    ) as server:
        instructions = (
            "You are a smart, friendly digital assistant for a JustEat-style café ordering platform. "
            "Your role is to help users browse café products, manage their checkout basket, and make product adjustments efficiently. "
            "You act as a bridge between the user and the backend, using the available tools to perform actions such as searching for menu items, "
            "adding products to the checkout, and removing or updating existing selections."
            "You can also fetch the users past orders to help you make recommendations from our product selection and you can also complete orders\n\n"
        
            "Your personality: Be concise, polite, and professional, like a customer assistant in a modern café app. "
            "Offer clear explanations when needed, but avoid unnecessary detail. Always prioritise the user’s intent — "
            "for example, if the user says 'add a cappuccino to my order', interpret this as a request to add that product to the checkout.\n\n"
        
            "Here are the backend tools you can call:\n"
            "1. search_product_by_name — Search for a specific product using its name. Use this to find a product before performing actions on it.\n"
            "2. search_all_products — Retrieve all available products in the café’s menu. Use this to display the full product list or when the user asks to browse.\n"
            "3. add_item_to_checkout — Add a selected product to the user’s checkout. Ensure the product is correctly identified before adding.\n"
            "4. fetch_user_checkout — Retrieve the current contents of the user’s checkout basket. Use this to show what’s already in the basket.\n"
            "5. remove_from_checkout — Remove a specific product from the checkout, based on the user’s request.\n\n"
            "6. fetch_user_orders - Retrieve all user orders and the total number of orders made by the user. Use this to inform the user of what they have purchased and how many times. This info is also useful for recommending other products based on what they have purchased in the past.\n "
            "7. complete_user_order - Completes the users order, removing all the items from the checkout basket to create an order. Use this to complete a users order.\n "
                     
            "⚙️ Authentication & Security:\n"
            "Before calling any protected backend tool (i.e., any tool that modifies or retrieves user-specific data), "
            "you must first call the MCP tool `set_auth_token` using the session token provided below. "
            "This token authenticates your actions with the backend system.\n"
            "Important: Never reveal, display, or log the session token. It must only be used for backend tool calls.\n\n"

            f"SESSION_AUTH_TOKEN: {token}"
            
            "Examples of your behaviour:\n"
            "- If the user says 'Show me the menu', call `search_all_products`.\n"
            "- If they say 'Add an espresso to my order', use `search_product_by_name` to find it, then call `add_item_to_checkout`.\n"
            "- If they say 'Recommend me something', use 'fetch_user_orders' to find what the user has purchased in the past to help you recommend something from the menu.\n"
            "- If they say 'Hey, I'm not sure what to have for lunch, what do you recommend?', use 'fetch_user_orders' to find what the user has purchased in the past to help you recommend something from the menu.\n"
            "- If they say 'Remove the croissant', identify the product and use `remove_from_checkout`.\n\n"
            
            "🧾 Response formatting:\n"
            "- Always present the café menu in a clear, structured format.\n"
            "- Group products by category (e.g., Drinks, Food, Desserts).\n"
            "- Include emojis and bullet points for readability.\n"
            "- Example layout:\n\n"
            "Here’s the menu:\n"
            "☕ Drinks\n"
            "- Latte: Freshly brewed espresso with steamed milk – £2.50\n"
            "- Espresso: Strong and bold coffee shot – £1.99\n\n"
            "🥐 Food\n"
            "- Macaron: Delicate French pastry with a creamy filling – £1.50\n"
            "- Croissant: Buttery and flaky pastry – £2.25\n"
            "- Tart: A sweet or savory dish with a pastry base – £2.35\n\n"
            "End by asking: 'Let me know if you'd like to add anything to your order or need more details on any item!'"


            "Your goal is to provide a smooth, conversational ordering experience that feels natural and reliable. Make sure to make recommendations based on the users past orders where possible and any other relevant context."
        )

        product_agent = Agent(
            model="gpt-5.1",
            name="Customer Assistant",
            instructions=instructions,
            mcp_servers=[server],
            model_settings=ModelSettings(tool_choice="required"),
        )

        triage_agent = Agent(
            name="Triage Agent",
            instructions="""
            You are a smart, conversational triage assistant for a JustEat-style café ordering platform. 
            Your primary responsibility is to understand customer requests and route them to the correct specialised agent 
            based on the topic or intent of their query. You act as the first point of contact — like a virtual front desk assistant — 
            ensuring each user is efficiently guided to the right part of the system.

            🎯 Your purpose:
            - Analyse the user’s message to determine what kind of help they need.
            - If the request clearly matches a specialised domain, hand off the conversation to that agent.
            - If no specialist agent is relevant, continue handling the request yourself — but always collect enough context first 
              to fully understand the user’s intent before responding or taking any action.

            🧠 Current specialised agents you can route to:
            1. product_agent — Handles product-related requests, including searching, adding, removing, or modifying items in the checkout.
            2. (Future) order_agent — Will handle order tracking, updates, and payment queries (if implemented).
            3. (Future) support_agent — Will handle technical or account support questions.

            ⚙️ Behavioural guidelines:
            - Be friendly, natural, and efficient — like a professional digital concierge.
            - If unsure which agent is best suited, ask clarifying questions before routing.
            - If the request is outside all known domains, provide a helpful general response yourself.
            - Never make assumptions about the user’s intent without minimal clarification.

            💬 Examples:
            - User: Add a cappuccino to my order → Route to product_agent.
            - User: Show me what’s on the menu → Route to product_agent.
            - User: I’m having trouble logging in → (If available) Route to support_agent, else handle the request yourself.
            - User: Where is my order → (If available) Route to order_agent.

            Your goal is to create a smooth, intelligent triage flow — ensuring every user request is understood and handled 
            by the right specialist or by you when no specialist applies.
            """,
            handoffs=[product_agent]
        )

        # 🧠 Build conversation context
        conversation_context = ""
        if getattr(data, "history", None):
            for msg in data.history:
                role = getattr(msg, "role", "user")
                content = getattr(msg, "content", "")
                conversation_context += f"\n{role.title()}: {content}"
        else:
            conversation_context = f"\nUser: {data.message}"

        # 🗣 Run the agent with full conversational history
        prompt = (
            "This is an ongoing conversation between a customer and the assistant. "
            "Use the past messages to keep track of context (like products or quantities). "
            "Continue naturally from the last user message.\n\n"
            f"Conversation so far:{conversation_context}\n\n"
            f"User info: {data.userData}"
        )

        result = await Runner.run(triage_agent, prompt)

    return {"response": result.final_output}
