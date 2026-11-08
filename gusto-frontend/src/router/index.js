import { createRouter, createWebHistory } from 'vue-router'
import { canOpen, homeFor } from '@/config/navigation'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/storage-dashboard',
    name: 'StorageDashboard',
    component: () => import('@/views/StorageDashboard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/waiter',
    name: 'WaiterMenu',
    component: () => import('@/views/WaiterMenu.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/cashier',
    name: 'Cashier',
    component: () => import('@/views/Cashier.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/kitchen',
    name: 'Kitchen',
    component: () => import('@/views/Kitchen.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/barista',
    name: 'Barista',
    component: () => import('@/views/Barista.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/menu',
    name: 'MenuManagement',
    component: () => import('@/views/MenuManagement.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/inventory',
    name: 'Inventory',
    component: () => import('@/views/Inventory.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/transfers',
    name: 'Transfers',
    component: () => import('@/views/Transfers.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/kitchen-stock',
    name: 'KitchenStock',
    component: () => import('@/views/KitchenStock.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/purchases',
    name: 'Purchases',
    component: () => import('@/views/Purchases.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/receiving',
    name: 'Receiving',
    component: () => import('@/views/Receiving.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/daily-receipt',
    name: 'DailyReceipt',
    component: () => import('@/views/DailyReceipt.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/reports',
    name: 'Reports',
    component: () => import('@/views/Reports.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/staff',
    name: 'Staff',
    component: () => import('@/views/Staff.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/orders',
    name: 'Orders',
    component: () => import('@/views/Orders.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/returns',
    name: 'Returns',
    component: () => import('@/views/Returns.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/expenses',
    name: 'Expenses',
    component: () => import('@/views/Expenses.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/box',
    name: 'Box',
    component: () => import('@/views/Box.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/customers',
    name: 'Customers',
    component: () => import('@/views/Customers.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/customers/:id',
    name: 'CustomerProfile',
    component: () => import('@/views/CustomerProfile.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/suppliers',
    name: 'Suppliers',
    component: () => import('@/views/Suppliers.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/suppliers/:id',
    name: 'SupplierProfile',
    component: () => import('@/views/SupplierProfile.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/tips',
    name: 'Tips',
    component: () => import('@/views/Tips.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/accounts',
    name: 'Accounts',
    component: () => import('@/views/Accounts.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/posting-settings',
    name: 'PostingSettings',
    component: () => import('@/views/PostingSettings.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/posting-entries',
    name: 'PostingEntries',
    component: () => import('@/views/PostingEntries.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/order-payments',
    name: 'OrderPayments',
    component: () => import('@/views/OrderPayments.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/outer-incomes',
    name: 'OuterIncomes',
    component: () => import('@/views/OuterIncomes.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const role = authStore.user?.role

  if (requiresAuth && !authStore.isAuthenticated) return next('/login')
  if (!authStore.isAuthenticated) return next()

  // Each role starts on its own home page
  if (to.path === '/' || (to.path === '/dashboard' && role === 'storage')) return next(homeFor(role))
  // Same permission table as the sidebar (config/navigation.js)
  if (requiresAuth && !canOpen(role, to.path)) return next(homeFor(role))
  next()
})

export default router

