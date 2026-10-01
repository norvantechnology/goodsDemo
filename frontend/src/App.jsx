import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './layouts/AppLayout';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ProductsPage from './pages/products/ProductsPage';
import ProductDetailPage from './pages/products/ProductDetailPage';
import InventoryPage from './pages/inventory/InventoryPage';
import TransfersPage from './pages/transfers/TransfersPage';
import PurchasesPage from './pages/purchases/PurchasesPage';
import POSPage from './pages/sales/POSPage';
import SalesPage from './pages/sales/SalesPage';
import CustomersPage from './pages/customers/CustomersPage';
import SuppliersPage from './pages/suppliers/SuppliersPage';
import AccountingPage from './pages/accounting/AccountingPage';
import ReportsPage from './pages/reports/ReportsPage';
import UsersPage from './pages/users/UsersPage';
import { Loading } from './components';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/products': 'Products',
  '/inventory': 'Inventory',
  '/transfers': 'Stock Transfers',
  '/purchases': 'Purchases',
  '/pos': 'POS / Sales',
  '/sales': 'Sales History',
  '/customers': 'Customers',
  '/suppliers': 'Suppliers',
  '/accounting': 'Accounting',
  '/reports': 'Reports',
  '/users': 'Users & Permissions'
};

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <Loading text="Authenticating..." />;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin()) return <Navigate to="/dashboard" replace />;
  return children;
}

const withLayout = (Component, title, adminOnly = false) => (
  <ProtectedRoute adminOnly={adminOnly}>
    <AppLayout title={title}>
      <Component />
    </AppLayout>
  </ProtectedRoute>
);

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <Loading text="Loading..." />;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={withLayout(DashboardPage, 'Dashboard')} />
      <Route path="/products" element={withLayout(ProductsPage, 'Products')} />
      <Route path="/products/:id" element={withLayout(ProductDetailPage, 'Product Details')} />
      <Route path="/inventory" element={withLayout(InventoryPage, 'Inventory')} />
      <Route path="/transfers" element={withLayout(TransfersPage, 'Stock Transfers')} />
      <Route path="/purchases" element={withLayout(PurchasesPage, 'Purchases')} />
      <Route path="/pos" element={withLayout(POSPage, 'POS / Sales')} />
      <Route path="/sales" element={withLayout(SalesPage, 'Sales History')} />
      <Route path="/customers" element={withLayout(CustomersPage, 'Customers')} />
      <Route path="/suppliers" element={withLayout(SuppliersPage, 'Suppliers')} />
      <Route path="/accounting" element={withLayout(AccountingPage, 'Accounting')} />
      <Route path="/reports" element={withLayout(ReportsPage, 'Reports')} />
      <Route path="/users" element={withLayout(UsersPage, 'Users & Permissions', true)} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: { background: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(15,23,42,0.08)', fontSize: '0.85rem' },
            success: { iconTheme: { primary: '#059669', secondary: '#ffffff' } },
            error: { iconTheme: { primary: '#dc2626', secondary: '#ffffff' }, duration: 5000 }
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
