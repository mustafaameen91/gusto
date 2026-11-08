<template>
  <AppLayout>
    <v-container fluid class="pa-6">
      <!-- Banner -->
      <v-row class="mb-6">
        <v-col cols="12">
          <v-card class="pa-6 page-banner" elevation="0">
            <div style="position: absolute; top: -40px; right: -40px; width: 160px; height: 160px; border-radius: 50%; background: rgba(255,255,255,0.08);"></div>
            <div style="position: absolute; bottom: -30px; left: -30px; width: 120px; height: 120px; border-radius: 50%; background: rgba(255,255,255,0.08);"></div>
            <div class="d-flex align-center flex-wrap" style="position: relative; z-index: 2;">
              <v-avatar size="80" class="ml-6 elevation-4" color="white" style="border-radius: 12px;">
                <img :src="logoImg" alt="جوستو" style="width: 100%; height: 100%; object-fit: contain; padding: 8px;" />
              </v-avatar>
              <div>
                <h1 class="text-h4 font-weight-bold text-white mb-2" style="letter-spacing: -0.5px;">
                  المرتجعات والهدر
                </h1>
                <p class="text-body-1 text-white mb-1" style="opacity: 0.95;">
                  سجل جميع عمليات الإرجاع والاستبدال والهدر
                </p>
                <p class="text-body-2 text-white" style="opacity: 0.85;">{{ currentDate }}</p>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Filters -->
      <v-card elevation="0" style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;" class="mb-4">
        <v-card-text class="pa-4">
          <v-row>
            <v-col cols="12" sm="3">
              <v-select
                v-model="filterType"
                :items="typeOptions"
                label="نوع الإرجاع"
                variant="outlined"
                density="comfortable"
                clearable
                color="#046375"
              />
            </v-col>
            <v-col cols="12" sm="3">
              <v-text-field
                v-model="filterDate"
                label="التاريخ"
                type="date"
                variant="outlined"
                density="comfortable"
                clearable
                color="#046375"
              />
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field
                v-model="search"
                label="بحث (رقم الطلب...)"
                variant="outlined"
                density="comfortable"
                clearable
                color="#046375"
              >
                <template v-slot:prepend-inner>
                  <PhMagnifyingGlass :size="20" weight="bold" color="#6B7280" />
                </template>
              </v-text-field>
            </v-col>
            <v-col cols="12" sm="2">
              <v-btn color="#046375" variant="flat" @click="loadReturns" block style="border-radius: 8px; height: 48px;">
                <PhArrowClockwise :size="20" weight="bold" class="ml-1" />
                تحديث
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Stats -->
      <v-row class="mb-6">
        <v-col cols="12" sm="6" lg="3">
          <v-card elevation="0" style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;" class="pa-5">
            <div class="d-flex align-center justify-space-between mb-4">
              <div style="width: 48px; height: 48px; border-radius: 10px; background: #e74c3c; display: flex; align-items: center; justify-content: center;">
                <PhArrowUUpLeft :size="24" weight="duotone" color="white" />
              </div>
            </div>
            <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">إجمالي المرتجعات</p>
            <h2 class="text-h4 font-weight-bold" style="color: var(--t-text);">{{ filteredReturns.length }}</h2>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" lg="3">
          <v-card elevation="0" style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;" class="pa-5">
            <div class="d-flex align-center justify-space-between mb-4">
              <div style="width: 48px; height: 48px; border-radius: 10px; background: #F59E0B; display: flex; align-items: center; justify-content: center;">
                <PhTrash :size="24" weight="duotone" color="white" />
              </div>
            </div>
            <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">هدر</p>
            <h2 class="text-h4 font-weight-bold" style="color: var(--t-text);">{{ wasteCount }}</h2>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" lg="3">
          <v-card elevation="0" style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;" class="pa-5">
            <div class="d-flex align-center justify-space-between mb-4">
              <div style="width: 48px; height: 48px; border-radius: 10px; background: #046375; display: flex; align-items: center; justify-content: center;">
                <PhArrowsClockwise :size="24" weight="duotone" color="white" />
              </div>
            </div>
            <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">استبدال</p>
            <h2 class="text-h4 font-weight-bold" style="color: var(--t-text);">{{ exchangeCount }}</h2>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" lg="3">
          <v-card elevation="0" style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;" class="pa-5">
            <div class="d-flex align-center justify-space-between mb-4">
              <div style="width: 48px; height: 48px; border-radius: 10px; background: #e74c3c; display: flex; align-items: center; justify-content: center;">
                <PhCurrencyDollar :size="24" weight="duotone" color="white" />
              </div>
            </div>
            <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">إجمالي المبالغ المستردة</p>
            <h2 class="text-h4 font-weight-bold" style="color: #e74c3c;">{{ totalRefunded.toLocaleString() }} د.ع</h2>
          </v-card>
        </v-col>
      </v-row>

      <!-- Returns Table -->
      <v-card elevation="0" style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;">
        <v-card-title class="pa-4">
          <div class="text-h6 font-weight-bold" style="color: var(--t-text);">سجل المرتجعات</div>
        </v-card-title>
        <v-data-table
          :headers="headers"
          :items="filteredReturns"
          :items-per-page="20"
          :loading="loading"
          class="elevation-0 returns-table"
          :no-data-text="loading ? 'جاري التحميل...' : 'لا توجد مرتجعات'"
        >
          <template v-slot:item.orderNumber="{ item }">
            <div class="d-flex align-center">
              <PhReceipt :size="18" weight="bold" class="ml-2" style="color: #046375;" />
              <span class="font-weight-bold" style="color: #046375;">{{ item.orderNumber || '—' }}</span>
            </div>
          </template>

          <template v-slot:item.returnType="{ item }">
            <v-chip
              size="small"
              :color="item.returnType === 'exchange' ? 'warning' : item.returnType === 'waste' ? 'error' : 'info'"
              variant="tonal"
            >
              {{ returnTypeLabel(item.returnType) }}
            </v-chip>
          </template>

          <template v-slot:item.refundMethod="{ item }">
            <v-chip size="small" variant="outlined" :color="item.refundMethod === 'cash' ? '#046375' : 'info'">
              {{ item.refundMethod === 'cash' ? 'نقدي' : 'رصيد عميل' }}
            </v-chip>
          </template>

          <template v-slot:item.totalRefundAmount="{ item }">
            <span class="font-weight-bold" style="color: #e74c3c;">
              {{ Number(item.totalRefundAmount).toLocaleString() }} د.ع
            </span>
          </template>

          <template v-slot:item.returnDate="{ item }">
            {{ formatDateTime(item.returnDate) }}
          </template>

          <template v-slot:item.processedByName="{ item }">
            {{ item.processedByName || '—' }}
          </template>

          <template v-slot:item.actions="{ item }">
            <v-btn icon size="small" variant="text" style="color: #046375;" @click="viewReturnDetail(item)" title="التفاصيل">
              <PhEye :size="20" weight="bold" />
            </v-btn>
          </template>
        </v-data-table>
      </v-card>
    </v-container>

    <!-- Return Detail Dialog -->
    <v-dialog v-model="showDetail" max-width="750">
      <v-card v-if="selectedReturn" elevation="0" style="border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #c0392b, #e74c3c); padding: 24px;">
          <div class="d-flex align-center">
            <div style="width: 48px; height: 48px; border-radius: 10px; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; margin-left: 12px;">
              <PhArrowUUpLeft :size="24" weight="bold" color="white" />
            </div>
            <div>
              <h3 class="text-h6 font-weight-bold text-white mb-1">
                تفاصيل الإرجاع #{{ selectedReturn.idOrderReturn }}
              </h3>
              <p class="text-body-2 text-white" style="opacity: 0.85;">
                الطلب: {{ selectedReturn.orderNumber || '—' }}
              </p>
            </div>
          </div>
        </div>

        <v-card-text class="pa-6" style="background: var(--t-surface);">
          <!-- Meta -->
          <v-row class="mb-4">
            <v-col cols="6" sm="3">
              <div class="text-caption" style="color: var(--t-text-dim);">النوع</div>
              <v-chip size="small" :color="selectedReturn.returnType === 'exchange' ? 'warning' : 'error'" variant="tonal" class="mt-1">
                {{ returnTypeLabel(selectedReturn.returnType) }}
              </v-chip>
            </v-col>
            <v-col cols="6" sm="3">
              <div class="text-caption" style="color: var(--t-text-dim);">طريقة الاسترداد</div>
              <div class="text-body-1 mt-1">{{ selectedReturn.refundMethod === 'cash' ? 'نقدي' : 'رصيد عميل' }}</div>
            </v-col>
            <v-col cols="6" sm="3">
              <div class="text-caption" style="color: var(--t-text-dim);">التاريخ</div>
              <div class="text-body-2 mt-1">{{ formatDateTime(selectedReturn.returnDate) }}</div>
            </v-col>
            <v-col cols="6" sm="3">
              <div class="text-caption" style="color: var(--t-text-dim);">بواسطة</div>
              <div class="text-body-1 mt-1">{{ selectedReturn.processedByName || '—' }}</div>
            </v-col>
          </v-row>

          <div v-if="selectedReturn.notes" class="mb-4 pa-3" style="background: var(--t-surface-high); border-radius: 8px;">
            <div class="text-caption mb-1" style="color: var(--t-text-dim);">ملاحظات</div>
            <div style="color: var(--t-text);">{{ selectedReturn.notes }}</div>
          </div>

          <v-divider class="mb-4" />

          <!-- Items -->
          <div class="text-subtitle-1 font-weight-bold mb-3" style="color: var(--t-text);">الأصناف المرتجعة</div>

          <div v-if="detailLoading" class="text-center py-6">
            <v-progress-circular indeterminate color="#046375" />
          </div>

          <div v-else>
            <div
              v-for="ri in detailItems"
              :key="ri.idOrderReturnItem"
              class="return-detail-item mb-3 pa-4"
            >
              <div class="d-flex align-center justify-space-between mb-2">
                <div class="d-flex align-center">
                  <PhArrowUUpLeft :size="18" weight="bold" color="#e74c3c" class="ml-2" />
                  <span class="font-weight-bold" style="color: var(--t-text);">{{ ri.itemName }}</span>
                  <span class="text-body-2 mr-2" style="color: var(--t-text-dim);">× {{ ri.quantity }}</span>
                </div>
                <span class="font-weight-bold" style="color: #e74c3c;">{{ Number(ri.refundAmount).toLocaleString() }} د.ع</span>
              </div>
              <div class="d-flex align-center" style="gap: 8px;">
                <v-chip
                  size="x-small"
                  :color="ri.disposition === 'returned_to_stock' ? 'success' : 'warning'"
                  variant="tonal"
                >
                  {{ ri.disposition === 'returned_to_stock' ? 'أُعيد للمخزن' : 'هدر' }}
                </v-chip>
              </div>

              <!-- Replacement -->
              <div v-if="ri.replacementItemName" class="mt-2 pt-2" style="border-top: 1px dashed var(--t-border);">
                <div class="d-flex align-center justify-space-between">
                  <div class="d-flex align-center">
                    <PhArrowsClockwise :size="16" weight="bold" color="#046375" class="ml-2" />
                    <span style="color: var(--t-text);">بديل: {{ ri.replacementItemName }} × {{ ri.replacementQuantity }}</span>
                  </div>
                  <span class="font-weight-bold" style="color: #046375;">
                    {{ Number((ri.replacementPrice || 0) * (ri.replacementQuantity || 0)).toLocaleString() }} د.ع
                  </span>
                </div>
              </div>
            </div>

            <v-alert v-if="detailItems.length === 0" type="info" variant="tonal">لا توجد أصناف</v-alert>
          </div>

          <!-- Total -->
          <v-card class="mt-4 pa-4" elevation="0" style="background: var(--t-surface-high); border-radius: 12px; border: 1px solid var(--t-border);">
            <div class="d-flex justify-space-between align-center">
              <span class="font-weight-bold" style="color: var(--t-text);">المبلغ المسترد:</span>
              <span class="text-h5 font-weight-bold" style="color: #e74c3c;">
                {{ Number(selectedReturn.totalRefundAmount).toLocaleString() }} د.ع
              </span>
            </div>
          </v-card>
        </v-card-text>

        <v-divider />
        <v-card-actions class="pa-4" style="background: var(--t-surface-high);">
          <v-spacer />
          <v-btn variant="flat" color="#046375" @click="showDetail = false" style="border-radius: 8px;">
            <PhX :size="20" weight="bold" class="ml-1" />
            إغلاق
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { orderReturnAPI } from '@/services/api'
import { useToast } from 'vue-toastification'
import { formatCurrentDateArabic } from '@/utils/dateFormatter'
import logoImg from '@/assets/logo.png'
import AppLayout from '@/components/AppLayout.vue'
import {
  PhArrowUUpLeft, PhArrowsClockwise, PhTrash, PhReceipt,
  PhCurrencyDollar, PhMagnifyingGlass, PhArrowClockwise,
  PhEye, PhX
} from '@phosphor-icons/vue'

const toast = useToast()
const currentDate = computed(() => formatCurrentDateArabic())

const returns = ref([])
const loading = ref(false)
const search = ref('')
const filterType = ref(null)
const filterDate = ref(null)

const showDetail = ref(false)
const selectedReturn = ref(null)
const detailItems = ref([])
const detailLoading = ref(false)

const typeOptions = [
  { value: null, title: 'الكل' },
  { value: 'refund', title: 'إرجاع' },
  { value: 'exchange', title: 'استبدال' },
  { value: 'waste', title: 'هدر' }
]

const headers = [
  { title: '#', key: 'idOrderReturn', align: 'start', width: '60px' },
  { title: 'رقم الطلب', key: 'orderNumber' },
  { title: 'النوع', key: 'returnType' },
  { title: 'طريقة الاسترداد', key: 'refundMethod' },
  { title: 'المبلغ المسترد', key: 'totalRefundAmount' },
  { title: 'التاريخ', key: 'returnDate' },
  { title: 'بواسطة', key: 'processedByName' },
  { title: 'إجراءات', key: 'actions', sortable: false }
]

const returnTypeLabel = (type) => {
  const map = { refund: 'إرجاع', exchange: 'استبدال', waste: 'هدر' }
  return map[type] || type
}

const filteredReturns = computed(() => {
  let list = returns.value
  if (filterType.value) list = list.filter(r => r.returnType === filterType.value)
  if (filterDate.value) {
    list = list.filter(r => {
      if (!r.returnDate) return false
      return new Date(r.returnDate).toLocaleDateString('en-CA') === filterDate.value
    })
  }
  if (search.value) {
    const s = search.value.toLowerCase()
    list = list.filter(r =>
      (r.orderNumber && r.orderNumber.toLowerCase().includes(s)) ||
      (r.processedByName && r.processedByName.toLowerCase().includes(s)) ||
      (r.notes && r.notes.toLowerCase().includes(s))
    )
  }
  return list
})

const wasteCount = computed(() => filteredReturns.value.filter(r => r.returnType === 'waste').length)
const exchangeCount = computed(() => filteredReturns.value.filter(r => r.returnType === 'exchange').length)
const totalRefunded = computed(() => filteredReturns.value.reduce((s, r) => s + Number(r.totalRefundAmount || 0), 0))

const formatDateTime = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleString('ar-EG', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  })
}

const loadReturns = async () => {
  loading.value = true
  try {
    const res = await orderReturnAPI.getAll(200)
    returns.value = Array.isArray(res.data) ? res.data : []
  } catch (err) {
    console.error('[Returns] load error:', err)
    toast.error('فشل تحميل المرتجعات')
    returns.value = []
  } finally {
    loading.value = false
  }
}

const viewReturnDetail = async (ret) => {
  selectedReturn.value = ret
  showDetail.value = true
  detailItems.value = []
  detailLoading.value = true
  try {
    const res = await orderReturnAPI.getByOrder(ret.orderId)
    const list = Array.isArray(res.data) ? res.data : []
    const match = list.find(r => r.idOrderReturn === ret.idOrderReturn)
    detailItems.value = match?.items || []
  } catch (err) {
    toast.error('فشل تحميل تفاصيل الإرجاع')
  } finally {
    detailLoading.value = false
  }
}

onMounted(() => loadReturns())
</script>

<style scoped>
.returns-table :deep(.v-data-table__thead) {
  background: var(--t-surface-high);
}
.returns-table :deep(.v-data-table__thead th) {
  color: var(--t-text-dim) !important;
  font-weight: 600 !important;
  font-size: 0.875rem !important;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.returns-table :deep(.v-data-table__tbody tr) {
  border-bottom: 1px solid var(--t-border-subtle);
}
.returns-table :deep(.v-data-table__tbody tr:hover) {
  background: var(--t-surface-high) !important;
}
.return-detail-item {
  border: 1px solid var(--t-border);
  border-radius: 12px;
  background: var(--t-surface);
}
</style>
