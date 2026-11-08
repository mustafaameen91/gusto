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
            
            <div class="d-flex align-center justify-space-between flex-wrap" style="position: relative; z-index: 2;">
              <div class="d-flex align-center flex-wrap">
                <v-btn
                  icon
                  variant="text"
                  color="white"
                  @click="$router.push('/suppliers')"
                  class="ml-4"
                  aria-label="العودة إلى الموردين"
                  title="العودة إلى الموردين"
                >
                  <PhArrowRight :size="24" weight="bold" />
                </v-btn>
                <div class="flex-grow-1">
                  <h1 class="text-h4 font-weight-bold text-white mb-2" style="letter-spacing: -0.5px;">
                    {{ profile?.supplier?.supplierName || 'دين' }}
                  </h1>
                  <p class="text-body-1 text-white mb-1" style="opacity: 0.95;">
                    {{ profile?.supplier?.supplierPhone || 'لا يوجد رقم هاتف' }}
                  </p>
                </div>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Stats Cards: Remaining = Total debts − Paid − Credits − Transfers out -->
      <v-row class="mb-4">
        <v-col cols="12" sm="6" lg="4">
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
              مجموع الديون
            </p>
            <p class="text-caption mb-1" style="color: var(--t-text-faint);">أول المدة + مشتريات + خدمات + تحويلات واردة</p>
            <h2 class="text-h4 font-weight-bold mb-1" style="color: var(--t-text);">
              {{ Number(totalDebts || 0).toLocaleString() }} د.ع
            </h2>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" lg="4">
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
              مجموع المسدد
            </p>
            <p class="text-caption mb-1" style="color: var(--t-text-faint);">دفعات + مصروفات للمورد</p>
            <h2 class="text-h4 font-weight-bold mb-1" style="color: var(--t-text);">
              {{ Number(profile?.totalPayments || 0).toLocaleString() }} د.ع
            </h2>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" lg="4">
          <v-card
            elevation="0"
            style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;"
            class="pa-5"
          >
            <div class="d-flex align-center justify-space-between mb-4">
              <div style="width: 48px; height: 48px; border-radius: 10px; background: #D4A574; display: flex; align-items: center; justify-content: center;">
                <PhArrowUUpLeft :size="24" weight="duotone" color="white" />
              </div>
            </div>
            <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">
              مرتجعات / إشعارات دائنة
            </p>
            <p class="text-caption mb-1" style="color: var(--t-text-faint);">مرتجعات مشتريات وإشعارات دائنة من المورد</p>
            <h2 class="text-h4 font-weight-bold mb-1" style="color: var(--t-text);">
              {{ Number(profile?.totalCredits || 0).toLocaleString() }} د.ع
            </h2>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" lg="4">
          <v-card
            elevation="0"
            style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;"
            class="pa-5"
          >
            <div class="d-flex align-center justify-space-between mb-4">
              <div style="width: 48px; height: 48px; border-radius: 10px; background: #046375; display: flex; align-items: center; justify-content: center;">
                <PhArrowsLeftRight :size="24" weight="duotone" color="white" />
              </div>
            </div>
            <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">
              تحويلات صادرة
            </p>
            <p class="text-caption mb-1" style="color: var(--t-text-faint);">ديون محوّلة من هذا المورد إلى مورد آخر</p>
            <h2 class="text-h4 font-weight-bold mb-1" style="color: var(--t-text);">
              {{ Number(profile?.transferOut || 0).toLocaleString() }} د.ع
            </h2>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" lg="4">
          <v-card
            elevation="0"
            style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;"
            class="pa-5"
          >
            <div class="d-flex align-center justify-space-between mb-4">
              <div style="width: 48px; height: 48px; border-radius: 10px; background: #6366F1; display: flex; align-items: center; justify-content: center;">
                <PhReceipt :size="24" weight="duotone" color="white" />
              </div>
            </div>
            <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">
              الخدمات
            </p>
            <p class="text-caption mb-1" style="color: var(--t-text-faint);">ما علينا من فواتير الخدمات (ضمن مجموع الديون)</p>
            <h2 class="text-h4 font-weight-bold mb-1" style="color: var(--t-text);">
              {{ Number(profile?.totalServiceDebt || 0).toLocaleString() }} د.ع
            </h2>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" lg="4">
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
            <p class="text-caption mb-1" style="color: var(--t-text-faint);">مجموع الديون − المسدد − المرتجعات − التحويلات الصادرة</p>
            <h2 class="text-h4 font-weight-bold mb-1" :style="{ color: (remaining || 0) >= 0 ? 'var(--t-text)' : '#10B981' }">
              {{ Number(remaining || 0).toLocaleString() }} د.ع
            </h2>
          </v-card>
        </v-col>
      </v-row>

      <!-- Actions -->
      <div class="d-flex align-center justify-space-between mb-6 flex-wrap ga-2">
        <v-btn
          @click="openAddPaymentDialog"
          color="#10B981"
          variant="flat"
          size="large"
          style="border-radius: 12px;"
        >
          <PhMoney :size="20" weight="bold" class="ml-1" />
          إضافة دفعة (تسجيل مصروف)
        </v-btn>
        <v-btn
          @click="openAddServiceInvoiceDialog"
          color="#046375"
          variant="flat"
          size="large"
          style="border-radius: 12px;"
        >
          <PhReceipt :size="20" weight="bold" class="ml-1" />
          إضافة فاتورة خدمات
        </v-btn>
      </div>

      <!-- Add payment (expense) dialog – inline on supplier page -->
      <v-dialog v-model="expenseDialog" max-width="520px" persistent content-class="expense-dialog" transition="dialog-bottom-transition">
        <v-card class="overflow-hidden" style="border-radius: 16px; box-shadow: 0 24px 48px rgba(0,0,0,0.12);">
          <div class="pa-5" style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); position: relative;">
            <div class="d-flex align-center gap-3" style="position: relative; z-index: 1;">
              <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(255,255,255,0.25); display: flex; align-items: center; justify-content: center;">
                <PhMoney :size="24" weight="duotone" color="white" />
              </div>
              <div>
                <h2 class="text-h6 font-weight-bold text-white mb-0">إضافة دفعة للمورد</h2>
                <p class="text-body-2 text-white mb-0" style="opacity: 0.9;">تسجيل مصروف (دفع) لهذا المورد</p>
              </div>
            </div>
          </div>
          <v-card-text class="pa-5">
            <v-form ref="expenseFormRef">
              <v-row dense>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="expenseForm.expenseDate"
                    label="تاريخ الدفعة"
                    type="date"
                    variant="outlined"
                    density="comfortable"
                    hide-details="auto"
                    :rules="[v => !!v || 'التاريخ مطلوب']"
                    style="border-radius: 12px;"
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.number="expenseForm.amount"
                    label="المبلغ (د.ع)"
                    type="number"
                    min="0"
                    step="0.01"
                    variant="outlined"
                    density="comfortable"
                    hide-details="auto"
                    :rules="[v => !!v || 'المبلغ مطلوب', v => v > 0 || 'المبلغ يجب أن يكون أكبر من صفر']"
                    style="border-radius: 12px;"
                  />
                </v-col>
                <v-col cols="12">
                  <v-select
                    v-model="expenseForm.expenseCategoryId"
                    :items="expenseCategoryOptions"
                    item-title="displayName"
                    item-value="idExpenseCategory"
                    label="فئة المصروف"
                    variant="outlined"
                    density="comfortable"
                    hide-details="auto"
                    :rules="[v => v != null && v !== '' || 'فئة المصروف مطلوبة']"
                    style="border-radius: 12px;"
                    @update:model-value="onExpenseCategorySelect"
                  />
                </v-col>
                <v-col cols="12">
                  <v-select
                    v-model="expenseForm.paidFromAccountId"
                    :items="paidFromAccountOptions"
                    item-title="label"
                    item-value="idAccount"
                    label="الدفع من حساب"
                    variant="outlined"
                    density="comfortable"
                    hide-details="auto"
                    :rules="[v => v != null && v !== '' || 'حساب الدفع مطلوب']"
                    style="border-radius: 12px;"
                  />
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="expenseForm.description"
                    label="الوصف (اختياري)"
                    variant="outlined"
                    density="comfortable"
                    hide-details="auto"
                    style="border-radius: 12px;"
                  />
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
          <v-card-actions class="pa-5 pt-0">
            <v-spacer />
            <v-btn variant="text" @click="closeExpenseDialog">إلغاء</v-btn>
            <v-btn
              color="#10B981"
              variant="flat"
              :loading="loading.expenseSubmit"
              @click="saveExpensePayment"
            >
              حفظ الدفعة
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Add service invoice dialog (multi-service per invoice) -->
      <v-dialog v-model="serviceInvoiceDialog" max-width="560px" persistent transition="dialog-bottom-transition">
        <v-card class="overflow-hidden" style="border-radius: 16px; box-shadow: 0 24px 48px rgba(0,0,0,0.12);">
          <div class="pa-5" style="background: linear-gradient(135deg, #046375 0%, #1F7F90 100%);">
            <div class="d-flex align-center gap-3">
              <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center;">
                <PhReceipt :size="24" weight="duotone" color="white" />
              </div>
              <div>
                <h2 class="text-h6 font-weight-bold text-white mb-0">إضافة فاتورة خدمات</h2>
                <p class="text-body-2 text-white mb-0" style="opacity: 0.9;">اختر عدة خدمات في فاتورة واحدة (تنظيف، صيانة، ماء، ...)</p>
              </div>
            </div>
          </div>
          <v-card-text class="pa-5">
            <v-row dense>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="serviceInvoiceForm.invoiceDate"
                  label="تاريخ الفاتورة"
                  type="date"
                  variant="outlined"
                  density="comfortable"
                  hide-details="auto"
                  :rules="[v => !!v || 'التاريخ مطلوب']"
                  style="border-radius: 12px;"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="serviceInvoiceForm.dueDate"
                  label="تاريخ الاستحقاق (اختياري)"
                  type="date"
                  variant="outlined"
                  density="comfortable"
                  hide-details="auto"
                  style="border-radius: 12px;"
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="serviceInvoiceForm.notes"
                  label="ملاحظات (اختياري)"
                  variant="outlined"
                  density="comfortable"
                  hide-details="auto"
                  style="border-radius: 12px;"
                />
              </v-col>
              <v-col cols="12">
                <p class="text-overline mb-2" style="color: var(--t-text-dim); font-weight: 600;">الخدمات (بنود الفاتورة)</p>
                <div v-for="(line, idx) in serviceInvoiceForm.items" :key="idx" class="d-flex align-center gap-2 mb-2">
                  <v-text-field
                    v-model="line.description"
                    label="الخدمة / الوصف"
                    variant="outlined"
                    density="comfortable"
                    hide-details="auto"
                    style="border-radius: 12px; flex: 1;"
                  />
                  <v-text-field
                    v-model.number="line.amount"
                    label="المبلغ"
                    type="number"
                    min="0"
                    step="0.01"
                    variant="outlined"
                    density="comfortable"
                    hide-details="auto"
                    style="border-radius: 12px; max-width: 140px;"
                  />
                  <v-btn
                    icon
                    variant="text"
                    color="error"
                    size="small"
                    @click="removeServiceLine(idx)"
                    aria-label="حذف الخدمة"
                    title="حذف الخدمة"
                  >
                    <PhTrash :size="18" weight="bold" />
                  </v-btn>
                </div>
                <v-btn
                  variant="tonal"
                  color="#046375"
                  size="small"
                  style="border-radius: 10px;"
                  @click="addServiceLine"
                >
                  إضافة خدمة
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions class="pa-5 pt-0">
            <v-spacer />
            <v-btn variant="text" @click="closeServiceInvoiceDialog">إلغاء</v-btn>
            <v-btn
              color="#046375"
              variant="flat"
              :loading="loading.serviceInvoiceSubmit"
              :disabled="!serviceInvoiceForm.items.length || serviceInvoiceForm.items.every(i => !(i.description && i.amount > 0))"
              @click="saveServiceInvoice"
            >
              حفظ الفاتورة
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Tabs (3): Purchases, Services, Expenses (payments) -->
      <v-tabs v-model="activeTab" bg-color="transparent" class="mb-6">
        <v-tab value="purchases">أوامر الشراء</v-tab>
        <v-tab value="services">الخدمات</v-tab>
        <v-tab value="expenses">المسدد (مصروفات للمورد)</v-tab>
      </v-tabs>

      <v-window v-model="activeTab">
        <!-- Purchases Tab -->
        <v-window-item value="purchases">
          <v-card
            elevation="0"
            style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;"
          >
            <v-card-title class="pa-4" style="border-bottom: 1px solid var(--t-border-subtle);">
              <div class="text-h6 font-weight-bold" style="color: var(--t-text);">أوامر الشراء</div>
            </v-card-title>
            <v-data-table
              :headers="purchaseHeaders"
              :items="profile?.purchases || []"
              :items-per-page="15"
              :loading="loading.profile"
              density="comfortable"
            >
              <template v-slot:item.purchaseDate="{ item }">
                {{ formatDate(item.purchaseDate) }}
              </template>
              <template v-slot:item.totalAmount="{ item }">
                <span style="font-weight: 600;">{{ Number(item.totalAmount || 0).toLocaleString() }} د.ع</span>
              </template>
              <template v-slot:item.receivedValue="{ item }">
                <span style="font-weight: 600; color: #059669;">{{ Number(item.receivedValue ?? 0).toLocaleString() }} د.ع</span>
              </template>
              <template v-slot:item.status="{ item }">
                <v-chip
                  :color="item.status === 'received' ? 'green' : item.status === 'partially_received' ? 'orange' : 'grey'"
                  size="small"
                  variant="flat"
                >
                  {{ item.status === 'received' ? 'مستلم' : item.status === 'partially_received' ? 'جزئي' : 'قيد الانتظار' }}
                </v-chip>
              </template>
              <template v-slot:item.paymentType="{ item }">
                {{ item.paymentType === 'cash' ? 'نقدي' : 'آجل' }}
              </template>
            </v-data-table>
          </v-card>
        </v-window-item>

        <!-- Services Tab (service invoices – multi-service per invoice) -->
        <v-window-item value="services">
          <v-card
            elevation="0"
            style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;"
          >
            <v-card-title class="pa-4" style="border-bottom: 1px solid var(--t-border-subtle);">
              <div class="text-h6 font-weight-bold" style="color: var(--t-text);">فواتير الخدمات</div>
            </v-card-title>
            <v-data-table
              :headers="serviceInvoiceHeaders"
              :items="profile?.serviceInvoices || []"
              :items-per-page="15"
              :loading="loading.profile"
              density="comfortable"
              show-expand
              item-value="idSupplierServiceInvoice"
            >
              <template v-slot:item.invoiceDate="{ item }">
                {{ formatDate(item.invoiceDate) }}
              </template>
              <template v-slot:item.totalAmount="{ item }">
                <span style="font-weight: 600;">{{ Number(item.totalAmount || 0).toLocaleString() }} د.ع</span>
              </template>
              <template v-slot:expanded-row="{ item }">
                <tr>
                  <td :colspan="serviceInvoiceHeaders.length" class="pa-4" style="background: var(--t-surface-high);">
                    <div class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 600;">بنود الفاتورة:</div>
                    <v-table density="compact">
                      <thead>
                        <tr>
                          <th class="text-right">الخدمة / الوصف</th>
                          <th class="text-right">المبلغ</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(line, idx) in (item.items || [])" :key="idx">
                          <td>{{ line.description || '—' }}</td>
                          <td>{{ Number(line.amount || 0).toLocaleString() }} د.ع</td>
                        </tr>
                      </tbody>
                    </v-table>
                  </td>
                </tr>
              </template>
              <template v-slot:no-data>
                <div class="pa-4 text-body-2" style="color: var(--t-text-dim);">لا توجد فواتير خدمات. اضغط «إضافة فاتورة خدمات» لإضافة فاتورة (يمكنك اختيار عدة خدمات في فاتورة واحدة).</div>
              </template>
            </v-data-table>
          </v-card>
        </v-window-item>

        <!-- Expenses Tab (payments to supplier = expenses with this supplierId) -->
        <v-window-item value="expenses">
          <v-card
            elevation="0"
            style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;"
          >
            <v-card-title class="pa-4" style="border-bottom: 1px solid var(--t-border-subtle);">
              <div class="text-h6 font-weight-bold" style="color: var(--t-text);">المسدد (مصروفات للمورد)</div>
            </v-card-title>
            <v-data-table
              :headers="expenseHeaders"
              :items="profile?.expenses || []"
              :items-per-page="15"
              :loading="loading.profile"
              density="comfortable"
            >
              <template v-slot:item.expenseDate="{ item }">
                {{ formatDate(item.expenseDate) }}
              </template>
              <template v-slot:item.amount="{ item }">
                <span style="color: #10B981; font-weight: 600;">
                  {{ Number(item.amount || 0).toLocaleString() }} د.ع
                </span>
              </template>
            </v-data-table>
          </v-card>
        </v-window-item>
      </v-window>

    </v-container>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import AppLayout from '@/components/AppLayout.vue'
import { supplierAPI, expenseAPI, expenseCategoryAPI, accountAPI } from '@/services/api'
import { formatDate, todayBusinessDate } from '@/utils/dateFormatter'
import { PhArrowRight, PhArrowUUpLeft, PhArrowsLeftRight, PhCurrencyDollar, PhMoney, PhReceipt, PhTrash } from '@phosphor-icons/vue'

const toast = useToast()
const route = useRoute()
const router = useRouter()

const profile = ref(null)
const activeTab = ref('purchases')
const loading = ref({
  profile: false,
  expenseSubmit: false,
  serviceInvoiceSubmit: false
})

// Add payment (expense) dialog – inline
const expenseDialog = ref(false)
const expenseFormRef = ref(null)
const expenseForm = ref({
  expenseDate: todayBusinessDate(),
  amount: 0,
  expenseCategoryId: null,
  paidFromAccountId: null,
  category: '',
  description: ''
})
const expenseCategories = ref([])
const accounts = ref([])

const expenseCategoryOptions = computed(() => {
  const list = expenseCategories.value || []
  if (!Array.isArray(list) || list.length === 0) return []
  return list
    .filter((c) => c && (c.idExpenseCategory != null || c.name))
    .map((c) => ({
      ...c,
      displayName: c.name || c.displayName || String(c.idExpenseCategory || '')
    }))
})

const accountTypeToArabic = (type) => {
  const map = { ASSET: 'أصول', LIABILITY: 'التزامات', EQUITY: 'حقوق ملكية', REVENUE: 'إيرادات', EXPENSE: 'مصروفات' }
  return type ? (map[String(type).toUpperCase()] || type) : ''
}

const paidFromAccountOptions = computed(() => {
  const list = accounts.value || []
  const asset = list.filter((a) => (a.accountType || '').toUpperCase() === 'ASSET')
  const use = asset.length ? asset : list
  return use.map((a) => {
    const typeAr = accountTypeToArabic(a.accountType)
    const namePart = `${a.accountCode || ''} - ${a.accountName || a.name || ''}`.trim() || String(a.idAccount)
    return {
      idAccount: a.idAccount,
      label: namePart ? `${namePart} (${typeAr})` : typeAr || String(a.idAccount)
    }
  })
})

// Total owed before payments: opening debt + received purchases + service invoices + transfers in
const totalDebts = computed(() => {
  if (!profile.value) return 0
  const n = (v) => parseFloat(v || 0)
  return n(profile.value.initialDebt) + n(profile.value.unpaidPurchases) + n(profile.value.totalServiceDebt) + n(profile.value.transferIn)
})

// Remaining comes from the server (same figure as the suppliers list)
const remaining = computed(() => {
  if (!profile.value) return 0
  return parseFloat(profile.value.currentDebt || 0)
})

const purchaseHeaders = [
  { title: 'رقم الأمر', key: 'purchaseNumber', align: 'start' },
  { title: 'التاريخ', key: 'purchaseDate' },
  { title: 'إجمالي الأمر', key: 'totalAmount' },
  { title: 'ما علينا له', key: 'receivedValue' },
  { title: 'طريقة الدفع', key: 'paymentType' },
  { title: 'الحالة', key: 'status' },
  { title: 'سجل بواسطة', key: 'createdByName' }
]

const expenseHeaders = [
  { title: 'التاريخ', key: 'expenseDate', align: 'start' },
  { title: 'المبلغ', key: 'amount' },
  { title: 'الوصف', key: 'description' },
  { title: 'سجل بواسطة', key: 'recordedByName' }
]

const serviceInvoiceHeaders = [
  { title: 'التاريخ', key: 'invoiceDate', align: 'start' },
  { title: 'الإجمالي', key: 'totalAmount' },
  { title: 'ملاحظات', key: 'notes' }
]

const serviceInvoiceDialog = ref(false)
const serviceInvoiceForm = ref({
  invoiceDate: todayBusinessDate(),
  dueDate: '',
  notes: '',
  items: [{ description: '', amount: 0 }]
})

const addServiceLine = () => {
  serviceInvoiceForm.value.items.push({ description: '', amount: 0 })
}
const removeServiceLine = (idx) => {
  serviceInvoiceForm.value.items.splice(idx, 1)
}
const openAddServiceInvoiceDialog = () => {
  serviceInvoiceForm.value = {
    invoiceDate: todayBusinessDate(),
    dueDate: '',
    notes: '',
    items: [{ description: '', amount: 0 }]
  }
  serviceInvoiceDialog.value = true
}
const closeServiceInvoiceDialog = () => {
  serviceInvoiceDialog.value = false
}
const saveServiceInvoice = async () => {
  const items = serviceInvoiceForm.value.items
    .filter((i) => (i.description || '').trim() && Number(i.amount) > 0)
    .map((i) => ({ description: (i.description || '').trim(), amount: Number(i.amount) }))
  if (items.length === 0) {
    toast.error('أضف خدمة واحدة على الأقل (وصف ومبلغ)')
    return
  }
  loading.value.serviceInvoiceSubmit = true
  try {
    await supplierAPI.createServiceInvoice(route.params.id, {
      invoiceDate: serviceInvoiceForm.value.invoiceDate,
      dueDate: serviceInvoiceForm.value.dueDate || undefined,
      notes: (serviceInvoiceForm.value.notes || '').trim() || undefined,
      items
    })
    toast.success('تمت إضافة فاتورة الخدمات')
    closeServiceInvoiceDialog()
    await loadProfile()
    activeTab.value = 'services'
  } catch (e) {
    toast.error(e.response?.data?.message || 'فشل حفظ الفاتورة')
  } finally {
    loading.value.serviceInvoiceSubmit = false
  }
}

const loadProfile = async () => {
  loading.value.profile = true
  try {
    const supplierId = route.params.id
    const response = await supplierAPI.getProfile(supplierId)
    profile.value = response.data
  } catch (error) {
    toast.error(error.response?.data?.message || 'فشل تحميل بيانات الدين')
    console.error(error)
    router.push('/suppliers')
  } finally {
    loading.value.profile = false
  }
}

const loadExpenseCategories = async () => {
  try {
    const res = await expenseCategoryAPI.getAll()
    const list = res.data || []
    expenseCategories.value = Array.isArray(list) ? list : []
  } catch {
    expenseCategories.value = []
  }
}

const loadAccounts = async () => {
  try {
    const res = await accountAPI.getAll()
    accounts.value = res.data || []
  } catch {
    accounts.value = []
  }
}

const onExpenseCategorySelect = (id) => {
  const item = expenseCategoryOptions.value.find((c) => c.idExpenseCategory === id)
  if (item?.name) expenseForm.value.category = item.name
}

const openAddPaymentDialog = async () => {
  expenseForm.value = {
    expenseDate: todayBusinessDate(),
    amount: 0,
    expenseCategoryId: null,
    paidFromAccountId: null,
    category: '',
    description: ''
  }
  await Promise.all([loadExpenseCategories(), loadAccounts()])
  expenseDialog.value = true
}

const closeExpenseDialog = () => {
  expenseDialog.value = false
  expenseFormRef.value?.reset()
}

const saveExpensePayment = async () => {
  const { valid } = await expenseFormRef.value?.validate() ?? { valid: false }
  if (!valid) return
  if (expenseForm.value.expenseCategoryId == null || expenseForm.value.paidFromAccountId == null) {
    toast.error('فئة المصروف وحساب الدفع مطلوبان')
    return
  }
  const cat = expenseCategoryOptions.value.find((c) => c.idExpenseCategory === expenseForm.value.expenseCategoryId)
  const categoryName = (cat?.name || expenseForm.value.category || '').trim()
  if (!categoryName) {
    toast.error('فئة المصروف مطلوبة')
    return
  }
  loading.value.expenseSubmit = true
  try {
    await expenseAPI.create({
      expenseDate: expenseForm.value.expenseDate,
      amount: expenseForm.value.amount,
      expenseCategoryId: expenseForm.value.expenseCategoryId,
      paidFromAccountId: expenseForm.value.paidFromAccountId,
      category: categoryName,
      description: expenseForm.value.description || '',
      supplierId: Number(route.params.id)
    })
    toast.success('تم تسجيل الدفعة بنجاح')
    closeExpenseDialog()
    await loadProfile()
    activeTab.value = 'expenses'
  } catch (e) {
    toast.error(e.response?.data?.message || 'فشل تسجيل الدفعة')
  } finally {
    loading.value.expenseSubmit = false
  }
}

watch(() => route.params.id, () => {
  if (route.params.id) {
    loadProfile()
  }
})

onMounted(() => {
  loadProfile()
})
</script>

<style scoped>
</style>

