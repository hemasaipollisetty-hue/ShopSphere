from pydantic import BaseModel
from typing import Optional


class OrderCreate(BaseModel):
    user_id: int
    product_id: int
    quantity: int

    # Payment
    payment_method: Optional[str] = None

    # Delivery address
    delivery_name: Optional[str] = None
    delivery_phone: Optional[str] = None
    delivery_address: Optional[str] = None
    delivery_city: Optional[str] = None
    delivery_state: Optional[str] = None
    delivery_pincode: Optional[str] = None


class OrderStatusUpdate(BaseModel):
    status: str