import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerService } from '../../services';
import { Loading, EmptyState, TableWrapper, Pagination, Modal } from '../../components';
import { fmt, getError } from '../../utils';
import toast from 'react-hot-toast';
import { Users, Plus, Search, Eye, Edit2, CreditCard, X } from 'lucide-react';

const INITIAL_FORM = { name: '', phone: '', email: '', address: '', openingBalance: 0, creditLimit: 0 };

export default function CustomersPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [payModal, setPayModal] = useState(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState('cash');
  const [viewCustomer, setViewCustomer] = useState(null);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await customerService.getAll({ search, page, limit: 20 });
      setCustomers(res.data.data);
      setTotal(res.data.total);
    } catch (err) { toast.error(getError(err)); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCustomers(); }, [page, search]);

  const openCreate = () => { setEditCustomer(null); setForm(INITIAL_FORM); setShowModal(true); };
  const openEdit = (c) => { setEditCustomer(c); setForm(c); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name) return toast.error('Name is required');
    setSaving(true);
    try {
      if (editCustomer) { await customerService.update(editCustomer._id, form); toast.success('Customer updated'); }
      else { await customerService.create(form); toast.success('Customer created'); }
      setShowModal(false);
      fetchCustomers();
    } catch (err) { toast.error(getError(err)); }
    finally { setSaving(false); }
  };

  const handlePayment = async () => {
    if (!payAmount || payAmount <= 0) return toast.error('Enter valid amount');
    try {
      await customerService.receivePayment(payModal._id, { amount: +payAmount, paymentMethod: payMethod });
      toast.success('Payment received');
      setPayModal(null);
      fetchCustomers();
    } catch (err) { toast.error(getError(err)); }
  };

  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div>
      <div className="page-header">
        <h1>Customers</h1>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={14} /> Add Customer
        </button>
      </div>

      <div className="card">
        <div className="filter-bar">
          <div className="search-box">
            <span className="search-icon"><Search size={14} /></span>
            <input className="form-control" placeholder="Search by name or phone..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
        </div>

        {loading ? <Loading /> : customers.length === 0 ? (
          <EmptyState
            icon={<Users size={26} />}
            title="No customers"
            description="Add your first customer"
            action={<button className="btn btn-primary btn-sm" onClick={openCreate}><Plus size={13} /> Add Customer</button>}
          />
        ) : (
          <>
            <TableWrapper minWidth="740px">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th className="th-right">Credit Limit</th>
                  <th className="th-right">Outstanding</th>
                  <th className="th-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c._id}>
                    <td style={{ fontWeight: 600, minWidth: 140 }}>{c.name}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{c.phone || '-'}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{c.email || '-'}</td>
                    <td className="td-right" style={{ color: 'var(--text-muted)' }}>{fmt(c.creditLimit)}</td>
                    <td className="td-right" style={{ color: c.currentBalance > 0 ? 'var(--warning)' : 'var(--text-muted)', fontWeight: c.currentBalance > 0 ? 700 : 400 }}>
                      {fmt(c.currentBalance)}
                    </td>
                    <td className="td-center">
                      <div className="table-actions">
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setViewCustomer(c)} title="View Details">
                          <Eye size={14} />
                        </button>
                        <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(c)} title="Edit">
                          <Edit2 size={14} />
                        </button>
                        {c.currentBalance > 0 && (
                          <button className="btn btn-success btn-sm" onClick={() => { setPayModal(c); setPayAmount(c.currentBalance); }}>
                            <CreditCard size={13} /> Receive
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableWrapper>
            <Pagination page={page} total={total} limit={20} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* Customer Form Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editCustomer ? 'Edit Customer' : 'Add Customer'}>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label required">Customer Name</label>
            <input className="form-control" value={form.name} onChange={e => setF('name', e.target.value)} placeholder="Full name or company" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-control" value={form.phone} onChange={e => setF('phone', e.target.value)} placeholder="Phone number" />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-control" value={form.email} onChange={e => setF('email', e.target.value)} placeholder="Email address" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Address</label>
            <textarea className="form-control" value={form.address} onChange={e => setF('address', e.target.value)} rows={2} placeholder="Full address" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Credit Limit (₹)</label>
              <input type="number" className="form-control" value={form.creditLimit} onChange={e => setF('creditLimit', +e.target.value)} min="0" />
            </div>
            {!editCustomer && (
              <div className="form-group">
                <label className="form-label">Opening Balance (₹)</label>
                <input type="number" className="form-control" value={form.openingBalance} onChange={e => setF('openingBalance', +e.target.value)} />
              </div>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Customer'}</button>
        </div>
      </Modal>

      {/* Payment Modal */}
      {payModal && (
        <Modal isOpen={!!payModal} onClose={() => setPayModal(null)} title={`Receive Payment: ${payModal.name}`}>
          <div className="modal-body">
            <p className="fs-13 text-muted mb-3">Outstanding balance: <strong className="text-warning">{fmt(payModal.currentBalance)}</strong></p>
            <div className="form-group">
              <label className="form-label required">Payment Amount (₹)</label>
              <input type="number" className="form-control" value={payAmount} onChange={e => setPayAmount(+e.target.value)} min="1" max={payModal.currentBalance} />
            </div>
            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <select className="form-select" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                {['cash', 'card', 'bank', 'other'].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setPayModal(null)}>Cancel</button>
            <button className="btn btn-success" onClick={handlePayment}>Record Payment</button>
          </div>
        </Modal>
      )}

      {/* View Customer Modal */}
      {viewCustomer && (
        <Modal isOpen={!!viewCustomer} onClose={() => setViewCustomer(null)} title={`Customer: ${viewCustomer.name}`}>
          <div className="modal-body">
            <div className="grid-2 mb-3">
              <div><div className="fs-12 text-muted">Phone</div><div className="fw-600">{viewCustomer.phone || 'None'}</div></div>
              <div><div className="fs-12 text-muted">Email</div><div className="fw-600">{viewCustomer.email || 'None'}</div></div>
              <div><div className="fs-12 text-muted">Credit Limit</div><div className="fw-600">{fmt(viewCustomer.creditLimit)}</div></div>
              <div>
                <div className="fs-12 text-muted">Outstanding Balance</div>
                <div className="fw-700" style={{ color: viewCustomer.currentBalance > 0 ? 'var(--warning)' : 'var(--success)' }}>
                  {fmt(viewCustomer.currentBalance)}
                </div>
              </div>
            </div>
            {viewCustomer.address && (
              <div><div className="fs-12 text-muted">Address</div><div className="fs-13">{viewCustomer.address}</div></div>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setViewCustomer(null)}>Close</button>
            <button className="btn btn-primary" onClick={() => { const c = viewCustomer; setViewCustomer(null); openEdit(c); }}>
              <Edit2 size={13} /> Edit Customer
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
