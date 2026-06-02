import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { X, Menu } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Orders from './pages/Orders';
import InventoryLogs from './pages/InventoryLogs';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } }
});

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);

  // Handle resize to auto-close sidebar on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebarOnMobile = () => {
    if (window.innerWidth <= 1024) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="app">
          <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} closeSidebar={closeSidebarOnMobile} />
          
          <div className={`main-wrapper ${isSidebarOpen ? '' : 'sidebar-closed'}`}>
            <header className="mobile-header">
              <div className="mobile-brand-name">
                <span className="brand-main">Ethara.AI</span>
              </div>
              <button className="btn-icon mobile-menu-btn" onClick={toggleSidebar}>
                <Menu size={24} />
              </button>
            </header>

            <main className="main-content">
              <div className="page-transition-wrapper">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/customers" element={<Customers />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/inventory" element={<InventoryLogs />} />
                </Routes>
              </div>
            </main>
          </div>
        </div>
        <Toaster position="top-right" toastOptions={{ duration: 3000, style: { background: '#1E293B', color: '#fff' } }} />
      </Router>
    </QueryClientProvider>
  );
}


function Sidebar({ isOpen, toggleSidebar, closeSidebar }) {
  const links = [
    { to: '/', label: 'Dashboard' },
    { to: '/products', label: 'Products' },
    { to: '/customers', label: 'Customers' },
    { to: '/orders', label: 'Orders' },
    { to: '/inventory', label: 'Inventory Logs' },
  ];

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'show' : ''}`} onClick={toggleSidebar}></div>
      <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand-name">
            <span className="brand-main">Ethara.AI</span>
            <span className="brand-sub">Inventory Management System</span>
          </div>
          <button className="btn-icon mobile-close-btn" onClick={toggleSidebar}>
            <X size={20} />
          </button>
        </div>
        <nav className="sidebar-nav">
          {links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              onClick={closeSidebar}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <div className="nav-link-bg"></div>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="footer-glass">
            <p className="footer-text">Designed By</p>
            <p className="footer-developer">Abhishekh Bihari</p>
          </div>
        </div>
      </aside>
    </>
  );
}

export default App;
