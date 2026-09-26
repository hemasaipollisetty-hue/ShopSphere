from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.user import User
from app.models.order import Order
from app.models.product import Product
from app.schemas.email_support import EmailRequest
from app.services.ai_support import generate_support_reply


router = APIRouter(
    prefix="/support",
    tags=["Email Support Agent"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/email")
def email_support(
    email: EmailRequest,
    db: Session = Depends(get_db)
):

    # Find customer
    user = db.query(User).filter(
        User.email == email.customer_email
    ).first()

    if not user:
        return {
            "message": "Customer not found",
            "reply": (
                "We could not find an account with this email address. "
                "Please check your email address and try again."
            )
        }

    # Find latest order
    order = db.query(Order).filter(
        Order.user_id == user.id
    ).order_by(Order.id.desc()).first()

    # Prepare order information for AI
    if order:

        product = db.query(Product).filter(
            Product.id == order.product_id
        ).first()

        product_name = (
            product.name
            if product
            else "Unknown product"
        )

        order_info = {
            "order_id": order.id,
            "product": product_name,
            "quantity": order.quantity,
            "total_price": order.total_price,
            "status": order.status
        }

    else:
        order_info = "No orders found for this customer."

    # Generate AI response
    ai_reply = generate_support_reply(
        customer_name=user.name,
        subject=email.subject,
        message=email.message,
        order_info=order_info
    )

    return {
        "message": "AI support response generated successfully",
        "customer": user.name,
        "subject": email.subject,
        "reply": ai_reply
    }