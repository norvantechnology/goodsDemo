import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ArrowLeftRight,
  ShoppingCart,
  CreditCard,
  FileText,
  Users,
  Building2,
  Calculator,
  BarChart3,
  ShieldCheck,
  LogOut,
  Menu,
  MapPin,
  Cpu,
  X
} from 'lucide-react';

const navItems = [
  { group: 'Main', items: [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  ]},
  { group: 'Inventory', items: [
    { path: '/products', icon: Package, label: 'Products' },
    { path: '/inventory', icon: Warehouse, label: 'Inventory' },
    { path: '/transfers', icon: ArrowLeftRight, label: 'Transfers' },
  ]},
  { group: 'Trade', items: [
    { path: '/purchases', icon: ShoppingCart, label: 'Purchases' },
    { path: '/pos', icon: CreditCard, label: 'POS / Sales' },
    { path: '/sales', icon: FileText, label: 'Sales History' },
  ]},
  { group: 'Parties', items: [
    { path: '/customers', icon: Users, label: 'Customers' },
    { path: '/suppliers', icon: Building2, label: 'Suppliers' },
  ]},
  { group: 'Finance', items: [
    { path: '/accounting', icon: Calculator, label: 'Accounting' },
    { path: '/reports', icon: BarChart3, label: 'Reports' },
  ]},
  { group: 'Admin', items: [
    { path: '/users', icon: ShieldCheck, label: 'Users', adminOnly: true },
  ]},
];

export default function AppLayout({ children, title }) {
  const { user, logout, isAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.classList.add('sidebar-open');
    } else {
      document.body.classList.remove('sidebar-open');
    }
    return () => document.body.classList.remove('sidebar-open');
  }, [sidebarOpen]);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="app-layout">
      {/* Sidebar overlay (mobile) */}
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header-row">
          <div className="sidebar-workspace-label">SHOP WORKSPACE</div>
          <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">
            <X size={18} />
          </button>
        </div>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Cpu size={16} />
          </div>
          <div className="sidebar-logo-text">
            GoodsDemo ERP
            <span>Wholesale Management</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(section => {
            const visibleItems = section.items.filter(item => !item.adminOnly || isAdmin());
            if (visibleItems.length === 0) return null;
            return (
              <div key={section.group} className="nav-section">
                <div className="nav-section-title">{section.group}</div>
                {visibleItems.map(item => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                      <span className="nav-icon"><Icon size={16} /></span>
                      {item.label}
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* User info at bottom */}
        <div style={{ padding: '14px', borderTop: '1px solid var(--sidebar-border)', marginTop: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0', marginBottom: 10 }}>
            <div className="user-avatar">
              {user?.name?.charAt(0)}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--sidebar-text)', textTransform: 'capitalize' }}>{user?.role?.replace('_', ' ')}</div>
            </div>
          </div>
          <button
            className="btn w-100"
            onClick={handleLogout}
            style={{
              fontSize: '0.78rem',
              background: 'rgba(255, 255, 255, 0.05)',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              color: '#cbd5e1'
            }}
          >
            <LogOut size={13} style={{ marginRight: 4 }} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle navigation">
              <Menu size={20} />
            </button>
            <span className="page-title">{title}</span>
          </div>
          <div className="topbar-right">
            {user?.locationIds?.length > 0 && (
              <span className="location-badge-top">
                <MapPin size={13} /> {user.locationIds.length > 1 ? 'All Locations' : user.locationIds[0]?.name || ''}
              </span>
            )}
            <div className="user-badge" title={`${user?.name} (${user?.role})`}>
              <div className="user-avatar">{user?.name?.charAt(0)}</div>
              <span className="user-badge-name">{user?.name}</span>
            </div>
          </div>
        </header>
        <div className="page-body">
          {children}
        </div>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="mobile-bottom-nav">
          <NavLink to="/dashboard" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
            <span className="bottom-nav-icon"><LayoutDashboard size={18} /></span>
            <span className="bottom-nav-label">Dashboard</span>
          </NavLink>
          <NavLink to="/pos" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
            <span className="bottom-nav-icon"><CreditCard size={18} /></span>
            <span className="bottom-nav-label">POS</span>
          </NavLink>
          <NavLink to="/transfers" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
            <span className="bottom-nav-icon"><ArrowLeftRight size={18} /></span>
            <span className="bottom-nav-label">Transfers</span>
          </NavLink>
          <NavLink to="/inventory" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
            <span className="bottom-nav-icon"><Warehouse size={18} /></span>
            <span className="bottom-nav-label">Stock</span>
          </NavLink>
          <button className="bottom-nav-item" onClick={() => setSidebarOpen(true)}>
            <span className="bottom-nav-icon"><Menu size={18} /></span>
            <span className="bottom-nav-label">More</span>
          </button>
        </nav>
      </main>
    </div>
  );
}
