import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Products
export const productsApi = {
  getAll: (params) => api.get('/api/products/', { params }),
  getOne: (id) => api.get(`/api/products/${id}`),
  create: (data) => api.post('/api/products/', data),
  update: (id, data) => api.put(`/api/products/${id}`, data),
  delete: (id) => api.delete(`/api/products/${id}`),
  getLowStock: (threshold = 10) => api.get('/api/products/low-stock', { params: { threshold } }),
  adjustInventory: (id, data) => api.post(`/api/products/${id}/adjust-inventory`, data),
};

// Customers
export const customersApi = {
  getAll: (params) => api.get('/api/customers/', { params }),
  getOne: (id) => api.get(`/api/customers/${id}`),
  create: (data) => api.post('/api/customers/', data),
  update: (id, data) => api.put(`/api/customers/${id}`, data),
  delete: (id) => api.delete(`/api/customers/${id}`),
};

// Orders
export const ordersApi = {
  getAll: (params) => api.get('/api/orders/', { params }),
  getOne: (id) => api.get(`/api/orders/${id}`),
  create: (data) => api.post('/api/orders/', data),
  update: (id, data) => api.put(`/api/orders/${id}`, data),
  delete: (id) => api.delete(`/api/orders/${id}`),
};

// Inventory / Dashboard
export const inventoryApi = {
  getLogs: (params) => api.get('/api/inventory/logs', { params }),
  getDashboard: () => api.get('/api/inventory/dashboard'),
};

export default api;
