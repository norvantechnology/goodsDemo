import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { fmt, fmtNum, getError } from '../../utils';
import { Loading, EmptyState } from '../../components';
import {
  CreditCard,
  ShoppingCart,
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  Coins,
  AlertTriangle,
  Warehouse,
  FileText,
  ArrowLeftRight,
  TrendingUp,
  CheckCircle2
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard')
      .then(res => setData(res.data.data))
      .catch(err => setError(getError(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading text="Loading dashboard..." />;
  if (error) return <div className="error-state"><p>{error}</p></div>;
  if (!data) return null;

  const opsCards = [
    { label: "Today's Sales", value: fmt(data.todaySales?.total), sub: `${data.todaySales?.count || 0} transactions`, icon: CreditCard, colorClass: 'stat-icon-green' },
    { label: "Today's Purchases", value: fmt(data.todayPurchases?.total), sub: `${data.todayPurchases?.count || 0} orders`, icon: ShoppingCart, colorClass: 'stat-icon-purple' },
    { label: 'Total Stock Value', value: fmt(data.totalStockValue), sub: `${fmtNum(data.totalStockQuantity)} units total`, icon: Package, colorClass: 'stat-icon-rose' },
  ];

  const finCards = [
    { label: 'Receivables', value: fmt(data.receivables), sub: 'Customer outstanding', icon: ArrowDownLeft, colorClass: 'stat-icon-amber' },
    { label: 'Payables', value: fmt(data.payables), sub: 'Supplier outstanding', icon: ArrowUpRight, colorClass: 'stat-icon-coral' },
    { label: 'Monthly Expenses', value: fmt(data.monthlyExpenses), sub: 'This month', icon: Coins, colorClass: 'stat-icon-neutral' },
  ];

  return (
    <div>
      {/* Section 1: Operations & Inventory */}
      <div className="section-block">
        <div className="section-heading">
          <div className="section-title">Operations & Inventory</div>
          <div className="section-subtitle">Today's transactions, procurement, and warehouse inventory</div>
        </div>
        <div className="stats-grid">
          {opsCards.map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="stat-card">
                <div className="stat-card-top">
                  <span className="stat-label">{s.label}</span>
                  <div className={`stat-icon ${s.colorClass}`}>
                    <Icon size={16} />
                  </div>
                </div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-sub">{s.sub}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Financial Overview */}
      <div className="section-block">
        <div className="section-heading">
          <div className="section-title">Financial Summary</div>
          <div className="section-subtitle">Collections, outstanding liabilities, and monthly overhead</div>
        </div>
        <div className="stats-grid">
          {finCards.map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="stat-card">
                <div className="stat-card-top">
                  <span className="stat-label">{s.label}</span>
                  <div className={`stat-icon ${s.colorClass}`}>
                    <Icon size={16} />
                  </div>
                </div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-sub">{s.sub}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Sales Trend Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <TrendingUp size={16} style={{ color: 'var(--primary)' }} /> Sales Trend (Last 7 Days)
            </h3>
          </div>
          {data.salesTrend?.length > 0 ? (
            <ResponsiveContainer width="100%" height={210}>
              <LineChart data={data.salesTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="_id" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(v) => fmt(v)}
                  contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, color: '#0f172a', boxShadow: '0 4px 12px rgba(15,23,42,0.08)' }}
                />
                <Line type="monotone" dataKey="total" stroke="#059669" strokeWidth={2.5} dot={{ fill: '#059669', r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon={<TrendingUp size={24} />} title="No sales data" description="Sales will appear here" />
          )}
        </div>

        {/* Low Stock Alert */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <AlertTriangle size={16} color="var(--warning)" /> Low Stock Alerts
            </h3>
            <Link to="/inventory?lowStock=true" className="btn btn-secondary btn-sm">View All</Link>
          </div>
          {data.lowStockItems?.length > 0 ? (
            <ul className="recent-list">
              {data.lowStockItems.slice(0, 6).map((item, i) => (
                <li key={i} className="recent-item">
                  <div className="recent-item-left">
                    <div className="recent-item-name">{item.productName}</div>
                    <div className="recent-item-sub">{item.locationName}</div>
                  </div>
                  <div className="recent-item-right">
                    <span className="badge badge-warning">{item.quantity} left</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={<CheckCircle2 size={24} color="var(--success)" />} title="Stock levels normal" description="No low stock items currently" />
          )}
        </div>

        {/* Location-wise Stock */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Warehouse size={16} /> Stock by Location
            </h3>
          </div>
          {data.locationStock?.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.locationStock} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="locationName" tick={{ fontSize: 10, fill: '#64748b' }} width={85} />
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <Tooltip
                  formatter={(v) => fmt(v)}
                  contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, color: '#0f172a', boxShadow: '0 4px 12px rgba(15,23,42,0.08)' }}
                />
                <Bar dataKey="totalValue" fill="#059669" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon={<Warehouse size={24} />} title="No stock data" />
          )}
        </div>

        {/* Recent Sales */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <FileText size={16} /> Recent Sales
            </h3>
            <Link to="/sales" className="btn btn-secondary btn-sm">View All</Link>
          </div>
          {data.recentSales?.length > 0 ? (
            <ul className="recent-list">
              {data.recentSales.map(s => (
                <li key={s._id} className="recent-item">
                  <div className="recent-item-left">
                    <div className="recent-item-name">{s.invoiceNumber}</div>
                    <div className="recent-item-sub">{s.customerId?.name || 'Walk-in'} · {s.locationId?.name}</div>
                  </div>
                  <div className="recent-item-right" style={{ color: 'var(--success)' }}>{fmt(s.grandTotal)}</div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={<FileText size={24} />} title="No recent sales" />
          )}
        </div>

        {/* Recent Purchases */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <ShoppingCart size={16} /> Recent Purchases
            </h3>
            <Link to="/purchases" className="btn btn-secondary btn-sm">View All</Link>
          </div>
          {data.recentPurchases?.length > 0 ? (
            <ul className="recent-list">
              {data.recentPurchases.map(p => (
                <li key={p._id} className="recent-item">
                  <div className="recent-item-left">
                    <div className="recent-item-name">{p.purchaseNumber}</div>
                    <div className="recent-item-sub">{p.supplierId?.name}</div>
                  </div>
                  <div className="recent-item-right">{fmt(p.grandTotal)}</div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={<ShoppingCart size={24} />} title="No recent purchases" />
          )}
        </div>

        {/* Recent Transfers */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <ArrowLeftRight size={16} /> Recent Transfers
            </h3>
            <Link to="/transfers" className="btn btn-secondary btn-sm">View All</Link>
          </div>
          {data.recentTransfers?.length > 0 ? (
            <ul className="recent-list">
              {data.recentTransfers.map(t => (
                <li key={t._id} className="recent-item">
                  <div className="recent-item-left">
                    <div className="recent-item-name">{t.transferNumber}</div>
                    <div className="recent-item-sub">{t.sourceLocationId?.name} → {t.destinationLocationId?.name}</div>
                  </div>
                  <div className="recent-item-right">
                    <span className={`badge badge-${t.status === 'completed' ? 'success' : t.status === 'pending' ? 'warning' : 'info'}`}>
                      {t.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={<ArrowLeftRight size={24} />} title="No recent transfers" />
          )}
        </div>
      </div>
    </div>
  );
}
