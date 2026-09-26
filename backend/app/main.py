from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine

from app.models.user import User
from app.models.product import Product
from app.models.order import Order
from app.models.cart import Cart
from app.models.address import Address

from app.routes.users import router as users_router
from app.routes.orders import router as orders_router
from app.routes.products import router as products_router
from app.routes.support import router as support_router
from app.routes.cart import router as cart_router
from app.routes.addresses import router as addresses_router


# =====================================================
# CREATE DATABASE TABLES
# =====================================================

Base.metadata.create_all(bind=engine)


# =====================================================
# FASTAPI APPLICATION
# =====================================================

app = FastAPI(
    title="ShopSphere",
    description="AI-powered e-commerce application with Email Support Agent",
    version="1.0.0"
)


# =====================================================
# CORS
# =====================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173"
        "https://shop-sphere-brown-one.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =====================================================
# ROUTES
# =====================================================

app.include_router(users_router)
app.include_router(orders_router)
app.include_router(products_router)
app.include_router(support_router)
app.include_router(cart_router)
app.include_router(addresses_router)


# =====================================================
# ROOT
# =====================================================

@app.get("/")
def root():
    return {
        "message": "ShopSphere API is running"
    }


# =====================================================
# HEALTH CHECK
# =====================================================

@app.get("/health")
def health():
    return {
        "status": "healthy"
    }