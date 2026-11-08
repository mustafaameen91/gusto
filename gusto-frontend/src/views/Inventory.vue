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
                    إدارة المخزون - المكونات والمخزون
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
        <div class="d-flex ga-2">
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
              <v-list-item @click="exportInventory">
                <template v-slot:prepend>
                  <PhDownload :size="20" weight="bold" color="#046375" class="ml-2" />
                </template>
                <v-list-item-title>تصدير Excel</v-list-item-title>
              </v-list-item>
              <v-list-item @click="printInventory">
                <template v-slot:prepend>
                  <PhPrinter :size="20" weight="bold" color="#046375" class="ml-2" />
                </template>
                <v-list-item-title>طباعة التقرير</v-list-item-title>
              </v-list-item>
              <v-divider class="my-2" />
              <v-list-item @click="refreshInventory">
                <template v-slot:prepend>
                  <PhArrowClockwise :size="20" weight="bold" color="#046375" class="ml-2" />
                </template>
                <v-list-item-title>تحديث</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
          <v-btn
            @click="openAddDialog"
            color="#046375"
            variant="flat"
            size="large"
            style="border-radius: 12px;"
          >
            <PhPlus :size="20" weight="bold" class="ml-1" />
            إضافة مكون جديد
          </v-btn>
        </div>
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
                <PhCube :size="24" weight="duotone" color="white" />
              </div>
            </div>
            <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">
              إجمالي المكونات
            </p>
            <h2 class="text-h4 font-weight-bold mb-1" style="color: var(--t-text);">
              {{ ingredients.length }}
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
                <PhWarning :size="24" weight="duotone" color="#F59E0B" />
              </div>
            </div>
            <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">
              مخزون منخفض
            </p>
            <h2 class="text-h4 font-weight-bold mb-1" style="color: var(--t-text);">
              {{ lowStockCount }}
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
              مخزون جيد
            </p>
            <h2 class="text-h4 font-weight-bold mb-1" style="color: var(--t-text);">
              {{ goodStockCount }}
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
            <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">
              القيمة الإجمالية
            </p>
            <h2 class="text-h4 font-weight-bold mb-1" style="color: var(--t-text);">
              {{ totalValue.toLocaleString() }} د.ع
            </h2>
          </v-card>
        </v-col>
      </v-row>

      <!-- Filters & Tabs -->
      <v-card
        elevation="0"
        style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;"
        class="mb-4"
      >
        <v-card-text class="pa-4">
          <v-row align="center">
            <v-col cols="12" md="6">
              <v-text-field
                v-model="search"
                label="بحث عن مكون..."
                variant="outlined"
                density="comfortable"
                hide-details
                clearable
                style="border-radius: 8px;"
              >
                <template v-slot:prepend-inner>
                  <PhMagnifyingGlass :size="20" weight="bold" color="#6B7280" />
                </template>
              </v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-btn-toggle
                v-model="selectedTab"
                mandatory
                color="#046375"
                variant="outlined"
                divided
                style="border-radius: 8px; width: 100%;"
              >
                <v-btn value="all" class="flex-grow-1">
                  <PhStack :size="20" weight="bold" class="ml-1" />
                  الكل ({{ ingredients.length }})
                </v-btn>
                <v-btn value="low" class="flex-grow-1">
                  <PhWarning :size="20" weight="bold" class="ml-1" />
                  منخفض ({{ lowStockCount }})
                </v-btn>
              </v-btn-toggle>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Ingredients Table -->
      <v-card
        elevation="0"
        style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;"
      >
        <v-data-table
          :headers="headers"
          :items="filteredIngredients"
          :search="search"
          :items-per-page="15"
          :loading="loading.ingredients"
          class="elevation-0 inventory-table"
        >
            <template v-slot:item.ingredientName="{ item }">
              <div class="d-flex align-center ga-3">
                <v-avatar size="40" :color="getStockColor(item)">
                  <PhPackage :size="20" weight="bold" color="white" />
                </v-avatar>
                <div>
                  <div class="font-weight-bold">{{ item.ingredientName }}</div>
                  <div class="text-caption text-grey">{{ item.notes || 'لا توجد ملاحظات' }}</div>
                </div>
              </div>
            </template>

            <template v-slot:item.currentStock="{ item }">
              <div class="text-center">
                <v-chip
                  :color="getStockColor(item)"
                  size="large"
                  class="font-weight-bold"
                >
                  {{ item.currentStock }} {{ item.unit }}
                </v-chip>
                <v-progress-linear
                  :model-value="getStockPercentage(item)"
                  :color="getStockColor(item)"
                  height="4"
                  rounded
                  class="mt-2"
                />
              </div>
            </template>

            <template v-slot:item.minStock="{ item }">
              <v-chip size="small" variant="tonal" color="warning">
                {{ item.minStock }} {{ item.unit }}
              </v-chip>
            </template>

            <template v-slot:item.maxStock="{ item }">
              <v-chip size="small" variant="tonal" color="info">
                {{ item.maxStock }} {{ item.unit }}
              </v-chip>
            </template>

            <template v-slot:item.costPerUnit="{ item }">
              <span class="font-weight-bold" style="color: #046375;">
                {{ Number(item.costPerUnit).toLocaleString() }} د.ع
              </span>
            </template>

            <template v-slot:item.totalValue="{ item }">
              <span class="font-weight-bold" style="color: #046375;">
                {{ (Number(item.currentStock) * Number(item.costPerUnit)).toLocaleString() }} د.ع
              </span>
            </template>

            <template v-slot:item.actions="{ item }">
              <div class="d-flex ga-1">
                <v-btn
                  icon
                  size="small"
                  variant="text"
                  color="warning"
                  @click="pullMaterial(item)"
                  :title="`سحب مادة — ${item.ingredientName}`"
                  :aria-label="`سحب مادة — ${item.ingredientName}`"
                >
                  <PhArrowDown :size="18" weight="bold" />
                </v-btn>
                <v-btn
                  icon
                  size="small"
                  variant="text"
                  color="info"
                  @click="viewTransactions(item)"
                  :title="`الحركات — ${item.ingredientName}`"
                  :aria-label="`الحركات — ${item.ingredientName}`"
                >
                  <PhClockCounterClockwise :size="18" weight="bold" />
                </v-btn>
                <v-btn
                  icon
                  size="small"
                  variant="text"
                  color="success"
                  @click="adjustStock(item)"
                  :title="`تعديل المخزون — ${item.ingredientName}`"
                  :aria-label="`تعديل المخزون — ${item.ingredientName}`"
                >
                  <PhPlusMinus :size="18" weight="bold" />
                </v-btn>
                <v-btn
                  icon
                  size="small"
                  variant="text"
                  color="primary"
                  @click="editIngredient(item)"
                  :title="`تعديل — ${item.ingredientName}`"
                  :aria-label="`تعديل — ${item.ingredientName}`"
                >
                  <PhPencilSimple :size="18" weight="bold" />
                </v-btn>
                <v-btn
                  v-if="isAdmin"
                  icon
                  size="small"
                  variant="text"
                  color="error"
                  @click="deleteIngredient(item)"
                  :title="`حذف — ${item.ingredientName}`"
                  :aria-label="`حذف — ${item.ingredientName}`"
                >
                  <PhTrash :size="18" weight="bold" />
                </v-btn>
              </div>
            </template>
          </v-data-table>
        </v-card>
    </v-container>

    <!-- Add/Edit Ingredient Dialog -->
    <v-dialog v-model="showAddDialog" max-width="700" persistent>
      <v-card elevation="0" style="border-radius: 16px; overflow: hidden;">
        <!-- Header -->
        <div style="background: #046375; padding: 24px;">
          <div class="d-flex align-center">
            <div style="width: 48px; height: 48px; border-radius: 10px; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; margin-left: 12px;">
              <PhPackage :size="24" weight="bold" color="white" />
            </div>
            <div>
              <h3 class="text-h6 font-weight-bold text-white mb-1">
                {{ editingItem ? 'تعديل المكون' : 'إضافة مكون جديد' }}
              </h3>
              <p class="text-body-2 text-white mb-0" style="opacity: 0.9;">
                {{ editingItem ? 'قم بتحديث معلومات المكون' : 'أضف مكون جديد للمخزون' }}
              </p>
            </div>
          </div>
        </div>

        <v-card-text class="pa-6" style="background: var(--t-surface);">
          <v-row>
            <v-col cols="12" md="8">
              <v-text-field
                v-model="ingredientForm.ingredientName"
                label="اسم المكون"
                placeholder="مثال: حبوب القهوة، حليب، سكر"
                variant="outlined"
                density="comfortable"
                :rules="[rules.required]"
                color="#046375"
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-select
                v-model="ingredientForm.unit"
                :items="units"
                label="الوحدة"
                variant="outlined"
                density="comfortable"
                :rules="[rules.required]"
                color="#046375"
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="ingredientForm.currentStock"
                :label="editingItem ? 'المخزون الحالي' : 'المخزون الافتتاحي'"
                type="number"
                step="0.001"
                variant="outlined"
                density="comfortable"
                :suffix="ingredientForm.unit"
                :disabled="!!editingItem"
                :readonly="!!editingItem"
                :hint="editingItem ? 'يُعدّل المخزون من زر الهدر/التسوية أو من الاستلام' : ''"
                :persistent-hint="!!editingItem"
                color="#046375"
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="ingredientForm.minStock"
                label="الحد الأدنى"
                type="number"
                step="0.001"
                variant="outlined"
                density="comfortable"
                :suffix="ingredientForm.unit"
                hint="تنبيه عند الوصول لهذا الحد"
                persistent-hint
                color="#F59E0B"
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="ingredientForm.maxStock"
                label="الحد الأقصى"
                type="number"
                step="0.001"
                variant="outlined"
                density="comfortable"
                :suffix="ingredientForm.unit"
                color="#046375"
              />
            </v-col>

            <v-col cols="12">
              <v-text-field
                v-model.number="ingredientForm.costPerUnit"
                label="التكلفة لكل وحدة"
                type="number"
                step="100"
                suffix="د.ع"
                variant="outlined"
                density="comfortable"
                color="#046375"
              />
            </v-col>

            <v-col cols="12">
              <v-textarea
                v-model="ingredientForm.notes"
                label="ملاحظات"
                placeholder="أي معلومات إضافية..."
                variant="outlined"
                density="comfortable"
                rows="3"
                counter="200"
                color="#046375"
              />
            </v-col>
          </v-row>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4" style="background: var(--t-surface-high);">
          <v-btn 
            @click="closeAddDialog" 
            variant="text" 
            size="large"
            style="color: var(--t-text-dim);"
          >
            <PhX :size="20" weight="bold" class="ml-1" />
            إلغاء
          </v-btn>
          <v-spacer />
          <v-btn 
            color="#046375" 
            @click="saveIngredient" 
            :loading="saving" 
            variant="flat" 
            size="large"
            style="border-radius: 8px;"
          >
            <PhFloppyDisk :size="20" weight="bold" class="ml-1" />
            حفظ المكون
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Adjust Stock Dialog -->
    <v-dialog v-model="showAdjustDialog" max-width="600" persistent>
      <v-card v-if="adjustingItem" elevation="0" style="border-radius: 16px; overflow: hidden;">
        <!-- Header -->
        <div style="background: #046375; padding: 24px;">
          <div class="d-flex align-center">
            <div style="width: 48px; height: 48px; border-radius: 10px; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; margin-left: 12px;">
              <PhPlusMinus :size="24" weight="bold" color="white" />
            </div>
            <div>
              <h3 class="text-h6 font-weight-bold text-white mb-1">
                تعديل المخزون
              </h3>
              <p class="text-body-2 text-white mb-0" style="opacity: 0.9;">
                {{ adjustingItem.ingredientName }}
              </p>
            </div>
          </div>
        </div>

        <v-card-text class="pa-6" style="background: var(--t-surface);">
          <!-- Current Stock Alert -->
          <v-alert 
            type="info" 
            variant="tonal" 
            class="mb-5"
            style="border-radius: 8px;"
          >
            <div class="d-flex align-center justify-space-between">
              <span class="font-weight-bold">المخزون الحالي:</span>
              <v-chip size="large" :color="getStockColor(adjustingItem)" variant="flat">
                {{ adjustingItem.currentStock }} {{ adjustingItem.unit }}
              </v-chip>
            </div>
          </v-alert>

          <v-select
            v-model="adjustForm.transactionType"
            :items="transactionTypes"
            label="نوع العملية"
            variant="outlined"
            density="comfortable"
            class="mb-4"
            color="#046375"
          />

          <v-text-field
            v-model.number="adjustForm.quantity"
            label="الكمية"
            type="number"
            step="0.001"
            variant="outlined"
            density="comfortable"
            :suffix="adjustingItem.unit"
            :hint="quantityHint"
            persistent-hint
            class="mb-4"
            color="#046375"
          />

          <v-text-field
            v-model.number="adjustForm.costPerUnit"
            label="التكلفة لكل وحدة (اختياري)"
            type="number"
            step="100"
            suffix="د.ع"
            variant="outlined"
            density="comfortable"
            :hint="`اتركه فارغاً لاستخدام متوسط التكلفة الحالي (${Number(adjustingItem.costPerUnit || 0).toLocaleString()} د.ع)`"
            persistent-hint
            class="mb-4"
            color="#046375"
          />

          <v-textarea
            v-model="adjustForm.notes"
            label="ملاحظات"
            placeholder="سبب التعديل..."
            variant="outlined"
            density="comfortable"
            rows="2"
            color="#046375"
          />

          <!-- Result Preview -->
          <v-card 
            variant="tonal" 
            :color="newStockAmount >= 0 ? 'success' : 'error'" 
            class="pa-4 mt-4"
            style="border-radius: 8px;"
          >
            <div class="d-flex align-center justify-space-between">
              <div>
                <div class="font-weight-bold mb-1">المخزون بعد التعديل:</div>
                <div class="text-caption">
                  {{ adjustingItem.currentStock }} 
                  {{ adjustForm.transactionType === 'adjustment' ? (Number(adjustForm.quantity) < 0 ? '-' : '+') : '-' }}
                  {{ Math.abs(adjustForm.quantity) }} 
                  = {{ newStockAmount }}
                </div>
              </div>
              <v-chip 
                size="large" 
                :color="newStockAmount >= 0 ? 'success' : 'error'" 
                variant="flat"
              >
                {{ newStockAmount }} {{ adjustingItem.unit }}
              </v-chip>
            </div>
          </v-card>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4" style="background: var(--t-surface-high);">
          <v-btn 
            @click="showAdjustDialog = false" 
            variant="text"
            size="large"
            style="color: var(--t-text-dim);"
          >
            <PhX :size="20" weight="bold" class="ml-1" />
            إلغاء
          </v-btn>
          <v-spacer />
          <v-btn 
            color="#046375" 
            @click="saveAdjustment" 
            :loading="saving"
            variant="flat" 
            size="large"
            style="border-radius: 8px;"
          >
            <PhCheckCircle :size="20" weight="bold" class="ml-1" />
            تأكيد التعديل
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Pull Material Dialog -->
    <v-dialog v-model="showPullMaterialDialog" max-width="500" persistent>
      <v-card v-if="pullingItem" elevation="0" style="border-radius: 16px; overflow: hidden;">
        <!-- Header -->
        <div style="background: #F59E0B; padding: 24px;">
          <div class="d-flex align-center">
            <div style="width: 48px; height: 48px; border-radius: 10px; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; margin-left: 12px;">
              <PhArrowDown :size="24" weight="bold" color="white" />
            </div>
            <div>
              <h3 class="text-h6 font-weight-bold text-white mb-1">
                سحب مادة من المخزون
              </h3>
              <p class="text-body-2 text-white mb-0" style="opacity: 0.9;">
                {{ pullingItem.ingredientName }}
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
            <div class="d-flex align-center justify-space-between">
              <span class="font-weight-bold">المخزون الحالي:</span>
              <v-chip size="large" :color="getStockColor(pullingItem)" variant="flat">
                {{ pullingItem.currentStock }} {{ pullingItem.unit }}
              </v-chip>
            </div>
          </v-alert>

          <v-text-field
            v-model.number="pullForm.quantity"
            label="الكمية المسحوبة"
            type="number"
            step="0.001"
            :min="0.001"
            :max="pullingItem.currentStock"
            variant="outlined"
            density="comfortable"
            :suffix="pullingItem.unit"
            hint="أدخل الكمية التي تريد سحبها من المخزون"
            persistent-hint
            class="mb-4"
            color="#046375"
          />

          <v-textarea
            v-model="pullForm.notes"
            label="ملاحظات (اختياري)"
            placeholder="سبب السحب أو الاستخدام..."
            variant="outlined"
            density="comfortable"
            rows="3"
            color="#046375"
          />

          <!-- Result Preview -->
          <v-card 
            variant="tonal" 
            color="warning" 
            class="pa-4 mt-4"
            style="border-radius: 8px;"
          >
            <div class="d-flex align-center justify-space-between">
              <div>
                <div class="font-weight-bold mb-1">المخزون بعد السحب:</div>
                <div class="text-caption">
                  {{ pullingItem.currentStock }} - {{ pullForm.quantity || 0 }} = {{ newStockAfterPull }}
                </div>
              </div>
              <v-chip 
                size="large" 
                :color="newStockAfterPull >= 0 ? 'success' : 'error'" 
                variant="flat"
              >
                {{ newStockAfterPull }} {{ pullingItem.unit }}
              </v-chip>
            </div>
          </v-card>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4" style="background: var(--t-surface-high);">
          <v-btn 
            @click="showPullMaterialDialog = false" 
            variant="text"
            size="large"
            style="color: var(--t-text-dim);"
          >
            <PhX :size="20" weight="bold" class="ml-1" />
            إلغاء
          </v-btn>
          <v-spacer />
          <v-btn 
            color="#F59E0B" 
            @click="savePullMaterial" 
            :loading="saving"
            :disabled="!pullForm.quantity || pullForm.quantity <= 0 || pullForm.quantity > pullingItem.currentStock"
            variant="flat" 
            size="large"
            style="border-radius: 8px;"
          >
            <PhCheckCircle :size="20" weight="bold" class="ml-1" />
            تأكيد السحب
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Transactions Dialog -->
    <v-dialog v-model="showTransactionsDialog" max-width="900" scrollable>
      <v-card v-if="viewingItem" elevation="0" style="border-radius: 16px; overflow: hidden;">
        <!-- Header -->
        <div style="background: #046375; padding: 24px;">
          <div class="d-flex align-center">
            <div style="width: 48px; height: 48px; border-radius: 10px; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; margin-left: 12px;">
              <PhClockCounterClockwise :size="24" weight="bold" color="white" />
            </div>
            <div>
              <h3 class="text-h6 font-weight-bold text-white mb-1">
                سجل الحركات
              </h3>
              <p class="text-body-2 text-white mb-0" style="opacity: 0.9;">
                {{ viewingItem.ingredientName }}
              </p>
            </div>
          </div>
        </div>

        <v-card-text class="pa-6" style="max-height: 500px; background: var(--t-surface);">
          <v-data-table
            :headers="transactionHeaders"
            :items="transactions"
            :items-per-page="15"
            :loading="loading.transactions"
            class="elevation-0"
          >
            <template v-slot:item.transactionType="{ item }">
              <v-chip :color="getTransactionColor(item.transactionType)" size="small" variant="flat">
                <template v-slot:prepend>
                  <v-icon size="16">{{ getTransactionIcon(item.transactionType) }}</v-icon>
                </template>
                {{ getTransactionText(item.transactionType, item.notes) }}
              </v-chip>
            </template>

            <template v-slot:item.quantity="{ item }">
              <span 
                :class="item.quantity > 0 ? 'text-success font-weight-bold' : 'text-error font-weight-bold'"
                class="text-h6"
              >
                {{ item.quantity > 0 ? '+' : '' }}{{ item.quantity }} {{ viewingItem.unit }}
              </span>
            </template>

            <template v-slot:item.totalCost="{ item }">
              <span class="font-weight-bold" style="color: #046375;">
                {{ item.totalCost ? Number(item.totalCost).toLocaleString() + ' د.ع' : '-' }}
              </span>
            </template>

            <template v-slot:item.transactionDate="{ item }">
              <div class="text-caption">
                {{ formatDateTime(item.transactionDate) }}
              </div>
            </template>

            <template v-slot:item.notes="{ item }">
              <div class="text-caption text-grey">
                {{ item.notes || '-' }}
              </div>
            </template>
          </v-data-table>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4" style="background: var(--t-surface-high);">
          <v-spacer />
          <v-btn 
            @click="showTransactionsDialog = false"
            variant="flat"
            size="large"
            color="#046375"
            style="border-radius: 8px;"
          >
            <PhCheckCircle :size="20" weight="bold" class="ml-1" />
            إغلاق
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { inventoryAPI } from '@/services/api'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'
import { formatDateTime, formatCurrentDateArabic } from '@/utils/dateFormatter'
import logoImg from '@/assets/logo.png'
import AppLayout from '@/components/AppLayout.vue'
import {
  PhPlus, PhMagnifyingGlass, PhPencilSimple, PhTrash,
  PhPlusMinus, PhClockCounterClockwise, PhPackage, PhCube, PhWarning,
  PhCheckCircle, PhCoins, PhStack, PhX, PhFloppyDisk,
  PhDotsThreeVertical, PhDownload, PhPrinter, PhArrowClockwise, PhArrowDown
} from '@phosphor-icons/vue'

const toast = useToast()
const authStore = useAuthStore()
// DELETE /inventory/:id is admin-only on the backend
const isAdmin = computed(() => authStore.user?.role === 'admin')

const currentDate = computed(() => {
  return formatCurrentDateArabic()
})

const ingredients = ref([])
const transactions = ref([])
const selectedTab = ref('all')
const search = ref('')
const showAddDialog = ref(false)
const showAdjustDialog = ref(false)
const showPullMaterialDialog = ref(false)
const showTransactionsDialog = ref(false)
const editingItem = ref(null)
const adjustingItem = ref(null)
const pullingItem = ref(null)
const viewingItem = ref(null)
const saving = ref(false)
const loading = ref({
  ingredients: false,
  transactions: false
})

const ingredientForm = ref({
  ingredientName: '',
  unit: '',
  currentStock: 0,
  minStock: 0,
  maxStock: 0,
  costPerUnit: 0,
  notes: '',
  isActive: true
})

const adjustForm = ref({
  transactionType: 'waste',
  quantity: 0,
  costPerUnit: null,
  notes: ''
})

const pullForm = ref({
  quantity: 0,
  notes: ''
})

const units = [
  { value: 'kg', title: 'كيلوغرام (kg)' },
  { value: 'gram', title: 'غرام (g)' },
  { value: 'liter', title: 'لتر (L)' },
  { value: 'ml', title: 'ملليلتر (ml)' },
  { value: 'piece', title: 'قطعة' },
  { value: 'box', title: 'علبة' },
  { value: 'bag', title: 'كيس' }
]

// Backend accepts usage / waste / adjustment only (purchases go through receiving)
const transactionTypes = [
  { value: 'waste', title: '🗑️ هدر (إتلاف)' },
  { value: 'adjustment', title: '⚙️ تسوية (جرد) — موجب للإضافة، سالب للخصم' }
]

const headers = [
  { title: 'المكون', key: 'ingredientName', width: '25%' },
  { title: 'المخزون', key: 'currentStock', align: 'center', width: '20%' },
  { title: 'الحد الأدنى', key: 'minStock', align: 'center' },
  { title: 'الحد الأقصى', key: 'maxStock', align: 'center' },
  { title: 'التكلفة/وحدة', key: 'costPerUnit', align: 'center' },
  { title: 'القيمة الإجمالية', key: 'totalValue', align: 'center' },
  { title: 'إجراءات', key: 'actions', sortable: false, align: 'center' }
]

const transactionHeaders = [
  { title: 'النوع', key: 'transactionType' },
  { title: 'الكمية', key: 'quantity' },
  { title: 'التكلفة', key: 'totalCost' },
  { title: 'التاريخ', key: 'transactionDate' },
  { title: 'ملاحظات', key: 'notes' }
]

const rules = {
  required: value => !!value || 'مطلوب'
}

// Computed
const filteredIngredients = computed(() => {
  let filtered = ingredients.value
  
  if (selectedTab.value === 'low') {
    filtered = filtered.filter(i => i.currentStock <= i.minStock)
  }
  
  return filtered
})

const lowStockCount = computed(() => 
  ingredients.value.filter(i => i.currentStock <= i.minStock).length
)

const goodStockCount = computed(() => 
  ingredients.value.filter(i => i.currentStock > i.minStock).length
)

const totalValue = computed(() => {
  return ingredients.value.reduce((sum, item) => {
    return sum + (Number(item.currentStock) * Number(item.costPerUnit))
  }, 0)
})

const newStockAmount = computed(() => {
  if (!adjustingItem.value || !adjustForm.value.quantity) return 0
  
  const current = Number(adjustingItem.value.currentStock)
  const adjust = Number(adjustForm.value.quantity)
  const type = adjustForm.value.transactionType
  
  // Purchase → ADD (+)
  if (type === 'purchase') {
    return current + Math.abs(adjust)
  } 
  // Usage, Waste → SUBTRACT (-)
  else if (type === 'usage' || type === 'waste') {
    return current - Math.abs(adjust)
  }
  // Adjustment → can be + or -
  else {
    return current + adjust
  }
})

const newStockAfterPull = computed(() => {
  if (!pullingItem.value || !pullForm.value.quantity) {
    return pullingItem.value ? Number(pullingItem.value.currentStock) : 0
  }
  const current = Number(pullingItem.value.currentStock)
  const pull = Number(pullForm.value.quantity) || 0
  return current - pull
})

const quantityHint = computed(() => {
  const type = adjustForm.value.transactionType
  if (type === 'purchase') return '📥 إضافة للمخزون - أدخل الكمية المضافة'
  if (type === 'usage') return '📤 استخدام عادي - سيتم الخصم من المخزون'
  if (type === 'waste') return '🗑️ هدر/تلف - سيتم الخصم من المخزون'
  if (type === 'adjustment') return '⚙️ تعديل يدوي - موجب للإضافة، سالب للخصم'
  return 'أدخل الكمية'
})

// Methods
const getStockColor = (item) => {
  if (item.currentStock <= item.minStock) return 'error'
  if (item.currentStock <= item.minStock * 1.5) return 'warning'
  return 'success'
}

const getStockPercentage = (item) => {
  if (item.maxStock === 0) return 0
  return (item.currentStock / item.maxStock) * 100
}

const getTransactionColor = (type) => {
  const colors = {
    purchase: 'success',
    usage: 'warning',
    adjustment: 'info',
    waste: 'error'
  }
  return colors[type] || 'grey'
}

const getTransactionIcon = (type) => {
  const icons = {
    purchase: 'mdi-plus-circle',
    usage: 'mdi-minus-circle',
    adjustment: 'mdi-cog',
    waste: 'mdi-delete'
  }
  return icons[type] || 'mdi-help'
}

const getTransactionIconColor = (type) => {
  const colors = {
    purchase: 'success',
    usage: 'warning',
    adjustment: 'info',
    waste: 'error'
  }
  return colors[type] || 'grey'
}

const getTransactionText = (type, notes = '') => {
  const texts = {
    purchase: 'شراء',
    usage: notes && notes.includes('سحب مادة') ? 'سحب' : 'استخدام',
    adjustment: 'تعديل',
    waste: 'هدر'
  }
  return texts[type] || type
}

const loadIngredients = async () => {
  loading.value.ingredients = true
  try {
    const response = await inventoryAPI.getAll()
    ingredients.value = response.data
  } catch (error) {
    toast.error('فشل تحميل المكونات')
    console.error(error)
  } finally {
    loading.value.ingredients = false
  }
}

const openAddDialog = () => {
  resetForm()
  showAddDialog.value = true
}

const closeAddDialog = () => {
  showAddDialog.value = false
  resetForm()
}

const editIngredient = (item) => {
  editingItem.value = item
  ingredientForm.value = { ...item }
  showAddDialog.value = true
}

const saveIngredient = async () => {
  if (!ingredientForm.value.ingredientName || !ingredientForm.value.unit) {
    toast.error('اسم المكون والوحدة مطلوبان')
    return
  }

  saving.value = true
  try {
    if (editingItem.value) {
      await inventoryAPI.update(editingItem.value.idIngredient, ingredientForm.value)
      toast.success('✅ تم تحديث المكون بنجاح')
    } else {
      await inventoryAPI.create(ingredientForm.value)
      toast.success('✅ تم إضافة المكون بنجاح')
    }
    await loadIngredients()
    closeAddDialog()
  } catch (error) {
    toast.error(error.response?.data?.message || 'فشل حفظ المكون')
    console.error(error)
  } finally {
    saving.value = false
  }
}

const pullMaterial = (item) => {
  pullingItem.value = item
  pullForm.value = {
    quantity: 0,
    notes: ''
  }
  showPullMaterialDialog.value = true
}

const savePullMaterial = async () => {
  if (!pullForm.value.quantity || pullForm.value.quantity <= 0) {
    toast.error('الكمية مطلوبة')
    return
  }

  if (pullForm.value.quantity > pullingItem.value.currentStock) {
    toast.error('الكمية المسحوبة أكبر من المخزون المتاح')
    return
  }

  saving.value = true
  try {
    const data = {
      transactionType: 'usage',
      quantity: -Math.abs(Number(pullForm.value.quantity)), // Negative for deduction
      notes: pullForm.value.notes || `سحب مادة: ${pullForm.value.quantity} ${pullingItem.value.unit}`
    }
    
    await inventoryAPI.adjustStock(pullingItem.value.idIngredient, data)
    toast.success('✅ تم سحب المادة بنجاح')
    await loadIngredients()
    showPullMaterialDialog.value = false
    pullForm.value = { quantity: 0, notes: '' }
  } catch (error) {
    toast.error(error.response?.data?.message || 'فشل سحب المادة')
    console.error(error)
  } finally {
    saving.value = false
  }
}

const adjustStock = (item) => {
  adjustingItem.value = item
  adjustForm.value = {
    transactionType: 'waste',
    quantity: 0,
    costPerUnit: null,
    notes: ''
  }
  showAdjustDialog.value = true
}

const saveAdjustment = async () => {
  if (!adjustForm.value.quantity || adjustForm.value.quantity === 0) {
    toast.error('الكمية مطلوبة')
    return
  }
  if (newStockAmount.value < 0) {
    toast.error('لا يمكن أن يصبح المخزون أقل من صفر')
    return
  }

  saving.value = true
  try {
    // usage/waste always deduct; adjustment keeps its sign (+ adds, − removes)
    const raw = Number(adjustForm.value.quantity)
    const quantity = adjustForm.value.transactionType === 'adjustment' ? raw : -Math.abs(raw)

    // costPerUnit is optional: the backend falls back to the ingredient's average cost
    // and computes totalCost itself
    const cost = Number(adjustForm.value.costPerUnit)
    const data = {
      transactionType: adjustForm.value.transactionType,
      quantity: quantity,
      costPerUnit: cost > 0 ? cost : null,
      notes: adjustForm.value.notes
    }

    const response = await inventoryAPI.adjustStock(adjustingItem.value.idIngredient, data)
    const after = response?.data?.currentStock
    toast.success(after !== undefined
      ? `✅ تم تعديل المخزون — الرصيد الآن ${Number(after)} ${adjustingItem.value.unit}`
      : '✅ تم تعديل المخزون بنجاح')
    await loadIngredients()
    showAdjustDialog.value = false
  } catch (error) {
    toast.error(error.response?.data?.message || 'فشل تعديل المخزون')
    console.error(error)
  } finally {
    saving.value = false
  }
}

const viewTransactions = async (item) => {
  viewingItem.value = item
  loading.value.transactions = true
  try {
    const response = await inventoryAPI.getTransactions(item.idIngredient)
    transactions.value = response.data
    showTransactionsDialog.value = true
  } catch (error) {
    toast.error('فشل تحميل الحركات')
    console.error(error)
  } finally {
    loading.value.transactions = false
  }
}

const deleteIngredient = async (item) => {
  if (!confirm(`هل تريد حذف "${item.ingredientName}"؟`)) return

  try {
    await inventoryAPI.delete(item.idIngredient)
    toast.success('تم حذف المكون')
    await loadIngredients()
  } catch (error) {
    toast.error(error.response?.data?.message || 'فشل حذف المكون')
    console.error(error)
  }
}

const resetForm = () => {
  ingredientForm.value = {
    ingredientName: '',
    unit: '',
    currentStock: 0,
    minStock: 0,
    maxStock: 0,
    costPerUnit: 0,
    notes: '',
    isActive: true
  }
  editingItem.value = null
}

// Header Actions
const exportInventory = () => {
  toast.info('تصدير Excel - قريباً')
}

const printInventory = () => {
  toast.info('طباعة التقرير - قريباً')
}

const refreshInventory = async () => {
  await loadIngredients()
  toast.success('تم التحديث')
}

onMounted(() => {
  loadIngredients()
})
</script>

<style scoped>
.inventory-table :deep(.v-data-table__thead) {
  background: var(--t-surface-high);
}

.inventory-table :deep(.v-data-table__thead th) {
  color: var(--t-text-dim) !important;
  font-weight: 600 !important;
  font-size: 0.875rem !important;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.inventory-table :deep(.v-data-table__tbody tr) {
  border-bottom: 1px solid var(--t-border-subtle);
}

.inventory-table :deep(.v-data-table__tbody tr:hover) {
  background: var(--t-surface-high) !important;
}
</style>
