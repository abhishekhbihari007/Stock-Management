import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { customersApi } from '../services/api';

export default function Customers() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const qc = useQueryClient();

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: () => customersApi.getAll({ search }).then(r => r.data),
  });

  const createMut = useMutation({
    mutationFn: (d) => customersApi.create(d),
    onSuccess: () => { qc.invalidateQueries(['customers']); qc.invalidateQueries(['dashboard']); toast.success('Customer created'); setShowModal(false); },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to create customer'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => customersApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries(['customers']); toast.success('Customer updated'); setEditing(null); },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to update customer'),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => customersApi.delete(id),
    onSuccess: () => { qc.invalidateQueries(['customers']); qc.invalidateQueries(['dashboard']); toast.success('Customer deleted'); },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to delete customer'),
  });

  const handleDelete = (id, name) => {
    if (window.confirm(`Delete customer "${name}"?`)) deleteMut.mutate(id);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Customers</div>
          <div className="page-subtitle">{customers.length} registered customers</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Customer</button>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div className="table-title">Customer List</div>
          <div className="search-box">
            <span className="search-icon">⌕</span>
            <input
              className="search-input"
              placeholder="Search name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="loading-state"><div className="spinner" />Loading...</div>
        ) : !customers.length ? (
          <div className="empty-state">

            <div className="empty-state-text">No customers found</div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.id}>
                  <td className="td-mono">#{c.id}</td>
                  <td className="td-main">{c.name}</td>
                  <td style={{ color: 'var(--accent2)' }}>{c.email}</td>
                  <td>{c.phone || '—'}</td>
                  <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.address || '—'}</td>
                  <td>
                    <div className="actions-cell">
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditing(c)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id, c.name)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {(showModal || editing) && (
        <CustomerModal
          customer={editing}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSubmit={editing ? (data) => updateMut.mutate({ id: editing.id, data }) : createMut.mutate}
          loading={createMut.isPending || updateMut.isPending}
        />
      )}
    </div>
  );
}

function CustomerModal({ customer, onClose, onSubmit, loading }) {
  const [form, setForm] = useState({
    name: customer?.name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{customer ? 'Edit Customer' : 'New Customer'}</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" required value={form.name} onChange={e => set('name', e.target.value)} placeholder="John Doe" />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input className="form-input" type="email" required value={form.email} onChange={e => set('email', e.target.value)} placeholder="john@example.com" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+1 (555) 000-0000" />
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <textarea className="form-textarea" value={form.address} onChange={e => set('address', e.target.value)} placeholder="123 Main St, City, State, ZIP" />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : customer ? 'Update Customer' : 'Create Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
