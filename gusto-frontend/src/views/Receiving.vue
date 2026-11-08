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
            <!-- Subtle decorative elements -->
            <div style="position: absolute; top: -40px; right: -40px; width: 160px; height: 160px; border-radius: 50%; background: rgba(255,255,255,0.08);"></div>
            <div style="position: absolute; bottom: -30px; left: -30px; width: 120px; height: 120px; border-radius: 50%; background: rgba(255,255,255,0.08);"></div>
            
            <div class="d-flex align-center justify-space-between flex-wrap" style="position: relative; z-index: 2;">
              <div class="d-flex align-center flex-wrap">
                <v-avatar size="80" class="ml-6 elevation-4" color="white" style="border-radius: 12px;">
                  <img :src="logoImg" alt="جوستو" style="width: 100%; height: 100%; object-fit: contain; padding: 8px;" />
                </v-avatar>
                <div class="flex-grow-1">
                  <h1 class="text-h4 font-weight-bold text-white mb-2" style="letter-spacing: -0.5px;">
                    مرحباً، {{ authStore.user?.fullName }} 👋
                  </h1>
                  <p class="text-body-1 text-white mb-1" style="opacity: 0.95;">
                    استلام المواد والمخزون
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
      <!-- Filter Tabs -->
      <v-card
        elevation="0"
        style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;"
        class="mb-4"
      >
        <v-tabs
          v-model="statusFilter"
          bg-color="transparent"
          color="#046375"
          grow
          @update:model-value="filterPurchases"
        >
          <v-tab value="all">
            <PhStack :size="20" class="ml-2" />
            الكل ({{ purchases.length }})
          </v-tab>
          <v-tab value="pending">
            <PhClock :size="20" class="ml-2" />
            قيد الانتظار ({{ pendingCount }})
          </v-tab>
          <v-tab value="partially_received">
            <PhPackage :size="20" class="ml-2" />
            مستلم جزئياً ({{ partialCount }})
          </v-tab>
          <v-tab value="received">
            <PhCheckCircle :size="20" class="ml-2" />
            مستلم بالكامل ({{ receivedCount }})
          </v-tab>
        </v-tabs>
      </v-card>

      <!-- Purchases List -->
      <v-card
        elevation="0"
        style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;"
      >
        <v-card-text class="pa-0">
          <v-data-table
            :headers="headers"
            :items="filteredPurchases"
            :items-per-page="15"
            :loading="loading.purchases"
            class="elevation-0 purchases-table"
          >
              <template v-slot:item.purchaseNumber="{ item }">
                <div class="font-weight-bold" style="color: #046375;">{{ item.purchaseNumber }}</div>
                <div class="text-caption" style="color: var(--t-text-dim);">{{ formatDate(item.purchaseDate) }}</div>
              </template>

              <template v-slot:item.supplierName="{ item }">
                <div>
                  <div class="font-weight-medium">{{ item.supplierName }}</div>
                  <div v-if="item.supplierPhone" class="text-caption text-grey">
                    <PhPhone :size="12" weight="bold" />
                    {{ item.supplierPhone }}
                  </div>
                </div>
              </template>

              <template v-slot:item.totalAmount="{ item }">
                <div class="font-weight-bold text-h6" style="color: #046375;">
                  {{ Number(item.totalAmount).toLocaleString() }} د.ع
                </div>
              </template>

              <template v-slot:item.status="{ item }">
                <v-chip 
                  :color="getStatusColor(item.status)" 
                  size="small" 
                  variant="flat"
                  style="font-weight: bold;"
                >
                  <template v-slot:prepend>
                    <v-icon size="16">{{ getStatusIcon(item.status) }}</v-icon>
                  </template>
                  {{ getStatusText(item.status) }}
                </v-chip>
              </template>

              <template v-slot:item.itemsCount="{ item }">
                <div class="text-center">
                  <v-chip size="small" style="background: var(--t-border-subtle); color: #046375;">
                    {{ item.itemsCount }} صنف
                  </v-chip>
                </div>
              </template>

              <template v-slot:item.actions="{ item }">
                <div class="d-flex ga-2">
                  <v-tooltip text="عرض التفاصيل" location="top">
                    <template v-slot:activator="{ props }">
                      <v-btn
                        v-bind="props"
                        icon
                        size="small"
                        variant="text"
                        color="primary"
                        @click="viewPurchase(item)"
                      >
                        <PhEye :size="20" weight="bold" />
                      </v-btn>
                    </template>
                  </v-tooltip>

                  <v-tooltip 
                    v-if="item.status === 'pending' || item.status === 'partially_received'" 
                    text="استلام" 
                    location="top"
                  >
                    <template v-slot:activator="{ props }">
                      <v-btn
                        v-bind="props"
                        icon
                        size="small"
                        variant="text"
                        color="success"
                        @click="openReceiveDialog(item)"
                      >
                        <PhCheckCircle :size="20" weight="bold" />
                      </v-btn>
                    </template>
                  </v-tooltip>

                  <v-tooltip text="طباعة" location="top">
                    <template v-slot:activator="{ props }">
                      <v-btn
                        v-bind="props"
                        icon
                        size="small"
                        variant="text"
                        color="secondary"
                        @click="printPurchase(item)"
                      >
                        <PhPrinter :size="20" weight="bold" />
                      </v-btn>
                    </template>
                  </v-tooltip>
                </div>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
    </v-container>

    <!-- Receive Purchase Dialog -->
    <v-dialog v-model="showReceiveDialog" max-width="800" persistent scrollable>
      <v-card elevation="0" style="border-radius: 16px; overflow: hidden;">
        <!-- Header -->
        <div style="background: #046375; padding: 24px;">
          <div class="d-flex align-center">
            <div style="width: 48px; height: 48px; border-radius: 10px; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; margin-left: 12px;">
              <PhCheckCircle :size="24" weight="bold" color="white" />
            </div>
            <div>
              <h3 class="text-h6 font-weight-bold text-white mb-1">
                استلام أمر الشراء
              </h3>
              <p class="text-body-2 text-white mb-0" style="opacity: 0.9;">
                Receive Purchase Order - Confirm Quantities
              </p>
            </div>
          </div>
        </div>

        <v-card-text v-if="receivingPurchase" class="pa-6" style="max-height: 600px; background: var(--t-surface);">
          <v-alert
            type="info"
            variant="tonal"
            class="mb-6"
            style="border-radius: 8px;"
          >
            <div class="font-weight-bold mb-1">رقم الأمر: {{ receivingPurchase.purchaseNumber }}</div>
            <div>المورد: {{ receivingPurchase.supplierName }}</div>
            <div class="text-caption">تأكد من الكميات المستلمة قبل الحفظ - سيتم تحديث المخزون تلقائياً</div>
          </v-alert>

          <div class="text-h6 font-weight-bold mb-4" style="color: var(--t-text);">
            الأصناف المستلمة:
          </div>

          <v-card 
            v-for="(item, index) in receiveForm.items" 
            :key="index" 
            variant="outlined" 
            class="mb-3 pa-4"
            style="border-color: #E5E7EB; border-radius: 12px;"
          >
            <v-row align="center">
              <v-col cols="12" md="4">
                <div class="font-weight-bold">{{ item.ingredientName }}</div>
                <div class="text-caption text-grey">{{ item.unit }}</div>
              </v-col>
              <v-col cols="12" md="3">
                <div class="text-caption text-grey">الكمية المطلوبة</div>
                <div class="font-weight-bold">{{ item.orderedQuantity }}</div>
              </v-col>
              <v-col cols="12" md="3">
                <div class="text-caption text-grey">مستلم سابقاً</div>
                <div class="font-weight-medium text-success">{{ item.receivedQuantity || 0 }}</div>
              </v-col>
              <v-col cols="12" md="2">
                <v-text-field
                  v-model.number="item.newReceived"
                  label="الكمية المستلمة"
                  type="number"
                  variant="outlined"
                  density="compact"
                  :rules="[rules.required]"
                  :max="item.orderedQuantity - (item.receivedQuantity || 0)"
                  color="#046375"
                />
              </v-col>
            </v-row>
          </v-card>
        </v-card-text>

        <v-divider />
        <v-card-actions class="pa-4" style="background: var(--t-surface-high);">
          <v-btn
            variant="text"
            size="large"
            @click="closeReceiveDialog"
            style="color: var(--t-text-dim);"
          >
            <PhX :size="20" weight="bold" class="ml-1" />
            إلغاء
          </v-btn>
          <v-spacer />
          <v-btn
            color="#046375"
            variant="flat"
            size="large"
            :loading="saving"
            @click="confirmReceive"
            style="border-radius: 8px;"
          >
            <PhCheckCircle :size="20" weight="bold" class="ml-1" />
            تأكيد الاستلام
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- View Purchase Dialog -->
    <v-dialog v-model="showViewDialog" max-width="900" scrollable>
      <v-card elevation="0" style="border-radius: 16px; overflow: hidden;">
        <!-- Header -->
        <div style="background: #046375; padding: 24px;">
          <div class="d-flex align-center">
            <div style="width: 48px; height: 48px; border-radius: 10px; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; margin-left: 12px;">
              <PhEye :size="24" weight="bold" color="white" />
            </div>
            <div>
              <h3 class="text-h6 font-weight-bold text-white mb-1">
                تفاصيل أمر الشراء
              </h3>
              <p class="text-body-2 text-white mb-0" style="opacity: 0.9;">
                Purchase Order Details
              </p>
            </div>
          </div>
        </div>

        <v-card-text v-if="viewingPurchase" class="pa-6" style="background: var(--t-surface);">
          <v-row>
            <v-col cols="12" md="6">
              <div class="text-caption text-grey">رقم الأمر</div>
              <div class="font-weight-bold text-h6 mb-3">{{ viewingPurchase.purchaseNumber }}</div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="text-caption text-grey">الحالة</div>
              <v-chip 
                :color="getStatusColor(viewingPurchase.status)" 
                class="mb-3"
              >
                {{ getStatusText(viewingPurchase.status) }}
              </v-chip>
            </v-col>
            <v-col cols="12" md="6">
              <div class="text-caption text-grey">المورد</div>
              <div class="font-weight-medium mb-3">{{ viewingPurchase.supplierName }}</div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="text-caption text-grey">هاتف المورد</div>
              <div class="font-weight-medium mb-3">{{ viewingPurchase.supplierPhone || 'غير محدد' }}</div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="text-caption text-grey">تاريخ الطلب</div>
              <div class="font-weight-medium mb-3">{{ formatDate(viewingPurchase.purchaseDate) }}</div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="text-caption text-grey">تاريخ التسليم المتوقع</div>
              <div class="font-weight-medium mb-3">{{ viewingPurchase.expectedDeliveryDate ? formatDate(viewingPurchase.expectedDeliveryDate) : 'غير محدد' }}</div>
            </v-col>
            <v-col cols="12">
              <div class="text-caption" style="color: var(--t-text-dim);">المبلغ الإجمالي</div>
              <div class="font-weight-bold text-h5 mb-3" style="color: #046375;">
                {{ Number(viewingPurchase.totalAmount).toLocaleString() }} د.ع
              </div>
            </v-col>
            <v-col cols="12" v-if="viewingPurchase.notes">
              <div class="text-caption text-grey">ملاحظات</div>
              <div class="mb-3">{{ viewingPurchase.notes }}</div>
            </v-col>
          </v-row>

          <v-divider class="my-4" />

          <div class="text-h6 font-weight-bold mb-4">الأصناف:</div>
          
          <v-data-table
            :headers="itemHeaders"
            :items="viewingPurchase.items || []"
            :items-per-page="-1"
            class="elevation-0"
            density="comfortable"
          >
            <template v-slot:item.ingredientName="{ item }">
              <div class="font-weight-medium">{{ item.ingredientName }}</div>
              <div class="text-caption text-grey">{{ item.unit }}</div>
            </template>

            <template v-slot:item.orderedQuantity="{ item }">
              <div class="font-weight-bold">{{ item.orderedQuantity }}</div>
            </template>

            <template v-slot:item.receivedQuantity="{ item }">
              <v-chip 
                :color="item.receivedQuantity >= item.orderedQuantity ? 'success' : item.receivedQuantity > 0 ? 'warning' : 'grey'"
                size="small"
              >
                {{ item.receivedQuantity || 0 }} / {{ item.orderedQuantity }}
              </v-chip>
            </template>

            <template v-slot:item.unitPrice="{ item }">
              <div class="font-weight-medium">{{ Number(item.unitPrice).toLocaleString() }} د.ع</div>
            </template>

            <template v-slot:item.totalPrice="{ item }">
              <div class="font-weight-bold" style="color: #046375;">
                {{ (item.orderedQuantity * item.unitPrice).toLocaleString() }} د.ع
              </div>
            </template>
          </v-data-table>
        </v-card-text>

        <v-divider />
        <v-card-actions class="pa-4" style="background: var(--t-surface-high);">
          <v-btn
            variant="text"
            size="large"
            @click="showViewDialog = false"
            style="color: var(--t-text-dim);"
          >
            <PhX :size="20" weight="bold" class="ml-1" />
            إغلاق
          </v-btn>
          <v-spacer />
          <v-btn
            v-if="viewingPurchase && (viewingPurchase.status === 'pending' || viewingPurchase.status === 'partially_received')"
            color="#046375"
            variant="flat"
            size="large"
            @click="openReceiveDialog(viewingPurchase)"
            style="border-radius: 8px;"
          >
            <PhCheckCircle :size="20" weight="bold" class="ml-1" />
            استلام
          </v-btn>
          <v-btn
            color="#046375"
            variant="outlined"
            size="large"
            @click="printPurchase(viewingPurchase)"
            style="border-radius: 8px; border-color: #046375;"
          >
            <PhPrinter :size="20" weight="bold" class="ml-1" />
            طباعة
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'
import { formatCurrentDateArabic } from '@/utils/dateFormatter'
import { purchaseAPI } from '@/services/api'
import logoImg from '@/assets/logo.png'
import AppLayout from '@/components/AppLayout.vue'
import {
  PhStack,
  PhClock,
  PhPackage,
  PhCheckCircle,
  PhPhone,
  PhEye,
  PhPrinter,
  PhX
} from '@phosphor-icons/vue'

const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()

const currentDate = computed(() => {
  return formatCurrentDateArabic()
})

// State
const purchases = ref([])
const statusFilter = ref('pending')
const loading = ref({
  purchases: false
}) // Default to pending for storage role
const showReceiveDialog = ref(false)
const showViewDialog = ref(false)
const saving = ref(false)
const receivingPurchase = ref(null)
const viewingPurchase = ref(null)

const receiveForm = ref({
  items: []
})

// Computed
const pendingCount = computed(() => {
  return purchases.value.filter(p => p.status === 'pending').length
})

const partialCount = computed(() => {
  return purchases.value.filter(p => p.status === 'partially_received').length
})

const receivedCount = computed(() => {
  return purchases.value.filter(p => p.status === 'received').length
})

const filteredPurchases = computed(() => {
  if (statusFilter.value === 'all') return purchases.value
  return purchases.value.filter(p => p.status === statusFilter.value)
})

const headers = [
  { title: 'رقم الأمر', key: 'purchaseNumber', width: '15%' },
  { title: 'المورد', key: 'supplierName', width: '20%' },
  { title: 'المبلغ الإجمالي', key: 'totalAmount', align: 'center', width: '15%' },
  { title: 'الحالة', key: 'status', align: 'center', width: '12%' },
  { title: 'عدد الأصناف', key: 'itemsCount', align: 'center', width: '10%' },
  { title: 'إجراءات', key: 'actions', sortable: false, align: 'center', width: '15%' }
]

const itemHeaders = [
  { title: 'المكون', key: 'ingredientName', width: '30%' },
  { title: 'الكمية المطلوبة', key: 'orderedQuantity', align: 'center' },
  { title: 'الكمية المستلمة', key: 'receivedQuantity', align: 'center' },
  { title: 'سعر الوحدة', key: 'unitPrice', align: 'center' },
  { title: 'المجموع', key: 'totalPrice', align: 'center' }
]

const rules = {
  required: value => !!value || 'مطلوب'
}

// Methods
const loadPurchases = async () => {
  loading.value.purchases = true
  try {
    const response = await purchaseAPI.getAll()
    purchases.value = response.data
  } catch (error) {
    toast.error('فشل تحميل أوامر الشراء')
    console.error(error)
  } finally {
    loading.value.purchases = false
  }
}

// Removed create/edit functions - not needed for storage role

const openReceiveDialog = async (purchase) => {
  try {
    const response = await purchaseAPI.getOne(purchase.idPurchase)
    receivingPurchase.value = response.data
    
    receiveForm.value.items = response.data.items.map(item => ({
      ...item,
      newReceived: 0
    }))
    
    showReceiveDialog.value = true
    showViewDialog.value = false
  } catch (error) {
    toast.error('فشل تحميل تفاصيل الأمر')
    console.error(error)
  }
}

const closeReceiveDialog = () => {
  showReceiveDialog.value = false
  receivingPurchase.value = null
  receiveForm.value.items = []
}

const confirmReceive = async () => {
  console.log('🔍 Frontend: confirmReceive called')
  console.log('📋 receiveForm.items:', receiveForm.value.items)
  
  const itemsToReceive = receiveForm.value.items
    .filter(item => item.newReceived > 0)
    .map(item => {
      const oldQty = parseFloat(item.receivedQuantity) || 0
      const newQty = parseFloat(item.newReceived) || 0
      const totalQty = oldQty + newQty
      
      console.log(`  Item ${item.idPurchaseItem}:`, {
        ingredientName: item.ingredientName,
        oldReceived: oldQty,
        newReceived: newQty,
        totalReceived: totalQty,
        ordered: item.orderedQuantity
      })
      
      return {
        idPurchaseItem: item.idPurchaseItem,
        ingredientId: item.ingredientId,
        receivedQuantity: totalQty
      }
    })

  console.log('📤 Sending to backend:', itemsToReceive)

  if (itemsToReceive.length === 0) {
    toast.error('يجب تحديد كمية مستلمة لصنف واحد على الأقل')
    return
  }

  saving.value = true
  try {
    const response = await purchaseAPI.receive(receivingPurchase.value.idPurchase, {
      items: itemsToReceive
    })
    console.log('✅ Backend response:', response.data)
    toast.success('✅ تم تأكيد الاستلام وتحديث المخزون')
    await loadPurchases()
    closeReceiveDialog()
  } catch (error) {
    console.error('❌ Receive error:', error)
    toast.error('فشل تأكيد الاستلام')
  } finally {
    saving.value = false
  }
}

const viewPurchase = async (purchase) => {
  try {
    const response = await purchaseAPI.getOne(purchase.idPurchase)
    viewingPurchase.value = response.data
    showViewDialog.value = true
  } catch (error) {
    toast.error('فشل تحميل تفاصيل الأمر')
    console.error(error)
  }
}

const printPurchase = async (purchase) => {
  // Fetch full details if not already loaded
  let fullPurchase = purchase
  if (!purchase.items || purchase.items.length === 0) {
    try {
      const response = await purchaseAPI.getOne(purchase.idPurchase)
      fullPurchase = response.data
    } catch (error) {
      console.error('Failed to load purchase details:', error)
      toast.error('فشل تحميل تفاصيل الأمر')
      return
    }
  }

  // Generate items HTML
  const itemsHtml = fullPurchase.items.map(item => 
    '<tr>' +
      '<td>' + item.ingredientName + '</td>' +
      '<td>' + item.unit + '</td>' +
      '<td>' + item.orderedQuantity + '</td>' +
      '<td>' + Number(item.unitPrice).toLocaleString() + ' د.ع</td>' +
      '<td><strong>' + (item.orderedQuantity * item.unitPrice).toLocaleString() + ' د.ع</strong></td>' +
    '</tr>'
  ).join('')

  // Generate notes section
  const notesHtml = fullPurchase.notes ? 
    '<div class="notes-section">' +
      '<h4>📝 ملاحظات:</h4>' +
      '<div class="notes-content">' + fullPurchase.notes + '</div>' +
    '</div>' : ''

  // Calculate totals
  const totalQuantity = fullPurchase.items.reduce((sum, item) => sum + parseFloat(item.orderedQuantity), 0)
  const statusClass = fullPurchase.status === 'received' ? 'received' : 
                      fullPurchase.status === 'partially_received' ? 'partial' : 'pending'

  const printWindow = window.open('', '', 'height=842,width=595') // A4 size
  
  const cssStyles = `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Arial', 'Helvetica', sans-serif;
      direction: rtl;
      padding: 30px;
      background: var(--t-surface);
      color: #333;
    }
    
    .invoice-container {
      max-width: 210mm;
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      border: 2px solid #023F4B;
      padding: 0;
      background: var(--t-surface);
    }
    
    @page {
      size: A4;
      margin: 0;
    }
    
    .invoice-header {
      background: linear-gradient(135deg, #023F4B 0%, #046375 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-bottom: 4px solid #1F7F90;
    }
    
    .cafe-logo {
      width: 80px;
      height: 80px;
      margin: 0 auto 15px;
      background: var(--t-surface);
      padding: 10px;
      border-radius: 50%;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    
    .company-name {
      font-size: 36px;
      font-weight: bold;
      margin-bottom: 5px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }
    
    .company-tagline {
      font-size: 16px;
      opacity: 0.9;
      margin-bottom: 15px;
      font-style: italic;
    }
    
    .document-title {
      font-size: 24px;
      font-weight: bold;
      background: rgba(255,255,255,0.2);
      padding: 10px 30px;
      display: inline-block;
      border-radius: 8px;
      margin-top: 10px;
    }
    
    .info-section {
      padding: 30px;
      background: #f9f9f9;
    }
    
    .info-box {
      background: var(--t-surface);
      padding: 20px;
      border-radius: 8px;
      border: 1px solid #e0e0e0;
    }
    
    .info-box h3 {
      color: #023F4B;
      font-size: 16px;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #1F7F90;
    }
    
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px dashed #eee;
    }
    
    .info-row:last-child {
      border-bottom: none;
    }
    
    .info-label {
      font-weight: bold;
      color: #666;
    }
    
    .info-value {
      color: #333;
    }
    
    .purchase-number {
      font-size: 20px;
      color: #023F4B;
      font-weight: bold;
    }
    
    .items-section {
      padding: 30px;
    }
    
    .items-section h3 {
      color: #023F4B;
      font-size: 18px;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #1F7F90;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }
    
    thead {
      background: linear-gradient(135deg, #023F4B 0%, #046375 100%);
      color: white;
    }
    
    th {
      padding: 15px;
      text-align: center;
      font-weight: bold;
      font-size: 14px;
    }
    
    tbody tr {
      border-bottom: 1px solid #e0e0e0;
    }
    
    tbody tr:nth-child(even) {
      background: #f9f9f9;
    }
    
    tbody tr:hover {
      background: #f0f0f0;
    }
    
    td {
      padding: 12px;
      text-align: center;
    }
    
    td:first-child {
      text-align: right;
      font-weight: 500;
    }
    
    .totals-section {
      padding: 20px 30px 30px;
      background: #f9f9f9;
    }
    
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 20px;
      margin-bottom: 10px;
      background: var(--t-surface);
      border-radius: 6px;
      border: 1px solid #e0e0e0;
    }
    
    .total-row.grand-total {
      background: linear-gradient(135deg, #023F4B 0%, #046375 100%);
      color: white;
      font-size: 20px;
      font-weight: bold;
      border: none;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    
    .total-label {
      font-weight: bold;
    }
    
    .total-amount {
      font-family: 'Courier New', monospace;
    }
    
    .invoice-footer {
      padding: 30px;
      background: #f9f9f9;
      border-top: 2px solid #1F7F90;
    }
    
    .signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 50px;
      margin-top: 50px;
    }
    
    .signature-box {
      text-align: center;
    }
    
    .signature-line {
      border-top: 2px solid #333;
      margin-bottom: 10px;
      padding-top: 5px;
    }
    
    .signature-label {
      font-weight: bold;
      color: #666;
      font-size: 14px;
    }
    
    .notes-section {
      margin-bottom: 30px;
    }
    
    .notes-section h4 {
      color: #023F4B;
      margin-bottom: 10px;
    }
    
    .notes-content {
      background: var(--t-surface);
      padding: 15px;
      border-radius: 6px;
      border: 1px solid #e0e0e0;
      min-height: 60px;
    }
    
    .stamp-area {
      text-align: center;
      margin-top: 30px;
      padding: 20px;
      border: 2px dashed #ccc;
      border-radius: 8px;
      color: #999;
    }
    
    @media print {
      body {
        padding: 0;
      }
      
      .invoice-container {
        border: none;
      }
      
      @page {
        margin: 10mm;
      }
    }
    
    .status-badge {
      display: inline-block;
      padding: 5px 15px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
    }
    
    .status-pending {
      background: #fff3cd;
      color: #856404;
    }
    
    .status-received {
      background: #d4edda;
      color: #155724;
    }
    
    .status-partial {
      background: #d1ecf1;
      color: #0c5460;
    }
  `
  
  const htmlContent = 
'<!DOCTYPE html>' +
'<html dir="rtl" lang="ar">' +
'<head>' +
'  <meta charset="UTF-8">' +
'  <title>أمر شراء - ' + fullPurchase.purchaseNumber + '</title>' +
'  <style>' + cssStyles + '</style>' +
'</head>' +
'<body>' +
'  <div class="invoice-container">' +
'    <!-- Header -->' +
'    <div class="invoice-header">' +
'      <div class="cafe-logo">' +
'        <img src="' + logoImg + '" alt="Gusto Restaurant" style="width: 100%; height: 100%; object-fit: contain;" />' +
'      </div>' +
'      <div class="company-name">مطعم جوستو</div>' +
'      <div class="company-tagline">Gusto Restaurant</div>' +
'      <div class="document-title">أمر شراء - Purchase Order</div>' +
'    </div>'
    +
'    <!-- Info Section -->' +
'    <div class="info-section">' +
'      <div class="info-box" style="max-width: 600px; margin: 0 auto;">' +
'        <h3>📋 معلومات أمر الشراء</h3>' +
'        <div class="info-row">' +
'          <span class="info-label">رقم الأمر:</span>' +
'          <span class="info-value purchase-number">' + fullPurchase.purchaseNumber + '</span>' +
'        </div>' +
'        <div class="info-row">' +
'          <span class="info-label">تاريخ الطلب:</span>' +
'          <span class="info-value">' + formatDateShort(fullPurchase.purchaseDate) + '</span>' +
'        </div>' +
'        <div class="info-row">' +
'          <span class="info-label">تاريخ التسليم المتوقع:</span>' +
'          <span class="info-value">' + (fullPurchase.expectedDeliveryDate ? formatDateShort(fullPurchase.expectedDeliveryDate) : 'غير محدد') + '</span>' +
'        </div>' +
'      </div>' +
'    </div>'
    +
'    <!-- Items Section -->' +
'    <div class="items-section">' +
'      <h3>📦 الأصناف المطلوبة</h3>' +
'      <table>' +
'        <thead>' +
'          <tr>' +
'            <th>اسم الصنف</th>' +
'            <th>الوحدة</th>' +
'            <th>الكمية المطلوبة</th>' +
'            <th>سعر الوحدة</th>' +
'            <th>المجموع</th>' +
'          </tr>' +
'        </thead>' +
'        <tbody>' +
          itemsHtml +
'        </tbody>' +
'      </table>' +
'    </div>'
    +
'    <!-- Totals Section -->' +
'    <div class="totals-section">' +
'      <div class="total-row">' +
'        <span class="total-label">عدد الأصناف:</span>' +
'        <span class="total-amount">' + fullPurchase.items.length + ' صنف</span>' +
'      </div>' +
'      <div class="total-row">' +
'        <span class="total-label">إجمالي الكمية:</span>' +
'        <span class="total-amount">' + totalQuantity + ' وحدة</span>' +
'      </div>' +
'      <div class="total-row grand-total">' +
'        <span class="total-label">💰 المبلغ الإجمالي:</span>' +
'        <span class="total-amount">' + Number(fullPurchase.totalAmount).toLocaleString() + ' د.ع</span>' +
'      </div>' +
'    </div>'
    +
'    <!-- Footer -->' +
'    <div class="invoice-footer">' +
      notesHtml +
'      ' +
'      <div class="signatures">' +
'        <div class="signature-box">' +
'          <div class="signature-line">التوقيع</div>' +
'          <div class="signature-label">المشتري</div>' +
'        </div>' +
'        <div class="signature-box">' +
'          <div class="signature-line">التاريخ</div>' +
'          <div class="signature-label">تاريخ الاستلام</div>' +
'        </div>' +
'      </div>' +
'    </div>' +
'  </div>' +
'  ' +
'  <script>' +
'    window.onload = function() {' +
'      window.print();' +
'    }' +
'  <' + '/script>' +
'<' + '/body>' +
'<' + '/html>'
  
  printWindow.document.write(htmlContent)
  printWindow.document.close()
}

const getStatusColor = (status) => {
  const colors = {
    pending: 'warning',
    partially_received: 'info',
    received: 'success',
    cancelled: 'error'
  }
  return colors[status] || 'grey'
}

const getStatusIcon = (status) => {
  const icons = {
    pending: 'mdi-clock-outline',
    partially_received: 'mdi-package-variant',
    received: 'mdi-check-circle',
    cancelled: 'mdi-close-circle'
  }
  return icons[status] || 'mdi-help-circle'
}

const getStatusText = (status) => {
  const texts = {
    pending: 'قيد الانتظار',
    partially_received: 'مستلم جزئياً',
    received: 'مستلم بالكامل',
    cancelled: 'ملغي'
  }
  return texts[status] || status
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })
}

const formatDateShort = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return day + '/' + month + '/' + year
}

const filterPurchases = () => {
  // Filter is handled by computed property
}

// Lifecycle
onMounted(() => {
  loadPurchases()
})
</script>

<style scoped>
.purchases-table :deep(.v-data-table__thead) {
  background: var(--t-surface-high);
}

.purchases-table :deep(.v-data-table__thead th) {
  color: var(--t-text-dim) !important;
  font-weight: 600 !important;
  font-size: 0.875rem !important;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.purchases-table :deep(.v-data-table__tbody tr) {
  border-bottom: 1px solid var(--t-border-subtle);
}

.purchases-table :deep(.v-data-table__tbody tr:hover) {
  background: var(--t-surface-high) !important;
}
</style>

