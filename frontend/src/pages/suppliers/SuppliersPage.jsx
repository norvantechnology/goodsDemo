import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supplierService } from '../../services';
import { Loading, EmptyState, TableWrapper, Pagination, Modal } from '../../components';
import { fmt, getError } from '../../utils';
import toast from 'react-hot-toast';
import { Building2, Plus, Search, Eye, Edit2, CreditCard, X } from 'lucide-react';

const INITIAL_FORM = { name: '', contactPerson: '', phone: '', email: '', address: '', openingBalance: 0 };

export default function SuppliersPage() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editSupplier, setEditSupplier] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [payModal, setPayModal] = useState(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState('cash');
  const [viewSupplier, setViewSupplier] = useState(null);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await supplierService.getAll({ search, page, limit: 20 });
      setSuppliers(res.data.data);
      setTotal(res.data.total);
    } catch (err) { toast.error(getError(err)); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSuppliers(); }, [page, search]);

  const openCreate = () => { setEditSupplier(null); setForm(INITIAL_FORM); setShowModal(true); };
  const openEdit = (s) => { setEditSupplier(s); setForm(s); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name) return toast.error('Name is required');
    setSaving(true);
    try {
      if (editSupplier) { await supplierService.update(editSupplier._id, form); toast.success('Supplier updated'); }
      else { await supplierService.create(form); toast.success('Supplier created'); }
      setShowModal(false);
      fetchSuppliers();
    } catch (err) { toast.error(getError(err)); }
    finally { setSaving(false); }
  };

  const handlePayment = async () => {
    if (!payAmount || payAmount <= 0) return toast.error('Enter valid amount');
    try {
      await supplierService.makePayment(payModal._id, { amount: +payAmount, paymentMethod: payMethod });
      toast.success('Payment made');
      setPayModal(null);
      fetchSuppliers();
    } catch (err) { toast.error(getError(err)); }
  };

  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div>
      <div className="page-header">
        <h1>Suppliers</h1>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={14} /> Add Supplier
        </button>
      </div>

      <div className="card">
        <div className="filter-bar">
          <div className="search-box">
            <span className="search-icon"><Search size={14} /></span>
            <input className="form-control" placeholder="Search by name or phone..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
        </div>

        {loading ? <Loading /> : suppliers.length === 0 ? (
          <EmptyState
            icon={<Building2 size={26} />}
            title="No suppliers"
            description="Add your first supplier"
            action={<button className="btn btn-primary btn-sm" onClick={openCreate}><Plus size={13} /> Add Supplier</button>}
          />
        ) : (
          <>
            <TableWrapper minWidth="740px">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th className="th-right">Outstanding</th>
                  <th className="th-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map(s => (
                  <tr key={s._id}>
                    <td style={{ fontWeight: 600, minWidth: 140 }}>{s.name}</td>
                    <td>{s.contactPerson || '-'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{s.phone || '-'}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{s.email || '-'}</td>
                    <td className="td-right" style={{ color: s.currentBalance > 0 ? 'var(--danger)' : 'var(--text-muted)', fontWeight: s.currentBalance > 0 ? 700 : 400 }}>
                      {fmt(s.currentBalance)}
                    </td>
                    <td className="td-center">
                      <div className="table-actions">
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setViewSupplier(s)} title="View Details">
                          <Eye size={14} />
                        </button>
                        <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(s)} title="Edit">
                          <Edit2 size={14} />
                        </button>
                        {s.currentBalance > 0 && (
                          <button className="btn btn-primary btn-sm" onClick={() => { setPayModal(s); setPayAmount(s.currentBalance); }}>
                            <CreditCard size={13} /> Pay
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

      {/* Supplier Form Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editSupplier ? 'Edit Supplier' : 'Add Supplier'}>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label required">Supplier Name</label>
            <input className="form-control" value={form.name} onChange={e => setF('name', e.target.value)} placeholder="Company / Vendor name" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Contact Person</label>
              <input className="form-control" value={form.contactPerson} onChange={e => setF('contactPerson', e.target.value)} placeholder="Contact person name" />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-control" value={form.phone} onChange={e => setF('phone', e.target.value)} placeholder="Phone number" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className="form-control" value={form.email} onChange={e => setF('email', e.target.value)} placeholder="Email address" />
          </div>
          <div className="form-group">
            <label className="form-label">Address</label>
            <textarea className="form-control" value={form.address} onChange={e => setF('address', e.target.value)} rows={2} placeholder="Full address" />
          </div>
          {!editSupplier && (
            <div className="form-group">
              <label className="form-label">Opening Balance (₹)</label>
              <input type="number" className="form-control" value={form.openingBalance} onChange={e => setF('openingBalance', +e.target.value)} />
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Supplier'}</button>
        </div>
      </Modal>

      {/* Payment Modal */}
      {payModal && (
        <Modal isOpen={!!payModal} onClose={() => setPayModal(null)} title={`Make Payment: ${payModal.name}`}>
          <div className="modal-body">
            <p className="fs-13 text-muted mb-3">Outstanding balance: <strong className="text-danger">{fmt(payModal.currentBalance)}</strong></p>
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
            <button className="btn btn-primary" onClick={handlePayment}>Record Payment</button>
          </div>
        </Modal>
      )}

      {/* View Supplier Modal */}
      {viewSupplier && (
        <Modal isOpen={!!viewSupplier} onClose={() => setViewSupplier(null)} title={`Supplier: ${viewSupplier.name}`}>
          <div className="modal-body">
            <div className="grid-2 mb-3">
              <div><div className="fs-12 text-muted">Contact Person</div><div className="fw-600">{viewSupplier.contactPerson || 'None'}</div></div>
              <div><div className="fs-12 text-muted">Phone</div><div className="fw-600">{viewSupplier.phone || 'None'}</div></div>
              <div><div className="fs-12 text-muted">Email</div><div className="fw-600">{viewSupplier.email || 'None'}</div></div>
              <div>
                <div className="fs-12 text-muted">Payable Balance</div>
                <div className="fw-700" style={{ color: viewSupplier.currentBalance > 0 ? 'var(--danger)' : 'var(--success)' }}>
                  {fmt(viewSupplier.currentBalance)}
                </div>
              </div>
            </div>
            {viewSupplier.address && (
              <div><div className="fs-12 text-muted">Address</div><div className="fs-13">{viewSupplier.address}</div></div>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setViewSupplier(null)}>Close</button>
            <button className="btn btn-primary" onClick={() => { const s = viewSupplier; setViewSupplier(null); openEdit(s); }}>
              <Edit2 size={13} /> Edit Supplier
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
