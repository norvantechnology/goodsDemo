import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { productService, settingsService } from '../../services';
import { Loading, EmptyState, Modal, TableWrapper, Pagination, StatusBadge } from '../../components';
import { fmt, fmtNum, getError, debounce } from '../../utils';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Plus, Search, Package, ScanBarcode, Eye, Edit2, Trash2 } from 'lucide-react';

const INITIAL_FORM = { name: '', sku: '', barcode: '', categoryId: '', brand: '', purchasePrice: '', sellingPrice: '', taxRate: 0, minimumStock: 0, unit: 'pcs', status: 'active' };

export default function ProductsPage() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const LIMIT = 20;

  const fetchProducts = useCallback(debounce(async (s, c, p) => {
    setLoading(true);
    try {
      const res = await productService.getAll({ search: s, category: c, page: p, limit: LIMIT });
      setProducts(res.data.data);
      setTotal(res.data.total);
    } catch (err) { toast.error(getError(err)); }
    finally { setLoading(false); }
  }, 300), []);

  useEffect(() => { fetchProducts(search, catFilter, page); }, [search, catFilter, page]);
  useEffect(() => { settingsService.getCategories().then(r => setCategories(r.data.data)); }, []);

  const openCreate = () => { setEditProduct(null); setForm(INITIAL_FORM); setShowModal(true); };
  const openEdit = (p) => { setEditProduct(p); setForm({ ...p, categoryId: p.categoryId?._id || '' }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name || !form.sku || !form.purchasePrice || !form.sellingPrice) {
      return toast.error('Please fill required fields');
    }
    setSaving(true);
    try {
      if (editProduct) {
        await productService.update(editProduct._id, form);
        toast.success('Product updated');
      } else {
        await productService.create(form);
        toast.success('Product created');
      }
      setShowModal(false);
      fetchProducts(search, catFilter, page);
    } catch (err) { toast.error(getError(err)); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this product?')) return;
    try {
      await productService.delete(id);
      toast.success('Product deactivated');
      fetchProducts(search, catFilter, page);
    } catch (err) { toast.error(getError(err)); }
  };

  const setF = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Products</h1>
          <span className="badge badge-info">{fmtNum(total)} items</span>
        </div>
        <div className="page-header-right">
          {isAdmin() && (
            <button className="btn btn-primary" onClick={openCreate}>
              <Plus size={14} /> Add Product
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="filter-bar">
          <div className="search-box">
            <span className="search-icon"><Search size={14} /></span>
            <input className="form-control" placeholder="Search by name, SKU, barcode..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="form-select" style={{ maxWidth: 180 }} value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1); }}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>

        {loading ? <Loading /> : products.length === 0 ? (
          <EmptyState
            icon={<Package size={26} />}
            title="No products found"
            description="Add your first product to get started"
            action={isAdmin() && <button className="btn btn-primary btn-sm" onClick={openCreate}><Plus size={13} /> Add Product</button>}
          />
        ) : (
          <>
            <TableWrapper minWidth="760px">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th className="th-right">Purchase Price</th>
                  <th className="th-right">Selling Price</th>
                  <th className="th-center">Stock</th>
                  <th className="th-center">Status</th>
                  <th className="th-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p._id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{p.name}</div>
                      {p.barcode && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                          <ScanBarcode size={12} /> {p.barcode}
                        </div>
                      )}
                      {p.brand && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{p.brand}</div>}
                    </td>
                    <td><code className="sku-code">{p.sku}</code></td>
                    <td style={{ whiteSpace: 'nowrap' }}>{p.categoryId?.name || '-'}</td>
                    <td className="td-right" style={{ color: 'var(--text-muted)' }}>{fmt(p.purchasePrice)}</td>
                    <td className="td-right" style={{ color: 'var(--text)', fontWeight: 600 }}>{fmt(p.sellingPrice)}</td>
                    <td className="td-center"><span className={`badge ${p.totalStock > 0 ? 'badge-success' : 'badge-danger'}`}>{fmtNum(p.totalStock)} {p.unit}</span></td>
                    <td className="td-center"><StatusBadge status={p.status} /></td>
                    <td className="td-center">
                      <div className="table-actions">
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => navigate(`/products/${p._id}`)} title="View Details">
                          <Eye size={14} />
                        </button>
                        {isAdmin() && (
                          <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(p)} title="Edit">
                            <Edit2 size={14} />
                          </button>
                        )}
                        {isAdmin() && p.status === 'active' && (
                          <button className="btn btn-ghost btn-sm btn-icon text-danger" onClick={() => handleDelete(p._id)} title="Deactivate">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableWrapper>
            <Pagination page={page} total={total} limit={LIMIT} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* Product Form Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editProduct ? 'Edit Product' : 'Add Product'} size="modal-lg">
        <div className="modal-body">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label required">Product Name</label>
              <input className="form-control" value={form.name} onChange={e => setF('name', e.target.value)} placeholder="Product name" />
            </div>
            <div className="form-group">
              <label className="form-label required">SKU / Item Code</label>
              <input className="form-control" value={form.sku} onChange={e => setF('sku', e.target.value.toUpperCase())} placeholder="SKU-001" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Barcode</label>
              <input className="form-control" value={form.barcode} onChange={e => setF('barcode', e.target.value)} placeholder="Barcode" />
            </div>
            <div className="form-group">
              <label className="form-label">Brand</label>
              <input className="form-control" value={form.brand} onChange={e => setF('brand', e.target.value)} placeholder="Brand name" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={form.categoryId} onChange={e => setF('categoryId', e.target.value)}>
                <option value="">Select category</option>
                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Unit</label>
              <select className="form-select" value={form.unit} onChange={e => setF('unit', e.target.value)}>
                {['pcs', 'box', 'set', 'pair', 'kg', 'ltr'].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label required">Purchase Price (₹)</label>
              <input type="number" className="form-control" value={form.purchasePrice} onChange={e => setF('purchasePrice', +e.target.value)} min="0" />
            </div>
            <div className="form-group">
              <label className="form-label required">Selling Price (₹)</label>
              <input type="number" className="form-control" value={form.sellingPrice} onChange={e => setF('sellingPrice', +e.target.value)} min="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Tax Rate (%)</label>
              <input type="number" className="form-control" value={form.taxRate} onChange={e => setF('taxRate', +e.target.value)} min="0" max="100" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Minimum Stock</label>
              <input type="number" className="form-control" value={form.minimumStock} onChange={e => setF('minimumStock', +e.target.value)} min="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={e => setF('status', e.target.value)}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Product'}</button>
        </div>
      </Modal>
    </div>
  );
}
