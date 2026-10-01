import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productService } from '../../services';
import { Loading, TableWrapper, StatusBadge } from '../../components';
import { fmt, fmtNum, fmtDate, getError, movTypeLabel, statusClass } from '../../utils';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productService.getById(id)
      .then(r => setData(r.data.data))
      .catch(err => { toast.error(getError(err)); navigate('/products'); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loading />;
  if (!data) return null;
  const { product, stockByLocation, movements, recentSales, recentPurchases } = data;
  const totalStock = stockByLocation.reduce((s, i) => s + i.quantity, 0);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/products')}>
            <ArrowLeft size={14} /> Back
          </button>
          <h1>{product.name}</h1>
          <StatusBadge status={product.status} />
        </div>
      </div>

      <div className="details-grid">
        <div>
          {/* Product Info */}
          <div className="card mb-3">
            <div className="card-header"><h3 className="card-title">Product Details</h3></div>
            <div className="form-row">
              {[['SKU', product.sku], ['Barcode', product.barcode || '-'], ['Brand', product.brand || '-'],
                ['Category', product.categoryId?.name || '-'], ['Unit', product.unit],
                ['Tax Rate', `${product.taxRate}%`], ['Min Stock', fmtNum(product.minimumStock)],
                ['Purchase Price', fmt(product.purchasePrice)], ['Selling Price', fmt(product.sellingPrice)]
              ].map(([l, v]) => (
                <div key={l} style={{ padding: '6px 0', borderBottom: '1px solid var(--border-light)' }}>
                  <div className="fs-12 text-muted">{l}</div>
                  <div className="fw-600 fs-13">{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Stock Movements */}
          <div className="card">
            <div className="card-header"><h3 className="card-title">Stock Movements</h3></div>
            <TableWrapper minWidth="500px">
              <thead>
                <tr>
                  <th className="th-center">Type</th>
                  <th>Location</th>
                  <th className="th-right">Qty</th>
                  <th className="th-right">Balance After</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {movements.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>No movements</td></tr>
                ) : movements.map((m, i) => (
                  <tr key={i}>
                    <td className="td-center"><span className={`badge ${m.quantity > 0 ? 'badge-success' : 'badge-danger'}`}>{movTypeLabel(m.type)}</span></td>
                    <td>{m.locationId?.name}</td>
                    <td className="td-right" style={{ color: m.quantity > 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>{m.quantity > 0 ? '+' : ''}{m.quantity}</td>
                    <td className="td-right" style={{ fontWeight: 600 }}>{fmtNum(m.balanceAfter)}</td>
                    <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>{fmtDate(m.createdAt, true)}</td>
                  </tr>
                ))}
              </tbody>
            </TableWrapper>
          </div>
        </div>

        <div>
          {/* Stock by Location */}
          <div className="card mb-3">
            <div className="card-header">
              <h3 className="card-title">Stock by Location</h3>
              <span className="badge badge-info">{fmtNum(totalStock)} total</span>
            </div>
            {stockByLocation.map(inv => {
              const pct = totalStock > 0 ? (inv.quantity / totalStock * 100) : 0;
              return (
                <div key={inv._id} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span className="fs-13">{inv.locationId?.name}</span>
                    <span className="fw-600 fs-13">{fmtNum(inv.quantity)} {product.unit}</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--bg)', borderRadius: 99 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: 'var(--primary)', borderRadius: 99, transition: 'width 0.3s ease' }} />
                  </div>
                  <div className="fs-12 text-muted">{fmt(inv.stockValue)} value · avg {fmt(inv.averageCost)}</div>
                </div>
              );
            })}
          </div>

          {/* Barcode display */}
          {product.barcode && (
            <div className="card mb-3">
              <div className="card-header"><h3 className="card-title">Barcode</h3></div>
              <div style={{ textAlign: 'center', padding: 10 }}>
                <code style={{ fontSize: '1.2rem', letterSpacing: 4, display: 'block', marginBottom: 4 }}>{product.barcode}</code>
                <div className="fs-12 text-muted">Barcode / EAN</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
