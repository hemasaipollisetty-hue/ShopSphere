from app.database import Base, engine

from app.models.user import User
from app.models.product import Product
from app.models.order import Order
from app.models.cart import Cart


Base.metadata.create_all(bind=engine)

print("✅ Cart table created successfully!")