from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.schemas import CustomerCreate, CustomerUpdate, CustomerResponse
from app.crud import customers as crud

router = APIRouter()


@router.get("/", response_model=List[CustomerResponse])
def list_customers(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    return crud.get_customers(db, skip=skip, limit=limit, search=search)


@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    return crud.get_customer(db, customer_id)


@router.post("/", response_model=CustomerResponse, status_code=201)
def create_customer(customer: CustomerCreate, db: Session = Depends(get_db)):
    return crud.create_customer(db, customer)


@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(customer_id: int, customer: CustomerUpdate, db: Session = Depends(get_db)):
    return crud.update_customer(db, customer_id, customer)


@router.delete("/{customer_id}")
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    return crud.delete_customer(db, customer_id)
