import { useState, useEffect } from 'react';
import { reportService, settingsService } from '../../services';
import { Loading, EmptyState, TableWrapper } from '../../components';
import { fmt, fmtNum, fmtDate, getError, movTypeLabel } from '../../utils';
import toast from 'react-hot-toast';
import {
  Warehouse,
  ArrowLeftRight,
  CreditCard,
  ShoppingCart,
  Coins,
  BarChart3,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

export default function ReportsPage() {
  const [tab, setTab] = useState('stock');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState([]);
  const [locationFilter, setLocationFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => { settingsService.getLocations().then(r => setLocations(r.data.data)); }, []);

  const fetchData = async () => {
    setLoading(true);
    setData([]);
    setTotalAmount(0);
    const params = { locationId: locationFilter, from: fromDate, to: toDate };
    try {
      let res;
      if (tab === 'stock') res = await reportService.stock(params);
      else if (tab === 'movements') res = await reportService.stockMovement(params);
      else if (tab === 'sales') { res = await reportService.sales(params); setTotalAmount(res.data.totalAmount); }
      else if (tab === 'purchases') { res = await reportService.purchases(params); setTotalAmount(res.data.totalAmount); }
      else if (tab === 'outstanding') res = await reportService.outstanding();
      else if (tab === 'transfers') res = await reportService.transfers(params);
      else if (tab === 'salesByProduct') res = await reportService.salesByProduct(params);
      else if (tab === 'lowStock') res = await reportService.lowStock();
      setData(tab === 'outstanding' ? res.data.data : (Array.isArray(res.data.data) ? res.data.data : []));
    } catch (err) { toast.error(getError(err)); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [tab, locationFilter, fromDate, toDate]);

  const tabs = [
    { id: 'stock', label: 'Stock Report', icon: Warehouse },
    { id: 'movements', label: 'Movements', icon: ArrowLeftRight },
    { id: 'sales', label: 'Sales Report', icon: CreditCard },
    { id: 'purchases', label: 'Purchases', icon: ShoppingCart },
    { id: 'outstanding', label: 'Outstanding Balances', icon: Coins },
    { id: 'transfers', label: 'Stock Transfers', icon: ArrowLeftRight },
    { id: 'salesByProduct', label: 'Sales by Product', icon: BarChart3 },
    { id: 'lowStock', label: 'Low Stock Report', icon: AlertTriangle },
  ];

  const renderTable = () => {
    if (loading) return <Loading />;
    if (!data || (Array.isArray(data) && data.length === 0)) {
      return <EmptyState icon={<BarChart3 size={26} />} title="No data found" description="Adjust filters to view report records" />;
    }

    switch (tab) {
      case 'stock':
        return (
          <TableWrapper minWidth="820px">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Location</th>
                <th className="th-right">Qty</th>
                <th className="th-right">Avg Cost</th>
                <th className="th-right">Stock Value</th>
                <th className="th-right">Min Stock</th>
              </tr>
            </thead>
            <tbody>
              {data.map(inv => (
                <tr key={inv._id}>
                  <td style={{ fontWeight: 600 }}>{inv.productId?.name}</td>
                  <td><code className="sku-code">{inv.productId?.sku}</code></td>
                  <td><span className="badge badge-info">{inv.locationId?.name}</span></td>
                  <td className="td-right" style={{ fontWeight: 600 }}>{fmtNum(inv.quantity)} <span className="text-muted fs-12">{inv.productId?.unit}</span></td>
                  <td className="td-right" style={{ color: 'var(--text-muted)' }}>{fmt(inv.averageCost)}</td>
                  <td className="td-right" style={{ color: 'var(--text)', fontWeight: 600 }}>{fmt(inv.stockValue)}</td>
                  <td className="td-right" style={{ color: 'var(--text-muted)' }}>{inv.productId?.minimumStock || 0}</td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>
        );
      case 'movements':
        return (
          <TableWrapper minWidth="760px">
            <thead>
              <tr>
                <th>Product</th>
                <th>Location</th>
                <th className="th-center">Type</th>
                <th className="th-right">Qty</th>
                <th className="th-right">Before</th>
                <th className="th-right">After</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {data.map((m, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{m.productId?.name}</td>
                  <td>{m.locationId?.name}</td>
                  <td className="td-center"><span className="badge badge-info">{movTypeLabel(m.type)}</span></td>
                  <td className="td-right" style={{ color: m.quantity > 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                    {m.quantity > 0 ? '+' : ''}{m.quantity}
                  </td>
                  <td className="td-right">{m.balanceBefore}</td>
                  <td className="td-right" style={{ fontWeight: 600 }}>{m.balanceAfter}</td>
                  <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>{fmtDate(m.createdAt, true)}</td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>
        );
      case 'sales':
        return (
          <>
            {totalAmount > 0 && (
              <div className="stat-card mb-3" style={{ display: 'inline-flex', gap: 12, alignItems: 'center', padding: '10px 16px' }}>
                <span className="text-muted fs-13">Total Period Sales:</span>
                <span className="fw-700" style={{ fontSize: '1.15rem', color: 'var(--text)' }}>{fmt(totalAmount)}</span>
              </div>
            )}
            <TableWrapper minWidth="780px">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Shop</th>
                  <th>Customer</th>
                  <th className="th-center">Items</th>
                  <th className="th-right">Total</th>
                  <th className="th-center">Payment</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data.map(s => (
                  <tr key={s._id}>
                    <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{s.invoiceNumber}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{s.locationId?.name}</td>
                    <td>{s.customerId?.name || 'Walk-in'}</td>
                    <td className="td-center">{s.items?.length}</td>
                    <td className="td-right" style={{ fontWeight: 700, color: 'var(--text)' }}>{fmt(s.grandTotal)}</td>
                    <td className="td-center" style={{ textTransform: 'capitalize' }}><span className="badge badge-gray">{s.paymentMethod}</span></td>
                    <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>{fmtDate(s.saleDate, true)}</td>
                  </tr>
                ))}
              </tbody>
            </TableWrapper>
          </>
        );
      case 'purchases':
        return (
          <>
            {totalAmount > 0 && (
              <div className="stat-card mb-3" style={{ display: 'inline-flex', gap: 12, alignItems: 'center', padding: '10px 16px' }}>
                <span className="text-muted fs-13">Total Period Purchases:</span>
                <span className="fw-700" style={{ fontSize: '1.15rem', color: 'var(--text)' }}>{fmt(totalAmount)}</span>
              </div>
            )}
            <TableWrapper minWidth="760px">
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Supplier</th>
                  <th>Location</th>
                  <th className="th-right">Total</th>
                  <th className="th-center">Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data.map(p => (
                  <tr key={p._id}>
                    <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{p.purchaseNumber}</td>
                    <td>{p.supplierId?.name}</td>
                    <td>{p.locationId?.name}</td>
                    <td className="td-right" style={{ fontWeight: 600, color: 'var(--text)' }}>{fmt(p.grandTotal)}</td>
                    <td className="td-center"><span className="badge badge-info">{p.status}</span></td>
                    <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>{fmtDate(p.purchaseDate)}</td>
                  </tr>
                ))}
              </tbody>
            </TableWrapper>
          </>
        );
      case 'outstanding':
        return (
          <div className="grid-2">
            <div>
              <div className="card-header mb-2"><h3 className="card-title">Customer Receivables</h3></div>
              {data.customers?.length === 0 ? (
                <EmptyState icon={<CheckCircle2 size={24} color="var(--success)" />} title="All balances cleared" />
              ) : (
                <TableWrapper minWidth="380px">
                  <thead><tr><th>Customer</th><th>Phone</th><th className="th-right">Outstanding</th></tr></thead>
                  <tbody>
                    {data.customers?.map(c => (
                      <tr key={c._id}>
                        <td style={{ fontWeight: 600 }}>{c.name}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{c.phone || '-'}</td>
                        <td className="td-right" style={{ fontWeight: 700, color: 'var(--warning)' }}>{fmt(c.currentBalance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </TableWrapper>
              )}
            </div>
            <div>
              <div className="card-header mb-2"><h3 className="card-title">Supplier Payables</h3></div>
              {data.suppliers?.length === 0 ? (
                <EmptyState icon={<CheckCircle2 size={24} color="var(--success)" />} title="All accounts settled" />
              ) : (
                <TableWrapper minWidth="380px">
                  <thead><tr><th>Supplier</th><th>Phone</th><th className="th-right">Payable</th></tr></thead>
                  <tbody>
                    {data.suppliers?.map(s => (
                      <tr key={s._id}>
                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{s.phone || '-'}</td>
                        <td className="td-right" style={{ fontWeight: 700, color: 'var(--danger)' }}>{fmt(s.currentBalance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </TableWrapper>
              )}
            </div>
          </div>
        );
      case 'transfers':
        return (
          <TableWrapper minWidth="650px">
            <thead>
              <tr>
                <th>Transfer #</th>
                <th>From</th>
                <th>To</th>
                <th className="th-center">Items</th>
                <th className="th-center">Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {data.map(t => (
                <tr key={t._id}>
                  <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{t.transferNumber}</td>
                  <td><span className="badge badge-gray">{t.sourceLocationId?.name}</span></td>
                  <td><span className="badge badge-gray">{t.destinationLocationId?.name}</span></td>
                  <td className="td-center">{t.items?.length}</td>
                  <td className="td-center"><span className={`badge badge-${t.status === 'completed' ? 'success' : 'warning'}`}>{t.status}</span></td>
                  <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>{fmtDate(t.transferDate)}</td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>
        );
      case 'salesByProduct':
        return (
          <TableWrapper minWidth="650px">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th className="th-right">Total Qty Sold</th>
                <th className="th-right">Total Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.map(p => (
                <tr key={p._id}>
                  <td style={{ fontWeight: 600 }}>{p.productName}</td>
                  <td><code className="sku-code">{p.sku}</code></td>
                  <td className="td-right" style={{ fontWeight: 600 }}>{fmtNum(p.totalQty)}</td>
                  <td className="td-right" style={{ fontWeight: 700, color: 'var(--text)' }}>{fmt(p.totalRevenue)}</td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>
        );
      case 'lowStock':
        return (
          <TableWrapper minWidth="650px">
            <thead>
              <tr>
                <th>Product</th>
                <th>Location</th>
                <th className="th-right">Current Stock</th>
                <th className="th-right">Min Stock</th>
                <th className="th-center">Shortage</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{item.product?.name}</td>
                  <td><span className="badge badge-info">{item.location?.name}</span></td>
                  <td className="td-right" style={{ color: 'var(--warning)', fontWeight: 600 }}>{item.quantity} {item.product?.unit}</td>
                  <td className="td-right" style={{ color: 'var(--text-muted)' }}>{item.minimumStock}</td>
                  <td className="td-center"><span className="badge badge-danger">-{item.shortage}</span></td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="page-header"><h1>Reports</h1></div>

      {/* Tabs */}
      <div className="tabs-nav mb-3">
        {tabs.map(t => {
          const TabIcon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`tab-btn ${tab === t.id ? 'active' : ''}`}
            >
              <TabIcon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      {!['outstanding', 'lowStock'].includes(tab) && (
        <div className="filter-bar mb-3">
          {!['salesByProduct'].includes(tab) && (
            <select className="form-select" style={{ maxWidth: 180 }} value={locationFilter} onChange={e => setLocationFilter(e.target.value)}>
              <option value="">All Locations</option>
              {locations.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
            </select>
          )}
          <input type="date" className="form-control" style={{ maxWidth: 160 }} value={fromDate} onChange={e => setFromDate(e.target.value)} />
          <input type="date" className="form-control" style={{ maxWidth: 160 }} value={toDate} onChange={e => setToDate(e.target.value)} />
          <button className="btn btn-secondary btn-sm" onClick={() => { setFromDate(''); setToDate(''); setLocationFilter(''); }}>Clear</button>
        </div>
      )}

      <div className="card">
        {renderTable()}
      </div>
    </div>
  );
}
