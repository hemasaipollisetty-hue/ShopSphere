from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pwdlib import PasswordHash

from app.database import SessionLocal
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserProfileUpdate

router = APIRouter(prefix="/users", tags=["Users"])

password_hash = PasswordHash.recommended()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# =====================================================
# REGISTER
# =====================================================

@router.post("/")
def create_user(user: UserCreate, db: Session = Depends(get_db)):

    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    hashed_password = password_hash.hash(user.password)

    new_user = User(
        name=user.name,
        email=user.email,
        password=hashed_password
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User created successfully",
        "user": {
            "id": new_user.id,
            "name": new_user.name,
            "email": new_user.email,
            "phone": new_user.phone,
            "address": new_user.address,
            "city": new_user.city,
            "state": new_user.state,
            "pincode": new_user.pincode
        }
    }


# =====================================================
# LOGIN
# =====================================================

@router.post("/login")
def login_user(
    user_data: UserLogin,
    db: Session = Depends(get_db)
):

    user = db.query(User).filter(
        User.email == user_data.email
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found. Please register first."
        )

    if not user.password:
        raise HTTPException(
            status_code=400,
            detail="This account does not have a password. Please register again."
        )

    password_correct = password_hash.verify(
        user_data.password,
        user.password
    )

    if not password_correct:
        raise HTTPException(
            status_code=401,
            detail="Incorrect password."
        )

    return {
        "message": "Login successful",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "address": user.address,
            "city": user.city,
            "state": user.state,
            "pincode": user.pincode
        }
    }


# =====================================================
# GET USER PROFILE
# =====================================================

@router.get("/{user_id}")
def get_user_profile(
    user_id: int,
    db: Session = Depends(get_db)
):

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "address": user.address,
        "city": user.city,
        "state": user.state,
        "pincode": user.pincode
    }


# =====================================================
# UPDATE USER PROFILE
# =====================================================

@router.put("/{user_id}")
def update_user_profile(
    user_id: int,
    profile: UserProfileUpdate,
    db: Session = Depends(get_db)
):

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    if profile.name is not None:
        user.name = profile.name

    if profile.phone is not None:
        user.phone = profile.phone

    if profile.address is not None:
        user.address = profile.address

    if profile.city is not None:
        user.city = profile.city

    if profile.state is not None:
        user.state = profile.state

    if profile.pincode is not None:
        user.pincode = profile.pincode

    db.commit()
    db.refresh(user)

    return {
        "message": "Profile updated successfully",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "address": user.address,
            "city": user.city,
            "state": user.state,
            "pincode": user.pincode
        }
    }