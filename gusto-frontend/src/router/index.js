import { createRouter, createWebHistory } from 'vue-router'
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
    meta: { requiresAuth: true, roles: ['admin', 'storage'] }
  },
  {
    path: '/cashier',
    name: 'Cashier',
    component: () => import('@/views/Cashier.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'cashier'] }
  },
  {
    path: '/kitchen',
    name: 'Kitchen',
    component: () => import('@/views/Kitchen.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'kitchen'] }
  },
  {
    path: '/barista',
    name: 'Barista',
    component: () => import('@/views/Barista.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'kitchen', 'barista'] }
  },
  {
    path: '/menu',
    name: 'MenuManagement',
    component: () => import('@/views/MenuManagement.vue'),
    meta: { requiresAuth: true, roles: ['admin'] }
  },
  {
    path: '/inventory',
    name: 'Inventory',
    component: () => import('@/views/Inventory.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'storage'] }
  },
  {
    path: '/transfers',
    name: 'Transfers',
    component: () => import('@/views/Transfers.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'storage'] }
  },
  {
    path: '/kitchen-stock',
    name: 'KitchenStock',
    component: () => import('@/views/KitchenStock.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'storage', 'kitchen'] }
  },
  {
    path: '/purchases',
    name: 'Purchases',
    component: () => import('@/views/Purchases.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'purchases'] }
  },
  {
    path: '/receiving',
    name: 'Receiving',
    component: () => import('@/views/Receiving.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'storage'] }
  },
  {
    path: '/daily-receipt',
    name: 'DailyReceipt',
    component: () => import('@/views/DailyReceipt.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'cashier'] }
  },
  {
    path: '/reports',
    name: 'Reports',
    component: () => import('@/views/Reports.vue'),
    meta: { requiresAuth: true, roles: ['admin'] }
  },
  {
    path: '/staff',
    name: 'Staff',
    component: () => import('@/views/Staff.vue'),
    meta: { requiresAuth: true, roles: ['admin'] }
  },
  {
    path: '/orders',
    name: 'Orders',
    component: () => import('@/views/Orders.vue'),
    meta: { requiresAuth: true, roles: ['admin'] }
  },
  {
    path: '/returns',
    name: 'Returns',
    component: () => import('@/views/Returns.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'supervisor'] }
  },
  {
    path: '/expenses',
    name: 'Expenses',
    component: () => import('@/views/Expenses.vue'),
    meta: { requiresAuth: true, roles: ['admin'] }
  },
  {
    path: '/box',
    name: 'Box',
    component: () => import('@/views/Box.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'cashier'] }
  },
  {
    path: '/customers',
    name: 'Customers',
    component: () => import('@/views/Customers.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'cashier'] }
  },
  {
    path: '/customers/:id',
    name: 'CustomerProfile',
    component: () => import('@/views/CustomerProfile.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'cashier'] }
  },
  {
    path: '/suppliers',
    name: 'Suppliers',
    component: () => import('@/views/Suppliers.vue'),
    meta: { requiresAuth: true, roles: ['admin'] }
  },
  {
    path: '/suppliers/:id',
    name: 'SupplierProfile',
    component: () => import('@/views/SupplierProfile.vue'),
    meta: { requiresAuth: true, roles: ['admin'] }
  },
  {
    path: '/tips',
    name: 'Tips',
    component: () => import('@/views/Tips.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'cashier'] }
  },
  {
    path: '/accounts',
    name: 'Accounts',
    component: () => import('@/views/Accounts.vue'),
    meta: { requiresAuth: true, roles: ['admin'] }
  },
  {
    path: '/posting-settings',
    name: 'PostingSettings',
    component: () => import('@/views/PostingSettings.vue'),
    meta: { requiresAuth: true, roles: ['admin'] }
  },
  {
    path: '/posting-entries',
    name: 'PostingEntries',
    component: () => import('@/views/PostingEntries.vue'),
    meta: { requiresAuth: true, roles: ['admin'] }
  },
  {
    path: '/order-payments',
    name: 'OrderPayments',
    component: () => import('@/views/OrderPayments.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'cashier'] }
  },
  {
    path: '/outer-incomes',
    name: 'OuterIncomes',
    component: () => import('@/views/OuterIncomes.vue'),
    meta: { requiresAuth: true, roles: ['admin'] }
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
  const requiredRoles = to.meta.roles

  // Redirect storage role to storage dashboard when accessing root or main dashboard
  if (to.path === '/' || to.path === '/dashboard') {
    if (authStore.isAuthenticated && authStore.user?.role === 'storage') {
      return next('/storage-dashboard')
    }
  }

  if (requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (requiredRoles && !requiredRoles.includes(authStore.user?.role)) {
    // Redirect to appropriate dashboard based on role
    if (authStore.user?.role === 'storage') {
      next('/storage-dashboard')
    } else {
      next('/dashboard')
    }
  } else {
    next()
  }
})

export default router

