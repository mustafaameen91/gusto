<template>
  <AppLayout>
    <v-container fluid class="pa-6">
      <!-- Elegant Welcome Banner -->
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
                    إدارة الصندوق
                  </h1>
                  <p class="text-body-1 text-white mb-1" style="opacity: 0.95;">
                    متابعة رصيد الصندوق والمعاملات المالية
                  </p>
                  <p class="text-body-2 text-white" style="opacity: 0.85;">
                    {{ currentDate }}
                  </p>
                </div>
              </div>
              <div class="d-flex align-center ga-3">
                <v-chip 
                  v-if="balance.isOpen" 
                  size="small" 
                  style="background: #10B981; color: white; font-weight: 600;"
                >
                  <PhLockKeyOpen :size="16" weight="bold" class="ml-1" />
                  مفتوح
                </v-chip>
                <v-chip 
                  v-else
                  size="small" 
                  style="background: #9CA3AF; color: white; font-weight: 600;"
                >
                  <PhLockKey :size="16" weight="bold" class="ml-1" />
                  مغلق
                </v-chip>
                <v-btn
                  v-if="balance.isOpen && hasRole(['admin', 'cashier'])"
                  color="orange"
                  variant="flat"
                  size="large"
                  @click="$router.push('/daily-receipt')"
                  style="border-radius: 12px;"
                >
                  <PhLockKey :size="20" weight="bold" class="ml-1" />
                  إغلاق الصندوق
                </v-btn>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Daily Balance Cards: for an open shift these are the drawer movements
           (opening + cash sales + other cash income + customer cash − cash expenses − purchases = expected cash) -->
      <v-row class="mb-6">
        <v-col cols="12" sm="6" lg="4">
          <v-card elevation="0" style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;" class="pa-5 h-100">
            <div class="d-flex align-center justify-space-between mb-4">
              <div style="width: 48px; height: 48px; border-radius: 10px; background: #046375; display: flex; align-items: center; justify-content: center;">
                <PhWallet :size="24" weight="duotone" color="white" />
              </div>
            </div>
            <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">رصيد الافتتاح</p>
            <h2 class="text-h4 font-weight-bold mb-1" style="color: var(--t-text);">{{ fmt(balance.openingCash) }} د.ع</h2>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" lg="4">
          <v-card elevation="0" style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;" class="pa-5 h-100">
            <div class="d-flex align-center justify-space-between mb-4">
              <div style="width: 48px; height: 48px; border-radius: 10px; background: #10B981; display: flex; align-items: center; justify-content: center;">
                <PhTrendUp :size="24" weight="duotone" color="white" />
              </div>
            </div>
            <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">{{ isLiveShift ? 'المبيعات النقدية' : 'إجمالي المبيعات' }}</p>
            <h2 class="text-h4 font-weight-bold mb-1" style="color: var(--t-text);">{{ fmt(isLiveShift ? balance.cashSales : balance.totalSales) }} د.ع</h2>
            <p v-if="isLiveShift" class="text-caption mb-0" style="color: var(--t-text-faint);">إجمالي المبيعات {{ fmt(balance.totalSales) }} · بطاقة {{ fmt(balance.cardSales) }} · آجل {{ fmt(balance.creditSales) }}</p>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" lg="4">
          <v-card elevation="0" style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;" class="pa-5 h-100">
            <div class="d-flex align-center justify-space-between mb-4">
              <div style="width: 48px; height: 48px; border-radius: 10px; background: #059669; display: flex; align-items: center; justify-content: center;">
                <PhCoins :size="24" weight="duotone" color="white" />
              </div>
            </div>
            <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">{{ isLiveShift ? 'إيرادات خارجية نقدية' : 'إيرادات خارجية' }}</p>
            <h2 class="text-h4 font-weight-bold mb-1" style="color: var(--t-text);">{{ fmt(isLiveShift ? balance.otherIncomesCash : balance.totalOtherIncomes) }} د.ع</h2>
            <p v-if="isLiveShift" class="text-caption mb-0" style="color: var(--t-text-faint);">إجمالي الإيرادات الخارجية {{ fmt(balance.totalOtherIncomes) }}</p>
          </v-card>
        </v-col>
        <v-col v-if="isLiveShift" cols="12" sm="6" lg="4">
          <v-card elevation="0" style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;" class="pa-5 h-100">
            <div class="d-flex align-center justify-space-between mb-4">
              <div style="width: 48px; height: 48px; border-radius: 10px; background: #D4A574; display: flex; align-items: center; justify-content: center;">
                <PhHandCoins :size="24" weight="duotone" color="white" />
              </div>
            </div>
            <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">مقبوضات العملاء والبقشيش</p>
            <h2 class="text-h4 font-weight-bold mb-1" style="color: var(--t-text);">{{ fmt(balance.customerCash) }} د.ع</h2>
            <p class="text-caption mb-0" style="color: var(--t-text-faint);">تسديدات العملاء + البقشيش − المرتجعات النقدية</p>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" lg="4">
          <v-card elevation="0" style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;" class="pa-5 h-100">
            <div class="d-flex align-center justify-space-between mb-4">
              <div style="width: 48px; height: 48px; border-radius: 10px; background: #EF4444; display: flex; align-items: center; justify-content: center;">
                <PhTrendDown :size="24" weight="duotone" color="white" />
              </div>
            </div>
            <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">{{ isLiveShift ? 'مصروفات من الصندوق' : 'إجمالي المصروفات' }}</p>
            <h2 class="text-h4 font-weight-bold mb-1" style="color: var(--t-text);">{{ fmt(isLiveShift ? balance.cashExpenses : balance.totalExpenses) }} د.ع</h2>
            <p v-if="isLiveShift" class="text-caption mb-0" style="color: var(--t-text-faint);">إجمالي المصروفات {{ fmt(balance.totalExpenses) }}</p>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" lg="4">
          <v-card elevation="0" style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;" class="pa-5 h-100">
            <div class="d-flex align-center justify-space-between mb-4">
              <div style="width: 48px; height: 48px; border-radius: 10px; background: #F59E0B; display: flex; align-items: center; justify-content: center;">
                <PhShoppingCart :size="24" weight="duotone" color="white" />
              </div>
            </div>
            <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">{{ isLiveShift ? 'مشتريات من الصندوق' : 'إجمالي المشتريات' }}</p>
            <h2 class="text-h4 font-weight-bold mb-1" style="color: var(--t-text);">{{ fmt(balance.totalPurchases) }} د.ع</h2>
          </v-card>
        </v-col>
      </v-row>

      <!-- Current Balance Card -->
      <v-row class="mb-6">
        <v-col cols="12">
          <v-card
            elevation="0"
            :style="balance.isOpen ? 'background: linear-gradient(135deg, #046375 0%, #1F7F90 100%); border-radius: 12px;' : 'background: linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%); border-radius: 12px;'"
            class="pa-6"
          >
            <div class="d-flex align-center justify-space-between flex-wrap">
              <div>
                <p class="text-body-1 mb-2 text-white" style="opacity: 0.9;">
                  {{ balance.isOpen ? 'الرصيد الحالي للصندوق (النقد المتوقع في الدرج)' : 'رصيد إغلاق الصندوق' }}
                </p>
                <h1 class="text-h3 font-weight-bold text-white mb-0">
                  {{ Number(balance.currentBalance || balance.closingCash || 0).toLocaleString() }} د.ع
                </h1>
                <p v-if="balance.isClosed" class="text-body-2 text-white mt-2" style="opacity: 0.8;">
                  الصندوق مغلق
                </p>
              </div>
              <PhWallet :size="64" weight="duotone" color="white" style="opacity: 0.3;" />
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- ═══════════════════════════════════════ -->
      <!-- Per-Account Balances Section            -->
      <!-- ═══════════════════════════════════════ -->
      <v-row class="mb-4">
        <v-col cols="12">
          <div class="d-flex align-center justify-space-between mb-4 flex-wrap ga-2">
            <h2 class="text-h6 font-weight-bold" style="color: var(--t-text);">
              <PhBank :size="22" weight="duotone" class="ml-2" style="vertical-align: middle;" />
              أرصدة الحسابات
            </h2>
            <div class="d-flex ga-2">
              <v-btn
                v-if="isAdmin"
                color="#046375"
                variant="flat"
                size="small"
                @click="showTransferDialog = true"
              >
                <PhArrowsClockwise :size="18" weight="bold" class="ml-1" />
                تحويل بين الصناديق
              </v-btn>
              <v-btn
                variant="text"
                size="small"
                @click="loadAccountBalances"
                :loading="loading.accountBalances"
                style="color: var(--t-text-dim);"
              >
                <PhArrowsClockwise :size="18" weight="bold" class="ml-1" />
                تحديث
              </v-btn>
            </div>
          </div>
        </v-col>
      </v-row>

      <v-row class="mb-6">
        <v-col
          v-for="acc in accountBalances"
          :key="acc.idAccount"
          cols="12"
          sm="6"
          lg="4"
        >
          <v-card
            elevation="0"
            class="account-card pa-5"
            style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 14px; cursor: pointer; transition: all 0.2s ease;"
            @click="toggleAccountDetail(acc.idAccount)"
          >
            <div class="d-flex align-center justify-space-between mb-3">
              <div class="d-flex align-center ga-3">
                <div
                  :style="`width: 42px; height: 42px; border-radius: 10px; background: ${getAccountTypeColor(acc.accountType)}; display: flex; align-items: center; justify-content: center;`"
                >
                  <component :is="getAccountTypeIcon(acc.accountType)" :size="20" weight="duotone" color="white" />
                </div>
                <div>
                  <p class="text-body-2 font-weight-bold mb-0" style="color: var(--t-text);">{{ acc.accountName }}</p>
                  <p class="text-caption mb-0" style="color: var(--t-text-dim);">{{ acc.accountCode }} · {{ accountTypeArabic(acc.accountType) }}</p>
                </div>
              </div>
              <PhCaretDown
                :size="18"
                weight="bold"
                :style="`color: var(--t-text-dim); transition: transform 0.2s; transform: rotate(${expandedAccount === acc.idAccount ? '180deg' : '0'})`"
              />
            </div>

            <!-- Balance -->
            <div class="d-flex align-center justify-space-between mb-2">
              <span class="text-body-2" style="color: var(--t-text-dim);">الرصيد</span>
              <span class="text-h6 font-weight-bold" :style="`color: ${acc.balance >= 0 ? '#10B981' : '#EF4444'}`">
                {{ Number(acc.balance || 0).toLocaleString() }} د.ع
              </span>
            </div>

            <!-- Debit / Credit summary -->
            <div class="d-flex ga-3">
              <div class="flex-grow-1 pa-3" style="background: rgba(16, 185, 129, 0.08); border-radius: 8px;">
                <p class="text-caption mb-1" style="color: #10B981; font-weight: 600;">مدين (وارد)</p>
                <p class="text-body-2 font-weight-bold mb-0" style="color: var(--t-text);">{{ Number(acc.totalDebit || 0).toLocaleString() }}</p>
              </div>
              <div class="flex-grow-1 pa-3" style="background: rgba(239, 68, 68, 0.08); border-radius: 8px;">
                <p class="text-caption mb-1" style="color: #EF4444; font-weight: 600;">دائن (صادر)</p>
                <p class="text-body-2 font-weight-bold mb-0" style="color: var(--t-text);">{{ Number(acc.totalCredit || 0).toLocaleString() }}</p>
              </div>
            </div>

            <p class="text-caption mt-2 mb-0" style="color: var(--t-text-dim);">
              {{ acc.transactionCount }} معاملة
            </p>

            <!-- Expanded: Account Transactions -->
            <v-expand-transition>
              <div v-if="expandedAccount === acc.idAccount" class="mt-4 pt-3" style="border-top: 1px solid var(--t-border-subtle);">
                <div v-if="loading.accountTxns" class="text-center pa-4">
                  <v-progress-circular indeterminate size="28" color="#046375" />
                </div>
                <div v-else-if="accountTxns.length === 0" class="text-center pa-3">
                  <p class="text-body-2 mb-0" style="color: var(--t-text-dim);">لا توجد معاملات</p>
                </div>
                <div v-else>
                  <div
                    v-for="(tx, idx) in accountTxns"
                    :key="tx.idJournalLine"
                    class="d-flex align-center justify-space-between py-2"
                    :style="idx < accountTxns.length - 1 ? 'border-bottom: 1px solid var(--t-border-subtle);' : ''"
                  >
                    <div>
                      <p class="text-body-2 mb-0" style="color: var(--t-text);">
                        {{ sourceTypeArabic(tx.sourceType) }}
                      </p>
                      <p class="text-caption mb-0" style="color: var(--t-text-dim);">
                        {{ formatDate(tx.entryDate) }}
                        <span v-if="tx.lineMemo || tx.entryMemo"> · {{ tx.lineMemo || tx.entryMemo }}</span>
                      </p>
                    </div>
                    <div class="text-left">
                      <span v-if="tx.debit > 0" style="color: #10B981; font-weight: 600;">
                        +{{ Number(tx.debit).toLocaleString() }}
                      </span>
                      <span v-if="tx.credit > 0" style="color: #EF4444; font-weight: 600;">
                        -{{ Number(tx.credit).toLocaleString() }}
                      </span>
                    </div>
                  </div>
                  <p v-if="accountTxns.length >= 50" class="text-caption text-center mt-2 mb-0" style="color: var(--t-text-dim);">
                    يتم عرض آخر 50 معاملة فقط
                  </p>
                </div>
              </div>
            </v-expand-transition>
          </v-card>
        </v-col>
      </v-row>

      <!-- Period Selector -->
      <v-card
        elevation="0"
        style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;"
        class="mb-4"
      >
        <v-card-text class="pa-4">
          <v-row align="center">
            <v-col cols="12" md="4">
              <v-text-field
                v-model="filters.startDate"
                label="من"
                type="date"
                variant="outlined"
                density="comfortable"
                @update:model-value="loadTransactions"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="filters.endDate"
                label="إلى"
                type="date"
                variant="outlined"
                density="comfortable"
                @update:model-value="loadTransactions"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-btn-toggle v-model="quickRange" mandatory color="#046375" variant="outlined" divided style="border-radius: 8px; width: 100%;">
                <v-btn value="today" size="small">اليوم</v-btn>
                <v-btn value="week" size="small">أسبوع</v-btn>
                <v-btn value="month" size="small">شهر</v-btn>
              </v-btn-toggle>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Transactions Table -->
      <v-card
        elevation="0"
        style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;"
      >
        <v-card-title class="pa-4" style="border-bottom: 1px solid var(--t-border-subtle);">
          <div class="text-h6 font-weight-bold" style="color: var(--t-text);">المعاملات المالية</div>
        </v-card-title>
        <v-data-table
          :headers="headers"
          :items="transactions"
          :items-per-page="20"
          :loading="loading.transactions"
          density="comfortable"
          class="transactions-table"
        >
          <template v-slot:item.date="{ item }">
            <span style="color: var(--t-text-dim);">
              {{ formatDate(item.date) }}
            </span>
          </template>
          <template v-slot:item.type="{ item }">
            <v-chip 
              :color="getTypeColor(item.type)" 
              size="small"
              variant="flat"
              style="font-weight: 500;"
            >
              {{ getTypeText(item.type) }}
            </v-chip>
          </template>
          <template v-slot:item.amount="{ item }">
            <span :style="{ color: item.amount >= 0 ? '#10B981' : '#EF4444', fontWeight: 600 }">
              {{ item.amount >= 0 ? '+' : '' }}{{ Number(item.amount || 0).toLocaleString() }} د.ع
            </span>
          </template>
          <template v-slot:item.description="{ item }">
            <span style="color: var(--t-text-dim);">
              {{ item.description }}
            </span>
          </template>
        </v-data-table>
      </v-card>

      <!-- Transfer between boxes dialog -->
      <v-dialog v-if="isAdmin" v-model="showTransferDialog" max-width="440" persistent>
        <v-card>
          <v-card-title class="pa-4" style="border-bottom: 1px solid var(--t-border);">
            تحويل بين الصناديق
          </v-card-title>
          <v-card-text class="pa-4">
            <v-select
              v-model="transferForm.fromAccountId"
              :items="transferAccounts"
              item-title="accountName"
              item-value="idAccount"
              label="من حساب"
              variant="outlined"
              density="comfortable"
              class="mb-3"
              hide-details="auto"
            />
            <v-select
              v-model="transferForm.toAccountId"
              :items="transferAccounts"
              item-title="accountName"
              item-value="idAccount"
              label="إلى حساب"
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
            <v-btn color="#046375" variant="flat" :loading="loading.transfer" @click="submitTransfer">تحويل</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch, onActivated } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import { useRoute } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import logoImg from '@/assets/logo.png'
import { boxAPI, accountAPI } from '@/services/api'
import { formatDate, formatCurrentDateArabic, todayBusinessDate, addDaysYMD, toYMD } from '@/utils/dateFormatter'
import {
  PhWallet, PhTrendUp, PhTrendDown, PhShoppingCart,
  PhLockKeyOpen, PhLockKey, PhBank, PhArrowsClockwise,
  PhCaretDown, PhVault, PhCoins, PhHandCoins, PhChartLineUp, PhReceipt, PhCube
} from '@phosphor-icons/vue'
import { useRouter } from 'vue-router'

const toast = useToast()
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

const currentDate = computed(() => formatCurrentDateArabic())

const balance = ref({
  openingCash: 0,
  totalSales: 0,
  totalExpenses: 0,
  totalPurchases: 0,
  currentBalance: 0,
  expectedBalance: 0,
  isOpen: false
})

const hasRole = (roles) => roles.includes(authStore.user?.role)
// POST /box/transfer and GET /accounts are admin-only on the server
const isAdmin = computed(() => authStore.user?.role === 'admin')
// Open shift: the API returns the drawer breakdown (cashSales, cashExpenses, customerCash …)
const isLiveShift = computed(() => !!balance.value.isOpen && balance.value.cashSales !== undefined)
const fmt = (v) => Number(v || 0).toLocaleString()

const transactions = ref([])
const quickRange = ref('today')
const loading = ref({
  balance: false,
  transactions: false,
  accountBalances: false,
  accountTxns: false,
  transfer: false
})

const accountBalances = ref([])
const expandedAccount = ref(null)
const accountTxns = ref([])
const showTransferDialog = ref(false)
const transferAccounts = ref([])
const transferForm = ref({
  fromAccountId: null,
  toAccountId: null,
  amount: null,
  notes: ''
})
const transferErrors = ref({ amount: '' })

const filters = ref({
  startDate: todayBusinessDate(),
  endDate: todayBusinessDate()
})

const headers = [
  { title: 'التاريخ', key: 'date', align: 'start' },
  { title: 'النوع', key: 'type' },
  { title: 'المرجع', key: 'reference' },
  { title: 'المبلغ', key: 'amount' },
  { title: 'الوصف', key: 'description' }
]

const accountTypeArabic = (type) => {
  const map = { ASSET: 'أصول', LIABILITY: 'التزامات', EQUITY: 'حقوق ملكية', REVENUE: 'إيرادات', EXPENSE: 'مصروفات', COST: 'تكلفة' }
  return type ? (map[String(type).toUpperCase()] || type) : ''
}

const sourceTypeArabic = (type) => {
  const map = {
    shift_post: 'إغلاق وردية',
    shift_close: 'إغلاق وردية',
    daily_close: 'إغلاق يومي',
    expense: 'مصروف',
    purchase: 'شراء',
    sale: 'مبيعات',
    manual: 'قيد يدوي',
    opening: 'رصيد افتتاحي',
    other: 'إيرادات خارجية',
    other_income: 'إيرادات خارجية',
    otherincome: 'إيرادات خارجية',
    transfer: 'تحويل بين الصناديق'
  }
  return type ? (map[String(type).toLowerCase()] || type) : 'قيد'
}

const getAccountTypeColor = (type) => {
  const map = { ASSET: '#3B82F6', LIABILITY: '#F59E0B', EQUITY: '#8B5CF6', REVENUE: '#10B981', EXPENSE: '#EF4444', COST: '#F97316' }
  return type ? (map[String(type).toUpperCase()] || '#6B7280') : '#6B7280'
}

const getAccountTypeIcon = (type) => {
  const map = { ASSET: PhVault, LIABILITY: PhHandCoins, EQUITY: PhChartLineUp, REVENUE: PhCoins, EXPENSE: PhReceipt, COST: PhCube }
  return type ? (map[String(type).toUpperCase()] || PhWallet) : PhWallet
}

watch(quickRange, (newRange) => {
  const today = todayBusinessDate()
  filters.value.endDate = today
  
  switch(newRange) {
    case 'today':
      filters.value.startDate = today
      break
    case 'week': // last 7 days including today
      filters.value.startDate = addDaysYMD(today, -6)
      break
    case 'month': {
      const [y, m, d] = today.split('-').map(Number)
      const monthAgo = new Date(y, m - 2, d)
      filters.value.startDate = toYMD(monthAgo)
      break
    }
  }
  
  loadTransactions()
})

const getTypeColor = (type) => {
  const colors = { sale: 'success', expense: 'error', purchase: 'warning', other_income: 'success' }
  return colors[type] || 'grey'
}

const getTypeText = (type) => {
  const texts = { sale: 'مبيعات', expense: 'مصروف', purchase: 'شراء', other_income: 'إيرادات خارجية' }
  return texts[type] || type
}

const loadBalance = async () => {
  loading.value.balance = true
  try {
    const response = await boxAPI.getBalance()
    balance.value = response.data || {}
  } catch (error) {
    toast.error(error.response?.data?.message || 'فشل تحميل رصيد الصندوق')
    console.error(error)
  } finally {
    loading.value.balance = false
  }
}

const loadTransactions = async () => {
  loading.value.transactions = true
  try {
    const response = await boxAPI.getTransactions({
      startDate: filters.value.startDate,
      endDate: filters.value.endDate
    })
    transactions.value = response.data || []
  } catch (error) {
    toast.error(error.response?.data?.message || 'فشل تحميل المعاملات')
    console.error(error)
  } finally {
    loading.value.transactions = false
  }
}

const loadAccountBalances = async () => {
  loading.value.accountBalances = true
  try {
    const response = await boxAPI.getAccountBalances()
    accountBalances.value = (response.data || []).filter(a => a.transactionCount > 0 || a.balance !== 0)
  } catch (error) {
    toast.error(error.response?.data?.message || 'فشل تحميل أرصدة الحسابات')
    console.error(error)
  } finally {
    loading.value.accountBalances = false
  }
}

const toggleAccountDetail = async (accountId) => {
  if (expandedAccount.value === accountId) {
    expandedAccount.value = null
    accountTxns.value = []
    return
  }
  expandedAccount.value = accountId
  loading.value.accountTxns = true
  accountTxns.value = []
  try {
    const response = await boxAPI.getAccountTransactions(accountId)
    accountTxns.value = (response.data || []).slice(0, 50)
  } catch (error) {
    toast.error(error.response?.data?.message || 'فشل تحميل معاملات الحساب')
    console.error(error)
  } finally {
    loading.value.accountTxns = false
  }
}

async function loadTransferAccounts() {
  try {
    const res = await accountAPI.getAll({ type: 'ASSET' })
    transferAccounts.value = Array.isArray(res.data) ? res.data : []
  } catch (_) {
    transferAccounts.value = []
  }
}

function closeTransferDialog() {
  showTransferDialog.value = false
  transferForm.value = { fromAccountId: null, toAccountId: null, amount: null, notes: '' }
  transferErrors.value = { amount: '' }
}

async function submitTransfer() {
  const amount = transferForm.value.amount
  transferErrors.value = { amount: '' }
  if (amount == null || amount <= 0 || isNaN(amount)) {
    transferErrors.value.amount = 'أدخل مبلغاً صحيحاً'
    return
  }
  if (!transferForm.value.fromAccountId || !transferForm.value.toAccountId) {
    toast.error('اختر من الحساب وإلى الحساب')
    return
  }
  if (transferForm.value.fromAccountId === transferForm.value.toAccountId) {
    toast.error('من الحساب وإلى الحساب يجب أن يكونا مختلفين')
    return
  }
  loading.value.transfer = true
  try {
    await boxAPI.transfer({
      fromAccountId: transferForm.value.fromAccountId,
      toAccountId: transferForm.value.toAccountId,
      amount: Number(amount),
      notes: transferForm.value.notes || undefined
    })
    toast.success('تم التحويل بنجاح')
    closeTransferDialog()
    loadAccountBalances()
    loadBalance()
    loadTransactions()
  } catch (e) {
    toast.error(e.response?.data?.message || 'فشل التحويل')
  } finally {
    loading.value.transfer = false
  }
}

onActivated(() => {
  loadBalance()
  loadTransactions()
  loadAccountBalances()
})

watch(() => route.path, () => {
  if (route.path === '/box') {
    loadBalance()
    loadTransactions()
    loadAccountBalances()
  }
})

watch(showTransferDialog, (v) => {
  if (v) loadTransferAccounts()
})

onMounted(() => {
  loadBalance()
  loadTransactions()
  loadAccountBalances()
})
</script>

<style scoped>
.transactions-table :deep(.v-data-table__thead) {
  background: var(--t-surface-high);
}

.transactions-table :deep(.v-data-table__thead th) {
  color: var(--t-text-dim) !important;
  font-weight: 600 !important;
  font-size: 0.875rem !important;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.transactions-table :deep(.v-data-table__tbody tr) {
  border-bottom: 1px solid var(--t-border-subtle);
}

.transactions-table :deep(.v-data-table__tbody tr:hover) {
  background: var(--t-surface-high) !important;
}

.account-card:hover {
  border-color: #046375 !important;
  box-shadow: 0 4px 12px rgba(4, 99, 117, 0.1);
}
</style>

