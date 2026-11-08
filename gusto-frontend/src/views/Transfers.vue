<template>
  <AppLayout>
    <v-container fluid class="pa-6">
      <!-- Header -->
      <v-row class="mb-6">
        <v-col cols="12">
          <v-card
            class="pa-6 page-banner"
            elevation="0"
          >
            <div style="position: absolute; top: -40px; right: -40px; width: 160px; height: 160px; border-radius: 50%; background: rgba(255,255,255,0.08);"></div>
            <div class="d-flex align-center flex-wrap" style="position: relative; z-index: 2;">
              <v-avatar size="80" class="ml-6 elevation-4" color="white" style="border-radius: 12px;">
                <img :src="logoImg" alt="جوستو" style="width: 100%; height: 100%; object-fit: contain; padding: 8px;" />
              </v-avatar>
              <div class="flex-grow-1">
                <h1 class="text-h4 font-weight-bold text-white mb-2">نقل للمخزن الداخلي (المطبخ)</h1>
                <p class="text-body-2 text-white" style="opacity: 0.9;">من المخزن الرئيسي → مخزن المطبخ (داخلي)</p>
                <p class="text-body-2 text-white" style="opacity: 0.85;">{{ currentDate }}</p>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Transfer form -->
      <v-card elevation="0" class="mb-6" style="border: 1px solid var(--t-border); border-radius: 12px;">
        <v-card-title class="d-flex align-center" style="background: var(--t-surface-high); border-bottom: 1px solid var(--t-border);">
          <PhArrowRight :size="22" weight="bold" color="#046375" class="ml-2" />
          تنفيذ نقل
        </v-card-title>
        <v-card-text class="pa-5">
          <v-row>
            <v-col cols="12" md="4">
              <v-select
                v-model="transferForm.ingredientId"
                :items="mainStock"
                item-title="ingredientName"
                item-value="ingredientId"
                label="المكون (من المخزن الرئيسي)"
                density="comfortable"
                variant="outlined"
                hide-details
                clearable
                :loading="loading.main"
              >
                <template v-slot:item="{ props, item }">
                  <v-list-item v-bind="props" :subtitle="`متوفر: ${Number(item.raw?.quantity ?? 0).toLocaleString()} ${item.raw?.unit ?? ''}`" />
                </template>
              </v-select>
            </v-col>
            <v-col cols="12" md="2">
              <v-text-field
                v-model.number="transferForm.quantity"
                type="number"
                min="0"
                step="0.001"
                label="الكمية"
                density="comfortable"
                variant="outlined"
                hide-details
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="transferForm.notes"
                label="ملاحظات (اختياري)"
                density="comfortable"
                variant="outlined"
                hide-details
              />
            </v-col>
            <v-col cols="12" md="2" class="d-flex align-center">
              <v-btn
                color="#046375"
                variant="flat"
                :loading="saving"
                :disabled="!transferForm.ingredientId || !(transferForm.quantity > 0)"
                @click="submitTransfer"
              >
                <PhArrowRight :size="20" weight="bold" class="ml-1" />
                تنفيذ النقل
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <v-row>
        <!-- Main stock -->
        <v-col cols="12" md="6">
          <v-card elevation="0" style="border: 1px solid var(--t-border); border-radius: 12px;">
            <v-card-title class="d-flex align-center" style="background: var(--t-surface-high); border-bottom: 1px solid var(--t-border);">
              <PhPackage :size="20" weight="bold" color="#046375" class="ml-2" />
              المخزن الرئيسي
            </v-card-title>
            <v-card-text class="pa-0">
              <v-table v-if="mainStock.length" density="comfortable">
                <thead>
                  <tr style="background: var(--t-border-subtle);">
                    <th class="text-right">المكون</th>
                    <th class="text-center">الكمية</th>
                    <th class="text-center">الوحدة</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in mainStock" :key="row.ingredientId">
                    <td class="text-right">{{ row.ingredientName }}</td>
                    <td class="text-center font-weight-medium">{{ Number(row.quantity).toLocaleString() }}</td>
                    <td class="text-center">{{ row.unit }}</td>
                  </tr>
                </tbody>
              </v-table>
              <v-progress-linear v-else-if="loading.main" indeterminate color="#046375" class="ma-4" />
              <p v-else class="pa-4 text-center text-medium-emphasis">لا توجد بيانات</p>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Barista Internal stock -->
        <v-col cols="12" md="6">
          <v-card elevation="0" style="border: 1px solid var(--t-border); border-radius: 12px;">
            <v-card-title class="d-flex align-center" style="background: var(--t-surface-high); border-bottom: 1px solid var(--t-border);">
              <PhCoffee :size="20" weight="bold" color="#046375" class="ml-2" />
              مخزن المطبخ (داخلي)
            </v-card-title>
            <v-card-text class="pa-0">
              <v-table v-if="baristaStock.length" density="comfortable">
                <thead>
                  <tr style="background: var(--t-border-subtle);">
                    <th class="text-right">المكون</th>
                    <th class="text-center">الكمية</th>
                    <th class="text-center">الوحدة</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in baristaStock" :key="row.ingredientId">
                    <td class="text-right">{{ row.ingredientName }}</td>
                    <td class="text-center font-weight-medium">{{ Number(row.quantity).toLocaleString() }}</td>
                    <td class="text-center">{{ row.unit }}</td>
                  </tr>
                </tbody>
              </v-table>
              <v-progress-linear v-else-if="loading.barista" indeterminate color="#046375" class="ma-4" />
              <p v-else class="pa-4 text-center text-medium-emphasis">لا توجد بيانات أو لم يُنقل شيء بعد</p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Recent transfers -->
      <v-card elevation="0" class="mt-6" style="border: 1px solid var(--t-border); border-radius: 12px;">
        <v-card-title class="d-flex align-center justify-space-between" style="background: var(--t-surface-high); border-bottom: 1px solid var(--t-border);">
          <span class="d-flex align-center">
            <PhClockCounterClockwise :size="20" weight="bold" color="#046375" class="ml-2" />
            سجل النقلات
          </span>
          <v-btn variant="text" size="small" @click="loadTransfers">
            <PhArrowClockwise :size="18" weight="bold" />
          </v-btn>
        </v-card-title>
        <v-card-text class="pa-0">
          <v-table v-if="transfers.length" density="comfortable">
            <thead>
              <tr style="background: var(--t-border-subtle);">
                <th class="text-right">التاريخ</th>
                <th class="text-right">المكون</th>
                <th class="text-center">الكمية</th>
                <th class="text-right">من قام بالنقل</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in transfers" :key="row.idTransfer">
                <td class="text-right text-body-2">{{ formatDate(row.transferredAt) }}</td>
                <td class="text-right">{{ row.ingredientName }}</td>
                <td class="text-center">{{ Number(row.quantity).toLocaleString() }} {{ row.unit }}</td>
                <td class="text-right text-body-2">{{ row.transferredByName || '—' }}</td>
              </tr>
            </tbody>
          </v-table>
          <v-progress-linear v-else-if="loading.transfers" indeterminate color="#046375" class="ma-4" />
          <p v-else class="pa-4 text-center text-medium-emphasis">لا توجد نقلات مسجلة</p>
        </v-card-text>
      </v-card>
    </v-container>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ingredientStockAPI, transferAPI } from '@/services/api'
import { useToast } from 'vue-toastification'
import { formatCurrentDateArabic } from '@/utils/dateFormatter'
import logoImg from '@/assets/logo.png'
import AppLayout from '@/components/AppLayout.vue'
import { PhArrowRight, PhPackage, PhCoffee, PhClockCounterClockwise, PhArrowClockwise } from '@phosphor-icons/vue'

const toast = useToast()
const currentDate = computed(() => formatCurrentDateArabic())

const mainStock = ref([])
const baristaStock = ref([])
const transfers = ref([])
const loading = ref({ main: false, barista: false, transfers: false })
const saving = ref(false)

const BARISTA_LOCATION_ID = 2

const transferForm = ref({
  ingredientId: null,
  ingredientName: '',
  quantity: null,
  notes: ''
})

async function loadMainStock() {
  loading.value.main = true
  try {
    const res = await ingredientStockAPI.getMain()
    mainStock.value = Array.isArray(res.data) ? res.data : []
  } catch (e) {
    mainStock.value = []
    toast.error('فشل تحميل المخزن الرئيسي')
  } finally {
    loading.value.main = false
  }
}

async function loadBaristaStock() {
  loading.value.barista = true
  try {
    const res = await ingredientStockAPI.getByLocation(BARISTA_LOCATION_ID)
    baristaStock.value = Array.isArray(res.data) ? res.data : []
  } catch (e) {
    baristaStock.value = []
    toast.error('فشل تحميل مخزن المطبخ (داخلي)')
  } finally {
    loading.value.barista = false
  }
}

async function loadTransfers() {
  loading.value.transfers = true
  try {
    const res = await transferAPI.getAll({ limit: 30 })
    transfers.value = Array.isArray(res.data) ? res.data : []
  } catch (e) {
    transfers.value = []
    toast.error('فشل تحميل سجل النقلات')
  } finally {
    loading.value.transfers = false
  }
}

function formatDate(d) {
  if (!d) return '—'
  const dt = new Date(d)
  return dt.toLocaleDateString('ar-EG', { dateStyle: 'short' }) + ' ' + dt.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
}

async function submitTransfer() {
  const id = transferForm.value.ingredientId
  const qty = Number(transferForm.value.quantity)
  if (!id || !(qty > 0)) {
    toast.error('اختر مكوناً وكمية صحيحة')
    return
  }
  const mainRow = mainStock.value.find(r => r.ingredientId === id)
  if (mainRow && qty > Number(mainRow.quantity)) {
    toast.error('الكمية أكبر من المتوفر في المخزن الرئيسي')
    return
  }
  saving.value = true
  try {
    await transferAPI.create({
      ingredientId: id,
      quantity: qty,
      notes: transferForm.value.notes || undefined
    })
    toast.success('تم النقل بنجاح')
    transferForm.value = { ingredientId: null, ingredientName: '', quantity: null, notes: '' }
    await Promise.all([loadMainStock(), loadBaristaStock(), loadTransfers()])
  } catch (e) {
    toast.error(e.response?.data?.message || 'فشل تنفيذ النقل')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadMainStock()
  loadBaristaStock()
  loadTransfers()
})
</script>
