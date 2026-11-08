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
                    إدارة الطلبات - عرض وإدارة جميع الطلبات
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
        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              variant="outlined"
              size="large"
              style="border-color: #E5E7EB; color: var(--t-text);"
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
              <v-list-item-title>طباعة القائمة</v-list-item-title>
            </v-list-item>
            <v-divider class="my-2" />
            <v-list-item @click="loadOrders">
              <template v-slot:prepend>
                <PhArrowClockwise :size="20" weight="bold" color="#046375" class="ml-2" />
              </template>
              <v-list-item-title>تحديث</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
      <!-- Filters -->
      <v-card
        elevation="0"
        style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;"
        class="mb-4"
      >
        <v-card-text class="pa-4">
          <v-row>
            <v-col cols="12" md="3">
              <v-select
                v-model="filterStatus"
                :items="statusOptions"
                label="حالة الطلب"
                variant="outlined"
                density="comfortable"
                clearable
                color="#046375"
              />
            </v-col>
            <v-col cols="12" md="3">
              <v-text-field
                v-model="filterDate"
                label="التاريخ"
                type="date"
                variant="outlined"
                density="comfortable"
                clearable
                color="#046375"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="search"
                label="بحث (رقم الطلب، الكاشير...)"
                variant="outlined"
                density="comfortable"
                clearable
                color="#046375"
              >
                <template v-slot:prepend-inner>
                  <PhMagnifyingGlass :size="20" weight="bold" color="#6B7280" />
                </template>
              </v-text-field>
            </v-col>
            <v-col cols="12" md="2">
              <v-btn color="#046375" variant="flat" @click="loadOrders" block style="border-radius: 8px;">
                <PhArrowClockwise :size="20" weight="bold" class="ml-1" />
                تحديث
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

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
                <PhReceipt :size="24" weight="duotone" color="white" />
              </div>
            </div>
            <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">
              إجمالي الطلبات
            </p>
            <h2 class="text-h4 font-weight-bold mb-1" style="color: var(--t-text);">
              {{ search ? filteredOrders.length : ordersTotal }}
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
              <div style="width: 48px; height: 48px; border-radius: 10px; background: #FEF3C7; display: flex; align-items: center; justify-content: center;">
                <PhClock :size="24" weight="duotone" color="#F59E0B" />
              </div>
            </div>
            <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">
              قيد الانتظار
            </p>
            <h2 class="text-h4 font-weight-bold mb-1" style="color: var(--t-text);">
              {{ filteredStatusCount('pending') }}
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
              <div style="width: 48px; height: 48px; border-radius: 10px; background: #D1FAE5; display: flex; align-items: center; justify-content: center;">
                <PhCheckCircle :size="24" weight="duotone" color="#10B981" />
              </div>
            </div>
            <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">
              مكتمل
            </p>
            <h2 class="text-h4 font-weight-bold mb-1" style="color: var(--t-text);">
              {{ filteredStatusCount('completed') }}
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
                <PhCurrencyDollar :size="24" weight="duotone" color="white" />
              </div>
            </div>
            <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">
              إجمالي المبيعات
            </p>
            <h2 class="text-h4 font-weight-bold mb-1" style="color: var(--t-text);">
              {{ totalSales.toLocaleString() }} د.ع
            </h2>
          </v-card>
        </v-col>
      </v-row>

      <!-- Orders Table -->
      <v-card
        elevation="0"
        style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;"
      >
        <v-card-title class="pa-4">
          <div class="text-h6 font-weight-bold" style="color: var(--t-text);">قائمة الطلبات</div>
        </v-card-title>
        <v-data-table
          :headers="headers"
          :items="filteredOrders"
          :items-per-page="20"
          :loading="loading.orders"
          class="elevation-0 orders-table"
          :no-data-text="loading.orders ? 'جاري التحميل...' : 'لا توجد طلبات'"
        >
            <template v-slot:item.orderNumber="{ item }">
              <div class="d-flex align-center">
                <PhReceipt :size="20" weight="bold" class="ml-2" style="color: #046375;" />
                <span class="font-weight-bold" style="color: #046375;">{{ item.orderNumber }}</span>
              </div>
            </template>

            <template v-slot:item.tableNumber="{ item }">
              <v-chip v-if="item.tableNumber" size="small" color="info" variant="flat">
                <template v-slot:prepend>
                  <PhForkKnife :size="16" weight="bold" class="ml-1" />
                </template>
                {{ item.tableNumber }}
              </v-chip>
              <span v-else class="text-grey">-</span>
            </template>

            <template v-slot:item.status="{ item }">
              <v-chip :color="getStatusColor(item.status)" size="small">
                {{ getStatusText(item.status) }}
              </v-chip>
            </template>

            <template v-slot:item.subtotal="{ item }">
              <span class="text-body-2" style="color: #7f8c8d;">
                {{ Number(item.totalAmount || 0).toLocaleString() }} د.ع
              </span>
            </template>

            <template v-slot:item.discount="{ item }">
              <span v-if="Number(item.discount || 0) > 0" class="font-weight-bold" style="color: #e74c3c;">
                - {{ Number(item.discount || 0).toLocaleString() }} د.ع
              </span>
              <span v-else class="text-grey">-</span>
            </template>

            <template v-slot:item.totalAmount="{ item }">
              <span class="font-weight-bold" style="color: #046375;">
                {{ Number(item.totalAmount || 0).toLocaleString() }} د.ع
              </span>
            </template>

            <template v-slot:item.orderDate="{ item }">
              {{ formatDate(item.orderDate) }}
            </template>

            <template v-slot:item.cashierName="{ item }">
              {{ item.cashierName || 'غير محدد' }}
            </template>

            <template v-slot:item.orderType="{ item }">
              <v-chip size="small" style="background: var(--t-border-subtle); color: #046375;">
                {{ item.saleType === 'credit' ? 'آجل' : item.orderType === 'card' ? 'بطاقة' : item.orderType === 'qr' ? 'QR' : 'نقدي' }}
              </v-chip>
            </template>

            <template v-slot:item.actions="{ item }">
              <div class="d-flex align-center" style="gap: 2px;">
                <v-btn
                  icon
                  size="small"
                  variant="text"
                  style="color: #046375;"
                  @click="viewOrderDetails(item)"
                  title="عرض التفاصيل"
                >
                  <PhEye :size="20" weight="bold" />
                </v-btn>
                <v-btn
                  icon
                  size="small"
                  variant="text"
                  style="color: #e74c3c;"
                  @click="openReturnDialog(item)"
                  title="إرجاع"
                  :disabled="item.status === 'cancelled'"
                >
                  <PhArrowUUpLeft :size="20" weight="bold" />
                </v-btn>
                <v-btn
                  v-if="canCancel && !['cancelled', 'completed'].includes(item.status)"
                  icon
                  size="small"
                  variant="text"
                  style="color: #b91c1c;"
                  @click="cancelOrder(item)"
                  title="إلغاء الطلب"
                  aria-label="إلغاء الطلب"
                >
                  <PhXCircle :size="20" weight="bold" />
                </v-btn>
                <v-btn
                  icon
                  size="small"
                  variant="text"
                  style="color: var(--t-text-dim);"
                  @click="viewReturnsHistory(item)"
                  title="سجل المرتجعات"
                >
                  <PhClock :size="18" weight="bold" />
                </v-btn>
              </div>
            </template>
          </v-data-table>
          
          <!-- Empty State -->
          <div v-if="!loading.orders && filteredOrders.length === 0 && orders.length === 0" class="text-center py-12">
            <PhReceipt :size="64" weight="thin" color="#9CA3AF" />
            <p class="text-h6 mt-4 mb-2" style="color: var(--t-text); font-weight: 600;">لا توجد طلبات في النظام</p>
            <p class="text-body-2 mb-4" style="color: var(--t-text-dim);">قم بإنشاء طلب جديد من صفحة نقطة البيع</p>
            <v-btn
              color="#046375"
              variant="outlined"
              @click="$router.push('/cashier')"
              style="border-color: #046375;"
            >
              <PhCurrencyDollar :size="20" weight="bold" class="ml-1" />
              الذهاب إلى نقطة البيع
            </v-btn>
          </div>
          
          <!-- Filtered Empty State -->
          <div v-if="!loading && filteredOrders.length === 0 && orders.length > 0" class="text-center py-12">
            <PhFunnel :size="64" weight="thin" color="#9CA3AF" />
            <p class="text-h6 mt-4 mb-2" style="color: var(--t-text); font-weight: 600;">لا توجد طلبات تطابق الفلتر</p>
            <p class="text-body-2 mb-0" style="color: var(--t-text-dim);">جرب تغيير معايير البحث</p>
          </div>
        </v-card>
    </v-container>

    <!-- Order Details Dialog -->
    <v-dialog v-model="showOrderDialog" max-width="700">
      <v-card v-if="selectedOrder" elevation="0" style="border-radius: 16px; overflow: hidden;">
        <!-- Header -->
        <div style="background: #046375; padding: 24px;">
          <div class="d-flex align-center">
            <div style="width: 48px; height: 48px; border-radius: 10px; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; margin-left: 12px;">
              <PhReceipt :size="24" weight="bold" color="white" />
            </div>
            <div>
              <h3 class="text-h6 font-weight-bold text-white mb-1">
                تفاصيل الطلب: {{ selectedOrder.orderNumber }}
              </h3>
            </div>
          </div>
        </div>
        
        <v-card-text class="pa-6" style="background: var(--t-surface);">
          <v-row>
            <v-col cols="12" md="6">
              <div class="mb-3">
                <div class="text-caption text-grey mb-1">رقم الطلب</div>
                <div class="text-h6 font-weight-bold">{{ selectedOrder.orderNumber }}</div>
              </div>
              <div class="mb-3">
                <div class="text-caption text-grey mb-1">الحالة</div>
                <v-chip :color="getStatusColor(selectedOrder.status)" size="small">
                  {{ getStatusText(selectedOrder.status) }}
                </v-chip>
              </div>
              <div class="mb-3">
                <div class="text-caption text-grey mb-1">التاريخ والوقت</div>
                <div class="text-body-1">{{ formatDateTime(selectedOrder.orderDate) }}</div>
              </div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="mb-3">
                <div class="text-caption text-grey mb-1">الكاشير</div>
                <div class="text-body-1">{{ selectedOrder.cashierName || 'غير محدد' }}</div>
              </div>
              <div class="mb-3">
                <div class="text-caption text-grey mb-1">نوع الطلب</div>
                <div class="text-body-1">{{ selectedOrder.orderType === 'cashier' ? 'كاشير' : 'QR' }}</div>
              </div>
              <div class="mb-3" v-if="selectedOrder.tableNumber">
                <div class="text-caption text-grey mb-1">رقم الطاولة</div>
                <v-chip size="small" color="info" variant="flat">
                  <template v-slot:prepend>
                    <PhForkKnife :size="16" weight="bold" class="ml-1" />
                  </template>
                  {{ selectedOrder.tableNumber }}
                </v-chip>
              </div>
              <div class="mb-3">
                <div class="text-caption text-grey mb-1">المجموع قبل الخصم</div>
                <div class="text-body-1">
                  {{ (Number(selectedOrder.totalAmount || 0) + Number(selectedOrder.discount || 0)).toLocaleString() }} د.ع
                </div>
              </div>
              <div class="mb-3" v-if="Number(selectedOrder.discount || 0) > 0">
                <div class="text-caption text-grey mb-1">الخصم</div>
                <div class="text-body-1 font-weight-bold" style="color: #e74c3c;">
                  - {{ Number(selectedOrder.discount || 0).toLocaleString() }} د.ع
                </div>
              </div>
              <div class="mb-3">
                <div class="text-caption mb-1" style="color: var(--t-text-dim);">الإجمالي</div>
                <div class="text-h6 font-weight-bold" style="color: #046375;">
                  {{ Number(selectedOrder.totalAmount || 0).toLocaleString() }} د.ع
                </div>
              </div>
            </v-col>
          </v-row>

          <v-divider class="my-4" />

          <div class="text-h6 font-weight-bold mb-3">الأصناف</div>
          <v-list v-if="orderItems.length > 0">
            <v-list-item
              v-for="(item, index) in orderItems"
              :key="index"
              class="mb-2"
            >
              <template v-slot:prepend>
                <v-avatar color="primary" size="40">
                  <PhPackage :size="20" weight="bold" color="white" />
                </v-avatar>
              </template>
              <v-list-item-title class="font-weight-bold">
                {{ item.itemName }}
                <span v-if="item.sizeName" class="text-caption">({{ item.sizeName }})</span>
              </v-list-item-title>
              <v-list-item-subtitle>
                الكمية: {{ item.quantity }} × {{ Number(item.price).toLocaleString() }} د.ع
              </v-list-item-subtitle>
              <template v-slot:append>
                <div class="text-h6 font-weight-bold" style="color: #046375;">
                  {{ (Number(item.quantity) * Number(item.price)).toLocaleString() }} د.ع
                </div>
              </template>
            </v-list-item>
          </v-list>
          <v-alert v-else type="info" variant="tonal">
            جاري تحميل الأصناف...
          </v-alert>
        </v-card-text>

        <v-divider />
        <v-card-actions class="pa-4" style="background: var(--t-surface-high);">
          <v-spacer />
          <v-btn
            variant="flat"
            color="#046375"
            @click="showOrderDialog = false"
            style="border-radius: 8px;"
          >
            <PhX :size="20" weight="bold" class="ml-1" />
            إغلاق
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- Supervisor Auth Dialog -->
    <v-dialog v-model="showAuthDialog" max-width="420" persistent>
      <v-card elevation="0" style="border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #046375, #1F7F90); padding: 24px;">
          <div class="d-flex align-center">
            <div style="width: 48px; height: 48px; border-radius: 10px; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; margin-left: 12px;">
              <PhShieldCheck :size="24" weight="bold" color="white" />
            </div>
            <div>
              <h3 class="text-h6 font-weight-bold text-white mb-1">تأكيد الصلاحية</h3>
              <p class="text-body-2 text-white" style="opacity: 0.85;">أدخل بيانات المدير أو المشرف</p>
            </div>
          </div>
        </div>
        <v-card-text class="pa-6" style="background: var(--t-surface);">
          <v-alert v-if="authError" type="error" variant="tonal" class="mb-4" density="compact">
            {{ authError }}
          </v-alert>
          <v-text-field
            v-model="authEmail"
            label="البريد الإلكتروني"
            variant="outlined"
            density="comfortable"
            color="#046375"
            type="email"
            autofocus
            class="mb-3"
            hide-details
            @keyup.enter="$refs.authPassInput?.focus()"
          />
          <v-text-field
            ref="authPassInput"
            v-model="authPassword"
            label="كلمة المرور"
            variant="outlined"
            density="comfortable"
            color="#046375"
            type="password"
            hide-details
            @keyup.enter="verifyAuth"
          />
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4" style="background: var(--t-surface-high);">
          <v-btn variant="text" @click="cancelAuth" :disabled="loading.auth">إلغاء</v-btn>
          <v-spacer />
          <v-btn variant="flat" color="#046375" @click="verifyAuth" :loading="loading.auth" style="border-radius: 8px;">
            تأكيد
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Return Dialog -->
    <v-dialog v-model="showReturnDialog" max-width="900" persistent>
      <v-card v-if="returnOrder" elevation="0" style="border-radius: 16px; overflow: hidden;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #c0392b 0%, #e74c3c 100%); padding: 24px;">
          <div class="d-flex align-center">
            <div style="width: 48px; height: 48px; border-radius: 10px; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; margin-left: 12px;">
              <PhArrowUUpLeft :size="24" weight="bold" color="white" />
            </div>
            <div>
              <h3 class="text-h6 font-weight-bold text-white mb-1">
                إرجاع أصناف - الطلب {{ returnOrder.orderNumber }}
              </h3>
              <p class="text-body-2 text-white" style="opacity: 0.85;">
                اختر الأصناف المراد إرجاعها وحدد نوع الإرجاع
              </p>
            </div>
          </div>
        </div>

        <v-card-text class="pa-6" style="background: var(--t-surface); max-height: 60vh; overflow-y: auto;">
          <!-- Loading -->
          <div v-if="loading.returnItems" class="text-center py-8">
            <v-progress-circular indeterminate color="#046375" />
            <p class="mt-3" style="color: var(--t-text-dim);">جاري تحميل أصناف الطلب...</p>
          </div>

          <!-- Items Selection -->
          <div v-else>
            <div
              v-for="(item, idx) in returnableItems"
              :key="item.idOrderItem"
              class="return-item-row mb-4 pa-4"
              :class="{ 'return-item-selected': item._selected }"
            >
              <div class="d-flex align-center mb-3">
                <v-checkbox
                  v-model="item._selected"
                  hide-details
                  density="compact"
                  color="#e74c3c"
                  class="ml-3 flex-grow-0"
                />
                <div class="flex-grow-1">
                  <div class="font-weight-bold" style="color: var(--t-text);">
                    {{ item.itemName }}
                    <span v-if="item.sizeName" class="text-caption" style="color: var(--t-text-dim);">({{ item.sizeName }})</span>
                  </div>
                  <div class="text-body-2" style="color: var(--t-text-dim);">
                    {{ Number(item.price).toLocaleString() }} د.ع × {{ item.quantity }}
                    = {{ (Number(item.price) * Number(item.quantity)).toLocaleString() }} د.ع
                  </div>
                </div>
                <v-chip v-if="item.status === 'returned'" size="small" color="error" variant="tonal">مرتجع</v-chip>
              </div>

              <!-- Return details (shown when selected) -->
              <div v-if="item._selected" class="pr-10">
                <v-row dense>
                  <v-col cols="12" sm="4">
                    <v-text-field
                      v-model.number="item._returnQty"
                      type="number"
                      label="الكمية المرتجعة"
                      variant="outlined"
                      density="compact"
                      :min="1"
                      :max="item.quantity"
                      hide-details
                      color="#e74c3c"
                    />
                  </v-col>
                  <v-col cols="12" sm="4">
                    <v-select
                      v-model="item._disposition"
                      :items="dispositionOptions"
                      label="التصرف"
                      variant="outlined"
                      density="compact"
                      hide-details
                      color="#e74c3c"
                    />
                  </v-col>
                  <v-col cols="12" sm="4">
                    <v-text-field
                      :model-value="(Number(item.price) * (item._returnQty || 1)).toLocaleString()"
                      label="مبلغ الإرجاع (د.ع)"
                      variant="outlined"
                      density="compact"
                      readonly
                      hide-details
                    />
                  </v-col>
                </v-row>

                <!-- Exchange: replacement item -->
                <div class="mt-3">
                  <v-switch
                    v-model="item._isExchange"
                    label="استبدال بصنف آخر"
                    density="compact"
                    color="#046375"
                    hide-details
                    class="mb-2"
                  />
                  <v-row v-if="item._isExchange" dense>
                    <v-col cols="12" sm="5">
                      <v-autocomplete
                        v-model="item._replacementMenuItemId"
                        :items="menuItems"
                        item-title="itemName"
                        item-value="idMenuItem"
                        label="الصنف البديل"
                        variant="outlined"
                        density="compact"
                        hide-details
                        color="#046375"
                        @update:model-value="onReplacementSelected(item)"
                      />
                    </v-col>
                    <v-col cols="12" sm="3">
                      <v-select
                        v-model="item._replacementItemSizeId"
                        :items="item._replacementSizes || []"
                        item-title="sizeName"
                        item-value="idItemSize"
                        label="الحجم"
                        variant="outlined"
                        density="compact"
                        hide-details
                        color="#046375"
                        :disabled="!item._replacementSizes?.length"
                        @update:model-value="onReplacementSizeSelected(item)"
                      />
                    </v-col>
                    <v-col cols="12" sm="2">
                      <v-text-field
                        v-model.number="item._replacementQuantity"
                        type="number"
                        label="الكمية"
                        variant="outlined"
                        density="compact"
                        :min="1"
                        hide-details
                      />
                    </v-col>
                    <v-col cols="12" sm="2">
                      <v-text-field
                        v-model.number="item._replacementPrice"
                        type="number"
                        label="السعر"
                        variant="outlined"
                        density="compact"
                        hide-details
                        suffix="د.ع"
                      />
                    </v-col>
                  </v-row>
                </div>
              </div>
            </div>

            <!-- No returnable items -->
            <v-alert v-if="returnableItems.length === 0" type="info" variant="tonal" class="mt-4">
              لا توجد أصناف قابلة للإرجاع في هذا الطلب
            </v-alert>

            <!-- Refund method + summary -->
            <v-divider class="my-4" />

            <v-row>
              <v-col cols="12" sm="6">
                <v-radio-group v-model="refundMethod" inline hide-details>
                  <template v-slot:label>
                    <span class="font-weight-bold" style="color: var(--t-text);">طريقة الاسترداد</span>
                  </template>
                  <v-radio label="نقدي" value="cash" color="#046375" />
                  <v-radio label="رصيد للعميل" value="credit" color="#046375" />
                </v-radio-group>

                <v-autocomplete
                  v-if="refundMethod === 'credit'"
                  v-model="refundCustomerId"
                  :items="customers"
                  item-title="fullName"
                  item-value="idCustomer"
                  label="العميل"
                  variant="outlined"
                  density="compact"
                  hide-details
                  color="#046375"
                  class="mt-3"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-textarea
                  v-model="returnNotes"
                  label="ملاحظات (اختياري)"
                  variant="outlined"
                  density="compact"
                  rows="2"
                  hide-details
                  color="#046375"
                />
              </v-col>
            </v-row>

            <!-- Summary -->
            <v-card class="mt-4 pa-4" elevation="0" style="background: var(--t-surface-high); border-radius: 12px; border: 1px solid var(--t-border);">
              <div class="d-flex justify-space-between align-center mb-2">
                <span style="color: var(--t-text-dim);">إجمالي الإرجاع:</span>
                <span class="text-h6 font-weight-bold" style="color: #e74c3c;">{{ totalReturnRefund.toLocaleString() }} د.ع</span>
              </div>
              <div v-if="totalReplacementCost > 0" class="d-flex justify-space-between align-center mb-2">
                <span style="color: var(--t-text-dim);">تكلفة البدائل:</span>
                <span class="text-h6 font-weight-bold" style="color: #046375;">{{ totalReplacementCost.toLocaleString() }} د.ع</span>
              </div>
              <v-divider v-if="totalReplacementCost > 0" class="my-2" />
              <div v-if="totalReplacementCost > 0" class="d-flex justify-space-between align-center">
                <span class="font-weight-bold" style="color: var(--t-text);">{{ netRefund >= 0 ? 'صافي الاسترداد للعميل:' : 'يدفع العميل الفرق:' }}</span>
                <span class="text-h5 font-weight-bold" :style="{ color: netRefund >= 0 ? '#e74c3c' : '#059669' }">{{ Math.abs(netRefund).toLocaleString() }} د.ع</span>
              </div>
            </v-card>
          </div>
        </v-card-text>

        <v-divider />
        <v-card-actions class="pa-4" style="background: var(--t-surface-high);">
          <v-btn variant="text" @click="showReturnDialog = false" :disabled="loading.submitReturn">
            إلغاء
          </v-btn>
          <v-spacer />
          <v-btn
            variant="flat"
            color="error"
            @click="submitReturn"
            :loading="loading.submitReturn"
            :disabled="selectedReturnItems.length === 0"
            style="border-radius: 8px;"
          >
            <PhArrowUUpLeft :size="20" weight="bold" class="ml-1" />
            تأكيد الإرجاع
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Previous Returns Dialog -->
    <v-dialog v-model="showReturnsHistory" max-width="700">
      <v-card elevation="0" style="border-radius: 16px; overflow: hidden;">
        <div style="background: #046375; padding: 20px;">
          <h3 class="text-h6 font-weight-bold text-white">سجل المرتجعات - {{ returnsHistoryOrder?.orderNumber }}</h3>
        </div>
        <v-card-text class="pa-4" style="background: var(--t-surface);">
          <div v-for="ret in returnsHistory" :key="ret.idOrderReturn" class="mb-4 pa-4" style="border: 1px solid var(--t-border); border-radius: 10px;">
            <div class="d-flex justify-space-between mb-2">
              <v-chip size="small" :color="ret.returnType === 'exchange' ? 'warning' : 'error'" variant="tonal">
                {{ ret.returnType === 'exchange' ? 'استبدال' : ret.returnType === 'waste' ? 'هدر' : 'إرجاع' }}
              </v-chip>
              <span class="text-body-2" style="color: var(--t-text-dim);">{{ formatDateTime(ret.returnDate) }}</span>
            </div>
            <div class="text-body-2 mb-2" style="color: var(--t-text-dim);">بواسطة: {{ ret.processedByName || '—' }}</div>
            <div v-for="ri in ret.items" :key="ri.idOrderReturnItem" class="d-flex align-center mb-1">
              <PhArrowUUpLeft :size="16" weight="bold" color="#e74c3c" class="ml-2" />
              <span style="color: var(--t-text);">{{ ri.itemName }} × {{ ri.quantity }}</span>
              <span class="mr-2 text-body-2" style="color: var(--t-text-dim);">({{ ri.disposition === 'returned_to_stock' ? 'أُعيد للمخزن' : 'هدر' }})</span>
              <v-spacer />
              <span class="font-weight-bold" style="color: #e74c3c;">{{ Number(ri.refundAmount).toLocaleString() }} د.ع</span>
            </div>
            <div v-if="ret.items?.some(i => i.replacementItemName)" class="mt-2 pt-2" style="border-top: 1px dashed var(--t-border);">
              <div v-for="ri in ret.items.filter(i => i.replacementItemName)" :key="'rep-'+ri.idOrderReturnItem" class="d-flex align-center mb-1">
                <PhArrowRight :size="16" weight="bold" color="#046375" class="ml-2" />
                <span style="color: var(--t-text);">بديل: {{ ri.replacementItemName }} × {{ ri.replacementQuantity }}</span>
                <v-spacer />
                <span class="font-weight-bold" style="color: #046375;">{{ Number(ri.replacementPrice * ri.replacementQuantity).toLocaleString() }} د.ع</span>
              </div>
            </div>
            <div class="mt-2 pt-2 d-flex justify-space-between" style="border-top: 1px solid var(--t-border);">
              <span class="font-weight-bold" style="color: var(--t-text);">المبلغ المسترد:</span>
              <span class="text-h6 font-weight-bold" style="color: #e74c3c;">{{ Number(ret.totalRefundAmount).toLocaleString() }} د.ع</span>
            </div>
          </div>
          <v-alert v-if="returnsHistory.length === 0" type="info" variant="tonal">لا توجد مرتجعات لهذا الطلب</v-alert>
        </v-card-text>
        <v-card-actions class="pa-4" style="background: var(--t-surface-high);">
          <v-spacer />
          <v-btn variant="flat" color="#046375" @click="showReturnsHistory = false">إغلاق</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { orderAPI, orderReturnAPI, menuAPI, itemSizeAPI, customerAPI, authAPI } from '@/services/api'
import { useToast } from 'vue-toastification'
import { todayBusinessDate } from '@/utils/dateFormatter'
import { useAuthStore } from '@/stores/auth'
import { formatDate, formatCurrentDateArabic } from '@/utils/dateFormatter'
import logoImg from '@/assets/logo.png'
import AppLayout from '@/components/AppLayout.vue'
import {
  PhReceipt, PhClock, PhCheckCircle,
  PhDotsThreeVertical, PhDownload, PhPrinter, PhArrowClockwise,
  PhFunnel, PhCalendar, PhMagnifyingGlass, PhEye, PhPackage,
  PhCurrencyDollar, PhForkKnife, PhX, PhArrowUUpLeft, PhArrowRight,
  PhShieldCheck, PhXCircle
} from '@phosphor-icons/vue'

const toast = useToast()
const authStore = useAuthStore()

const currentDate = computed(() => {
  return formatCurrentDateArabic()
})

const orders = ref([])
const loading = ref({
  orders: false,
  returnItems: false,
  submitReturn: false,
  returnsHistory: false,
  auth: false
})
const search = ref('')
const filterStatus = ref(null)
const filterDate = ref(todayBusinessDate())
const showOrderDialog = ref(false)
const selectedOrder = ref(null)
const orderItems = ref([])

// Return state
const showReturnDialog = ref(false)
const returnOrder = ref(null)
const returnableItems = ref([])
const menuItems = ref([])
const customers = ref([])
const refundMethod = ref('cash')
const refundCustomerId = ref(null)
const returnNotes = ref('')

// Auth dialog state
const showAuthDialog = ref(false)
const authEmail = ref('')
const authPassword = ref('')
const authError = ref('')
const pendingReturnOrder = ref(null)
const authenticatedStaff = ref(null)

// Returns history
const showReturnsHistory = ref(false)
const returnsHistoryOrder = ref(null)
const returnsHistory = ref([])

const dispositionOptions = [
  { value: 'wasted', title: 'هدر (تالف)' },
  { value: 'returned_to_stock', title: 'إرجاع للمخزن' }
]

const statusOptions = [
  { value: null, title: 'الكل' },
  { value: 'pending', title: 'قيد الانتظار' },
  { value: 'preparing', title: 'قيد التحضير' },
  { value: 'ready', title: 'جاهز' },
  { value: 'completed', title: 'مكتمل' },
  { value: 'cancelled', title: 'ملغي' }
]

const headers = [
  { title: 'رقم الطلب', key: 'orderNumber', align: 'start' },
  { title: 'رقم الطاولة', key: 'tableNumber' },
  { title: 'الحالة', key: 'status' },
  { title: 'المجموع الفرعي', key: 'subtotal' },
  { title: 'الخصم', key: 'discount' },
  { title: 'الإجمالي', key: 'totalAmount' },
  { title: 'التاريخ', key: 'orderDate' },
  { title: 'الكاشير', key: 'cashierName' },
  { title: 'النوع', key: 'orderType' },
  { title: 'إجراءات', key: 'actions', sortable: false }
]

const filteredOrders = computed(() => {
  let filtered = orders.value

  // Status and date are filtered by the server (business day 03:00 → 02:59)
  // Search
  if (search.value) {
    const searchLower = search.value.toLowerCase()
    filtered = filtered.filter(order =>
      order.orderNumber.toLowerCase().includes(searchLower) ||
      (order.cashierName && order.cashierName.toLowerCase().includes(searchLower)) ||
      (order.tableNumber && order.tableNumber.toLowerCase().includes(searchLower))
    )
  }

  return filtered
})

// Totals come from the server over every matching order (not just the rows loaded here);
// totalAmount is already after discount, and cancelled orders don't count as sales
const ordersSummary = ref({ totalSales: 0, byStatus: {} })
const ordersTotal = ref(0)
const totalSales = computed(() => (search.value
  ? filteredOrders.value.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + Number(o.totalAmount || 0), 0)
  : Number(ordersSummary.value.totalSales || 0)))

const statusCount = (status) => Number(ordersSummary.value.byStatus?.[status] || 0)

const filteredStatusCount = (status) => (search.value
  ? filteredOrders.value.filter(order => order.status === status).length
  : statusCount(status))

const canCancel = computed(() => ['admin', 'supervisor'].includes(authStore.user?.role))

const cancelOrder = async (order) => {
  if (!confirm(`إلغاء الطلب ${order.orderNumber}؟ سيُخصم من المبيعات وتعود المواد غير المحضّرة للمخزن.`)) return
  try {
    await orderAPI.updateStatus(order.idOrder, 'cancelled')
    toast.success('تم إلغاء الطلب')
    loadOrders()
  } catch (error) {
    toast.error(error.response?.data?.message || 'تعذّر إلغاء الطلب')
  }
}

const getStatusColor = (status) => {
  const colors = {
    pending: 'warning',
    preparing: 'info',
    ready: 'success',
    completed: 'success',
    cancelled: 'error'
  }
  return colors[status] || 'grey'
}

const getStatusText = (status) => {
  const texts = {
    pending: 'قيد الانتظار',
    preparing: 'قيد التحضير',
    ready: 'جاهز',
    completed: 'مكتمل',
    cancelled: 'ملغي'
  }
  return texts[status] || status
}

const formatDateTime = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('ar-EG', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const loadOrders = async () => {
  loading.value.orders = true
  try {
    const params = { limit: 500 }
    if (filterStatus.value) params.status = filterStatus.value
    if (filterDate.value) params.date = filterDate.value
    
    const response = await orderAPI.getAll(params)
    console.log('Orders API response:', response)
    
    // Handle different response structures
    // API returns: { items: [...], total: ..., page: ..., limit: ... }
    let ordersData = []
    if (Array.isArray(response?.data)) {
      // Direct array response (legacy)
      ordersData = response.data
    } else if (response?.data?.items && Array.isArray(response.data.items)) {
      // New paginated response structure
      ordersData = response.data.items
    } else if (Array.isArray(response)) {
      // Response is directly an array
      ordersData = response
    } else {
      ordersData = []
    }
    
    orders.value = ordersData
    ordersSummary.value = response?.data?.summary || { totalSales: 0, byStatus: {} }
    ordersTotal.value = Number(response?.data?.total || ordersData.length)
    if (ordersTotal.value > ordersData.length) {
      toast.info(`يُعرض أحدث ${ordersData.length} طلب من ${ordersTotal.value} — اختر تاريخاً لعرض يوم محدد`)
    }
    
    if (ordersData.length === 0 && !filterStatus.value && !filterDate.value) {
      toast.info('لا توجد طلبات في النظام')
    }
  } catch (error) {
    console.error('Error loading orders:', error)
    console.error('Error response:', error.response)
    toast.error('فشل تحميل الطلبات: ' + (error.response?.data?.message || error.message || 'خطأ غير معروف'))
    orders.value = []
  } finally {
    loading.value.orders = false
  }
}

const viewOrderDetails = async (order) => {
  selectedOrder.value = order
  showOrderDialog.value = true
  
  try {
    const response = await orderAPI.getOne(order.idOrder)
    orderItems.value = response.data.items || []
  } catch (error) {
    toast.error('فشل تحميل تفاصيل الطلب')
    console.error(error)
    orderItems.value = []
  }
}

const exportToExcel = () => {
  toast.info('تصدير Excel - قريباً')
}

const printReport = () => {
  toast.info('طباعة القائمة - قريباً')
}

// ── Return Logic ──

const openReturnDialog = (order) => {
  pendingReturnOrder.value = order
  authEmail.value = ''
  authPassword.value = ''
  authError.value = ''
  authenticatedStaff.value = null
  showAuthDialog.value = true
}

const verifyAuth = async () => {
  if (!authEmail.value || !authPassword.value) {
    authError.value = 'يرجى إدخال البريد الإلكتروني وكلمة المرور'
    return
  }
  loading.value.auth = true
  authError.value = ''
  try {
    const res = await authAPI.verifyCredentials({
      email: authEmail.value,
      password: authPassword.value,
      allowedRoles: ['admin', 'supervisor']
    })
    authenticatedStaff.value = res.data.staff
    showAuthDialog.value = false
    proceedToReturnDialog(pendingReturnOrder.value)
  } catch (err) {
    authError.value = err.response?.data?.message || 'فشل التحقق من البيانات'
  } finally {
    loading.value.auth = false
  }
}

const cancelAuth = () => {
  showAuthDialog.value = false
  pendingReturnOrder.value = null
  authenticatedStaff.value = null
}

const proceedToReturnDialog = async (order) => {
  returnOrder.value = order
  showReturnDialog.value = true
  refundMethod.value = order.saleType === 'credit' ? 'credit' : 'cash'
  refundCustomerId.value = order.customerId || null
  returnNotes.value = ''
  returnableItems.value = []
  loading.value.returnItems = true

  try {
    const [orderRes, menuRes, custRes] = await Promise.all([
      orderAPI.getOne(order.idOrder),
      menuAPI.getAll(),
      customerAPI.getAll()
    ])

    const items = orderRes.data.items || []
    returnableItems.value = items
      .filter(i => i.status !== 'cancelled' && i.status !== 'returned')
      .map(i => ({
        ...i,
        _selected: false,
        _returnQty: i.quantity,
        _disposition: 'wasted',
        _isExchange: false,
        _replacementMenuItemId: null,
        _replacementItemSizeId: null,
        _replacementQuantity: 1,
        _replacementPrice: 0,
        _replacementSizes: []
      }))

    menuItems.value = Array.isArray(menuRes?.data) ? menuRes.data : (menuRes?.data?.items || [])
    customers.value = Array.isArray(custRes?.data) ? custRes.data : (custRes?.data?.items || [])
  } catch (err) {
    console.error('[openReturnDialog]', err)
    toast.error('فشل تحميل بيانات الطلب')
  } finally {
    loading.value.returnItems = false
  }
}

const onReplacementSelected = async (item) => {
  item._replacementSizes = []
  item._replacementItemSizeId = null
  if (!item._replacementMenuItemId) return

  const selected = menuItems.value.find(m => (m.idMenuItem || m.id) === item._replacementMenuItemId)
  if (selected) {
    item._replacementPrice = Number(selected.basePrice) || 0
  }

  try {
    const res = await itemSizeAPI.getByMenuItem(item._replacementMenuItemId)
    const sizes = Array.isArray(res?.data) ? res.data : []
    item._replacementSizes = sizes
  } catch { /* no sizes */ }
}

const onReplacementSizeSelected = (item) => {
  if (!item._replacementItemSizeId || !item._replacementSizes?.length) return
  const size = item._replacementSizes.find(s => s.idItemSize === item._replacementItemSizeId)
  if (size && size.price) {
    item._replacementPrice = Number(size.price)
  }
}

const selectedReturnItems = computed(() => {
  return returnableItems.value.filter(i => i._selected)
})

// Same rule as the server: refund what the customer paid, i.e. the price after the order's discount
const returnNetRatio = computed(() => {
  const total = Number(returnOrder.value?.totalAmount || 0)
  const gross = total + Number(returnOrder.value?.discount || 0)
  return gross > 0 ? total / gross : 1
})
const totalReturnRefund = computed(() => {
  const sum = selectedReturnItems.value.reduce((t, i) => t + Math.round(Number(i.price) * (i._returnQty || 1) * returnNetRatio.value * 100) / 100, 0)
  return Math.round(sum * 100) / 100
})

const totalReplacementCost = computed(() => {
  return selectedReturnItems.value.reduce((sum, i) => {
    if (i._isExchange && i._replacementMenuItemId) {
      return sum + (Number(i._replacementPrice || 0) * (i._replacementQuantity || 1))
    }
    return sum
  }, 0)
})

// Negative when the replacement costs more: the customer pays the difference
const netRefund = computed(() => totalReturnRefund.value - totalReplacementCost.value)

const submitReturn = async () => {
  if (selectedReturnItems.value.length === 0) return

  loading.value.submitReturn = true
  try {
    const items = selectedReturnItems.value.map(i => ({
      orderItemId: i.idOrderItem,
      menuItemId: i.menuItemId,
      quantity: i._returnQty || 1,
      refundAmount: Number(i.price) * (i._returnQty || 1),
      disposition: i._disposition,
      replacementMenuItemId: i._isExchange ? i._replacementMenuItemId : null,
      replacementItemSizeId: i._isExchange ? i._replacementItemSizeId : null,
      replacementQuantity: i._isExchange ? (i._replacementQuantity || 1) : null,
      replacementPrice: i._isExchange ? (i._replacementPrice || 0) : null
    }))

    const payload = {
      orderId: returnOrder.value.idOrder,
      refundMethod: refundMethod.value,
      customerId: refundMethod.value === 'credit' ? refundCustomerId.value : null,
      notes: returnNotes.value || null,
      authenticatedById: authenticatedStaff.value?.id || null,
      items
    }

    const res = await orderReturnAPI.create(payload)
    toast.success(res.data?.message || 'تم تسجيل الإرجاع بنجاح')
    showReturnDialog.value = false
    loadOrders()
  } catch (err) {
    console.error('[submitReturn]', err)
    const msg = err.response?.data?.message || err.message || 'خطأ أثناء تسجيل الإرجاع'
    toast.error(msg)
  } finally {
    loading.value.submitReturn = false
  }
}

const viewReturnsHistory = async (order) => {
  returnsHistoryOrder.value = order
  showReturnsHistory.value = true
  returnsHistory.value = []
  loading.value.returnsHistory = true
  try {
    const res = await orderReturnAPI.getByOrder(order.idOrder)
    returnsHistory.value = Array.isArray(res.data) ? res.data : []
  } catch (err) {
    toast.error('فشل تحميل سجل المرتجعات')
  } finally {
    loading.value.returnsHistory = false
  }
}

onMounted(() => {
  loadOrders()
})
</script>

<style scoped>
.orders-table :deep(.v-data-table__thead) {
  background: var(--t-surface-high);
}

.orders-table :deep(.v-data-table__thead th) {
  color: var(--t-text-dim) !important;
  font-weight: 600 !important;
  font-size: 0.875rem !important;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.orders-table :deep(.v-data-table__tbody tr) {
  border-bottom: 1px solid var(--t-border-subtle);
}

.orders-table :deep(.v-data-table__tbody tr:hover) {
  background: var(--t-surface-high) !important;
}

.return-item-row {
  border: 1px solid var(--t-border);
  border-radius: 12px;
  background: var(--t-surface);
  transition: all 0.2s ease;
}

.return-item-selected {
  border-color: #e74c3c;
  background: var(--t-surface-high);
}
</style>

