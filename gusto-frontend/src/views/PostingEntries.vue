<template>
  <AppLayout>
    <v-container fluid class="pa-6">
      <v-row class="mb-6">
        <v-col cols="12">
          <v-card
            elevation="0"
            class="pa-6 page-banner"
          >
            <div style="position: absolute; top: -40px; right: -40px; width: 160px; height: 160px; border-radius: 50%; background: rgba(255,255,255,0.08);"></div>
            <div style="position: relative; z-index: 1;">
              <h1 class="text-h4 font-weight-bold text-white mb-1">قيود الترحيل</h1>
              <p class="text-white mb-0" style="opacity: 0.9;">سجل القيود المحاسبية (ترحيل الشفت — مبيعات، مصروفات، إيرادات، تكلفة)</p>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <v-card elevation="0" style="border: 1px solid var(--t-border); border-radius: 12px; overflow: hidden;">
        <v-card-title class="pa-4" style="border-bottom: 1px solid var(--t-border-subtle);">
          <div class="text-h6 font-weight-bold" style="color: var(--t-text);">سجل القيود</div>
          <v-spacer />
          <v-select
            v-model="limit"
            :items="[25, 50, 100]"
            label="عدد القيود"
            variant="outlined"
            density="compact"
            hide-details
            style="max-width: 120px;"
            @update:model-value="load"
          />
        </v-card-title>
        <v-data-table
          :headers="headers"
          :items="entries"
          :loading="loading"
          density="comfortable"
          class="posting-entries-table"
          :items-per-page="-1"
          item-value="idJournalEntry"
          show-expand
        >
          <template v-slot:item.entryDate="{ item }">
            <span style="color: #ffffff;">{{ formatDate(item.entryDate) }}</span>
          </template>
          <template v-slot:item.sourceType="{ item }">
            <v-chip size="small" variant="tonal" color="primary">
              {{ sourceTypeLabel(item.sourceType) }}
            </v-chip>
          </template>
          <template v-slot:item.status="{ item }">
            <v-chip
              :color="item.status === 'POSTED' ? 'success' : 'warning'"
              size="small"
              variant="flat"
            >
              {{ item.status === 'POSTED' ? 'مرحّل' : 'مسودة' }}
            </v-chip>
          </template>
          <template v-slot:item.totalDebit="{ item }">
            <span style="font-weight: 600; color: #059669;">{{ Number(totalDebit(item)).toLocaleString() }} د.ع</span>
          </template>
          <template v-slot:item.totalCredit="{ item }">
            <span style="font-weight: 600; color: #DC2626;">{{ Number(totalCredit(item)).toLocaleString() }} د.ع</span>
          </template>
          <template v-slot:expanded-row="{ item }">
            <tr>
              <td :colspan="headers.length" class="pa-4" style="background: var(--t-surface-high);">
                <div class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 600;">تفاصيل القيد (مدين / دائن)</div>
                <v-table density="compact">
                  <thead>
                    <tr>
                      <th class="text-right">الحساب</th>
                      <th class="text-right">الوصف</th>
                      <th class="text-right">مدين</th>
                      <th class="text-right">دائن</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(line, idx) in (item.lines || [])" :key="idx">
                      <td>
                        <span class="font-weight-medium">{{ line.accountCode || '—' }}</span>
                        <span v-if="line.accountName" class="text-caption mr-2" style="color: var(--t-text-dim);">{{ line.accountName }}</span>
                      </td>
                      <td>{{ line.lineMemo || '—' }}</td>
                      <td style="color: #059669; font-weight: 500;">{{ line.debit > 0 ? Number(line.debit).toLocaleString() : '—' }}</td>
                      <td style="color: #DC2626; font-weight: 500;">{{ line.credit > 0 ? Number(line.credit).toLocaleString() : '—' }}</td>
                    </tr>
                  </tbody>
                </v-table>
              </td>
            </tr>
          </template>
          <template v-slot:no-data>
            <div class="pa-6 text-body-2" style="color: var(--t-text-dim);">
              لا توجد قيود مرحّلة. تُنشأ القيود تلقائياً عند إغلاق الشفت من صفحة «صندوق اليومية».
            </div>
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
import { journalEntryAPI } from '@/services/api'
import { formatDate } from '@/utils/dateFormatter'

const toast = useToast()
const loading = ref(false)
const entries = ref([])
const limit = ref(50)

const headers = [
  { title: 'التاريخ', key: 'entryDate', align: 'start', sortable: false },
  { title: 'المصدر', key: 'sourceType' },
  { title: 'الحالة', key: 'status' },
  { title: 'البيان', key: 'memo' },
  { title: 'إجمالي المدين', key: 'totalDebit', sortable: false },
  { title: 'إجمالي الدائن', key: 'totalCredit', sortable: false },
  { title: '', key: 'data-table-expand', sortable: false }
]

function sourceTypeLabel(type) {
  const map = {
    SHIFT_POST: 'ترحيل شفت',
    POS_SALE: 'بيع نقطة بيع',
    PURCHASE: 'مشتريات',
    EXPENSE: 'مصروف',
    AR_RECEIPT: 'قبض مدينين',
    AP_PAYMENT: 'دفع دائنين',
    INV_ADJ: 'تعديل مخزون'
  }
  return type ? (map[type] || type) : '—'
}

function totalDebit(entry) {
  if (!entry.lines || !entry.lines.length) return 0
  return entry.lines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0)
}

function totalCredit(entry) {
  if (!entry.lines || !entry.lines.length) return 0
  return entry.lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0)
}

async function load() {
  loading.value = true
  try {
    const res = await journalEntryAPI.getAll({ limit: limit.value })
    entries.value = Array.isArray(res.data) ? res.data : []
  } catch (e) {
    toast.error(e.response?.data?.message || 'فشل تحميل قيود الترحيل')
    entries.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  load()
})
</script>

<style scoped>
.posting-entries-table :deep(.v-data-table__thead th) {
  color: var(--t-text-dim) !important;
  font-weight: 600 !important;
}
</style>
