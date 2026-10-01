// Format currency
export const fmt = (value, currency = '₹') => {
  if (value == null || isNaN(value)) return `${currency}0.00`;
  return `${currency}${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Format number
export const fmtNum = (value) => {
  if (value == null || isNaN(value)) return '0';
  return Number(value).toLocaleString('en-IN');
};

// Format date
export const fmtDate = (date, includeTime = false) => {
  if (!date) return '-';
  const d = new Date(date);
  if (includeTime) {
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Format relative time
export const fmtRelative = (date) => {
  if (!date) return '-';
  const now = new Date();
  const d = new Date(date);
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return fmtDate(date);
};

// Get error message from API error
export const getError = (error) => {
  return error?.response?.data?.message || error?.message || 'An error occurred';
};

// Status badge class
export const statusClass = (status) => {
  const map = {
    active: 'badge-success', inactive: 'badge-gray',
    pending: 'badge-warning', approved: 'badge-info',
    completed: 'badge-success', cancelled: 'badge-danger',
    received: 'badge-success', ordered: 'badge-info',
    partially_received: 'badge-warning',
    paid: 'badge-success', partial: 'badge-warning', unpaid: 'badge-danger', credit: 'badge-info',
    in_stock: 'badge-success', low_stock: 'badge-warning', out_of_stock: 'badge-danger'
  };
  return map[status] || 'badge-gray';
};

// Stock status label
export const stockStatusLabel = (qty, minStock) => {
  if (qty === 0) return { label: 'Out of Stock', cls: 'badge-danger' };
  if (qty <= minStock) return { label: 'Low Stock', cls: 'badge-warning' };
  return { label: 'In Stock', cls: 'badge-success' };
};

// Generate today's date string for input[type=date]
export const todayStr = () => new Date().toISOString().split('T')[0];

// Debounce
export const debounce = (fn, ms) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
};

// Role label
export const roleLabel = (role) => ({
  admin: 'Admin',
  accountant: 'Accountant',
  warehouse_user: 'Warehouse User',
  shop_user: 'Shop User'
}[role] || role);

// Payment method label
export const paymentLabel = (m) => ({
  cash: 'Cash', card: 'Card', bank: 'Bank Transfer', other: 'Other', credit: 'Credit'
}[m] || m);

// Expense category label
export const expenseCatLabel = (c) => ({
  rent: 'Rent', electricity: 'Electricity', transport: 'Transport',
  salary: 'Salary', office_expense: 'Office Expense', other: 'Other'
}[c] || c);

// Movement type label
export const movTypeLabel = (t) => ({
  opening_stock: 'Opening Stock', purchase: 'Purchase', transfer_in: 'Transfer In',
  transfer_out: 'Transfer Out', sale: 'Sale', sale_return: 'Sale Return',
  purchase_return: 'Purchase Return', adjustment: 'Adjustment', damaged: 'Damaged'
}[t] || t);
