// Who may open which page. The router guard and the sidebar both read this, so a page is
// never visible to a role that can't open it (and vice versa). It mirrors the server's checks.
// Roles (DB enum): admin, supervisor, cashier, kitchen, waiter, purchases, storage

export const ROLE_LABELS = {
  admin: 'مدير',
  supervisor: 'مشرف',
  cashier: 'كاشير',
  kitchen: 'مطبخ',
  waiter: 'نادل',
  purchases: 'مشتريات',
  storage: 'مخزن',
}

const FRONT = ['admin', 'supervisor', 'cashier']

export const PAGE_ROLES = {
  '/dashboard': ['admin', 'supervisor', 'cashier', 'kitchen', 'purchases'],
  '/storage-dashboard': ['admin', 'storage'],
  '/waiter': ['waiter', 'admin', 'supervisor'], // tablet menu: orders go to the cashier
  '/cashier': FRONT, // the till: only these roles take payment
  '/kitchen': ['admin', 'supervisor', 'kitchen'],
  '/barista': ['admin', 'supervisor', 'kitchen'],
  '/daily-receipt': FRONT,
  '/box': FRONT,
  '/customers': FRONT,
  '/tips': FRONT,
  '/order-payments': FRONT,
  '/orders': ['admin', 'supervisor'],
  '/returns': ['admin', 'supervisor'],
  '/menu': ['admin'],
  '/inventory': ['admin', 'storage'],
  '/receiving': ['admin', 'storage'],
  '/transfers': ['admin', 'storage'],
  '/kitchen-stock': ['admin', 'storage', 'kitchen'],
  '/purchases': ['admin', 'purchases'],
  '/suppliers': ['admin'],
  '/expenses': ['admin'],
  '/outer-incomes': ['admin'],
  '/accounts': ['admin'],
  '/posting-settings': ['admin'],
  '/posting-entries': ['admin'],
  '/reports': ['admin'],
  '/staff': ['admin'],
}

// Roles for a route path (detail pages like /customers/5 follow their list page)
export const rolesForPath = (path) => {
  if (PAGE_ROLES[path]) return PAGE_ROLES[path]
  const base = '/' + path.split('/')[1]
  return PAGE_ROLES[base] || null
}

export const canOpen = (role, path) => {
  const roles = rolesForPath(path)
  return !roles || roles.includes(role)
}

// The first page a role lands on after logging in
export const homeFor = (role) => (role === 'storage' ? '/storage-dashboard' : role === 'waiter' ? '/waiter' : '/dashboard')

// Sidebar groups; each item is shown only to the roles allowed to open it
export const NAV_GROUPS = [
  {
    title: 'نقطة البيع والعمليات',
    items: [
      { to: '/waiter', label: 'طلبات الطاولات', icon: 'PhForkKnife' },
      { to: '/cashier', label: 'نقطة البيع', icon: 'PhCurrencyDollar' },
      { to: '/daily-receipt', label: 'صندوق اليومية', icon: 'PhReceipt' },
      { to: '/kitchen', label: 'شاشة المطبخ', icon: 'PhChefHat' },
      { to: '/barista', label: 'شاشة المشروبات', icon: 'PhCoffee' },
      { to: '/box', label: 'الصندوق', icon: 'PhWallet' },
      { to: '/customers', label: 'العملاء (آجل)', icon: 'PhUsers', prefix: true },
      { to: '/tips', label: 'البقشيش', icon: 'PhMoney' },
      { to: '/order-payments', label: 'دفعات الطلبات', icon: 'PhReceipt' },
    ],
  },
  {
    title: 'القائمة والمخزون',
    items: [
      { to: '/menu', label: 'إدارة القائمة', icon: 'PhForkKnife' },
      { to: '/inventory', label: 'المخزون', icon: 'PhPackage' },
      { to: '/purchases', label: 'المشتريات', icon: 'PhShoppingCart' },
      { to: '/receiving', label: 'الاستلام', icon: 'PhPackage' },
      { to: '/transfers', label: 'نقل للمخزن الداخلي', icon: 'PhArrowRight' },
      { to: '/kitchen-stock', label: 'مخزن المطبخ', icon: 'PhCookingPot' },
    ],
  },
  {
    title: 'المالية',
    items: [
      { to: '/expenses', label: 'المصروفات', icon: 'PhReceipt' },
      { to: '/outer-incomes', label: 'إيرادات خارجية', icon: 'PhMoney' },
      { to: '/suppliers', label: 'الموردون', icon: 'PhStorefront', prefix: true },
      { to: '/accounts', label: 'دليل الحسابات', icon: 'PhListBullets' },
      { to: '/posting-settings', label: 'إعدادات الترحيل', icon: 'PhGear' },
      { to: '/posting-entries', label: 'قيود الترحيل', icon: 'PhListBullets' },
    ],
  },
  {
    title: 'الإدارة',
    items: [
      { to: '/orders', label: 'الطلبات', icon: 'PhReceipt' },
      { to: '/returns', label: 'المرتجعات والهدر', icon: 'PhArrowUUpLeft' },
      { to: '/reports', label: 'التقارير', icon: 'PhChartLine' },
      { to: '/staff', label: 'الموظفين', icon: 'PhUsers' },
    ],
  },
]
