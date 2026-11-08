<template>
  <AppLayout>
    <v-container fluid class="pa-6">
        <!-- Elegant Welcome Banner -->
        <v-row class="mb-8">
          <v-col cols="12">
            <v-card 
              class="pa-6 page-banner" 
              elevation="0"
            >
              <!-- Subtle decorative elements -->
              <div style="position: absolute; top: -40px; right: -40px; width: 160px; height: 160px; border-radius: 50%; background: rgba(255,255,255,0.08);"></div>
              <div style="position: absolute; bottom: -30px; left: -30px; width: 120px; height: 120px; border-radius: 50%; background: rgba(255,255,255,0.08);"></div>
              
              <div class="d-flex align-center flex-wrap" style="position: relative; z-index: 2;">
                <v-avatar size="80" class="ml-6 elevation-4" color="white" style="border-radius: 12px;">
                  <img :src="logoImg" alt="جوستو" style="width: 100%; height: 100%; object-fit: contain; padding: 8px;" />
                </v-avatar>
                <div class="flex-grow-1">
                  <h1 class="text-h4 font-weight-bold text-white mb-2" style="letter-spacing: -0.5px;">
                    مرحباً، {{ authStore.user?.fullName }} 👋
                  </h1>
                  <p class="text-body-1 text-white mb-1" style="opacity: 0.95;">
                    لوحة تحكم إدارة المخزون والاستلام
                  </p>
                  <p class="text-body-2 text-white" style="opacity: 0.85;">
                    {{ currentDate }}
                  </p>
                </div>
              </div>
            </v-card>
          </v-col>
        </v-row>

        <!-- Storage Stats Cards -->
        <v-row class="mb-8">
          <!-- Pending Purchases Card -->
          <v-col cols="12" sm="6" lg="3">
            <v-card 
              class="stats-card pa-5"
              elevation="0"
              style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px; transition: all 0.3s ease; cursor: pointer;"
              @click="$router.push('/receiving')"
            >
              <div class="d-flex align-center justify-space-between mb-4">
                <div style="width: 48px; height: 48px; border-radius: 10px; background: #F59E0B; display: flex; align-items: center; justify-content: center;">
                  <PhClock :size="24" weight="duotone" color="white" />
                </div>
                <PhTrendUp :size="20" weight="bold" color="#F59E0B" />
              </div>
              <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">
                طلبات شراء معلقة
              </p>
              <h2 class="text-h4 font-weight-bold mb-1" style="color: var(--t-text);">
                {{ stats.pendingPurchases }}
              </h2>
            </v-card>
          </v-col>

          <!-- Partially Received Card -->
          <v-col cols="12" sm="6" lg="3">
            <v-card 
              class="stats-card pa-5"
              elevation="0"
              style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px; transition: all 0.3s ease; cursor: pointer;"
              @click="$router.push('/receiving')"
            >
              <div class="d-flex align-center justify-space-between mb-4">
                <div style="width: 48px; height: 48px; border-radius: 10px; background: #3B82F6; display: flex; align-items: center; justify-content: center;">
                  <PhStack :size="24" weight="duotone" color="white" />
                </div>
                <PhCheckCircle :size="20" weight="bold" color="#3B82F6" />
              </div>
              <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">
                طلبات جزئية الاستلام
              </p>
              <h2 class="text-h4 font-weight-bold mb-1" style="color: var(--t-text);">
                {{ stats.partialPurchases }}
              </h2>
            </v-card>
          </v-col>

          <!-- Low Stock Card -->
          <v-col cols="12" sm="6" lg="3">
            <v-card 
              class="stats-card pa-5"
              elevation="0"
              style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px; transition: all 0.3s ease; cursor: pointer;"
              @click="$router.push('/inventory')"
            >
              <div class="d-flex align-center justify-space-between mb-4">
                <div style="width: 48px; height: 48px; border-radius: 10px; background: #EF4444; display: flex; align-items: center; justify-content: center;">
                  <PhWarning :size="24" weight="duotone" color="white" />
                </div>
                <PhPackage :size="20" weight="bold" color="#EF4444" />
              </div>
              <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">
                تنبيه المخزون
              </p>
              <h2 class="text-h4 font-weight-bold mb-1" style="color: var(--t-text);">
                {{ stats.lowStock }}
              </h2>
            </v-card>
          </v-col>

          <!-- Total Inventory Items Card -->
          <v-col cols="12" sm="6" lg="3">
            <v-card 
              class="stats-card pa-5"
              elevation="0"
              style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px; transition: all 0.3s ease; cursor: pointer;"
              @click="$router.push('/inventory')"
            >
              <div class="d-flex align-center justify-space-between mb-4">
                <div style="width: 48px; height: 48px; border-radius: 10px; background: #046375; display: flex; align-items: center; justify-content: center;">
                  <PhPackage :size="24" weight="duotone" color="white" />
                </div>
                <PhCheckCircle :size="20" weight="bold" color="#10B981" />
              </div>
              <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">
                إجمالي المكونات
              </p>
              <h2 class="text-h4 font-weight-bold mb-1" style="color: var(--t-text);">
                {{ stats.totalInventoryItems }}
              </h2>
            </v-card>
          </v-col>

          <!-- Total Inventory Value Card -->
          <v-col cols="12" sm="6" lg="3">
            <v-card 
              class="stats-card pa-5"
              elevation="0"
              style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px; transition: all 0.3s ease; cursor: pointer;"
              @click="$router.push('/inventory')"
            >
              <div class="d-flex align-center justify-space-between mb-4">
                <div style="width: 48px; height: 48px; border-radius: 10px; background: #10B981; display: flex; align-items: center; justify-content: center;">
                  <PhCurrencyDollar :size="24" weight="duotone" color="white" />
                </div>
                <PhTrendUp :size="20" weight="bold" color="#10B981" />
              </div>
              <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">
                القيمة الإجمالية للمخزون
              </p>
              <h2 class="text-h4 font-weight-bold mb-1" style="color: var(--t-text);">
                {{ Number(stats.totalInventoryValue || 0).toLocaleString() }} د.ع
              </h2>
            </v-card>
          </v-col>
        </v-row>

        <!-- Quick Actions -->
        <v-row class="mb-8">
          <v-col cols="12">
            <div class="mb-5">
              <h2 class="text-h5 font-weight-bold mb-1" style="color: #046375; letter-spacing: -0.3px;">
                الإجراءات السريعة
              </h2>
              <p class="text-body-2" style="color: var(--t-text-dim);">
                الوصول السريع إلى الوظائف الأساسية
              </p>
            </div>
            
            <v-row>
              <v-col cols="12" sm="6" md="4" lg="3">
                <v-card
                  hover
                  @click="$router.push('/receiving')"
                  class="quick-action-card pa-5"
                  elevation="0"
                  style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px; cursor: pointer; transition: all 0.3s ease;"
                >
                  <div class="d-flex align-center mb-3">
                    <div style="width: 56px; height: 56px; border-radius: 12px; background: #F59E0B; display: flex; align-items: center; justify-content: center; margin-left: 12px;">
                      <PhPackage :size="28" weight="duotone" color="white" />
                    </div>
                    <div>
                      <h3 class="text-h6 font-weight-bold mb-1" style="color: var(--t-text);">استلام الطلبات</h3>
                      <p class="text-caption mb-0" style="color: var(--t-text-dim);">استلام طلبات الشراء</p>
                    </div>
                  </div>
                </v-card>
              </v-col>

              <v-col cols="12" sm="6" md="4" lg="3">
                <v-card
                  hover
                  @click="$router.push('/inventory')"
                  class="quick-action-card pa-5"
                  elevation="0"
                  style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px; cursor: pointer; transition: all 0.3s ease;"
                >
                  <div class="d-flex align-center mb-3">
                    <div style="width: 56px; height: 56px; border-radius: 12px; background: #046375; display: flex; align-items: center; justify-content: center; margin-left: 12px;">
                      <PhPackage :size="28" weight="duotone" color="white" />
                    </div>
                    <div>
                      <h3 class="text-h6 font-weight-bold mb-1" style="color: var(--t-text);">المخزون</h3>
                      <p class="text-caption mb-0" style="color: var(--t-text-dim);">إدارة المكونات</p>
                    </div>
                  </div>
                </v-card>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </v-container>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import AppLayout from '@/components/AppLayout.vue'
import logoImg from '@/assets/logo.png'
import { purchaseAPI, inventoryAPI } from '@/services/api'
import { useToast } from 'vue-toastification'
import { formatCurrentDateArabic } from '@/utils/dateFormatter'
import {
  PhClock, PhStack, PhWarning, PhPackage, PhCurrencyDollar,
  PhTrendUp, PhCheckCircle
} from '@phosphor-icons/vue'

const authStore = useAuthStore()
const toast = useToast()
// Figures that failed to load are shown as 0, so say so instead of passing them off as real
const warnLoad = (what, err) => toast.error(err?.response?.data?.message || `تعذّر تحميل ${what} — الأرقام المعروضة غير مكتملة`)

const stats = ref({
  pendingPurchases: 0,
  partialPurchases: 0,
  lowStock: 0,
  totalInventoryItems: 0,
  totalInventoryValue: 0
})

const loading = ref({
  stats: true
})

const currentDate = computed(() => {
  return formatCurrentDateArabic()
})

const loadDashboardData = async () => {
  loading.value.stats = true
  try {
    // Load purchases
    try {
      const purchaseResponse = await purchaseAPI.getAll()
      const purchases = Array.isArray(purchaseResponse?.data) ? purchaseResponse.data : []
      
      stats.value.pendingPurchases = purchases.filter(p => p.status === 'pending').length
      stats.value.partialPurchases = purchases.filter(p => p.status === 'partially_received').length
    } catch (err) {
      console.error('Failed to load purchases:', err)
      warnLoad('المشتريات', err)
      stats.value.pendingPurchases = 0
      stats.value.partialPurchases = 0
    }

    // Load low stock count
    try {
      const inventoryResponse = await inventoryAPI.getLowStock()
      stats.value.lowStock = Array.isArray(inventoryResponse?.data) 
        ? inventoryResponse.data.length 
        : 0
    } catch (err) {
      console.error('Failed to load low stock:', err)
      warnLoad('المواد منخفضة المخزون', err)
      stats.value.lowStock = 0
    }

    // Load total inventory items and value
    try {
      const inventoryResponse = await inventoryAPI.getAll()
      const inventory = Array.isArray(inventoryResponse?.data) ? inventoryResponse.data : []
      
      stats.value.totalInventoryItems = inventory.length
      stats.value.totalInventoryValue = inventory.reduce((sum, item) => {
        const stock = parseFloat(item.currentStock || 0)
        const cost = parseFloat(item.costPerUnit || 0)
        return sum + (stock * cost)
      }, 0)
    } catch (err) {
      console.error('Failed to load inventory:', err)
      warnLoad('المخزون', err)
      stats.value.totalInventoryItems = 0
      stats.value.totalInventoryValue = 0
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
.stats-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08) !important;
  border-color: #046375 !important;
}

.quick-action-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08) !important;
  border-color: #046375 !important;
}
</style>
