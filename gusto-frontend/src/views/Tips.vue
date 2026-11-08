<template>
  <AppLayout>
    <v-container fluid class="pa-6">
      <!-- Welcome Banner -->
      <v-row class="mb-6">
        <v-col cols="12">
          <v-card 
            class="pa-6 page-banner" 
            elevation="0"
          >
            <div style="position: absolute; top: -40px; right: -40px; width: 160px; height: 160px; border-radius: 50%; background: rgba(255,255,255,0.08);"></div>
            <div style="position: absolute; bottom: -30px; left: -30px; width: 120px; height: 120px; border-radius: 50%; background: rgba(255,255,255,0.08);"></div>
            
            <div class="d-flex align-center justify-space-between flex-wrap" style="position: relative; z-index: 2;">
              <div class="d-flex align-center flex-wrap">
                <v-avatar size="80" class="ml-6 elevation-4" color="white" style="border-radius: 12px;">
                  <img :src="logoImg" alt="جوستو" style="width: 100%; height: 100%; object-fit: contain; padding: 8px;" />
                </v-avatar>
                <div class="flex-grow-1">
                  <h1 class="text-h4 font-weight-bold text-white mb-2" style="letter-spacing: -0.5px;">
                    إدارة البقشيش
                  </h1>
                  <p class="text-body-1 text-white mb-1" style="opacity: 0.95;">
                    تسجيل ومتابعة البقشيش المستلم
                  </p>
                  <p class="text-body-2 text-white" style="opacity: 0.85;">
                    {{ currentDate }}
                  </p>
                </div>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Header Actions -->
      <div class="d-flex align-center justify-space-between mb-6 flex-wrap">
        <v-btn
          @click="openAddDialog"
          color="#046375"
          variant="flat"
          size="large"
          style="border-radius: 12px;"
        >
          <PhPlus :size="20" weight="bold" class="ml-1" />
          إضافة بقشيش جديد
        </v-btn>
        <div class="d-flex ga-2">
          <v-text-field
            v-model="filters.startDate"
            label="من"
            type="date"
            variant="outlined"
            density="comfortable"
            style="min-width: 200px;"
            @update:model-value="loadTips"
          />
          <v-text-field
            v-model="filters.endDate"
            label="إلى"
            type="date"
            variant="outlined"
            density="comfortable"
            style="min-width: 200px;"
            @update:model-value="loadTips"
          />
        </div>
      </div>

      <!-- Stats Cards -->
      <v-row class="mb-6">
        <v-col cols="12" sm="6" lg="3">
          <v-card
            elevation="0"
            style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;"
            class="pa-5"
          >
            <div class="d-flex align-center justify-space-between mb-4">
              <div style="width: 48px; height: 48px; border-radius: 10px; background: #10B981; display: flex; align-items: center; justify-content: center;">
                <PhCurrencyDollar :size="24" weight="duotone" color="white" />
              </div>
            </div>
            <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">
              إجمالي البقشيش
            </p>
            <h2 class="text-h4 font-weight-bold mb-1" style="color: var(--t-text);">
              {{ Number(stats.totalTips || 0).toLocaleString() }} د.ع
            </h2>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" lg="3">
          <v-card
            elevation="0"
            style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;"
            class="pa-5"
          >
            <div class="d-flex align-center justify-space-between mb-4">
              <div style="width: 48px; height: 48px; border-radius: 10px; background: #046375; display: flex; align-items: center; justify-content: center;">
                <PhList :size="24" weight="duotone" color="white" />
              </div>
            </div>
            <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">
              عدد السجلات
            </p>
            <h2 class="text-h4 font-weight-bold mb-1" style="color: var(--t-text);">
              {{ tips.length }}
            </h2>
          </v-card>
        </v-col>
      </v-row>

      <!-- Tips Table -->
      <v-card
        elevation="0"
        style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;"
      >
        <v-card-title class="pa-4" style="border-bottom: 1px solid var(--t-border-subtle);">
          <div class="text-h6 font-weight-bold" style="color: var(--t-text);">قائمة البقشيش</div>
        </v-card-title>
        <v-data-table
          :headers="headers"
          :items="tips"
          :items-per-page="15"
          density="comfortable"
          class="tips-table"
        >
          <template v-slot:item.tipDate="{ item }">
            <span style="color: var(--t-text-dim);">
              {{ formatDate(item.tipDate) }}
            </span>
          </template>
          <template v-slot:item.amount="{ item }">
            <span style="color: #10B981; font-weight: 600;">
              {{ Number(item.amount || 0).toLocaleString() }} د.ع
            </span>
          </template>
          <template v-slot:item.orderNumber="{ item }">
            <v-chip
              v-if="item.orderNumber"
              size="small"
              color="#3B82F6"
              variant="flat"
            >
              {{ item.orderNumber }}
            </v-chip>
            <span v-else style="color: var(--t-text-faint);">-</span>
          </template>
          <template v-slot:item.actions="{ item }">
            <v-btn
              icon
              variant="text"
              size="small"
              @click="editTip(item)"
              color="#3B82F6"
            >
              <PhPencilSimple :size="18" weight="bold" />
            </v-btn>
            <v-btn
              v-if="hasRole(['admin'])"
              icon
              variant="text"
              size="small"
              @click="deleteTip(item)"
              color="#EF4444"
            >
              <PhTrash :size="18" weight="bold" />
            </v-btn>
          </template>
        </v-data-table>
      </v-card>

      <!-- Add/Edit Dialog -->
      <v-dialog v-model="dialog" max-width="600" persistent>
        <v-card>
          <v-card-title class="pa-5" style="background: linear-gradient(135deg, #046375 0%, #1F7F90 100%); color: white; border-radius: 0;">
            <div class="d-flex align-center">
              <PhCurrencyDollar :size="24" weight="bold" class="ml-2" />
              {{ editingTip ? 'تعديل بقشيش' : 'إضافة بقشيش جديد' }}
            </div>
          </v-card-title>
          <v-card-text class="pa-5">
            <v-form ref="formRef" v-model="valid">
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="tipForm.tipDate"
                    label="تاريخ البقشيش *"
                    type="date"
                    variant="outlined"
                    density="comfortable"
                    :rules="[v => !!v || 'تاريخ البقشيش مطلوب']"
                    required
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model.number="tipForm.amount"
                    label="المبلغ (د.ع) *"
                    type="number"
                    variant="outlined"
                    density="comfortable"
                    :rules="[v => !!v || 'المبلغ مطلوب', v => v > 0 || 'المبلغ يجب أن يكون أكبر من صفر']"
                    required
                  />
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model.number="tipForm.orderId"
                    label="رقم الطلب (اختياري)"
                    type="number"
                    variant="outlined"
                    density="comfortable"
                    hint="اتركه فارغاً إذا كان البقشيش غير مرتبط بطلب محدد"
                    persistent-hint
                  />
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
          <v-card-actions class="pa-5">
            <v-spacer />
            <v-btn
              variant="text"
              @click="closeDialog"
            >
              إلغاء
            </v-btn>
            <v-btn
              color="#046375"
              variant="flat"
              @click="saveTip"
            >
              حفظ
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import AppLayout from '@/components/AppLayout.vue'
import logoImg from '@/assets/logo.png'
import { tipAPI } from '@/services/api'
import { formatDate, formatCurrentDateArabic } from '@/utils/dateFormatter'
import { PhPlus, PhCurrencyDollar, PhList, PhPencilSimple, PhTrash } from '@phosphor-icons/vue'

const toast = useToast()
const authStore = useAuthStore()

const hasRole = (roles) => {
  return roles.includes(authStore.user?.role)
}

const currentDate = computed(() => {
  return formatCurrentDateArabic()
})

const tips = ref([])
const dialog = ref(false)
const editingTip = ref(null)
const formRef = ref(null)
const valid = ref(false)

const filters = ref({
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date().toISOString().split('T')[0]
})

const stats = ref({
  totalTips: 0
})

const tipForm = ref({
  tipDate: new Date().toISOString().split('T')[0],
  amount: 0,
  orderId: null
})

const headers = [
  { title: 'التاريخ', key: 'tipDate', align: 'start' },
  { title: 'المبلغ', key: 'amount' },
  { title: 'رقم الطلب', key: 'orderNumber' },
  { title: 'سجل بواسطة', key: 'recordedByName' },
  { title: 'الإجراءات', key: 'actions', sortable: false }
]

const loading = ref({
  tips: false
})

const loadTips = async () => {
  loading.value.tips = true
  try {
    const params = {
      startDate: filters.value.startDate,
      endDate: filters.value.endDate
    }
    
    const response = await tipAPI.getAll(params)
    tips.value = response.data || []
    
    // Calculate total
    stats.value.totalTips = tips.value.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)
  } catch (error) {
    toast.error('فشل تحميل البقشيش')
    console.error(error)
  } finally {
    loading.value.tips = false
  }
}

const openAddDialog = () => {
  editingTip.value = null
  tipForm.value = {
    tipDate: new Date().toISOString().split('T')[0],
    amount: 0,
    orderId: null
  }
  dialog.value = true
}

const editTip = (tip) => {
  editingTip.value = tip
  tipForm.value = {
    tipDate: tip.tipDate,
    amount: tip.amount,
    orderId: tip.orderId || null
  }
  dialog.value = true
}

const closeDialog = () => {
  dialog.value = false
  editingTip.value = null
  formRef.value?.reset()
}

const saveTip = async () => {
  const { valid: isValid } = await formRef.value.validate()
  if (!isValid) return

  try {
    const data = {
      tipDate: tipForm.value.tipDate,
      amount: tipForm.value.amount,
      orderId: tipForm.value.orderId || null
    }

    if (editingTip.value) {
      await tipAPI.update(editingTip.value.idTip, data)
      toast.success('تم تحديث البقشيش بنجاح')
    } else {
      await tipAPI.create(data)
      toast.success('تم إضافة البقشيش بنجاح')
    }
    closeDialog()
    loadTips()
  } catch (error) {
    toast.error(editingTip.value ? 'فشل تحديث البقشيش' : 'فشل إضافة البقشيش')
    console.error(error)
  }
}

const deleteTip = async (tip) => {
  if (!confirm(`هل أنت متأكد من حذف هذا البقشيش؟`)) return

  try {
    await tipAPI.delete(tip.idTip)
    toast.success('تم حذف البقشيش بنجاح')
    loadTips()
  } catch (error) {
    toast.error('فشل حذف البقشيش')
    console.error(error)
  }
}

onMounted(() => {
  loadTips()
})
</script>

<style scoped>
.tips-table :deep(.v-data-table__thead) {
  background: var(--t-surface-high);
}

.tips-table :deep(.v-data-table__thead th) {
  color: var(--t-text-dim) !important;
  font-weight: 600 !important;
  font-size: 0.875rem !important;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tips-table :deep(.v-data-table__tbody tr) {
  border-bottom: 1px solid var(--t-border-subtle);
}

.tips-table :deep(.v-data-table__tbody tr:hover) {
  background: var(--t-surface-high) !important;
}
</style>

