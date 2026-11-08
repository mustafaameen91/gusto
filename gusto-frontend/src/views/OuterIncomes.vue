<template>
  <AppLayout>
    <v-container fluid class="pa-6">
      <v-row class="mb-6">
        <v-col cols="12">
          <v-card elevation="0" class="pa-6 page-banner">
            <h1 class="text-h4 font-weight-bold text-white mb-1">إيرادات خارجية</h1>
            <p class="text-white mb-0" style="opacity: 0.9;">إيرادات من خارج المبيعات (استثمار، إيراد آخر، إلخ)</p>
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
        <v-spacer />
        <v-btn color="#046375" variant="flat" @click="showAddDialog = true">
          إضافة إيراد خارجي
        </v-btn>
      </div>
      <v-card elevation="0" style="border: 1px solid var(--t-border); border-radius: 12px;">
        <v-data-table
          :headers="headers"
          :items="items"
          :loading="loading"
          density="comfortable"
        >
          <template v-slot:item.incomeDate="{ item }">
            {{ formatDate(item.incomeDate) }}
          </template>
          <template v-slot:item.amount="{ item }">
            {{ Number(item.amount || 0).toLocaleString() }} د.ع
          </template>
          <template v-slot:item.incomeAccountName="{ item }">
            {{ item.incomeAccountName || '—' }}
          </template>
          <template v-slot:item.paymentMethod="{ item }">
            {{ item.paymentMethod === 'bank' ? 'بنك' : 'نقدي' }}
          </template>
        </v-data-table>
      </v-card>

      <v-dialog v-model="showAddDialog" max-width="480" persistent>
        <v-card>
          <v-card-title class="pa-4" style="border-bottom: 1px solid var(--t-border);">
            إضافة إيراد خارجي
          </v-card-title>
          <v-card-text class="pa-4">
            <v-text-field
              v-model.number="form.amount"
              label="المبلغ (د.ع)"
              type="number"
              min="0"
              step="0.01"
              variant="outlined"
              density="comfortable"
              class="mb-3"
              :error-messages="formErrors.amount"
              hide-details="auto"
            />
            <v-text-field
              v-model="form.incomeDate"
              label="التاريخ"
              type="date"
              variant="outlined"
              density="comfortable"
              class="mb-3"
              hide-details="auto"
            />
            <v-select
              v-model="form.incomeAccountId"
              :items="incomeAccounts"
              item-title="accountName"
              item-value="idAccount"
              label="نوع الإيراد (من دليل الحسابات)"
              variant="outlined"
              density="comfortable"
              class="mb-3"
              :error-messages="formErrors.incomeAccountId"
              hide-details="auto"
              no-data-text="لا توجد حسابات إيرادات. أضف حساباً من نوع «إيرادات» في دليل الحسابات."
            />
            <v-select
              v-model="form.paymentMethod"
              :items="paymentOptions"
              item-title="title"
              item-value="value"
              label="طريقة الاستلام"
              variant="outlined"
              density="comfortable"
              class="mb-3"
              hide-details="auto"
            />
            <v-textarea
              v-model="form.notes"
              label="ملاحظات (اختياري)"
              variant="outlined"
              density="comfortable"
              rows="2"
              hide-details="auto"
            />
            <v-checkbox
              v-model="form.linkToCurrentShift"
              label="ربط بالشفت الحالي (لترحيله مع إغلاق الشفت)"
              density="comfortable"
              hide-details
              class="mt-2"
            />
          </v-card-text>
          <v-card-actions class="pa-4 pt-0">
            <v-spacer />
            <v-btn variant="text" @click="showAddDialog = false">إلغاء</v-btn>
            <v-btn color="primary" :loading="saving" @click="submit">حفظ</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import AppLayout from '@/components/AppLayout.vue'
import { otherIncomesAPI, dailyReceiptAPI, accountAPI } from '@/services/api'

const toast = useToast()
const loading = ref(false)
const saving = ref(false)
const items = ref([])
const incomeAccounts = ref([])
const showAddDialog = ref(false)
const today = new Date()
const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
const filters = ref({
  startDate: firstOfMonth.toISOString().slice(0, 10),
  endDate: today.toISOString().slice(0, 10),
  limit: 200
})
const form = ref({
  amount: null,
  incomeDate: today.toISOString().slice(0, 10),
  incomeAccountId: null,
  paymentMethod: 'cash',
  notes: '',
  linkToCurrentShift: false
})
const formErrors = ref({ amount: '', incomeAccountId: '' })
const paymentOptions = [
  { title: 'نقدي (صندوق)', value: 'cash' },
  { title: 'بنك', value: 'bank' }
]

const headers = [
  { title: 'التاريخ', key: 'incomeDate' },
  { title: 'المبلغ', key: 'amount' },
  { title: 'نوع الإيراد', key: 'incomeAccountName' },
  { title: 'طريقة الاستلام', key: 'paymentMethod' },
  { title: 'سجل بواسطة', key: 'recordedByName' }
]

function formatDate(d) {
  if (!d) return '-'
  const x = new Date(d)
  return isNaN(x.getTime()) ? '-' : x.toLocaleDateString('ar-IQ')
}

async function load() {
  loading.value = true
  try {
    const res = await otherIncomesAPI.list(filters.value)
    items.value = Array.isArray(res.data) ? res.data : []
  } catch (e) {
    toast.error(e.response?.data?.message || 'فشل تحميل الإيرادات الخارجية')
    items.value = []
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.value = {
    amount: null,
    incomeDate: new Date().toISOString().slice(0, 10),
    incomeAccountId: null,
    paymentMethod: 'cash',
    notes: '',
    linkToCurrentShift: false
  }
  formErrors.value = { amount: '', incomeAccountId: '' }
}

async function submit() {
  const amount = form.value.amount
  const incomeAccountId = form.value.incomeAccountId
  formErrors.value = { amount: '', incomeAccountId: '' }
  if (amount == null || amount <= 0 || isNaN(amount)) {
    formErrors.value.amount = 'أدخل مبلغاً صحيحاً'
    return
  }
  if (incomeAccountId == null || incomeAccountId === '') {
    formErrors.value.incomeAccountId = 'اختر نوع الإيراد من دليل الحسابات'
    return
  }
  saving.value = true
  try {
    let dailyReceiptId
    if (form.value.linkToCurrentShift) {
      try {
        const cur = await dailyReceiptAPI.getCurrent()
        const rec = cur?.data
        if (rec) dailyReceiptId = rec.idDailyReceipt ?? rec.id
      } catch (_) {}
    }
    await otherIncomesAPI.create({
      amount: Number(amount),
      incomeDate: form.value.incomeDate,
      incomeAccountId: Number(incomeAccountId),
      paymentMethod: form.value.paymentMethod,
      notes: form.value.notes || undefined,
      ...(dailyReceiptId && { dailyReceiptId })
    })
    toast.success('تمت إضافة الإيراد')
    showAddDialog.value = false
    resetForm()
    await load()
  } catch (e) {
    toast.error(e.response?.data?.message || 'فشل الحفظ')
  } finally {
    saving.value = false
  }
}

async function loadIncomeAccounts() {
  try {
    const res = await accountAPI.getAll({ type: 'REVENUE' })
    incomeAccounts.value = Array.isArray(res.data) ? res.data : []
  } catch (_) {
    incomeAccounts.value = []
  }
}

onMounted(() => {
  load()
  loadIncomeAccounts()
})
</script>
