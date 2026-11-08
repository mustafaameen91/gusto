<template>
  <AppLayout>
    <div class="kitchen-page">
      <!-- Header -->
      <header class="page-header">
        <div class="header-bg">
          <div class="header-blob header-blob--1" />
          <div class="header-blob header-blob--2" />
        </div>
        <div class="header-content">
          <v-avatar size="64" class="header-logo" color="white">
            <img :src="logoImg" alt="جوستو" />
          </v-avatar>
          <div class="header-text">
            <h1 class="header-title">شاشة المطبخ</h1>
            <p class="header-subtitle">{{ authStore.user?.fullName }} · {{ currentDate }} · {{ currentTime }}</p>
          </div>
        </div>
      </header>

      <!-- Two columns: Pending | Ready to deliver -->
      <div class="columns-wrap">
        <!-- Pending -->
        <section class="column column--pending">
          <div class="column-header">
            <div class="column-header-icon column-header-icon--pending">
              <PhClock :size="28" weight="duotone" />
            </div>
            <div class="column-header-text">
              <h2 class="column-title">قيد الانتظار</h2>
              <p class="column-desc">طلبات جديدة</p>
            </div>
            <span class="column-badge">{{ pendingOrders.length }}</span>
          </div>
          <div class="column-cards">
            <template v-if="loading.orders">
              <v-skeleton-loader v-for="n in 3" :key="`pending-skel-${n}`" type="card" class="card-skeleton" />
            </template>
            <template v-else>
              <article
                v-for="order in pendingOrders"
                :key="order.idOrder"
                class="order-card order-card--pending"
              >
                <div class="order-card-header order-card-header--pending">
                  <span class="order-number">#{{ order.orderNumber }}</span>
                  <span class="order-meta">
                    <PhTimer :size="14" weight="bold" />
                    {{ getOrderTime(order.orderDate) }}
                  </span>
                </div>
                <div class="order-card-body">
                  <p class="order-source">{{ order.cashierName || 'عميل' }}{{ order.tableNumber ? ` · طاولة ${order.tableNumber}` : '' }}</p>
                  <ul class="order-items">
                    <li
                      v-for="(item, idx) in (order.items || [])"
                      :key="item.idOrderItem"
                      class="order-item"
                    >
                      <span class="order-item-name">{{ item.itemName }}</span>
                      <span class="order-item-qty">×{{ item.quantity }}</span>
                      <span v-if="item.sizeName" class="order-item-size">الحجم: {{ item.sizeName }}</span>
                      <span v-if="item.specialInstructions" class="order-item-notes">📝 {{ item.specialInstructions }}</span>
                    </li>
                  </ul>
                </div>
                <div class="order-card-actions">
                  <v-btn
                    block
                    size="large"
                    class="btn-mark-ready"
                    @click="updateOrderKitchenItems(order.idOrder, 'ready')"
                  >
                    <PhCheckCircle :size="20" weight="bold" />
                    جاهز للتقديم
                  </v-btn>
                </div>
              </article>
            </template>
            <div v-if="!loading.orders && pendingOrders.length === 0" class="empty-state">
              <PhCookingPot :size="56" weight="thin" class="empty-icon" />
              <p class="empty-text">لا توجد طلبات منتظرة</p>
            </div>
          </div>
        </section>

        <!-- Ready to deliver -->
        <section class="column column--ready">
          <div class="column-header">
            <div class="column-header-icon column-header-icon--ready">
              <PhCheckCircle :size="28" weight="duotone" />
            </div>
            <div class="column-header-text">
              <h2 class="column-title">جاهز للتسليم</h2>
              <p class="column-desc">جاهز للتقديم للعميل</p>
            </div>
            <span class="column-badge column-badge--ready">{{ readyOrders.length }}</span>
          </div>
          <div class="column-cards">
            <template v-if="loading.orders">
              <v-skeleton-loader v-for="n in 3" :key="`ready-skel-${n}`" type="card" class="card-skeleton" />
            </template>
            <template v-else>
              <article
                v-for="order in readyOrders"
                :key="order.idOrder"
                class="order-card order-card--ready"
              >
                <div class="order-card-header order-card-header--ready">
                  <span class="order-number">#{{ order.orderNumber }}</span>
                  <span class="order-meta">
                    <PhTimer :size="14" weight="bold" />
                    {{ getOrderTime(order.orderDate) }}
                  </span>
                </div>
                <div class="order-card-body">
                  <p class="order-source">{{ order.cashierName || 'عميل' }}{{ order.tableNumber ? ` · طاولة ${order.tableNumber}` : '' }}</p>
                  <ul class="order-items">
                    <li
                      v-for="(item, idx) in (order.items || [])"
                      :key="item.idOrderItem"
                      class="order-item"
                    >
                      <span class="order-item-name">{{ item.itemName }}</span>
                      <span class="order-item-qty">×{{ item.quantity }}</span>
                      <span v-if="item.sizeName" class="order-item-size">الحجم: {{ item.sizeName }}</span>
                      <span v-if="item.specialInstructions" class="order-item-notes">📝 {{ item.specialInstructions }}</span>
                    </li>
                  </ul>
                </div>
                <div class="order-card-actions">
                  <v-btn
                    block
                    size="large"
                    variant="outlined"
                    class="btn-mark-delivered"
                    @click="updateOrderKitchenItems(order.idOrder, 'completed')"
                  >
                    <PhCheckCircle :size="20" weight="bold" />
                    تم التسليم
                  </v-btn>
                </div>
              </article>
            </template>
            <div v-if="!loading.orders && readyOrders.length === 0" class="empty-state">
              <PhCheckCircle :size="56" weight="thin" class="empty-icon" />
              <p class="empty-text">لا توجد طلبات جاهزة</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import { orderAPI, orderItemAPI } from '@/services/api'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'
import { formatCurrentDateArabic } from '@/utils/dateFormatter'
import logoImg from '@/assets/logo.png'
import { format } from 'date-fns'
import { PhClock, PhCheckCircle, PhCookingPot, PhTimer } from '@phosphor-icons/vue'
import { io } from 'socket.io-client'

const authStore = useAuthStore()
const toast = useToast()
const orders = ref([])
const currentTime = ref(format(new Date(), 'HH:mm:ss'))
const loading = ref({ orders: false })

const currentDate = computed(() => formatCurrentDateArabic())

const filterKitchenItems = (order) => {
  if (!order?.items || !Array.isArray(order.items)) return null
  order = { ...order, items: order.items.filter(item => !['cancelled', 'returned'].includes(item.status)) }
  const kitchenItems = order.items.filter(item =>
    item.isKitchen === true || item.isKitchen === 1 || item.isKitchen === undefined
  )
  if (kitchenItems.length === 0) return null
  return { ...order, items: kitchenItems }
}

const hasKitchenItems = (order) => {
  if (!order?.items || !Array.isArray(order.items)) return false
  return order.items.some(item =>
    item.isKitchen === true || item.isKitchen === 1 || item.isKitchen === undefined
  )
}

// Pending: show items that are pending OR preparing (no separate preparing column)
const pendingOrders = computed(() => {
  const result = []
  orders.value.forEach(order => {
    if (!hasKitchenItems(order)) return
    const filtered = filterKitchenItems(order)
    if (!filtered?.items) return
    const pendingItems = filtered.items.filter(item =>
      item.status === 'pending' || item.status === 'preparing' || !item.status
    )
    if (pendingItems.length > 0) {
      result.push({ ...filtered, items: pendingItems })
    }
  })
  return result
})

const readyOrders = computed(() => {
  const result = []
  orders.value.forEach(order => {
    if (!hasKitchenItems(order)) return
    const filtered = filterKitchenItems(order)
    if (!filtered?.items) return
    const readyItems = filtered.items.filter(item => item.status === 'ready')
    if (readyItems.length > 0) {
      result.push({ ...filtered, items: readyItems })
    }
  })
  return result
})

const loadActiveOrders = async () => {
  loading.value.orders = true
  try {
    const res = await orderAPI.getActive()
    orders.value = res.data || []
  } catch (e) {
    console.error('Failed to load orders:', e)
  } finally {
    loading.value.orders = false
  }
}

const updateOrderKitchenItems = async (orderId, status) => {
  try {
    const order = orders.value.find(o => o.idOrder === orderId)
    if (!order?.items) return
    const kitchenItems = order.items.filter(item =>
      item.isKitchen === true || item.isKitchen === 1 || item.isKitchen === undefined
    )
    // Only live items that are behind the target status (never returned/cancelled ones)
    const steps = ['pending', 'preparing', 'ready', 'completed']
    const toUpdate = kitchenItems.filter(item => steps.includes(item.status || 'pending') && steps.indexOf(item.status || 'pending') < steps.indexOf(status))
    await Promise.all(toUpdate.map(item => orderItemAPI.updateStatus(item.idOrderItem, status)))
    await new Promise(r => setTimeout(r, 500))
    try {
      await orderAPI.recomputeStatus(orderId)
    } catch (_) {}
    await new Promise(r => setTimeout(r, 300))
    await loadActiveOrders()
    const labels = { ready: 'جاهز للتقديم', completed: 'تم التسليم' }
    toast.success(`تم تحديث الطلب: ${labels[status] || status}`)
  } catch (e) {
    toast.error('فشل تحديث الطلب')
    console.error(e)
  }
}

const getOrderTime = (dateString) => {
  const orderDate = new Date(dateString)
  const diffMinutes = Math.floor((Date.now() - orderDate.getTime()) / 60000)
  if (diffMinutes < 1) return 'الآن'
  if (diffMinutes === 1) return 'دقيقة'
  if (diffMinutes < 60) return `${diffMinutes} د`
  return `${Math.floor(diffMinutes / 60)} س`
}

let timeInterval
let socket = null

onMounted(() => {
  loadActiveOrders()
  timeInterval = setInterval(() => {
    currentTime.value = format(new Date(), 'HH:mm:ss')
  }, 1000)
  const socketUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3128' : window.location.origin)
  socket = io(socketUrl, { transports: ['websocket', 'polling'], auth: { token: localStorage.getItem('gusto_token') } })
  socket.on('connect', () => socket.emit('join_kitchen'))
  socket.on('new_order', (data) => {
    toast.info(`طلب جديد #${data.orderNumber}`)
    loadActiveOrders()
  })
  socket.on('order_updated', () => loadActiveOrders())
  socket.on('order_status_changed', () => loadActiveOrders())
  socket.on('item_status_changed', () => loadActiveOrders())
})

onUnmounted(() => {
  clearInterval(timeInterval)
  if (socket) socket.disconnect()
})
</script>

<style scoped>
.kitchen-page {
  min-height: 100vh;
  background: var(--t-bg);
  padding: 1.5rem;
}

.page-header {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
}

.header-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #4a2d13 0%, #046375 50%, #1F7F90 100%);
}

.header-blob {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
}
.header-blob--1 { top: -60px; right: -60px; width: 220px; height: 220px; }
.header-blob--2 { bottom: -40px; left: -40px; width: 160px; height: 160px; }

.header-content {
  position: relative;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1.25rem 1.75rem;
}

.header-logo {
  border-radius: 14px;
  overflow: hidden;
}
.header-logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 6px;
}

.header-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.02em;
}

.header-subtitle {
  margin: 0.25rem 0 0;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.88);
}

.columns-wrap {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin: 0;
}

@media (max-width: 960px) {
  .columns-wrap {
    grid-template-columns: 1fr;
  }
}

.column {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.column-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 1rem 1.25rem;
  border-radius: 16px;
  background: var(--t-surface);
  border: 1px solid var(--t-border-soft);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}

.column-header-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.column-header-icon--pending {
  background: linear-gradient(145deg, rgba(251,191,36,0.2) 0%, rgba(251,191,36,0.1) 100%);
  color: #fbbf24;
}

.column-header-icon--ready {
  background: linear-gradient(145deg, rgba(132,150,122,0.25) 0%, var(--t-border-soft) 100%);
  color: #84967a;
}

.column-header-text { flex: 1; min-width: 0; }

.column-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--t-text);
}

.column-desc {
  margin: 0.25rem 0 0;
  font-size: 0.8rem;
  color: var(--t-text-dim);
}

.column-badge {
  font-size: 1.1rem;
  font-weight: 700;
  color: #fbbf24;
  background: rgba(251,191,36,0.15);
  padding: 0.35rem 0.75rem;
  border-radius: 10px;
}

.column-badge--ready {
  color: #84967a;
  background: var(--t-border-medium);
}

.column-cards {
  flex: 1;
  min-height: 320px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-right: 4px;
}

.card-skeleton {
  border-radius: 16px;
  overflow: hidden;
}

.order-card {
  border-radius: 16px;
  overflow: hidden;
  background: var(--t-surface);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid var(--t-border-soft);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.order-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
}

.order-card--ready {
  border-color: var(--t-border-strong);
  box-shadow: 0 2px 12px var(--t-border-soft);
}

.order-card--ready:hover {
  box-shadow: 0 8px 24px var(--t-border-medium);
}

.order-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
}

.order-card-header--pending {
  background: rgba(251,191,36,0.08);
  border-bottom: 1px solid rgba(251,191,36,0.15);
}

.order-card-header--ready {
  background: var(--t-border-subtle);
  border-bottom: 1px solid var(--t-border-medium);
}

.order-number {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--t-text);
}

.order-meta {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.85rem;
  color: var(--t-text-dim);
}

.order-card-body {
  padding: 1rem 1.25rem;
}

.order-source {
  margin: 0 0 0.75rem;
  font-size: 0.8rem;
  color: var(--t-text-dim);
}

.order-items {
  list-style: none;
  margin: 0;
  padding: 0;
}

.order-item {
  padding: 0.6rem 0;
  border-bottom: 1px solid var(--t-border-subtle);
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.5rem;
}

.order-item:last-child { border-bottom: none; }

.order-item-name {
  font-weight: 600;
  color: var(--t-text);
  flex: 1;
}

.order-item-qty {
  font-size: 0.8rem;
  font-weight: 600;
  color: #1F7F90;
  background: rgba(4, 99, 117,0.15);
  padding: 0.15rem 0.5rem;
  border-radius: 6px;
}

.order-card--ready .order-item-qty {
  color: #84967a;
  background: var(--t-border-medium);
}

.order-item-size {
  width: 100%;
  font-size: 0.8rem;
  color: var(--t-text-dim);
}

.order-item-notes {
  width: 100%;
  font-size: 0.8rem;
  color: #f87171;
  font-weight: 500;
}

.order-card-actions {
  padding: 1rem 1.25rem;
  background: var(--t-surface-high);
  border-top: 1px solid var(--t-border-subtle);
}

.btn-mark-ready {
  background: linear-gradient(135deg, #046375 0%, #1F7F90 100%) !important;
  color: #fff !important;
  text-transform: none;
  font-weight: 600;
  border-radius: 12px;
  letter-spacing: -0.01em;
}

.btn-mark-delivered {
  border: 2px solid #84967a !important;
  color: #84967a !important;
  text-transform: none;
  font-weight: 600;
  border-radius: 12px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}

.empty-icon {
  color: rgba(132,150,122,0.3);
  margin-bottom: 1rem;
}

.empty-text {
  margin: 0;
  font-size: 1rem;
  color: var(--t-text-faint);
  font-weight: 500;
}

::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: var(--t-border-medium);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(4, 99, 117,0.3);
}
</style>
