import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ordersApi, customersApi, productsApi } from '../services/api';
import { ShoppingCart, Plus, Eye, Trash2, X } from 'lucide-react';

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
          <div className="page-subtitle">{orders.length} total orders</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> New Order
        </button>
      </div>

      <div className="table-container color-purple">
        <div className="table-toolbar">
          <div className="table-title">Order List</div>
          <div className="filter-bar">
            <select className="form-select" style={{ width: '160px' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="loading-state"><div className="spinner" /><span>Loading orders...</span></div>
        ) : !orders.length ? (
          <div className="empty-state">
            <ShoppingCart className="empty-state-icon" size={48} />
            <div className="empty-state-text">No orders found</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id}>
                    <td className="td-mono">#{o.id}</td>
                    <td className="td-main">{o.customer?.name || '—'}</td>
                    <td><span className="badge badge-gray">{o.items.length} item{o.items.length !== 1 ? 's' : ''}</span></td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--green)' }}>₹{o.total_amount.toFixed(2)}</td>
                    <td><span className={`badge ${STATUS_MAP[o.status]}`}>{o.status}</span></td>
                    <td style={{ fontSize: '13px', color: 'var(--text2)' }}>{new Date(o.created_at).toLocaleDateString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="actions-cell" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost btn-icon" title="View Details" onClick={() => setViewOrder(o)}>
                          <Eye size={16} />
                        </button>
                        <button className="btn btn-danger btn-icon" title="Delete" onClick={() => handleDelete(o.id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
      <div className="modal" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">New Order</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
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
                      <div style={{ color: 'var(--text2)', fontSize: '13px', minWidth: '80px', paddingBottom: '4px', display: 'flex', alignItems: 'center' }}>
                        {prod ? `₹${(prod.price * (parseInt(item.quantity) || 0)).toFixed(2)}` : ''}
                      </div>
                      {items.length > 1 && (
                        <button type="button" className="remove-item-btn" onClick={() => removeItem(idx)}>
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              <button type="button" className="add-item-btn" onClick={addItem}>
                <Plus size={16} style={{ marginRight: '8px' }} /> Add Item
              </button>
            </div>

            {total > 0 && (
              <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text2)', fontSize: '14px', fontWeight: '500' }}>Order Total</span>
                <span style={{ color: 'var(--green)', fontFamily: 'var(--font-mono)', fontSize: '24px', fontWeight: '700' }}>₹{total.toFixed(2)}</span>
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
      <div className="modal" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Order #{order.id}</div>
            <div style={{ fontSize: '13px', color: 'var(--text3)', marginTop: '4px' }}>{new Date(order.created_at).toLocaleString()}</div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '8px', fontWeight: '600', letterSpacing: '0.05em' }}>CUSTOMER</div>
              <div style={{ fontWeight: '600', fontSize: '15px', color: 'var(--text)' }}>{order.customer?.name}</div>
              <div style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '2px' }}>{order.customer?.email}</div>
            </div>
            <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '8px', fontWeight: '600', letterSpacing: '0.05em' }}>TOTAL AMOUNT</div>
              <div style={{ fontSize: '24px', fontFamily: 'var(--font-mono)', color: 'var(--green)', fontWeight: '700' }}>₹{order.total_amount.toFixed(2)}</div>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Order Items</div>
            <div style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
              {order.items.map((item, idx) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: idx % 2 === 0 ? 'transparent' : 'var(--surface2)', borderBottom: idx === order.items.length - 1 ? 'none' : '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: '500', color: 'var(--text)' }}>{item.product?.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>{item.product?.sku}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text2)', fontSize: '14px' }}>×{item.quantity}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text)', fontWeight: '500' }}>₹{(item.unit_price * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Update Status</label>
            <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>

          {order.notes && (
            <div style={{ background: 'var(--surface2)', borderRadius: '8px', padding: '16px', fontSize: '14px', color: 'var(--text2)', marginTop: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text3)', fontWeight: '600', marginRight: '8px' }}>NOTES:</span> {order.notes}
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
