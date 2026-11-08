<template>
  <AppLayout>
    <v-container fluid class="pa-6">
      <v-row class="mb-6">
        <v-col cols="12">
          <v-card elevation="0" class="pa-6 page-banner">
            <h1 class="text-h4 font-weight-bold text-white mb-1">دفعات الطلبات</h1>
            <p class="text-white mb-0" style="opacity: 0.9;">سجلات الدفع لكل طلب (نقدي / بطاقة / إلخ)</p>
          </v-card>
        </v-col>
      </v-row>
      <div class="d-flex flex-wrap align-center gap-4 mb-4">
        <v-text-field
          v-model="filters.startDate"
          label="من تاريخ"
          type="date"
          variant="outlined"
          density="compact"
          hide-details
          style="max-width: 180px;"
        />
        <v-text-field
          v-model="filters.endDate"
          label="إلى تاريخ"
          type="date"
          variant="outlined"
          density="compact"
          hide-details
          style="max-width: 180px;"
        />
        <v-btn color="#046375" variant="flat" :loading="loading" @click="load">
          بحث
        </v-btn>
      </div>
      <v-card elevation="0" style="border: 1px solid var(--t-border); border-radius: 12px;">
        <v-data-table
          :headers="headers"
          :items="payments"
          :loading="loading"
          density="comfortable"
          class="payments-table"
        >
          <template v-slot:item.amountReceived="{ item }">
            {{ Number(item.amountReceived || 0).toLocaleString() }} د.ع
          </template>
          <template v-slot:item.paymentDate="{ item }">
            {{ formatDate(item.paymentDate || item.createdAt) }}
          </template>
          <template v-slot:item.paymentMethod="{ item }">
            {{ paymentMethodLabel(item.paymentMethod) }}
          </template>
        </v-data-table>
      </v-card>
    </v-container>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import AppLayout from '@/components/AppLayout.vue'
import { paymentAPI } from '@/services/api'
import { todayBusinessDate, firstOfMonthYMD } from '@/utils/dateFormatter'

const toast = useToast()
const loading = ref(false)
const payments = ref([])
// Default: first day of current month → today, so recent payments show (not only today)
const today = todayBusinessDate()
const filters = ref({
  startDate: firstOfMonthYMD(today),
  endDate: today,
  limit: 200
})

const headers = [
  { title: 'رقم الطلب', key: 'orderNumber' },
  { title: 'المبلغ', key: 'amountReceived' },
  { title: 'طريقة الدفع', key: 'paymentMethod' },
  { title: 'الكاشير', key: 'cashierName' },
  { title: 'التاريخ', key: 'paymentDate' },
  { title: 'رقم الإيصال', key: 'receiptNumber' }
]

function formatDate(d) {
  if (!d) return '-'
  const x = new Date(d)
  return isNaN(x.getTime()) ? '-' : x.toLocaleDateString('ar-IQ')
}

function paymentMethodLabel(m) {
  const map = { cash: 'نقدي', card: 'بطاقة', bank_transfer: 'تحويل', wallet: 'محفظة' }
  return map[m] || m || '-'
}

async function load() {
  loading.value = true
  try {
    const res = await paymentAPI.list(filters.value)
    payments.value = Array.isArray(res.data) ? res.data : []
  } catch (e) {
    toast.error(e.response?.data?.message || 'فشل تحميل الدفعات')
    payments.value = []
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
