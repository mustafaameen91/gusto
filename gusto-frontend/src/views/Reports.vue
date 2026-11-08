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
                    التقارير والإحصائيات التفصيلية
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
              aria-label="خيارات التصدير"
              title="خيارات التصدير"
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
            <v-list-item @click="exportToPDF">
              <template v-slot:prepend>
                <PhFilePdf :size="20" weight="bold" color="#046375" class="ml-2" />
              </template>
              <v-list-item-title>تصدير PDF</v-list-item-title>
            </v-list-item>
            <v-list-item @click="printReport">
              <template v-slot:prepend>
                <PhPrinter :size="20" weight="bold" color="#046375" class="ml-2" />
              </template>
              <v-list-item-title>طباعة</v-list-item-title>
            </v-list-item>
            <v-divider class="my-2" />
            <v-list-item @click="loadReports">
              <template v-slot:prepend>
                <PhArrowsClockwise :size="20" weight="bold" color="#046375" class="ml-2" />
              </template>
              <v-list-item-title>تحديث</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
      <!-- Date Range Selector -->
      <v-card
        elevation="0"
        style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;"
        class="mb-4"
      >
        <v-card-text class="pa-4">
          <v-row align="center">
            <v-col cols="12" md="3">
              <v-text-field
                v-model="startDate"
                label="من"
                type="date"
                variant="outlined"
                density="comfortable"
                color="#046375"
              />
            </v-col>
            <v-col cols="12" md="3">
              <v-text-field
                v-model="endDate"
                label="إلى"
                type="date"
                variant="outlined"
                density="comfortable"
                color="#046375"
              />
            </v-col>
            <v-col cols="12" md="2">
              <v-btn color="#046375" variant="flat" @click="loadReports" block style="border-radius: 8px;">
                <PhArrowsClockwise :size="20" weight="bold" class="ml-1" />
                تحديث
              </v-btn>
            </v-col>
            <v-col cols="12" md="4">
              <v-btn-toggle v-model="quickRange" mandatory color="#046375" variant="outlined" divided style="border-radius: 8px; width: 100%;">
                <v-btn value="today" size="small">اليوم</v-btn>
                <v-btn value="week" size="small">أسبوع</v-btn>
                <v-btn value="month" size="small">شهر</v-btn>
                <v-btn value="year" size="small">سنة</v-btn>
              </v-btn-toggle>
            </v-col>
            <v-col v-if="activeTab === 'financial'" cols="12" md="4">
              <v-select
                v-model="paymentMethodFilter"
                :items="paymentMethodOptions"
                item-title="label"
                item-value="value"
                label="طريقة الدفع"
                variant="outlined"
                density="comfortable"
                color="#046375"
                hide-details
                style="max-width: 220px;"
              />
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Tabs for Different Report Types -->
      <v-card
        elevation="0"
        style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;"
        class="mb-6"
      >
        <v-tabs v-model="activeTab" bg-color="transparent" color="#046375">
          <v-tab value="financial">مالي</v-tab>
          <v-tab value="sales">مبيعات</v-tab>
          <v-tab value="expenses">مصروفات</v-tab>
          <v-tab value="purchases">مشتريات</v-tab>
          <v-tab value="summary">ملخص يومي</v-tab>
          <v-tab value="item-sales">مبيعات الأصناف</v-tab>
          <v-tab value="time-sales">مبيعات بالوقت</v-tab>
          <v-tab value="material-usage">استخدام المواد</v-tab>
        </v-tabs>
      </v-card>

      <!-- Financial Report Tab -->
      <div v-if="activeTab === 'financial'">
      <v-row class="mb-6">
        <v-col cols="12" sm="6" lg="3">
          <v-card
            elevation="0"
            style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;"
            class="pa-5"
          >
            <div class="d-flex align-center justify-space-between mb-4">
                <div style="width: 48px; height: 48px; border-radius: 10px; background: #10B981; display: flex; align-items: center; justify-content: center;">
                  <PhTrendUp :size="24" weight="duotone" color="white" />
              </div>
            </div>
            <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">
                إجمالي الإيرادات
            </p>
            <h2 class="text-h4 font-weight-bold mb-1" style="color: var(--t-text);">
                {{ Number(financialReport.income?.totalSales || 0).toLocaleString() }} د.ع
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
                <div style="width: 48px; height: 48px; border-radius: 10px; background: #EF4444; display: flex; align-items: center; justify-content: center;">
                  <PhTrendDown :size="24" weight="duotone" color="white" />
              </div>
            </div>
            <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">
                إجمالي المصروفات
            </p>
            <h2 class="text-h4 font-weight-bold mb-1" style="color: var(--t-text);">
                {{ Number(financialReport.expenses?.totalExpenses || 0).toLocaleString() }} د.ع
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
                <div style="width: 48px; height: 48px; border-radius: 10px; background: #F59E0B; display: flex; align-items: center; justify-content: center;">
                  <PhShoppingCart :size="24" weight="duotone" color="white" />
              </div>
            </div>
            <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">
                إجمالي المشتريات
            </p>
            <h2 class="text-h4 font-weight-bold mb-1" style="color: var(--t-text);">
                {{ Number(financialReport.purchases?.totalPurchases || 0).toLocaleString() }} د.ع
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
                <div style="width: 48px; height: 48px; border-radius: 10px; background: #3B82F6; display: flex; align-items: center; justify-content: center;">
                  <PhCoins :size="24" weight="duotone" color="white" />
              </div>
            </div>
            <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">
                صافي الربح
              </p>
              <h2 class="text-h4 font-weight-bold mb-1" :style="{ color: (financialReport.profit?.netProfit || 0) >= 0 ? '#10B981' : '#EF4444' }">
                {{ Number(financialReport.profit?.netProfit || 0).toLocaleString() }} د.ع
              </h2>
            </v-card>
          </v-col>
        </v-row>

        <!-- Cash vs Card totals -->
        <v-row class="mb-6">
          <v-col cols="12" sm="6" md="3">
            <v-card elevation="0" style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;" class="pa-4">
              <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">إجمالي كاش</p>
              <h2 class="text-h5 font-weight-bold" style="color: var(--t-text);">
                {{ Number(financialReport.income?.totalCash || 0).toLocaleString() }} د.ع
              </h2>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-card elevation="0" style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;" class="pa-4">
              <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">إجمالي بطاقة</p>
              <h2 class="text-h5 font-weight-bold" style="color: var(--t-text);">
                {{ Number(financialReport.income?.totalCard || 0).toLocaleString() }} د.ع
              </h2>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-card elevation="0" style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;" class="pa-4">
              <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">إجمالي آجل</p>
              <h2 class="text-h5 font-weight-bold" style="color: var(--t-text);">
                {{ Number(financialReport.income?.totalCredit || 0).toLocaleString() }} د.ع
              </h2>
            </v-card>
          </v-col>
        </v-row>

        <!-- Profit breakdown -->
        <v-row class="mb-6">
          <v-col cols="12">
            <v-card elevation="0" style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;">
              <v-card-title class="pa-4" style="border-bottom: 1px solid var(--t-border-subtle); color: #046375; font-weight: 600;">
                تفصيل الربح
              </v-card-title>
              <v-card-text class="pa-4">
                <div
                  v-for="row in profitBreakdownRows"
                  :key="row.label"
                  class="d-flex justify-space-between align-center py-2"
                  :style="{ borderTop: row.total ? '1px solid var(--t-border)' : 'none', fontWeight: row.total ? 700 : 500 }"
                >
                  <span :style="{ color: row.total ? 'var(--t-text)' : 'var(--t-text-dim)' }">{{ row.sign }} {{ row.label }}</span>
                  <span :style="{ color: row.color || 'var(--t-text)' }">
                    {{ row.isPercent ? `${row.value}%` : `${Number(row.value || 0).toLocaleString()} د.ع` }}
                  </span>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Orders list with payment method -->
        <v-row v-if="(financialReport.orderDetails || []).length > 0" class="mb-6">
          <v-col cols="12">
            <v-card elevation="0" style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;">
              <v-card-title class="pa-4" style="border-bottom: 1px solid var(--t-border-subtle); color: #046375; font-weight: 600;">
                الطلبات (كاش / بطاقة / آجل)
              </v-card-title>
              <v-data-table
                :headers="financialOrderHeaders"
                :items="financialReport.orderDetails || []"
                :loading="loading.financial"
                class="reports-table"
                density="comfortable"
                :items-per-page="15"
              >
                <template v-slot:item.orderDate="{ item }">
                  {{ formatDate(item.orderDate) }}
                </template>
                <template v-slot:item.totalAmount="{ item }">
                  <span style="font-weight: 600;">{{ Number(item.totalAmount || 0).toLocaleString() }} د.ع</span>
                </template>
                <template v-slot:item.orderType="{ item }">
                  <v-chip :color="item.orderType === 'card' ? 'primary' : item.orderType === 'credit' ? 'warning' : 'success'" size="small" variant="flat">
                    {{ item.orderType === 'card' ? 'بطاقة' : item.orderType === 'credit' ? 'آجل' : 'كاش' }}
                  </v-chip>
                </template>
              </v-data-table>
            </v-card>
          </v-col>
        </v-row>

        <!-- Expense details table -->
        <v-row class="mb-6">
          <v-col cols="12">
            <v-card elevation="0" style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;">
              <v-card-title class="pa-4" style="border-bottom: 1px solid var(--t-border-subtle); color: #046375; font-weight: 600;">
                تفاصيل المصروفات
              </v-card-title>
              <v-data-table
                :headers="financialExpenseHeaders"
                :items="financialReport.expenseDetails || []"
                :loading="loading.financial"
                class="reports-table"
                density="comfortable"
                :items-per-page="10"
              >
                <template v-slot:item.expenseDate="{ item }">
                  {{ formatDate(item.expenseDate) }}
                </template>
                <template v-slot:item.amount="{ item }">
                  <span style="color: #EF4444; font-weight: 600;">
                    {{ Number(item.amount || 0).toLocaleString() }} د.ع
                  </span>
                </template>
              </v-data-table>
            </v-card>
          </v-col>
        </v-row>

        <!-- Item sales details table -->
        <v-row class="mb-6">
          <v-col cols="12">
            <v-card elevation="0" style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;">
              <v-card-title class="pa-4" style="border-bottom: 1px solid var(--t-border-subtle); color: #046375; font-weight: 600;">
                تفاصيل مبيعات الأصناف
              </v-card-title>
              <v-data-table
                :headers="financialItemSalesHeaders"
                :items="financialReport.itemSalesDetails || []"
                :loading="loading.financial"
                class="reports-table"
                density="comfortable"
                :items-per-page="15"
              >
                <template v-slot:item.revenue="{ item }">
                  <span style="color: #10B981; font-weight: 600;">
                    {{ Number(item.revenue || 0).toLocaleString() }} د.ع
                  </span>
                </template>
              </v-data-table>
            </v-card>
          </v-col>
        </v-row>
      </div>

      <!-- Sales Report Tab -->
      <div v-if="activeTab === 'sales'">
        <!-- Filters for Sales Report -->
        <v-card
          elevation="0"
          style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;"
          class="mb-6"
        >
          <v-card-text class="pa-4">
            <!-- Dropdowns row - aligned -->
            <v-row align="start" class="sales-filters-row">
              <v-col cols="12" sm="6" md="3">
                <v-select
                  v-model="salesPaymentMethodFilter"
                  :items="paymentMethodOptions"
                  item-title="label"
                  item-value="value"
                  label="طريقة الدفع"
                  variant="outlined"
                  density="comfortable"
                  color="#046375"
                  hide-details
                />
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-autocomplete
                  v-model="salesFilterCategories"
                  :items="categories"
                  item-title="categoryName"
                  item-value="idCategory"
                  label="تصفية حسب الفئة"
                  multiple
                  chips
                  closable-chips
                  variant="outlined"
                  density="comfortable"
                  color="#046375"
                  clearable
                  hide-details
                />
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-autocomplete
                  v-model="salesFilterMenuItems"
                  :items="menuItems"
                  item-title="itemName"
                  item-value="idMenuItem"
                  label="تصفية حسب الصنف"
                  multiple
                  chips
                  closable-chips
                  variant="outlined"
                  density="comfortable"
                  color="#046375"
                  clearable
                  hide-details
                >
                  <template v-slot:item="{ props, item }">
                    <v-list-item v-bind="props">
                      <template v-slot:prepend>
                        <v-chip size="small" variant="outlined" style="margin-left: 8px;">
                          {{ item.raw.categoryName || 'غير محدد' }}
                        </v-chip>
                      </template>
                    </v-list-item>
                  </template>
                </v-autocomplete>
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-autocomplete
                  v-model="selectedItemsForSales"
                  :items="menuItems"
                  item-title="itemName"
                  item-value="idMenuItem"
                  label="اختر أصناف لعرض مبيعاتها"
                  multiple
                  chips
                  closable-chips
                  variant="outlined"
                  density="comfortable"
                  color="#10B981"
                  clearable
                  hint="اختر أصنافاً لعرض تفاصيل مبيعاتها"
                  persistent-hint
                >
                  <template v-slot:item="{ props, item }">
                    <v-list-item v-bind="props">
                      <template v-slot:prepend>
                        <v-chip size="small" variant="outlined" style="margin-left: 8px;">
                          {{ item.raw.categoryName || 'غير محدد' }}
                        </v-chip>
                      </template>
                    </v-list-item>
                  </template>
                </v-autocomplete>
              </v-col>
            </v-row>
            <!-- Buttons row - below dropdowns -->
            <v-row align="center" class="mt-3">
              <v-col cols="12" class="d-flex gap-2 flex-wrap">
                <v-btn
                  color="#046375"
                  variant="flat"
                  @click="loadSalesReport"
                  style="border-radius: 8px; min-width: 100px;"
                >
                  <PhArrowsClockwise :size="20" weight="bold" class="ml-1" />
                  تطبيق
                </v-btn>
                <span class="mx-2"></span>
                <v-btn
                  color="#6B7280"
                  variant="outlined"
                  @click="clearSalesFilters"
                  style="border-radius: 8px; min-width: 100px;"
                >
                  مسح الفلاتر
                </v-btn>
              </v-col>
            </v-row>
            <v-row v-if="selectedItemsForSales.length > 0" class="mt-2">
              <v-col cols="12" md="4">
                <v-btn 
                  color="#10B981" 
                  variant="flat" 
                  @click="loadSelectedItemsSales" 
                  block 
                  style="border-radius: 8px;"
                >
                  <PhArrowsClockwise :size="20" weight="bold" class="ml-1" />
                  عرض مبيعات الأصناف المحددة
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <v-row class="mb-6">
          <v-col cols="12" sm="6" lg="3">
            <v-card elevation="0" style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;" class="pa-5">
              <div class="d-flex align-center justify-space-between mb-4">
                <div style="width: 48px; height: 48px; border-radius: 10px; background: #10B981; display: flex; align-items: center; justify-content: center;">
                  <PhTrendUp :size="24" weight="duotone" color="white" />
                </div>
              </div>
              <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">إجمالي المبيعات</p>
            <h2 class="text-h4 font-weight-bold mb-1" style="color: var(--t-text);">
                {{ Number(salesReport.dailySales?.reduce((sum, d) => sum + parseFloat(d.totalSales || 0), 0) || 0).toLocaleString() }} د.ع
              </h2>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6" lg="3">
            <v-card elevation="0" style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;" class="pa-5">
              <div class="d-flex align-center justify-space-between mb-4">
                <div style="width: 48px; height: 48px; border-radius: 10px; background: #3B82F6; display: flex; align-items: center; justify-content: center;">
                  <PhReceipt :size="24" weight="duotone" color="white" />
                </div>
              </div>
              <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">عدد الطلبات</p>
              <h2 class="text-h4 font-weight-bold mb-1" style="color: var(--t-text);">
                {{ salesReport.dailySales?.reduce((sum, d) => sum + parseInt(d.orderCount || 0), 0) || 0 }}
              </h2>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6" lg="3">
            <v-card elevation="0" style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;" class="pa-5">
              <div class="d-flex align-center justify-space-between mb-4">
                <div style="width: 48px; height: 48px; border-radius: 10px; background: #F59E0B; display: flex; align-items: center; justify-content: center;">
                  <PhChartLineUp :size="24" weight="duotone" color="white" />
                </div>
              </div>
              <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">متوسط الطلب</p>
              <h2 class="text-h4 font-weight-bold mb-1" style="color: var(--t-text);">
                {{ Number(salesReport.dailySales?.length ? (salesReport.dailySales.reduce((sum, d) => sum + parseFloat(d.totalSales || 0), 0) / salesReport.dailySales.reduce((sum, d) => sum + parseInt(d.orderCount || 0), 0)) || 0 : 0).toLocaleString() }} د.ع
              </h2>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6" lg="3">
            <v-card elevation="0" style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;" class="pa-5">
              <div class="d-flex align-center justify-space-between mb-4">
                <div style="width: 48px; height: 48px; border-radius: 10px; background: #8B5CF6; display: flex; align-items: center; justify-content: center;">
                <PhForkKnife :size="24" weight="duotone" color="white" />
              </div>
            </div>
              <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">أصناف مباعة</p>
              <h2 class="text-h4 font-weight-bold mb-1" style="color: var(--t-text);">
                {{ salesReport.topItems?.reduce((sum, item) => sum + parseInt(item.totalQuantity || 0), 0) || 0 }}
            </h2>
          </v-card>
        </v-col>
      </v-row>

        <!-- Cash vs Card totals (Sales tab) -->
        <v-row class="mb-6">
          <v-col cols="12" sm="6" md="3">
            <v-card elevation="0" style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;" class="pa-4">
              <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">إجمالي كاش</p>
              <h2 class="text-h5 font-weight-bold" style="color: var(--t-text);">
                {{ Number(salesReport.totalCash || 0).toLocaleString() }} د.ع
              </h2>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-card elevation="0" style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;" class="pa-4">
              <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">إجمالي بطاقة</p>
              <h2 class="text-h5 font-weight-bold" style="color: var(--t-text);">
                {{ Number(salesReport.totalCard || 0).toLocaleString() }} د.ع
              </h2>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-card elevation="0" style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;" class="pa-4">
              <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">إجمالي آجل</p>
              <h2 class="text-h5 font-weight-bold" style="color: var(--t-text);">
                {{ Number(salesReport.totalCredit || 0).toLocaleString() }} د.ع
              </h2>
            </v-card>
          </v-col>
        </v-row>

        <!-- Daily Sales Table -->
      <v-row class="mb-6">
          <v-col cols="12">
            <v-card elevation="0" style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;">
              <v-card-title class="pa-4" style="border-bottom: 1px solid var(--t-border-subtle);">
                <div class="text-h6 font-weight-bold" style="color: var(--t-text);">المبيعات اليومية</div>
              </v-card-title>
              <v-data-table
                :headers="dailySalesHeaders"
                :items="salesReport.dailySales || []"
                :items-per-page="10"
                :loading="loading.sales"
                density="comfortable"
                class="reports-table"
              >
                <template v-slot:item.date="{ item }">
                  {{ formatDate(item.date) }}
                </template>
                <template v-slot:item.totalSales="{ item }">
                  <span style="color: #10B981; font-weight: 600;">
                    {{ Number(item.totalSales || 0).toLocaleString() }} د.ع
                  </span>
                </template>
              </v-data-table>
            </v-card>
          </v-col>
        </v-row>

        <!-- Category Sales Table -->
        <v-row class="mb-6">
          <v-col cols="12">
            <v-card elevation="0" style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;">
              <v-card-title class="pa-4" style="border-bottom: 1px solid var(--t-border-subtle);">
                <div class="text-h6 font-weight-bold" style="color: var(--t-text);">المبيعات حسب الفئة</div>
              </v-card-title>
              <v-data-table
                :headers="categorySalesHeaders"
                :items="salesReport.categorySales || []"
                :items-per-page="10"
                :loading="loading.sales"
                density="comfortable"
                class="reports-table"
              >
                <template v-slot:item.totalSales="{ item }">
                  <span style="color: #046375; font-weight: 600;">
                    {{ Number(item.totalSales || 0).toLocaleString() }} د.ع
                  </span>
                </template>
              </v-data-table>
            </v-card>
          </v-col>
        </v-row>

        <!-- Selected Items Sales Breakdown -->
        <v-row class="mb-6" v-if="selectedItemsForSales.length > 0">
          <v-col cols="12">
            <v-card elevation="0" style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;">
              <v-card-title class="pa-4" style="border-bottom: 1px solid var(--t-border-subtle);">
                <div class="d-flex align-center justify-space-between">
                  <div class="text-h6 font-weight-bold" style="color: var(--t-text);">مبيعات الأصناف المحددة</div>
                  <v-btn 
                    color="#6B7280" 
                    variant="text" 
                    size="small"
                    @click="clearSelectedItemsForSales"
                  >
                    مسح الاختيار
                  </v-btn>
                </div>
              </v-card-title>
              <v-data-table
                :headers="selectedItemsSalesHeaders"
                :items="selectedItemsSalesData"
                :items-per-page="10"
                density="comfortable"
                class="reports-table"
                no-data-text="لا توجد بيانات للأصناف المحددة"
              >
                <template v-slot:item.categoryName="{ item }">
                  <v-chip size="small" variant="outlined" style="color: var(--t-text-dim);">
                    {{ item.categoryName }}
                  </v-chip>
                </template>
                <template v-slot:item.totalQuantity="{ item }">
                  <span style="color: #3B82F6; font-weight: 600;">
                    {{ Number(item.totalQuantity || 0).toLocaleString() }}
                  </span>
                </template>
                <template v-slot:item.totalRevenue="{ item }">
                  <span style="color: #10B981; font-weight: 600;">
                    {{ Number(item.totalRevenue || 0).toLocaleString() }} د.ع
                  </span>
                </template>
                <template v-slot:item.averagePrice="{ item }">
                  <span style="color: var(--t-text-dim); font-weight: 500;">
                    {{ Number(item.averagePrice || 0).toLocaleString() }} د.ع
                  </span>
                </template>
                <template v-slot:item.orderCount="{ item }">
                  <span style="color: #F59E0B; font-weight: 600;">
                    {{ item.orderCount || 0 }}
                  </span>
                </template>
              </v-data-table>
              <v-card-text v-if="selectedItemsSalesData.length > 0" class="pa-4" style="background: var(--t-surface-high); border-top: 1px solid #E5E7EB;">
                <div class="d-flex justify-space-between align-center">
                  <div>
                    <span style="color: var(--t-text-dim); font-weight: 500;">إجمالي الكمية: </span>
                    <span style="color: var(--t-text); font-weight: 600;">
                      {{ Number(selectedItemsSalesTotals.totalQuantity || 0).toLocaleString() }}
                    </span>
                  </div>
                  <div>
                    <span style="color: var(--t-text-dim); font-weight: 500;">إجمالي الإيرادات: </span>
                    <span style="color: #10B981; font-weight: 600;">
                      {{ Number(selectedItemsSalesTotals.totalRevenue || 0).toLocaleString() }} د.ع
                    </span>
                  </div>
                  <div>
                    <span style="color: var(--t-text-dim); font-weight: 500;">عدد الطلبات: </span>
                    <span style="color: #F59E0B; font-weight: 600;">
                      {{ selectedItemsSalesTotals.totalOrders || 0 }}
                    </span>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </div>

      <!-- Expenses Report Tab -->
      <div v-if="activeTab === 'expenses'">
        <v-row class="mb-6">
          <v-col cols="12" sm="6" lg="3">
            <v-card elevation="0" style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;" class="pa-5">
              <div class="d-flex align-center justify-space-between mb-4">
                <div style="width: 48px; height: 48px; border-radius: 10px; background: #EF4444; display: flex; align-items: center; justify-content: center;">
                  <PhTrendDown :size="24" weight="duotone" color="white" />
                </div>
              </div>
              <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">إجمالي المصروفات</p>
              <h2 class="text-h4 font-weight-bold mb-1" style="color: var(--t-text);">
                {{ Number(expensesReport.totalExpenses || 0).toLocaleString() }} د.ع
              </h2>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6" lg="3">
            <v-card elevation="0" style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;" class="pa-5">
              <div class="d-flex align-center justify-space-between mb-4">
                <div style="width: 48px; height: 48px; border-radius: 10px; background: #3B82F6; display: flex; align-items: center; justify-content: center;">
                  <PhReceipt :size="24" weight="duotone" color="white" />
                </div>
              </div>
              <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">عدد المصروفات</p>
              <h2 class="text-h4 font-weight-bold mb-1" style="color: var(--t-text);">
                {{ expensesReport.expenseCount || 0 }}
              </h2>
            </v-card>
          </v-col>
        </v-row>

        <!-- Expenses Chart -->
        <v-row class="mb-6" v-if="expensesReport.byCategory && expensesReport.byCategory.length > 0">
          <v-col cols="12">
            <v-card elevation="0" style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;">
              <v-card-title class="pa-4" style="border-bottom: 1px solid var(--t-border-subtle);">
                <div class="text-h6 font-weight-bold" style="color: var(--t-text);">المصروفات حسب الفئة</div>
              </v-card-title>
              <v-card-text class="pa-6">
                <div style="height: 300px; position: relative;">
                  <Bar
                    :data="expensesCategoryChartData"
                    :options="expensesCategoryChartOptions"
                  />
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Expenses by Category Table -->
        <v-row class="mb-6">
          <v-col cols="12">
            <v-card elevation="0" style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;">
              <v-card-title class="pa-4" style="border-bottom: 1px solid var(--t-border-subtle);">
                <div class="text-h6 font-weight-bold" style="color: var(--t-text);">المصروفات حسب الفئة</div>
              </v-card-title>
              <v-data-table
                :headers="expenseCategoryHeaders"
                :items="expensesReport.byCategory || []"
                :items-per-page="10"
                :loading="loading.expenses"
                density="comfortable"
                class="reports-table"
              >
                <template v-slot:item.totalAmount="{ item }">
                  <span style="color: #EF4444; font-weight: 600;">
                    {{ Number(item.totalAmount || 0).toLocaleString() }} د.ع
                  </span>
                </template>
              </v-data-table>
            </v-card>
          </v-col>
        </v-row>

        <!-- Expense Details Table (every individual expense) -->
        <v-row class="mb-6">
          <v-col cols="12">
            <v-card elevation="0" style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;">
              <v-card-title class="pa-4 d-flex align-center justify-space-between" style="border-bottom: 1px solid var(--t-border-subtle);">
                <div class="text-h6 font-weight-bold" style="color: var(--t-text);">تفاصيل المصروفات</div>
                <div class="d-flex" style="gap: 8px;">
                  <v-btn
                    color="success"
                    variant="outlined"
                    size="small"
                    prepend-icon="mdi-microsoft-excel"
                    :disabled="!expensesReport.details || expensesReport.details.length === 0"
                    @click="exportExpenseDetailsToExcel"
                  >
                    Excel
                  </v-btn>
                  <v-btn
                    color="error"
                    variant="outlined"
                    size="small"
                    prepend-icon="mdi-file-pdf-box"
                    :disabled="!expensesReport.details || expensesReport.details.length === 0"
                    @click="exportExpenseDetailsToPdf"
                  >
                    PDF
                  </v-btn>
                </div>
              </v-card-title>
              <v-data-table
                :headers="expenseDetailsHeaders"
                :items="expensesReport.details || []"
                :items-per-page="20"
                :loading="loading.expenses"
                density="comfortable"
                class="reports-table"
              >
                <template v-slot:item.expenseDate="{ item }">
                  {{ formatDate(item.expenseDate) }}
                </template>
                <template v-slot:item.amount="{ item }">
                  <span style="color: #EF4444; font-weight: 600;">
                    {{ Number(item.amount || 0).toLocaleString() }} د.ع
                  </span>
                </template>
              </v-data-table>
            </v-card>
          </v-col>
        </v-row>
      </div>

      <!-- Purchases Report Tab -->
      <div v-if="activeTab === 'purchases'">
        <v-row class="mb-6">
          <v-col cols="12" sm="6" lg="3">
            <v-card elevation="0" style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;" class="pa-5">
              <div class="d-flex align-center justify-space-between mb-4">
                <div style="width: 48px; height: 48px; border-radius: 10px; background: #F59E0B; display: flex; align-items: center; justify-content: center;">
                  <PhShoppingCart :size="24" weight="duotone" color="white" />
                </div>
              </div>
              <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">إجمالي المشتريات</p>
              <h2 class="text-h4 font-weight-bold mb-1" style="color: var(--t-text);">
                {{ Number(purchasesReport.totalPurchases || 0).toLocaleString() }} د.ع
              </h2>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6" lg="3">
            <v-card elevation="0" style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;" class="pa-5">
              <div class="d-flex align-center justify-space-between mb-4">
                <div style="width: 48px; height: 48px; border-radius: 10px; background: #3B82F6; display: flex; align-items: center; justify-content: center;">
                  <PhReceipt :size="24" weight="duotone" color="white" />
                </div>
              </div>
              <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">عدد المشتريات</p>
            <h2 class="text-h4 font-weight-bold mb-1" style="color: var(--t-text);">
                {{ purchasesReport.purchaseCount || 0 }}
            </h2>
          </v-card>
        </v-col>
      </v-row>

        <!-- Purchases Table -->
        <v-row class="mb-6">
          <v-col cols="12">
            <v-card elevation="0" style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;">
              <v-card-title class="pa-4" style="border-bottom: 1px solid var(--t-border-subtle);">
                <div class="text-h6 font-weight-bold" style="color: var(--t-text);">قائمة المشتريات</div>
              </v-card-title>
              <v-data-table
                :headers="purchasesHeaders"
                :items="purchasesReport.purchases || []"
                :items-per-page="10"
                :loading="loading.purchases"
                density="comfortable"
                class="reports-table"
              >
                <template v-slot:item.purchaseDate="{ item }">
                  {{ formatDate(item.purchaseDate) }}
                </template>
                <template v-slot:item.totalAmount="{ item }">
                  <span style="color: #F59E0B; font-weight: 600;">
                    {{ Number(item.totalAmount || 0).toLocaleString() }} د.ع
                  </span>
                </template>
                <template v-slot:item.status="{ item }">
                  <v-chip :color="getPurchaseStatusColor(item.status)" size="small" variant="flat">
                    {{ getPurchaseStatusText(item.status) }}
                  </v-chip>
                </template>
              </v-data-table>
            </v-card>
          </v-col>
        </v-row>
      </div>

      <!-- Daily Summary Tab -->
      <div v-if="activeTab === 'summary'">
        <v-row class="mb-6">
          <v-col cols="12" sm="6" lg="3">
            <v-card elevation="0" style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;" class="pa-5">
              <div class="d-flex align-center justify-space-between mb-4">
                <div style="width: 48px; height: 48px; border-radius: 10px; background: #10B981; display: flex; align-items: center; justify-content: center;">
                  <PhTrendUp :size="24" weight="duotone" color="white" />
                </div>
              </div>
              <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">المبيعات</p>
              <h2 class="text-h4 font-weight-bold mb-1" style="color: var(--t-text);">
                {{ Number(dailySummary.sales?.totalSales || 0).toLocaleString() }} د.ع
              </h2>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6" lg="3">
            <v-card elevation="0" style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;" class="pa-5">
              <div class="d-flex align-center justify-space-between mb-4">
                <div style="width: 48px; height: 48px; border-radius: 10px; background: #EF4444; display: flex; align-items: center; justify-content: center;">
                  <PhTrendDown :size="24" weight="duotone" color="white" />
                </div>
              </div>
              <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">المصروفات</p>
              <h2 class="text-h4 font-weight-bold mb-1" style="color: var(--t-text);">
                {{ Number(dailySummary.expenses?.totalExpenses || 0).toLocaleString() }} د.ع
              </h2>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6" lg="3">
            <v-card elevation="0" style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;" class="pa-5">
              <div class="d-flex align-center justify-space-between mb-4">
                <div style="width: 48px; height: 48px; border-radius: 10px; background: #F59E0B; display: flex; align-items: center; justify-content: center;">
                  <PhShoppingCart :size="24" weight="duotone" color="white" />
                </div>
              </div>
              <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">المشتريات</p>
              <h2 class="text-h4 font-weight-bold mb-1" style="color: var(--t-text);">
                {{ Number(dailySummary.purchases?.totalPurchases || 0).toLocaleString() }} د.ع
              </h2>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6" lg="3">
            <v-card elevation="0" style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;" class="pa-5">
              <div class="d-flex align-center justify-space-between mb-4">
                <div style="width: 48px; height: 48px; border-radius: 10px; background: #3B82F6; display: flex; align-items: center; justify-content: center;">
                  <PhCoins :size="24" weight="duotone" color="white" />
                </div>
              </div>
              <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">صافي الربح</p>
              <h2 class="text-h4 font-weight-bold mb-1" :style="{ color: (dailySummary.summary?.netProfit || 0) >= 0 ? '#10B981' : '#EF4444' }">
                {{ Number(dailySummary.summary?.netProfit || 0).toLocaleString() }} د.ع
              </h2>
            </v-card>
          </v-col>
        </v-row>
      </div>

      <!-- Item Sales Report Tab -->
      <div v-if="activeTab === 'item-sales'">
        <!-- Item Selection and Date Range -->
        <v-card
          elevation="0"
          style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;"
          class="mb-6"
        >
          <v-card-text class="pa-4">
            <v-row align="center">
              <v-col cols="12" md="4">
                <v-autocomplete
                  v-model="selectedItems"
                  :items="menuItems"
                  item-title="itemName"
                  item-value="idMenuItem"
                  label="اختر الأصناف"
                  multiple
                  chips
                  closable-chips
                  variant="outlined"
                  density="comfortable"
                  color="#046375"
                  :placeholder="selectedItems.length === 0 ? 'اختر صنف واحد على الأقل' : ''"
                >
                  <template v-slot:item="{ props, item }">
                    <v-list-item v-bind="props">
                      <template v-slot:prepend>
                        <v-chip size="small" variant="outlined" style="margin-left: 8px;">
                          {{ item.raw.categoryName || 'غير محدد' }}
                        </v-chip>
                      </template>
                    </v-list-item>
                  </template>
                </v-autocomplete>
              </v-col>
              <v-col cols="12" md="2">
                <v-text-field
                  v-model="itemSalesStartDate"
                  label="من"
                  type="date"
                  variant="outlined"
                  density="comfortable"
                  color="#046375"
                />
              </v-col>
              <v-col cols="12" md="2">
                <v-text-field
                  v-model="itemSalesEndDate"
                  label="إلى"
                  type="date"
                  variant="outlined"
                  density="comfortable"
                  color="#046375"
                />
              </v-col>
              <v-col cols="12" md="2">
                <v-btn 
                  color="#046375" 
                  variant="flat" 
                  @click="loadItemSalesReport" 
                  block 
                  style="border-radius: 8px;"
                  :disabled="selectedItems.length === 0"
                >
                  <PhArrowsClockwise :size="20" weight="bold" class="ml-1" />
                  بحث
                </v-btn>
              </v-col>
              <v-col cols="12" md="2">
                <v-btn 
                  color="#046375" 
                  variant="outlined" 
                  @click="exportItemSalesToExcel" 
                  block 
                  style="border-radius: 8px;"
                  :disabled="!itemSalesReport.items || itemSalesReport.items.length === 0"
                >
                  <PhDownload :size="20" weight="bold" class="ml-1" />
                  Excel
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Summary Cards -->
        <v-row class="mb-6" v-if="itemSalesReport.items && itemSalesReport.items.length > 0">
          <v-col cols="12" sm="4">
            <v-card
              elevation="0"
              style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;"
              class="pa-5"
            >
              <div class="d-flex align-center justify-space-between mb-4">
                <div style="width: 48px; height: 48px; border-radius: 10px; background: #3B82F6; display: flex; align-items: center; justify-content: center;">
                  <PhPackage :size="24" weight="duotone" color="white" />
                </div>
              </div>
              <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">إجمالي الكمية المباعة</p>
              <h2 class="text-h4 font-weight-bold mb-1" style="color: var(--t-text);">
                {{ Number(itemSalesReport.totals?.totalQuantity || 0).toLocaleString() }}
              </h2>
            </v-card>
          </v-col>
          <v-col cols="12" sm="4">
            <v-card
              elevation="0"
              style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;"
              class="pa-5"
            >
              <div class="d-flex align-center justify-space-between mb-4">
                <div style="width: 48px; height: 48px; border-radius: 10px; background: #10B981; display: flex; align-items: center; justify-content: center;">
                  <PhCoins :size="24" weight="duotone" color="white" />
                </div>
              </div>
              <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">إجمالي الإيرادات</p>
              <h2 class="text-h4 font-weight-bold mb-1" style="color: var(--t-text);">
                {{ Number(itemSalesReport.totals?.totalRevenue || 0).toLocaleString() }} د.ع
              </h2>
            </v-card>
          </v-col>
          <v-col cols="12" sm="4">
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
              <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">عدد الطلبات</p>
              <h2 class="text-h4 font-weight-bold mb-1" style="color: var(--t-text);">
                {{ itemSalesReport.totals?.totalOrders || 0 }}
              </h2>
            </v-card>
          </v-col>
        </v-row>

        <!-- Item Sales Table -->
        <v-row class="mb-6">
          <v-col cols="12">
            <v-card elevation="0" style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;">
              <v-card-title class="pa-4" style="border-bottom: 1px solid var(--t-border-subtle);">
                <div class="d-flex align-center justify-space-between">
                  <div class="text-h6 font-weight-bold" style="color: var(--t-text);">مبيعات الأصناف</div>
                  <v-btn 
                    color="#046375" 
                    variant="outlined" 
                    size="small"
                    @click="exportItemSalesToPDF" 
                    :disabled="!itemSalesReport.items || itemSalesReport.items.length === 0"
                  >
                    <PhFilePdf :size="18" weight="bold" class="ml-1" />
                    PDF
                  </v-btn>
                </div>
              </v-card-title>
              <v-data-table
                :headers="itemSalesHeaders"
                :items="itemSalesReport.items || []"
                :items-per-page="10"
                :loading="loading.itemSales"
                density="comfortable"
                class="reports-table"
                no-data-text="لا توجد بيانات. يرجى اختيار الأصناف وتحديد تاريخ البحث."
              >
                <template v-slot:item.categoryName="{ item }">
                  <v-chip size="small" variant="outlined" style="color: var(--t-text-dim);">
                    {{ item.categoryName }}
                  </v-chip>
                </template>
                <template v-slot:item.totalQuantity="{ item }">
                  <span style="color: #3B82F6; font-weight: 600;">
                    {{ Number(item.totalQuantity || 0).toLocaleString() }}
                  </span>
                </template>
                <template v-slot:item.totalRevenue="{ item }">
                  <span style="color: #10B981; font-weight: 600;">
                    {{ Number(item.totalRevenue || 0).toLocaleString() }} د.ع
                  </span>
                </template>
                <template v-slot:item.averagePrice="{ item }">
                  <span style="color: var(--t-text-dim); font-weight: 500;">
                    {{ Number(item.averagePrice || 0).toLocaleString() }} د.ع
                  </span>
                </template>
                <template v-slot:item.orderCount="{ item }">
                  <span style="color: #F59E0B; font-weight: 600;">
                    {{ item.orderCount || 0 }}
                  </span>
                </template>
              </v-data-table>
            </v-card>
          </v-col>
        </v-row>
      </div>

      <!-- Time-based Sales Report Tab -->
      <div v-if="activeTab === 'time-sales'">
        <!-- Filters -->
        <v-card elevation="0" style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;" class="mb-6">
          <v-card-text class="pa-4">
            <v-row align="center">
              <v-col cols="12" sm="6" md="3">
                <v-text-field
                  v-model="timeSalesFilter.startDate"
                  type="date"
                  label="من تاريخ"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                />
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-text-field
                  v-model="timeSalesFilter.endDate"
                  type="date"
                  label="إلى تاريخ"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                />
              </v-col>
              <v-col cols="6" sm="3" md="2">
                <v-text-field
                  v-model="timeSalesFilter.startTime"
                  type="time"
                  label="من ساعة"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                />
              </v-col>
              <v-col cols="6" sm="3" md="2">
                <v-text-field
                  v-model="timeSalesFilter.endTime"
                  type="time"
                  label="إلى ساعة"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                />
              </v-col>
              <v-col cols="12" md="2" class="d-flex" style="gap: 8px;">
                <v-btn color="#046375" :loading="loading.timeSales" @click="loadTimeSalesReport" block>
                  بحث
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Summary Cards -->
        <v-row class="mb-6" v-if="timeSalesReport.items && timeSalesReport.items.length > 0">
          <v-col cols="12" sm="6" lg="3">
            <v-card elevation="0" style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;" class="pa-5">
              <div class="d-flex align-center justify-space-between mb-4">
                <div style="width: 48px; height: 48px; border-radius: 10px; background: #10B981; display: flex; align-items: center; justify-content: center;">
                  <PhCoins :size="24" weight="duotone" color="white" />
                </div>
              </div>
              <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">إجمالي المبيعات</p>
              <h2 class="text-h4 font-weight-bold mb-1" style="color: var(--t-text);">
                {{ Number(timeSalesReport.totals?.totalRevenue || 0).toLocaleString() }} د.ع
              </h2>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6" lg="3">
            <v-card elevation="0" style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;" class="pa-5">
              <div class="d-flex align-center justify-space-between mb-4">
                <div style="width: 48px; height: 48px; border-radius: 10px; background: #3B82F6; display: flex; align-items: center; justify-content: center;">
                  <PhShoppingCart :size="24" weight="duotone" color="white" />
                </div>
              </div>
              <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">إجمالي القطع المباعة</p>
              <h2 class="text-h4 font-weight-bold mb-1" style="color: var(--t-text);">
                {{ Number(timeSalesReport.totals?.totalQuantity || 0).toLocaleString() }}
              </h2>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6" lg="3">
            <v-card elevation="0" style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;" class="pa-5">
              <div class="d-flex align-center justify-space-between mb-4">
                <div style="width: 48px; height: 48px; border-radius: 10px; background: #F59E0B; display: flex; align-items: center; justify-content: center;">
                  <PhReceipt :size="24" weight="duotone" color="white" />
                </div>
              </div>
              <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">عدد الطلبات</p>
              <h2 class="text-h4 font-weight-bold mb-1" style="color: var(--t-text);">
                {{ Number(timeSalesReport.totals?.totalOrders || 0).toLocaleString() }}
              </h2>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6" lg="3">
            <v-card elevation="0" style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;" class="pa-5">
              <div class="d-flex align-center justify-space-between mb-4">
                <div style="width: 48px; height: 48px; border-radius: 10px; background: #8B5CF6; display: flex; align-items: center; justify-content: center;">
                  <PhPackage :size="24" weight="duotone" color="white" />
                </div>
              </div>
              <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">عدد الأصناف المختلفة</p>
              <h2 class="text-h4 font-weight-bold mb-1" style="color: var(--t-text);">
                {{ timeSalesReport.items.length }}
              </h2>
            </v-card>
          </v-col>
        </v-row>

        <!-- Items Table -->
        <v-row class="mb-6">
          <v-col cols="12">
            <v-card elevation="0" style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;">
              <v-card-title class="pa-4 d-flex align-center justify-space-between" style="border-bottom: 1px solid var(--t-border-subtle);">
                <div class="text-h6 font-weight-bold" style="color: var(--t-text);">
                  الأصناف المباعة في الفترة المختارة
                </div>
                <div class="d-flex" style="gap: 8px;">
                  <v-btn color="success" variant="outlined" size="small" prepend-icon="mdi-microsoft-excel"
                    :disabled="!timeSalesReport.details || timeSalesReport.details.length === 0"
                    @click="exportTimeSalesToExcel">Excel</v-btn>
                  <v-btn color="error" variant="outlined" size="small" prepend-icon="mdi-file-pdf-box"
                    :disabled="!timeSalesReport.details || timeSalesReport.details.length === 0"
                    @click="exportTimeSalesToPdf">PDF</v-btn>
                </div>
              </v-card-title>
              <v-data-table
                :headers="timeSalesHeaders"
                :items="timeSalesReport.details || []"
                :items-per-page="50"
                :loading="loading.timeSales"
                density="comfortable"
                class="reports-table"
              >
                <template v-slot:item.orderDate="{ item }">
                  {{ formatDateTime(item.orderDate) }}
                </template>
                <template v-slot:item.unitPrice="{ item }">
                  {{ Number(item.unitPrice || 0).toLocaleString() }} د.ع
                </template>
                <template v-slot:item.lineTotal="{ item }">
                  <span style="color: #10B981; font-weight: 600;">
                    {{ Number(item.lineTotal || 0).toLocaleString() }} د.ع
                  </span>
                </template>
              </v-data-table>
            </v-card>
          </v-col>
        </v-row>

      </div>

      <!-- Material Usage Report Tab -->
      <div v-if="activeTab === 'material-usage'">
        <!-- Summary Cards -->
        <v-row class="mb-6">
          <v-col cols="12" sm="6" lg="3">
            <v-card
              elevation="0"
              style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;"
              class="pa-5"
            >
              <div class="d-flex align-center justify-space-between mb-4">
                <div style="width: 48px; height: 48px; border-radius: 10px; background: #10B981; display: flex; align-items: center; justify-content: center;">
                  <PhPackage :size="24" weight="duotone" color="white" />
                </div>
              </div>
              <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">إجمالي المشتريات</p>
              <h2 class="text-h4 font-weight-bold mb-1" style="color: var(--t-text);">
                {{ Number(materialUsageReport.totals?.totalPurchased || 0).toLocaleString() }}
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
                <div style="width: 48px; height: 48px; border-radius: 10px; background: #F59E0B; display: flex; align-items: center; justify-content: center;">
                  <PhArrowDown :size="24" weight="duotone" color="white" />
                </div>
              </div>
              <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">إجمالي الاستخدام</p>
              <h2 class="text-h4 font-weight-bold mb-1" style="color: var(--t-text);">
                {{ Number(materialUsageReport.totals?.totalUsed || 0).toLocaleString() }}
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
                <div style="width: 48px; height: 48px; border-radius: 10px; background: #EF4444; display: flex; align-items: center; justify-content: center;">
                  <PhTrash :size="24" weight="duotone" color="white" />
                </div>
              </div>
              <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">إجمالي الهدر</p>
              <h2 class="text-h4 font-weight-bold mb-1" style="color: var(--t-text);">
                {{ Number(materialUsageReport.totals?.totalWasted || 0).toLocaleString() }}
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
                  <PhCoins :size="24" weight="duotone" color="white" />
                </div>
              </div>
              <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">التكلفة الإجمالية</p>
              <h2 class="text-h4 font-weight-bold mb-1" style="color: var(--t-text);">
                {{ Number(materialUsageReport.totals?.totalCost || 0).toLocaleString() }} د.ع
              </h2>
            </v-card>
          </v-col>
        </v-row>

        <!-- Material Usage Table -->
        <v-row class="mb-6">
          <v-col cols="12">
            <v-card elevation="0" style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;">
              <v-card-title class="pa-4" style="border-bottom: 1px solid var(--t-border-subtle);">
                <div class="d-flex align-center justify-space-between">
                  <div class="text-h6 font-weight-bold" style="color: var(--t-text);">تفاصيل استخدام المواد</div>
                  <div>
                    <v-btn 
                      color="#046375" 
                      variant="outlined" 
                      size="small"
                      @click="exportMaterialUsageToExcel" 
                      :disabled="!materialUsageReport.data || materialUsageReport.data.length === 0"
                      class="ml-2"
                    >
                      <PhDownload :size="18" weight="bold" class="ml-1" />
                      Excel
                    </v-btn>
                    <v-btn 
                      color="#046375" 
                      variant="outlined" 
                      size="small"
                      @click="exportMaterialUsageToPDF" 
                      :disabled="!materialUsageReport.data || materialUsageReport.data.length === 0"
                      class="ml-2"
                    >
                      <PhFilePdf :size="18" weight="bold" class="ml-1" />
                      PDF
                    </v-btn>
                  </div>
                </div>
              </v-card-title>
              <v-data-table
                :headers="materialUsageHeaders"
                :items="materialUsageReport.data || []"
                :items-per-page="15"
                :loading="loading.materialUsage"
                density="comfortable"
                class="reports-table"
                no-data-text="لا توجد بيانات. يرجى تحديد فترة زمنية."
              >
                <template v-slot:item.totalPurchased="{ item }">
                  <span style="color: #10B981; font-weight: 600;">
                    {{ Number(item.totalPurchased || 0).toLocaleString() }} {{ item.unit }}
                  </span>
                </template>
                <template v-slot:item.totalUsed="{ item }">
                  <span style="color: #F59E0B; font-weight: 600;">
                    {{ Number(item.totalUsed || 0).toLocaleString() }} {{ item.unit }}
                  </span>
                </template>
                <template v-slot:item.totalWasted="{ item }">
                  <span style="color: #EF4444; font-weight: 600;">
                    {{ Number(item.totalWasted || 0).toLocaleString() }} {{ item.unit }}
                  </span>
                </template>
                <template v-slot:item.totalCost="{ item }">
                  <span style="color: #046375; font-weight: 600;">
                    {{ Number(item.totalCost || 0).toLocaleString() }} د.ع
                  </span>
                </template>
              </v-data-table>
            </v-card>
          </v-col>
        </v-row>
      </div>

      <!-- Charts Row - Show only for Sales tab -->
      <v-row class="mb-6" v-if="activeTab === 'sales'">
        <v-col cols="12" md="6">
          <v-card
            elevation="0"
            style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;"
          >
            <v-card-title class="pa-4" style="border-bottom: 1px solid var(--t-border-subtle);">
              <div class="text-h6 font-weight-bold" style="color: var(--t-text);">المبيعات اليومية</div>
            </v-card-title>
            <v-card-text class="pa-6">
              <div style="height: 300px; position: relative;">
                <Bar
                  v-if="salesReport.dailySales && salesReport.dailySales.length > 0"
                  :data="dailySalesChartData"
                  :options="dailySalesChartOptions"
                />
                <div v-else class="chart-placeholder">
                  <p class="text-body-1" style="color: var(--t-text-dim);">لا توجد بيانات للعرض</p>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="6">
          <v-card
            elevation="0"
            style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;"
          >
            <v-card-title class="pa-4" style="border-bottom: 1px solid var(--t-border-subtle);">
              <div class="text-h6 font-weight-bold" style="color: var(--t-text);">الأصناف الأكثر مبيعاً</div>
            </v-card-title>
            <v-card-text class="pa-6">
              <div style="height: 300px; position: relative;">
                <Pie
                  v-if="salesReport.topItems && salesReport.topItems.length > 0"
                  :data="topItemsChartData"
                  :options="topItemsChartOptions"
                />
                <div v-else class="chart-placeholder">
                  <p class="text-body-1" style="color: var(--t-text-dim);">لا توجد بيانات للعرض</p>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Top Selling Items -->
      <v-row class="mb-6">
        <v-col cols="12">
          <v-card
            elevation="0"
            style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;"
          >
            <v-card-title class="pa-4" style="border-bottom: 1px solid var(--t-border-subtle);">
              <div class="text-h6 font-weight-bold" style="color: var(--t-text);">الأصناف الأكثر مبيعاً</div>
            </v-card-title>
            <v-data-table
              :headers="topItemsHeaders"
              :items="salesReport.topItems || []"
              :items-per-page="10"
              density="comfortable"
              class="reports-table"
            >
              <template v-slot:item.revenue="{ item }">
                <span style="color: #046375; font-weight: 600;">
                  {{ Number(item.revenue || 0).toLocaleString() }} د.ع
                </span>
              </template>
            </v-data-table>
          </v-card>
        </v-col>
      </v-row>

      <!-- Inventory Usage -->
      <v-row>
        <v-col cols="12">
          <v-card
            elevation="0"
            style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;"
          >
            <v-card-title class="pa-4" style="border-bottom: 1px solid var(--t-border-subtle);">
              <div class="text-h6 font-weight-bold" style="color: var(--t-text);">استخدام المخزون</div>
            </v-card-title>
            <v-data-table
              :headers="inventoryHeaders"
              :items="reports.inventoryUsage"
              :items-per-page="10"
              density="comfortable"
              class="reports-table"
            >
              <template v-slot:item.totalUsed="{ item }">
                {{ item.totalUsed }} {{ item.unit }}
              </template>
              <template v-slot:item.totalPurchased="{ item }">
                {{ item.totalPurchased }} {{ item.unit }}
              </template>
              <template v-slot:item.totalWasted="{ item }">
                {{ item.totalWasted }} {{ item.unit }}
              </template>
              <template v-slot:item.totalCost="{ item }">
                <span style="color: #046375; font-weight: 600;">
                  {{ Number(item.totalCost || 0).toLocaleString() }} د.ع
                </span>
              </template>
            </v-data-table>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { reportAPI, menuAPI, categoryAPI } from '@/services/api'
import { useToast } from 'vue-toastification'
import AppLayout from '@/components/AppLayout.vue'
import { PhArrowsClockwise, PhCoins, PhReceipt, PhForkKnife, PhChartBarHorizontal, PhChartPieSlice, PhDotsThreeVertical, PhDownload, PhFilePdf, PhPrinter, PhChartLineUp, PhTrendUp, PhTrendDown, PhShoppingCart, PhPackage, PhArrowDown, PhTrash } from '@phosphor-icons/vue'
import { useAuthStore } from '@/stores/auth'
import { formatCurrentDateArabic, formatDate, formatDateTime, todayBusinessDate, addDaysYMD } from '@/utils/dateFormatter'
import logoImg from '@/assets/logo.png'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { Bar, Pie } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

const toast = useToast()
const authStore = useAuthStore()

const currentDate = computed(() => {
  return formatCurrentDateArabic()
})

const today = todayBusinessDate()
const startDate = ref(today)
const endDate = ref(today)
const quickRange = ref('today')

const periodText = computed(() => {
  switch(quickRange.value) {
    case 'today': return 'اليوم'
    case 'week': return 'أسبوع'
    case 'month': return 'شهر'
    case 'year': return 'سنة'
    default: return 'مخصص'
  }
})

const activeTab = ref('financial')
const paymentMethodFilter = ref('all')
const salesPaymentMethodFilter = ref('all')
const paymentMethodOptions = [
  { label: 'الكل', value: 'all' },
  { label: 'كاش', value: 'cash' },
  { label: 'بطاقة', value: 'card' },
  { label: 'آجل', value: 'credit' }
]

const loading = ref({
  financial: false,
  sales: false,
  expenses: false,
  purchases: false,
  summary: false,
  itemSales: false,
  timeSales: false,
  materialUsage: false
})

const reports = ref({
  totalSales: 0,
  totalOrders: 0,
  avgOrderValue: 0,
  totalItemsSold: 0,
  topItems: [],
  inventoryUsage: []
})

const financialReport = ref({
  income: { totalSales: 0, orderCount: 0, totalCash: 0, totalCard: 0, totalCredit: 0 },
  expenses: { totalExpenses: 0, expenseCount: 0 },
  purchases: { totalPurchases: 0 },
  profit: { netSales: 0, refunds: 0, cogs: 0, grossProfit: 0, operatingExpenses: 0, otherIncome: 0, netProfit: 0, profitMargin: 0 },
  expenseDetails: [],
  itemSalesDetails: [],
  orderDetails: []
})

// صافي المبيعات − تكلفة المبيعات = إجمالي الربح؛ − المصروفات التشغيلية + الإيرادات الأخرى = صافي الربح
const profitBreakdownRows = computed(() => {
  const p = financialReport.value.profit || {}
  const net = Number(p.netProfit || 0)
  return [
    { label: 'صافي المبيعات', sign: '', value: p.netSales },
    { label: 'تكلفة المبيعات', sign: '−', value: p.cogs },
    { label: 'إجمالي الربح', sign: '=', value: p.grossProfit, total: true },
    { label: 'المصروفات التشغيلية', sign: '−', value: p.operatingExpenses },
    { label: 'الإيرادات الأخرى', sign: '+', value: p.otherIncome },
    { label: 'صافي الربح', sign: '=', value: net, total: true, color: net >= 0 ? '#10B981' : '#EF4444' },
    { label: 'هامش الربح', sign: '', value: Number(p.profitMargin || 0), isPercent: true }
  ]
})

const salesReport = ref({
  dailySales: [],
  categorySales: [],
  topItems: [],
  totalCash: 0,
  totalCard: 0,
  totalCredit: 0
})

const expensesReport = ref({
  totalExpenses: 0,
  expenseCount: 0,
  byCategory: [],
  dailyExpenses: []
})

const timeSalesFilter = ref({
  startDate: todayBusinessDate(),
  endDate: todayBusinessDate(),
  startTime: '00:00',
  endTime: '23:59'
})
const timeSalesReport = ref({
  items: [],
  details: [],
  totals: { totalRevenue: 0, totalQuantity: 0, totalOrders: 0 }
})
const timeSalesHeaders = [
  { title: 'الوقت', key: 'orderDate', width: '16%' },
  { title: 'رقم الطلب', key: 'orderNumber', width: '12%' },
  { title: 'الصنف', key: 'itemName', align: 'start' },
  { title: 'الفئة', key: 'categoryName', width: '14%' },
  { title: 'الكمية', key: 'quantity', width: '8%' },
  { title: 'السعر', key: 'unitPrice', width: '12%' },
  { title: 'الإجمالي', key: 'lineTotal', width: '14%' }
]

const purchasesReport = ref({
  totalPurchases: 0,
  purchaseCount: 0,
  purchases: [],
  bySupplier: []
})

const dailySummary = ref({
  date: '',
  sales: { totalSales: 0, orderCount: 0, avgOrderValue: 0 },
  expenses: { totalExpenses: 0, expenseCount: 0 },
  purchases: { totalPurchases: 0, purchaseCount: 0 },
  summary: { netProfit: 0, profitMargin: 0 }
})

const itemSalesReport = ref({
  items: [],
  totals: { totalQuantity: 0, totalRevenue: 0, totalOrders: 0 }
})

const materialUsageReport = ref({
  data: [],
  totals: { totalPurchased: 0, totalUsed: 0, totalWasted: 0, totalCost: 0 }
})

const menuItems = ref([])
const selectedItems = ref([])
const itemSalesStartDate = ref(today)
const itemSalesEndDate = ref(today)

const categories = ref([])
const salesFilterCategories = ref([])
const salesFilterMenuItems = ref([])
const selectedItemsForSales = ref([])
const selectedItemsSalesData = ref([])
const selectedItemsSalesTotals = ref({
  totalQuantity: 0,
  totalRevenue: 0,
  totalOrders: 0
})

const topItemsHeaders = [
  { title: 'الصنف', key: 'itemName', align: 'start' },
  { title: 'الكمية المباعة', key: 'totalQuantity' },
  { title: 'الإيرادات', key: 'revenue' }
]

const financialExpenseHeaders = [
  { title: 'التاريخ', key: 'expenseDate', width: '12%' },
  { title: 'الفئة', key: 'category', width: '15%' },
  { title: 'المبلغ', key: 'amount', width: '15%' },
  { title: 'الوصف', key: 'description', width: '40%' },
  { title: 'رقم الإيصال', key: 'receiptNumber', width: '10%' },
  { title: 'مسجّل بواسطة', key: 'recordedByName', width: '15%' }
]

const financialItemSalesHeaders = [
  { title: 'الصنف', key: 'itemName', width: '35%' },
  { title: 'الفئة', key: 'categoryName', width: '25%' },
  { title: 'الكمية المباعة', key: 'totalQuantity', width: '20%' },
  { title: 'الإيرادات', key: 'revenue', width: '20%' }
]

const financialOrderHeaders = [
  { title: 'رقم الطلب', key: 'orderNumber', align: 'start' },
  { title: 'التاريخ', key: 'orderDate' },
  { title: 'المبلغ', key: 'totalAmount' },
  { title: 'طريقة الدفع', key: 'orderType' }
]

const dailySalesHeaders = [
  { title: 'التاريخ', key: 'date' },
  { title: 'عدد الطلبات', key: 'orderCount' },
  { title: 'إجمالي المبيعات', key: 'totalSales' }
]

const categorySalesHeaders = [
  { title: 'الفئة', key: 'categoryName', align: 'start' },
  { title: 'عدد الأصناف', key: 'itemsSold' },
  { title: 'إجمالي المبيعات', key: 'totalSales' }
]

const expenseCategoryHeaders = [
  { title: 'الفئة', key: 'category', align: 'start' },
  { title: 'عدد المصروفات', key: 'count' },
  { title: 'الإجمالي', key: 'totalAmount' }
]

const expenseDetailsHeaders = [
  { title: 'التاريخ', key: 'expenseDate', width: '12%' },
  { title: 'الفئة', key: 'category', width: '15%' },
  { title: 'المبلغ', key: 'amount', width: '12%' },
  { title: 'الوصف', key: 'description', width: '30%' },
  { title: 'رقم الإيصال', key: 'receiptNumber', width: '10%' },
  { title: 'المورد', key: 'supplierName', width: '12%' },
  { title: 'مسجّل بواسطة', key: 'recordedByName', width: '12%' }
]

const purchasesHeaders = [
  { title: 'رقم الشراء', key: 'purchaseNumber' },
  { title: 'المورد', key: 'supplierName' },
  { title: 'التاريخ', key: 'purchaseDate' },
  { title: 'المبلغ', key: 'totalAmount' },
  { title: 'الحالة', key: 'status' }
]

const inventoryHeaders = [
  { title: 'المكون', key: 'ingredientName', align: 'start' },
  { title: 'الوحدة', key: 'unit' },
  { title: 'تم الشراء', key: 'totalPurchased' },
  { title: 'تم الاستخدام', key: 'totalUsed' },
  { title: 'هدر', key: 'totalWasted' },
  { title: 'التكلفة', key: 'totalCost' }
]

const materialUsageHeaders = [
  { title: 'المادة', key: 'ingredientName', align: 'start' },
  { title: 'الوحدة', key: 'unit', align: 'center' },
  { title: 'تم الشراء', key: 'totalPurchased', align: 'end' },
  { title: 'تم الاستخدام', key: 'totalUsed', align: 'end' },
  { title: 'الهدر', key: 'totalWasted', align: 'end' },
  { title: 'التكلفة الإجمالية', key: 'totalCost', align: 'end' }
]

const itemSalesHeaders = [
  { title: 'الصنف', key: 'itemName', align: 'start' },
  { title: 'الفئة', key: 'categoryName' },
  { title: 'الكمية المباعة', key: 'totalQuantity', align: 'center' },
  { title: 'إجمالي الإيرادات', key: 'totalRevenue', align: 'end' },
  { title: 'متوسط السعر', key: 'averagePrice', align: 'end' },
  { title: 'عدد الطلبات', key: 'orderCount', align: 'center' }
]

// Shift a YYYY-MM-DD by whole months/years in local time (no UTC conversion)
const shiftYMD = (ymd, months) => {
  const [y, m, d] = ymd.split('-').map(Number)
  const target = new Date(y, m - 1 + months, 1)
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  const day = Math.min(d, lastDay)
  return `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

watch(quickRange, (newRange) => {
  const today = todayBusinessDate()
  endDate.value = today

  switch(newRange) {
    case 'today':
      startDate.value = today
      break
    case 'week':
      // Last 7 days including today
      startDate.value = addDaysYMD(today, -6)
      break
    case 'month':
      startDate.value = addDaysYMD(shiftYMD(today, -1), 1)
      break
    case 'year':
      startDate.value = addDaysYMD(shiftYMD(today, -12), 1)
      break
  }
  
  loadReports()
})

watch(paymentMethodFilter, () => {
  if (activeTab.value === 'financial') {
    loadFinancialReport({ startDate: startDate.value, endDate: endDate.value })
  }
})

watch(salesPaymentMethodFilter, () => {
  if (activeTab.value === 'sales') {
    loadSalesReport()
  }
})

const loadReports = async () => {
  try {
    const params = {
      startDate: startDate.value,
      endDate: endDate.value
    }

    // Load based on active tab
    switch(activeTab.value) {
      case 'financial':
        await loadFinancialReport(params)
        break
      case 'sales':
        await loadSalesReport(params)
        break
      case 'expenses':
        await loadExpensesReport(params)
        break
      case 'purchases':
        await loadPurchasesReport(params)
        break
      case 'summary':
        await loadDailySummary({ date: endDate.value })
        break
      case 'item-sales':
        // Don't auto-load item sales, user must select items first
        break
      case 'material-usage':
        await loadMaterialUsageReport(params)
        break
      default:
        await loadFinancialReport(params)
    }
  } catch (error) {
    toast.error('فشل تحميل التقارير')
    console.error(error)
  }
}

const loadFinancialReport = async (params) => {
  loading.value.financial = true
  try {
    const queryParams = { ...params, paymentMethod: paymentMethodFilter.value }
    const response = await reportAPI.getFinancial(queryParams)
    financialReport.value = response.data || {}
  } catch (error) {
    console.error('Failed to load financial report:', error)
    toast.error(error.response?.data?.message || 'فشل تحميل التقرير المالي')
  } finally {
    loading.value.financial = false
  }
}

const loadSalesReport = async (params = null) => {
  loading.value.sales = true
  try {
    const queryParams = {
      startDate: startDate.value,
      endDate: endDate.value,
      ...(params || {}),
      paymentMethod: salesPaymentMethodFilter.value
    }

    // Add filters if they exist
    if (salesFilterCategories.value.length > 0) {
      queryParams.categoryIds = salesFilterCategories.value.join(',')
    }
    if (salesFilterMenuItems.value.length > 0) {
      queryParams.menuItemIds = salesFilterMenuItems.value.join(',')
    }

    const response = await reportAPI.getSales(queryParams)
    salesReport.value = response.data || {
      dailySales: [],
      categorySales: [],
      topItems: [],
      totalCash: 0,
      totalCard: 0,
      totalCredit: 0
    }
    reports.value.topItems = salesReport.value.topItems || []
  } catch (error) {
    console.error('Failed to load sales report:', error)
    toast.error(error.response?.data?.message || 'فشل تحميل تقرير المبيعات')
  } finally {
    loading.value.sales = false
  }
}

const clearSalesFilters = () => {
  salesFilterCategories.value = []
  salesFilterMenuItems.value = []
  salesPaymentMethodFilter.value = 'all'
  loadSalesReport()
}

const loadCategories = async () => {
  try {
    const response = await categoryAPI.getAll()
    categories.value = response.data.filter(c => c.isActive)
  } catch (error) {
    console.error('Failed to load categories:', error)
  }
}

const loadSelectedItemsSales = async () => {
  if (selectedItemsForSales.value.length === 0) {
    toast.warning('يرجى اختيار صنف واحد على الأقل')
    return
  }
  
  try {
    const params = {
      startDate: startDate.value,
      endDate: endDate.value,
      itemIds: selectedItemsForSales.value.join(',')
    }
    
    const response = await reportAPI.getItemSales(params)
    selectedItemsSalesData.value = response.data.items || []
    
    // Calculate totals
    selectedItemsSalesTotals.value = response.data.totals || {
      totalQuantity: 0,
      totalRevenue: 0,
      totalOrders: 0
    }
    
    if (selectedItemsSalesData.value.length === 0) {
      toast.info('لا توجد مبيعات للأصناف المحددة في الفترة المحددة')
    } else {
      toast.success(`تم تحميل بيانات ${selectedItemsSalesData.value.length} صنف`)
    }
  } catch (error) {
    console.error('Failed to load selected items sales:', error)
    toast.error('فشل تحميل مبيعات الأصناف المحددة')
  }
}

const clearSelectedItemsForSales = () => {
  selectedItemsForSales.value = []
  selectedItemsSalesData.value = []
  selectedItemsSalesTotals.value = {
    totalQuantity: 0,
    totalRevenue: 0,
    totalOrders: 0
  }
}

const loadTimeSalesReport = async () => {
  loading.value.timeSales = true
  try {
    const response = await reportAPI.getTimeSales({
      startDate: timeSalesFilter.value.startDate,
      endDate: timeSalesFilter.value.endDate,
      startTime: timeSalesFilter.value.startTime,
      endTime: timeSalesFilter.value.endTime
    })
    timeSalesReport.value = {
      items: response.data?.items || [],
      details: response.data?.details || [],
      totals: response.data?.totals || { totalRevenue: 0, totalQuantity: 0, totalOrders: 0 }
    }
    if ((timeSalesReport.value.items || []).length === 0) {
      toast.info('لا توجد مبيعات في الفترة المختارة')
    }
  } catch (error) {
    console.error('Failed to load time sales report:', error)
    toast.error('فشل تحميل تقرير المبيعات بالوقت')
  } finally {
    loading.value.timeSales = false
  }
}

const exportTimeSalesToExcel = () => {
  try {
    const details = timeSalesReport.value.details || []
    if (details.length === 0) { toast.warning('لا توجد بيانات للتصدير'); return }
    const wb = XLSX.utils.book_new()
    const f = timeSalesFilter.value
    const totals = timeSalesReport.value.totals

    const data = [
      ['تقرير المبيعات بالوقت', '', '', '', '', '', ''],
      [`الفترة: ${f.startDate} ${f.startTime}  →  ${f.endDate} ${f.endTime}`, '', '', '', '', '', ''],
      ['', '', '', '', '', '', ''],
      ['الوقت', 'رقم الطلب', 'الصنف', 'الفئة', 'الكمية', 'السعر (د.ع)', 'الإجمالي (د.ع)'],
      ...details.map(d => [
        formatDateTime(d.orderDate),
        d.orderNumber || '',
        d.itemName || '',
        d.categoryName || '',
        Number(d.quantity || 0),
        Number(d.unitPrice || 0),
        Number(d.lineTotal || 0)
      ]),
      ['', '', '', '', '', '', ''],
      ['الإجمالي', '', '', '',
        Number(totals.totalQuantity || 0), '',
        Number(totals.totalRevenue || 0)
      ]
    ]
    const ws = XLSX.utils.aoa_to_sheet(data)
    ws['!cols'] = [{ wch: 18 }, { wch: 16 }, { wch: 28 }, { wch: 18 }, { wch: 10 }, { wch: 14 }, { wch: 16 }]
    XLSX.utils.book_append_sheet(wb, ws, 'مبيعات بالوقت')

    XLSX.writeFile(wb, `مبيعات_بالوقت_${f.startDate}_${f.endDate}.xlsx`)
    toast.success('تم التصدير إلى Excel بنجاح')
  } catch (error) {
    console.error('Export time sales failed:', error)
    toast.error('فشل التصدير')
  }
}

const exportTimeSalesToPdf = async () => {
  try {
    const details = timeSalesReport.value.details || []
    if (details.length === 0) { toast.warning('لا توجد بيانات للتصدير'); return }
    const f = timeSalesFilter.value
    const totals = timeSalesReport.value.totals
    const detailRows = details.map(d => `
      <tr>
        <td>${formatDateTime(d.orderDate)}</td>
        <td>${d.orderNumber || ''}</td>
        <td>${d.itemName || ''}</td>
        <td>${d.categoryName || ''}</td>
        <td style="text-align:center;">${Number(d.quantity || 0).toLocaleString()}</td>
        <td>${Number(d.unitPrice || 0).toLocaleString()}</td>
        <td style="color:#10B981; font-weight:bold;">${Number(d.lineTotal || 0).toLocaleString()}</td>
      </tr>
    `).join('')
    const container = document.createElement('div')
    container.style.cssText = 'position:absolute; top:-9999px; left:-9999px; width:1100px; padding:24px; background:#fff; color:#000; direction:rtl; font-family:Tajawal, Arial, sans-serif;'
    container.innerHTML = `
      <div style="text-align:center; margin-bottom:16px;">
        <h1 style="margin:0; color:#046375; font-size:22px;">مطعم جوستو</h1>
        <h2 style="margin:6px 0 0; color:#333; font-size:16px;">تقرير المبيعات بالوقت</h2>
        <div style="margin-top:6px; font-size:12px; color:#666;">
          ${f.startDate} ${f.startTime}  →  ${f.endDate} ${f.endTime}
        </div>
      </div>
      <table style="width:100%; border-collapse:collapse; font-size:11px;">
        <thead>
          <tr style="background:#046375; color:#fff;">
            <th style="padding:6px; border:1px solid #ddd;">الوقت</th>
            <th style="padding:6px; border:1px solid #ddd;">رقم الطلب</th>
            <th style="padding:6px; border:1px solid #ddd;">الصنف</th>
            <th style="padding:6px; border:1px solid #ddd;">الفئة</th>
            <th style="padding:6px; border:1px solid #ddd;">الكمية</th>
            <th style="padding:6px; border:1px solid #ddd;">السعر</th>
            <th style="padding:6px; border:1px solid #ddd;">الإجمالي</th>
          </tr>
        </thead>
        <tbody>${detailRows}</tbody>
        <tfoot>
          <tr style="background:#f5f5f5; font-weight:bold;">
            <td colspan="4" style="padding:6px; border:1px solid #ddd; text-align:left;">الإجمالي</td>
            <td style="padding:6px; border:1px solid #ddd; text-align:center;">${Number(totals.totalQuantity || 0).toLocaleString()}</td>
            <td></td>
            <td style="padding:6px; border:1px solid #ddd; color:#10B981;">${Number(totals.totalRevenue || 0).toLocaleString()} د.ع</td>
          </tr>
        </tfoot>
      </table>
    `
    document.body.appendChild(container)
    const canvas = await html2canvas(container, { scale: 2, backgroundColor: '#fff' })
    document.body.removeChild(container)
    const pdf = new jsPDF('p', 'mm', 'a4')
    const imgData = canvas.toDataURL('image/png')
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width
    let heightLeft = pdfHeight
    let position = 0
    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight)
    heightLeft -= pdf.internal.pageSize.getHeight()
    while (heightLeft > 0) {
      position = heightLeft - pdfHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight)
      heightLeft -= pdf.internal.pageSize.getHeight()
    }
    pdf.save(`مبيعات_بالوقت_${f.startDate}_${f.endDate}.pdf`)
    toast.success('تم التصدير إلى PDF بنجاح')
  } catch (error) {
    console.error('Export time sales PDF failed:', error)
    toast.error('فشل التصدير إلى PDF')
  }
}

const loadExpensesReport = async (params) => {
  loading.value.expenses = true
  try {
    const response = await reportAPI.getExpenses(params)
    expensesReport.value = response.data || {}
  } catch (error) {
    console.error('Failed to load expenses report:', error)
    toast.error(error.response?.data?.message || 'فشل تحميل تقرير المصروفات')
  } finally {
    loading.value.expenses = false
  }
}

const loadPurchasesReport = async (params) => {
  loading.value.purchases = true
  try {
    const response = await reportAPI.getPurchases(params)
    purchasesReport.value = response.data || {}
  } catch (error) {
    console.error('Failed to load purchases report:', error)
    toast.error(error.response?.data?.message || 'فشل تحميل تقرير المشتريات')
  } finally {
    loading.value.purchases = false
  }
}

const loadDailySummary = async (params) => {
  loading.value.summary = true
  try {
    const response = await reportAPI.getDailySummary(params)
    dailySummary.value = response.data || {}
  } catch (error) {
    console.error('Failed to load daily summary:', error)
    toast.error(error.response?.data?.message || 'فشل تحميل الملخص اليومي')
  } finally {
    loading.value.summary = false
  }
}

const loadMenuItems = async () => {
  try {
    const response = await menuAPI.getAll()
    menuItems.value = response.data.map(item => ({
      idMenuItem: item.idMenuItem,
      itemName: item.itemName,
      categoryName: item.categoryName || 'غير محدد'
    }))
  } catch (error) {
    console.error('Failed to load menu items:', error)
    toast.error('فشل تحميل قائمة الأصناف')
  }
}

const loadItemSalesReport = async () => {
  if (selectedItems.value.length === 0) {
    toast.warning('يرجى اختيار صنف واحد على الأقل')
    return
  }
  
  loading.value.itemSales = true
  try {
    const params = {
      startDate: itemSalesStartDate.value,
      endDate: itemSalesEndDate.value,
      itemIds: selectedItems.value.join(',')
    }
    
    const response = await reportAPI.getItemSales(params)
    itemSalesReport.value = response.data || { items: [], totals: { totalQuantity: 0, totalRevenue: 0, totalOrders: 0 } }
    
    if (itemSalesReport.value.items.length === 0) {
      toast.info('لا توجد مبيعات للأصناف المحددة في الفترة المحددة')
    }
  } catch (error) {
    console.error('Failed to load item sales report:', error)
    toast.error('فشل تحميل تقرير مبيعات الأصناف')
  } finally {
    loading.value.itemSales = false
  }
}

const loadMaterialUsageReport = async (params) => {
  loading.value.materialUsage = true
  try {
    const response = await reportAPI.getMaterialUsage(params)
    materialUsageReport.value = response.data || { data: [], totals: { totalPurchased: 0, totalUsed: 0, totalWasted: 0, totalCost: 0 } }
  } catch (error) {
    console.error('Failed to load material usage report:', error)
    toast.error('فشل تحميل تقرير استخدام المواد')
  } finally {
    loading.value.materialUsage = false
  }
}

const exportItemSalesToExcel = () => {
  if (!itemSalesReport.value.items || itemSalesReport.value.items.length === 0) {
    toast.warning('لا توجد بيانات للتصدير')
    return
  }
  
  try {
    const workbook = XLSX.utils.book_new()
    const data = [
      ['تقرير مبيعات الأصناف', '', ''],
      ['من', itemSalesStartDate.value, ''],
      ['إلى', itemSalesEndDate.value, ''],
      ['', '', ''],
      ['الصنف', 'الفئة', 'الكمية المباعة', 'إجمالي الإيرادات (د.ع)', 'متوسط السعر (د.ع)', 'عدد الطلبات'],
      ...(itemSalesReport.value.items || []).map(item => [
        item.itemName,
        item.categoryName,
        item.totalQuantity,
        item.totalRevenue,
        item.averagePrice,
        item.orderCount
      ]),
      ['', '', '', '', '', ''],
      ['الإجمالي', '', itemSalesReport.value.totals?.totalQuantity || 0, itemSalesReport.value.totals?.totalRevenue || 0, '', itemSalesReport.value.totals?.totalOrders || 0]
    ]
    
    const worksheet = XLSX.utils.aoa_to_sheet(data)
    XLSX.utils.book_append_sheet(workbook, worksheet, 'مبيعات الأصناف')
    
    const fileName = `تقرير_مبيعات_الأصناف_${itemSalesStartDate.value}_${itemSalesEndDate.value}.xlsx`
    XLSX.writeFile(workbook, fileName)
    
    toast.success('تم تصدير التقرير إلى Excel بنجاح')
  } catch (error) {
    console.error('Export to Excel failed:', error)
    toast.error('فشل تصدير التقرير إلى Excel')
  }
}

const exportItemSalesToPDF = async () => {
  if (!itemSalesReport.value.items || itemSalesReport.value.items.length === 0) {
    toast.warning('لا توجد بيانات للتصدير')
    return
  }
  
  try {
    toast.info('جاري إنشاء PDF...')
    
    const pdfContainer = document.createElement('div')
    pdfContainer.style.position = 'absolute'
    pdfContainer.style.left = '-9999px'
    pdfContainer.style.width = '210mm'
    pdfContainer.style.padding = '15mm'
    pdfContainer.style.backgroundColor = '#ffffff'
    pdfContainer.style.fontFamily = 'Arial, sans-serif'
    pdfContainer.style.direction = 'rtl'
    pdfContainer.style.textAlign = 'right'
    pdfContainer.style.fontSize = '10px'
    
    // Header
    const header = document.createElement('div')
    header.style.marginBottom = '15px'
    header.style.borderBottom = '2px solid #046375'
    header.style.paddingBottom = '10px'
    
    const logoImgElement = document.createElement('img')
    logoImgElement.src = logoImg
    logoImgElement.style.width = '45px'
    logoImgElement.style.height = '45px'
    logoImgElement.style.float = 'right'
    logoImgElement.style.marginLeft = '10px'
    logoImgElement.style.objectFit = 'contain'
    
    const titleDiv = document.createElement('div')
    titleDiv.innerHTML = `
      <h6 style="margin: 0; color: #046375; font-size: 9px; font-weight: bold;">تقرير مبيعات الأصناف</h6>
      <p style="margin: 2px 0 0 0; color: #6B7280; font-size: 8px;">من: ${itemSalesStartDate.value} - إلى: ${itemSalesEndDate.value}</p>
      <p style="margin: 2px 0 0 0; color: #6B7280; font-size: 7px;">تاريخ الإنشاء: ${new Date().toLocaleDateString('ar-IQ')}</p>
    `
    
    header.appendChild(logoImgElement)
    header.appendChild(titleDiv)
    pdfContainer.appendChild(header)
    
    // Summary
    const summaryDiv = document.createElement('div')
    summaryDiv.style.marginBottom = '15px'
    summaryDiv.style.display = 'grid'
    summaryDiv.style.gridTemplateColumns = '1fr 1fr 1fr'
    summaryDiv.style.gap = '10px'
    summaryDiv.innerHTML = `
      <div style="background: #EFF6FF; padding: 10px; border-radius: 6px; border: 1px solid #DBEAFE;">
        <p style="margin: 0; color: #6B7280; font-size: 9px;">إجمالي الكمية</p>
        <p style="margin: 3px 0 0 0; color: #3B82F6; font-size: 14px; font-weight: bold;">${Number(itemSalesReport.value.totals?.totalQuantity || 0).toLocaleString()}</p>
      </div>
      <div style="background: #ECFDF5; padding: 10px; border-radius: 6px; border: 1px solid #D1FAE5;">
        <p style="margin: 0; color: #6B7280; font-size: 9px;">إجمالي الإيرادات</p>
        <p style="margin: 3px 0 0 0; color: #10B981; font-size: 14px; font-weight: bold;">${Number(itemSalesReport.value.totals?.totalRevenue || 0).toLocaleString()} د.ع</p>
      </div>
      <div style="background: #FFFBEB; padding: 10px; border-radius: 6px; border: 1px solid #FEF3C7;">
        <p style="margin: 0; color: #6B7280; font-size: 9px;">عدد الطلبات</p>
        <p style="margin: 3px 0 0 0; color: #F59E0B; font-size: 14px; font-weight: bold;">${itemSalesReport.value.totals?.totalOrders || 0}</p>
      </div>
    `
    pdfContainer.appendChild(summaryDiv)
    
    // Table
    const tableRows = (itemSalesReport.value.items || []).map(item => `
      <tr>
        <td style="padding: 6px; border-bottom: 1px solid #E5E7EB; font-size: 9px;">${item.itemName}</td>
        <td style="padding: 6px; border-bottom: 1px solid #E5E7EB; font-size: 9px;">${item.categoryName}</td>
        <td style="padding: 6px; border-bottom: 1px solid #E5E7EB; text-align: center; font-size: 9px;">${Number(item.totalQuantity || 0).toLocaleString()}</td>
        <td style="padding: 6px; border-bottom: 1px solid #E5E7EB; text-align: left; color: #10B981; font-weight: bold; font-size: 9px;">${Number(item.totalRevenue || 0).toLocaleString()} د.ع</td>
        <td style="padding: 6px; border-bottom: 1px solid #E5E7EB; text-align: left; font-size: 9px;">${Number(item.averagePrice || 0).toLocaleString()} د.ع</td>
        <td style="padding: 6px; border-bottom: 1px solid #E5E7EB; text-align: center; font-size: 9px;">${item.orderCount || 0}</td>
      </tr>
    `).join('')
    
    const content = document.createElement('div')
    content.innerHTML = `
      <h6 style="color: #046375; font-size: 8px; margin-bottom: 4px; border-bottom: 1px solid #E5E7EB; padding-bottom: 2px; font-weight: bold;">تفاصيل المبيعات</h6>
      <table style="width: 100%; border-collapse: collapse; font-size: 9px;">
        <thead>
          <tr style="background: #f3f4f6;">
            <th style="padding: 8px; text-align: right; border-bottom: 2px solid #E5E7EB; color: #1f2937; font-weight: bold; font-size: 9px;">الصنف</th>
            <th style="padding: 8px; text-align: right; border-bottom: 2px solid #E5E7EB; color: #1f2937; font-weight: bold; font-size: 9px;">الفئة</th>
            <th style="padding: 8px; text-align: center; border-bottom: 2px solid #E5E7EB; color: #1f2937; font-weight: bold; font-size: 9px;">الكمية</th>
            <th style="padding: 8px; text-align: left; border-bottom: 2px solid #E5E7EB; color: #1f2937; font-weight: bold; font-size: 9px;">الإيرادات</th>
            <th style="padding: 8px; text-align: left; border-bottom: 2px solid #E5E7EB; color: #1f2937; font-weight: bold; font-size: 9px;">متوسط السعر</th>
            <th style="padding: 8px; text-align: center; border-bottom: 2px solid #E5E7EB; color: #1f2937; font-weight: bold; font-size: 9px;">الطلبات</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    `
    pdfContainer.appendChild(content)
    document.body.appendChild(pdfContainer)
    
    await new Promise((resolve) => {
      if (logoImgElement.complete) {
        resolve()
      } else {
        logoImgElement.onload = resolve
        logoImgElement.onerror = resolve
      }
    })
    
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const canvas = await html2canvas(pdfContainer, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    })
    
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    const imgWidth = 210
    const pageHeight = 297
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight
    let position = 0
    
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight
    
    while (heightLeft > 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }
    
    const fileName = `تقرير_مبيعات_الأصناف_${itemSalesStartDate.value}_${itemSalesEndDate.value}.pdf`
    pdf.save(fileName)
    
    document.body.removeChild(pdfContainer)
    
    toast.success('تم تصدير التقرير إلى PDF بنجاح')
  } catch (error) {
    console.error('Export to PDF failed:', error)
    toast.error('فشل تصدير التقرير إلى PDF')
  }
}

const exportMaterialUsageToExcel = () => {
  if (!materialUsageReport.value.data || materialUsageReport.value.data.length === 0) {
    toast.warning('لا توجد بيانات للتصدير')
    return
  }
  
  try {
    const workbook = XLSX.utils.book_new()
    const data = [
      ['تقرير استخدام المواد', '', '', '', '', ''],
      ['من', startDate.value, '', '', '', ''],
      ['إلى', endDate.value, '', '', '', ''],
      ['', '', '', '', '', ''],
      ['المادة', 'الوحدة', 'تم الشراء', 'تم الاستخدام', 'الهدر', 'التكلفة الإجمالية (د.ع)'],
      ...(materialUsageReport.value.data || []).map(item => [
        item.ingredientName,
        item.unit,
        item.totalPurchased,
        item.totalUsed,
        item.totalWasted,
        item.totalCost
      ]),
      ['', '', '', '', '', ''],
      ['الإجمالي', '', materialUsageReport.value.totals?.totalPurchased || 0, materialUsageReport.value.totals?.totalUsed || 0, materialUsageReport.value.totals?.totalWasted || 0, materialUsageReport.value.totals?.totalCost || 0]
    ]
    
    const worksheet = XLSX.utils.aoa_to_sheet(data)
    XLSX.utils.book_append_sheet(workbook, worksheet, 'استخدام المواد')
    
    const fileName = `تقرير_استخدام_المواد_${startDate.value}_${endDate.value}.xlsx`
    XLSX.writeFile(workbook, fileName)
    
    toast.success('تم تصدير التقرير إلى Excel بنجاح')
  } catch (error) {
    console.error('Export to Excel failed:', error)
    toast.error('فشل تصدير التقرير إلى Excel')
  }
}

const exportMaterialUsageToPDF = async () => {
  if (!materialUsageReport.value.data || materialUsageReport.value.data.length === 0) {
    toast.warning('لا توجد بيانات للتصدير')
    return
  }
  
  try {
    toast.info('جاري إنشاء PDF...')
    
    const pdfContainer = document.createElement('div')
    pdfContainer.style.position = 'absolute'
    pdfContainer.style.left = '-9999px'
    pdfContainer.style.width = '210mm'
    pdfContainer.style.padding = '15mm'
    pdfContainer.style.backgroundColor = '#ffffff'
    pdfContainer.style.fontFamily = 'Arial, sans-serif'
    pdfContainer.style.direction = 'rtl'
    pdfContainer.style.textAlign = 'right'
    pdfContainer.style.fontSize = '10px'
    
    // Header
    const header = document.createElement('div')
    header.style.marginBottom = '15px'
    header.style.borderBottom = '2px solid #046375'
    header.style.paddingBottom = '10px'
    
    const logoImgElement = document.createElement('img')
    logoImgElement.src = logoImg
    logoImgElement.style.width = '45px'
    logoImgElement.style.height = '45px'
    logoImgElement.style.float = 'right'
    logoImgElement.style.marginLeft = '10px'
    logoImgElement.style.objectFit = 'contain'
    
    const titleDiv = document.createElement('div')
    titleDiv.innerHTML = `
      <h6 style="margin: 0; color: #046375; font-size: 9px; font-weight: bold;">تقرير استخدام المواد</h6>
      <p style="margin: 2px 0 0 0; color: #6B7280; font-size: 8px;">من: ${startDate.value} - إلى: ${endDate.value}</p>
      <p style="margin: 2px 0 0 0; color: #6B7280; font-size: 7px;">تاريخ الإنشاء: ${new Date().toLocaleDateString('ar-IQ')}</p>
    `
    
    header.appendChild(logoImgElement)
    header.appendChild(titleDiv)
    pdfContainer.appendChild(header)
    
    // Summary
    const summaryDiv = document.createElement('div')
    summaryDiv.style.marginBottom = '15px'
    summaryDiv.style.display = 'grid'
    summaryDiv.style.gridTemplateColumns = '1fr 1fr 1fr 1fr'
    summaryDiv.style.gap = '10px'
    summaryDiv.innerHTML = `
      <div style="background: #ECFDF5; padding: 10px; border-radius: 6px; border: 1px solid #D1FAE5;">
        <p style="margin: 0; color: #6B7280; font-size: 9px;">إجمالي المشتريات</p>
        <p style="margin: 3px 0 0 0; color: #10B981; font-size: 14px; font-weight: bold;">${Number(materialUsageReport.value.totals?.totalPurchased || 0).toLocaleString()}</p>
      </div>
      <div style="background: #FFFBEB; padding: 10px; border-radius: 6px; border: 1px solid #FEF3C7;">
        <p style="margin: 0; color: #6B7280; font-size: 9px;">إجمالي الاستخدام</p>
        <p style="margin: 3px 0 0 0; color: #F59E0B; font-size: 14px; font-weight: bold;">${Number(materialUsageReport.value.totals?.totalUsed || 0).toLocaleString()}</p>
      </div>
      <div style="background: #FEF2F2; padding: 10px; border-radius: 6px; border: 1px solid #FEE2E2;">
        <p style="margin: 0; color: #6B7280; font-size: 9px;">إجمالي الهدر</p>
        <p style="margin: 3px 0 0 0; color: #EF4444; font-size: 14px; font-weight: bold;">${Number(materialUsageReport.value.totals?.totalWasted || 0).toLocaleString()}</p>
      </div>
      <div style="background: #F3F4F6; padding: 10px; border-radius: 6px; border: 1px solid #E5E7EB;">
        <p style="margin: 0; color: #6B7280; font-size: 9px;">التكلفة الإجمالية</p>
        <p style="margin: 3px 0 0 0; color: #046375; font-size: 14px; font-weight: bold;">${Number(materialUsageReport.value.totals?.totalCost || 0).toLocaleString()} د.ع</p>
      </div>
    `
    pdfContainer.appendChild(summaryDiv)
    
    // Table
    const tableRows = (materialUsageReport.value.data || []).map(item => `
      <tr>
        <td style="padding: 8px; text-align: right; border-bottom: 1px solid #E5E7EB; color: #1f2937; font-size: 9px;">${item.ingredientName}</td>
        <td style="padding: 8px; text-align: center; border-bottom: 1px solid #E5E7EB; color: #6B7280; font-size: 9px;">${item.unit}</td>
        <td style="padding: 8px; text-align: center; border-bottom: 1px solid #E5E7EB; color: #10B981; font-weight: bold; font-size: 9px;">${Number(item.totalPurchased || 0).toLocaleString()}</td>
        <td style="padding: 8px; text-align: center; border-bottom: 1px solid #E5E7EB; color: #F59E0B; font-weight: bold; font-size: 9px;">${Number(item.totalUsed || 0).toLocaleString()}</td>
        <td style="padding: 8px; text-align: center; border-bottom: 1px solid #E5E7EB; color: #EF4444; font-weight: bold; font-size: 9px;">${Number(item.totalWasted || 0).toLocaleString()}</td>
        <td style="padding: 8px; text-align: center; border-bottom: 1px solid #E5E7EB; color: #046375; font-weight: bold; font-size: 9px;">${Number(item.totalCost || 0).toLocaleString()} د.ع</td>
      </tr>
    `).join('')
    
    const content = document.createElement('div')
    content.innerHTML = `
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <thead>
          <tr>
            <th style="padding: 8px; text-align: right; border-bottom: 2px solid #E5E7EB; color: #1f2937; font-weight: bold; font-size: 9px;">المادة</th>
            <th style="padding: 8px; text-align: center; border-bottom: 2px solid #E5E7EB; color: #1f2937; font-weight: bold; font-size: 9px;">الوحدة</th>
            <th style="padding: 8px; text-align: center; border-bottom: 2px solid #E5E7EB; color: #1f2937; font-weight: bold; font-size: 9px;">تم الشراء</th>
            <th style="padding: 8px; text-align: center; border-bottom: 2px solid #E5E7EB; color: #1f2937; font-weight: bold; font-size: 9px;">تم الاستخدام</th>
            <th style="padding: 8px; text-align: center; border-bottom: 2px solid #E5E7EB; color: #1f2937; font-weight: bold; font-size: 9px;">الهدر</th>
            <th style="padding: 8px; text-align: center; border-bottom: 2px solid #E5E7EB; color: #1f2937; font-weight: bold; font-size: 9px;">التكلفة</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    `
    pdfContainer.appendChild(content)
    document.body.appendChild(pdfContainer)
    
    await new Promise((resolve) => {
      if (logoImgElement.complete) {
        resolve()
      } else {
        logoImgElement.onload = resolve
        logoImgElement.onerror = resolve
      }
    })
    
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const canvas = await html2canvas(pdfContainer, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    })
    
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    const imgWidth = 210
    const pageHeight = 297
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight
    let position = 0
    
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight
    
    while (heightLeft > 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }
    
    const fileName = `تقرير_استخدام_المواد_${startDate.value}_${endDate.value}.pdf`
    pdf.save(fileName)
    
    document.body.removeChild(pdfContainer)
    
    toast.success('تم تصدير التقرير إلى PDF بنجاح')
  } catch (error) {
    console.error('Export to PDF failed:', error)
    toast.error('فشل تصدير التقرير إلى PDF')
  }
}

// Chart data computed properties
const dailySalesChartData = computed(() => {
  if (!salesReport.value.dailySales || salesReport.value.dailySales.length === 0) {
    return {
      labels: [],
      datasets: []
    }
  }
  
  const sortedData = [...salesReport.value.dailySales].sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  )
  
  return {
    labels: sortedData.map(d => formatDate(d.date)),
    datasets: [
      {
        label: 'المبيعات (د.ع)',
        data: sortedData.map(d => parseFloat(d.totalSales || 0)),
        backgroundColor: 'rgba(66, 81, 62, 0.8)',
        borderColor: 'rgba(66, 81, 62, 1)',
        borderWidth: 1
      }
    ]
  }
})

const dailySalesChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top',
      labels: {
        font: {
          family: 'Arial, sans-serif',
          size: 12
        }
      }
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          return `المبيعات: ${Number(context.parsed.y).toLocaleString()} د.ع`
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: function(value) {
          return Number(value).toLocaleString() + ' د.ع'
        }
      }
    }
  }
}))

const topItemsChartData = computed(() => {
  if (!salesReport.value.topItems || salesReport.value.topItems.length === 0) {
    return {
      labels: [],
      datasets: []
    }
  }
  
  const top10 = salesReport.value.topItems.slice(0, 10)
  const colors = [
    'rgba(66, 81, 62, 0.8)',
    'rgba(16, 185, 129, 0.8)',
    'rgba(59, 130, 246, 0.8)',
    'rgba(245, 158, 11, 0.8)',
    'rgba(239, 68, 68, 0.8)',
    'rgba(139, 92, 246, 0.8)',
    'rgba(236, 72, 153, 0.8)',
    'rgba(20, 184, 166, 0.8)',
    'rgba(251, 146, 60, 0.8)',
    'rgba(99, 102, 241, 0.8)'
  ]
  
  return {
    labels: top10.map(item => item.itemName),
    datasets: [
      {
        label: 'الكمية المباعة',
        data: top10.map(item => parseInt(item.totalQuantity || 0)),
        backgroundColor: colors.slice(0, top10.length),
        borderColor: colors.slice(0, top10.length).map(c => c.replace('0.8', '1')),
        borderWidth: 1
      }
    ]
  }
})

const topItemsChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'bottom',
      labels: {
        font: {
          family: 'Arial, sans-serif',
          size: 12
        }
      }
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          const item = salesReport.value.topItems[context.dataIndex]
          return `${context.label}: ${item.totalQuantity} - ${Number(item.revenue || 0).toLocaleString()} د.ع`
        }
      }
    }
  }
}))

const expensesCategoryChartData = computed(() => {
  if (!expensesReport.value.byCategory || expensesReport.value.byCategory.length === 0) {
    return {
      labels: [],
      datasets: []
    }
  }
  
  return {
    labels: expensesReport.value.byCategory.map(e => e.category),
    datasets: [
      {
        label: 'المصروفات (د.ع)',
        data: expensesReport.value.byCategory.map(e => parseFloat(e.totalAmount || 0)),
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1
      }
    ]
  }
})

const expensesCategoryChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top',
      labels: {
        font: {
          family: 'Arial, sans-serif',
          size: 12
        }
      }
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          return `المصروفات: ${Number(context.parsed.y).toLocaleString()} د.ع`
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: function(value) {
          return Number(value).toLocaleString() + ' د.ع'
        }
      }
    }
  }
}))

// Watch for tab changes
watch(activeTab, () => {
  loadReports()
})

// Helper functions
const getPurchaseStatusColor = (status) => {
  const colors = {
    'pending': 'warning',
    'received': 'success',
    'partially_received': 'info',
    'cancelled': 'error'
  }
  return colors[status] || 'grey'
}

const getPurchaseStatusText = (status) => {
  const texts = {
    'pending': 'قيد الانتظار',
    'received': 'مستلم',
    'partially_received': 'مستلم جزئياً',
    'cancelled': 'ملغي'
  }
  return texts[status] || status
}

// Export to Excel
const exportToExcel = () => {
  try {
    const workbook = XLSX.utils.book_new()
    let data = []
    let sheetName = ''

    switch(activeTab.value) {
      case 'financial':
        sheetName = 'التقرير المالي'
        data = [
          ['التقرير المالي', '', ''],
          ['من', startDate.value, ''],
          ['إلى', endDate.value, ''],
          ['', '', ''],
          ['الإيرادات', '', ''],
          ['إجمالي المبيعات', financialReport.value.income?.totalSales || 0, 'د.ع'],
          ['عدد الطلبات', financialReport.value.income?.orderCount || 0, ''],
          ['كاش', financialReport.value.income?.totalCash || 0, 'د.ع'],
          ['بطاقة', financialReport.value.income?.totalCard || 0, 'د.ع'],
          ['آجل', financialReport.value.income?.totalCredit || 0, 'د.ع'],
          ['', '', ''],
          ['المصروفات', '', ''],
          ['إجمالي المصروفات', financialReport.value.expenses?.totalExpenses || 0, 'د.ع'],
          ['عدد المصروفات', financialReport.value.expenses?.expenseCount || 0, ''],
          ['', '', ''],
          ['المشتريات', '', ''],
          ['إجمالي المشتريات', financialReport.value.purchases?.totalPurchases || 0, 'د.ع'],
          ['', '', ''],
          ['تفصيل الربح', '', ''],
          ['صافي المبيعات', financialReport.value.profit?.netSales || 0, 'د.ع'],
          ['− تكلفة المبيعات', financialReport.value.profit?.cogs || 0, 'د.ع'],
          ['= إجمالي الربح', financialReport.value.profit?.grossProfit || 0, 'د.ع'],
          ['− المصروفات التشغيلية', financialReport.value.profit?.operatingExpenses || 0, 'د.ع'],
          ['+ الإيرادات الأخرى', financialReport.value.profit?.otherIncome || 0, 'د.ع'],
          ['= صافي الربح', financialReport.value.profit?.netProfit || 0, 'د.ع'],
          ['هامش الربح', `${financialReport.value.profit?.profitMargin || 0}%`, '']
        ]
        break
      case 'sales':
        sheetName = 'تقرير المبيعات'
        data = [
          ['تقرير المبيعات', '', ''],
          ['من', startDate.value, ''],
          ['إلى', endDate.value, ''],
          ['', '', ''],
          ['كاش', salesReport.value.totalCash || 0, 'د.ع'],
          ['بطاقة', salesReport.value.totalCard || 0, 'د.ع'],
          ['آجل', salesReport.value.totalCredit || 0, 'د.ع'],
          ['', '', ''],
          ['المبيعات اليومية', '', ''],
          ['التاريخ', 'عدد الطلبات', 'إجمالي المبيعات (د.ع)'],
          ...(salesReport.value.dailySales || []).map(d => [d.date, d.orderCount, d.totalSales]),
          ['', '', ''],
          ['المبيعات حسب الفئة', '', ''],
          ['الفئة', 'عدد الأصناف', 'إجمالي المبيعات (د.ع)'],
          ...(salesReport.value.categorySales || []).map(c => [c.categoryName, c.itemsSold, c.totalSales]),
          ['', '', ''],
          ['الأصناف الأكثر مبيعاً', '', ''],
          ['الصنف', 'الكمية المباعة', 'الإيرادات (د.ع)'],
          ...(salesReport.value.topItems || []).map(t => [t.itemName, t.totalQuantity, t.revenue])
        ]
        break
      case 'expenses':
        sheetName = 'تقرير المصروفات'
        data = [
          ['تقرير المصروفات', '', ''],
          ['من', startDate.value, ''],
          ['إلى', endDate.value, ''],
          ['', '', ''],
          ['إجمالي المصروفات', expensesReport.value.totalExpenses || 0, 'د.ع'],
          ['عدد المصروفات', expensesReport.value.expenseCount || 0, ''],
          ['', '', ''],
          ['المصروفات حسب الفئة', '', ''],
          ['الفئة', 'عدد المصروفات', 'الإجمالي (د.ع)'],
          ...(expensesReport.value.byCategory || []).map(e => [e.category, e.count, e.totalAmount])
        ]
        break
      case 'purchases':
        sheetName = 'تقرير المشتريات'
        data = [
          ['تقرير المشتريات', '', ''],
          ['من', startDate.value, ''],
          ['إلى', endDate.value, ''],
          ['', '', ''],
          ['إجمالي المشتريات', purchasesReport.value.totalPurchases || 0, 'د.ع'],
          ['عدد المشتريات', purchasesReport.value.purchaseCount || 0, ''],
          ['', '', ''],
          ['قائمة المشتريات', '', '', '', ''],
          ['رقم الشراء', 'المورد', 'التاريخ', 'المبلغ (د.ع)', 'الحالة'],
          ...(purchasesReport.value.purchases || []).map(p => [
            p.purchaseNumber,
            p.supplierName,
            p.purchaseDate,
            p.totalAmount,
            getPurchaseStatusText(p.status)
          ])
        ]
        break
      case 'summary':
        sheetName = 'ملخص يومي'
        data = [
          ['ملخص يومي', '', ''],
          ['التاريخ', endDate.value, ''],
          ['', '', ''],
          ['المبيعات', '', ''],
          ['إجمالي المبيعات', dailySummary.value.sales?.totalSales || 0, 'د.ع'],
          ['عدد الطلبات', dailySummary.value.sales?.orderCount || 0, ''],
          ['متوسط الطلب', dailySummary.value.sales?.avgOrderValue || 0, 'د.ع'],
          ['', '', ''],
          ['المصروفات', '', ''],
          ['إجمالي المصروفات', dailySummary.value.expenses?.totalExpenses || 0, 'د.ع'],
          ['عدد المصروفات', dailySummary.value.expenses?.expenseCount || 0, ''],
          ['', '', ''],
          ['المشتريات', '', ''],
          ['إجمالي المشتريات', dailySummary.value.purchases?.totalPurchases || 0, 'د.ع'],
          ['عدد المشتريات', dailySummary.value.purchases?.purchaseCount || 0, ''],
          ['', '', ''],
          ['الملخص', '', ''],
          ['صافي الربح', dailySummary.value.summary?.netProfit || 0, 'د.ع'],
          ['هامش الربح', `${dailySummary.value.summary?.profitMargin || 0}%`, '']
        ]
        break
    }

    const worksheet = XLSX.utils.aoa_to_sheet(data)
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
    
    const fileName = `تقرير_${activeTab.value}_${startDate.value}_${endDate.value}.xlsx`
    XLSX.writeFile(workbook, fileName)
    
    toast.success('تم تصدير التقرير إلى Excel بنجاح')
  } catch (error) {
    console.error('Export to Excel failed:', error)
    toast.error('فشل تصدير التقرير إلى Excel')
  }
}

// Export only the expense details table to Excel
const exportExpenseDetailsToExcel = () => {
  try {
    const details = expensesReport.value.details || []
    if (details.length === 0) {
      toast.warning('لا توجد بيانات للتصدير')
      return
    }
    const workbook = XLSX.utils.book_new()
    const data = [
      ['تفاصيل المصروفات', '', '', '', '', '', ''],
      ['من', startDate.value, '', 'إلى', endDate.value, '', ''],
      ['', '', '', '', '', '', ''],
      ['التاريخ', 'الفئة', 'المبلغ (د.ع)', 'الوصف', 'رقم الإيصال', 'المورد', 'مسجّل بواسطة'],
      ...details.map(e => [
        formatDate(e.expenseDate),
        e.category || '',
        Number(e.amount || 0),
        e.description || '',
        e.receiptNumber || '',
        e.supplierName || '',
        e.recordedByName || ''
      ]),
      ['', '', '', '', '', '', ''],
      ['الإجمالي', '', details.reduce((s, e) => s + Number(e.amount || 0), 0), '', '', '', '']
    ]
    const worksheet = XLSX.utils.aoa_to_sheet(data)
    worksheet['!cols'] = [{ wch: 12 }, { wch: 18 }, { wch: 15 }, { wch: 35 }, { wch: 14 }, { wch: 18 }, { wch: 18 }]
    XLSX.utils.book_append_sheet(workbook, worksheet, 'تفاصيل المصروفات')
    XLSX.writeFile(workbook, `تفاصيل_المصروفات_${startDate.value}_${endDate.value}.xlsx`)
    toast.success('تم تصدير تفاصيل المصروفات بنجاح')
  } catch (error) {
    console.error('Export expense details failed:', error)
    toast.error('فشل تصدير تفاصيل المصروفات')
  }
}

// Export only the expense details table to PDF
const exportExpenseDetailsToPdf = async () => {
  try {
    const details = expensesReport.value.details || []
    if (details.length === 0) {
      toast.warning('لا توجد بيانات للتصدير')
      return
    }

    const total = details.reduce((s, e) => s + Number(e.amount || 0), 0)
    const rows = details.map(e => `
      <tr>
        <td>${formatDate(e.expenseDate)}</td>
        <td>${e.category || ''}</td>
        <td style="color:#EF4444; font-weight:bold;">${Number(e.amount || 0).toLocaleString()}</td>
        <td>${e.description || ''}</td>
        <td>${e.receiptNumber || ''}</td>
        <td>${e.supplierName || ''}</td>
        <td>${e.recordedByName || ''}</td>
      </tr>
    `).join('')

    const container = document.createElement('div')
    container.style.cssText = 'position:absolute; top:-9999px; left:-9999px; width:1100px; padding:24px; background:#fff; color:#000; direction:rtl; font-family:Tajawal, Arial, sans-serif;'
    container.innerHTML = `
      <div style="text-align:center; margin-bottom:16px;">
        <h1 style="margin:0; color:#046375; font-size:22px;">مطعم جوستو</h1>
        <h2 style="margin:6px 0 0; color:#333; font-size:16px;">تقرير تفاصيل المصروفات</h2>
        <div style="margin-top:6px; font-size:12px; color:#666;">من ${startDate.value} إلى ${endDate.value}</div>
      </div>
      <table style="width:100%; border-collapse:collapse; font-size:11px;">
        <thead>
          <tr style="background:#046375; color:#fff;">
            <th style="padding:8px; border:1px solid #ddd;">التاريخ</th>
            <th style="padding:8px; border:1px solid #ddd;">الفئة</th>
            <th style="padding:8px; border:1px solid #ddd;">المبلغ (د.ع)</th>
            <th style="padding:8px; border:1px solid #ddd;">الوصف</th>
            <th style="padding:8px; border:1px solid #ddd;">رقم الإيصال</th>
            <th style="padding:8px; border:1px solid #ddd;">المورد</th>
            <th style="padding:8px; border:1px solid #ddd;">مسجّل بواسطة</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr style="background:#f5f5f5; font-weight:bold;">
            <td colspan="2" style="padding:8px; border:1px solid #ddd; text-align:left;">الإجمالي</td>
            <td colspan="5" style="padding:8px; border:1px solid #ddd; color:#EF4444;">${total.toLocaleString()} د.ع</td>
          </tr>
        </tfoot>
      </table>
    `
    document.body.appendChild(container)

    const canvas = await html2canvas(container, { scale: 2, backgroundColor: '#fff' })
    document.body.removeChild(container)

    const pdf = new jsPDF('p', 'mm', 'a4')
    const imgData = canvas.toDataURL('image/png')
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width
    let heightLeft = pdfHeight
    let position = 0
    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight)
    heightLeft -= pdf.internal.pageSize.getHeight()
    while (heightLeft > 0) {
      position = heightLeft - pdfHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight)
      heightLeft -= pdf.internal.pageSize.getHeight()
    }
    pdf.save(`تفاصيل_المصروفات_${startDate.value}_${endDate.value}.pdf`)
    toast.success('تم تصدير تفاصيل المصروفات إلى PDF بنجاح')
  } catch (error) {
    console.error('Export expense details PDF failed:', error)
    toast.error('فشل تصدير تفاصيل المصروفات إلى PDF')
  }
}

// Export to PDF with Arabic support and nice design
const exportToPDF = async () => {
  try {
    toast.info('جاري إنشاء PDF...')
    
    // Create a hidden container for PDF content
    const pdfContainer = document.createElement('div')
    pdfContainer.style.position = 'absolute'
    pdfContainer.style.left = '-9999px'
    pdfContainer.style.width = '210mm' // A4 width
    pdfContainer.style.padding = '15mm'
    pdfContainer.style.backgroundColor = '#ffffff'
    pdfContainer.style.fontFamily = 'Arial, sans-serif'
    pdfContainer.style.direction = 'rtl'
    pdfContainer.style.textAlign = 'right'
    pdfContainer.style.fontSize = '10px'
    
    // Get report title
    const reportTitles = {
      financial: 'التقرير المالي',
      sales: 'تقرير المبيعات',
      expenses: 'تقرير المصروفات',
      purchases: 'تقرير المشتريات',
      summary: 'ملخص يومي'
    }
    
    // Create header with logo
    const header = document.createElement('div')
    header.style.marginBottom = '15px'
    header.style.borderBottom = '2px solid #046375'
    header.style.paddingBottom = '10px'
    
    const logoImgElement = document.createElement('img')
    logoImgElement.src = logoImg
    logoImgElement.style.width = '45px'
    logoImgElement.style.height = '45px'
    logoImgElement.style.float = 'right'
    logoImgElement.style.marginLeft = '10px'
    logoImgElement.style.objectFit = 'contain'
    
    const titleDiv = document.createElement('div')
    titleDiv.innerHTML = `
      <h6 style="margin: 0; color: #046375; font-size: 9px; font-weight: bold;">${reportTitles[activeTab.value] || 'تقرير'}</h6>
      <p style="margin: 2px 0 0 0; color: #6B7280; font-size: 8px;">من: ${startDate.value} - إلى: ${endDate.value}</p>
      <p style="margin: 2px 0 0 0; color: #6B7280; font-size: 7px;">تاريخ الإنشاء: ${new Date().toLocaleDateString('ar-IQ')}</p>
    `
    
    header.appendChild(logoImgElement)
    header.appendChild(titleDiv)
    pdfContainer.appendChild(header)
    
    // Create content based on active tab
    const content = document.createElement('div')
    content.style.marginTop = '15px'
    
    switch(activeTab.value) {
      case 'financial':
        const financialExpenseRows = (financialReport.value.expenseDetails || []).map(e => `
          <tr>
            <td style="padding: 5px; border-bottom: 1px solid #E5E7EB; font-size: 8px;">${formatDate(e.expenseDate)}</td>
            <td style="padding: 5px; border-bottom: 1px solid #E5E7EB; font-size: 8px;">${e.category || '-'}</td>
            <td style="padding: 5px; border-bottom: 1px solid #E5E7EB; font-size: 8px; color: #EF4444; font-weight: bold;">${Number(e.amount || 0).toLocaleString()} د.ع</td>
            <td style="padding: 5px; border-bottom: 1px solid #E5E7EB; font-size: 8px;">${(e.description || '').substring(0, 40)}${(e.description || '').length > 40 ? '...' : ''}</td>
            <td style="padding: 5px; border-bottom: 1px solid #E5E7EB; font-size: 8px;">${e.receiptNumber || '-'}</td>
            <td style="padding: 5px; border-bottom: 1px solid #E5E7EB; font-size: 8px;">${e.recordedByName || '-'}</td>
          </tr>
        `).join('')
        const financialItemSalesRows = (financialReport.value.itemSalesDetails || []).map(item => `
          <tr>
            <td style="padding: 5px; border-bottom: 1px solid #E5E7EB; font-size: 8px;">${item.itemName || '-'}</td>
            <td style="padding: 5px; border-bottom: 1px solid #E5E7EB; font-size: 8px;">${item.categoryName || '-'}</td>
            <td style="padding: 5px; border-bottom: 1px solid #E5E7EB; font-size: 8px; text-align: center;">${item.totalQuantity || 0}</td>
            <td style="padding: 5px; border-bottom: 1px solid #E5E7EB; font-size: 8px; color: #10B981; font-weight: bold;">${Number(item.revenue || 0).toLocaleString()} د.ع</td>
          </tr>
        `).join('')
        content.innerHTML = `
          <div style="margin-bottom: 20px;">
            <h6 style="color: #046375; font-size: 8px; margin-bottom: 4px; border-bottom: 1px solid #E5E7EB; padding-bottom: 2px; font-weight: bold;">الإيرادات</h6>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 8px;">
              <div style="background: #f3f4f6; padding: 10px; border-radius: 6px;">
                <p style="margin: 0; color: #6B7280; font-size: 10px;">إجمالي المبيعات</p>
                <p style="margin: 3px 0 0 0; color: #1f2937; font-size: 14px; font-weight: bold;">${Number(financialReport.value.income?.totalSales || 0).toLocaleString()} د.ع</p>
              </div>
              <div style="background: #f3f4f6; padding: 10px; border-radius: 6px;">
                <p style="margin: 0; color: #6B7280; font-size: 10px;">عدد الطلبات</p>
                <p style="margin: 3px 0 0 0; color: #1f2937; font-size: 14px; font-weight: bold;">${financialReport.value.income?.orderCount || 0}</p>
              </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 8px;">
              <div style="background: #f3f4f6; padding: 10px; border-radius: 6px;">
                <p style="margin: 0; color: #6B7280; font-size: 10px;">كاش</p>
                <p style="margin: 3px 0 0 0; color: #1f2937; font-size: 14px; font-weight: bold;">${Number(financialReport.value.income?.totalCash || 0).toLocaleString()} د.ع</p>
              </div>
              <div style="background: #f3f4f6; padding: 10px; border-radius: 6px;">
                <p style="margin: 0; color: #6B7280; font-size: 10px;">بطاقة</p>
                <p style="margin: 3px 0 0 0; color: #1f2937; font-size: 14px; font-weight: bold;">${Number(financialReport.value.income?.totalCard || 0).toLocaleString()} د.ع</p>
              </div>
              <div style="background: #f3f4f6; padding: 10px; border-radius: 6px;">
                <p style="margin: 0; color: #6B7280; font-size: 10px;">آجل</p>
                <p style="margin: 3px 0 0 0; color: #1f2937; font-size: 14px; font-weight: bold;">${Number(financialReport.value.income?.totalCredit || 0).toLocaleString()} د.ع</p>
              </div>
            </div>
          </div>
          <div style="margin-bottom: 20px;">
            <h6 style="color: #046375; font-size: 8px; margin-bottom: 4px; border-bottom: 1px solid #E5E7EB; padding-bottom: 2px; font-weight: bold;">المصروفات</h6>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 8px;">
              <div style="background: #FEF2F2; padding: 10px; border-radius: 6px;">
                <p style="margin: 0; color: #6B7280; font-size: 10px;">إجمالي المصروفات</p>
                <p style="margin: 3px 0 0 0; color: #1f2937; font-size: 14px; font-weight: bold;">${Number(financialReport.value.expenses?.totalExpenses || 0).toLocaleString()} د.ع</p>
              </div>
              <div style="background: #FEF2F2; padding: 10px; border-radius: 6px;">
                <p style="margin: 0; color: #6B7280; font-size: 10px;">عدد المصروفات</p>
                <p style="margin: 3px 0 0 0; color: #1f2937; font-size: 14px; font-weight: bold;">${financialReport.value.expenses?.expenseCount || 0}</p>
              </div>
            </div>
          </div>
          <div style="margin-bottom: 20px;">
            <h6 style="color: #046375; font-size: 8px; margin-bottom: 4px; border-bottom: 1px solid #E5E7EB; padding-bottom: 2px; font-weight: bold;">المشتريات</h6>
            <div style="background: #FFFBEB; padding: 10px; border-radius: 6px;">
              <p style="margin: 0; color: #6B7280; font-size: 10px;">إجمالي المشتريات</p>
              <p style="margin: 3px 0 0 0; color: #1f2937; font-size: 14px; font-weight: bold;">${Number(financialReport.value.purchases?.totalPurchases || 0).toLocaleString()} د.ع</p>
            </div>
          </div>
          <div style="margin-bottom: 20px;">
            <h6 style="color: #046375; font-size: 8px; margin-bottom: 4px; border-bottom: 1px solid #E5E7EB; padding-bottom: 2px; font-weight: bold;">تفصيل الربح</h6>
            <table style="width: 100%; border-collapse: collapse; font-size: 10px; background: #ECFDF5; border-radius: 6px;">
              <tbody>
                ${profitBreakdownRows.value.map(r => `
                  <tr style="${r.total ? 'border-top: 1px solid #A7F3D0; font-weight: bold;' : ''}">
                    <td style="padding: 6px 10px; color: ${r.total ? '#1f2937' : '#6B7280'};">${r.sign} ${r.label}</td>
                    <td style="padding: 6px 10px; text-align: left; color: ${r.color || '#1f2937'};">${r.isPercent ? `${r.value}%` : `${Number(r.value || 0).toLocaleString()} د.ع`}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <div style="margin-bottom: 20px;">
            <h6 style="color: #046375; font-size: 8px; margin-bottom: 4px; border-bottom: 1px solid #E5E7EB; padding-bottom: 2px; font-weight: bold;">تفاصيل المصروفات</h6>
            <table style="width: 100%; border-collapse: collapse; font-size: 8px;">
              <thead>
                <tr style="background: #f3f4f6;">
                  <th style="padding: 6px; text-align: right; border-bottom: 2px solid #E5E7EB; color: #1f2937; font-weight: bold;">التاريخ</th>
                  <th style="padding: 6px; text-align: right; border-bottom: 2px solid #E5E7EB; color: #1f2937; font-weight: bold;">الفئة</th>
                  <th style="padding: 6px; text-align: left; border-bottom: 2px solid #E5E7EB; color: #1f2937; font-weight: bold;">المبلغ</th>
                  <th style="padding: 6px; text-align: right; border-bottom: 2px solid #E5E7EB; color: #1f2937; font-weight: bold;">الوصف</th>
                  <th style="padding: 6px; text-align: right; border-bottom: 2px solid #E5E7EB; color: #1f2937; font-weight: bold;">رقم الإيصال</th>
                  <th style="padding: 6px; text-align: right; border-bottom: 2px solid #E5E7EB; color: #1f2937; font-weight: bold;">مسجّل بواسطة</th>
                </tr>
              </thead>
              <tbody>
                ${financialExpenseRows || '<tr><td colspan="6" style="padding: 8px; text-align: center; color: #6B7280;">لا توجد مصروفات</td></tr>'}
              </tbody>
            </table>
          </div>
          <div style="margin-bottom: 20px;">
            <h6 style="color: #046375; font-size: 8px; margin-bottom: 4px; border-bottom: 1px solid #E5E7EB; padding-bottom: 2px; font-weight: bold;">تفاصيل مبيعات الأصناف</h6>
            <table style="width: 100%; border-collapse: collapse; font-size: 8px;">
              <thead>
                <tr style="background: #f3f4f6;">
                  <th style="padding: 6px; text-align: right; border-bottom: 2px solid #E5E7EB; color: #1f2937; font-weight: bold;">الصنف</th>
                  <th style="padding: 6px; text-align: right; border-bottom: 2px solid #E5E7EB; color: #1f2937; font-weight: bold;">الفئة</th>
                  <th style="padding: 6px; text-align: center; border-bottom: 2px solid #E5E7EB; color: #1f2937; font-weight: bold;">الكمية</th>
                  <th style="padding: 6px; text-align: left; border-bottom: 2px solid #E5E7EB; color: #1f2937; font-weight: bold;">الإيرادات</th>
                </tr>
              </thead>
              <tbody>
                ${financialItemSalesRows || '<tr><td colspan="4" style="padding: 8px; text-align: center; color: #6B7280;">لا توجد مبيعات</td></tr>'}
              </tbody>
            </table>
          </div>
        `
        break
      case 'sales':
        const dailySalesRows = (salesReport.value.dailySales || []).slice(0, 15).map(d => `
          <tr>
            <td style="padding: 6px; border-bottom: 1px solid #E5E7EB; font-size: 9px;">${formatDate(d.date)}</td>
            <td style="padding: 6px; border-bottom: 1px solid #E5E7EB; text-align: center; font-size: 9px;">${d.orderCount}</td>
            <td style="padding: 6px; border-bottom: 1px solid #E5E7EB; text-align: left; color: #10B981; font-weight: bold; font-size: 9px;">${Number(d.totalSales || 0).toLocaleString()} د.ع</td>
          </tr>
        `).join('')
        
        const topItemsRows = (salesReport.value.topItems || []).slice(0, 15).map(t => `
          <tr>
            <td style="padding: 6px; border-bottom: 1px solid #E5E7EB; font-size: 9px;">${t.itemName}</td>
            <td style="padding: 6px; border-bottom: 1px solid #E5E7EB; text-align: center; font-size: 9px;">${t.totalQuantity}</td>
            <td style="padding: 6px; border-bottom: 1px solid #E5E7EB; text-align: left; color: #046375; font-weight: bold; font-size: 9px;">${Number(t.revenue || 0).toLocaleString()} د.ع</td>
          </tr>
        `).join('')
        
        content.innerHTML = `
          <div style="margin-bottom: 20px;">
            <h6 style="color: #046375; font-size: 8px; margin-bottom: 4px; border-bottom: 1px solid #E5E7EB; padding-bottom: 2px; font-weight: bold;">المبيعات اليومية</h6>
            <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
              <thead>
                <tr style="background: #f3f4f6;">
                  <th style="padding: 8px; text-align: right; border-bottom: 2px solid #E5E7EB; color: #1f2937; font-weight: bold; font-size: 10px;">التاريخ</th>
                  <th style="padding: 8px; text-align: center; border-bottom: 2px solid #E5E7EB; color: #1f2937; font-weight: bold; font-size: 10px;">عدد الطلبات</th>
                  <th style="padding: 8px; text-align: left; border-bottom: 2px solid #E5E7EB; color: #1f2937; font-weight: bold; font-size: 10px;">المبيعات</th>
                </tr>
              </thead>
              <tbody>
                ${dailySalesRows}
              </tbody>
            </table>
          </div>
          <div style="margin-bottom: 20px;">
            <h6 style="color: #046375; font-size: 8px; margin-bottom: 4px; border-bottom: 1px solid #E5E7EB; padding-bottom: 2px; font-weight: bold;">الأصناف الأكثر مبيعاً</h6>
            <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
              <thead>
                <tr style="background: #f3f4f6;">
                  <th style="padding: 8px; text-align: right; border-bottom: 2px solid #E5E7EB; color: #1f2937; font-weight: bold; font-size: 10px;">الصنف</th>
                  <th style="padding: 8px; text-align: center; border-bottom: 2px solid #E5E7EB; color: #1f2937; font-weight: bold; font-size: 10px;">الكمية</th>
                  <th style="padding: 8px; text-align: left; border-bottom: 2px solid #E5E7EB; color: #1f2937; font-weight: bold; font-size: 10px;">الإيرادات</th>
                </tr>
              </thead>
              <tbody>
                ${topItemsRows}
              </tbody>
            </table>
          </div>
        `
        break
      case 'expenses':
        const expensesRows = (expensesReport.value.byCategory || []).map(e => `
          <tr>
            <td style="padding: 6px; border-bottom: 1px solid #E5E7EB; font-size: 9px;">${e.category}</td>
            <td style="padding: 6px; border-bottom: 1px solid #E5E7EB; text-align: center; font-size: 9px;">${e.count}</td>
            <td style="padding: 6px; border-bottom: 1px solid #E5E7EB; text-align: left; color: #EF4444; font-weight: bold; font-size: 9px;">${Number(e.totalAmount || 0).toLocaleString()} د.ع</td>
          </tr>
        `).join('')
        
        content.innerHTML = `
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
            <div style="background: #FEF2F2; padding: 12px; border-radius: 6px; border: 1px solid #FEE2E2;">
              <p style="margin: 0; color: #6B7280; font-size: 10px;">إجمالي المصروفات</p>
              <p style="margin: 5px 0 0 0; color: #EF4444; font-size: 16px; font-weight: bold;">${Number(expensesReport.value.totalExpenses || 0).toLocaleString()} د.ع</p>
            </div>
            <div style="background: #FEF2F2; padding: 12px; border-radius: 6px; border: 1px solid #FEE2E2;">
              <p style="margin: 0; color: #6B7280; font-size: 10px;">عدد المصروفات</p>
              <p style="margin: 5px 0 0 0; color: #1f2937; font-size: 16px; font-weight: bold;">${expensesReport.value.expenseCount || 0}</p>
            </div>
          </div>
          <div>
            <h6 style="color: #046375; font-size: 8px; margin-bottom: 4px; border-bottom: 1px solid #E5E7EB; padding-bottom: 2px; font-weight: bold;">المصروفات حسب الفئة</h6>
            <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
              <thead>
                <tr style="background: #f3f4f6;">
                  <th style="padding: 8px; text-align: right; border-bottom: 2px solid #E5E7EB; color: #1f2937; font-weight: bold; font-size: 10px;">الفئة</th>
                  <th style="padding: 8px; text-align: center; border-bottom: 2px solid #E5E7EB; color: #1f2937; font-weight: bold; font-size: 10px;">العدد</th>
                  <th style="padding: 8px; text-align: left; border-bottom: 2px solid #E5E7EB; color: #1f2937; font-weight: bold; font-size: 10px;">الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                ${expensesRows}
              </tbody>
            </table>
          </div>
        `
        break
      case 'purchases':
        const purchasesRows = (purchasesReport.value.purchases || []).slice(0, 20).map(p => `
          <tr>
            <td style="padding: 6px; border-bottom: 1px solid #E5E7EB; font-size: 9px;">${p.purchaseNumber}</td>
            <td style="padding: 6px; border-bottom: 1px solid #E5E7EB; font-size: 9px;">${p.supplierName}</td>
            <td style="padding: 6px; border-bottom: 1px solid #E5E7EB; font-size: 9px;">${formatDate(p.purchaseDate)}</td>
            <td style="padding: 6px; border-bottom: 1px solid #E5E7EB; text-align: left; color: #F59E0B; font-weight: bold; font-size: 9px;">${Number(p.totalAmount || 0).toLocaleString()} د.ع</td>
            <td style="padding: 6px; border-bottom: 1px solid #E5E7EB; text-align: center;">
              <span style="padding: 3px 6px; border-radius: 3px; background: #FEF3C7; color: #92400E; font-size: 8px;">${getPurchaseStatusText(p.status)}</span>
            </td>
          </tr>
        `).join('')
        
        content.innerHTML = `
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
            <div style="background: #FFFBEB; padding: 12px; border-radius: 6px; border: 1px solid #FEF3C7;">
              <p style="margin: 0; color: #6B7280; font-size: 10px;">إجمالي المشتريات</p>
              <p style="margin: 5px 0 0 0; color: #F59E0B; font-size: 16px; font-weight: bold;">${Number(purchasesReport.value.totalPurchases || 0).toLocaleString()} د.ع</p>
            </div>
            <div style="background: #FFFBEB; padding: 12px; border-radius: 6px; border: 1px solid #FEF3C7;">
              <p style="margin: 0; color: #6B7280; font-size: 10px;">عدد المشتريات</p>
              <p style="margin: 5px 0 0 0; color: #1f2937; font-size: 16px; font-weight: bold;">${purchasesReport.value.purchaseCount || 0}</p>
            </div>
          </div>
          <div>
            <h6 style="color: #046375; font-size: 8px; margin-bottom: 4px; border-bottom: 1px solid #E5E7EB; padding-bottom: 2px; font-weight: bold;">قائمة المشتريات</h6>
            <table style="width: 100%; border-collapse: collapse; font-size: 9px;">
              <thead>
                <tr style="background: #f3f4f6;">
                  <th style="padding: 8px; text-align: right; border-bottom: 2px solid #E5E7EB; color: #1f2937; font-weight: bold; font-size: 9px;">رقم الشراء</th>
                  <th style="padding: 8px; text-align: right; border-bottom: 2px solid #E5E7EB; color: #1f2937; font-weight: bold; font-size: 9px;">المورد</th>
                  <th style="padding: 8px; text-align: right; border-bottom: 2px solid #E5E7EB; color: #1f2937; font-weight: bold; font-size: 9px;">التاريخ</th>
                  <th style="padding: 8px; text-align: left; border-bottom: 2px solid #E5E7EB; color: #1f2937; font-weight: bold; font-size: 9px;">المبلغ</th>
                  <th style="padding: 8px; text-align: center; border-bottom: 2px solid #E5E7EB; color: #1f2937; font-weight: bold; font-size: 9px;">الحالة</th>
                </tr>
              </thead>
              <tbody>
                ${purchasesRows}
              </tbody>
            </table>
          </div>
        `
        break
      case 'summary':
        content.innerHTML = `
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
            <div style="background: #ECFDF5; padding: 12px; border-radius: 6px; border: 1px solid #D1FAE5;">
              <p style="margin: 0; color: #6B7280; font-size: 10px;">المبيعات</p>
              <p style="margin: 5px 0 0 0; color: #10B981; font-size: 16px; font-weight: bold;">${Number(dailySummary.value.sales?.totalSales || 0).toLocaleString()} د.ع</p>
              <p style="margin: 3px 0 0 0; color: #6B7280; font-size: 9px;">${dailySummary.value.sales?.orderCount || 0} طلب</p>
            </div>
            <div style="background: #FEF2F2; padding: 12px; border-radius: 6px; border: 1px solid #FEE2E2;">
              <p style="margin: 0; color: #6B7280; font-size: 10px;">المصروفات</p>
              <p style="margin: 5px 0 0 0; color: #EF4444; font-size: 16px; font-weight: bold;">${Number(dailySummary.value.expenses?.totalExpenses || 0).toLocaleString()} د.ع</p>
              <p style="margin: 3px 0 0 0; color: #6B7280; font-size: 9px;">${dailySummary.value.expenses?.expenseCount || 0} مصروف</p>
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
            <div style="background: #FFFBEB; padding: 12px; border-radius: 6px; border: 1px solid #FEF3C7;">
              <p style="margin: 0; color: #6B7280; font-size: 10px;">المشتريات</p>
              <p style="margin: 5px 0 0 0; color: #F59E0B; font-size: 16px; font-weight: bold;">${Number(dailySummary.value.purchases?.totalPurchases || 0).toLocaleString()} د.ع</p>
              <p style="margin: 3px 0 0 0; color: #6B7280; font-size: 9px;">${dailySummary.value.purchases?.purchaseCount || 0} شراء</p>
            </div>
            <div style="background: #EFF6FF; padding: 12px; border-radius: 6px; border: 1px solid #DBEAFE;">
              <p style="margin: 0; color: #6B7280; font-size: 10px;">صافي الربح</p>
              <p style="margin: 5px 0 0 0; color: ${(dailySummary.value.summary?.netProfit || 0) >= 0 ? '#10B981' : '#EF4444'}; font-size: 16px; font-weight: bold;">${Number(dailySummary.value.summary?.netProfit || 0).toLocaleString()} د.ع</p>
              <p style="margin: 3px 0 0 0; color: #6B7280; font-size: 9px;">هامش: ${dailySummary.value.summary?.profitMargin || 0}%</p>
            </div>
          </div>
        `
        break
    }
    
    pdfContainer.appendChild(content)
    document.body.appendChild(pdfContainer)
    
    // Wait for logo image to load
    await new Promise((resolve) => {
      if (logoImgElement.complete) {
        resolve()
      } else {
        logoImgElement.onload = resolve
        logoImgElement.onerror = resolve
      }
    })
    
    // Wait a bit more for layout to settle
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Convert to canvas then PDF
    const canvas = await html2canvas(pdfContainer, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    })
    
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    const imgWidth = 210 // A4 width in mm
    const pageHeight = 297 // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight
    let position = 0
    
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight
    
    while (heightLeft > 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }
    
    const fileName = `تقرير_${activeTab.value}_${startDate.value}_${endDate.value}.pdf`
    pdf.save(fileName)
    
    // Clean up
    document.body.removeChild(pdfContainer)
    
    toast.success('تم تصدير التقرير إلى PDF بنجاح')
  } catch (error) {
    console.error('Export to PDF failed:', error)
    toast.error('فشل تصدير التقرير إلى PDF')
  }
}

// Print Report
const printReport = () => {
  window.print()
}

onMounted(() => {
  loadReports()
  loadMenuItems()
  loadCategories()
})
</script>

<style scoped>
/* Chart Placeholder */
.chart-placeholder {
  height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: var(--t-surface-high);
  border-radius: 12px;
  border: 1px dashed var(--t-border-strong);
}

.reports-table :deep(.v-data-table__thead) {
  background: var(--t-surface-high);
}

.reports-table :deep(.v-data-table__thead th) {
  color: var(--t-text-dim) !important;
  font-weight: 600 !important;
  font-size: 0.875rem !important;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.reports-table :deep(.v-data-table__tbody tr) {
  border-bottom: 1px solid var(--t-border-subtle);
}

.reports-table :deep(.v-data-table__tbody tr:hover) {
  background: var(--t-surface-high) !important;
}
</style>
