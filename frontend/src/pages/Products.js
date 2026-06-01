import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { productsApi } from '../services/api';
import { Search, Plus, Edit2, Trash2, Sliders, Box, X } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';

export default function Products() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [showModal, setShowModal] = useState(false);
  const [showAdjust, setShowAdjust] = useState(null);
  const [editing, setEditing] = useState(null);
  const qc = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', debouncedSearch],
    queryFn: () => productsApi.getAll({ search: debouncedSearch }).then(r => r.data),
    placeholderData: keepPreviousData,
  });

  const createMut = useMutation({
    mutationFn: (d) => productsApi.create(d),
    onSuccess: () => { qc.invalidateQueries(['products']); qc.invalidateQueries(['dashboard']); toast.success('Product created'); setShowModal(false); },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to create product'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => productsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries(['products']); toast.success('Product updated'); setEditing(null); },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to update product'),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => productsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries(['products']); qc.invalidateQueries(['dashboard']); toast.success('Product deleted'); },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to delete product'),
  });

  const adjustMut = useMutation({
    mutationFn: ({ id, data }) => productsApi.adjustInventory(id, data),
    onSuccess: () => { qc.invalidateQueries(['products']); qc.invalidateQueries(['dashboard']); toast.success('Inventory adjusted'); setShowAdjust(null); },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to adjust inventory'),
  });

  const handleDelete = (id, name) => {
    if (window.confirm(`Delete product "${name}"?`)) deleteMut.mutate(id);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Products</div>
          <div className="page-subtitle">{products.length} products in catalog</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Add Product
        </button>
      </div>

      <div className="table-container color-blue">
        <div className="table-toolbar">
          <div className="table-title">Product Catalog</div>
          <div className="search-box">
            <Search className="search-icon" size={16} />
            <input
              className="search-input"
              placeholder="Search name or SKU..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="loading-state"><div className="spinner" /><span>Loading products...</span></div>
        ) : !products.length ? (
          <div className="empty-state">
            <Box className="empty-state-icon" size={48} />
            <div className="empty-state-text">No products found</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td className="td-main">{p.name}</td>
                    <td className="td-mono">{p.sku}</td>
                    <td>{p.category || '—'}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: '#10b981' }}>₹{p.price.toFixed(2)}</td>
                    <td>
                      <div className="stock-bar">
                        <span className={`badge ${p.stock_quantity === 0 ? 'badge-red' : p.stock_quantity <= 10 ? 'badge-amber' : 'badge-green'}`}>
                          {p.stock_quantity}
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="actions-cell" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost btn-icon" title="Adjust Stock" onClick={() => setShowAdjust(p)}>
                          <Sliders size={16} />
                        </button>
                        <button className="btn btn-ghost btn-icon" title="Edit" onClick={() => setEditing(p)}>
                          <Edit2 size={16} />
                        </button>
                        <button className="btn btn-danger btn-icon" title="Delete" onClick={() => handleDelete(p.id, p.name)}>
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
        <ProductModal
          onClose={() => setShowModal(false)}
          onSubmit={createMut.mutate}
          loading={createMut.isPending}
        />
      )}

      {editing && (
        <ProductModal
          product={editing}
          onClose={() => setEditing(null)}
          onSubmit={(data) => updateMut.mutate({ id: editing.id, data })}
          loading={updateMut.isPending}
        />
      )}

      {showAdjust && (
        <AdjustModal
          product={showAdjust}
          onClose={() => setShowAdjust(null)}
          onSubmit={(data) => adjustMut.mutate({ id: showAdjust.id, data })}
          loading={adjustMut.isPending}
        />
      )}
    </div>
  );
}

function ProductModal({ product, onClose, onSubmit, loading }) {
  const [form, setForm] = useState({
    name: product?.name || '',
    sku: product?.sku || '',
    description: product?.description || '',
    price: product?.price || '',
    stock_quantity: product?.stock_quantity ?? 0,
    category: product?.category || '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, price: parseFloat(form.price), stock_quantity: parseInt(form.stock_quantity) });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{product ? 'Edit Product' : 'New Product'}</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input className="form-input" required value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Laptop Pro" />
              </div>
              <div className="form-group">
                <label className="form-label">SKU *</label>
                <input className="form-input" required value={form.sku} onChange={e => set('sku', e.target.value)} placeholder="e.g. LAPTOP-001" disabled={!!product} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Price *</label>
                <input className="form-input" type="number" step="0.01" min="0.01" required value={form.price} onChange={e => set('price', e.target.value)} placeholder="0.00" />
              </div>
              <div className="form-group">
                <label className="form-label">Stock Quantity</label>
                <input className="form-input" type="number" min="0" value={form.stock_quantity} onChange={e => set('stock_quantity', e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <input className="form-input" value={form.category} onChange={e => set('category', e.target.value)} placeholder="e.g. Electronics" />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Optional product description..." />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AdjustModal({ product, onClose, onSubmit, loading }) {
  const [qty, setQty] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ quantity_change: parseInt(qty), notes });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Adjust Inventory</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p style={{ color: 'var(--text2)', marginBottom: '20px', fontSize: '14px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px' }}>
              <strong style={{ color: 'var(--text)' }}>{product.name}</strong> — Current stock: <span className="badge badge-blue" style={{ marginLeft: '8px' }}>{product.stock_quantity} units</span>
            </p>
            <div className="form-group">
              <label className="form-label">Quantity Change (use negative to reduce)</label>
              <input className="form-input" type="number" required value={qty} onChange={e => setQty(e.target.value)} placeholder="e.g. 50 or -10" />
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <input className="form-input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Reason for adjustment..." />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading || !qty}>
              {loading ? 'Adjusting...' : 'Apply Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
