from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
from app.database import get_db
from app.models import InventoryLog, Product, Order, Customer, OrderStatus
from app.schemas import InventoryLogResponse, DashboardStats

router = APIRouter()


@router.get("/logs", response_model=List[InventoryLogResponse])
def get_inventory_logs(
    skip: int = 0,
    limit: int = 100,
    product_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(InventoryLog).options(joinedload(InventoryLog.product))
    if product_id:
        query = query.filter(InventoryLog.product_id == product_id)
    return query.order_by(InventoryLog.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/dashboard", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_products = db.query(func.count(Product.id)).scalar()
    total_customers = db.query(func.count(Customer.id)).scalar()
    total_orders = db.query(func.count(Order.id)).scalar()
    pending_orders = db.query(func.count(Order.id)).filter(Order.status == OrderStatus.pending).scalar()
    low_stock = db.query(func.count(Product.id)).filter(Product.stock_quantity <= 10).scalar()
    total_revenue = db.query(func.sum(Order.total_amount)).filter(
        Order.status != OrderStatus.cancelled
    ).scalar() or 0.0

    return DashboardStats(
        total_products=total_products,
        total_customers=total_customers,
        total_orders=total_orders,
        pending_orders=pending_orders,
        low_stock_products=low_stock,
        total_revenue=total_revenue
    )
