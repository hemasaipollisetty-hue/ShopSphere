from sqlalchemy import Column, Integer, Float, String, DateTime
from datetime import datetime

from app.database import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    product_id = Column(Integer, nullable=False)
    quantity = Column(Integer, nullable=False)
    total_price = Column(Float, nullable=False)

    # Order status
    status = Column(String, default="pending")

    # Order creation date
    created_at = Column(DateTime, default=datetime.utcnow)

    # Payment method
    # UPI / CARD / COD
    payment_method = Column(String, nullable=True)

    # Delivery address snapshot
    delivery_name = Column(String, nullable=True)
    delivery_phone = Column(String, nullable=True)
    delivery_address = Column(String, nullable=True)
    delivery_city = Column(String, nullable=True)
    delivery_state = Column(String, nullable=True)
    delivery_pincode = Column(String, nullable=True)