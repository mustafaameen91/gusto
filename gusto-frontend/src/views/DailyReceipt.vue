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
                    صندوق اليومية - إدارة العمليات المالية
                  </p>
                  <p class="text-body-2 text-white" style="opacity: 0.85;">
                    {{ currentDate }}
                  </p>
                </div>
              </div>
              <div class="d-flex align-center ga-3">
                <v-chip 
                  v-if="currentReceipt" 
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
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>
      <!-- Header Actions -->
      <div class="d-flex align-center justify-space-between mb-6 flex-wrap">
        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              variant="outlined"
              size="large"
              style="border-color: var(--t-border); color: var(--t-text);"
            >
              <PhDotsThreeVertical :size="20" weight="bold" class="ml-1" />
              <PhDownload :size="20" weight="bold" class="mr-1" />
            </v-btn>
          </template>
          <v-list>
            <v-list-item @click="exportToExcel">
              <template v-slot:prepend>
                <PhDownload :size="20" weight="bold" color="#046375" class="ml-2" />
              </template>
              <v-list-item-title>تصدير Excel</v-list-item-title>
            </v-list-item>
            <v-list-item @click="printReport">
              <template v-slot:prepend>
                <PhPrinter :size="20" weight="bold" color="#046375" class="ml-2" />
              </template>
              <v-list-item-title>طباعة التقرير</v-list-item-title>
            </v-list-item>
            <v-divider class="my-2" />
            <v-list-item @click="loadPreviousReceipts">
              <template v-slot:prepend>
                <PhArrowClockwise :size="20" weight="bold" color="#046375" class="ml-2" />
              </template>
              <v-list-item-title>تحديث</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
        </div>
        <!-- Current Receipt Status -->
      <v-row class="mb-6">
          <v-col cols="12">
          <v-card 
            v-if="currentReceipt" 
            elevation="0"
            style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;"
          >
            <v-card-text class="pa-6">
              <div class="d-flex align-center justify-space-between mb-6 flex-wrap">
                <div>
                  <h2 class="text-h5 font-weight-bold mb-2" style="color: var(--t-text);">
                    حالة الصندوق: مفتوح
                  </h2>
                  <p v-if="currentReceipt.openedByName" class="text-body-2 mb-0" style="color: var(--t-text-dim);">
                      فتح بواسطة: {{ currentReceipt.openedByName }}
                  </p>
                </div>
                <v-btn 
                  v-if="canManageCashRegister"
                  color="#046375"
                  variant="flat"
                  size="large"
                  @click="showCloseDialog = true"
                  style="border-radius: 12px;"
                >
                  <PhLockKey :size="20" weight="bold" class="ml-1" />
                  إغلاق الصندوق
                </v-btn>
              </div>
              <v-row>
                <v-col cols="12" sm="6" md="3">
                  <div class="mb-2">
                    <p class="text-body-2 mb-1" style="color: var(--t-text-dim); font-weight: 500;">رصيد الافتتاح</p>
                    <h3 class="text-h5 font-weight-bold mb-0" style="color: var(--t-text);">
                      {{ Number(currentReceipt.openingCash || 0).toLocaleString() }} د.ع
                    </h3>
                    </div>
                  </v-col>
                <v-col cols="12" sm="6" md="3">
                  <div class="mb-2">
                    <p class="text-body-2 mb-1" style="color: var(--t-text-dim); font-weight: 500;">مبيعات اليوم</p>
                    <h3 class="text-h5 font-weight-bold mb-0" style="color: #10B981;">
                      {{ Number(currentReceipt.totalSales || 0).toLocaleString() }} د.ع
                    </h3>
                  </div>
                </v-col>
                <v-col cols="12" sm="6" md="3">
                  <div class="mb-2">
                    <p class="text-body-2 mb-1" style="color: var(--t-text-dim); font-weight: 500;">مبيعات نقدية</p>
                    <h3 class="text-h6 font-weight-bold mb-0" style="color: #059669;">
                      {{ Number(currentReceipt.cashSales || 0).toLocaleString() }} د.ع
                    </h3>
                  </div>
                </v-col>
                <v-col cols="12" sm="6" md="3">
                  <div class="mb-2">
                    <p class="text-body-2 mb-1" style="color: var(--t-text-dim); font-weight: 500;">مبيعات بطاقة (تذهب للبنك)</p>
                    <h3 class="text-h6 font-weight-bold mb-0" style="color: #2563EB;">
                      {{ Number(currentReceipt.cardSales || 0).toLocaleString() }} د.ع
                    </h3>
                  </div>
                </v-col>
                <v-col cols="12" sm="6" md="3">
                  <div class="mb-2">
                    <p class="text-body-2 mb-1" style="color: var(--t-text-dim); font-weight: 500;">مبيعات آجل</p>
                    <h3 class="text-h6 font-weight-bold mb-0" style="color: #0D9488;">
                      {{ Number(currentReceipt.creditSales || 0).toLocaleString() }} د.ع
                    </h3>
                  </div>
                </v-col>
                <v-col cols="12" sm="6" md="3">
                  <div class="mb-2">
                    <p class="text-body-2 mb-1" style="color: var(--t-text-dim); font-weight: 500;">مصروفات من الصندوق</p>
                    <h3 class="text-h5 font-weight-bold mb-0" style="color: #DC2626;">
                      -{{ Number(currentReceipt.cashExpenses ?? currentReceipt.totalExpenses ?? 0).toLocaleString() }} د.ع
                    </h3>
                  </div>
                  </v-col>
                <v-col cols="12" sm="6" md="3">
                  <div class="mb-2">
                    <p class="text-body-2 mb-1" style="color: var(--t-text-dim); font-weight: 500;">إيرادات خارجية</p>
                    <h3 class="text-h5 font-weight-bold mb-0" style="color: #059669;">
                      +{{ Number(currentReceipt.otherIncomesCash ?? 0).toLocaleString() }} د.ع
                    </h3>
                  </div>
                  </v-col>
                <v-col cols="12" sm="6" md="3">
                  <div class="mb-2">
                    <p class="text-body-2 mb-1" style="color: var(--t-text-dim); font-weight: 500;">الرصيد المتوقع</p>
                    <h3 class="text-h5 font-weight-bold mb-0" style="color: #046375;">
                      {{ Number(expectedBalance).toLocaleString() }} د.ع
                    </h3>
                  </div>
                </v-col>
                </v-row>
              </v-card-text>
            </v-card>

          <v-card 
            v-else 
            elevation="0"
            style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;"
          >
            <v-card-text class="text-center py-12">
              <div style="width: 80px; height: 80px; border-radius: 50%; background: var(--t-border-subtle); display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
                <PhCashRegister :size="40" weight="thin" color="#9CA3AF" />
              </div>
              <h3 class="text-h5 font-weight-bold mb-2" style="color: var(--t-text);">الصندوق مغلق</h3>
              <p class="text-body-2 mb-6" style="color: var(--t-text-dim);">ابدأ يومك بفتح الصندوق</p>
              <v-btn 
                v-if="canManageCashRegister"
                color="#046375"
                variant="flat"
                size="large"
                @click="showOpenDialog = true"
                style="border-radius: 12px;"
              >
                <PhLockKeyOpen :size="20" weight="bold" class="ml-1" />
                  فتح الصندوق
                </v-btn>
              <v-alert 
                v-else 
                type="warning" 
                variant="tonal"
                class="mt-4"
                style="max-width: 500px; margin: 0 auto; border-radius: 8px;"
              >
                فقط المدير أو المشرف يمكنه فتح الصندوق
              </v-alert>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Today's Transactions (if receipt is open) -->
      <v-row v-if="currentReceipt" class="mb-6">
          <v-col cols="12">
          <v-card
            elevation="0"
            style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;"
          >
            <v-card-title class="pa-4" style="border-bottom: 1px solid var(--t-border-subtle);">
              <div class="text-h6 font-weight-bold" style="color: var(--t-text);">معاملات اليوم</div>
            </v-card-title>
              <v-data-table
                :headers="transactionHeaders"
                :items="todayTransactions"
                :items-per-page="10"
              density="comfortable"
              class="receipts-table"
              >
                <template v-slot:item.type="{ item }">
                <v-chip 
                  :style="item.type === 'sale' ? 'background: #D1FAE5; color: #10B981;' : item.type === 'other_income' ? 'background: #CCFBF1; color: #059669;' : 'background: #FEE2E2; color: #DC2626;'"
                  size="small"
                >
                    {{ item.type === 'sale' ? 'مبيعات' : item.type === 'other_income' ? 'إيرادات خارجية' : 'مصروفات' }}
                  </v-chip>
                </template>
                <template v-slot:item.amount="{ item }">
                <span :style="(item.type === 'sale' || item.type === 'other_income') ? 'color: #10B981; font-weight: 600;' : 'color: #DC2626; font-weight: 600;'">
                    {{ (item.type === 'sale' || item.type === 'other_income') ? '+' : '-' }}{{ Number(item.amount || 0).toLocaleString() }} د.ع
                  </span>
                </template>
                <template v-slot:item.timestamp="{ item }">
                  {{ formatTime(item.timestamp) }}
                </template>
              </v-data-table>
            </v-card>
          </v-col>
        </v-row>

        <!-- Previous Receipts -->
      <v-row>
          <v-col cols="12">
          <v-card
            elevation="0"
            style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;"
          >
            <v-card-title class="pa-4" style="border-bottom: 1px solid var(--t-border-subtle);">
              <div class="text-h6 font-weight-bold" style="color: var(--t-text);">سجل الصناديق السابقة</div>
            </v-card-title>
              <v-data-table
                :headers="receiptHeaders"
                :items="previousReceipts"
                :items-per-page="10"
                :loading="loading.previousReceipts"
              density="comfortable"
              class="receipts-table"
              >
                <template v-slot:item.isClosed="{ item }">
                <v-chip 
                  :style="!item.isClosed ? 'background: #10B981; color: white;' : 'background: #9CA3AF; color: white;'"
                  size="small"
                >
                    {{ !item.isClosed ? 'مفتوح' : 'مغلق' }}
                  </v-chip>
                </template>
                <template v-slot:item.openingCash="{ item }">
                <span style="color: #046375; font-weight: 600;">
                  {{ Number(item.openingCash || 0).toLocaleString() }} د.ع
                </span>
                </template>
                <template v-slot:item.totalSales="{ item }">
                <span style="color: #046375; font-weight: 600;">
                  {{ Number(item.totalSales || 0).toLocaleString() }} د.ع
                </span>
                </template>
                <template v-slot:item.closingCash="{ item }">
                <span style="color: #046375; font-weight: 600;">
                  {{ item.closingCash ? Number(item.closingCash).toLocaleString() + ' د.ع' : '-' }}
                </span>
                </template>
                <template v-slot:item.openedAt="{ item }">
                  {{ formatDateTime(item.openedAt) }}
                </template>
                <template v-slot:item.closedAt="{ item }">
                  {{ item.closedAt ? formatDateTime(item.closedAt) : '-' }}
                </template>
                <template v-slot:item.actions="{ item }">
                  <v-btn
                    icon
                    size="small"
                    variant="text"
                  style="color: #046375;"
                    @click="viewReceipt(item)"
                    title="عرض التفاصيل"
                  >
                    <PhEye :size="20" weight="bold" />
                  </v-btn>
                </template>
              </v-data-table>
            </v-card>
          </v-col>
        </v-row>
      </v-container>

    <!-- Open Receipt Dialog -->
    <v-dialog v-model="showOpenDialog" max-width="500" persistent>
      <v-card elevation="0" style="border-radius: 16px; overflow: hidden;">
        <!-- Header -->
        <div style="background: #046375; padding: 24px;">
          <div class="d-flex align-center">
            <div style="width: 48px; height: 48px; border-radius: 10px; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; margin-left: 12px;">
              <PhLockKeyOpen :size="24" weight="bold" color="white" />
            </div>
            <div>
              <h3 class="text-h6 font-weight-bold text-white mb-1">
                فتح الصندوق
              </h3>
              <p class="text-body-2 text-white mb-0" style="opacity: 0.9;">
                ابدأ يومك بفتح الصندوق وإدخال رصيد البداية
              </p>
            </div>
          </div>
        </div>
        <v-card-text class="pa-6" style="background: var(--t-surface);">
          <v-alert 
            type="info" 
            variant="tonal" 
            class="mb-4"
            style="border-radius: 8px;"
          >
            ابدأ يومك بفتح الصندوق وإدخال رصيد البداية
          </v-alert>
          
          <v-select
            v-model="selectedCashier"
            :items="staffList"
            item-title="fullName"
            item-value="idStaff"
            label="اختر الصراف"
            variant="outlined"
            density="comfortable"
            class="mb-4"
            required
            color="#046375"
          >
            <template v-slot:item="{ props, item }">
              <v-list-item v-bind="props">
                <template v-slot:subtitle>
                  {{ item.raw.role === 'admin' ? 'مدير' : item.raw.role === 'cashier' ? 'صراف' : item.raw.role }}
                </template>
              </v-list-item>
            </template>
          </v-select>

          <v-text-field
            v-model.number="openingBalance"
            label="رصيد الافتتاح"
            type="number"
            step="0.01"
            suffix="د.ع"
            variant="outlined"
            density="comfortable"
            class="mb-4"
            color="#046375"
          />
          <v-textarea
            v-model="openingNotes"
            label="ملاحظات"
            variant="outlined"
            density="comfortable"
            rows="2"
            color="#046375"
          />
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4" style="background: var(--t-surface-high);">
          <v-btn 
            variant="text"
            size="large"
            @click="showOpenDialog = false"
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
            @click="openReceipt" 
            :loading="saving" 
            :disabled="!selectedCashier"
            style="border-radius: 8px;"
          >
            <PhLockKeyOpen :size="20" weight="bold" class="ml-1" />
            فتح الصندوق
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Close Receipt Dialog (scrollable body) -->
    <v-dialog v-model="showCloseDialog" max-width="560" persistent content-class="close-receipt-dialog">
      <v-card elevation="0" class="d-flex flex-column" style="border-radius: 16px; overflow: hidden; max-height: 90vh;">
        <!-- Fixed header -->
        <div class="close-dialog-header flex-shrink-0">
          <div class="d-flex align-center">
            <div class="close-dialog-icon">
              <PhLockKey :size="24" weight="bold" color="white" />
            </div>
            <div>
              <h3 class="text-h6 font-weight-bold text-white mb-1">إغلاق الصندوق</h3>
              <p class="text-body-2 text-white mb-0" style="opacity: 0.9;">عد النقود ثم أدخل الرصيد الفعلي</p>
            </div>
          </div>
        </div>

        <!-- Scrollable body -->
        <v-card-text class="close-dialog-body flex-grow-1 pa-0">
          <div class="pa-5">
            <v-alert type="warning" variant="tonal" density="compact" class="mb-4" style="border-radius: 10px;">
              تأكد من عد النقود قبل إغلاق الصندوق. سيتم ترحيل القيود تلقائياً ثم فتح شفت جديد.
            </v-alert>

            <!-- Summary card -->
            <div class="close-summary-card mb-5">
              <div class="close-summary-row">
                <span class="close-summary-label">رصيد الافتتاح</span>
                <strong class="close-summary-value">{{ Number(currentReceipt?.openingCash || 0).toLocaleString() }} د.ع</strong>
              </div>
              <div class="close-summary-row">
                <span class="close-summary-label">مبيعات نقدية</span>
                <strong class="close-summary-value" style="color: #059669;">+{{ Number(currentReceipt?.cashSales ?? 0).toLocaleString() }} د.ع</strong>
              </div>
              <div class="close-summary-row">
                <span class="close-summary-label">مبيعات بطاقة (ليست في الصندوق)</span>
                <strong class="close-summary-value" style="color: #2563EB;">{{ Number(currentReceipt?.cardSales ?? 0).toLocaleString() }} د.ع</strong>
              </div>
              <div class="close-summary-row">
                <span class="close-summary-label">مبيعات آجل (لا تدخل الصندوق)</span>
                <strong class="close-summary-value" style="color: #0D9488;">{{ Number(currentReceipt?.creditSales ?? 0).toLocaleString() }} د.ع</strong>
              </div>
              <div class="close-summary-row">
                <span class="close-summary-label">مصروفات من الصندوق</span>
                <strong class="close-summary-value" style="color: #DC2626;">-{{ Number(currentReceipt?.cashExpenses ?? currentReceipt?.totalExpenses ?? 0).toLocaleString() }} د.ع</strong>
              </div>
              <div class="close-summary-row">
                <span class="close-summary-label">إيرادات خارجية نقدية</span>
                <strong class="close-summary-value" style="color: #059669;">+{{ Number(currentReceipt?.otherIncomesCash ?? 0).toLocaleString() }} د.ع</strong>
              </div>
              <div class="close-summary-row">
                <span class="close-summary-label">تحصيلات العملاء والإكراميات − المرتجعات النقدية</span>
                <strong class="close-summary-value" :style="{ color: (currentReceipt?.customerCash ?? 0) >= 0 ? '#059669' : '#DC2626' }">{{ (currentReceipt?.customerCash ?? 0) >= 0 ? '+' : '' }}{{ Number(currentReceipt?.customerCash ?? 0).toLocaleString() }} د.ع</strong>
              </div>
              <div class="close-summary-row">
                <span class="close-summary-label">مشتريات نقدية من الصندوق</span>
                <strong class="close-summary-value" style="color: #DC2626;">-{{ Number(currentReceipt?.cashPurchases ?? 0).toLocaleString() }} د.ع</strong>
              </div>
              <v-divider class="my-3" />
              <div class="close-summary-row">
                <span class="close-summary-label font-weight-bold" style="color: var(--t-text);">الرصيد المتوقع</span>
                <strong class="text-h6" style="color: #046375;">{{ Number(expectedBalance || 0).toLocaleString() }} د.ع</strong>
              </div>
            </div>

            <!-- Actual balance (primary input) -->
            <v-text-field
              v-model.number="actualBalance"
              label="الرصيد الفعلي (المعد)"
              type="number"
              step="1"
              suffix="د.ع"
              variant="outlined"
              density="comfortable"
              autofocus
              class="mb-4"
              color="#046375"
              hide-details="auto"
              style="border-radius: 10px;"
            />

            <v-alert
              v-if="difference !== 0"
              :type="difference > 0 ? 'success' : 'error'"
              variant="tonal"
              density="compact"
              class="mb-4"
              style="border-radius: 10px;"
            >
              {{ difference > 0 ? 'فائض' : 'عجز' }}: {{ Number(Math.abs(difference)).toLocaleString() }} د.ع
            </v-alert>

            <!-- المبلغ المعاد: رصيد افتتاح الشفت الجديد (يمكن أن يختلف عن الرصيد الفعلي) -->
            <v-text-field
              v-model.number="nextShiftOpeningCash"
              label="المبلغ المعاد (رصيد افتتاح الشفت الجديد)"
              hint="المبلغ الذي تتركه في الصندوق لليوم التالي — يمكن أن يختلف عن الرصيد الفعلي"
              type="number"
              step="1"
              suffix="د.ع"
              variant="outlined"
              density="comfortable"
              class="mb-4"
              color="#046375"
              hide-details="auto"
              persistent-hint
              style="border-radius: 10px;"
            />

            <!-- Currency count (optional) -->
            <p class="text-body-2 mb-2 font-weight-medium" style="color: var(--t-text-dim);">عد العملات حسب الفئة (اختياري)</p>
            <div class="close-currency-grid mb-4">
              <div v-for="(row, i) in cashCountRows" :key="i" class="close-currency-row">
                <span class="close-currency-label">{{ Number(row.denomination).toLocaleString() }}</span>
                <v-text-field
                  v-model.number="row.quantity"
                  type="number"
                  min="0"
                  density="compact"
                  variant="outlined"
                  hide-details
                  class="close-currency-input"
                />
              </div>
            </div>

            <v-textarea
              v-model="closingNotes"
              label="ملاحظات الإغلاق"
              variant="outlined"
              density="comfortable"
              rows="2"
              color="#046375"
              hide-details="auto"
              style="border-radius: 10px;"
            />
          </div>
        </v-card-text>

        <!-- Fixed footer -->
        <v-divider />
        <v-card-actions class="close-dialog-actions flex-shrink-0 pa-4">
          <v-btn
            variant="text"
            size="large"
            @click="showCloseDialog = false"
            style="color: var(--t-text-dim);"
          >
            <PhX :size="20" weight="bold" class="ml-1" />
            إلغاء
          </v-btn>
          <v-spacer />
          <v-btn
            color="#DC2626"
            variant="flat"
            size="large"
            @click="closeReceipt"
            :loading="saving"
            style="border-radius: 10px;"
          >
            <PhLockKey :size="20" weight="bold" class="ml-1" />
            إغلاق الصندوق
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Printable end-of-shift summary (after close) -->
    <v-dialog v-model="showPrintSummary" max-width="520" persistent content-class="print-summary-dialog">
      <v-card elevation="0" class="print-summary-card" style="border-radius: 16px; overflow: hidden;">
        <div class="pa-5">
          <h3 class="text-h6 font-weight-bold mb-4" style="color: var(--t-text);">ملخص نهاية الشفت</h3>
          <div ref="printSummaryContent" class="shift-print-summary">
            <div class="print-summary-meta mb-4">
              <p class="mb-1 text-body-2" style="color: var(--t-text-dim);">التاريخ: {{ lastCloseSummary?.receiptDate || currentDate }}</p>
              <p class="mb-0 text-body-2" style="color: var(--t-text-dim);">الشفت: {{ lastCloseSummary?.shiftNumber ?? '—' }}</p>
            </div>
            <div class="print-summary-rows">
              <div class="print-summary-row">
                <span>رصيد الافتتاح</span>
                <strong>{{ Number(lastCloseSummary?.openingCash ?? 0).toLocaleString() }} د.ع</strong>
              </div>
              <div class="print-summary-row">
                <span>مبيعات نقدية</span>
                <strong style="color: #059669;">+{{ Number(lastCloseSummary?.cashSales ?? 0).toLocaleString() }} د.ع</strong>
              </div>
              <div class="print-summary-row">
                <span>مبيعات بطاقة (ليست في الصندوق)</span>
                <strong style="color: #2563EB;">{{ Number(lastCloseSummary?.cardSales ?? 0).toLocaleString() }} د.ع</strong>
              </div>
              <div class="print-summary-row">
                <span>مبيعات آجل (لا تدخل الصندوق)</span>
                <strong style="color: #0D9488;">{{ Number(lastCloseSummary?.creditSales ?? 0).toLocaleString() }} د.ع</strong>
              </div>
              <div class="print-summary-row">
                <span>مصروفات من الصندوق</span>
                <strong style="color: #DC2626;">-{{ Number(lastCloseSummary?.cashExpenses ?? lastCloseSummary?.totalExpenses ?? 0).toLocaleString() }} د.ع</strong>
              </div>
              <div class="print-summary-row">
                <span>إيرادات خارجية نقدية</span>
                <strong style="color: #059669;">+{{ Number(lastCloseSummary?.otherIncomesCash ?? 0).toLocaleString() }} د.ع</strong>
              </div>
              <div class="print-summary-row">
                <span>تحصيلات العملاء والإكراميات − المرتجعات النقدية</span>
                <strong>{{ Number(lastCloseSummary?.customerCash ?? 0).toLocaleString() }} د.ع</strong>
              </div>
              <div class="print-summary-row">
                <span>مشتريات نقدية من الصندوق</span>
                <strong style="color: #DC2626;">-{{ Number(lastCloseSummary?.cashPurchases ?? 0).toLocaleString() }} د.ع</strong>
              </div>
              <v-divider class="my-3" />
              <div class="print-summary-row">
                <span>الرصيد المتوقع</span>
                <strong style="color: #046375;">{{ Number(lastCloseSummary?.expectedCash ?? 0).toLocaleString() }} د.ع</strong>
              </div>
              <div class="print-summary-row">
                <span>الرصيد الفعلي (الإغلاق)</span>
                <strong>{{ Number(lastCloseSummary?.closingCash ?? 0).toLocaleString() }} د.ع</strong>
              </div>
              <div class="print-summary-row">
                <span>الفرق (فائض/عجز)</span>
                <strong :style="{ color: (lastCloseSummary?.discrepancy ?? 0) >= 0 ? '#059669' : '#DC2626' }">
                  {{ (lastCloseSummary?.discrepancy ?? 0) >= 0 ? '+' : '' }}{{ Number(lastCloseSummary?.discrepancy ?? 0).toLocaleString() }} د.ع
                </strong>
              </div>
            </div>

            <!-- Cash denomination counts -->
            <div v-if="lastCloseSummary?.cashCounts?.length" class="mt-4">
              <v-divider class="mb-3" />
              <p class="text-body-2 font-weight-bold mb-3" style="color: var(--t-text);">
                <PhCoins :size="18" weight="duotone" style="vertical-align: middle;" class="ml-1" />
                عد العملات حسب الفئة
              </p>
              <div class="cash-count-grid">
                <div
                  v-for="c in lastCloseSummary.cashCounts"
                  :key="c.denomination"
                  class="cash-count-item"
                >
                  <span class="cash-count-denom">{{ Number(c.denomination).toLocaleString() }}</span>
                  <span class="cash-count-qty">× {{ c.quantity }}</span>
                  <span class="cash-count-total">{{ Number(c.denomination * c.quantity).toLocaleString() }}</span>
                </div>
                <v-divider class="my-2" />
                <div class="d-flex justify-space-between">
                  <span class="text-body-2 font-weight-bold" style="color: var(--t-text);">المجموع</span>
                  <span class="text-body-2 font-weight-bold" style="color: #046375;">
                    {{ Number(lastCloseSummary.cashCounts.reduce((s, c) => s + c.denomination * c.quantity, 0)).toLocaleString() }} د.ع
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <v-divider />
        <v-card-actions class="pa-4" style="background: var(--t-surface-high);">
          <v-spacer />
          <v-btn color="#046375" variant="flat" size="large" @click="printShiftSummary" style="border-radius: 10px;">
            <PhPrinter :size="20" weight="bold" class="ml-1" />
            طباعة
          </v-btn>
          <v-btn variant="text" size="large" @click="showPrintSummary = false" style="color: var(--t-text-dim);">
            إغلاق
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- View Receipt Detail Dialog -->
    <v-dialog v-model="showReceiptDetail" max-width="560">
      <v-card elevation="0" style="border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #046375 0%, #1F7F90 100%); padding: 24px;">
          <div class="d-flex align-center">
            <div style="width: 48px; height: 48px; border-radius: 10px; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; margin-left: 12px;">
              <PhEye :size="24" weight="bold" color="white" />
            </div>
            <div>
              <h3 class="text-h6 font-weight-bold text-white mb-1">تفاصيل الصندوق</h3>
              <p class="text-body-2 text-white mb-0" style="opacity: 0.9;">
                {{ detailReceipt?.receiptDate }} — شفت {{ detailReceipt?.shiftNumber ?? '—' }}
              </p>
            </div>
          </div>
        </div>
        <v-card-text class="pa-5" v-if="detailReceipt">
          <div class="print-summary-rows">
            <div class="print-summary-row">
              <span>رصيد الافتتاح</span>
              <strong>{{ Number(detailReceipt.openingCash || 0).toLocaleString() }} د.ع</strong>
            </div>
            <div class="print-summary-row">
              <span>المبيعات</span>
              <strong style="color: #059669;">+{{ Number(detailReceipt.totalSales || 0).toLocaleString() }} د.ع</strong>
            </div>
            <div class="print-summary-row">
              <span>المصروفات</span>
              <strong style="color: #DC2626;">-{{ Number(detailReceipt.totalExpenses || 0).toLocaleString() }} د.ع</strong>
            </div>
            <v-divider class="my-3" />
            <div class="print-summary-row">
              <span>الرصيد المتوقع</span>
              <strong style="color: #046375;">{{ Number(detailReceipt.expectedCash || 0).toLocaleString() }} د.ع</strong>
            </div>
            <div class="print-summary-row">
              <span>الرصيد الفعلي (الإغلاق)</span>
              <strong>{{ Number(detailReceipt.closingCash || 0).toLocaleString() }} د.ع</strong>
            </div>
            <div class="print-summary-row">
              <span>الفرق</span>
              <strong :style="{ color: (detailReceipt.discrepancy ?? 0) >= 0 ? '#059669' : '#DC2626' }">
                {{ (detailReceipt.discrepancy ?? 0) >= 0 ? '+' : '' }}{{ Number(detailReceipt.discrepancy ?? 0).toLocaleString() }} د.ع
              </strong>
            </div>
          </div>

          <!-- Cash counts for this receipt -->
          <div v-if="detailCashCounts.length" class="mt-4">
            <v-divider class="mb-3" />
            <p class="text-body-2 font-weight-bold mb-3" style="color: var(--t-text);">
              <PhCoins :size="18" weight="duotone" style="vertical-align: middle;" class="ml-1" />
              عد العملات حسب الفئة
            </p>
            <div class="cash-count-grid">
              <div v-for="c in detailCashCounts" :key="c.denomination" class="cash-count-item">
                <span class="cash-count-denom">{{ Number(c.denomination).toLocaleString() }}</span>
                <span class="cash-count-qty">× {{ c.quantity }}</span>
                <span class="cash-count-total">{{ Number(c.denomination * c.quantity).toLocaleString() }}</span>
              </div>
              <v-divider class="my-2" />
              <div class="d-flex justify-space-between">
                <span class="text-body-2 font-weight-bold" style="color: var(--t-text);">المجموع</span>
                <span class="text-body-2 font-weight-bold" style="color: #046375;">
                  {{ Number(detailCashCounts.reduce((s, c) => s + c.denomination * c.quantity, 0)).toLocaleString() }} د.ع
                </span>
              </div>
            </div>
          </div>
          <div v-else-if="!loading.detailCashCounts" class="mt-4 text-center">
            <p class="text-body-2 mb-0" style="color: var(--t-text-dim);">لم يتم تسجيل عد للعملات</p>
          </div>
          <div v-else class="mt-4 text-center pa-3">
            <v-progress-circular indeterminate size="24" color="#046375" />
          </div>

          <div v-if="detailReceipt.notes" class="mt-4">
            <v-divider class="mb-3" />
            <p class="text-body-2 font-weight-bold mb-1" style="color: var(--t-text);">ملاحظات</p>
            <p class="text-body-2 mb-0" style="color: var(--t-text-dim);">{{ detailReceipt.notes }}</p>
          </div>

          <div class="mt-4 d-flex ga-4 flex-wrap">
            <div v-if="detailReceipt.openedByName">
              <p class="text-caption mb-0" style="color: var(--t-text-dim);">فتح بواسطة</p>
              <p class="text-body-2 font-weight-medium mb-0" style="color: var(--t-text);">{{ detailReceipt.openedByName }}</p>
            </div>
            <div v-if="detailReceipt.closedByName">
              <p class="text-caption mb-0" style="color: var(--t-text-dim);">أُغلق بواسطة</p>
              <p class="text-body-2 font-weight-medium mb-0" style="color: var(--t-text);">{{ detailReceipt.closedByName }}</p>
            </div>
          </div>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" size="large" @click="showReceiptDetail = false" style="color: var(--t-text-dim);">
            إغلاق
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </AppLayout>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'
import { staffAPI, dailyReceiptAPI, orderAPI, otherIncomesAPI } from '@/services/api'
import { formatDateTime, formatCurrentDateArabic } from '@/utils/dateFormatter'
import logoImg from '@/assets/logo.png'
import AppLayout from '@/components/AppLayout.vue'
import { PhLockKeyOpen, PhLockKey, PhCashRegister, PhEye, PhDotsThreeVertical, PhDownload, PhPrinter, PhArrowClockwise, PhX, PhCoins } from '@phosphor-icons/vue'

const toast = useToast()
const authStore = useAuthStore()

const currentDate = computed(() => {
  return formatCurrentDateArabic()
})

const currentReceipt = ref(null)
const previousReceipts = ref([])
const todayTransactions = ref([])
const staffList = ref([])
const selectedCashier = ref(null)
const loading = ref({
  currentReceipt: false,
  previousReceipts: false,
  transactions: false,
  detailCashCounts: false
})

// Check if user can open/close cash register (admin, supervisor, or cashier)
const canManageCashRegister = computed(() => {
  const role = authStore.userRole
  return role === 'admin' || role === 'supervisor' || role === 'cashier'
})

const showOpenDialog = ref(false)
const showCloseDialog = ref(false)
const showPrintSummary = ref(false)
const lastCloseSummary = ref(null)
const printSummaryContent = ref(null)
const saving = ref(false)
const showReceiptDetail = ref(false)
const detailReceipt = ref(null)
const detailCashCounts = ref([])

const openingBalance = ref(0)
const openingNotes = ref('')
const actualBalance = ref(0)
/** المبلغ المعاد: الرصيد الذي يبقى في الصندوق لافتتاح الشفت الجديد (قد يختلف عن الرصيد الفعلي إذا أخرجت/أضفت نقوداً) */
const nextShiftOpeningCash = ref(0)
const closingNotes = ref('')
// عد العملات — فئات عراقية (٢٥٠، ٥٠٠، ١٠٠٠، ٥٠٠٠، ١٠٠٠٠، ٢٥٠٠٠، ٥٠٠٠٠)
const cashCountRows = ref([
  { denomination: 250, quantity: 0 },
  { denomination: 500, quantity: 0 },
  { denomination: 1000, quantity: 0 },
  { denomination: 5000, quantity: 0 },
  { denomination: 10000, quantity: 0 },
  { denomination: 25000, quantity: 0 },
  { denomination: 50000, quantity: 0 }
])

const transactionHeaders = [
  { title: 'النوع', key: 'type' },
  { title: 'الوصف', key: 'description' },
  { title: 'المبلغ', key: 'amount' },
  { title: 'الوقت', key: 'timestamp' }
]

const receiptHeaders = [
  { title: 'التاريخ', key: 'openedAt' },
  { title: 'الحالة', key: 'isClosed' },
  { title: 'رصيد الافتتاح', key: 'openingCash' },
  { title: 'المبيعات', key: 'totalSales' },
  { title: 'رصيد الإغلاق', key: 'closingCash' },
  { title: 'أغلق في', key: 'closedAt' },
  { title: 'إجراءات', key: 'actions', sortable: false }
]

// The server's figure (same calculation the shift close and the cash box use)
const expectedBalance = computed(() => Number(currentReceipt.value?.expectedCash ?? 0))

// Header action methods
const exportToExcel = () => {
  toast.info('تصدير Excel - قريباً')
}

const printReport = () => {
  toast.info('طباعة التقرير - قريباً')
}

const difference = computed(() => {
  return actualBalance.value - expectedBalance.value
})

// When opening close dialog, default "المبلغ المعاد" to actual balance (user can change e.g. to 200000 for next day)
watch(showCloseDialog, (isOpen) => {
  if (isOpen) nextShiftOpeningCash.value = actualBalance.value
})

// Helper function to format time only
const formatTime = (date) => {
  if (!date) return '-'
  const d = new Date(date)
  if (isNaN(d.getTime())) return '-'
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

const loadCurrentReceipt = async (autoOpenIfClosed = true) => {
  loading.value.currentReceipt = true
  try {
    const response = await dailyReceiptAPI.getCurrent()
    currentReceipt.value = response.data
    if (currentReceipt.value) {
      actualBalance.value = expectedBalance.value
      loadTodayTransactions()
    }
  } catch (error) {
    if (error.response?.status === 404) {
      currentReceipt.value = null
      // Automatic opening: if user can manage register and no shift is open, open one with 0
      if (autoOpenIfClosed && canManageCashRegister.value) {
        try {
          const openRes = await dailyReceiptAPI.open({
            openingCash: 0,
            notes: 'فتح تلقائي'
          })
          const data = openRes.data?.data || openRes.data
          currentReceipt.value = { ...data, idDailyReceipt: data?.idDailyReceipt ?? data?.id }
          toast.success('تم فتح الشفت تلقائياً')
          actualBalance.value = 0
          loadTodayTransactions()
        } catch (openErr) {
          if (openErr.response?.status !== 403) {
            console.error('Auto-open failed:', openErr)
          }
        }
      }
    } else {
      console.error('Failed to load current receipt:', error)
    }
  } finally {
    loading.value.currentReceipt = false
  }
}

const loadPreviousReceipts = async () => {
  loading.value.previousReceipts = true
  try {
    const response = await dailyReceiptAPI.getAll(30)
    previousReceipts.value = response.data
  } catch (error) {
    console.error('Failed to load previous receipts:', error)
  } finally {
    loading.value.previousReceipts = false
  }
}

const loadTodayTransactions = async () => {
  loading.value.transactions = true
  try {
    const shiftOfOrders = currentReceipt.value?.idDailyReceipt ?? currentReceipt.value?.id
    if (!shiftOfOrders) { todayTransactions.value = []; return }
    const response = await orderAPI.getAll({ dailyReceiptId: shiftOfOrders, limit: 500 })

    let ordersData = []
    if (Array.isArray(response.data)) {
      ordersData = response.data
    } else if (response.data?.items && Array.isArray(response.data.items)) {
      ordersData = response.data.items
    } else if (Array.isArray(response)) {
      ordersData = response
    }

    const saleRows = ordersData.filter(order => order.status !== 'cancelled').map(order => ({
      type: 'sale',
      description: `طلب #${order.orderNumber}`,
      amount: order.totalPrice || order.totalAmount,
      timestamp: order.orderDate
    }))

    const shiftId = currentReceipt.value?.idDailyReceipt ?? currentReceipt.value?.id
    let otherRows = []
    if (shiftId) {
      try {
        const oiRes = await otherIncomesAPI.list({ dailyReceiptId: shiftId })
        const oiList = Array.isArray(oiRes.data) ? oiRes.data : []
        otherRows = oiList.map(oi => ({
          type: 'other_income',
          description: oi.incomeAccountName ? `إيراد خارجي: ${oi.incomeAccountName}` : 'إيراد خارجي',
          amount: oi.amount,
          timestamp: oi.incomeDate
        }))
      } catch (_) {}
    }

    todayTransactions.value = [...saleRows, ...otherRows].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  } catch (error) {
    console.error('Failed to load transactions:', error)
  } finally {
    loading.value.transactions = false
  }
}

const loadStaff = async () => {
  // Only admins may list staff; a cashier/supervisor opens the shift as themselves
  if (authStore.user && authStore.user.role !== 'admin') {
    staffList.value = [{ idStaff: authStore.user.id, fullName: authStore.user.fullName, email: authStore.user.email, role: authStore.user.role, isActive: true }]
    selectedCashier.value = authStore.user.id
    return
  }
  try {
    const response = await staffAPI.getAll()
    // Filter only active staff with cashier or admin role
    staffList.value = response.data.filter(staff => 
      staff.isActive && (staff.role === 'cashier' || staff.role === 'admin')
    )
    
    // Set current user as default cashier if they're in the list
    if (authStore.user) {
      const currentUserStaff = staffList.value.find(s => s.email === authStore.user.email)
      if (currentUserStaff) {
        selectedCashier.value = currentUserStaff.idStaff
      }
    }
  } catch (error) {
    console.error('Failed to load staff:', error)
    toast.error('فشل تحميل قائمة الموظفين')
  }
}

const openReceipt = async () => {
  if (openingBalance.value < 0) {
    toast.error('رصيد الافتتاح يجب أن يكون صفر أو أكثر')
    return
  }

  if (!selectedCashier.value) {
    toast.error('يرجى اختيار الصراف')
    return
  }

  saving.value = true
  try {
    const response = await dailyReceiptAPI.open({
      openingCash: openingBalance.value, // ⭐ Backend expects 'openingCash'
      cashierId: selectedCashier.value,
      notes: openingNotes.value
    })
    
    // Backend returns { message, data }, so use response.data.data
    currentReceipt.value = response.data.data || response.data
    toast.success('تم فتح الصندوق بنجاح')
    showOpenDialog.value = false
    openingBalance.value = 0
    openingNotes.value = ''
    // Reload to get updated totals
    await loadCurrentReceipt()
  } catch (error) {
    if (error.response?.status === 403) {
      toast.error('ليس لديك صلاحية لفتح الصندوق. فقط المدير أو المشرف يمكنه فتح الصندوق')
    } else {
    toast.error(error.response?.data?.message || 'فشل فتح الصندوق')
    }
    console.error(error)
  } finally {
    saving.value = false
  }
}

const closeReceipt = async () => {
  if (!currentReceipt.value) return

  saving.value = true
  try {
    const cashCounts = cashCountRows.value
      .filter((r) => r.quantity > 0)
      .map((r) => ({ denomination: r.denomination, quantity: r.quantity }))
    const receiptId = currentReceipt.value.idDailyReceipt ?? currentReceipt.value.id
    const res = await dailyReceiptAPI.close(receiptId, {
      closingCash: actualBalance.value,
      notes: closingNotes.value,
      cashCounts: cashCounts.length ? cashCounts : undefined,
      nextShiftOpeningCash: nextShiftOpeningCash.value
    })
    
    toast.success('تم إغلاق الصندوق وترحيل القيود بنجاح')
    if (res.data?.newShift) {
      toast.info(`تم فتح الشفت الجديد #${res.data.newShift.shiftNumber} تلقائياً`)
    }
    showCloseDialog.value = false
    const summary = res.data?.summary ?? null
    if (summary) {
      summary.cashCounts = cashCounts.length ? cashCounts : []
    }
    lastCloseSummary.value = summary
    showPrintSummary.value = true
    currentReceipt.value = null
    closingNotes.value = ''
    actualBalance.value = 0
    nextShiftOpeningCash.value = 0
    cashCountRows.value.forEach((r) => { r.quantity = 0 })
    await loadPreviousReceipts()
    await loadCurrentReceipt()
  } catch (error) {
    const errDetail = {
      name: error?.name,
      code: error?.code,
      message: error?.message,
      timeout: error?.config?.timeout,
      url: error?.config?.url,
      method: error?.config?.method,
      responseStatus: error?.response?.status,
      responseData: error?.response?.data
    }
    console.error('[closeReceipt] Error details:', errDetail)
    console.error('[closeReceipt] Full error:', error)

    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      toast.error('انتهت مهلة الطلب. ترحيل القيود يستغرق وقتاً طويلاً. تحقق من حالة الشفت أو أعد المحاولة.')
    } else if (error.response?.status === 403) {
      toast.error('ليس لديك صلاحية لإغلاق الصندوق. فقط المدير أو المشرف يمكنه إغلاق الصندوق')
    } else {
      toast.error(error.response?.data?.message || 'فشل إغلاق الصندوق')
    }
  } finally {
    saving.value = false
  }
}

const viewReceipt = async (receipt) => {
  detailReceipt.value = receipt
  detailCashCounts.value = []
  showReceiptDetail.value = true
  
  const receiptId = receipt.idDailyReceipt || receipt.id
  if (!receiptId) return

  loading.value.detailCashCounts = true
  try {
    const res = await dailyReceiptAPI.getCashCounts(receiptId)
    detailCashCounts.value = (res.data || []).filter(c => c.quantity > 0)
  } catch (error) {
    console.error('Failed to load cash counts:', error)
  } finally {
    loading.value.detailCashCounts = false
  }
}

const printShiftSummary = () => {
  window.print()
}

onMounted(() => {
  loadCurrentReceipt()
  loadPreviousReceipts()
  loadStaff()
})
</script>

<style scoped>
.receipts-table :deep(.v-data-table__thead) {
  background: var(--t-surface-high);
}

.receipts-table :deep(.v-data-table__thead th) {
  color: var(--t-text-dim) !important;
  font-weight: 600 !important;
  font-size: 0.875rem !important;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.receipts-table :deep(.v-data-table__tbody tr) {
  border-bottom: 1px solid var(--t-border-subtle);
}

.receipts-table :deep(.v-data-table__tbody tr:hover) {
  background: var(--t-surface-high) !important;
}

/* Close receipt dialog: fixed header/footer, scrollable body */
.close-dialog-header {
  background: linear-gradient(135deg, #046375 0%, #1F7F90 100%);
  padding: 20px 24px;
}

.close-dialog-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 12px;
}

.close-dialog-body {
  overflow-y: auto;
  min-height: 0;
  background: var(--t-surface);
  -webkit-overflow-scrolling: touch;
}

.close-summary-card {
  background: var(--t-surface-high);
  padding: 16px 20px;
  border-radius: 12px;
  border: 1px solid var(--t-border);
}

.close-summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.close-summary-row:last-child {
  margin-bottom: 0;
}

.close-summary-label {
  color: var(--t-text-dim);
  font-size: 0.875rem;
}

.close-summary-value {
  color: var(--t-text);
  font-size: 0.9375rem;
}

.close-currency-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 12px;
}

.close-currency-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.close-currency-label {
  color: var(--t-text-dim);
  font-size: 0.8125rem;
  min-width: 48px;
}

.close-currency-input {
  max-width: 72px;
}

.close-dialog-actions {
  background: var(--t-surface-high);
}

.print-summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.print-summary-row strong {
  font-size: 1rem;
}
.print-summary-meta p {
  font-size: 0.875rem;
}

.cash-count-grid {
  background: var(--t-surface-high);
  border-radius: 10px;
  padding: 12px 16px;
}

.cash-count-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px solid var(--t-border-subtle);
}

.cash-count-item:last-of-type {
  border-bottom: none;
}

.cash-count-denom {
  font-weight: 600;
  color: var(--t-text);
  min-width: 80px;
}

.cash-count-qty {
  color: var(--t-text-dim);
  font-size: 0.875rem;
  min-width: 50px;
  text-align: center;
}

.cash-count-total {
  font-weight: 600;
  color: #046375;
  min-width: 100px;
  text-align: left;
}
</style>

<style>
/* Print: show only end-of-shift summary */
@media print {
  body * {
    visibility: hidden;
  }
  .print-summary-card,
  .print-summary-card * {
    visibility: visible;
  }
  .print-summary-card {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    max-width: none;
    box-shadow: none;
  }
  .v-dialog__content .v-overlay__content {
    max-width: none !important;
  }
}
</style>
