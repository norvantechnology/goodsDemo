import { useState, useEffect, useCallback } from 'react';
import { inventoryService, settingsService, productService } from '../../services';
import { Loading, EmptyState, TableWrapper, Pagination } from '../../components';
import { fmt, fmtNum, fmtDate, getError, movTypeLabel, debounce } from '../../utils';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { SlidersHorizontal, Warehouse, ArrowLeftRight, Search, X } from 'lucide-react';

export default function InventoryPage() {
  const { user, isAdmin } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [movements, setMovements] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('stock');
  const [locationFilter, setLocationFilter] = useState('');
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [movPage, setMovPage] = useState(1);
  const [movTotal, setMovTotal] = useState(0);
  const [showAdjModal, setShowAdjModal] = useState(false);
  const [adjForm, setAdjForm] = useState({ productId: '', locationId: '', quantity: 0, notes: '' });
  const [products, setProducts] = useState([]);

  useEffect(() => {
    settingsService.getLocations().then(r => setLocations(r.data.data));
    productService.getAll({ limit: 200 }).then(r => setProducts(r.data.data));
  }, []);

  const fetchInventory = useCallback(debounce(async () => {
    setLoading(true);
    try {
      const res = await inventoryService.getAll({ locationId: locationFilter, search, lowStock: lowStockOnly });
      setInventory(res.data.data);
    } catch (err) { toast.error(getError(err)); }
    finally { setLoading(false); }
  }, 300), [locationFilter, search, lowStockOnly]);

  useEffect(() => { if (tab === 'stock') fetchInventory(); }, [tab, locationFilter, search, lowStockOnly]);

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await inventoryService.getMovements({ locationId: locationFilter, page: movPage, limit: 30 });
      setMovements(res.data.data);
      setMovTotal(res.data.total);
    } catch (err) { toast.error(getError(err)); }
    finally { setLoading(false); }
  }, [locationFilter, movPage]);

  useEffect(() => { if (tab === 'movements') fetchMovements(); }, [tab, locationFilter, movPage]);

  const handleAdjustment = async () => {
    if (!adjForm.productId || !adjForm.locationId || adjForm.quantity === 0) {
      return toast.error('Fill all required fields');
    }
    try {
      await inventoryService.adjustment(adjForm);
      toast.success('Stock adjusted successfully');
      setShowAdjModal(false);
      fetchInventory();
    } catch (err) { toast.error(getError(err)); }
  };

  const userLocations = isAdmin() ? locations : locations.filter(l =>
    user?.locationIds?.some(ul => (ul._id || ul) === l._id)
  );

  const stockStatusLabel = (qty, minStock) => {
    if (qty === 0) return <span className="badge badge-danger">Out of Stock</span>;
    if (qty <= minStock) return <span className="badge badge-warning">Low Stock</span>;
    return <span className="badge badge-success">In Stock</span>;
  };

  return (
    <div>
      <div className="page-header">
        <h1>Inventory</h1>
        <div className="page-header-right">
          {isAdmin() && (
            <button className="btn btn-warning btn-sm" onClick={() => setShowAdjModal(true)}>
              <SlidersHorizontal size={14} /> Adjust Stock
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-nav mb-3">
        {['stock', 'movements'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`tab-btn ${tab === t ? 'active' : ''}`}
            style={{ textTransform: 'capitalize' }}
          >
            {t === 'stock' ? (
              <>
                <Warehouse size={15} /> Stock
              </>
            ) : (
              <>
                <ArrowLeftRight size={15} /> Movements
              </>
            )}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="filter-bar">
          <div className="search-box">
            <span className="search-icon"><Search size={14} /></span>
            <input className="form-control" placeholder="Search product..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="form-select" style={{ maxWidth: 180 }} value={locationFilter} onChange={e => setLocationFilter(e.target.value)}>
            <option value="">All Locations</option>
            {userLocations.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
          </select>
          {tab === 'stock' && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <input type="checkbox" checked={lowStockOnly} onChange={e => setLowStockOnly(e.target.checked)} />
              Low Stock Only
            </label>
          )}
        </div>

        {loading ? <Loading /> : tab === 'stock' ? (
          inventory.length === 0 ? (
            <EmptyState icon={<Warehouse size={26} />} title="No inventory records" description="Add products and receive purchases to see stock" />
          ) : (
            <TableWrapper minWidth="800px">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Location</th>
                  <th className="th-right">Quantity</th>
                  <th className="th-right">Avg Cost</th>
                  <th className="th-right">Stock Value</th>
                  <th className="th-right">Min Stock</th>
                  <th className="th-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map(inv => (
                  <tr key={inv._id}>
                    <td style={{ fontWeight: 600, minWidth: 150 }}>{inv.productId?.name}</td>
                    <td><code className="sku-code">{inv.productId?.sku}</code></td>
                    <td><span className="badge badge-info" style={{ whiteSpace: 'nowrap' }}>{inv.locationId?.name}</span></td>
                    <td className="td-right" style={{ fontWeight: 700 }}>{fmtNum(inv.quantity)} <span className="text-muted fs-12">{inv.productId?.unit}</span></td>
                    <td className="td-right" style={{ color: 'var(--text-muted)' }}>{fmt(inv.averageCost)}</td>
                    <td className="td-right" style={{ color: 'var(--text)', fontWeight: 600 }}>{fmt(inv.stockValue)}</td>
                    <td className="td-right" style={{ color: 'var(--text-muted)' }}>{inv.productId?.minimumStock || 0}</td>
                    <td className="td-center">{stockStatusLabel(inv.quantity, inv.productId?.minimumStock || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </TableWrapper>
          )
        ) : (
          movements.length === 0 ? (
            <EmptyState icon={<ArrowLeftRight size={26} />} title="No movements" description="Stock movements will appear after transactions" />
          ) : (
            <>
              <TableWrapper minWidth="700px">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Location</th>
                    <th>Type</th>
                    <th className="th-right">Quantity</th>
                    <th className="th-right">Before</th>
                    <th className="th-right">After</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 500, minWidth: 140 }}>{m.productId?.name}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{m.locationId?.name}</td>
                      <td><span className="badge badge-info">{movTypeLabel(m.type)}</span></td>
                      <td className="td-right" style={{ color: m.quantity > 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                        {m.quantity > 0 ? '+' : ''}{m.quantity}
                      </td>
                      <td className="td-right">{m.balanceBefore}</td>
                      <td className="td-right" style={{ fontWeight: 600 }}>{m.balanceAfter}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(m.createdAt, true)}</td>
                    </tr>
                  ))}
                </tbody>
              </TableWrapper>
              <Pagination page={movPage} total={movTotal} limit={30} onPageChange={setMovPage} />
            </>
          )
        )}
      </div>

      {/* Adjustment Modal */}
      {showAdjModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAdjModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>Stock Adjustment</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowAdjModal(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label required">Product</label>
                <select className="form-select" value={adjForm.productId} onChange={e => setAdjForm(p => ({ ...p, productId: e.target.value }))}>
                  <option value="">Select product</option>
                  {products.map(pr => (
                    <option key={pr._id} value={pr._id}>{pr.name} ({pr.sku})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label required">Location</label>
                <select className="form-select" value={adjForm.locationId} onChange={e => setAdjForm(p => ({ ...p, locationId: e.target.value }))}>
                  <option value="">Select location</option>
                  {userLocations.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label required">Quantity (+ to add, - to deduct)</label>
                <input type="number" className="form-control" value={adjForm.quantity} onChange={e => setAdjForm(p => ({ ...p, quantity: +e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-control" value={adjForm.notes} onChange={e => setAdjForm(p => ({ ...p, notes: e.target.value }))} rows={2} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAdjModal(false)}>Cancel</button>
              <button className="btn btn-warning" onClick={handleAdjustment}>Apply Adjustment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
