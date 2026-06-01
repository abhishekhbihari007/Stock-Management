from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.schemas import OrderCreate, OrderUpdate, OrderResponse
from app.crud import orders as crud

router = APIRouter()


@router.get("/", response_model=List[OrderResponse])
def list_orders(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    customer_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    return crud.get_orders(db, skip=skip, limit=limit, status=status, customer_id=customer_id)


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: int, db: Session = Depends(get_db)):
    return crud.get_order(db, order_id)


@router.post("/", response_model=OrderResponse, status_code=201)
def create_order(order: OrderCreate, db: Session = Depends(get_db)):
    return crud.create_order(db, order)


@router.put("/{order_id}", response_model=OrderResponse)
def update_order(order_id: int, order: OrderUpdate, db: Session = Depends(get_db)):
    return crud.update_order(db, order_id, order)


@router.delete("/{order_id}")
def delete_order(order_id: int, db: Session = Depends(get_db)):
    return crud.delete_order(db, order_id)
