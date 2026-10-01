import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { transferService, settingsService, productService } from '../../services';
import { Loading, EmptyState, TableWrapper, Pagination, Modal } from '../../components';
import { fmtDate, getError } from '../../utils';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Plus, ArrowLeftRight, AlertTriangle, ShieldCheck, X, Eye, Check } from 'lucide-react';

export default function TransfersPage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [transfers, setTransfers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ sourceLocationId: '', destinationLocationId: '', items: [{ productId: '', quantity: 1 }], notes: '' });
  const [saving, setSaving] = useState(false);
  const [viewTransfer, setViewTransfer] = useState(null);

  const handleViewTransfer = async (id) => {
    try {
      const res = await transferService.getById(id);
      setViewTransfer(res.data.data);
    } catch (err) { toast.error(getError(err)); }
  };

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const res = await transferService.getAll({ page, limit: 20 });
      setTransfers(res.data.data);
      setTotal(res.data.total);
    } catch (err) { toast.error(getError(err)); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTransfers(); }, [page]);
  useEffect(() => {
    settingsService.getLocations().then(r => setLocations(r.data.data));
    productService.getAll({ limit: 200 }).then(r => setProducts(r.data.data));
  }, []);

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { productId: '', quantity: 1 }] }));
  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  const updateItem = (i, k, v) => setForm(f => ({ ...f, items: f.items.map((item, idx) => idx === i ? { ...item, [k]: v } : item) }));

  const handleCreate = async () => {
    if (!form.sourceLocationId || !form.destinationLocationId) return toast.error('Select source and destination');
    if (form.items.some(i => !i.productId || i.quantity < 1)) return toast.error('Fill all items');
    setSaving(true);
    try {
      await transferService.create(form);
      toast.success('Transfer created');
      setShowCreate(false);
      fetchTransfers();
    } catch (err) { toast.error(getError(err)); }
    finally { setSaving(false); }
  };

  const handleAction = async (id, action, label) => {
    if (!confirm(`${label}?`)) return;
    try {
      if (action === 'approve') await transferService.approve(id);
      else if (action === 'complete') await transferService.complete(id);
      else if (action === 'cancel') await transferService.cancel(id);
      toast.success(`Transfer ${label.toLowerCase()}d`);
      fetchTransfers();
    } catch (err) { toast.error(getError(err)); }
  };

  const statusBadge = (status) => {
    const map = { pending: 'badge-warning', approved: 'badge-info', completed: 'badge-success', cancelled: 'badge-gray' };
    return <span className={`badge ${map[status] || 'badge-gray'}`}>{status}</span>;
  };

  const userLocations = isAdmin() ? locations : locations.filter(l =>
    user?.locationIds?.some(ul => (ul._id || ul) === l._id)
  );

  return (
    <div>
      <div className="page-header">
        <h1>Stock Transfers</h1>
        <button className="btn btn-primary" onClick={() => { setForm({ sourceLocationId: '', destinationLocationId: '', items: [{ productId: '', quantity: 1 }], notes: '' }); setShowCreate(true); }}>
          <Plus size={14} /> New Transfer
        </button>
      </div>

      <div className="card">
        {loading ? <Loading /> : transfers.length === 0 ? (
          <EmptyState icon={<ArrowLeftRight size={26} />} title="No transfers" description="Create your first stock transfer" />
        ) : (
          <>
            <TableWrapper minWidth="820px">
              <thead>
                <tr>
                  <th>Transfer #</th>
                  <th>From → To</th>
                  <th className="th-center">Items</th>
                  <th className="th-center">Status</th>
                  <th>Date</th>
                  <th className="th-center">Exception</th>
                  <th className="th-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map(t => (
                  <tr key={t._id}>
                    <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{t.transferNumber}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span className="badge badge-info">{t.sourceLocationId?.name}</span>
                      <span style={{ margin: '0 6px', color: 'var(--text-muted)' }}>→</span>
                      <span className="badge badge-info">{t.destinationLocationId?.name}</span>
                    </td>
                    <td className="td-center" style={{ whiteSpace: 'nowrap' }}>{t.items?.length} item(s)</td>
                    <td className="td-center">{statusBadge(t.status)}</td>
                    <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>{fmtDate(t.transferDate)}</td>
                    <td className="td-center">{t.isExceptionTransfer && <span className="badge badge-warning">Exception</span>}</td>
                    <td className="td-center">
                      <div className="table-actions">
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => handleViewTransfer(t._id)} title="View Details">
                          <Eye size={14} />
                        </button>
                        {isAdmin() && t.status === 'pending' && (
                          <button className="btn btn-primary btn-sm" onClick={() => handleAction(t._id, 'approve', 'Approve')}>Approve</button>
                        )}
                        {t.status === 'approved' && (
                          <button className="btn btn-success btn-sm" onClick={() => handleAction(t._id, 'complete', 'Complete')}>Complete</button>
                        )}
                        {['pending', 'approved'].includes(t.status) && (
                          <button className="btn btn-ghost btn-sm text-danger" onClick={() => handleAction(t._id, 'cancel', 'Cancel')}>Cancel</button>
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

      {/* Create Transfer Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Stock Transfer" size="modal-lg">
        <div className="modal-body">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label required">Source Location</label>
              <select className="form-select" value={form.sourceLocationId} onChange={e => setForm(f => ({ ...f, sourceLocationId: e.target.value }))}>
                <option value="">Select source</option>
                {userLocations.map(l => <option key={l._id} value={l._id}>{l.name} ({l.code})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label required">Destination Location</label>
              <select className="form-select" value={form.destinationLocationId} onChange={e => setForm(f => ({ ...f, destinationLocationId: e.target.value }))}>
                <option value="">Select destination</option>
                {locations.filter(l => l._id !== form.sourceLocationId).map(l => <option key={l._id} value={l._id}>{l.name} ({l.code})</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <input className="form-control" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Transfer notes..." />
          </div>
          <hr className="divider" />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h4>Transfer Items</h4>
            <button className="btn btn-secondary btn-sm" onClick={addItem}>
              <Plus size={12} /> Add Item
            </button>
          </div>
          {form.items.map((item, i) => (
            <div key={i} className="order-item-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Product</label>
                <select className="form-select" value={item.productId} onChange={e => updateItem(i, 'productId', e.target.value)}>
                  <option value="">Select product</option>
                  {products.map(p => <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Quantity</label>
                <input type="number" className="form-control" min="1" value={item.quantity} onChange={e => updateItem(i, 'quantity', +e.target.value)} />
              </div>
              {form.items.length > 1 && (
                <button className="btn btn-ghost btn-sm text-danger" onClick={() => removeItem(i)} style={{ marginBottom: 0 }} aria-label="Remove item">
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
          <div className="error-box" style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <AlertTriangle size={15} /> <strong>Transfer Rules:</strong>
            </div>
            WH-A → WH-B or WH-C only. WH-B → Shop B only. WH-C → Shop C only. Cross-branch transfers (WH-B → Shop C) are blocked unless Admin allows.
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>{saving ? 'Creating...' : 'Create Transfer'}</button>
        </div>
      </Modal>

      {/* View Transfer Details Modal */}
      {viewTransfer && (
        <Modal isOpen={!!viewTransfer} onClose={() => setViewTransfer(null)} title={`Transfer: ${viewTransfer.transferNumber}`} size="modal-lg">
          <div className="modal-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 16 }}>
              <div>
                <div className="fs-12 text-muted">Status</div>
                <div className="mt-1">{statusBadge(viewTransfer.status)}</div>
              </div>
              <div>
                <div className="fs-12 text-muted">Source</div>
                <div className="fw-600 mt-1">{viewTransfer.sourceLocationId?.name} ({viewTransfer.sourceLocationId?.code})</div>
              </div>
              <div>
                <div className="fs-12 text-muted">Destination</div>
                <div className="fw-600 mt-1">{viewTransfer.destinationLocationId?.name} ({viewTransfer.destinationLocationId?.code})</div>
              </div>
              <div>
                <div className="fs-12 text-muted">Transfer Date</div>
                <div className="fw-600 mt-1">{fmtDate(viewTransfer.transferDate)}</div>
              </div>
              <div>
                <div className="fs-12 text-muted">Created By</div>
                <div className="fw-600 mt-1">{viewTransfer.createdBy?.name || 'N/A'}</div>
              </div>
            </div>

            {viewTransfer.isExceptionTransfer && (
              <div className="error-box" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <ShieldCheck size={15} /> <strong>Exception Transfer:</strong> Authorized by administrator override.
              </div>
            )}

            {viewTransfer.notes && (
              <p className="fs-13 text-muted mb-3"><strong>Notes:</strong> {viewTransfer.notes}</p>
            )}

            <h4 style={{ marginBottom: 8 }}>Transfer Items</h4>
            <TableWrapper minWidth="500px">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Barcode</th>
                  <th className="th-right">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {viewTransfer.items?.map((item, idx) => (
                  <tr key={idx}>
                    <td className="fw-600">{item.productId?.name || 'Product'}</td>
                    <td><code className="sku-code">{item.productId?.sku || 'N/A'}</code></td>
                    <td><span className="badge badge-gray">{item.productId?.barcode || 'N/A'}</span></td>
                    <td className="td-right fw-700">{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </TableWrapper>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setViewTransfer(null)}>Close</button>
            {isAdmin() && viewTransfer.status === 'pending' && (
              <button className="btn btn-primary" onClick={() => { handleAction(viewTransfer._id, 'approve', 'Approve'); setViewTransfer(null); }}>Approve</button>
            )}
            {viewTransfer.status === 'approved' && (
              <button className="btn btn-success" onClick={() => { handleAction(viewTransfer._id, 'complete', 'Complete'); setViewTransfer(null); }}>Complete Transfer</button>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
