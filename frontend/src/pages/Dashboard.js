import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { inventoryApi, productsApi, ordersApi } from '../services/api';
import { Box, Users, ShoppingCart, AlertTriangle, IndianRupee, Server } from 'lucide-react';

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

  const { data: allOrders = [] } = useQuery({
    queryKey: ['all-orders-chart'],
    queryFn: () => ordersApi.getAll({ limit: 50 }).then(r => r.data),
  });

  const chartData = useMemo(() => {
    const grouped = {};
    [...allOrders].reverse().forEach(order => {
      const date = new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!grouped[date]) grouped[date] = { date, revenue: 0 };
      grouped[date].revenue += order.total_amount;
    });
    return Object.values(grouped);
  }, [allOrders]);

  if (isLoading) return (
    <div className="loading-state">
      <div className="spinner" />
      <span>Loading your workspace...</span>
    </div>
  );

  const statCards = [
    { label: 'Total Products', value: stats?.total_products ?? 0, icon: <Box size={20} color="#3b82f6" />, meta: 'Active SKUs in System', colorClass: 'color-blue' },
    { label: 'Total Customers', value: stats?.total_customers ?? 0, icon: <Users size={20} color="#10b981" />, meta: 'Verified Client Accounts', colorClass: 'color-green' },
    { label: 'Total Orders', value: stats?.total_orders ?? 0, icon: <ShoppingCart size={20} color="#8b5cf6" />, meta: `${stats?.pending_orders ?? 0} Awaiting Fulfillment`, colorClass: 'color-purple' },
    { label: 'Low Stock', value: stats?.low_stock_products ?? 0, icon: <AlertTriangle size={20} color="#f59e0b" />, meta: 'Replenishment Required', colorClass: 'color-amber' },
    { label: 'Total Revenue', value: `₹${(stats?.total_revenue ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: <IndianRupee size={24} color="#10b981" />, meta: 'Processed Transaction Volume', wide: true, colorClass: 'color-emerald' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Executive Dashboard</div>
          <div className="page-subtitle">Real-time system telemetry and inventory metrics overview.</div>
        </div>
        <button className="btn btn-primary">
          <Server size={18} />
          Server is Running
        </button>
      </div>

      <div className="stat-grid">
        {statCards.map((s, idx) => (
          <div key={idx} className={`stat-card ${s.colorClass}`} style={s.wide ? { gridColumn: '1 / -1' } : {}}>
            <div className="stat-label">
              <span>{s.label}</span>
              <div style={{ padding: '12px', background: 'var(--surface2)', borderRadius: '14px', color: 'var(--text-primary)' }}>
                {s.icon}
              </div>
            </div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-meta">
              <span>{s.meta}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        {/* Recent Orders */}
        <div className="table-container color-purple">
          <div className="table-toolbar">
            <div className="table-title">Recent Orders</div>
          </div>
          {!recentOrders?.length ? (
            <div className="empty-state">
              <ShoppingCart className="empty-state-icon" size={48} />
              <div className="empty-state-text">No orders received yet</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(o => (
                    <tr key={o.id}>
                      <td className="td-mono">#{o.id}</td>
                      <td className="td-main">{o.customer?.name ?? '—'}</td>
                      <td><StatusBadge status={o.status} /></td>
                      <td style={{ color: '#10b981', fontFamily: 'var(--font-mono)' }}>₹{o.total_amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Low Stock */}
        <div className="table-container color-amber">
          <div className="table-toolbar">
            <div className="table-title">Low Stock Items</div>
          </div>
          {!lowStock?.length ? (
            <div className="empty-state">
              <Box className="empty-state-icon" size={48} />
              <div className="empty-state-text">Inventory is fully stocked</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
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
                          {p.stock_quantity} units left
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {!isLoading && chartData.length > 0 && (
        <div className="stat-card" style={{ marginTop: '24px', height: '360px', padding: '32px' }}>
          <h3 style={{ marginBottom: '24px', fontSize: '15px', color: 'var(--text)', fontWeight: '600', fontFamily: 'var(--font-heading)' }}>Daily Revenue</h3>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" stroke="var(--text3)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
              <YAxis stroke="var(--text3)" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '12px', backdropFilter: 'blur(10px)', color: 'var(--text)' }}
                itemStyle={{ fontSize: '13px', fontWeight: '600' }}
                labelStyle={{ color: 'var(--text3)', marginBottom: '4px' }}
                formatter={(value) => [`₹${value.toFixed(2)}`, 'Revenue']}
              />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending: 'badge-amber',
    confirmed: 'badge-blue',
    shipped: 'badge-purple',
    delivered: 'badge-green',
    cancelled: 'badge-red',
  };
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{status}</span>;
}
