<template>
  <AppLayout>
    <v-container fluid class="pa-6">
      <v-row class="mb-6">
        <v-col cols="12">
          <v-card
            class="pa-6 page-banner"
            elevation="0"
          >
            <div class="d-flex align-center justify-space-between flex-wrap" style="position: relative; z-index: 2;">
              <v-btn
                icon
                variant="text"
                color="white"
                @click="$router.push('/customers')"
                class="ml-4"
              >
                <PhArrowRight :size="24" weight="bold" />
              </v-btn>
              <div class="flex-grow-1">
                <h1 class="text-h4 font-weight-bold text-white mb-2">
                  {{ profile?.customer?.fullName || 'عميل' }}
                </h1>
                <p class="text-body-1 text-white" style="opacity: 0.95;">
                  {{ profile?.customer?.phone || '—' }}
                </p>
              </div>
              <v-btn
                color="white"
                variant="flat"
                class="text-none"
                @click="showReceiptDialog = true"
              >
                تسديد / استلام مبلغ
              </v-btn>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="mb-6">
        <v-col cols="12" sm="6" md="3">
          <v-card elevation="0" style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;" class="pa-5">
            <p class="text-body-2 mb-2" style="color: var(--t-text-dim);">إجمالي المبيعات آجل</p>
            <h2 class="text-h5 font-weight-bold" style="color: var(--t-text);">
              {{ Number(profile?.totalOrders || 0).toLocaleString() }} د.ع
            </h2>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card elevation="0" style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;" class="pa-5">
            <p class="text-body-2 mb-2" style="color: var(--t-text-dim);">المسدد</p>
            <h2 class="text-h5 font-weight-bold" style="color: #10B981;">
              {{ Number(profile?.totalPaid || 0).toLocaleString() }} د.ع
            </h2>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card elevation="0" style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;" class="pa-5">
            <p class="text-body-2 mb-2" style="color: var(--t-text-dim);">المتبقي (ما يستحق علينا)</p>
            <h2 class="text-h5 font-weight-bold" :style="{ color: (profile?.balance || 0) > 0 ? '#EF4444' : 'var(--t-text)' }">
              {{ Number(profile?.balance || 0).toLocaleString() }} د.ع
            </h2>
          </v-card>
        </v-col>
      </v-row>

      <v-tabs v-model="activeTab" bg-color="transparent" class="mb-4">
        <v-tab value="orders">طلبات آجل</v-tab>
        <v-tab value="receipts">المدفوعات</v-tab>
      </v-tabs>

      <v-window v-model="activeTab">
        <v-window-item value="orders">
          <v-card elevation="0" style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;">
            <v-card-title class="pa-4" style="border-bottom: 1px solid var(--t-border-subtle);">طلبات البيع آجل</v-card-title>
            <v-data-table
              :headers="orderHeaders"
              :items="profile?.orders || []"
              :items-per-page="15"
              :loading="loading"
              density="comfortable"
            >
              <template v-slot:item.orderDate="{ item }">
                {{ formatDate(item.orderDate) }}
              </template>
              <template v-slot:item.netAmount="{ item }">
                {{ Number(item.netAmount || 0).toLocaleString() }} د.ع
              </template>
            </v-data-table>
          </v-card>
        </v-window-item>
        <v-window-item value="receipts">
          <v-card elevation="0" style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;">
            <v-card-title class="pa-4" style="border-bottom: 1px solid var(--t-border-subtle);">مدفوعات العميل</v-card-title>
            <v-data-table
              :headers="receiptHeaders"
              :items="profile?.receipts || []"
              :items-per-page="15"
              :loading="loading"
              density="comfortable"
            >
              <template v-slot:item.receiptDate="{ item }">
                {{ formatDate(item.receiptDate) }}
              </template>
              <template v-slot:item.amount="{ item }">
                {{ Number(item.amount || 0).toLocaleString() }} د.ع
              </template>
            </v-data-table>
          </v-card>
        </v-window-item>
      </v-window>

      <!-- تسديد: تسجيل استلام مبلغ من العميل -->
      <v-dialog v-model="showReceiptDialog" max-width="480" persistent>
        <v-card>
          <v-card-title class="pa-4" style="border-bottom: 1px solid var(--t-border);">
            تسديد — استلام مبلغ من العميل
          </v-card-title>
          <v-card-text class="pa-4">
            <v-text-field
              v-model.number="receiptForm.amount"
              label="المبلغ (د.ع)"
              type="number"
              min="0"
              step="0.01"
              variant="outlined"
              density="comfortable"
              class="mb-3"
              :error-messages="receiptErrors.amount"
              hide-details="auto"
            />
            <v-text-field
              v-model="receiptForm.receiptDate"
              label="التاريخ"
              type="date"
              variant="outlined"
              density="comfortable"
              class="mb-3"
              hide-details="auto"
            />
            <v-select
              v-model="receiptForm.paymentMethod"
              :items="paymentMethodOptions"
              item-title="title"
              item-value="value"
              label="طريقة الدفع"
              variant="outlined"
              density="comfortable"
              class="mb-3"
              hide-details="auto"
            />
            <v-textarea
              v-model="receiptForm.notes"
              label="ملاحظات (اختياري)"
              variant="outlined"
              density="comfortable"
              rows="2"
              hide-details="auto"
            />
          </v-card-text>
          <v-card-actions class="pa-4 pt-0">
            <v-spacer />
            <v-btn variant="text" @click="showReceiptDialog = false">إلغاء</v-btn>
            <v-btn color="primary" :loading="receiptSaving" @click="submitReceipt">حفظ</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'
import AppLayout from '@/components/AppLayout.vue'
import { customerAPI } from '@/services/api'
import { formatDate } from '@/utils/dateFormatter'
import { PhArrowRight } from '@phosphor-icons/vue'

const toast = useToast()
const route = useRoute()

const profile = ref(null)
const loading = ref(false)
const activeTab = ref('orders')
const showReceiptDialog = ref(false)
const receiptSaving = ref(false)
const receiptForm = ref({
  amount: null,
  receiptDate: new Date().toISOString().slice(0, 10),
  paymentMethod: 'cash',
  notes: ''
})
const receiptErrors = ref({ amount: '' })
const paymentMethodOptions = [
  { title: 'نقدي', value: 'cash' },
  { title: 'تحويل', value: 'transfer' },
  { title: 'أخرى', value: 'other' }
]

const orderHeaders = [
  { title: 'رقم الطلب', key: 'orderNumber' },
  { title: 'التاريخ', key: 'orderDate' },
  { title: 'المبلغ الصافي', key: 'netAmount' },
  { title: 'الحالة', key: 'status' }
]

const receiptHeaders = [
  { title: 'التاريخ', key: 'receiptDate' },
  { title: 'المبلغ', key: 'amount' },
  { title: 'طريقة الدفع', key: 'paymentMethod' },
  { title: 'سجل بواسطة', key: 'recordedByName' }
]

async function loadProfile() {
  const id = route.params.id
  if (!id) return
  loading.value = true
  try {
    const res = await customerAPI.getProfile(id)
    profile.value = res.data
  } catch (e) {
    toast.error(e.response?.data?.message || 'فشل تحميل بيانات العميل')
    profile.value = null
  } finally {
    loading.value = false
  }
}

function resetReceiptForm() {
  receiptForm.value = {
    amount: null,
    receiptDate: new Date().toISOString().slice(0, 10),
    paymentMethod: 'cash',
    notes: ''
  }
  receiptErrors.value = { amount: '' }
}

async function submitReceipt() {
  const id = route.params.id
  const amount = receiptForm.value.amount
  receiptErrors.value = { amount: '' }
  if (amount == null || amount <= 0 || isNaN(amount)) {
    receiptErrors.value.amount = 'أدخل مبلغاً صحيحاً'
    return
  }
  receiptSaving.value = true
  try {
    await customerAPI.createReceipt(id, {
      amount: Number(amount),
      receiptDate: receiptForm.value.receiptDate,
      paymentMethod: receiptForm.value.paymentMethod,
      notes: receiptForm.value.notes || undefined
    })
    toast.success('تم تسجيل الاستلام بنجاح')
    showReceiptDialog.value = false
    resetReceiptForm()
    await loadProfile()
  } catch (e) {
    toast.error(e.response?.data?.message || 'فشل حفظ الإيصال')
  } finally {
    receiptSaving.value = false
  }
}

onMounted(loadProfile)
watch(() => route.params.id, loadProfile)
watch(showReceiptDialog, (open) => {
  if (open) resetReceiptForm()
})
</script>
