from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.schemas import ProductCreate, ProductUpdate, ProductResponse, InventoryAdjustment
from app.crud import products as crud

router = APIRouter()


@router.get("/", response_model=List[ProductResponse])
def list_products(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    return crud.get_products(db, skip=skip, limit=limit, search=search)


@router.get("/low-stock", response_model=List[ProductResponse])
def low_stock_products(threshold: int = 10, db: Session = Depends(get_db)):
    return crud.get_low_stock_products(db, threshold=threshold)


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    return crud.get_product(db, product_id)


@router.post("/", response_model=ProductResponse, status_code=201)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    return crud.create_product(db, product)


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(product_id: int, product: ProductUpdate, db: Session = Depends(get_db)):
    return crud.update_product(db, product_id, product)


@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    return crud.delete_product(db, product_id)


@router.post("/{product_id}/adjust-inventory", response_model=ProductResponse)
def adjust_inventory(
    product_id: int,
    adjustment: InventoryAdjustment,
    db: Session = Depends(get_db)
):
    change_type = "restock" if adjustment.quantity_change > 0 else "adjustment"
    return crud.adjust_inventory(
        db=db,
        product_id=product_id,
        quantity_change=adjustment.quantity_change,
        change_type=change_type,
        notes=adjustment.notes
    )
