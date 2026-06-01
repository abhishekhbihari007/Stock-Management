from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException
from app.models import Order, OrderItem, OrderStatus
from app.schemas import OrderCreate, OrderUpdate
from app.crud.products import get_product, adjust_inventory
from app.crud.customers import get_customer


def get_orders(db: Session, skip: int = 0, limit: int = 100, status: str = None, customer_id: int = None):
    query = db.query(Order).options(
        joinedload(Order.customer),
        joinedload(Order.items).joinedload(OrderItem.product)
    )
    if status:
        query = query.filter(Order.status == status)
    if customer_id:
        query = query.filter(Order.customer_id == customer_id)
    return query.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()


def get_order(db: Session, order_id: int):
    order = db.query(Order).options(
        joinedload(Order.customer),
        joinedload(Order.items).joinedload(OrderItem.product)
    ).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


def create_order(db: Session, order: OrderCreate):
    # Validate customer
    get_customer(db, order.customer_id)
    
    # Validate all products and stock before creating order
    order_items_data = []
    total_amount = 0.0

    for item in order.items:
        product = get_product(db, item.product_id)
        
        if product.stock_quantity < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for product '{product.name}' (SKU: {product.sku}). "
                       f"Requested: {item.quantity}, Available: {product.stock_quantity}"
            )
        
        order_items_data.append({
            "product": product,
            "quantity": item.quantity,
            "unit_price": product.price
        })
        total_amount += product.price * item.quantity

    # Create order
    db_order = Order(
        customer_id=order.customer_id,
        total_amount=total_amount,
        notes=order.notes
    )
    db.add(db_order)
    db.flush()  # Get order ID without committing

    # Create order items and reduce stock
    for item_data in order_items_data:
        db_item = OrderItem(
            order_id=db_order.id,
            product_id=item_data["product"].id,
            quantity=item_data["quantity"],
            unit_price=item_data["unit_price"]
        )
        db.add(db_item)

        # Reduce stock
        adjust_inventory(
            db=db,
            product_id=item_data["product"].id,
            quantity_change=-item_data["quantity"],
            change_type="sale",
            notes=f"Sale - Order #{db_order.id}",
            reference_id=db_order.id
        )

    db.commit()
    db.refresh(db_order)
    return get_order(db, db_order.id)


def update_order(db: Session, order_id: int, order_update: OrderUpdate):
    db_order = get_order(db, order_id)
    update_data = order_update.dict(exclude_unset=True)

    # If cancelling, restore stock
    if update_data.get("status") == OrderStatus.cancelled and db_order.status != OrderStatus.cancelled:
        for item in db_order.items:
            adjust_inventory(
                db=db,
                product_id=item.product_id,
                quantity_change=item.quantity,
                change_type="cancellation",
                notes=f"Order #{order_id} cancelled - stock restored",
                reference_id=order_id
            )

    for field, value in update_data.items():
        setattr(db_order, field, value)

    db.commit()
    db.refresh(db_order)
    return get_order(db, order_id)


def delete_order(db: Session, order_id: int):
    db_order = get_order(db, order_id)
    
    # Restore stock if order is not cancelled
    if db_order.status != OrderStatus.cancelled:
        for item in db_order.items:
            adjust_inventory(
                db=db,
                product_id=item.product_id,
                quantity_change=item.quantity,
                change_type="order_deleted",
                notes=f"Order #{order_id} deleted - stock restored",
                reference_id=order_id
            )

    db.delete(db_order)
    db.commit()
    return {"message": "Order deleted successfully"}
