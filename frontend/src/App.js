import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Orders from './pages/Orders';
import InventoryLogs from './pages/InventoryLogs';
import TopNavbar from './components/TopNavbar';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } }
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="app">
          <Sidebar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/products" element={<Products />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/inventory" element={<InventoryLogs />} />
            </Routes>
          </main>
        </div>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      </Router>
    </QueryClientProvider>
  );
}

function Sidebar() {
  const links = [
    { to: '/', label: 'Dashboard' },
    { to: '/products', label: 'Products' },
    { to: '/customers', label: 'Customers' },
    { to: '/orders', label: 'Orders' },
    { to: '/inventory', label: 'Inventory Logs' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-brand-name">
          <span className="brand-main">Ethara</span>
          <span className="brand-sub">Stock Management</span>
        </div>
      </div>
      <nav className="sidebar-nav">
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <p className="footer-text">Developed & Designed by</p>
        <p className="footer-developer">Abhishekh Bihari</p>
      </div>
    </aside>
  );
}

export default App;
