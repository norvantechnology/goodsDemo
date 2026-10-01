import { useState, useEffect } from 'react';
import { salesService, settingsService } from '../../services';
import { Loading, EmptyState, TableWrapper, Pagination, Modal } from '../../components';
import { fmt, fmtDate, getError } from '../../utils';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { ReceiptText, RotateCcw, Eye, Coins, CreditCard, Building2, FileText, CheckCircle2 } from 'lucide-react';

export default function SalesPage() {
  const { user, isAdmin } = useAuth();
  const [sales, setSales] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [locationFilter, setLocationFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [viewSale, setViewSale] = useState(null);
  const [returnModal, setReturnModal] = useState(null);
  const [returnItems, setReturnItems] = useState([]);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await salesService.getAll({ locationId: locationFilter, from: fromDate, to: toDate, page, limit: 20 });
      setSales(res.data.data);
      setTotal(res.data.total);
    } catch (err) { toast.error(getError(err)); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSales(); }, [page, locationFilter, fromDate, toDate]);
  useEffect(() => { settingsService.getLocations().then(r => setLocations(r.data.data)); }, []);

  const handleViewSale = async (id) => {
    const res = await salesService.getById(id);
    setViewSale(res.data.data);
  };

  const openReturnModal = (sale) => {
    setReturnModal(sale);
    setReturnItems(sale.items.map(i => ({ ...i, returnQty: 0 })));
  };

  const handleReturn = async () => {
    const items = returnItems.filter(i => i.returnQty > 0).map(i => ({
      productId: i.productId?._id || i.productId,
      quantity: i.returnQty,
      price: i.price,
      total: i.price * i.returnQty
    }));
    if (items.length === 0) return toast.error('Select at least one item to return');
    try {
      await salesService.return(returnModal._id, { items, reason: 'Customer return' });
      toast.success('Return processed successfully');
      setReturnModal(null);
      fetchSales();
    } catch (err) { toast.error(getError(err)); }
  };

  const statusColor = (s) => ({ paid: 'badge-success', partial: 'badge-warning', credit: 'badge-info' }[s] || 'badge-gray');

  const renderPaymentIcon = (m) => {
    if (m === 'cash') return <Coins size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />;
    if (m === 'card') return <CreditCard size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />;
    if (m === 'bank') return <Building2 size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />;
    return <FileText size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />;
  };

  return (
    <div>
      <div className="page-header">
        <h1>Sales History</h1>
      </div>

      <div className="card">
        <div className="filter-bar">
          <select className="form-select" style={{ maxWidth: 180 }} value={locationFilter} onChange={e => { setLocationFilter(e.target.value); setPage(1); }}>
            <option value="">All Locations</option>
            {locations.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
          </select>
          <input type="date" className="form-control" style={{ maxWidth: 160 }} value={fromDate} onChange={e => setFromDate(e.target.value)} placeholder="From date" />
          <input type="date" className="form-control" style={{ maxWidth: 160 }} value={toDate} onChange={e => setToDate(e.target.value)} placeholder="To date" />
          <button className="btn btn-secondary btn-sm" onClick={() => { setFromDate(''); setToDate(''); setLocationFilter(''); }}>Clear</button>
        </div>

        {loading ? <Loading /> : sales.length === 0 ? (
          <EmptyState icon={<ReceiptText size={26} />} title="No sales found" description="Sales will appear after transactions" />
        ) : (
          <>
            <TableWrapper minWidth="840px">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Shop</th>
                  <th>Customer</th>
                  <th className="th-center">Items</th>
                  <th className="th-right">Total</th>
                  <th>Payment</th>
                  <th className="th-center">Status</th>
                  <th>Date</th>
                  <th className="th-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sales.map(s => (
                  <tr key={s._id}>
                    <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{s.invoiceNumber}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{s.locationId?.name}</td>
                    <td style={{ minWidth: 130 }}>{s.customerId?.name || 'Walk-in'}</td>
                    <td className="td-center">{s.items?.length}</td>
                    <td className="td-right" style={{ fontWeight: 700, color: 'var(--text)' }}>{fmt(s.grandTotal)}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {renderPaymentIcon(s.paymentMethod)}
                      <span style={{ textTransform: 'capitalize' }}>{s.paymentMethod}</span>
                    </td>
                    <td className="td-center"><span className={`badge ${statusColor(s.paymentStatus)}`}>{s.paymentStatus}</span></td>
                    <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>{fmtDate(s.saleDate, true)}</td>
                    <td className="td-center">
                      <div className="table-actions">
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => handleViewSale(s._id)} title="View Invoice">
                          <Eye size={14} />
                        </button>
                        <button className="btn btn-warning btn-sm btn-icon" onClick={() => openReturnModal(s)} title="Return Items">
                          <RotateCcw size={14} />
                        </button>
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

      {/* View Sale Modal */}
      {viewSale && (
        <Modal isOpen={!!viewSale} onClose={() => setViewSale(null)} title={`Invoice: ${viewSale?.invoiceNumber}`}>
          <div className="modal-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              {[['Shop', viewSale.locationId?.name], ['Customer', viewSale.customerId?.name || 'Walk-in'],
                ['Date', fmtDate(viewSale.saleDate, true)], ['Payment', viewSale.paymentMethod]].map(([l, v]) => (
                <div key={l}><div className="fs-12 text-muted">{l}</div><div className="fw-600">{v}</div></div>
              ))}
            </div>
            <TableWrapper>
              <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
              <tbody>
                {viewSale.items?.map((i, idx) => (
                  <tr key={idx}>
                    <td>{i.productId?.name}</td>
                    <td>{i.quantity}</td>
                    <td>{fmt(i.price)}</td>
                    <td>{fmt(i.total)}</td>
                  </tr>
                ))}
              </tbody>
            </TableWrapper>
            <div style={{ textAlign: 'right', marginTop: 10 }}>
              <div className="text-muted fs-12">Subtotal: {fmt(viewSale.subtotal)}</div>
              {viewSale.discount > 0 && <div className="text-muted fs-12">Discount: -{fmt(viewSale.discount)}</div>}
              {viewSale.taxAmount > 0 && <div className="text-muted fs-12">Tax: {fmt(viewSale.taxAmount)}</div>}
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)' }}>Total: {fmt(viewSale.grandTotal)}</div>
            </div>
          </div>
        </Modal>
      )}

      {/* Return Modal */}
      {returnModal && (
        <Modal isOpen={!!returnModal} onClose={() => setReturnModal(null)} title={`Return: ${returnModal?.invoiceNumber}`}>
          <div className="modal-body">
            <p className="fs-13 text-muted mb-3">Select quantities to return:</p>
            {returnItems.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ flex: 1 }}>
                  <div className="fw-600 fs-13">{item.productId?.name}</div>
                  <div className="fs-12 text-muted">Sold: {item.quantity} · {fmt(item.price)} each</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <label className="fs-12 text-muted">Return:</label>
                  <input type="number" className="form-control" style={{ width: 70 }} value={item.returnQty} min="0" max={item.quantity}
                    onChange={e => setReturnItems(ri => ri.map((r, idx) => idx === i ? { ...r, returnQty: +e.target.value } : r))} />
                </div>
              </div>
            ))}
            <div style={{ marginTop: 12, textAlign: 'right' }}>
              <div className="fw-700 text-warning">Refund: {fmt(returnItems.reduce((s, i) => s + (i.returnQty * i.price), 0))}</div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setReturnModal(null)}>Cancel</button>
            <button className="btn btn-warning" onClick={handleReturn}>Process Return</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
