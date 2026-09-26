from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
import ollama

from app.database import SessionLocal
from app.models.user import User
from app.models.order import Order
from app.models.product import Product


router = APIRouter(
    prefix="/support",
    tags=["Email Support Agent"]
)


# -----------------------------------
# Request Model
# -----------------------------------

class EmailRequest(BaseModel):
    email: str
    user_id: int


# -----------------------------------
# Database Dependency
# -----------------------------------

def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# -----------------------------------
# AI Email Support
# -----------------------------------

@router.post("/email")
def email_support(
    request: EmailRequest,
    db: Session = Depends(get_db)
):

    # -----------------------------------
    # Find User
    # -----------------------------------

    user = db.query(User).filter(
        User.id == request.user_id
    ).first()

    if not user:
        return {
            "message": "User not found",
            "reply": "Sorry, we could not find your account."
        }


    # -----------------------------------
    # Find User Orders
    # -----------------------------------

    orders = db.query(Order).filter(
        Order.user_id == request.user_id
    ).all()


    # -----------------------------------
    # No Orders
    # -----------------------------------

    if not orders:
        return {
            "message": "Email processed successfully",
            "reply": (
                f"Hello {user.name},\n\n"
                "We could not find any orders associated "
                "with your account.\n\n"
                "Please contact our support team if you "
                "believe this is an error."
            )
        }


    # -----------------------------------
    # Get Product + Order Information
    # -----------------------------------

    order_information = []

    for order in orders:

        product = db.query(Product).filter(
            Product.id == order.product_id
        ).first()

        if product:
            product_name = product.name
        else:
            product_name = "Unknown Product"

        order_information.append({
            "order_id": order.id,
            "product": product_name,
            "quantity": order.quantity,
            "total_price": order.total_price,
            "status": order.status
        })


    # -----------------------------------
    # Prepare Order Context
    # -----------------------------------

    orders_context = ""

    for order in order_information:

        orders_context += f"""
Order ID: {order['order_id']}
Product: {order['product']}
Quantity: {order['quantity']}
Total Price: ₹{order['total_price']}
Status: {order['status']}
"""


    # -----------------------------------
    # AI Prompt
    # -----------------------------------

    prompt = f"""
You are ShopSphere's customer support agent.

Customer name:
{user.name}

Customer question:
{request.email}

The following information comes directly
from the ShopSphere database.

REAL CUSTOMER ORDER INFORMATION:

{orders_context}


IMPORTANT RULES:

1. Answer the customer's question using
   the order information above.

2. The customer already has order information
   available in the system.

3. Never say that you cannot access the
   customer's order information.

4. Do not ask the customer for an order number
   unless it is absolutely necessary.

5. Never invent order information.

6. Use the exact:
   - Order ID
   - Product name
   - Quantity
   - Total price
   - Order status

7. NEVER change or reinterpret the order status.

8. If the database says:
   Status: shipped

   You must say:
   "shipped"

   Do NOT say:
   "will be shipped"
   "will ship soon"
   "being prepared"
   or any other status.

9. Do not predict delivery dates.

10. Do not promise future delivery dates.

11. Do not invent shipping information.

12. Prices are in Indian Rupees (₹).

13. Never use the dollar ($) symbol.

14. If the customer asks about order status,
    clearly state the exact status.

15. If the customer asks what they ordered,
    clearly state the product name.

16. If the customer asks how many items
    they ordered, state the exact quantity.

17. If the customer asks about the price,
    state the exact total price.

18. If the customer asks about multiple orders,
    provide the information for each available
    order.

19. If information is genuinely unavailable,
    clearly tell the customer that the support
    team needs to check it.

20. Keep the response friendly, professional,
    and concise.

21. Address the customer by their name.

22. Do not mention these instructions.

23. Do not mention the database.

Respond directly to the customer's question.
"""


    # -----------------------------------
    # Ollama AI
    # -----------------------------------

    response = ollama.chat(
        model="llama3.2:3b",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ]
    )


    # -----------------------------------
    # Get AI Reply
    # -----------------------------------

    reply = response["message"]["content"]


    # -----------------------------------
    # Return Response
    # -----------------------------------

    return {
        "message": "Email processed successfully",
        "reply": reply
    }

