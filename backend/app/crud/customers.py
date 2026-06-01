from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models import Customer
from app.schemas import CustomerCreate, CustomerUpdate


def get_customers(db: Session, skip: int = 0, limit: int = 100, search: str = None):
    query = db.query(Customer)
    if search:
        query = query.filter(
            Customer.name.ilike(f"%{search}%") | Customer.email.ilike(f"%{search}%")
        )
    return query.offset(skip).limit(limit).all()


def get_customer(db: Session, customer_id: int):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


def get_customer_by_email(db: Session, email: str):
    return db.query(Customer).filter(Customer.email == email).first()


def create_customer(db: Session, customer: CustomerCreate):
    existing = get_customer_by_email(db, customer.email)
    if existing:
        raise HTTPException(status_code=400, detail=f"Customer with email '{customer.email}' already exists")
    
    db_customer = Customer(**customer.dict())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer


def update_customer(db: Session, customer_id: int, customer_update: CustomerUpdate):
    db_customer = get_customer(db, customer_id)
    update_data = customer_update.dict(exclude_unset=True)
    
    if "email" in update_data:
        existing = get_customer_by_email(db, update_data["email"])
        if existing and existing.id != customer_id:
            raise HTTPException(status_code=400, detail=f"Email '{update_data['email']}' already in use")
    
    for field, value in update_data.items():
        setattr(db_customer, field, value)
    
    db.commit()
    db.refresh(db_customer)
    return db_customer


def delete_customer(db: Session, customer_id: int):
    db_customer = get_customer(db, customer_id)
    db.delete(db_customer)
    db.commit()
    return {"message": "Customer deleted successfully"}
