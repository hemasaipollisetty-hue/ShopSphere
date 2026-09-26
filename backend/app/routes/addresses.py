from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.address import Address
from app.schemas.address import (
    AddressCreate,
    AddressUpdate,
)

router = APIRouter(
    prefix="/addresses",
    tags=["Addresses"]
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# =====================================================
# GET ALL ADDRESSES FOR A USER
# =====================================================

@router.get("/{user_id}")
def get_user_addresses(
    user_id: int,
    db: Session = Depends(get_db)
):

    addresses = (
        db.query(Address)
        .filter(Address.user_id == user_id)
        .order_by(
            Address.is_default.desc(),
            Address.id.desc()
        )
        .all()
    )

    return [
        {
            "id": address.id,
            "user_id": address.user_id,
            "name": address.name,
            "phone": address.phone,
            "address": address.address,
            "city": address.city,
            "state": address.state,
            "pincode": address.pincode,
            "is_default": address.is_default,
        }
        for address in addresses
    ]


# =====================================================
# ADD NEW ADDRESS
# =====================================================

@router.post("/{user_id}")
def create_address(
    user_id: int,
    address_data: AddressCreate,
    db: Session = Depends(get_db)
):

    # Check whether user already has an address
    existing_address = (
        db.query(Address)
        .filter(Address.user_id == user_id)
        .first()
    )

    new_address = Address(
        user_id=user_id,
        name=address_data.name,
        phone=address_data.phone,
        address=address_data.address,
        city=address_data.city,
        state=address_data.state,
        pincode=address_data.pincode,
        is_default=existing_address is None,
    )

    db.add(new_address)
    db.commit()
    db.refresh(new_address)

    return {
        "message": "Address added successfully",
        "address": {
            "id": new_address.id,
            "user_id": new_address.user_id,
            "name": new_address.name,
            "phone": new_address.phone,
            "address": new_address.address,
            "city": new_address.city,
            "state": new_address.state,
            "pincode": new_address.pincode,
            "is_default": new_address.is_default,
        },
    }


# =====================================================
# UPDATE ADDRESS
# =====================================================

@router.put("/{address_id}")
def update_address(
    address_id: int,
    address_data: AddressUpdate,
    db: Session = Depends(get_db)
):

    address = (
        db.query(Address)
        .filter(Address.id == address_id)
        .first()
    )

    if not address:
        raise HTTPException(
            status_code=404,
            detail="Address not found"
        )

    if address_data.name is not None:
        address.name = address_data.name

    if address_data.phone is not None:
        address.phone = address_data.phone

    if address_data.address is not None:
        address.address = address_data.address

    if address_data.city is not None:
        address.city = address_data.city

    if address_data.state is not None:
        address.state = address_data.state

    if address_data.pincode is not None:
        address.pincode = address_data.pincode

    db.commit()
    db.refresh(address)

    return {
        "message": "Address updated successfully",
        "address": {
            "id": address.id,
            "user_id": address.user_id,
            "name": address.name,
            "phone": address.phone,
            "address": address.address,
            "city": address.city,
            "state": address.state,
            "pincode": address.pincode,
            "is_default": address.is_default,
        },
    }


# =====================================================
# DELETE ADDRESS
# =====================================================

@router.delete("/{address_id}")
def delete_address(
    address_id: int,
    db: Session = Depends(get_db)
):

    address = (
        db.query(Address)
        .filter(Address.id == address_id)
        .first()
    )

    if not address:
        raise HTTPException(
            status_code=404,
            detail="Address not found"
        )

    was_default = address.is_default
    user_id = address.user_id

    db.delete(address)
    db.commit()

    # If the deleted address was default,
    # make another address default.
    if was_default:

        next_address = (
            db.query(Address)
            .filter(Address.user_id == user_id)
            .order_by(Address.id.desc())
            .first()
        )

        if next_address:
            next_address.is_default = True
            db.commit()

    return {
        "message": "Address deleted successfully"
    }


# =====================================================
# SET DEFAULT ADDRESS
# =====================================================

@router.put("/{address_id}/default")
def set_default_address(
    address_id: int,
    db: Session = Depends(get_db)
):

    address = (
        db.query(Address)
        .filter(Address.id == address_id)
        .first()
    )

    if not address:
        raise HTTPException(
            status_code=404,
            detail="Address not found"
        )

    # Remove default from all addresses
    db.query(Address).filter(
        Address.user_id == address.user_id
    ).update(
        {"is_default": False}
    )

    # Make selected address default
    address.is_default = True

    db.commit()
    db.refresh(address)

    return {
        "message": "Default address updated successfully",
        "address": {
            "id": address.id,
            "user_id": address.user_id,
            "name": address.name,
            "phone": address.phone,
            "address": address.address,
            "city": address.city,
            "state": address.state,
            "pincode": address.pincode,
            "is_default": address.is_default,
        },
    }