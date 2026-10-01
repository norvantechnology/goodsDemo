import api from './api';

export const authService = {
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me')
};

export const productService = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  getByBarcode: (barcode) => api.get(`/products/barcode/${barcode}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`)
};

export const inventoryService = {
  getAll: (params) => api.get('/inventory', { params }),
  getMovements: (params) => api.get('/inventory/movements', { params }),
  adjustment: (data) => api.post('/inventory/adjustment', data)
};

export const transferService = {
  getAll: (params) => api.get('/transfers', { params }),
  getById: (id) => api.get(`/transfers/${id}`),
  create: (data) => api.post('/transfers', data),
  approve: (id) => api.post(`/transfers/${id}/approve`),
  complete: (id) => api.post(`/transfers/${id}/complete`),
  cancel: (id) => api.post(`/transfers/${id}/cancel`)
};

export const purchaseService = {
  getAll: (params) => api.get('/purchases', { params }),
  getById: (id) => api.get(`/purchases/${id}`),
  create: (data) => api.post('/purchases', data),
  receive: (id) => api.post(`/purchases/${id}/receive`),
  pay: (id, data) => api.post(`/purchases/${id}/pay`, data)
};

export const salesService = {
  getAll: (params) => api.get('/sales', { params }),
  getById: (id) => api.get(`/sales/${id}`),
  create: (data) => api.post('/sales', data),
  return: (id, data) => api.post(`/sales/${id}/return`, data)
};

export const customerService = {
  getAll: (params) => api.get('/customers', { params }),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  receivePayment: (id, data) => api.post(`/customers/${id}/payment`, data)
};

export const supplierService = {
  getAll: (params) => api.get('/suppliers', { params }),
  getById: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  makePayment: (id, data) => api.post(`/suppliers/${id}/payment`, data)
};

export const accountingService = {
  getExpenses: (params) => api.get('/accounting/expenses', { params }),
  createExpense: (data) => api.post('/accounting/expenses', data),
  getPayments: (params) => api.get('/accounting/payments', { params }),
  createPayment: (data) => api.post('/accounting/payments', data),
  getProfitLoss: (params) => api.get('/accounting/profit-loss', { params }),
  getBalanceSheet: () => api.get('/accounting/balance-sheet')
};

export const reportService = {
  stock: (params) => api.get('/reports/stock', { params }),
  stockMovement: (params) => api.get('/reports/stock-movement', { params }),
  sales: (params) => api.get('/reports/sales', { params }),
  purchases: (params) => api.get('/reports/purchases', { params }),
  outstanding: () => api.get('/reports/outstanding'),
  transfers: (params) => api.get('/reports/transfers', { params }),
  salesByProduct: (params) => api.get('/reports/sales-by-product', { params }),
  lowStock: () => api.get('/reports/low-stock')
};

export const settingsService = {
  getUsers: () => api.get('/settings/users'),
  createUser: (data) => api.post('/settings/users', data),
  updateUser: (id, data) => api.put(`/settings/users/${id}`, data),
  deleteUser: (id) => api.delete(`/settings/users/${id}`),
  getLocations: () => api.get('/settings/locations'),
  getCategories: () => api.get('/settings/categories'),
  createCategory: (data) => api.post('/settings/categories', data)
};

export const dashboardService = {
  get: () => api.get('/dashboard')
};
