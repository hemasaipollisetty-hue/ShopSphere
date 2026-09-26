from sqlalchemy import Column, Integer, String, Boolean
from app.database import Base


class Address(Base):
    __tablename__ = "addresses"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, nullable=False, index=True)

    name = Column(String, nullable=False)
    phone = Column(String, nullable=True)

    address = Column(String, nullable=False)
    city = Column(String, nullable=False)
    state = Column(String, nullable=False)
    pincode = Column(String, nullable=False)

    is_default = Column(Boolean, default=False)