import { useState, useEffect } from 'react';
import { accountingService, settingsService } from '../../services';
import { Loading, EmptyState, TableWrapper, Pagination } from '../../components';
import { fmt, fmtDate, getError, expenseCatLabel, paymentLabel } from '../../utils';
import toast from 'react-hot-toast';
import {
  TrendingUp,
  Building2,
  Coins,
  CreditCard,
  Plus,
  Package,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  ReceiptText,
  X
} from 'lucide-react';

export default function AccountingPage() {
  const [tab, setTab] = useState('pl');
  const [plData, setPlData] = useState(null);
  const [bsData, setBsData] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expForm, setExpForm] = useState({ date: new Date().toISOString().split('T')[0], category: 'rent', description: '', amount: 0, paymentMethod: 'cash', locationId: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [expPage, setExpPage] = useState(1);
  const [expTotal, setExpTotal] = useState(0);
  const [payPage, setPayPage] = useState(1);
  const [payTotal, setPayTotal] = useState(0);

  useEffect(() => { settingsService.getLocations().then(r => setLocations(r.data.data)); }, []);

  const fetchPL = async () => {
    setLoading(true);
    try {
      const res = await accountingService.getProfitLoss({ from: fromDate, to: toDate });
      setPlData(res.data.data);
    } catch (err) { toast.error(getError(err)); }
    finally { setLoading(false); }
  };

  const fetchBS = async () => {
    setLoading(true);
    try {
      const res = await accountingService.getBalanceSheet();
      setBsData(res.data.data);
    } catch (err) { toast.error(getError(err)); }
    finally { setLoading(false); }
  };

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await accountingService.getExpenses({ from: fromDate, to: toDate, page: expPage, limit: 20 });
      setExpenses(res.data.data);
      setExpTotal(res.data.total);
    } catch (err) { toast.error(getError(err)); }
    finally { setLoading(false); }
  };

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await accountingService.getPayments({ page: payPage, limit: 20 });
      setPayments(res.data.data);
      setPayTotal(res.data.total);
    } catch (err) { toast.error(getError(err)); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (tab === 'pl') fetchPL();
    else if (tab === 'bs') fetchBS();
    else if (tab === 'expenses') fetchExpenses();
    else if (tab === 'payments') fetchPayments();
  }, [tab, fromDate, toDate, expPage, payPage]);

  const handleCreateExpense = async () => {
    if (!expForm.description || !expForm.amount || expForm.amount <= 0) return toast.error('Fill required fields');
    setSaving(true);
    try {
      await accountingService.createExpense(expForm);
      toast.success('Expense recorded');
      setShowExpenseModal(false);
      if (tab === 'expenses') fetchExpenses();
    } catch (err) { toast.error(getError(err)); }
    finally { setSaving(false); }
  };

  const tabs = [
    { id: 'pl', label: 'P&L Statement', icon: TrendingUp },
    { id: 'bs', label: 'Balance Sheet', icon: Building2 },
    { id: 'expenses', label: 'Expenses', icon: Coins },
    { id: 'payments', label: 'Payments', icon: CreditCard }
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Accounting</h1>
        <div className="page-header-right">
          {tab === 'expenses' && (
            <button className="btn btn-primary" onClick={() => setShowExpenseModal(true)}>
              <Plus size={14} /> Add Expense
            </button>
          )}
        </div>
      </div>

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

      {/* Date Filter */}
      {(tab === 'pl' || tab === 'expenses') && (
        <div className="filter-bar" style={{ marginBottom: 14 }}>
          <input type="date" className="form-control" style={{ maxWidth: 160 }} value={fromDate} onChange={e => setFromDate(e.target.value)} />
          <input type="date" className="form-control" style={{ maxWidth: 160 }} value={toDate} onChange={e => setToDate(e.target.value)} />
          <button className="btn btn-secondary btn-sm" onClick={() => { setFromDate(''); setToDate(''); }}>All Time</button>
        </div>
      )}

      {loading ? <Loading /> : (
        <>
          {/* Profit & Loss */}
          {tab === 'pl' && plData && (
            <div>
              <div className="stats-grid" style={{ marginBottom: 14 }}>
                {[
                  { label: 'Total Revenue', value: fmt(plData.revenue), icon: Coins },
                  { label: 'Cost of Goods', value: fmt(plData.cogs), icon: Package },
                  { label: 'Gross Profit', value: fmt(plData.grossProfit), icon: TrendingUp },
                  { label: 'Total Expenses', value: fmt(plData.expenses), icon: ArrowUpRight },
                  { label: 'Net Profit', value: fmt(plData.netProfit), icon: plData.netProfit >= 0 ? CheckCircle2 : XCircle },
                  { label: 'Sales Count', value: plData.salesCount, icon: ReceiptText },
                ].map(s => {
                  const CardIcon = s.icon;
                  return (
                    <div key={s.label} className="stat-card">
                      <div className="stat-card-top">
                        <span className="stat-label">{s.label}</span>
                        <div className="stat-icon stat-icon-green">
                          <CardIcon size={16} />
                        </div>
                      </div>
                      <div className="stat-value" style={{ fontSize: '1.2rem' }}>{s.value}</div>
                    </div>
                  );
                })}
              </div>

              {plData.expenseByCategory?.length > 0 && (
                <div className="card">
                  <div className="card-header"><h3 className="card-title">Expenses by Category</h3></div>
                  <TableWrapper minWidth="340px">
                    <thead><tr><th>Category</th><th className="th-right">Amount</th></tr></thead>
                    <tbody>
                      {plData.expenseByCategory.map(e => (
                        <tr key={e._id}>
                          <td>{expenseCatLabel(e._id)}</td>
                          <td className="td-right" style={{ fontWeight: 600 }}>{fmt(e.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </TableWrapper>
                </div>
              )}
            </div>
          )}

          {/* Balance Sheet */}
          {tab === 'bs' && bsData && (
            <div className="grid-2">
              <div className="card">
                <div className="card-header"><h3 className="card-title">Assets</h3></div>
                {[['Inventory Value', bsData.assets.inventory], ['Customer Receivables', bsData.assets.receivables], ['Cash & Bank', bsData.assets.cash]].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-light)', fontSize: '0.85rem' }}>
                    <span>{l}</span><span style={{ fontWeight: 600, color: 'var(--success)' }}>{fmt(v)}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: '0.9rem', fontWeight: 700 }}>
                  <span>Total Assets</span><span style={{ color: 'var(--success)' }}>{fmt(bsData.assets.total)}</span>
                </div>
              </div>
              <div>
                <div className="card mb-3">
                  <div className="card-header"><h3 className="card-title">Liabilities</h3></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-light)', fontSize: '0.85rem' }}>
                    <span>Supplier Payables</span><span style={{ fontWeight: 600, color: 'var(--danger)' }}>{fmt(bsData.liabilities.payables)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: '0.9rem', fontWeight: 700 }}>
                    <span>Total Liabilities</span><span style={{ color: 'var(--danger)' }}>{fmt(bsData.liabilities.total)}</span>
                  </div>
                </div>
                <div className="card">
                  <div className="card-header"><h3 className="card-title">Equity</h3></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: '1rem', fontWeight: 700 }}>
                    <span>Net Equity</span><span style={{ color: bsData.equity >= 0 ? 'var(--success)' : 'var(--danger)' }}>{fmt(bsData.equity)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Expenses */}
          {tab === 'expenses' && (
            <div className="card">
              {expenses.length === 0 ? (
                <EmptyState
                  icon={<Coins size={26} />}
                  title="No expenses"
                  description="Record your first expense"
                  action={<button className="btn btn-primary btn-sm" onClick={() => setShowExpenseModal(true)}><Plus size={13} /> Add Expense</button>}
                />
              ) : (
                <>
                  <TableWrapper minWidth="650px">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Category</th>
                        <th>Description</th>
                        <th className="th-right">Amount</th>
                        <th className="th-center">Payment</th>
                        <th>Location</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map(e => (
                        <tr key={e._id}>
                          <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(e.date)}</td>
                          <td><span className="badge badge-gray">{expenseCatLabel(e.category)}</span></td>
                          <td>{e.description}</td>
                          <td className="td-right" style={{ fontWeight: 600, color: 'var(--danger)' }}>{fmt(e.amount)}</td>
                          <td className="td-center">{paymentLabel(e.paymentMethod)}</td>
                          <td style={{ whiteSpace: 'nowrap' }}>{e.locationId?.name || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </TableWrapper>
                </>
              )}
            </div>
          )}

          {/* Payments */}
          {tab === 'payments' && (
            <div className="card">
              {payments.length === 0 ? (
                <EmptyState icon={<CreditCard size={26} />} title="No payments" description="Payments will appear after transactions" />
              ) : (
                <TableWrapper minWidth="650px">
                  <thead>
                    <tr>
                      <th>Number</th>
                      <th className="th-center">Type</th>
                      <th>Party</th>
                      <th className="th-right">Amount</th>
                      <th className="th-center">Method</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(p => (
                      <tr key={p._id}>
                        <td style={{ fontWeight: 600, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{p.paymentNumber}</td>
                        <td className="td-center">
                          <span className={`badge ${p.type === 'receipt' ? 'badge-success' : 'badge-danger'}`}>
                            {p.type === 'receipt' ? 'Receipt' : 'Payment'}
                          </span>
                        </td>
                        <td><span className="badge badge-gray">{p.partyType}</span></td>
                        <td className="td-right" style={{ fontWeight: 600, color: p.type === 'receipt' ? 'var(--success)' : 'var(--danger)' }}>{fmt(p.amount)}</td>
                        <td className="td-center">{paymentLabel(p.paymentMethod)}</td>
                        <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>{fmtDate(p.paymentDate, true)}</td>
                      </tr>
                    ))}
                  </tbody>
                </TableWrapper>
              )}
            </div>
          )}
        </>
      )}

      {/* Expense Modal */}
      {showExpenseModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowExpenseModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>Record Expense</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowExpenseModal(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label required">Category</label>
                  <select className="form-select" value={expForm.category} onChange={e => setExpForm(p => ({ ...p, category: e.target.value }))}>
                    {['rent', 'utilities', 'salaries', 'logistics', 'maintenance', 'other'].map(c => (
                      <option key={c} value={c}>{expenseCatLabel(c)}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label required">Amount (₹)</label>
                  <input type="number" className="form-control" value={expForm.amount} onChange={e => setExpForm(p => ({ ...p, amount: +e.target.value }))} min="1" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label required">Description</label>
                <input className="form-control" value={expForm.description} onChange={e => setExpForm(p => ({ ...p, description: e.target.value }))} placeholder="Expense details..." />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Payment Method</label>
                  <select className="form-select" value={expForm.paymentMethod} onChange={e => setExpForm(p => ({ ...p, paymentMethod: e.target.value }))}>
                    {['cash', 'bank', 'card', 'other'].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <select className="form-select" value={expForm.locationId} onChange={e => setExpForm(p => ({ ...p, locationId: e.target.value }))}>
                    <option value="">General / Head Office</option>
                    {locations.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input type="date" className="form-control" value={expForm.date} onChange={e => setExpForm(p => ({ ...p, date: e.target.value }))} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowExpenseModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreateExpense} disabled={saving}>{saving ? 'Saving...' : 'Record Expense'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
