import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ordersApi, customersApi, productsApi } from '../services/api';

const STATUS_OPTIONS = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

const STATUS_MAP = {
  pending: 'badge-amber',
  confirmed: 'badge-blue',
  shipped: 'badge-purple',
  delivered: 'badge-green',
  cancelled: 'badge-gray',
};

export default function Orders() {
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [viewOrder, setViewOrder] = useState(null);
  const qc = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders', statusFilter],
    queryFn: () => ordersApi.getAll({ status: statusFilter || undefined }).then(r => r.data),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => ordersApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries(['orders']); qc.invalidateQueries(['dashboard']); qc.invalidateQueries(['products']); toast.success('Order updated'); setViewOrder(null); },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to update order'),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => ordersApi.delete(id),
    onSuccess: () => { qc.invalidateQueries(['orders']); qc.invalidateQueries(['dashboard']); qc.invalidateQueries(['products']); toast.success('Order deleted'); },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to delete order'),
  });

  const createMut = useMutation({
    mutationFn: (d) => ordersApi.create(d),
    onSuccess: () => { qc.invalidateQueries(['orders']); qc.invalidateQueries(['dashboard']); qc.invalidateQueries(['products']); toast.success('Order placed successfully'); setShowModal(false); },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to create order'),
  });

  const handleDelete = (id) => {
    if (window.confirm(`Delete order #${id}?`)) deleteMut.mutate(id);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Orders</div>
          <div className="page-subtitle">{orders.length} orders</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Order</button>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div className="table-title">Order List</div>
          <div className="filter-bar">
            <select className="form-select" style={{ width: '150px' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="loading-state"><div className="spinner" />Loading...</div>
        ) : !orders.length ? (
          <div className="empty-state">

            <div className="empty-state-text">No orders found</div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id}>
                  <td className="td-mono">#{o.id}</td>
                  <td className="td-main">{o.customer?.name || '—'}</td>
                  <td><span className="badge badge-gray">{o.items.length} item{o.items.length !== 1 ? 's' : ''}</span></td>
                  <td style={{ fontFamily: 'var(--mono)', color: 'var(--green)' }}>₹{o.total_amount.toFixed(2)}</td>
                  <td><span className={`badge ${STATUS_MAP[o.status]}`}>{o.status}</span></td>
                  <td style={{ fontSize: '12px' }}>{new Date(o.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="actions-cell">
                      <button className="btn btn-ghost btn-sm" onClick={() => setViewOrder(o)}>View</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(o.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <CreateOrderModal
          onClose={() => setShowModal(false)}
          onSubmit={createMut.mutate}
          loading={createMut.isPending}
        />
      )}

      {viewOrder && (
        <ViewOrderModal
          order={viewOrder}
          onClose={() => setViewOrder(null)}
          onUpdateStatus={(status) => updateMut.mutate({ id: viewOrder.id, data: { status } })}
          loading={updateMut.isPending}
        />
      )}
    </div>
  );
}

function CreateOrderModal({ onClose, onSubmit, loading }) {
  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState([{ product_id: '', quantity: 1 }]);
  const [notes, setNotes] = useState('');

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customersApi.getAll().then(r => r.data),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getAll().then(r => r.data),
  });

  const addItem = () => setItems(i => [...i, { product_id: '', quantity: 1 }]);
  const removeItem = (idx) => setItems(i => i.filter((_, j) => j !== idx));
  const setItem = (idx, k, v) => setItems(i => i.map((item, j) => j === idx ? { ...item, [k]: v } : item));

  const selectedProduct = (pid) => products.find(p => p.id === parseInt(pid));

  const total = items.reduce((sum, item) => {
    const p = selectedProduct(item.product_id);
    return sum + (p ? p.price * (parseInt(item.quantity) || 0) : 0);
  }, 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      customer_id: parseInt(customerId),
      items: items.filter(i => i.product_id).map(i => ({ product_id: parseInt(i.product_id), quantity: parseInt(i.quantity) })),
      notes,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">New Order</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Customer *</label>
              <select className="form-select" required value={customerId} onChange={e => setCustomerId(e.target.value)}>
                <option value="">Select customer...</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Order Items *</label>
              <div className="order-items-list">
                {items.map((item, idx) => {
                  const prod = selectedProduct(item.product_id);
                  return (
                    <div key={idx} className="order-item-row">
                      <div className="form-group" style={{ flex: 2 }}>
                        <select className="form-select" required value={item.product_id} onChange={e => setItem(idx, 'product_id', e.target.value)}>
                          <option value="">Select product...</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} — ₹{p.price.toFixed(2)} (Stock: {p.stock_quantity})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group" style={{ flex: 0.6 }}>
                        <input
                          className="form-input"
                          type="number"
                          min="1"
                          max={prod?.stock_quantity}
                          required
                          value={item.quantity}
                          onChange={e => setItem(idx, 'quantity', e.target.value)}
                          placeholder="Qty"
                        />
                      </div>
                      <div style={{ color: 'var(--text2)', fontSize: '12px', minWidth: '70px', paddingBottom: '2px' }}>
                        {prod ? `₹${(prod.price * (parseInt(item.quantity) || 0)).toFixed(2)}` : ''}
                      </div>
                      {items.length > 1 && (
                        <button type="button" className="remove-item-btn" onClick={() => removeItem(idx)}>✕</button>
                      )}
                    </div>
                  );
                })}
              </div>
              <button type="button" className="add-item-btn" onClick={addItem}>+ Add Item</button>
            </div>

            {total > 0 && (
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text2)', fontSize: '13px' }}>Order Total</span>
                <span style={{ color: 'var(--green)', fontFamily: 'var(--mono)', fontSize: '18px', fontWeight: '600' }}>₹{total.toFixed(2)}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-textarea" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional order notes..." />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Placing...' : 'Place Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ViewOrderModal({ order, onClose, onUpdateStatus, loading }) {
  const [status, setStatus] = useState(order.status);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '580px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Order #{order.id}</div>
            <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>{new Date(order.created_at).toLocaleString()}</div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <div style={{ background: 'var(--bg2)', borderRadius: '8px', padding: '12px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '4px' }}>CUSTOMER</div>
              <div style={{ fontWeight: '500' }}>{order.customer?.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--text2)' }}>{order.customer?.email}</div>
            </div>
            <div style={{ background: 'var(--bg2)', borderRadius: '8px', padding: '12px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '4px' }}>TOTAL</div>
              <div style={{ fontSize: '20px', fontFamily: 'var(--mono)', color: 'var(--green)', fontWeight: '600' }}>₹{order.total_amount.toFixed(2)}</div>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Items</div>
            {order.items.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <span style={{ fontWeight: '500' }}>{item.product?.name}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text3)', marginLeft: '8px', fontFamily: 'var(--mono)' }}>{item.product?.sku}</span>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text2)', fontSize: '13px' }}>×{item.quantity}</span>
                  <span style={{ fontFamily: 'var(--mono)', color: 'var(--text)' }}>₹{(item.unit_price * item.quantity).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="form-group">
            <label className="form-label">Update Status</label>
            <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>

          {order.notes && (
            <div style={{ background: 'var(--bg2)', borderRadius: '8px', padding: '12px', fontSize: '13px', color: 'var(--text2)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text3)' }}>NOTES: </span>{order.notes}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
          <button
            className="btn btn-primary"
            onClick={() => onUpdateStatus(status)}
            disabled={loading || status === order.status}
          >
            {loading ? 'Updating...' : 'Update Status'}
          </button>
        </div>
      </div>
    </div>
  );
}
