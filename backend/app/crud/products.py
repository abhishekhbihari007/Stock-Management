from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException
from app.models import Product, InventoryLog
from app.schemas import ProductCreate, ProductUpdate


def get_products(db: Session, skip: int = 0, limit: int = 100, search: str = None):
    query = db.query(Product)
    if search:
        query = query.filter(
            Product.name.ilike(f"%{search}%") | Product.sku.ilike(f"%{search}%")
        )
    return query.offset(skip).limit(limit).all()


def get_product(db: Session, product_id: int):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


def get_product_by_sku(db: Session, sku: str):
    return db.query(Product).filter(Product.sku == sku).first()


def create_product(db: Session, product: ProductCreate):
    existing = get_product_by_sku(db, product.sku)
    if existing:
        raise HTTPException(status_code=400, detail=f"Product with SKU '{product.sku}' already exists")
    
    db_product = Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)

    # Log initial stock
    if db_product.stock_quantity > 0:
        log = InventoryLog(
            product_id=db_product.id,
            change_type="initial_stock",
            quantity_change=db_product.stock_quantity,
            quantity_before=0,
            quantity_after=db_product.stock_quantity,
            notes="Initial stock on product creation"
        )
        db.add(log)
        db.commit()

    return db_product


def update_product(db: Session, product_id: int, product_update: ProductUpdate):
    db_product = get_product(db, product_id)
    update_data = product_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_product, field, value)
    db.commit()
    db.refresh(db_product)
    return db_product


def delete_product(db: Session, product_id: int):
    db_product = get_product(db, product_id)
    
    if db_product.order_items:
        raise HTTPException(status_code=400, detail="Cannot delete product that is part of an order")
        
    db.query(InventoryLog).filter(InventoryLog.product_id == product_id).delete()
    
    db.delete(db_product)
    db.commit()
    return {"message": "Product deleted successfully"}


def get_low_stock_products(db: Session, threshold: int = 10):
    return db.query(Product).filter(Product.stock_quantity <= threshold).all()


def adjust_inventory(db: Session, product_id: int, quantity_change: int, change_type: str, notes: str = None, reference_id: int = None):
    db_product = get_product(db, product_id)
    quantity_before = db_product.stock_quantity
    quantity_after = quantity_before + quantity_change

    if quantity_after < 0:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient stock. Available: {quantity_before}, Required: {abs(quantity_change)}"
        )

    db_product.stock_quantity = quantity_after

    log = InventoryLog(
        product_id=product_id,
        change_type=change_type,
        quantity_change=quantity_change,
        quantity_before=quantity_before,
        quantity_after=quantity_after,
        reference_id=reference_id,
        notes=notes
    )
    db.add(log)
    db.commit()
    db.refresh(db_product)
    return db_product
