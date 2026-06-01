import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { inventoryApi } from '../services/api';

const TYPE_MAP = {
  sale: 'badge-red',
  restock: 'badge-green',
  initial_stock: 'badge-blue',
  adjustment: 'badge-amber',
  cancellation: 'badge-purple',
  order_deleted: 'badge-gray',
};

export default function InventoryLogs() {
  const [limit, setLimit] = useState(50);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['inventory-logs', limit],
    queryFn: () => inventoryApi.getLogs({ limit }).then(r => r.data),
  });

  const chartData = useMemo(() => {
    const grouped = {};
    [...logs].reverse().forEach(log => {
      const date = new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!grouped[date]) grouped[date] = { date, stockIn: 0, stockOut: 0 };
      if (log.quantity_change > 0) {
        grouped[date].stockIn += log.quantity_change;
      } else {
        grouped[date].stockOut += Math.abs(log.quantity_change);
      }
    });
    return Object.values(grouped);
  }, [logs]);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Inventory Logs</div>
          <div className="page-subtitle">Track all stock movements and changes</div>
        </div>
      </div>

      {!isLoading && chartData.length > 0 && (
        <div className="stat-card" style={{ marginBottom: '24px', height: '300px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--text2)' }}>Daily Stock Movement</h3>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--green)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--green)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--red)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--red)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" stroke="var(--text3)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text3)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--surface-hover)', borderColor: 'var(--border)', borderRadius: '8px' }}
                itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="stockIn" name="Stock In" stroke="var(--green)" fillOpacity={1} fill="url(#colorIn)" />
              <Area type="monotone" dataKey="stockOut" name="Stock Out" stroke="var(--red)" fillOpacity={1} fill="url(#colorOut)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="table-container">
        <div className="table-toolbar">
          <div className="table-title">Activity Log</div>
          <div className="filter-bar">
            <select className="form-select" style={{ width: '120px' }} value={limit} onChange={e => setLimit(Number(e.target.value))}>
              <option value={25}>Last 25</option>
              <option value={50}>Last 50</option>
              <option value={100}>Last 100</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="loading-state"><div className="spinner" />Loading...</div>
        ) : !logs.length ? (
          <div className="empty-state">

            <div className="empty-state-text">No inventory logs yet</div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Product</th>
                <th>SKU</th>
                <th>Type</th>
                <th>Change</th>
                <th>Before</th>
                <th>After</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="td-main">{log.product?.name || `#${log.product_id}`}</td>
                  <td className="td-mono">{log.product?.sku || '—'}</td>
                  <td>
                    <span className={`badge ${TYPE_MAP[log.change_type] || 'badge-gray'}`}>
                      {log.change_type.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--mono)', color: log.quantity_change > 0 ? 'var(--green)' : 'var(--red)', fontWeight: '600' }}>
                    {log.quantity_change > 0 ? '+' : ''}{log.quantity_change}
                  </td>
                  <td style={{ fontFamily: 'var(--mono)', color: 'var(--text3)' }}>{log.quantity_before}</td>
                  <td style={{ fontFamily: 'var(--mono)' }}>{log.quantity_after}</td>
                  <td style={{ maxWidth: '200px', fontSize: '12px', color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {log.notes || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
