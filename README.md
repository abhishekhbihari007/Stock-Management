# Inventory & Order Management System (IMS)

A full-stack inventory and order management system built with FastAPI, React, and PostgreSQL.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router, TanStack Query, Axios |
| Backend | FastAPI, SQLAlchemy, Pydantic v2 |
| Database | PostgreSQL 15 |
| Containerization | Docker, Docker Compose |
| Frontend Deploy | Vercel |
| Backend Deploy | Railway |

## Features

- **Products** — Create, update, delete products with unique SKU validation
- **Customers** — Manage customers with unique email validation
- **Orders** — Place orders with automatic stock deduction and insufficient-stock prevention
- **Inventory Logs** — Full audit trail of all stock movements
- **Dashboard** — Real-time stats, low-stock alerts, recent orders

## Business Rules

1. Product SKUs must be globally unique
2. Customer emails must be globally unique
3. Orders validate stock availability before creation
4. Placing an order automatically reduces product stock
5. Cancelling or deleting an order restores product stock
6. Orders cannot be placed with insufficient stock

## Quick Start (Docker Compose)

```bash
# Clone the repo
git clone <repo-url>
cd inventory-system

# Copy and configure environment
cp .env.example .env

# Start all services
docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

## Local Development

### Backend

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Set environment variable
export DATABASE_URL=postgresql://postgres:password@localhost:5432/inventory_db

# Run development server
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Set environment variable
echo "REACT_APP_API_URL=http://localhost:8000" > .env

# Start development server
npm start
```

## API Endpoints

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products/` | List all products |
| POST | `/api/products/` | Create product |
| GET | `/api/products/{id}` | Get product |
| PUT | `/api/products/{id}` | Update product |
| DELETE | `/api/products/{id}` | Delete product |
| GET | `/api/products/low-stock` | Get low stock products |
| POST | `/api/products/{id}/adjust-inventory` | Adjust stock |

### Customers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/customers/` | List all customers |
| POST | `/api/customers/` | Create customer |
| GET | `/api/customers/{id}` | Get customer |
| PUT | `/api/customers/{id}` | Update customer |
| DELETE | `/api/customers/{id}` | Delete customer |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders/` | List all orders |
| POST | `/api/orders/` | Create order |
| GET | `/api/orders/{id}` | Get order |
| PUT | `/api/orders/{id}` | Update order status |
| DELETE | `/api/orders/{id}` | Delete order |

### Inventory
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inventory/logs` | Get inventory logs |
| GET | `/api/inventory/dashboard` | Get dashboard stats |

## Deployment

### Backend on Railway

1. Create a Railway account at [railway.app](https://railway.app)
2. Create new project → Deploy from GitHub repo
3. Add a PostgreSQL service
4. Set environment variable: `DATABASE_URL` (Railway provides this automatically)
5. Railway auto-detects the Dockerfile and deploys

### Frontend on Vercel

1. Create a Vercel account at [vercel.com](https://vercel.com)
2. Import GitHub repo, select `frontend` as root directory
3. Set environment variable: `REACT_APP_API_URL=<your-railway-backend-url>`
4. Deploy

### Docker Hub

```bash
# Build and push backend image
docker build -t yourusername/ims-backend:latest ./backend
docker push yourusername/ims-backend:latest

# Build and push frontend image
docker build -t yourusername/ims-frontend:latest ./frontend
docker push yourusername/ims-frontend:latest
```

## Environment Variables

### Backend
| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:password@localhost:5432/inventory_db` |

### Frontend
| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API URL | `http://localhost:8000` |

## Project Structure

```
inventory-system/
├── backend/
│   ├── app/
│   │   ├── crud/          # Database operations
│   │   ├── routers/       # API route handlers
│   │   ├── database.py    # DB connection
│   │   ├── models.py      # SQLAlchemy models
│   │   ├── schemas.py     # Pydantic schemas
│   │   └── main.py        # FastAPI app entry
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/         # React page components
│   │   ├── services/      # API service layer
│   │   ├── App.js
│   │   └── App.css
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
└── README.md
```
