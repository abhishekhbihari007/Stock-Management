from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List
from datetime import datetime
from app.models import OrderStatus


# Product Schemas
class ProductBase(BaseModel):
    name: str
    sku: str
    description: Optional[str] = None
    price: float
    stock_quantity: int = 0
    category: Optional[str] = None

    @validator('price')
    def price_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('Price must be positive')
        return v

    @validator('stock_quantity')
    def stock_must_be_non_negative(cls, v):
        if v < 0:
            raise ValueError('Stock quantity cannot be negative')
        return v


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    stock_quantity: Optional[int] = None
    category: Optional[str] = None


class ProductResponse(ProductBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Customer Schemas
class CustomerBase(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class CustomerResponse(CustomerBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Order Item Schemas
class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int

    @validator('quantity')
    def quantity_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('Quantity must be positive')
        return v


class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: float
    product: Optional[ProductResponse] = None

    class Config:
        from_attributes = True


# Order Schemas
class OrderCreate(BaseModel):
    customer_id: int
    items: List[OrderItemCreate]
    notes: Optional[str] = None


class OrderUpdate(BaseModel):
    status: Optional[OrderStatus] = None
    notes: Optional[str] = None


class OrderResponse(BaseModel):
    id: int
    customer_id: int
    status: OrderStatus
    total_amount: float
    notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    customer: Optional[CustomerResponse] = None
    items: List[OrderItemResponse] = []

    class Config:
        from_attributes = True


# Inventory Log Schemas
class InventoryLogResponse(BaseModel):
    id: int
    product_id: int
    change_type: str
    quantity_change: int
    quantity_before: int
    quantity_after: int
    reference_id: Optional[int] = None
    notes: Optional[str] = None
    created_at: datetime
    product: Optional[ProductResponse] = None

    class Config:
        from_attributes = True


class InventoryAdjustment(BaseModel):
    quantity_change: int
    notes: Optional[str] = None


# Summary/Dashboard Schemas
class DashboardStats(BaseModel):
    total_products: int
    total_customers: int
    total_orders: int
    pending_orders: int
    low_stock_products: int
    total_revenue: float
