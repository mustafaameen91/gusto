import axios from "axios";

// Determine API base URL based on environment
const getApiBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Same origin everywhere: in development the Vite server proxies /api, /uploads and
  // /socket.io to the backend (vite.config.js), so any dev port and any device on the
  // network works without CORS; in production the backend serves the app itself.
  return "/api";
};

const api = axios.create({
  baseURL: getApiBaseURL(),
  timeout: 10000,
});

// ─── Simple in-memory cache for GET requests ───
const cache = new Map();

function cachedGet(url, ttl = 60000) {
  const key = url;
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < ttl) {
    return Promise.resolve(entry.data);
  }
  // Deduplicate: if a request for this key is already in-flight, reuse it
  if (entry && entry.pending) return entry.pending;
  const pending = api
    .get(url)
    .then((res) => {
      cache.set(key, { data: res, ts: Date.now(), pending: null });
      return res;
    })
    .catch((err) => {
      cache.delete(key);
      throw err;
    });
  cache.set(key, { ...(entry || {}), pending });
  return pending;
}

function invalidateCache(prefix) {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("gusto_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("gusto_token");
      localStorage.removeItem("gusto_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// Auth
export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  register: (data) => api.post("/auth/register", data),
  me: () => api.get("/auth/me"),
  verifyCredentials: (data) => api.post("/auth/verify-credentials", data),
};

// Categories (cached 2 min — rarely changes)
export const categoryAPI = {
  getAll: () => cachedGet("/categories", 120000),
  getOne: (id) => api.get(`/categories/${id}`),
  create: (data) => {
    invalidateCache("/categories");
    return api.post("/categories", data);
  },
  update: (id, data) => {
    invalidateCache("/categories");
    return api.put(`/categories/${id}`, data);
  },
  delete: (id) => {
    invalidateCache("/categories");
    return api.delete(`/categories/${id}`);
  },
};

// Menu (cached 2 min — rarely changes during cashier session)
export const menuAPI = {
  getAll: () => cachedGet("/menu", 120000),
  getOne: (id) => api.get(`/menu/${id}`),
  getByCategory: (categoryId) => api.get(`/menu/category/${categoryId}`),
  create: (data) => {
    invalidateCache("/menu");
    return api.post("/menu", data);
  },
  update: (id, data) => {
    invalidateCache("/menu");
    return api.put(`/menu/${id}`, data);
  },
  toggleAvailability: (id) => {
    invalidateCache("/menu");
    return api.patch(`/menu/${id}/toggle-availability`);
  },
  delete: (id) => {
    invalidateCache("/menu");
    return api.delete(`/menu/${id}`);
  },
  uploadImage: (formData) =>
    api.post("/menu/upload-image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

// Inventory
export const inventoryAPI = {
  getAll: () => api.get("/inventory"),
  getOne: (id) => api.get(`/inventory/${id}`),
  getLowStock: () => api.get("/inventory/low-stock"),
  getUsageSummary: (params) => api.get("/inventory/usage-summary", { params: params || {} }),
  getTransactions: (id) => api.get(`/inventory/${id}/transactions`),
  create: (data) => api.post("/inventory", data),
  update: (id, data) => api.put(`/inventory/${id}`, data),
  adjustStock: (id, data) => api.patch(`/inventory/${id}/adjust-stock`, data),
  delete: (id) => api.delete(`/inventory/${id}`),
};

// Storage locations (Main, Barista Internal)
export const storageLocationAPI = {
  getAll: () => api.get("/storage-locations"),
  getOne: (id) => api.get(`/storage-locations/${id}`),
};

// Ingredient stock by location (Main = /ingredient-stock/main, Barista = /ingredient-stock/location/2)
export const ingredientStockAPI = {
  getMain: () => api.get("/ingredient-stock/main"),
  getByLocation: (locationId) => api.get(`/ingredient-stock/location/${locationId}`),
  getByIngredient: (ingredientId) => api.get(`/ingredient-stock/ingredient/${ingredientId}`),
};

// Transfers (Main → Barista Internal)
export const transferAPI = {
  create: (data) => api.post("/transfers", data),
  getAll: (params) => api.get("/transfers", { params: params || {} }),
};

// Kitchen mini storage (cached 30s — changes with orders)
export const kitchenStockAPI = {
  getMenu: (includeZero = false) => cachedGet(`/kitchen-stock/menu?includeZero=${includeZero ? "1" : "0"}`, 30000),
  add: (data) => {
    invalidateCache("/kitchen-stock");
    return api.post("/kitchen-stock/add", data);
  },
  decrease: (data) => {
    invalidateCache("/kitchen-stock");
    return api.patch("/kitchen-stock/decrease", data);
  },
  setQuantity: (data) => {
    invalidateCache("/kitchen-stock");
    return api.put("/kitchen-stock/set", data);
  },
};

// Orders
export const orderAPI = {
  getAll: (params) => api.get("/orders", { params }),
  getOne: (id) => api.get(`/orders/${id}`),
  getActive: () => api.get("/orders/active", { timeout: 30000 }),
  getDailySummary: (date) => api.get("/orders/daily-summary", { params: { date } }),
  create: (data) => api.post("/orders", data),
  updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
  recomputeStatus: (id) => api.patch(`/orders/${id}/recompute-status`),
};

export const orderReturnAPI = {
  create: (data) => api.post("/order-returns", data),
  getByOrder: (orderId) => api.get(`/order-returns/order/${orderId}`),
  getAll: (limit) => api.get("/order-returns", { params: { limit } }),
};

// Order Items
export const orderItemAPI = {
  getOne: (id) => api.get(`/orders/items/${id}`),
  updateStatus: (id, status) => api.patch(`/orders/items/${id}/status`, { status }),
};

// Staff
export const staffAPI = {
  getAll: () => api.get("/staff"),
  getOne: (id) => api.get(`/staff/${id}`),
  update: (id, data) => api.put(`/staff/${id}`, data),
  delete: (id) => api.delete(`/staff/${id}`),
};

// Recipes
export const recipeAPI = {
  getByMenuItem: (menuItemId) => api.get(`/recipes/menu-item/${menuItemId}`),
  bulkUpdate: (menuItemId, recipes) => api.put(`/recipes/menu-item/${menuItemId}`, { recipes }),
  create: (data) => api.post("/recipes", data),
  delete: (id) => api.delete(`/recipes/${id}`),
  deleteByMenuItem: (menuItemId) => api.delete(`/recipes/menu-item/${menuItemId}`),
};

// Item Sizes
export const itemSizeAPI = {
  getByMenuItem: (menuItemId) => api.get(`/item-sizes/menu-item/${menuItemId}`),
  create: (data) => api.post("/item-sizes", data),
  update: (id, data) => api.put(`/item-sizes/${id}`, data),
  delete: (id) => api.delete(`/item-sizes/${id}`),
};

// Daily Receipts (close runs Post Shift + close + auto-open, so needs longer timeout)
export const dailyReceiptAPI = {
  getAll: (limit) => api.get("/daily-receipts", { params: { limit } }),
  getOne: (id) => api.get(`/daily-receipts/${id}`),
  getCurrent: () => api.get("/daily-receipts/current"),
  open: (data) => api.post("/daily-receipts", data),
  close: (id, data) => api.put(`/daily-receipts/${id}/close`, data, { timeout: 60000 }),
  getCashCounts: (id) => api.get(`/daily-receipts/${id}/cash-counts`),
};

// Purchases
export const purchaseAPI = {
  getAll: (limit) => api.get("/purchases", { params: { limit } }),
  getOne: (id) => api.get(`/purchases/${id}`),
  generateNumber: () => api.get("/purchases/generate-number"),
  create: (data) => api.post("/purchases", data),
  update: (id, data) => api.put(`/purchases/${id}`, data),
  receive: (id, data) => api.post(`/purchases/${id}/receive`, data),
  delete: (id) => api.delete(`/purchases/${id}`),
};

// Expenses
export const expenseAPI = {
  getAll: (params) => api.get("/expenses", { params }),
  getOne: (id) => api.get(`/expenses/${id}`),
  getSummary: (params) => api.get("/expenses/summary", { params }),
  getTotal: (params) => api.get("/expenses/total", { params }),
  uploadImage: (formData) =>
    api.post("/expenses/upload-image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  create: (data) => api.post("/expenses", data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`),
};

// Expense categories (for dropdown + add new)
export const expenseCategoryAPI = {
  getAll: () => api.get("/expense-categories"),
  create: (data) => api.post("/expense-categories", data),
};

// Cash Box
export const boxAPI = {
  getBalance: () => api.get("/box/balance"),
  getSummary: (params) => api.get("/box/summary", { params }),
  getTransactions: (params) => api.get("/box/transactions", { params }),
  getAccountBalances: () => api.get("/box/account-balances"),
  getAccountTransactions: (accountId, params) => api.get(`/box/account-transactions/${accountId}`, { params }),
  transfer: (data) => api.post("/box/transfer", data),
};

// Reports
export const reportAPI = {
  getFinancial: (params) => api.get("/reports/financial", { params }),
  getSales: (params) => api.get("/reports/sales", { params }),
  getExpenses: (params) => api.get("/reports/expenses", { params }),
  getPurchases: (params) => api.get("/reports/purchases", { params }),
  getDailySummary: (params) => api.get("/reports/daily-summary", { params }),
  getProfitSinceOpening: () => api.get("/reports/profit-since-opening"),
  getItemSales: (params) => api.get("/reports/item-sales", { params }),
  getTimeSales: (params) => api.get("/reports/time-sales", { params }),
  getMaterialUsage: (params) => api.get("/reports/material-usage", { params }),
};

// Suppliers
export const supplierAPI = {
  getAll: () => api.get("/suppliers"),
  getSummaryStats: () => api.get("/suppliers/summary"),
  getOne: (id) => api.get(`/suppliers/${id}`),
  getProfile: (id) => api.get(`/suppliers/${id}/profile`),
  getPayments: (id) => api.get(`/suppliers/${id}/payments`),
  getCredits: (id) => api.get(`/suppliers/${id}/credits`),
  getServiceInvoices: (id) => api.get(`/suppliers/${id}/service-invoices`),
  getServiceInvoice: (id, invoiceId) => api.get(`/suppliers/${id}/service-invoices/${invoiceId}`),
  createServiceInvoice: (id, data) => api.post(`/suppliers/${id}/service-invoices`, data),
  updateServiceInvoice: (id, invoiceId, data) => api.put(`/suppliers/${id}/service-invoices/${invoiceId}`, data),
  deleteServiceInvoice: (id, invoiceId) => api.delete(`/suppliers/${id}/service-invoices/${invoiceId}`),
  create: (data) => api.post("/suppliers", data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`),
  createPayment: (id, data) => api.post(`/suppliers/${id}/payments`, data),
  createCredit: (id, data) => api.post(`/suppliers/${id}/credits`, data),
  createTransfer: (data) => api.post("/suppliers/transfer", data),
};

// Tips
export const tipAPI = {
  getAll: (params) => api.get("/tips", { params }),
  getOne: (id) => api.get(`/tips/${id}`),
  getSummary: (params) => api.get("/tips/summary", { params }),
  create: (data) => api.post("/tips", data),
  update: (id, data) => api.put(`/tips/${id}`, data),
  delete: (id) => api.delete(`/tips/${id}`),
};

// GL: Accounts (chart of accounts)
export const accountAPI = {
  getAll: (params) => api.get("/accounts", { params: params || {} }),
  getOne: (id) => api.get(`/accounts/${id}`),
  create: (data) => api.post("/accounts", data),
  update: (id, data) => api.put(`/accounts/${id}`, data),
  delete: (id) => api.delete(`/accounts/${id}`),
};

// GL: Posting settings (which account is cash, sales, etc.)
export const postingSettingsAPI = {
  get: (name) => api.get("/posting-settings", { params: name ? { name } : {} }),
  update: (data) => api.put("/posting-settings", data),
};

export const journalEntryAPI = {
  getAll: (params) => api.get("/journal-entries", { params: params || {} }),
};

// Order payments (Payments table - one per order)
export const paymentAPI = {
  list: (params) => api.get("/payments", { params }),
};

// Other / outer incomes (إيرادات خارجية — non-sales income)
export const otherIncomesAPI = {
  list: (params) => api.get("/other-incomes", { params }),
  create: (data) => api.post("/other-incomes", data),
};

// Customers (debtors for credit sales - آجل)
export const customerAPI = {
  getAll: (params) => api.get("/customers", { params }),
  getOne: (id) => api.get(`/customers/${id}`),
  getProfile: (id) => api.get(`/customers/${id}/profile`),
  create: (data) => api.post("/customers", data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  createReceipt: (id, data) => api.post(`/customers/${id}/receipts`, data),
};

export default api;
