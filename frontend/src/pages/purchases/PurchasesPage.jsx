import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { purchaseService, supplierService, settingsService, productService } from '../../services';
import { Loading, EmptyState, TableWrapper, Pagination, Modal } from '../../components';
import { fmt, fmtDate, getError } from '../../utils';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Plus, ShoppingCart, X, RotateCcw, PackageCheck, CreditCard, Eye } from 'lucide-react';

const INITIAL_FORM = {
  supplierId: '', locationId: '', items: [{ productId: '', quantity: 1, purchasePrice: 0 }],
  discount: 0, notes: '', purchaseDate: new Date().toISOString().split('T')[0]
};

export default function PurchasesPage() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [payModal, setPayModal] = useState(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState('cash');
  const [viewPurchase, setViewPurchase] = useState(null);
  const [returnPurchaseModal, setReturnPurchaseModal] = useState(null);
  const [returnItems, setReturnItems] = useState([]);
  const [returnReason, setReturnReason] = useState('');

  const handleViewPurchase = async (id) => {
    try {
      const res = await purchaseService.getById(id);
      setViewPurchase(res.data.data);
    } catch (err) { toast.error(getError(err)); }
  };

  const openReturnModal = (p) => {
    setReturnPurchaseModal(p);
    setReturnItems(p.items.map(item => ({
      productId: item.productId?._id || item.productId,
      name: item.productId?.name || 'Product',
      sku: item.productId?.sku || '',
      purchasedQty: item.quantity,
      purchasePrice: item.purchasePrice || 0,
      returnQty: 0
    })));
    setReturnReason('');
  };

  const handleReturnSubmit = async () => {
    const items = returnItems.filter(i => i.returnQty > 0).map(i => ({
      productId: i.productId,
      quantity: i.returnQty,
      purchasePrice: i.purchasePrice
    }));
    if (items.length === 0) return toast.error('Select at least one item to return');
    try {
      await purchaseService.return(returnPurchaseModal._id, { items, reason: returnReason });
      toast.success('Purchase return processed successfully!');
      setReturnPurchaseModal(null);
      fetchPurchases();
    } catch (err) { toast.error(getError(err)); }
  };

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const res = await purchaseService.getAll({ page, limit: 20 });
      setPurchases(res.data.data);
      setTotal(res.data.total);
    } catch (err) { toast.error(getError(err)); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPurchases(); }, [page]);
  useEffect(() => {
    supplierService.getAll({ limit: 100 }).then(r => setSuppliers(r.data.data));
    settingsService.getLocations().then(r => setLocations(r.data.data.filter(l => l.type === 'warehouse')));
    productService.getAll({ limit: 200 }).then(r => setProducts(r.data.data));
  }, []);

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { productId: '', quantity: 1, purchasePrice: 0 }] }));
  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  const updateItem = (i, k, v) => {
    setForm(f => {
      const items = f.items.map((item, idx) => {
        if (idx !== i) return item;
        if (k === 'productId') {
          const prod = products.find(p => p._id === v);
          return { ...item, productId: v, purchasePrice: prod?.purchasePrice || 0 };
        }
        return { ...item, [k]: v };
      });
      return { ...f, items };
    });
  };

  const calcTotals = () => {
    const subtotal = form.items.reduce((s, i) => s + (i.quantity * i.purchasePrice), 0);
    const grandTotal = subtotal - (form.discount || 0);
    return { subtotal, grandTotal };
  };

  const handleCreate = async () => {
    if (!form.supplierId || !form.locationId) return toast.error('Select supplier and location');
    if (form.items.some(i => !i.productId)) return toast.error('Select product for all items');
    setSaving(true);
    const { subtotal, grandTotal } = calcTotals();
    const items = form.items.map(i => ({
      ...i, quantity: +i.quantity, purchasePrice: +i.purchasePrice,
      taxAmount: 0, total: i.quantity * i.purchasePrice
    }));
    try {
      await purchaseService.create({ ...form, items, subtotal, taxAmount: 0, grandTotal });
      toast.success('Purchase order created');
      setShowCreate(false);
      fetchPurchases();
    } catch (err) { toast.error(getError(err)); }
    finally { setSaving(false); }
  };

  const handleReceive = async (id) => {
    if (!confirm('Receive all goods and update stock?')) return;
    try {
      await purchaseService.receive(id);
      toast.success('Goods received! Stock updated.');
      fetchPurchases();
    } catch (err) { toast.error(getError(err)); }
  };

  const handlePayment = async () => {
    if (!payAmount || payAmount <= 0) return toast.error('Enter valid amount');
    try {
      await purchaseService.pay(payModal._id, { amount: +payAmount, paymentMethod: payMethod });
      toast.success('Payment recorded');
      setPayModal(null);
      fetchPurchases();
    } catch (err) { toast.error(getError(err)); }
  };

  const { subtotal, grandTotal } = calcTotals();

  const statusColors = { ordered: 'badge-info', received: 'badge-success', partially_received: 'badge-warning', cancelled: 'badge-danger' };
  const payColors = { paid: 'badge-success', partial: 'badge-warning', unpaid: 'badge-danger' };

  return (
    <div>
      <div className="page-header">
        <h1>Purchases</h1>
        <button className="btn btn-primary" onClick={() => { setForm(INITIAL_FORM); setShowCreate(true); }}>
          <Plus size={14} /> New Purchase Order
        </button>
      </div>

      <div className="card">
        {loading ? <Loading /> : purchases.length === 0 ? (
          <EmptyState icon={<ShoppingCart size={26} />} title="No purchases" description="Create your first purchase order" />
        ) : (
          <>
            <TableWrapper minWidth="880px">
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Supplier</th>
                  <th>Location</th>
                  <th className="th-right">Total</th>
                  <th className="th-right">Paid</th>
                  <th className="th-center">Status</th>
                  <th className="th-center">Payment</th>
                  <th>Date</th>
                  <th className="th-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map(p => (
                  <tr key={p._id}>
                    <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{p.purchaseNumber}</td>
                    <td style={{ fontWeight: 500, minWidth: 140 }}>{p.supplierId?.name}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{p.locationId?.name}</td>
                    <td className="td-right" style={{ fontWeight: 700, color: 'var(--text)' }}>{fmt(p.grandTotal)}</td>
                    <td className="td-right" style={{ color: 'var(--text-muted)' }}>{fmt(p.paidAmount)}</td>
                    <td className="td-center"><span className={`badge ${statusColors[p.status]}`}>{p.status}</span></td>
                    <td className="td-center"><span className={`badge ${payColors[p.paymentStatus]}`}>{p.paymentStatus}</span></td>
                    <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>{fmtDate(p.purchaseDate)}</td>
                    <td className="td-center">
                      <div className="table-actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => handleViewPurchase(p._id)}>View</button>
                        {p.status === 'ordered' && (
                          <button className="btn btn-success btn-sm" onClick={() => handleReceive(p._id)}>Receive</button>
                        )}
                        {p.paymentStatus !== 'paid' && p.status === 'received' && (
                          <button className="btn btn-primary btn-sm" onClick={() => { setPayModal(p); setPayAmount(p.grandTotal - (p.paidAmount || 0)); }}>Pay</button>
                        )}
                        {p.status === 'received' && (
                          <button className="btn btn-warning btn-sm" onClick={() => openReturnModal(p)}>Return</button>
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

      {/* Create Purchase Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Purchase Order" size="modal-xl">
        <div className="modal-body">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label required">Supplier</label>
              <select className="form-select" value={form.supplierId} onChange={e => setForm(f => ({ ...f, supplierId: e.target.value }))}>
                <option value="">Select supplier</option>
                {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label required">Receive at (Warehouse)</label>
              <select className="form-select" value={form.locationId} onChange={e => setForm(f => ({ ...f, locationId: e.target.value }))}>
                <option value="">Select warehouse</option>
                {locations.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Purchase Date</label>
              <input type="date" className="form-control" value={form.purchaseDate} onChange={e => setForm(f => ({ ...f, purchaseDate: e.target.value }))} />
            </div>
          </div>

          <hr className="divider" />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h4>Items</h4>
            <button className="btn btn-secondary btn-sm" onClick={addItem}>
              <Plus size={12} /> Add Item
            </button>
          </div>
          {form.items.map((item, i) => (
            <div key={i} className="order-item-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                {i === 0 && <label className="form-label">Product</label>}
                <select className="form-select" value={item.productId} onChange={e => updateItem(i, 'productId', e.target.value)}>
                  <option value="">Select product</option>
                  {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                {i === 0 && <label className="form-label">Qty</label>}
                <input type="number" className="form-control" min="1" value={item.quantity} onChange={e => updateItem(i, 'quantity', +e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                {i === 0 && <label className="form-label">Unit Price (₹)</label>}
                <input type="number" className="form-control" min="0" value={item.purchasePrice} onChange={e => updateItem(i, 'purchasePrice', +e.target.value)} />
              </div>
              {form.items.length > 1 && (
                <button className="btn btn-ghost btn-sm text-danger" onClick={() => removeItem(i)} aria-label="Remove item">
                  <X size={14} />
                </button>
              )}
            </div>
          ))}

          <hr className="divider" />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <div className="form-group" style={{ width: 160 }}>
              <label className="form-label">Discount (₹)</label>
              <input type="number" className="form-control" value={form.discount} onChange={e => setForm(f => ({ ...f, discount: +e.target.value }))} min="0" />
            </div>
            <div style={{ textAlign: 'right', padding: '8px 0' }}>
              <div className="text-muted fs-12">Subtotal: {fmt(subtotal)}</div>
              <div className="fw-700" style={{ fontSize: '1rem', color: 'var(--text)' }}>Total: {fmt(grandTotal)}</div>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-control" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>{saving ? 'Creating...' : 'Create Purchase Order'}</button>
        </div>
      </Modal>

      {/* Payment Modal */}
      {payModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setPayModal(null)}>
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="modal-header">
              <h3>Record Payment</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setPayModal(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <p className="fs-13 text-muted mb-3">PO: {payModal.purchaseNumber} · Outstanding: {fmt(payModal.grandTotal - (payModal.paidAmount || 0))}</p>
              <div className="form-group">
                <label className="form-label required">Amount (₹)</label>
                <input type="number" className="form-control" value={payAmount} onChange={e => setPayAmount(+e.target.value)} min="1" max={payModal.grandTotal - (payModal.paidAmount || 0)} />
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
          </div>
        </div>
      )}

      {/* View Purchase Modal */}
      {viewPurchase && (
        <Modal isOpen={!!viewPurchase} onClose={() => setViewPurchase(null)} title={`PO: ${viewPurchase.purchaseNumber}`} size="modal-lg">
          <div className="modal-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 16 }}>
              <div>
                <div className="fs-12 text-muted">Supplier</div>
                <div className="fw-600 mt-1">{viewPurchase.supplierId?.name}</div>
              </div>
              <div>
                <div className="fs-12 text-muted">Location</div>
                <div className="fw-600 mt-1">{viewPurchase.locationId?.name}</div>
              </div>
              <div>
                <div className="fs-12 text-muted">Date</div>
                <div className="fw-600 mt-1">{fmtDate(viewPurchase.purchaseDate)}</div>
              </div>
              <div>
                <div className="fs-12 text-muted">Status</div>
                <div className="mt-1"><span className={`badge ${statusColors[viewPurchase.status]}`}>{viewPurchase.status}</span></div>
              </div>
              <div>
                <div className="fs-12 text-muted">Payment</div>
                <div className="mt-1"><span className={`badge ${payColors[viewPurchase.paymentStatus]}`}>{viewPurchase.paymentStatus}</span></div>
              </div>
            </div>

            {viewPurchase.notes && (
              <p className="fs-13 text-muted mb-3"><strong>Notes:</strong> {viewPurchase.notes}</p>
            )}

            <h4 style={{ marginBottom: 8 }}>Items</h4>
            <TableWrapper minWidth="550px">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th className="th-right">Quantity</th>
                  <th className="th-right">Unit Price</th>
                  <th className="th-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {viewPurchase.items?.map((item, idx) => (
                  <tr key={idx}>
                    <td className="fw-600">{item.productId?.name || 'Product'}</td>
                    <td><code className="sku-code">{item.productId?.sku || 'N/A'}</code></td>
                    <td className="td-right fw-700">{item.quantity}</td>
                    <td className="td-right">{fmt(item.purchasePrice)}</td>
                    <td className="td-right fw-600">{fmt(item.total || item.quantity * item.purchasePrice)}</td>
                  </tr>
                ))}
              </tbody>
            </TableWrapper>

            <div style={{ textAlign: 'right', marginTop: 14 }}>
              <div className="text-muted fs-12">Subtotal: {fmt(viewPurchase.subtotal)}</div>
              {viewPurchase.discount > 0 && <div className="text-muted fs-12">Discount: -{fmt(viewPurchase.discount)}</div>}
              {viewPurchase.taxAmount > 0 && <div className="text-muted fs-12">Tax: {fmt(viewPurchase.taxAmount)}</div>}
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--primary-light)', marginTop: 4 }}>
                Grand Total: {fmt(viewPurchase.grandTotal)}
              </div>
              <div className="text-muted fs-12 mt-1">Paid: {fmt(viewPurchase.paidAmount || 0)} | Due: {fmt(viewPurchase.grandTotal - (viewPurchase.paidAmount || 0))}</div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setViewPurchase(null)}>Close</button>
            {viewPurchase.status === 'ordered' && (
              <button className="btn btn-success" onClick={() => { handleReceive(viewPurchase._id); setViewPurchase(null); }}>Receive Goods</button>
            )}
            {viewPurchase.status === 'received' && (
              <button className="btn btn-warning" onClick={() => { openReturnModal(viewPurchase); setViewPurchase(null); }}>Return to Supplier</button>
            )}
          </div>
        </Modal>
      )}

      {/* Return to Supplier Modal */}
      {returnPurchaseModal && (
        <Modal isOpen={!!returnPurchaseModal} onClose={() => setReturnPurchaseModal(null)} title={`Purchase Return: ${returnPurchaseModal.purchaseNumber}`}>
          <div className="modal-body">
            <p className="fs-13 text-muted mb-3">Select quantities to return to {returnPurchaseModal.supplierId?.name}:</p>
            {returnItems.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ flex: 1 }}>
                  <div className="fw-600 fs-13">{item.name}</div>
                  <div className="fs-12 text-muted">Purchased: {item.purchasedQty} · Cost: {fmt(item.purchasePrice)}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <label className="fs-12 text-muted">Return Qty:</label>
                  <input type="number" className="form-control" style={{ width: 70 }} value={item.returnQty} min="0" max={item.purchasedQty}
                    onChange={e => setReturnItems(ri => ri.map((r, idx) => idx === i ? { ...r, returnQty: Math.max(0, Math.min(item.purchasedQty, +e.target.value)) } : r))} />
                </div>
              </div>
            ))}
            <div className="form-group" style={{ marginTop: 12 }}>
              <label className="form-label">Return Reason</label>
              <input className="form-control" value={returnReason} onChange={e => setReturnReason(e.target.value)} placeholder="Defective, wrong item, excess stock..." />
            </div>
            <div style={{ marginTop: 12, textAlign: 'right' }}>
              <div className="fw-700 text-warning">
                Total Refund: {fmt(returnItems.reduce((s, i) => s + (i.returnQty * i.purchasePrice), 0))}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setReturnPurchaseModal(null)}>Cancel</button>
            <button className="btn btn-warning" onClick={handleReturnSubmit}>Confirm Return</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
