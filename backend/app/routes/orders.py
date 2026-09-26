from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.order import Order
from app.models.product import Product
from app.models.user import User
from app.models.cart import Cart
from app.models.address import Address
from app.schemas.order import OrderCreate, OrderStatusUpdate


router = APIRouter(
    prefix="/orders",
    tags=["Orders"]
)


# =====================================================
# DATABASE
# =====================================================

def get_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


# =====================================================
# PAYMENT HELPERS
# =====================================================

def validate_payment_method(payment_method):
    """
    Validate payment method.

    Supported:
    UPI
    CARD
    COD
    """

    if not payment_method:
        raise HTTPException(
            status_code=400,
            detail="Please select a payment method"
        )

    payment_method = payment_method.upper()

    allowed_payment_methods = [
        "UPI",
        "CARD",
        "COD"
    ]

    if payment_method not in allowed_payment_methods:
        raise HTTPException(
            status_code=400,
            detail="Invalid payment method. Choose UPI, CARD or COD."
        )

    return payment_method


# =====================================================
# DATE HELPERS
# =====================================================

def calculate_delivery_date(created_at):
    """
    Expected delivery is 4 days after the order date.
    """

    if not created_at:
        return None

    return created_at + timedelta(days=4)


def format_date(date_value):
    """
    Convert datetime to readable date.

    Example:
    25 Sep 2026
    """

    if not date_value:
        return None

    return date_value.strftime("%d %b %Y")


# =====================================================
# AUTOMATIC ORDER STATUS - DAY BASED
# =====================================================

def get_automatic_status(order):
    """
    Automatically determine order status
    based on the number of days since the order
    was placed.

    Tracking flow:

    Day 0 -> Order Placed
    Day 1 -> Confirmed
    Day 2 -> Shipped
    Day 3 -> Out for Delivery
    Day 4+ -> Delivered
    """

    # Cancelled orders should never change automatically
    if order.status == "cancelled":
        return "cancelled"

    # Old orders created before created_at was added
    if not order.created_at:
        return order.status

    elapsed_seconds = (
        datetime.utcnow() - order.created_at
    ).total_seconds()

    elapsed_days = elapsed_seconds / (24 * 60 * 60)

    if elapsed_days < 1:
        return "pending"

    elif elapsed_days < 2:
        return "confirmed"

    elif elapsed_days < 3:
        return "shipped"

    elif elapsed_days < 4:
        return "out_for_delivery"

    else:
        return "delivered"


# =====================================================
# CREATE SINGLE ORDER
# =====================================================

@router.post("/")
def create_order(
    order: OrderCreate,
    db: Session = Depends(get_db)
):

    # -------------------------------
    # Check user
    # -------------------------------

    user = db.query(User).filter(
        User.id == order.user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # -------------------------------
    # Check product
    # -------------------------------

    product = db.query(Product).filter(
        Product.id == order.product_id
    ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    # -------------------------------
    # Validate quantity
    # -------------------------------

    if order.quantity < 1:
        raise HTTPException(
            status_code=400,
            detail="Quantity must be at least 1"
        )

    # -------------------------------
    # Validate payment
    # -------------------------------

    payment_method = validate_payment_method(
        order.payment_method
    )

    # -------------------------------
    # Calculate total
    # -------------------------------

    total_price = product.price * order.quantity

    # -------------------------------
    # Create order
    # -------------------------------

    new_order = Order(
        user_id=order.user_id,
        product_id=order.product_id,
        quantity=order.quantity,
        total_price=total_price,
        status="pending",

        payment_method=payment_method,

        delivery_name=order.delivery_name,
        delivery_phone=order.delivery_phone,
        delivery_address=order.delivery_address,
        delivery_city=order.delivery_city,
        delivery_state=order.delivery_state,
        delivery_pincode=order.delivery_pincode
    )

    db.add(new_order)

    # Get created_at before commit
    db.flush()

    delivery_date = calculate_delivery_date(
        new_order.created_at
    )

    db.commit()
    db.refresh(new_order)

    return {
        "message": "Order created successfully",

        "order": {
            "id": new_order.id,
            "user_id": new_order.user_id,
            "product_id": new_order.product_id,
            "quantity": new_order.quantity,
            "total_price": new_order.total_price,
            "status": new_order.status,

            # Payment
            "payment_method": new_order.payment_method,

            "created_at": new_order.created_at,

            "order_date": format_date(
                new_order.created_at
            ),

            "delivery_date": delivery_date,

            "expected_delivery": format_date(
                delivery_date
            ),

            "delivery_name": new_order.delivery_name,
            "delivery_phone": new_order.delivery_phone,
            "delivery_address": new_order.delivery_address,
            "delivery_city": new_order.delivery_city,
            "delivery_state": new_order.delivery_state,
            "delivery_pincode": new_order.delivery_pincode
        }
    }


# =====================================================
# CHECKOUT CART
# =====================================================

@router.post("/checkout/{user_id}")
def checkout(
    user_id: int,
    address_id: int,
    payment_method: str,
    db: Session = Depends(get_db)
):

    # -------------------------------
    # Check user
    # -------------------------------

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # -------------------------------
    # Validate payment
    # -------------------------------

    payment_method = validate_payment_method(
        payment_method
    )

    # -------------------------------
    # Check address
    # -------------------------------

    address = db.query(Address).filter(
        Address.id == address_id,
        Address.user_id == user_id
    ).first()

    if not address:
        raise HTTPException(
            status_code=404,
            detail="Delivery address not found"
        )

    # -------------------------------
    # Get cart
    # -------------------------------

    cart_items = db.query(Cart).filter(
        Cart.user_id == user_id
    ).all()

    if not cart_items:
        raise HTTPException(
            status_code=400,
            detail="Your cart is empty"
        )

    created_orders = []
    grand_total = 0

    # =================================================
    # CREATE ORDER FOR EACH CART PRODUCT
    # =================================================

    for cart_item in cart_items:

        product = db.query(Product).filter(
            Product.id == cart_item.product_id
        ).first()

        if not product:
            continue

        if cart_item.quantity < 1:
            continue

        total_price = (
            product.price * cart_item.quantity
        )

        # -------------------------------
        # Create order
        # -------------------------------

        new_order = Order(
            user_id=user_id,
            product_id=product.id,
            quantity=cart_item.quantity,
            total_price=total_price,
            status="pending",

            # Payment
            payment_method=payment_method,

            # Delivery address snapshot
            delivery_name=address.name,
            delivery_phone=address.phone,
            delivery_address=address.address,
            delivery_city=address.city,
            delivery_state=address.state,
            delivery_pincode=address.pincode
        )

        db.add(new_order)

        # Make sure created_at and ID are available
        db.flush()

        # -------------------------------
        # Calculate delivery date
        # -------------------------------

        delivery_date = calculate_delivery_date(
            new_order.created_at
        )

        # -------------------------------
        # Add order response
        # -------------------------------

        created_orders.append({

            "id": new_order.id,

            "user_id": user_id,

            "product_id": product.id,

            "product_name": product.name,

            "quantity": cart_item.quantity,

            "price": product.price,

            "total_price": total_price,

            "status": "pending",

            # Payment
            "payment_method": payment_method,

            "created_at": new_order.created_at,

            "order_date": format_date(
                new_order.created_at
            ),

            "delivery_date": delivery_date,

            "expected_delivery": format_date(
                delivery_date
            ),

            # Delivery address
            "delivery_name": address.name,

            "delivery_phone": address.phone,

            "delivery_address": address.address,

            "delivery_city": address.city,

            "delivery_state": address.state,

            "delivery_pincode": address.pincode
        })

        grand_total += total_price

    # -------------------------------
    # Validate orders
    # -------------------------------

    if not created_orders:
        raise HTTPException(
            status_code=400,
            detail="No valid products found in cart"
        )

    # -------------------------------
    # Clear cart
    # -------------------------------

    for cart_item in cart_items:
        db.delete(cart_item)

    db.commit()

    return {
        "message": "Order placed successfully",

        "user_id": user_id,

        "address_id": address_id,

        # Payment
        "payment_method": payment_method,

        "orders": created_orders,

        "grand_total": grand_total
    }


# =====================================================
# GET ALL ORDERS
# =====================================================

@router.get("/")
def get_orders(
    db: Session = Depends(get_db)
):

    orders = db.query(Order).all()

    for order in orders:

        automatic_status = get_automatic_status(order)

        if (
            order.status != "cancelled"
            and order.status != automatic_status
        ):
            order.status = automatic_status

    db.commit()

    return db.query(Order).all()


# =====================================================
# GET ORDERS FOR USER
# =====================================================

@router.get("/user/{user_id}")
def get_user_orders(
    user_id: int,
    db: Session = Depends(get_db)
):

    orders = db.query(Order).filter(
        Order.user_id == user_id
    ).all()

    result = []

    for order in orders:

        # -------------------------------
        # Automatic status
        # -------------------------------

        automatic_status = get_automatic_status(order)

        if (
            order.status != "cancelled"
            and order.status != automatic_status
        ):
            order.status = automatic_status

        # -------------------------------
        # Get product
        # -------------------------------

        product = db.query(Product).filter(
            Product.id == order.product_id
        ).first()

        # -------------------------------
        # Calculate delivery date
        # -------------------------------

        delivery_date = calculate_delivery_date(
            order.created_at
        )

        # -------------------------------
        # Add order
        # -------------------------------

        result.append({

            "id": order.id,

            "user_id": order.user_id,

            "product_id": order.product_id,

            "product_name": (
                product.name
                if product
                else "Unknown Product"
            ),

            "quantity": order.quantity,

            "total_price": order.total_price,

            "status": order.status,

            # Payment
            "payment_method": order.payment_method,

            # Exact timestamp
            "created_at": order.created_at,

            # Readable order date
            "order_date": format_date(
                order.created_at
            ),

            # Expected delivery date
            "delivery_date": delivery_date,

            "expected_delivery": format_date(
                delivery_date
            ),

            # Delivery address
            "delivery_name": order.delivery_name,

            "delivery_phone": order.delivery_phone,

            "delivery_address": order.delivery_address,

            "delivery_city": order.delivery_city,

            "delivery_state": order.delivery_state,

            "delivery_pincode": order.delivery_pincode
        })

    db.commit()

    return result


# =====================================================
# UPDATE ORDER STATUS MANUALLY
# =====================================================

@router.put("/{order_id}/status")
def update_order_status(
    order_id: int,
    status_data: OrderStatusUpdate,
    db: Session = Depends(get_db)
):

    order = db.query(Order).filter(
        Order.id == order_id
    ).first()

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found"
        )

    status = status_data.status

    allowed_statuses = [
        "pending",
        "confirmed",
        "shipped",
        "out_for_delivery",
        "delivered",
        "cancelled"
    ]

    if status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Invalid order status"
        )

    order.status = status

    db.commit()
    db.refresh(order)

    delivery_date = calculate_delivery_date(
        order.created_at
    )

    return {
        "message": "Order status updated successfully",

        "order": {
            "id": order.id,

            "user_id": order.user_id,

            "product_id": order.product_id,

            "quantity": order.quantity,

            "total_price": order.total_price,

            "status": order.status,

            # Payment
            "payment_method": order.payment_method,

            "created_at": order.created_at,

            "order_date": format_date(
                order.created_at
            ),

            "delivery_date": delivery_date,

            "expected_delivery": format_date(
                delivery_date
            ),

            "delivery_name": order.delivery_name,

            "delivery_phone": order.delivery_phone,

            "delivery_address": order.delivery_address,

            "delivery_city": order.delivery_city,

            "delivery_state": order.delivery_state,

            "delivery_pincode": order.delivery_pincode
        }
    }


# =====================================================
# DELETE ORDER
# =====================================================

@router.delete("/{order_id}")
def delete_order(
    order_id: int,
    db: Session = Depends(get_db)
):

    order = db.query(Order).filter(
        Order.id == order_id
    ).first()

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found"
        )

    # Only allow deletion for out-for-delivery orders
    if order.status != "out_for_delivery":
        raise HTTPException(
            status_code=400,
            detail="Only out-for-delivery orders can be deleted"
        )

    db.delete(order)
    db.commit()

    return {
        "message": "Order deleted successfully",
        "order_id": order_id
    }