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
                    إدارة الديون
                  </h1>
                  <p class="text-body-1 text-white mb-1" style="opacity: 0.95;">
                    إدارة الديون والمدين والدائن
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
      <div class="d-flex align-center justify-space-between mb-6 flex-wrap ga-2">
        <v-btn
          @click="openAddDialog"
          color="#046375"
          variant="flat"
          size="large"
          style="border-radius: 12px;"
        >
          <PhPlus :size="20" weight="bold" class="ml-1" />
          إضافة دين جديد
        </v-btn>
        <v-btn
          v-if="hasRole(['admin'])"
          @click="openTransferDialog"
          color="#6366F1"
          variant="flat"
          size="large"
          style="border-radius: 12px;"
        >
          <PhArrowsLeftRight :size="20" weight="bold" class="ml-1" />
          تحويل دين بين الموردين
        </v-btn>
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
              <div style="width: 48px; height: 48px; border-radius: 10px; background: #046375; display: flex; align-items: center; justify-content: center;">
                <PhUsers :size="24" weight="duotone" color="white" />
              </div>
            </div>
            <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">
              عدد الديون
            </p>
            <h2 v-if="!loading.stats" class="text-h4 font-weight-bold mb-1" style="color: var(--t-text);">
              {{ suppliers.length }}
            </h2>
            <v-skeleton-loader v-else type="text" width="60" />
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" lg="3">
          <v-card
            elevation="0"
            style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;"
            class="pa-5"
          >
            <div class="d-flex align-center justify-space-between mb-4">
              <div style="width: 48px; height: 48px; border-radius: 10px; background: #EF4444; display: flex; align-items: center; justify-content: center;">
                <PhCurrencyDollar :size="24" weight="duotone" color="white" />
              </div>
            </div>
            <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">
              إجمالي الديون
            </p>
            <h2 v-if="!loading.stats" class="text-h4 font-weight-bold mb-1" style="color: var(--t-text);">
              {{ Number(stats.totalDebt || 0).toLocaleString() }} د.ع
            </h2>
            <v-skeleton-loader v-else type="text" width="120" />
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" lg="3">
          <v-card
            elevation="0"
            style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;"
            class="pa-5"
          >
            <div class="d-flex align-center justify-space-between mb-4">
              <div style="width: 48px; height: 48px; border-radius: 10px; background: #10B981; display: flex; align-items: center; justify-content: center;">
                <PhMoney :size="24" weight="duotone" color="white" />
              </div>
            </div>
            <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">
              إجمالي المسدد
            </p>
            <h2 v-if="!loading.stats" class="text-h4 font-weight-bold mb-1" style="color: var(--t-text);">
              {{ Number(stats.totalPaid || 0).toLocaleString() }} د.ع
            </h2>
            <v-skeleton-loader v-else type="text" width="120" />
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" lg="3">
          <v-card
            elevation="0"
            style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;"
            class="pa-5"
          >
            <div class="d-flex align-center justify-space-between mb-4">
              <div style="width: 48px; height: 48px; border-radius: 10px; background: #F59E0B; display: flex; align-items: center; justify-content: center;">
                <PhReceipt :size="24" weight="duotone" color="white" />
              </div>
            </div>
            <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">
              المتبقي
            </p>
            <h2 v-if="!loading.stats" class="text-h4 font-weight-bold mb-1" :style="{ color: (stats.remaining || 0) >= 0 ? '#111827' : '#10B981' }">
              {{ Number(stats.remaining || 0).toLocaleString() }} د.ع
            </h2>
            <v-skeleton-loader v-else type="text" width="120" />
          </v-card>
        </v-col>
      </v-row>

      <!-- Suppliers Table -->
      <v-card
        elevation="0"
        style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;"
      >
        <v-card-title class="pa-4" style="border-bottom: 1px solid var(--t-border-subtle);">
          <div class="d-flex align-center justify-space-between flex-wrap ga-3">
            <div class="text-h6 font-weight-bold" style="color: var(--t-text);">قائمة الديون</div>
            <div class="d-flex align-center" style="gap: 8px;">
              <v-text-field
                v-model="searchByName"
                placeholder="البحث بالاسم..."
                variant="outlined"
                density="compact"
                hide-details
                clearable
                style="max-width: 280px;"
                class="suppliers-search"
              >
                <template v-slot:prepend-inner>
                  <PhMagnifyingGlass :size="20" weight="bold" color="#6B7280" />
                </template>
              </v-text-field>
              <v-btn
                color="success"
                variant="outlined"
                size="small"
                prepend-icon="mdi-microsoft-excel"
                :disabled="!suppliers || suppliers.length === 0"
                @click="exportSuppliersToExcel"
              >
                Excel
              </v-btn>
            </div>
          </div>
        </v-card-title>
        <v-data-table
          :headers="headers"
          :items="filteredSuppliers"
          :items-per-page="15"
          :loading="loading.suppliers"
          density="comfortable"
          class="suppliers-table"
        >
          <template v-slot:item.initialDebt="{ item }">
            <span style="color: var(--t-text-dim);">{{ Number(item.initialDebt || 0).toLocaleString() }} د.ع</span>
          </template>
          <template v-slot:item.currentDebt="{ item }">
            <span :style="{ fontWeight: 600, color: (Number(item.currentDebt) || 0) > 0 ? '#DC2626' : '#6B7280' }">
              {{ Number(item.currentDebt || 0).toLocaleString() }} د.ع
            </span>
          </template>
          <template v-slot:item.actions="{ item }">
            <v-btn
              icon
              variant="text"
              size="small"
              @click="viewProfile(item)"
              color="#046375"
            >
              <PhEye :size="18" weight="bold" />
            </v-btn>
            <v-btn
              icon
              variant="text"
              size="small"
              @click="editSupplier(item)"
              color="#3B82F6"
            >
              <PhPencilSimple :size="18" weight="bold" />
            </v-btn>
            <v-btn
              icon
              variant="text"
              size="small"
              @click="deleteSupplier(item)"
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
              <PhUsers :size="24" weight="bold" class="ml-2" />
              {{ editingSupplier ? 'تعديل دين' : 'إضافة دين جديد' }}
            </div>
          </v-card-title>
          <v-card-text class="pa-5">
            <v-form ref="formRef" v-model="valid">
              <v-row>
                <v-col cols="12">
                  <v-text-field
                    v-model="supplierForm.supplierName"
                    label="اسم الدائن *"
                    variant="outlined"
                    density="comfortable"
                    :rules="[v => !!v || 'اسم الدائن مطلوب']"
                    required
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="supplierForm.supplierPhone"
                    label="رقم الهاتف"
                    variant="outlined"
                    density="comfortable"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model.number="supplierForm.initialDebt"
                    label="الدين الابتدائي (د.ع)"
                    type="number"
                    variant="outlined"
                    density="comfortable"
                    :rules="[v => v >= 0 || 'الدين يجب أن يكون أكبر من أو يساوي صفر']"
                  />
                </v-col>
                <v-col cols="12">
                  <v-textarea
                    v-model="supplierForm.supplierAddress"
                    label="العنوان"
                    variant="outlined"
                    density="comfortable"
                    rows="2"
                  />
                </v-col>
                <v-col cols="12">
                  <v-textarea
                    v-model="supplierForm.notes"
                    label="ملاحظات"
                    variant="outlined"
                    density="comfortable"
                    rows="3"
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
              @click="saveSupplier"
            >
              حفظ
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Transfer debt between suppliers dialog -->
      <v-dialog v-model="transferDialog" max-width="460" persistent>
        <v-card>
          <v-card-title class="pa-4" style="border-bottom: 1px solid var(--t-border);">
            تحويل دين بين الموردين
          </v-card-title>
          <v-card-text class="pa-4">
            <v-select
              v-model="transferForm.fromSupplierId"
              :items="suppliers"
              item-title="supplierName"
              item-value="idSupplier"
              label="من مورد"
              variant="outlined"
              density="comfortable"
              class="mb-3"
              hide-details="auto"
            />
            <v-select
              v-model="transferForm.toSupplierId"
              :items="suppliers"
              item-title="supplierName"
              item-value="idSupplier"
              label="إلى مورد"
              variant="outlined"
              density="comfortable"
              class="mb-3"
              hide-details="auto"
            />
            <v-text-field
              v-model.number="transferForm.amount"
              label="المبلغ (د.ع)"
              type="number"
              min="0"
              step="0.01"
              variant="outlined"
              density="comfortable"
              class="mb-3"
              :error-messages="transferErrors.amount"
              hide-details="auto"
            />
            <v-text-field
              v-model="transferForm.transferDate"
              label="التاريخ"
              type="date"
              variant="outlined"
              density="comfortable"
              class="mb-3"
              hide-details="auto"
            />
            <v-textarea
              v-model="transferForm.notes"
              label="ملاحظات (اختياري)"
              variant="outlined"
              density="comfortable"
              rows="2"
              hide-details="auto"
            />
          </v-card-text>
          <v-card-actions class="pa-4 pt-0">
            <v-spacer />
            <v-btn variant="text" @click="closeTransferDialog">إلغاء</v-btn>
            <v-btn color="#6366F1" variant="flat" :loading="loading.transfer" @click="submitTransfer">تحويل</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import AppLayout from '@/components/AppLayout.vue'
import logoImg from '@/assets/logo.png'
import { supplierAPI } from '@/services/api'
import { formatCurrentDateArabic } from '@/utils/dateFormatter'
import { PhPlus, PhUsers, PhEye, PhPencilSimple, PhTrash, PhCurrencyDollar, PhMoney, PhReceipt, PhMagnifyingGlass, PhArrowsLeftRight } from '@phosphor-icons/vue'
import { useAuthStore } from '@/stores/auth'
import * as XLSX from 'xlsx'

const toast = useToast()
const router = useRouter()
const authStore = useAuthStore()
const hasRole = (roles) => roles.includes(authStore.user?.role)

const currentDate = computed(() => {
  return formatCurrentDateArabic()
})

const searchByName = ref('')
const suppliers = ref([])

const filteredSuppliers = computed(() => {
  const q = (searchByName.value || '').trim().toLowerCase()
  if (!q) return suppliers.value
  return suppliers.value.filter(s => (s.supplierName || '').toLowerCase().includes(q))
})
const dialog = ref(false)
const editingSupplier = ref(null)
const formRef = ref(null)
const valid = ref(false)
const stats = ref({
  totalDebt: 0,
  totalPaid: 0,
  remaining: 0
})

const headers = [
  { title: 'اسم الدائن', key: 'supplierName', align: 'start' },
  { title: 'رقم الهاتف', key: 'supplierPhone' },
  { title: 'الدين الابتدائي', key: 'initialDebt' },
  { title: 'ما علينا (الحالي)', key: 'currentDebt', align: 'end' },
  { title: 'الإجراءات', key: 'actions', sortable: false }
]

const supplierForm = ref({
  supplierName: '',
  supplierPhone: '',
  supplierAddress: '',
  initialDebt: 0,
  notes: ''
})

const loading = ref({
  suppliers: false,
  stats: false,
  transfer: false
})
const transferDialog = ref(false)
const transferForm = ref({
  fromSupplierId: null,
  toSupplierId: null,
  amount: null,
  transferDate: new Date().toISOString().slice(0, 10),
  notes: ''
})
const transferErrors = ref({ amount: '' })

const exportSuppliersToExcel = () => {
  try {
    const list = filteredSuppliers.value || []
    if (list.length === 0) {
      toast.warning('لا توجد بيانات للتصدير')
      return
    }

    const workbook = XLSX.utils.book_new()
    const today = new Date().toISOString().split('T')[0]

    // Helper: total payments = SupplierPayments + Expense-based payments
    const totalPaidOf = (s) => Number(s.totalPayments || 0) + Number(s.totalExpensePayments || 0)

    // Totals
    const totals = list.reduce((acc, s) => {
      acc.initialDebt        += Number(s.initialDebt || 0)
      acc.unpaidPurchases    += Number(s.unpaidPurchases || 0)
      acc.totalServiceDebt   += Number(s.totalServiceDebt || 0)
      acc.totalCredits       += Number(s.totalCredits || 0)
      acc.totalPayments      += Number(s.totalPayments || 0)
      acc.totalExpensePayments += Number(s.totalExpensePayments || 0)
      acc.transferOut        += Number(s.transferOut || 0)
      acc.transferIn         += Number(s.transferIn || 0)
      acc.currentDebt        += Number(s.currentDebt || 0)
      acc.totalPaid          += totalPaidOf(s)
      return acc
    }, {
      initialDebt: 0, unpaidPurchases: 0, totalServiceDebt: 0, totalCredits: 0,
      totalPayments: 0, totalExpensePayments: 0,
      transferOut: 0, transferIn: 0, currentDebt: 0, totalPaid: 0
    })

    // ─── Sheet 1: Summary (you asked for) ───
    // Name | Initial debt | Total paid | What we owe now
    const summaryData = [
      ['ملخص الديون - مطعم جوستو', '', '', ''],
      [`التاريخ: ${today}`, '', '', ''],
      ['', '', '', ''],
      ['اسم المورد', 'الدين الابتدائي (د.ع)', 'إجمالي المدفوع (د.ع)', 'ما علينا حالياً (د.ع)'],
      ...list.map(s => [
        s.supplierName || '',
        Number(s.initialDebt || 0),
        totalPaidOf(s),
        Number(s.currentDebt || 0)
      ]),
      ['', '', '', ''],
      ['الإجمالي', totals.initialDebt, totals.totalPaid, totals.currentDebt]
    ]
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
    summarySheet['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 20 }, { wch: 22 }]
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'ملخص الديون')

    // ─── Sheet 2: Full breakdown ───
    const fullHeader = [
      'اسم المورد', 'الهاتف',
      'الدين الابتدائي', 'مشتريات غير مسددة', 'فواتير خدمات',
      'مديونيات (Credits)', 'مدفوعات (SupplierPayments)', 'مدفوعات (من المصاريف)',
      'تحويل خارج', 'تحويل داخل',
      'ما علينا حالياً', 'الحالة'
    ]
    const fullRows = list.map(s => [
      s.supplierName || '',
      s.supplierPhone || '',
      Number(s.initialDebt || 0),
      Number(s.unpaidPurchases || 0),
      Number(s.totalServiceDebt || 0),
      Number(s.totalCredits || 0),
      Number(s.totalPayments || 0),
      Number(s.totalExpensePayments || 0),
      Number(s.transferOut || 0),
      Number(s.transferIn || 0),
      Number(s.currentDebt || 0),
      s.isActive ? 'نشط' : 'غير نشط'
    ])
    const fullData = [
      ['تقرير الموردين الكامل', '', '', '', '', '', '', '', '', '', '', ''],
      [`التاريخ: ${today}`, '', '', '', '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', '', '', '', ''],
      fullHeader,
      ...fullRows,
      ['', '', '', '', '', '', '', '', '', '', '', ''],
      [
        'الإجمالي', '',
        totals.initialDebt, totals.unpaidPurchases, totals.totalServiceDebt,
        totals.totalCredits, totals.totalPayments, totals.totalExpensePayments,
        totals.transferOut, totals.transferIn,
        totals.currentDebt, ''
      ]
    ]
    const fullSheet = XLSX.utils.aoa_to_sheet(fullData)
    fullSheet['!cols'] = [
      { wch: 28 }, { wch: 14 }, { wch: 16 }, { wch: 18 }, { wch: 16 },
      { wch: 18 }, { wch: 22 }, { wch: 22 }, { wch: 14 }, { wch: 14 },
      { wch: 18 }, { wch: 10 }
    ]
    XLSX.utils.book_append_sheet(workbook, fullSheet, 'تفاصيل كاملة')

    XLSX.writeFile(workbook, `تقرير_الموردين_${today}.xlsx`)
    toast.success('تم تصدير تقرير الموردين بنجاح')
  } catch (error) {
    console.error('Export failed:', error)
    toast.error('فشل تصدير الملف')
  }
}

const loadSuppliers = async () => {
  loading.value.suppliers = true
  try {
    const response = await supplierAPI.getAll()
    suppliers.value = response.data || []
  } catch (error) {
    toast.error('فشل تحميل الديون')
    console.error(error)
  } finally {
    loading.value.suppliers = false
  }
}

const loadStats = async () => {
  loading.value.stats = true
  try {
    const response = await supplierAPI.getSummaryStats()
    stats.value = response.data || { totalDebt: 0, totalPaid: 0, remaining: 0 }
  } catch (error) {
    toast.error('فشل تحميل الإحصائيات')
    console.error(error)
  } finally {
    loading.value.stats = false
  }
}

const openAddDialog = () => {
  editingSupplier.value = null
  supplierForm.value = {
    supplierName: '',
    supplierPhone: '',
    supplierAddress: '',
    initialDebt: 0,
    notes: ''
  }
  dialog.value = true
}

const editSupplier = (supplier) => {
  editingSupplier.value = supplier
  supplierForm.value = {
    supplierName: supplier.supplierName,
    supplierPhone: supplier.supplierPhone || '',
    supplierAddress: supplier.supplierAddress || '',
    initialDebt: parseFloat(supplier.initialDebt || 0),
    notes: supplier.notes || ''
  }
  dialog.value = true
}

const viewProfile = (supplier) => {
  router.push(`/suppliers/${supplier.idSupplier}`)
}

const openTransferDialog = () => {
  transferForm.value = {
    fromSupplierId: null,
    toSupplierId: null,
    amount: null,
    transferDate: new Date().toISOString().slice(0, 10),
    notes: ''
  }
  transferErrors.value = { amount: '' }
  transferDialog.value = true
}

const closeTransferDialog = () => {
  transferDialog.value = false
}

const submitTransfer = async () => {
  const amount = transferForm.value.amount
  transferErrors.value = { amount: '' }
  if (amount == null || amount <= 0 || isNaN(amount)) {
    transferErrors.value.amount = 'أدخل مبلغاً صحيحاً'
    return
  }
  if (!transferForm.value.fromSupplierId || !transferForm.value.toSupplierId) {
    toast.error('اختر من المورد وإلى المورد')
    return
  }
  if (transferForm.value.fromSupplierId === transferForm.value.toSupplierId) {
    toast.error('من المورد وإلى المورد يجب أن يكونا مختلفين')
    return
  }
  loading.value.transfer = true
  try {
    await supplierAPI.createTransfer({
      fromSupplierId: transferForm.value.fromSupplierId,
      toSupplierId: transferForm.value.toSupplierId,
      amount: Number(amount),
      transferDate: transferForm.value.transferDate,
      notes: transferForm.value.notes || undefined
    })
    toast.success('تم تحويل الدين بنجاح')
    closeTransferDialog()
    loadSuppliers()
    loadStats()
  } catch (e) {
    toast.error(e.response?.data?.message || 'فشل التحويل')
  } finally {
    loading.value.transfer = false
  }
}

const closeDialog = () => {
  dialog.value = false
  editingSupplier.value = null
  formRef.value?.reset()
}

const saveSupplier = async () => {
  const { valid: isValid } = await formRef.value.validate()
  if (!isValid) return

  try {
    if (editingSupplier.value) {
      await supplierAPI.update(editingSupplier.value.idSupplier, supplierForm.value)
      toast.success('تم تحديث الدين بنجاح')
    } else {
      await supplierAPI.create(supplierForm.value)
      toast.success('تم إضافة الدين بنجاح')
    }
    closeDialog()
    loadSuppliers()
    loadStats()
  } catch (error) {
    toast.error(editingSupplier.value ? 'فشل تحديث الدين' : 'فشل إضافة الدين')
    console.error(error)
  }
}

const deleteSupplier = async (supplier) => {
  if (!confirm(`هل أنت متأكد من حذف الدين "${supplier.supplierName}"؟`)) return

  try {
    await supplierAPI.delete(supplier.idSupplier)
    toast.success('تم حذف الدين بنجاح')
    loadSuppliers()
    loadStats()
  } catch (error) {
    toast.error('فشل حذف الدين')
    console.error(error)
  }
}

onMounted(() => {
  loadSuppliers()
  loadStats()
})
</script>

<style scoped>
.suppliers-table :deep(.v-data-table__thead) {
  background: var(--t-surface-high);
}

.suppliers-table :deep(.v-data-table__thead th) {
  color: var(--t-text-dim) !important;
  font-weight: 600 !important;
  font-size: 0.875rem !important;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.suppliers-table :deep(.v-data-table__tbody tr) {
  border-bottom: 1px solid var(--t-border-subtle);
}

.suppliers-table :deep(.v-data-table__tbody tr:hover) {
  background: var(--t-surface-high) !important;
}
</style>

