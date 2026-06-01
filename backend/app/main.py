from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import products, customers, orders, inventory

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Inventory & Order Management System",
    description="API for managing products, customers, orders, and inventory",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products.router, prefix="/api/products", tags=["Products"])
app.include_router(customers.router, prefix="/api/customers", tags=["Customers"])
app.include_router(orders.router, prefix="/api/orders", tags=["Orders"])
app.include_router(inventory.router, prefix="/api/inventory", tags=["Inventory"])

@app.get("/")
def root():
    return {"message": "Inventory & Order Management System API", "status": "running"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
