from pydantic import BaseModel
from typing import Optional


class AddressCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    address: str
    city: str
    state: str
    pincode: str


class AddressUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None


class AddressResponse(BaseModel):
    id: int
    user_id: int
    name: str
    phone: Optional[str]
    address: str
    city: str
    state: str
    pincode: str
    is_default: bool
    