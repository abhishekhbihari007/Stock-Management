from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class OrderStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    shipped = "shipped"
    delivered = "delivered"
    cancelled = "cancelled"


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    sku = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    stock_quantity = Column(Integer, default=0, nullable=False)
    category = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    order_items = relationship("OrderItem", back_populates="product")
    inventory_logs = relationship("InventoryLog", back_populates="product")


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    phone = Column(String(50), nullable=True)
    address = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    orders = relationship("Order", back_populates="customer")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    status = Column(Enum(OrderStatus), default=OrderStatus.pending, nullable=False)
    total_amount = Column(Float, default=0.0, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    customer = relationship("Customer", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)

    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")


class InventoryLog(Base):
    __tablename__ = "inventory_logs"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    change_type = Column(String(50), nullable=False)  # "restock", "sale", "adjustment"
    quantity_change = Column(Integer, nullable=False)
    quantity_before = Column(Integer, nullable=False)
    quantity_after = Column(Integer, nullable=False)
    reference_id = Column(Integer, nullable=True)  # order_id if sale
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    product = relationship("Product", back_populates="inventory_logs")
