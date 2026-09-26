from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.cart import Cart
from app.models.product import Product

router = APIRouter(
    prefix="/cart",
    tags=["Cart"]
)


# =========================================================
# DATABASE DEPENDENCY
# =========================================================

def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# =========================================================
# GET CART
# GET /cart/{user_id}
# =========================================================

@router.get("/{user_id}")
def get_cart(
    user_id: int,
    db: Session = Depends(get_db)
):
    cart_items = (
        db.query(Cart)
        .filter(Cart.user_id == user_id)
        .all()
    )

    result = []

    for item in cart_items:

        product = (
            db.query(Product)
            .filter(Product.id == item.product_id)
            .first()
        )

        if product:
            result.append({
                "id": item.id,
                "user_id": item.user_id,
                "product_id": item.product_id,
                "quantity": item.quantity,

                "product": {
                    "id": product.id,
                    "name": product.name,
                    "price": product.price,
                    "description": product.description,
                    "category": product.category
                }
            })

    return result


# =========================================================
# ADD PRODUCT TO CART
# POST /cart/?user_id=1&product_id=1&quantity=1
# =========================================================

@router.post("/")
def add_to_cart(
    user_id: int,
    product_id: int,
    quantity: int = 1,
    db: Session = Depends(get_db)
):

    # Validate quantity
    if quantity < 1:
        raise HTTPException(
            status_code=400,
            detail="Quantity must be at least 1"
        )

    # Check product
    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    # Check whether product already exists in cart
    existing_item = (
        db.query(Cart)
        .filter(
            Cart.user_id == user_id,
            Cart.product_id == product_id
        )
        .first()
    )

    if existing_item:

        # Increase quantity
        existing_item.quantity += quantity

    else:

        # Create new cart item
        new_item = Cart(
            user_id=user_id,
            product_id=product_id,
            quantity=quantity
        )

        db.add(new_item)

    db.commit()

    return {
        "success": True,
        "message": "Product added to cart successfully"
    }


# =========================================================
# UPDATE CART QUANTITY
# PUT /cart/{cart_id}?quantity=2
# =========================================================

@router.put("/{cart_id}")
def update_cart(
    cart_id: int,
    quantity: int,
    db: Session = Depends(get_db)
):

    # Validate quantity
    if quantity < 1:
        raise HTTPException(
            status_code=400,
            detail="Quantity must be at least 1"
        )

    # Find cart item
    cart_item = (
        db.query(Cart)
        .filter(Cart.id == cart_id)
        .first()
    )

    if not cart_item:
        raise HTTPException(
            status_code=404,
            detail="Cart item not found"
        )

    # Update quantity
    cart_item.quantity = quantity

    db.commit()

    return {
        "success": True,
        "message": "Cart updated successfully",
        "cart_id": cart_id,
        "quantity": quantity
    }


# =========================================================
# REMOVE PRODUCT FROM CART
# DELETE /cart/{cart_id}
# =========================================================

@router.delete("/{cart_id}")
def remove_from_cart(
    cart_id: int,
    db: Session = Depends(get_db)
):

    # Find cart item
    cart_item = (
        db.query(Cart)
        .filter(Cart.id == cart_id)
        .first()
    )

    if not cart_item:
        raise HTTPException(
            status_code=404,
            detail="Cart item not found"
        )

    # Delete cart item
    db.delete(cart_item)

    db.commit()

    return {
        "success": True,
        "message": "Product removed from cart"
    }