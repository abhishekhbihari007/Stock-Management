import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { inventoryApi, productsApi, ordersApi } from '../services/api';

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => inventoryApi.getDashboard().then(r => r.data),
  });

  const { data: lowStock } = useQuery({
    queryKey: ['low-stock'],
    queryFn: () => productsApi.getLowStock(10).then(r => r.data),
  });

  const { data: recentOrders } = useQuery({
    queryKey: ['recent-orders'],
    queryFn: () => ordersApi.getAll({ limit: 5 }).then(r => r.data),
  });

  if (isLoading) return (
    <div className="loading-state"><div className="spinner" />Loading dashboard...</div>
  );

  const statCards = [
    { label: 'Total Products', value: stats?.total_products ?? 0, color: '#3b82f6', meta: 'In catalog' },
    { label: 'Total Customers', value: stats?.total_customers ?? 0, color: '#10b981', meta: 'Registered' },
    { label: 'Total Orders', value: stats?.total_orders ?? 0, color: '#8b5cf6', meta: `${stats?.pending_orders ?? 0} pending` },
    { label: 'Low Stock Items', value: stats?.low_stock_products ?? 0, color: '#f59e0b', meta: '≤10 units' },
    { label: 'Total Revenue', value: `₹${(stats?.total_revenue ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: '#10b981', meta: 'Confirmed orders', wide: true },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">Overview of your inventory and orders</div>
        </div>
      </div>

      <div className="stat-grid">
        {statCards.map(s => (
          <div key={s.label} className="stat-card" style={s.wide ? { gridColumn: 'span 2' } : {}}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.color, fontSize: s.wide ? '32px' : undefined }}>
              {s.value}
            </div>
            <div className="stat-meta">{s.meta}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Recent Orders */}
        <div className="table-container">
          <div className="table-toolbar">
            <div className="table-title">Recent Orders</div>
          </div>
          {!recentOrders?.length ? (
            <div className="empty-state">

              <div className="empty-state-text">No orders yet</div>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Time</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(o => (
                  <tr key={o.id}>
                    <td className="td-mono">#{o.id}</td>
                    <td className="td-mono" style={{ color: 'var(--text2)', fontSize: '12px' }}>
                      🕒 {new Date(o.created_at || new Date()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="td-main">{o.customer?.name ?? '—'}</td>
                    <td><StatusBadge status={o.status} /></td>
                    <td style={{ color: '#10b981', fontFamily: 'var(--mono)' }}>₹{o.total_amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Low Stock */}
        <div className="table-container">
          <div className="table-toolbar">
            <div className="table-title">Low Stock Products</div>
          </div>
          {!lowStock?.length ? (
            <div className="empty-state">

              <div className="empty-state-text">All products well stocked</div>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Stock</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map(p => (
                  <tr key={p.id}>
                    <td className="td-main">{p.name}</td>
                    <td className="td-mono">{p.sku}</td>
                    <td>
                      <span className={`badge ${p.stock_quantity === 0 ? 'badge-red' : 'badge-amber'}`}>
                        {p.stock_quantity} units
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending: 'badge-amber',
    confirmed: 'badge-blue',
    shipped: 'badge-purple',
    delivered: 'badge-green',
    cancelled: 'badge-gray',
  };
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{status}</span>;
}
