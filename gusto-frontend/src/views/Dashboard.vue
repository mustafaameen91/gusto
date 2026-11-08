<template>
  <AppLayout>
    <div class="db">
      <!-- Top stat row (like reference: 4 cards, first highlighted) -->
      <div class="db-top">
        <!-- Primary card (highlighted, like "2100 TOTAL SESSIONS") -->
        <div class="db-kpi db-kpi--primary" v-if="hasRole(['admin', 'cashier'])">
          <div class="db-kpi__head">
            <span class="db-kpi__num">{{ Number(stats.todaySales || 0).toLocaleString() }}</span>
            <span class="db-kpi__badge db-kpi__badge--up">
              <PhTrendUp :size="12" weight="bold" /> د.ع
            </span>
          </div>
          <span class="db-kpi__label">مبيعات اليوم</span>
          <div class="db-kpi__sparkline">
            <svg viewBox="0 0 120 32" preserveAspectRatio="none">
              <polyline points="0,28 15,22 30,24 45,16 55,18 70,10 85,14 100,6 115,8 120,4" fill="none" stroke="rgba(196,122,74,0.7)" stroke-width="1.5"/>
              <polyline points="0,28 15,22 30,24 45,16 55,18 70,10 85,14 100,6 115,8 120,4" fill="url(#spark)" stroke="none"/>
              <defs><linearGradient id="spark" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="rgba(4, 99, 117,0.25)"/><stop offset="100%" stop-color="rgba(4, 99, 117,0)"/></linearGradient></defs>
            </svg>
          </div>
        </div>

        <div class="db-kpi" v-if="hasRole(['admin', 'kitchen', 'cashier'])">
          <span class="db-kpi__num">{{ stats.activeOrders }}</span>
          <span class="db-kpi__label">طلبات نشطة</span>
          <span class="db-kpi__trend db-kpi__trend--blue">
            <PhClockCountdown :size="13" weight="bold" /> نشط
          </span>
        </div>

        <div class="db-kpi" v-if="hasRole(['admin'])">
          <span class="db-kpi__num">{{ stats.lowStock }}</span>
          <span class="db-kpi__label">تنبيه المخزون</span>
          <span class="db-kpi__trend db-kpi__trend--amber">
            <PhWarning :size="13" weight="bold" /> تنبيه
          </span>
        </div>

        <div class="db-kpi" v-if="hasRole(['admin'])">
          <span class="db-kpi__num">{{ stats.menuItems }}</span>
          <span class="db-kpi__label">أصناف القائمة</span>
          <span class="db-kpi__trend db-kpi__trend--green">
            <PhCheck :size="13" weight="bold" /> فعّال
          </span>
        </div>
      </div>

      <!-- Main two-column area (like reference: chart left + sidebar right) -->
      <div class="db-main">
        <!-- Left: Recent orders (replaces chart area) -->
        <div class="db-panel db-panel--wide">
          <div class="db-panel__header">
            <h3 class="db-panel__title">آخر الطلبات</h3>
            <span class="db-panel__sub">{{ currentDate }}</span>
          </div>
          <div class="db-panel__body" v-if="hasRole(['admin', 'kitchen', 'cashier'])">
            <v-data-table
              :headers="orderHeaders"
              :items="recentOrders"
              :items-per-page="ordersPagination.itemsPerPage"
              :page="ordersPagination.page"
              :loading="loading.orders"
              :server-items-length="ordersPagination.total"
              @update:page="(page) => loadRecentOrders(page)"
              hide-default-footer
              density="compact"
              class="db-table"
              theme="dark"
            >
              <template v-slot:bottom>
                <div class="db-table__footer">
                  <span>
                    عرض {{ (ordersPagination.page - 1) * ordersPagination.itemsPerPage + 1 }} -
                    {{ Math.min(ordersPagination.page * ordersPagination.itemsPerPage, ordersPagination.total) }}
                    من {{ ordersPagination.total }}
                  </span>
                  <div class="d-flex gap-1">
                    <v-btn icon variant="text" size="x-small" :disabled="ordersPagination.page === 1 || loading.orders" @click="loadRecentOrders(ordersPagination.page - 1)">
                      <PhCaretRight :size="16" color="rgba(255,255,255,0.6)" />
                    </v-btn>
                    <v-btn icon variant="text" size="x-small" :disabled="ordersPagination.page * ordersPagination.itemsPerPage >= ordersPagination.total || loading.orders" @click="loadRecentOrders(ordersPagination.page + 1)">
                      <PhCaretLeft :size="16" color="rgba(255,255,255,0.6)" />
                    </v-btn>
                  </div>
                </div>
              </template>
              <template v-slot:item.status="{ item }">
                <span class="db-status" :class="'db-status--' + item.status">{{ getOrderStatusText(item.status) }}</span>
              </template>
              <template v-slot:item.totalAmount="{ item }">
                <span class="db-amount">{{ Number(item.totalAmount || 0).toLocaleString() }} د.ع</span>
              </template>
              <template v-slot:item.orderDate="{ item }">
                <span class="db-date">{{ formatDate(item.orderDate) }}</span>
              </template>
            </v-data-table>
          </div>
        </div>

        <!-- Right sidebar: Statistics (like reference) -->
        <div class="db-sidebar" v-if="hasRole(['admin'])">
          <div class="db-panel">
            <div class="db-panel__header">
              <h3 class="db-panel__title">الإحصائيات</h3>
            </div>
            <div class="db-panel__body db-stats-list">
              <div class="db-stat-row">
                <div class="db-stat-row__info">
                  <span class="db-stat-row__label">مصروفات اليوم</span>
                </div>
                <div class="db-stat-row__ring db-stat-row__ring--red">
                  <PhReceipt :size="16" weight="duotone" />
                </div>
                <span class="db-stat-row__val">{{ Number(stats.todayExpenses || 0).toLocaleString() }} <small>د.ع</small></span>
              </div>
              <div class="db-stat-row">
                <div class="db-stat-row__info">
                  <span class="db-stat-row__label">مشتريات اليوم</span>
                </div>
                <div class="db-stat-row__ring db-stat-row__ring--amber">
                  <PhShoppingCart :size="16" weight="duotone" />
                </div>
                <span class="db-stat-row__val">{{ Number(stats.todayPurchases || 0).toLocaleString() }} <small>د.ع</small></span>
              </div>
              <div class="db-stat-row">
                <div class="db-stat-row__info">
                  <span class="db-stat-row__label">صافي الربح</span>
                </div>
                <div class="db-stat-row__ring" :class="stats.netProfit >= 0 ? 'db-stat-row__ring--green' : 'db-stat-row__ring--red'">
                  <PhTrendUp :size="16" weight="duotone" />
                </div>
                <span class="db-stat-row__val" :class="stats.netProfit >= 0 ? 'val--green' : 'val--red'">
                  {{ Number(stats.netProfit || 0).toLocaleString() }} <small>د.ع</small>
                </span>
              </div>
              <div class="db-stat-row">
                <div class="db-stat-row__info">
                  <span class="db-stat-row__label">الربح الكلي</span>
                  <span class="db-stat-row__sub">من 24 نوفمبر 2025</span>
                </div>
                <div class="db-stat-row__ring db-stat-row__ring--violet">
                  <PhChartLine :size="16" weight="duotone" />
                </div>
                <span class="db-stat-row__val val--violet">{{ Number(stats.profitSinceOpening || 0).toLocaleString() }} <small>د.ع</small></span>
              </div>
              <div class="db-stat-row" v-if="hasRole(['admin', 'cashier'])">
                <div class="db-stat-row__info">
                  <span class="db-stat-row__label">رصيد الصندوق</span>
                </div>
                <div class="db-stat-row__ring db-stat-row__ring--blue">
                  <PhWallet :size="16" weight="duotone" />
                </div>
                <span class="db-stat-row__val">{{ Number(stats.cashBoxBalance || 0).toLocaleString() }} <small>د.ع</small></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom: Quick actions row (like reference bottom platform cards) -->
      <div class="db-bottom">
        <div class="db-action" v-if="hasRole(['admin', 'cashier'])" @click="$router.push('/cashier')">
          <div class="db-action__icon db-action__icon--green">
            <PhCurrencyDollar :size="22" weight="duotone" color="white" />
          </div>
          <div class="db-action__text">
            <span class="db-action__cat">نقطة البيع</span>
            <span class="db-action__name">الكاشير</span>
          </div>
        </div>
        <div class="db-action" v-if="hasRole(['admin', 'kitchen'])" @click="$router.push('/kitchen')">
          <div class="db-action__icon db-action__icon--green">
            <PhChefHat :size="22" weight="duotone" color="white" />
          </div>
          <div class="db-action__text">
            <span class="db-action__cat">إدارة الطلبات</span>
            <span class="db-action__name">المطبخ</span>
          </div>
        </div>
        <div class="db-action" v-if="hasRole(['admin'])" @click="$router.push('/inventory')">
          <div class="db-action__icon db-action__icon--green">
            <PhPackage :size="22" weight="duotone" color="white" />
          </div>
          <div class="db-action__text">
            <span class="db-action__cat">إدارة المكونات</span>
            <span class="db-action__name">المخزون</span>
          </div>
        </div>
        <div class="db-action" v-if="hasRole(['admin'])" @click="$router.push('/reports')">
          <div class="db-action__icon db-action__icon--green">
            <PhChartLine :size="22" weight="duotone" color="white" />
          </div>
          <div class="db-action__text">
            <span class="db-action__cat">عرض الإحصائيات</span>
            <span class="db-action__name">التقارير</span>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import AppLayout from '@/components/AppLayout.vue'
import logoImg from '@/assets/logo.png'
import { orderAPI, inventoryAPI, menuAPI, expenseAPI, purchaseAPI, boxAPI, reportAPI } from '@/services/api'
import { formatDate, formatCurrentDateArabic } from '@/utils/dateFormatter'
import { PhCurrencyDollar, PhChefHat, PhForkKnife, PhPackage, PhChartLine, PhTrendUp, PhClockCountdown, PhCheckCircle, PhWarning, PhCheck, PhReceipt, PhShoppingCart, PhTrendDown, PhWallet, PhCaretLeft, PhCaretRight } from '@phosphor-icons/vue'

const authStore = useAuthStore()

const stats = ref({
  todaySales: 0,
  activeOrders: 0,
  lowStock: 0,
  menuItems: 0,
  todayExpenses: 0,
  todayPurchases: 0,
  netProfit: 0,
  profitSinceOpening: 0,
  cashBoxBalance: 0
})

const recentOrders = ref([])
const loading = ref({
  stats: true,
  orders: true
})
const ordersPagination = ref({
  page: 1,
  itemsPerPage: 5,
  total: 0
})

const currentDate = computed(() => {
  return formatCurrentDateArabic()
})

const orderHeaders = [
  { title: 'رقم الطلب', key: 'orderNumber' },
  { title: 'الحالة', key: 'status' },
  { title: 'المبلغ', key: 'totalAmount' },
  { title: 'التاريخ', key: 'orderDate' }
]

const hasRole = (roles) => {
  return roles.includes(authStore.user?.role)
}

const getOrderStatusColor = (status) => {
  const colors = {
    pending: 'warning',
    preparing: 'info',
    ready: 'success',
    completed: 'grey',
    cancelled: 'error'
  }
  return colors[status] || 'grey'
}

const getOrderStatusText = (status) => {
  const texts = {
    pending: 'معلق',
    preparing: 'قيد التحضير',
    ready: 'جاهز',
    completed: 'مكتمل',
    cancelled: 'ملغى'
  }
  return texts[status] || status
}

const loadRecentOrders = async (page = 1) => {
  if (!hasRole(['admin', 'kitchen', 'cashier'])) return

  loading.value.orders = true
  try {
    const today = new Date().toISOString().split('T')[0]
    const response = await orderAPI.getAll({
      page,
      limit: ordersPagination.itemsPerPage,
      status: 'pending,preparing,ready',
      date: today
    })
    const orders = Array.isArray(response?.data?.items) ? response.data.items : []
    const total = response?.data?.total || 0
    
    recentOrders.value = orders.map(order => ({
      ...order,
      totalAmount: Number(order.totalAmount || 0)
    }))
    ordersPagination.value = {
      ...ordersPagination.value,
      page,
      total
    }
  } catch (err) {
    console.error('Failed to load recent orders:', err)
    recentOrders.value = []
  } finally {
    loading.value.orders = false
  }
}

const loadDashboardData = async () => {
  loading.value.stats = true
  try {
    if (hasRole(['admin', 'kitchen', 'cashier'])) {
      try {
        const activeOrdersResponse = await orderAPI.getActive()
        const activeOrders = Array.isArray(activeOrdersResponse?.data) 
          ? activeOrdersResponse.data 
          : []
        stats.value.activeOrders = activeOrders.length
      } catch (err) {
        console.error('Failed to load active orders:', err)
        stats.value.activeOrders = 0
      }
      
      await loadRecentOrders(1)
      
      const today = new Date().toISOString().split('T')[0]
      try {
        const summaryResponse = await orderAPI.getDailySummary(today)
        stats.value.todaySales = parseFloat(summaryResponse.data.totalSales) || 0
      } catch (err) {
        console.log('Using fallback sales calculation')
        try {
          const todayOrdersResponse = await orderAPI.getAll({ date: today })
          const todayOrders = Array.isArray(todayOrdersResponse?.data?.items) 
            ? todayOrdersResponse.data.items 
            : []
          stats.value.todaySales = todayOrders.reduce((sum, o) => {
            const price = parseFloat(o.totalAmount || o.totalPrice || 0) || 0
            return sum + price
          }, 0)
        } catch (fallbackErr) {
          console.error('Fallback sales calculation failed:', fallbackErr)
          stats.value.todaySales = 0
        }
      }
    }

    if (hasRole(['admin'])) {
      try {
        const inventoryResponse = await inventoryAPI.getLowStock()
        stats.value.lowStock = Array.isArray(inventoryResponse?.data) 
          ? inventoryResponse.data.length 
          : 0
      } catch (err) {
        console.error('Failed to load low stock:', err)
        stats.value.lowStock = 0
      }

      try {
        const menuResponse = await menuAPI.getAll()
        stats.value.menuItems = Array.isArray(menuResponse?.data) 
          ? menuResponse.data.length 
          : 0
      } catch (err) {
        console.error('Failed to load menu items:', err)
        stats.value.menuItems = 0
      }

      const today = new Date().toISOString().split('T')[0]
      try {
        const expenseResponse = await expenseAPI.getTotal({ startDate: today, endDate: today })
        stats.value.todayExpenses = parseFloat(expenseResponse.data.totalExpenses || 0)
      } catch (err) {
        console.error('Failed to load expenses:', err)
        stats.value.todayExpenses = 0
      }

      try {
        const purchaseResponse = await purchaseAPI.getAll()
        const todayPurchases = Array.isArray(purchaseResponse?.data) 
          ? purchaseResponse.data.filter(p => {
              const purchaseDate = new Date(p.purchaseDate).toISOString().split('T')[0]
              return purchaseDate === today && (p.status === 'received' || p.status === 'partially_received')
            })
          : []
        stats.value.todayPurchases = todayPurchases.reduce((sum, p) => sum + parseFloat(p.totalAmount || 0), 0)
      } catch (err) {
        console.error('Failed to load purchases:', err)
        stats.value.todayPurchases = 0
      }

      stats.value.netProfit = stats.value.todaySales - stats.value.todayPurchases

      try {
        const profitResponse = await reportAPI.getProfitSinceOpening()
        stats.value.profitSinceOpening = parseFloat(profitResponse.data?.profit ?? 0)
      } catch (err) {
        console.error('Failed to load profit since opening:', err)
        stats.value.profitSinceOpening = 0
      }

      try {
        const boxResponse = await boxAPI.getBalance()
        stats.value.cashBoxBalance = parseFloat(boxResponse.data.currentBalance || 0)
      } catch (err) {
        console.error('Failed to load cash box balance:', err)
        stats.value.cashBoxBalance = 0
      }
    }
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
  } finally {
    loading.value.stats = false
  }
}

onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped>
/*
  Palette:
  Sage   #84967A  →  muted backgrounds, borders
  Coffee #046375  →  primary highlight, warm accent
  Derived:
    bg:       var(--t-bg)   card: var(--t-surface)   alt: var(--t-surface-high)
    sage-l:   #a3b396   coffee-l: #1F7F90
    text:     var(--t-text) (warm white)
*/
.db {
  --bg:        var(--t-bg);
  --card:      rgba(37, 41, 35, 0.75);
  --card-solid: var(--t-surface);
  --card-alt:  var(--t-surface-high);
  --border:    var(--t-border-soft);
  --glow:      rgba(4, 99, 117, 0.2);
  --t1:        var(--t-text);
  --t2:        var(--t-text-muted);
  --t3:        var(--t-text-dim);
  --sage:      #84967A;
  --sage-l:    #a3b396;
  --coffee:    #046375;
  --coffee-l:  #1F7F90;
  --accent:    #1F7F90;

  min-height: 100%;
  width: 100%;
  background: var(--bg);
  background-image:
    radial-gradient(ellipse 60% 50% at 20% 10%, rgba(4, 99, 117, 0.03) 0%, transparent 60%),
    radial-gradient(ellipse 40% 40% at 80% 80%, var(--t-hover) 0%, transparent 60%);
  direction: rtl;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ===== TOP KPI ROW ===== */
.db-top {
  display: grid;
  grid-template-columns: 1.6fr 1fr 1fr 1fr;
  gap: 12px;
}

.db-kpi {
  background: var(--card);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  position: relative;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.db-kpi:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
}

.db-kpi--primary {
  border-color: var(--coffee);
  box-shadow: 0 0 24px var(--glow), 0 4px 20px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.06);
}
.db-kpi--primary:hover {
  box-shadow: 0 0 32px var(--glow), 0 12px 32px rgba(0,0,0,0.2);
}

.db-kpi__head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 4px;
}

.db-kpi__num {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--t1);
  line-height: 1.1;
}

.db-kpi__label {
  font-size: 0.6875rem;
  font-weight: 500;
  color: var(--t3);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-top: 4px;
}

.db-kpi__badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 0.6875rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 6px;
}
.db-kpi__badge--up {
  color: var(--coffee-l);
  background: rgba(4, 99, 117, 0.12);
}

.db-kpi__trend {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 0.6875rem;
  font-weight: 600;
  margin-top: 6px;
}
.db-kpi__trend--green { color: var(--sage); }
.db-kpi__trend--blue { color: #60a5fa; }
.db-kpi__trend--amber { color: #fbbf24; }
.db-kpi__trend--red { color: #f87171; }

.db-kpi__sparkline {
  margin-top: auto;
  padding-top: 10px;
  height: 36px;
}
.db-kpi__sparkline svg {
  width: 100%;
  height: 100%;
}

/* ===== MAIN TWO-COLUMN ===== */
.db-main {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 12px;
  flex: 1;
  min-height: 0;
}

.db-panel {
  background: var(--card);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--border);
  border-radius: 14px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
}
.db-panel--wide {
  min-height: 320px;
}

.db-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border);
}

.db-panel__title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--t1);
  margin: 0;
}

.db-panel__sub {
  font-size: 0.6875rem;
  color: var(--t3);
}

.db-panel__body {
  flex: 1;
  overflow: auto;
}

/* ===== SIDEBAR STATS (reference: stacked stat rows with ring icons) ===== */
.db-sidebar {
  display: flex;
  flex-direction: column;
}

.db-stats-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 0;
}

.db-stat-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 18px;
  border-bottom: 1px solid var(--border);
}
.db-stat-row:last-child {
  border-bottom: none;
}

.db-stat-row__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.db-stat-row__label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--t2);
}

.db-stat-row__sub {
  font-size: 0.625rem;
  color: var(--t3);
}

.db-stat-row {
  transition: background 0.15s ease;
}
.db-stat-row:hover {
  background: rgba(255,255,255,0.02);
}

.db-stat-row__ring {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 0 12px rgba(0,0,0,0.1);
}
.db-stat-row__ring--green  { background: rgba(132,150,122,0.18); color: var(--sage); }
.db-stat-row__ring--red    { background: rgba(248,113,113,0.15); color: #f87171; }
.db-stat-row__ring--amber  { background: rgba(251,191,36,0.15);  color: #fbbf24; }
.db-stat-row__ring--blue   { background: rgba(96,165,250,0.15);  color: #60a5fa; }
.db-stat-row__ring--violet { background: rgba(167,139,250,0.15); color: #a78bfa; }

.db-stat-row__val {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--t1);
  white-space: nowrap;
}
.db-stat-row__val small {
  font-size: 0.625rem;
  font-weight: 400;
  color: var(--t3);
}
.val--green  { color: var(--sage) !important; }
.val--red    { color: #f87171 !important; }
.val--violet { color: #a78bfa !important; }

/* ===== BOTTOM ACTION ROW (reference: platform cards) ===== */
.db-bottom {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.db-action {
  background: var(--card);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 16px 18px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}
.db-action:hover {
  transform: translateY(-2px);
  border-color: var(--coffee);
  box-shadow: 0 0 20px var(--glow), 0 8px 24px rgba(0,0,0,0.15);
}

.db-action__icon {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: box-shadow 0.2s ease;
}
.db-action__icon--green {
  background: linear-gradient(135deg, #046375, #1F7F90);
  box-shadow: 0 4px 12px rgba(4, 99, 117,0.3);
}
.db-action:hover .db-action__icon--green {
  box-shadow: 0 4px 16px rgba(4, 99, 117,0.35);
}

.db-action__text {
  display: flex;
  flex-direction: column;
}

.db-action__cat {
  font-size: 0.625rem;
  font-weight: 500;
  color: var(--t3);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.db-action__name {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--t1);
}

/* ===== TABLE (dark themed) ===== */
.db-table {
  background: transparent !important;
}

.db-table :deep(.v-data-table__thead) {
  background: var(--card-alt);
}

.db-table :deep(.v-data-table__thead th) {
  color: var(--t3) !important;
  font-weight: 600 !important;
  font-size: 0.6875rem !important;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid var(--border) !important;
}

.db-table :deep(.v-data-table__tbody tr) {
  border-bottom: 1px solid var(--border);
}

.db-table :deep(.v-data-table__tbody td) {
  color: var(--t2) !important;
  font-size: 0.8125rem !important;
  border-bottom: 1px solid var(--border) !important;
}

.db-table :deep(.v-data-table__tbody tr:hover td) {
  background: var(--card-alt) !important;
}

.db-table__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 18px;
  font-size: 0.6875rem;
  color: var(--t3);
  border-top: 1px solid var(--border);
}

.db-amount {
  font-weight: 600;
  color: var(--t1);
  font-size: 0.8125rem;
}

.db-date {
  font-size: 0.75rem;
  color: var(--t3);
}

.db-status {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 0.6875rem;
  font-weight: 600;
}
.db-status--pending    { background: rgba(251,191,36,0.15); color: #fbbf24; }
.db-status--preparing  { background: rgba(96,165,250,0.15); color: #60a5fa; }
.db-status--ready      { background: rgba(132,150,122,0.18); color: var(--sage); }
.db-status--completed  { background: rgba(255,255,255,0.08); color: var(--t3); }
.db-status--cancelled  { background: rgba(248,113,113,0.15); color: #f87171; }

/* ===== RESPONSIVE ===== */
@media (max-width: 1024px) {
  .db-top {
    grid-template-columns: 1fr 1fr;
  }
  .db-main {
    grid-template-columns: 1fr;
  }
  .db-bottom {
    grid-template-columns: 1fr 1fr;
  }
}

html[data-theme="light"] .db {
  --card: rgba(255, 255, 255, 0.85);
}

@media (max-width: 640px) {
  .db {
    padding: 12px;
  }
  .db-top {
    grid-template-columns: 1fr;
  }
  .db-bottom {
    grid-template-columns: 1fr;
  }
}
</style>
