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
                    إدارة القائمة - الأصناف والتصنيفات
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
      <div class="mb-6 d-flex align-center justify-space-between flex-wrap">
        <div class="d-flex align-center ga-3">
          <!-- View Toggle -->
          <v-btn-toggle 
            v-model="viewMode" 
            mandatory 
            variant="outlined"
            density="compact"
            style="border: 1px solid var(--t-border); border-radius: 10px;"
          >
            <v-btn 
              value="grid" 
              size="small"
              style="border-radius: 8px 0 0 8px;"
            >
              <PhGridFour :size="18" weight="bold" class="ml-2" />
              شبكة
            </v-btn>
            <v-btn 
              value="table" 
              size="small"
              style="border-radius: 0 8px 8px 0;"
            >
              <PhList :size="18" weight="bold" class="ml-2" />
              قائمة
            </v-btn>
          </v-btn-toggle>
          
          <!-- Add Button -->
          <v-btn 
            @click="openAddItemDialog"
            size="large"
            style="background: #046375; color: white; border-radius: 10px; text-transform: none; font-weight: 600;"
            elevation="0"
          >
            <template v-slot:prepend>
              <PhPlus :size="20" weight="bold" />
            </template>
            إضافة صنف جديد
          </v-btn>
        </div>
      </div>
      <!-- Tabs -->
      <v-card class="mb-4" elevation="0" style="border-radius: 12px; background: var(--t-surface); border: 1px solid var(--t-border);">
        <v-tabs v-model="selectedTab" color="#046375" grow>
          <v-tab value="items" style="text-transform: none; font-weight: 600;">
            <PhForkKnife :size="20" weight="bold" class="ml-2" />
            الأصناف ({{ menuItems.length }})
          </v-tab>
          <v-tab value="categories" style="text-transform: none; font-weight: 600;">
            <PhStack :size="20" weight="bold" class="ml-2" />
            التصنيفات ({{ categories.length }})
          </v-tab>
        </v-tabs>
      </v-card>

        <!-- Items Tab -->
        <v-window v-model="selectedTab">
          <v-window-item value="items">
            <!-- Filters -->
            <v-card class="mb-4" elevation="0" style="border-radius: 12px; background: var(--t-surface); border: 1px solid var(--t-border);">
              <v-card-text class="pa-4">
                <v-row>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="search"
                      label="بحث عن صنف..."
                      single-line
                      hide-details
                      variant="outlined"
                      density="comfortable"
                      clearable
                      style="border-radius: 10px;"
                    >
                      <template v-slot:prepend-inner>
                        <PhMagnifyingGlass :size="20" weight="bold" color="#6B7280" />
                      </template>
                    </v-text-field>
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-select
                      v-model="filterCategory"
                      :items="categoryFilterOptions"
                      label="تصفية حسب التصنيف"
                      variant="outlined"
                      density="comfortable"
                      hide-details
                      style="border-radius: 10px;"
                      clearable
                    >
                      <template v-slot:prepend-inner>
                        <PhFolder :size="20" weight="bold" color="#6B7280" />
                      </template>
                    </v-select>
                  </v-col>
                  <v-col cols="12" md="2">
                    <v-select
                      v-model="filterAvailability"
                      :items="availabilityOptions"
                      label="الحالة"
                      variant="outlined"
                      density="comfortable"
                      hide-details
                      style="border-radius: 10px;"
                      clearable
                    />
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <!-- Grid View -->
            <div v-if="viewMode === 'grid'">
              <v-row v-if="filteredMenuItems.length > 0">
                <v-col
                  v-for="item in filteredMenuItems"
                  :key="item.idMenuItem"
                  cols="12"
                  sm="6"
                  md="3"
                  lg="3"
                >
                  <v-card
                    class="menu-item-card"
                    elevation="0"
                    style="border-radius: 12px; background: var(--t-surface); border: 1px solid var(--t-border); overflow: hidden; transition: all 0.3s ease;"
                    :class="{ 'unavailable': !item.isAvailable }"
                  >
                    <!-- Image -->
                    <div class="image-container">
                      <v-img
                        :src="defaultMenuItemImage"
                        height="140"
                        cover
                        class="rounded-t-xl"
                      >
                        <template v-slot:placeholder>
                          <div class="d-flex align-center justify-center fill-height">
                            <v-progress-circular indeterminate color="primary" />
                          </div>
                        </template>
                      </v-img>
                      
                      <!-- Availability Badge -->
                      <v-chip
                        :color="item.isAvailable ? 'success' : 'error'"
                        size="small"
                        variant="flat"
                        class="availability-badge"
                        style="font-weight: 600; background: rgba(16, 185, 129, 0.9) !important; color: white !important;"
                        :style="item.isAvailable ? 'background: #10B981 !important; color: white !important; font-weight: 600;' : 'background: #DC2626 !important; color: white !important; font-weight: 600;'"
                      >
                        {{ item.isAvailable ? 'متوفر' : 'غير متوفر' }}
                      </v-chip>
                    </div>

                    <v-card-text class="pa-3">
                      <!-- Category Badge -->
                      <v-chip size="x-small" color="primary" variant="tonal" class="mb-1">
                        {{ item.categoryName }}
                      </v-chip>

                      <!-- Item Name -->
                      <h3 class="text-subtitle-1 font-weight-bold mb-1" style="line-height: 1.2;">
                        {{ item.itemName }}
                      </h3>
                      
                      <!-- Description -->
                      <p class="text-caption text-grey-darken-1 mb-2" style="min-height: 32px; font-size: 0.7rem; line-height: 1.3;">
                        {{ item.description || 'لا يوجد وصف' }}
                      </p>

                      <!-- Price & Time -->
                      <div class="d-flex align-center justify-space-between mb-2">
                        <div class="d-flex align-center">
                          <span class="text-subtitle-2 font-weight-bold" style="color: #046375;">
                            {{ Number(item.basePrice).toLocaleString() }} د.ع
                          </span>
                        </div>
                        <div class="d-flex align-center">
                          <PhClock :size="14" weight="regular" color="#6B7280" class="ml-1" />
                          <span class="text-caption" style="color: var(--t-text-dim); font-size: 0.7rem;">{{ item.preparationTime }}د</span>
                        </div>
                      </div>

                      <!-- Item Type Badge -->
                      <v-chip
                        v-if="item.itemType"
                        size="x-small"
                        :color="item.itemType === 'recipe' ? 'info' : 'warning'"
                        variant="tonal"
                        style="font-size: 0.65rem;"
                      >
                        {{ item.itemType === 'recipe' ? '📝 وصفة' : '🎨 هارموني' }}
                      </v-chip>
                    </v-card-text>

                    <v-divider />

                    <!-- Actions -->
                    <v-card-actions class="pa-3" style="background: var(--t-surface-high); border-top: 1px solid #E5E7EB;">
                      <v-btn
                        size="small"
                        variant="flat"
                        @click="editItem(item)"
                        style="background: #046375; color: white; border-radius: 8px; text-transform: none; font-weight: 500; flex: 1;"
                        elevation="0"
                      >
                        <PhPencilSimple :size="16" weight="bold" class="ml-1" />
                        <span style="font-size: 0.75rem;">تعديل</span>
                      </v-btn>

                      <v-btn
                        icon
                        size="small"
                        variant="text"
                        @click="deleteItem(item)"
                        style="color: #DC2626;"
                        :aria-label="`حذف ${item.itemName}`"
                        :title="`حذف ${item.itemName}`"
                      >
                        <PhTrash :size="16" weight="bold" />
                      </v-btn>
                    </v-card-actions>
                  </v-card>
                </v-col>
              </v-row>

              <!-- Empty State -->
              <v-card v-else elevation="0" style="border-radius: 12px; background: var(--t-surface); border: 1px solid var(--t-border);" class="pa-12">
                <div class="d-flex flex-column align-center justify-center">
                  <PhForkKnife :size="64" weight="thin" color="#D1D5DB" class="mb-4" />
                  <h3 class="text-h6 mb-2" style="color: var(--t-text); font-weight: 600;">لا توجد أصناف</h3>
                  <p class="text-body-2 mb-4" style="color: var(--t-text-dim);">ابدأ بإضافة الأصناف إلى القائمة</p>
                  <v-btn 
                    style="background: #046375; color: white; border-radius: 10px; text-transform: none; font-weight: 600;"
                    elevation="0"
                    @click="openAddItemDialog"
                  >
                    <template v-slot:prepend>
                      <PhPlus :size="20" weight="bold" />
                    </template>
                    إضافة صنف جديد
                  </v-btn>
                </div>
              </v-card>
            </div>

            <!-- Table View -->
            <v-card v-else elevation="0" style="border-radius: 12px; background: var(--t-surface); border: 1px solid var(--t-border);">
              <v-data-table
                :headers="itemHeaders"
                :items="filteredMenuItems"
                :search="search"
                :loading="loading.menuItems"
                :items-per-page="15"
                class="elevation-0"
                style="background: transparent;"
              >
                <template v-slot:item.imageUrl="{ item }">
                  <v-avatar size="50" rounded class="my-2">
                    <v-img :src="item.imageUrl || defaultMenuItemImage" cover />
                  </v-avatar>
                </template>

                <template v-slot:item.itemName="{ item }">
                  <div>
                    <div class="font-weight-bold">{{ item.itemName }}</div>
                    <div class="text-caption text-grey">{{ item.description }}</div>
                  </div>
                </template>

                <template v-slot:item.categoryName="{ item }">
                  <v-chip size="small" style="background: rgba(4, 99, 117,0.12); color: #1F7F90; font-weight: 500;" variant="flat">
                    {{ item.categoryName }}
                  </v-chip>
                </template>

            <template v-slot:item.basePrice="{ item }">
                  <span class="font-weight-bold" style="color: #046375;">
                    {{ Number(item.basePrice).toLocaleString() }} د.ع
                  </span>
            </template>

                <template v-slot:item.preparationTime="{ item }">
                  <v-chip size="small" variant="tonal">
                    <PhClock :size="14" weight="bold" class="ml-1" />
                    {{ item.preparationTime }}د
                  </v-chip>
                </template>

                <template v-slot:item.itemType="{ item }">
                  <v-chip
                    size="small"
                    :color="item.itemType === 'recipe' ? 'info' : 'warning'"
                    variant="tonal"
                  >
                    {{ item.itemType === 'recipe' ? 'وصفة' : 'هارموني' }}
                  </v-chip>
                </template>

                <template v-slot:item.isAvailable="{ item }">
                  <v-switch
                    :model-value="Boolean(item.isAvailable)"
                    @update:model-value="toggleAvailability(item)"
                    color="success"
                    hide-details
                    density="compact"
                  />
                </template>

                <template v-slot:item.actions="{ item }">
                  <v-btn
                    size="small"
                    variant="elevated"
                    color="primary"
                    @click="editItem(item)"
                    class="ml-2"
                  >
                    <PhPencilSimple :size="18" weight="bold" class="ml-1" />
                    تعديل
                  </v-btn>
                  <v-btn
                    icon
                    size="small"
                    variant="text"
                    color="error"
                    @click="deleteItem(item)"
                    :aria-label="`حذف ${item.itemName}`"
                    :title="`حذف ${item.itemName}`"
                  >
                    <PhTrash :size="18" weight="bold" />
                  </v-btn>
                </template>
              </v-data-table>
            </v-card>
          </v-window-item>

          <!-- Categories Tab -->
          <v-window-item value="categories">
            <v-card elevation="0" style="border-radius: 12px; background: var(--t-surface); border: 1px solid var(--t-border);">
              <v-card-title class="d-flex align-center justify-space-between pa-5">
                <h3 class="text-h6 font-weight-bold mb-0" style="color: #046375;">التصنيفات</h3>
                <v-btn 
                  style="background: #046375; color: white; border-radius: 10px; text-transform: none; font-weight: 600;"
                  elevation="0"
                  @click="openAddCategoryDialog"
                >
                  <template v-slot:prepend>
                    <PhPlus :size="20" weight="bold" />
                  </template>
                  إضافة تصنيف
                </v-btn>
              </v-card-title>

              <v-data-table
                :headers="categoryHeaders"
                :items="categories"
                :items-per-page="10"
                :loading="loading.categories"
                class="elevation-0"
              >
                <template v-slot:item.categoryName="{ item }">
                  <div class="d-flex align-center">
                    <v-avatar size="40" color="primary" class="ml-2">
                      <span class="text-h6">{{ item.categoryName.charAt(0) }}</span>
                    </v-avatar>
                    <div>
                      <div class="font-weight-bold">{{ item.categoryName }}</div>
                      <div class="text-caption text-grey">{{ item.description }}</div>
                    </div>
                  </div>
                </template>

                <template v-slot:item.displayOrder="{ item }">
                  <v-chip size="small" variant="tonal">
                    #{{ item.displayOrder }}
                  </v-chip>
                </template>

                <template v-slot:item.isActive="{ item }">
                  <v-chip :color="item.isActive ? 'success' : 'error'" size="small">
                    {{ item.isActive ? 'نشط' : 'غير نشط' }}
                  </v-chip>
                </template>

                <template v-slot:item.actions="{ item }">
                  <v-btn
                    icon
                    size="small"
                    variant="text"
                    color="primary"
                    @click="editCategory(item)"
                    :aria-label="`تعديل التصنيف ${item.categoryName}`"
                    :title="`تعديل التصنيف ${item.categoryName}`"
                  >
                    <PhPencilSimple :size="18" weight="bold" />
                  </v-btn>
                  <v-btn
                    icon
                    size="small"
                    variant="text"
                    color="error"
                    @click="deleteCategory(item)"
                    :aria-label="`حذف التصنيف ${item.categoryName}`"
                    :title="`حذف التصنيف ${item.categoryName}`"
                  >
                    <PhTrash :size="18" weight="bold" />
                  </v-btn>
                </template>
              </v-data-table>
            </v-card>
          </v-window-item>
        </v-window>
    </v-container>

    <!-- Add/Edit Item Dialog -->
    <v-dialog v-model="showAddDialog" max-width="1100" persistent scrollable>
      <v-card style="border-radius: 16px; overflow: hidden;" elevation="0">
        <!-- Header -->
        <div style="background: #046375; padding: 24px;">
          <div class="d-flex align-center">
            <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; margin-left: 12px;">
              <PhForkKnife :size="24" weight="bold" color="white" />
            </div>
            <div>
              <div class="text-h5 font-weight-bold text-white mb-1">
                {{ editingItem ? 'تعديل الصنف' : 'إضافة صنف جديد' }}
              </div>
              <div class="text-caption text-white" style="opacity: 0.9;">
                {{ editingItem ? 'المعلومات، الأحجام، والوصفة' : 'أضف صنف جديد مع كامل التفاصيل' }}
              </div>
            </div>
          </div>
        </div>

        <!-- Tabs for sections -->
        <v-tabs v-model="itemDialogTab" bg-color="white" color="#046375" grow class="px-4">
          <v-tab value="info">
            <PhInfo :size="20" weight="bold" class="ml-2" />
            المعلومات
          </v-tab>
          <v-tab value="sizes" :disabled="!editingItem">
            <PhResize :size="20" weight="bold" class="ml-2" />
            الأحجام
          </v-tab>
          <v-tab value="recipe" :disabled="!editingItem">
            <PhCookingPot :size="20" weight="bold" class="ml-2" />
            الوصفة
          </v-tab>
        </v-tabs>

        <v-divider />

        <v-card-text class="pa-6" style="min-height: 500px; max-height: 600px; overflow-y: auto;">
          <v-window v-model="itemDialogTab">
            <!-- Tab 1: Basic Info -->
            <v-window-item value="info">
          <v-row>
            <!-- Image Upload Section -->
            <v-col cols="12" md="4">
              <div class="image-upload-section">
                <div class="image-preview-container">
                  <v-avatar v-if="imagePreview" size="200" rounded="xl" class="image-preview">
                    <v-img :src="imagePreview" cover />
                  </v-avatar>
                  <div v-else class="image-placeholder">
                    <PhImage :size="70" weight="thin" color="#CCCCCC" />
                    <p class="text-body-2 text-grey mt-3 mb-0">صورة الصنف</p>
                  </div>
                </div>
                
                <v-file-input
                  v-model="itemForm.imageFile"
                  accept="image/*"
                  variant="outlined"
                  density="comfortable"
                  prepend-icon=""
                  @update:model-value="onImageSelect"
                  hide-details
                  class="mt-4"
                  rounded
                >
                  <template v-slot:prepend>
                    <PhCamera :size="20" weight="bold" color="#046375" />
                  </template>
                  <template v-slot:label>
                    <span style="color: #046375;">📸 اختر صورة</span>
                  </template>
                </v-file-input>
              </div>
            </v-col>

            <!-- Form Fields -->
            <v-col cols="12" md="8">
              <v-row>
                <v-col cols="12">
                  <div class="form-section-title">
                    <PhInfo :size="18" weight="bold" color="#046375" class="ml-1" />
                    <span>المعلومات الأساسية</span>
                  </div>
                </v-col>
                
                <v-col cols="12" md="8">
              <v-text-field
                v-model="itemForm.itemName"
                label="اسم الصنف"
                    placeholder="مثال: كابتشينو، لاتيه، موكا"
                variant="outlined"
                    density="comfortable"
                :rules="[rules.required]"
                    color="primary"
                  >
                    <template v-slot:prepend-inner>
                      <PhTag :size="20" color="#046375" />
                    </template>
                  </v-text-field>
            </v-col>
                
                <v-col cols="12" md="4">
              <v-select
                v-model="itemForm.categoryId"
                :items="categories"
                item-title="categoryName"
                item-value="idCategory"
                label="التصنيف"
                variant="outlined"
                    density="comfortable"
                :rules="[rules.required]"
                    color="primary"
                  >
                    <template v-slot:prepend-inner>
                      <PhFolder :size="20" color="#046375" />
                    </template>
                  </v-select>
            </v-col>

            <v-col cols="12">
              <v-textarea
                v-model="itemForm.description"
                label="الوصف"
                    placeholder="وصف مختصر عن الصنف..."
                variant="outlined"
                    density="comfortable"
                    rows="3"
                    counter="200"
                    color="primary"
                  >
                    <template v-slot:prepend-inner>
                      <PhNotePencil :size="20" color="#046375" />
                    </template>
                  </v-textarea>
            </v-col>

                <v-col cols="12">
                  <div class="form-section-title">
                    <PhCurrencyDollar :size="18" weight="bold" color="#046375" class="ml-1" />
                    <span>السعر والتفاصيل</span>
                  </div>
                </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="itemForm.basePrice"
                    label="السعر الأساسي"
                type="number"
                    step="1000"
                    suffix="د.ع"
                variant="outlined"
                    density="comfortable"
                :rules="[rules.required]"
                    color="primary"
                  >
                    <template v-slot:prepend-inner>
                      <PhCoins :size="20" color="#046375" />
                    </template>
                  </v-text-field>
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="itemForm.preparationTime"
                    label="وقت التحضير"
                type="number"
                    suffix="دقيقة"
                variant="outlined"
                    density="comfortable"
                    color="primary"
                  >
                    <template v-slot:prepend-inner>
                      <PhTimer :size="20" color="#046375" />
                    </template>
                  </v-text-field>
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="itemForm.calories"
                    label="السعرات الحرارية"
                type="number"
                    suffix="سعرة"
                variant="outlined"
                    density="comfortable"
                    color="primary"
                  >
                    <template v-slot:prepend-inner>
                      <PhFire :size="20" color="#046375" />
                    </template>
                  </v-text-field>
            </v-col>

            <v-col cols="12">
                  <v-card variant="tonal" color="success" class="pa-3">
                    <v-checkbox
                      v-model="itemForm.isAvailable"
                      label="متوفر للطلب الآن"
                      color="success"
                      hide-details
                      density="comfortable"
              >
                <template v-slot:prepend>
                        <PhCheckCircle :size="24" weight="bold" />
                </template>
                    </v-checkbox>
              </v-card>
            </v-col>
              </v-row>
            </v-col>
          </v-row>
            </v-window-item>

            <!-- Tab 2: Sizes -->
            <v-window-item value="sizes">
              <v-alert type="info" variant="tonal" class="mb-4">
                أضف أحجام مختلفة لهذا الصنف (صغير، وسط، كبير). كل حجم له سعر مختلف ووصفة مختلفة.
              </v-alert>

          <!-- Add New Size Form -->
              <v-card elevation="2" class="pa-4 mb-5" rounded="lg" style="background: var(--t-surface);border: 2px solid #FF6F00;">
                <div class="text-h6 font-weight-bold mb-4" style="color: #FF6F00;">
                  ➕ إضافة حجم جديد
                </div>
            <v-row>   
              <v-col cols="12" md="5">
                <v-select
                  v-model="sizeForm.sizeName"
                  label="اسم الحجم"
                  :items="sizeOptions"
                  variant="outlined"
                  density="comfortable"
                  color="orange"
                  :rules="[rules.required]"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model.number="sizeForm.actualPrice"
                  label="السعر"
                  type="number"
                      step="1000"
                      suffix="د.ع"
                  variant="outlined"
                      density="comfortable"
                      hint="السعر الفعلي لهذا الحجم"
                      persistent-hint
                      color="orange"
                />
              </v-col>
              <v-col cols="12" md="3" class="d-flex align-center">
                <v-btn
                      color="orange"
                  @click="saveSize"
                  :loading="saving"
                  block
                      size="large"
                      elevation="2"
                >
                      <PhPlus :size="20" weight="bold" class="ml-1" />
                  إضافة
                </v-btn>
              </v-col>
            </v-row>
          </v-card>

          <!-- Existing Sizes List -->
              <div class="text-h6 font-weight-bold mb-3">📏 الأحجام الحالية</div>
              
              <div v-if="itemSizes.length > 0">
                <v-row>
                  <v-col
                    v-for="size in itemSizes"
                    :key="size.idItemSize"
                    cols="12"
                    md="6"
                  >
                    <v-card elevation="2" rounded="lg" class="pa-4" style="border: 2px solid #f0f0f0;">
                      <div class="d-flex align-center justify-space-between">
                        <div>
                          <div class="text-h6 font-weight-bold mb-1">{{ size.sizeName }}</div>
                          <div class="text-body-2 mb-1">
                            <span class="text-grey">السعر:</span>
                            <span class="font-weight-bold ml-2" style="color: #046375;">
                              {{ (Number(selectedMenuItem.basePrice) + Number(size.priceAdjustment)).toLocaleString() }} د.ع
                            </span>
                          </div>
                          <v-chip
                            size="small"
                            color="primary"
                            variant="tonal"
                          >
                            السعر الأساسي: {{ Number(selectedMenuItem.basePrice).toLocaleString() }} د.ع
                  </v-chip>
                        </div>
                  <v-btn
                    icon
                    size="small"
                    variant="text"
                    color="error"
                    @click="deleteSize(size)"
                    :aria-label="`إيقاف الحجم ${size.sizeName}`"
                    :title="`إيقاف الحجم ${size.sizeName}`"
                        >
                          <PhTrash :size="20" weight="bold" />
                        </v-btn>
                      </div>
                    </v-card>
                  </v-col>
                </v-row>
              </div>
              
              <v-card v-else elevation="0" class="pa-8 text-center" style="background: var(--t-surface-high);">
                <PhResize :size="60" weight="thin" color="#CCCCCC" class="mb-3" />
                <p class="text-body-1 text-grey mb-2">لا توجد أحجام محددة</p>
                <p class="text-caption text-grey">
                  السعر الافتراضي: {{ Number(selectedMenuItem?.basePrice).toLocaleString() }} د.ع
                </p>
              </v-card>
            </v-window-item>

            <!-- Tab 3: Recipe Management (base recipe + optional per-size recipes) -->
            <v-window-item value="recipe">
              <v-alert type="info" variant="tonal" class="mb-4">
                <strong>💡 كيف تعمل الوصفة:</strong>
                الوصفة الأساسية تُستخدم لكل الأحجام. إذا أضفت وصفة خاصة لحجم معيّن تُستخدم بدلاً من الأساسية عند بيع هذا الحجم.
                <span v-if="itemSizes.length === 0">هذا الصنف بدون أحجام، لذلك تكفي الوصفة الأساسية.</span>
              </v-alert>

              <v-alert v-if="recipesDirty" type="warning" variant="tonal" density="compact" class="mb-4">
                لديك تغييرات غير محفوظة — اضغط "حفظ الوصفات" لحفظها.
              </v-alert>

              <!-- Recipe selector: base + sizes -->
              <v-card elevation="2" class="pa-4 mb-4" rounded="lg" style="background: #e8f5e9; border: 2px solid #84967A;">
                <div class="d-flex align-center ga-3 mb-3">
                  <PhResize :size="24" weight="bold" color="#84967A" />
                  <span class="text-h6 font-weight-bold" style="color: #84967A;">اختر الوصفة:</span>
                </div>
                <v-btn-toggle
                  v-model="selectedRecipeSize"
                  mandatory
                  color="success"
                  variant="outlined"
                  divided
                  rounded="lg"
                  style="flex-wrap: wrap; height: auto;"
                >
                  <v-btn :value="BASE_RECIPE_KEY" class="px-6" size="large">
                    <PhCookingPot :size="18" weight="bold" class="ml-2" />
                    {{ baseRecipeLabel }}
                    <v-chip size="x-small" class="mr-2" variant="tonal">{{ (allRecipes[BASE_RECIPE_KEY] || []).length }}</v-chip>
                  </v-btn>
                  <v-btn
                    v-for="size in itemSizes"
                    :key="size.idItemSize"
                    :value="size.idItemSize"
                    class="px-6"
                    size="large"
                  >
                    <PhResize :size="18" weight="bold" class="ml-2" />
                    {{ size.sizeName }}
                    <v-chip size="x-small" class="mr-2" variant="tonal">
                      {{ sizeHasOwnRecipe(size.idItemSize) ? allRecipes[size.idItemSize].length : 'أساسية' }}
                    </v-chip>
                  </v-btn>
                </v-btn-toggle>
                <p class="text-caption text-grey mt-3 mb-0">
                  <strong>الوصفة الحالية:</strong> {{ selectedRecipeLabel }}
                  <template v-if="!isBaseRecipeSelected">
                    (السعر: {{ selectedSizePrice.toLocaleString() }} د.ع)
                  </template>
                </p>
              </v-card>

              <!-- Add Ingredient Form -->
              <v-card elevation="2" class="pa-4 mb-5" rounded="lg" style="background: var(--t-surface-high);">
                <div class="text-h6 font-weight-bold mb-4">➕ إضافة مكون إلى {{ selectedRecipeLabel }}</div>
                <v-row>
                  <v-col cols="12" md="6">
                    <v-autocomplete
                      v-model="recipeForm.ingredientId"
                      :items="ingredients"
                      item-title="ingredientName"
                      item-value="idIngredient"
                      label="اختر المكون"
                      variant="outlined"
                      density="comfortable"
                      clearable
                      color="success"
                    >
                      <template v-slot:item="{ props, item }">
                        <v-list-item v-bind="props">
                          <template v-slot:subtitle>
                            المتوفر: {{ item.raw.currentStock }} {{ item.raw.unit }}
                          </template>
                        </v-list-item>
                      </template>
                    </v-autocomplete>
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model.number="recipeForm.quantityNeeded"
                      label="الكمية المطلوبة"
                      type="number"
                      step="0.01"
                      variant="outlined"
                      density="comfortable"
                      :suffix="recipeUnitDisplay"
                      :hint="unitConversionHint"
                      persistent-hint
                      color="success"
                    />
                  </v-col>
                  <v-col cols="12" md="2" class="d-flex align-center">
                    <v-btn
                      color="success"
                      @click="addRecipeIngredient"
                      :loading="saving"
                      block
                      size="large"
                      aria-label="إضافة المكون إلى الوصفة"
                      title="إضافة المكون إلى الوصفة"
                    >
                      <PhPlus :size="20" weight="bold" />
                    </v-btn>
                  </v-col>
                </v-row>
              </v-card>

              <!-- Current lines of the selected recipe -->
              <div class="text-h6 font-weight-bold mb-3">
                🍳 المكونات - {{ selectedRecipeLabel }}
              </div>

              <div v-if="currentSizeRecipe.length > 0">
                <v-list rounded="lg" elevation="1">
                  <v-list-item
                    v-for="(item, index) in currentSizeRecipe"
                    :key="index"
                    class="my-1"
                  >
                    <template v-slot:prepend>
                      <v-avatar color="success" size="40">
                        <PhPackage :size="20" weight="bold" color="white" />
                      </v-avatar>
                    </template>

                    <v-list-item-title class="font-weight-bold">
                      {{ item.ingredientName }}
                    </v-list-item-title>

                    <v-list-item-subtitle>
                      <v-chip size="small" color="success" variant="tonal" class="mt-1">
                        {{ item.quantityNeeded }} {{ item.unit }}
                      </v-chip>
                    </v-list-item-subtitle>

                    <template v-slot:append>
                      <v-btn
                        icon
                        size="small"
                        variant="text"
                        color="error"
                        @click="removeRecipeIngredient(index)"
                        :aria-label="`إزالة ${item.ingredientName} من الوصفة`"
                        :title="`إزالة ${item.ingredientName} من الوصفة`"
                      >
                        <PhTrash :size="18" weight="bold" />
                      </v-btn>
                    </template>
                  </v-list-item>
                </v-list>
              </div>

              <v-card v-else elevation="0" class="pa-8 text-center" style="background: var(--t-surface-high);">
                <PhCookingPot :size="60" weight="thin" color="#CCCCCC" class="mb-3" />
                <p class="text-body-1 text-grey">لا توجد مكونات في "{{ selectedRecipeLabel }}"</p>
                <p v-if="isBaseRecipeSelected" class="text-caption text-grey-darken-1">أضف المكونات المشتركة لكل الأحجام</p>
                <p v-else-if="hasBaseRecipe" class="text-caption text-grey-darken-1">هذا الحجم يستخدم الوصفة الأساسية — أضف مكونات هنا فقط إذا كان يحتاج وصفة مختلفة</p>
                <p v-else class="text-caption text-grey-darken-1">أضف المكونات المطلوبة لتحضير هذا الحجم، أو أضف وصفة أساسية لكل الأحجام</p>
              </v-card>

              <!-- Copy Recipe Helper -->
              <v-alert v-if="copyRecipeOptions.length > 0" type="info" variant="tonal" class="mt-4">
                <div class="d-flex align-center justify-space-between">
                  <span>💡 نسخ المكونات من وصفة أخرى؟</span>
                  <v-btn
                    size="small"
                    variant="outlined"
                    @click="showCopyRecipeDialog = true"
                    color="info"
                  >
                    نسخ وصفة
                  </v-btn>
                </div>
              </v-alert>
            </v-window-item>
          </v-window>
        </v-card-text>

        <v-divider />

        <!-- Beautiful Action Footer -->
        <div class="dialog-footer">
          <v-container fluid class="pa-5">
            <v-row align="center">
              <v-col cols="auto">
                <v-btn 
                  @click="closeAddDialog" 
                  variant="outlined" 
                  size="large"
                  style="border: 1px solid var(--t-border); color: var(--t-text-dim); border-radius: 10px; text-transform: none; font-weight: 600;"
                  class="px-4"
                >
                  <PhX :size="20" weight="bold" class="ml-1" />
                  إلغاء
                </v-btn>
              </v-col>
              
              <v-col>
                <!-- Tab Progress Indicator -->
                <v-row v-if="editingItem" class="mx-auto" style="max-width: 400px;" justify="center">
                  <v-col cols="4" class="text-center">
                    <div 
                      class="step-indicator"
                      :class="{ 'active': itemDialogTab === 'info', 'completed': itemDialogTab === 'sizes' || itemDialogTab === 'recipe' }"
                    >
                      <div class="step-circle">1</div>
                      <div class="step-label">المعلومات</div>
                    </div>
                  </v-col>
                  <v-col cols="4" class="text-center">
                    <div 
                      class="step-indicator"
                      :class="{ 'active': itemDialogTab === 'sizes', 'completed': itemDialogTab === 'recipe' }"
                    >
                      <div class="step-circle">2</div>
                      <div class="step-label">الأحجام</div>
                    </div>
                  </v-col>
                  <v-col cols="4" class="text-center">
                    <div 
                      class="step-indicator"
                      :class="{ 'active': itemDialogTab === 'recipe' }"
                    >
                      <div class="step-circle">3</div>
                      <div class="step-label">الوصفة</div>
                    </div>
                  </v-col>
                </v-row>
              </v-col>
              
              <v-col cols="auto">
                <div class="d-flex ga-3">
                  <!-- Navigation Buttons -->
                  <v-btn
                    v-if="editingItem && itemDialogTab === 'sizes'"
                    variant="outlined"
                    size="large"
                    @click="itemDialogTab = 'info'"
                    class="px-6"
                  >
                    <PhCaretRight :size="20" weight="bold" class="ml-1" />
                    السابق
                  </v-btn>
                  
                  <v-btn
                    v-if="editingItem && itemDialogTab === 'recipe'"
                    variant="outlined"
                    size="large"
                    @click="itemDialogTab = 'sizes'"
                    class="px-6"
                  >
                    <PhCaretRight :size="20" weight="bold" class="ml-1" />
                    السابق
                  </v-btn>
                  
                  <!-- Save/Next Buttons -->
                  <v-btn
                    v-if="itemDialogTab === 'info' && !editingItem"
                    @click="saveItem" 
                    :loading="saving" 
                    size="large"
                    style="background: #046375; color: white; border-radius: 10px; text-transform: none; font-weight: 600;"
                    elevation="0"
                    class="px-8"
                  >
                    <PhFloppyDisk :size="20" weight="bold" class="ml-2" />
                    حفظ وإضافة الأحجام
                  </v-btn>
                  
                  <!-- Save Changes Button (Edit Mode - Info Tab) -->
                  <v-btn
                    v-if="itemDialogTab === 'info' && editingItem"
                    @click="saveItemChanges" 
                    :loading="saving"
                    size="large"
                    style="background: #046375; color: white; border-radius: 10px; text-transform: none; font-weight: 600;"
                    elevation="0"
                    class="px-8 ml-2"
                  >
                    <PhFloppyDisk :size="20" weight="bold" class="ml-2" />
                    حفظ التعديلات
                  </v-btn>
                  
                  <v-btn
                    v-if="itemDialogTab === 'info' && editingItem"
                    @click="itemDialogTab = 'sizes'" 
                    size="large"
                    style="background: #F59E0B; color: white; border-radius: 10px; text-transform: none; font-weight: 600;"
                    elevation="0"
                    class="px-8"
                  >
                    التالي: الأحجام
                    <PhCaretLeft :size="20" weight="bold" class="mr-2" />
                  </v-btn>
                  
                  <v-btn
                    v-if="itemDialogTab === 'sizes'"
                    @click="itemDialogTab = 'recipe'" 
                    size="large"
                    style="background: var(--t-primary); color: white; border-radius: 10px; text-transform: none; font-weight: 600;"
                    elevation="0"
                    class="px-8"
                  >
                    التالي: الوصفة
                    <PhCaretLeft :size="20" weight="bold" class="mr-2" />
                  </v-btn>
                  
                  <v-btn 
                    v-if="itemDialogTab === 'recipe'"
                    @click="saveAllRecipes" 
                    :loading="saving" 
                    size="large"
                    style="background: #046375; color: white; border-radius: 10px; text-transform: none; font-weight: 600;"
                    elevation="0"
                    class="px-8"
                  >
                    <PhCheckCircle :size="20" weight="bold" class="ml-2" />
                    حفظ الوصفات
                  </v-btn>
                </div>
              </v-col>
            </v-row>
          </v-container>
        </div>
      </v-card>
    </v-dialog>

    <!-- Add/Edit Category Dialog -->
    <v-dialog v-model="showAddCategoryDialog" max-width="600" persistent>
      <v-card style="border-radius: 16px; overflow: hidden;" elevation="0">
        <!-- Header -->
        <div style="background: #046375; padding: 24px;">
          <div class="d-flex align-center">
            <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; margin-left: 12px;">
              <PhStack :size="24" weight="bold" color="white" />
            </div>
            <div>
              <div class="text-h5 font-weight-bold text-white mb-1">
                {{ editingCategory ? 'تعديل التصنيف' : 'إضافة تصنيف جديد' }}
              </div>
              <div class="text-caption text-white" style="opacity: 0.9;">
                {{ editingCategory ? 'قم بتحديث معلومات التصنيف' : 'أضف تصنيف جديد لتنظيم القائمة' }}
              </div>
            </div>
          </div>
        </div>

        <v-card-text class="pa-6">
          <v-text-field
            v-model="categoryForm.categoryName"
            label="اسم التصنيف"
            placeholder="مثال: مشروبات ساخنة، حلويات، وجبات"
            variant="outlined"
            density="comfortable"
            :rules="[rules.required]"
            class="mb-4"
            color="primary"
          >
            <template v-slot:prepend-inner>
              <PhFolder :size="20" color="#046375" />
            </template>
          </v-text-field>

          <v-textarea
            v-model="categoryForm.description"
            label="الوصف"
            placeholder="وصف مختصر عن التصنيف..."
            variant="outlined"
            density="comfortable"
            rows="3"
            class="mb-4"
            color="#046375"
          >
            <template v-slot:prepend-inner>
              <PhNotePencil :size="20" color="#046375" />
            </template>
          </v-textarea>

          <v-text-field
            v-model.number="categoryForm.displayOrder"
            label="ترتيب العرض"
            type="number"
            hint="الرقم الأصغر يظهر أولاً"
            persistent-hint
            variant="outlined"
            density="comfortable"
            class="mb-4"
            color="#046375"
          >
            <template v-slot:prepend-inner>
              <PhSortAscending :size="20" color="#046375" />
            </template>
          </v-text-field>

          <v-card style="background: #F0FDF4; border: 1px solid #D1FAE5; border-radius: 10px;" class="pa-3 mb-4">
            <v-checkbox
              v-model="categoryForm.isActive"
              label="تصنيف نشط"
              color="#10B981"
              hide-details
            >
              <template v-slot:prepend>
                <PhCheckCircle :size="24" weight="bold" color="#10B981" />
              </template>
            </v-checkbox>
          </v-card>

          <v-card 
            :style="categoryForm.isKitchen ? 'background: #FEF3C7; border: 1px solid #FDE68A;' : 'background: #DBEAFE; border: 1px solid #BFDBFE;'"
            style="border-radius: 10px;"
            class="pa-3"
          >
            <v-checkbox
              v-model="categoryForm.isKitchen"
              :label="categoryForm.isKitchen ? 'للمطبخ (طعام)' : 'للبار (مشروبات)'"
              :color="categoryForm.isKitchen ? '#F59E0B' : '#3B82F6'"
              hide-details
            >
              <template v-slot:prepend>
                <PhChefHat v-if="categoryForm.isKitchen" :size="24" weight="bold" color="#F59E0B" />
                <PhCoffee v-else :size="24" weight="bold" color="#3B82F6" />
              </template>
            </v-checkbox>
            <div class="text-caption mt-2" style="color: var(--t-text-dim);">
              {{ categoryForm.isKitchen 
                ? 'العناصر في هذا التصنيف ستظهر في شاشة المطبخ' 
                : 'العناصر في هذا التصنيف ستظهر في شاشة المشروبات' }}
            </div>
          </v-card>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-5" style="background: var(--t-surface-high); border-top: 1px solid #E5E7EB;">
          <v-btn 
            @click="closeAddCategoryDialog" 
            variant="outlined"
            size="large"
            style="border: 1px solid var(--t-border); color: var(--t-text-dim); border-radius: 10px; text-transform: none; font-weight: 600;"
          >
            <PhX :size="20" weight="bold" class="ml-1" />
            إلغاء
          </v-btn>
          <v-spacer />
          <v-btn 
            @click="saveCategory" 
            :loading="saving" 
            size="large"
            style="background: #046375; color: white; border-radius: 10px; text-transform: none; font-weight: 600;"
            elevation="0"
            class="px-8"
          >
            <PhFloppyDisk :size="20" weight="bold" class="ml-1" />
            حفظ التصنيف
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Copy Recipe Dialog -->
    <v-dialog v-model="showCopyRecipeDialog" max-width="500">
      <v-card style="border-radius: 16px; overflow: hidden;" elevation="0">
        <div style="background: #046375; padding: 20px;">
          <v-card-title class="text-white pa-0">
            <div class="text-h6 font-weight-bold">نسخ وصفة</div>
          </v-card-title>
        </div>
        <v-card-text class="pa-5">
          <p class="mb-3">اختر الوصفة التي تريد نسخ مكوناتها (تستبدل مكونات {{ selectedRecipeLabel }}):</p>
          <v-select
            v-model="copyFromSize"
            :items="copyRecipeOptions"
            label="نسخ من"
            variant="outlined"
            density="comfortable"
          />
        </v-card-text>
        <v-card-actions class="pa-5" style="background: var(--t-surface-high); border-top: 1px solid #E5E7EB;">
          <v-btn 
            @click="showCopyRecipeDialog = false"
            variant="outlined"
            style="border: 1px solid var(--t-border); color: var(--t-text-dim); border-radius: 10px; text-transform: none; font-weight: 600;"
          >
            إلغاء
          </v-btn>
          <v-spacer />
          <v-btn 
            @click="copyRecipe"
            style="background: #046375; color: white; border-radius: 10px; text-transform: none; font-weight: 600;"
            elevation="0"
          >
            نسخ
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import { menuAPI, categoryAPI, itemSizeAPI, recipeAPI, inventoryAPI } from '@/services/api'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'
import { formatCurrentDateArabic } from '@/utils/dateFormatter'
import logoImg from '@/assets/logo.png'
import defaultMenuItemImage from '@/assets/logo.png'
import {
  PhPlus, PhGridFour, PhList, PhCoffee, PhForkKnife, PhStack,
  PhMagnifyingGlass, PhPencilSimple, PhTrash, PhCamera, PhResize,
  PhCurrencyDollar, PhClock, PhCookingPot, PhFloppyDisk, PhImage,
  PhPackage, PhX, PhCheckCircle, PhTag, PhFolder, PhNotePencil,
  PhCoins, PhTimer, PhFire, PhInfo, PhSortAscending, PhCaretLeft, PhCaretRight,
  PhChefHat
} from '@phosphor-icons/vue'

const toast = useToast()
const authStore = useAuthStore()

const currentDate = computed(() => {
  return formatCurrentDateArabic()
})

// State
const menuItems = ref([])
const categories = ref([])
const ingredients = ref([])
const selectedTab = ref('items')
const viewMode = ref('grid')
const search = ref('')
const filterCategory = ref(null)
const filterAvailability = ref(null)
const loading = ref({
  menuItems: false,
  categories: false,
  ingredients: false
})

// Dialogs
const showAddDialog = ref(false)
const showAddCategoryDialog = ref(false)
const showCopyRecipeDialog = ref(false)
const itemDialogTab = ref('info')
// Recipe key: BASE_RECIPE_KEY = base recipe (sizeId NULL, used by every size that has no
// recipe of its own), otherwise a sizeId.
const BASE_RECIPE_KEY = 'base'
const selectedRecipeSize = ref(BASE_RECIPE_KEY)
const recipesDirty = ref(false) // unsaved recipe edits in the dialog

// Editing states
const editingItem = ref(null)
const editingCategory = ref(null)
const selectedMenuItem = ref(null)
const saving = ref(false)

// Forms
const itemForm = ref({
  itemName: '',
  categoryId: null,
  description: '',
  basePrice: 0,
  preparationTime: 5,
  calories: null,
  imageUrl: '',
  imageFile: null,
  isAvailable: true,
  itemType: 'recipe', // Always recipe since all items need recipes
  isInventoryItem: false
})

const imagePreview = ref(null)

const categoryForm = ref({
  categoryName: '',
  description: '',
  displayOrder: 0,
  isActive: true,
  isKitchen: true
})

const itemSizes = ref([])
const sizeForm = ref({
  sizeName: '',
  actualPrice: 0,
  priceAdjustment: 0,
  isDefault: false
})

const allRecipes = ref({}) // { 'base': [...], 'sizeId': [...] }
const recipeForm = ref({
  ingredientId: null,
  quantityNeeded: 0
})
const copyFromSize = ref(null)

// Options
const itemTypeOptions = [
  { 
    value: 'recipe', 
    title: '👨‍🍳 يُحضّر من مكونات (له وصفة)',
    subtitle: 'مثال: قهوة، عصير - سيتم خصم المكونات تلقائياً'
  },
  { 
    value: 'harmony', 
    title: '📦 جاهز للبيع مباشرة (بدون وصفة)',
    subtitle: 'مثال: كرواسون، ماء، منتج معلّب'
  }
]

const availabilityOptions = [
  { value: true, title: 'متوفر' },
  { value: false, title: 'غير متوفر' }
]

const sizeOptions = [
  { value: 'صغير', title: 'صغير' },
  { value: 'وسط', title: 'وسط' },
  { value: 'كبير', title: 'كبير' }
]

// Computed for current size recipe
const currentSizeRecipe = computed(() => {
  return allRecipes.value[selectedRecipeSize.value] || []
})

const isBaseRecipeSelected = computed(() => selectedRecipeSize.value === BASE_RECIPE_KEY)
const baseRecipeLabel = 'الوصفة الأساسية (لكل الأحجام)'
const recipeLabel = (key) => key === BASE_RECIPE_KEY
  ? baseRecipeLabel
  : (itemSizes.value.find(s => String(s.idItemSize) === String(key))?.sizeName || 'حجم')
const selectedRecipeLabel = computed(() => recipeLabel(selectedRecipeSize.value))
const selectedSizePrice = computed(() => {
  const size = itemSizes.value.find(s => s.idItemSize === selectedRecipeSize.value)
  return Number(selectedMenuItem.value?.basePrice || 0) + Number(size?.priceAdjustment || 0)
})
const hasBaseRecipe = computed(() => (allRecipes.value[BASE_RECIPE_KEY] || []).length > 0)
const sizeHasOwnRecipe = (sizeId) => (allRecipes.value[sizeId] || []).length > 0

// Copy recipe options (base recipe + other sizes)
const copyRecipeOptions = computed(() => {
  const options = []
  if (selectedRecipeSize.value !== BASE_RECIPE_KEY) {
    options.push({ value: BASE_RECIPE_KEY, title: baseRecipeLabel })
  }
  itemSizes.value.forEach(size => {
    if (size.idItemSize !== selectedRecipeSize.value) {
      options.push({ value: size.idItemSize, title: size.sizeName })
    }
  })
  return options
})

// Headers
const itemHeaders = [
  { title: 'الصورة', key: 'imageUrl', sortable: false },
  { title: 'الصنف', key: 'itemName' },
  { title: 'التصنيف', key: 'categoryName' },
  { title: 'السعر', key: 'basePrice' },
  { title: 'وقت التحضير', key: 'preparationTime' },
  { title: 'النوع', key: 'itemType' },
  { title: 'متوفر', key: 'isAvailable' },
  { title: 'إجراءات', key: 'actions', sortable: false }
]

const categoryHeaders = [
  { title: 'التصنيف', key: 'categoryName' },
  { title: 'الترتيب', key: 'displayOrder' },
  { title: 'الحالة', key: 'isActive' },
  { title: 'إجراءات', key: 'actions', sortable: false }
]

const rules = {
  required: value => !!value || 'مطلوب'
}

// Computed
const categoryFilterOptions = computed(() => {
  return [
    { value: null, title: 'كل التصنيفات' },
    ...categories.value.map(c => ({ value: c.idCategory, title: c.categoryName }))
  ]
})

const filteredMenuItems = computed(() => {
  let filtered = menuItems.value

  // Filter by category
  if (filterCategory.value) {
    filtered = filtered.filter(item => item.categoryId === filterCategory.value)
  }

  // Filter by availability
  if (filterAvailability.value !== null) {
    filtered = filtered.filter(item => item.isAvailable === filterAvailability.value)
  }

  // Search
  if (search.value) {
    const searchLower = search.value.toLowerCase()
    filtered = filtered.filter(item =>
      item.itemName.toLowerCase().includes(searchLower) ||
      item.description?.toLowerCase().includes(searchLower) ||
      item.categoryName?.toLowerCase().includes(searchLower)
    )
  }

  return filtered
})

const selectedIngredientUnit = computed(() => {
  if (!recipeForm.value.ingredientId) return ''
  const ingredient = ingredients.value.find(i => i.idIngredient === recipeForm.value.ingredientId)
  return ingredient?.unit || ''
})

// Display unit for recipe (convert to smaller units)
const recipeUnitDisplay = computed(() => {
  const unit = selectedIngredientUnit.value.toLowerCase()
  if (unit === 'kg' || unit === 'kilogram') return 'g'
  if (unit === 'liter' || unit === 'l') return 'ml'
  return selectedIngredientUnit.value
})

// Conversion hint
const unitConversionHint = computed(() => {
  const unit = selectedIngredientUnit.value.toLowerCase()
  if (unit === 'kg' || unit === 'kilogram') return 'سيتم التحويل تلقائياً (1000g = 1kg)'
  if (unit === 'liter' || unit === 'l') return 'سيتم التحويل تلقائياً (1000ml = 1L)'
  return ''
})

// Convert recipe quantity to inventory unit (g → kg, ml → l)
const convertToInventoryUnit = (quantity, unit) => {
  const unitLower = unit.toLowerCase()
  if (unitLower === 'kg' || unitLower === 'kilogram') {
    return quantity / 1000 // g to kg
  }
  if (unitLower === 'liter' || unitLower === 'l') {
    return quantity / 1000 // ml to l
  }
  return quantity
}

// Convert inventory unit to recipe display (kg → g, l → ml)
const convertToRecipeUnit = (quantity, unit) => {
  const unitLower = unit.toLowerCase()
  if (unitLower === 'kg' || unitLower === 'kilogram') {
    return quantity * 1000 // kg to g
  }
  if (unitLower === 'liter' || unitLower === 'l') {
    return quantity * 1000 // l to ml
  }
  return quantity
}

// Methods - Load Data
const loadMenuItems = async () => {
  try {
    const response = await menuAPI.getAll()
    // Ensure isAvailable is properly converted to boolean
    menuItems.value = response.data.map(item => ({
      ...item,
      isAvailable: Boolean(item.isAvailable === 1 || item.isAvailable === true || item.isAvailable === '1')
    }))
  } catch (error) {
    toast.error('فشل تحميل الأصناف')
    console.error(error)
  }
}

const loadCategories = async () => {
  loading.value.categories = true
  try {
    const response = await categoryAPI.getAll()
    categories.value = response.data
  } catch (error) {
    toast.error('فشل تحميل التصنيفات')
    console.error(error)
  } finally {
    loading.value.categories = false
  }
}

const loadIngredients = async () => {
  loading.value.ingredients = true
  try {
    const response = await inventoryAPI.getAll()
    ingredients.value = response.data
  } catch (error) {
    console.error('Failed to load ingredients:', error)
  } finally {
    loading.value.ingredients = false
  }
}

// Methods - Item Management
const openAddItemDialog = () => {
  resetItemForm()
  showAddDialog.value = true
}

const closeAddDialog = (force = false) => {
  if (force !== true && recipesDirty.value &&
      !window.confirm('لديك تغييرات على الوصفة لم تُحفظ بعد.\nهل تريد الإغلاق وتجاهل هذه التغييرات؟')) {
    return
  }
  recipesDirty.value = false
  showAddDialog.value = false
  resetItemForm()
  itemDialogTab.value = 'info'
  selectedRecipeSize.value = BASE_RECIPE_KEY
  allRecipes.value = {}
  itemSizes.value = []
}

const onImageSelect = (fileInput) => {
  console.log('onImageSelect called with:', fileInput)
  console.log('Type check - instanceof File:', fileInput instanceof File)
  console.log('Type check - Array.isArray:', Array.isArray(fileInput))
  console.log('Type check - is null:', fileInput === null)
  console.log('Type check - typeof:', typeof fileInput)
  
  // v-file-input can return: File object, Array of Files, or null
  let file = null
  
  if (fileInput instanceof File) {
    // Single file object
    console.log('✅ Detected as File object')
    file = fileInput
  } else if (Array.isArray(fileInput) && fileInput.length > 0) {
    // Array of files
    console.log('✅ Detected as Array of files')
    file = fileInput[0]
  } else if (fileInput === null || fileInput === undefined) {
    // File cleared
    console.log('File cleared, reverting to original')
    imagePreview.value = editingItem.value?.imageUrl || itemForm.value.imageUrl || null
    return
  } else {
    console.log('❌ Unknown file input type:', typeof fileInput, fileInput)
    return
  }
  
  console.log('Processing file:', file.name, 'Size:', file.size, 'Type:', file.type)
  
  // Validate file type
  if (!file.type.startsWith('image/')) {
    toast.error('يرجى اختيار ملف صورة')
    itemForm.value.imageFile = null
    return
  }
  
  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    toast.error('حجم الصورة كبير جداً (الحد الأقصى 5MB)')
    itemForm.value.imageFile = null
    return
  }
  
  // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      imagePreview.value = e.target.result
    console.log('✅ Image preview updated successfully!')
    toast.info('✓ معاينة الصورة جاهزة - اضغط "حفظ التعديلات" لرفعها')
  }
  reader.onerror = (error) => {
    console.error('FileReader error:', error)
    toast.error('فشل قراءة الصورة')
    }
    reader.readAsDataURL(file)
}

const editItem = async (item) => {
  console.log('🔧 Editing item:', item.itemName, 'ID:', item.idMenuItem)
  editingItem.value = item
  selectedMenuItem.value = item
  itemForm.value = { ...item, imageFile: null } // Reset imageFile
  imagePreview.value = item.imageUrl || null
  console.log('📸 Initial imagePreview set to:', imagePreview.value)
  itemDialogTab.value = 'info'
  
  // Load sizes and recipes
  if (item.idMenuItem) {
    await loadItemSizes(item.idMenuItem)
    await loadAllRecipes(item.idMenuItem)
    
    // Start on the first size that has its own recipe, otherwise on the base recipe
    const firstWithRecipe = itemSizes.value.find(s => sizeHasOwnRecipe(s.idItemSize))
    selectedRecipeSize.value = firstWithRecipe ? firstWithRecipe.idItemSize : BASE_RECIPE_KEY
  }
  
  showAddDialog.value = true
}

const saveItem = async () => {
  if (!itemForm.value.itemName || !itemForm.value.categoryId) {
    toast.error('الاسم والتصنيف مطلوبان')
    return
  }

  saving.value = true
  try {
    let imageUrl = itemForm.value.imageUrl || defaultMenuItemImage
    
    // Upload image if file is selected
    const imageFile = itemForm.value.imageFile
    if (imageFile) {
      const formData = new FormData()
      const file = imageFile instanceof File ? imageFile : (Array.isArray(imageFile) ? imageFile[0] : null)
      
      if (file) {
        console.log('Uploading file:', file.name, file.size)
        formData.append('image', file)
      
      try {
        const uploadResponse = await menuAPI.uploadImage(formData)
        imageUrl = uploadResponse.data.imageUrl
          console.log('Image uploaded successfully:', imageUrl)
      } catch (uploadError) {
        console.error('Image upload failed:', uploadError)
        toast.warning('فشل رفع الصورة، سيتم استخدام الصورة الافتراضية')
        }
      }
    }
    
    const itemData = {
      ...itemForm.value,
      imageUrl: imageUrl
    }
    delete itemData.imageFile
    
    if (editingItem.value) {
      await menuAPI.update(editingItem.value.idMenuItem, itemData)
      toast.success('✅ تم تحديث الصنف بنجاح')
      selectedMenuItem.value = { ...selectedMenuItem.value, ...itemData }
    } else {
      const response = await menuAPI.create(itemData)
      toast.success('✅ تم إضافة الصنف بنجاح - أضف الأحجام والوصفة الآن')
      const created = { ...response.data, idMenuItem: response.data.idMenuItem || response.data.id }
      editingItem.value = created
      selectedMenuItem.value = created
      itemDialogTab.value = 'sizes'
    }
    
    await loadMenuItems()
    
    if (!editingItem.value || itemDialogTab.value !== 'info') {
      return
    }
  } catch (error) {
    toast.error('فشل حفظ الصنف')
    console.error(error)
  } finally {
    saving.value = false
  }
}

// Save changes for existing items (used in edit mode on info tab)
const saveItemChanges = async () => {
  if (!itemForm.value.itemName || !itemForm.value.categoryId) {
    toast.error('الاسم والتصنيف مطلوبان')
    return
  }

  saving.value = true
  try {
    let imageUrl = itemForm.value.imageUrl
    
    // Upload image if new file is selected
    const imageFile = itemForm.value.imageFile
    if (imageFile) {
      const formData = new FormData()
      // Handle both File object and Array
      const file = imageFile instanceof File ? imageFile : (Array.isArray(imageFile) ? imageFile[0] : null)
      
      if (!file) {
        console.log('No valid file to upload')
        saving.value = false
        return
      }
      
      console.log('Uploading file:', file.name, file.size)
      formData.append('image', file)
      
      try {
        const uploadResponse = await menuAPI.uploadImage(formData)
        imageUrl = uploadResponse.data.imageUrl
        console.log('Image uploaded successfully:', imageUrl)
        toast.success('✅ تم رفع الصورة بنجاح')
      } catch (uploadError) {
        console.error('Image upload failed:', uploadError)
        toast.error('فشل رفع الصورة')
        saving.value = false
        return
      }
    }
    
    const itemData = {
      ...itemForm.value,
      imageUrl: imageUrl
    }
    delete itemData.imageFile
    
    await menuAPI.update(editingItem.value.idMenuItem, itemData)
    toast.success('✅ تم حفظ التعديلات بنجاح')
    
    // Update the local data
    selectedMenuItem.value = { ...selectedMenuItem.value, ...itemData }
    editingItem.value = { ...editingItem.value, ...itemData }
    itemForm.value.imageUrl = imageUrl
    
    // Update preview to show the new uploaded image
    imagePreview.value = imageUrl
    
    await loadMenuItems()
    
    // Reset image file input
    itemForm.value.imageFile = null
    
  } catch (error) {
    toast.error('فشل حفظ التعديلات')
    console.error(error)
  } finally {
    saving.value = false
  }
}

const toggleAvailability = async (item) => {
  const newStatus = !Boolean(item.isAvailable)
  try {
    await menuAPI.toggleAvailability(item.idMenuItem)
    item.isAvailable = newStatus
    toast.success(newStatus ? 'تم تفعيل الصنف' : 'تم إيقاف الصنف')
    await loadMenuItems() // Reload to ensure consistency
  } catch (error) {
    toast.error('فشل تغيير الحالة')
    console.error(error)
  }
}

// Delete failures: prefer an Arabic server message; a generic/English one (usually a
// foreign key from past orders) gets the Arabic hint instead.
const deleteErrorMessage = (error, fallback) => {
  const msg = error?.response?.data?.message
  if (msg && /[\u0600-\u06FF]/.test(msg)) return msg
  if (error?.response) return 'لا يمكن الحذف لأن الصنف مستخدم في طلبات سابقة — يمكنك إيقافه بدلاً من ذلك'
  return fallback
}

const deleteItem = async (item) => {
  if (!confirm(`هل تريد حذف "${item.itemName}"؟`)) return

  try {
    await menuAPI.delete(item.idMenuItem)
    toast.success('تم حذف الصنف')
    await loadMenuItems()
  } catch (error) {
    toast.error(deleteErrorMessage(error, 'فشل حذف الصنف'))
    console.error(error)
  }
}

const resetItemForm = () => {
  itemForm.value = {
    itemName: '',
    categoryId: null,
    description: '',
    basePrice: 0,
    preparationTime: 5,
    calories: null,
    imageUrl: '',
    imageFile: null,
    isAvailable: true,
    itemType: 'recipe', // Always recipe
    isInventoryItem: false
  }
  imagePreview.value = null
  editingItem.value = null
}

// Methods - Category Management
const openAddCategoryDialog = () => {
  resetCategoryForm()
  showAddCategoryDialog.value = true
}

const closeAddCategoryDialog = () => {
  showAddCategoryDialog.value = false
  resetCategoryForm()
}

const editCategory = (category) => {
  editingCategory.value = category
  categoryForm.value = { 
    ...category,
    isKitchen: category.isKitchen !== undefined ? category.isKitchen : true // Default to true if not set
  }
  showAddCategoryDialog.value = true
}

const saveCategory = async () => {
  if (!categoryForm.value.categoryName) {
    toast.error('اسم التصنيف مطلوب')
    return
  }

  saving.value = true
  try {
    if (editingCategory.value) {
      await categoryAPI.update(editingCategory.value.idCategory, categoryForm.value)
      toast.success('تم تحديث التصنيف')
    } else {
      await categoryAPI.create(categoryForm.value)
      toast.success('تم إضافة التصنيف')
    }
    await loadCategories()
    await loadMenuItems()
    closeAddCategoryDialog()
  } catch (error) {
    toast.error('فشل حفظ التصنيف')
    console.error(error)
  } finally {
    saving.value = false
  }
}

const deleteCategory = async (category) => {
  if (!confirm(`حذف التصنيف "${category.categoryName}"؟`)) return

  try {
    await categoryAPI.delete(category.idCategory)
    toast.success('تم حذف التصنيف')
    await loadCategories()
  } catch (error) {
    toast.error(deleteErrorMessage(error, 'فشل حذف التصنيف'))
    console.error(error)
  }
}

const resetCategoryForm = () => {
  categoryForm.value = {
    categoryName: '',
    description: '',
    displayOrder: 0,
    isActive: true,
    isKitchen: true
  }
  editingCategory.value = null
}

// Methods - Size Management
const loadItemSizes = async (menuItemId) => {
  try {
    const response = await itemSizeAPI.getByMenuItem(menuItemId)
    itemSizes.value = response.data
  } catch (error) {
    console.error('Failed to load sizes:', error)
    itemSizes.value = []
  }
}

const saveSize = async () => {
  if (!sizeForm.value.sizeName) {
    toast.error('اسم الحجم مطلوب')
    return
  }

  if (!sizeForm.value.actualPrice || sizeForm.value.actualPrice <= 0) {
    toast.error('السعر مطلوب ويجب أن يكون أكبر من الصفر')
    return
  }

  // Check if size already exists
  const existingSize = itemSizes.value.find(s => s.sizeName === sizeForm.value.sizeName)
  if (existingSize) {
    toast.error('هذا الحجم موجود بالفعل')
    return
  }

  saving.value = true
  try {
    const menuItemId = selectedMenuItem.value?.idMenuItem || selectedMenuItem.value?.id || editingItem.value?.idMenuItem || editingItem.value?.id
    
    if (!menuItemId) {
      toast.error('خطأ: لم يتم تحديد الصنف')
      console.error('No menuItemId found. selectedMenuItem:', selectedMenuItem.value, 'editingItem:', editingItem.value)
      saving.value = false
      return
    }
    
    // Calculate priceAdjustment from actualPrice and basePrice
    const basePrice = Number(selectedMenuItem.value?.basePrice || editingItem.value?.basePrice || 0)
    const actualPrice = Number(sizeForm.value.actualPrice)
    const priceAdjustment = actualPrice - basePrice
    
    const sizeData = {
      sizeName: sizeForm.value.sizeName,
      priceAdjustment: priceAdjustment,
      menuItemId: menuItemId,
      isDefault: sizeForm.value.isDefault || false
    }
    
    console.log('Saving size:', sizeData)

    const response = await itemSizeAPI.create(sizeData)
    toast.success('تم إضافة الحجم - أضف الوصفة في التبويب التالي')
    await loadItemSizes((selectedMenuItem.value.idMenuItem || selectedMenuItem.value.id))
    
    // Auto-select the newly created size for recipe
    if (response.data && response.data.id) {
      selectedRecipeSize.value = response.data.id
    } else if (itemSizes.value.length > 0) {
      selectedRecipeSize.value = itemSizes.value[itemSizes.value.length - 1].idItemSize
    }
    
    resetSizeForm()
  } catch (error) {
    toast.error('فشل حفظ الحجم')
    console.error(error)
  } finally {
    saving.value = false
  }
}

const deleteSize = async (size) => {
  if (!confirm(`إيقاف الحجم "${size.sizeName}"؟ لن يظهر للبيع، ويبقى في الطلبات السابقة.`)) return

  try {
    await itemSizeAPI.delete(size.idItemSize)
    // The backend deactivates the size (kept for past orders) rather than deleting it
    toast.success('تم إيقاف الحجم')
    await loadItemSizes((selectedMenuItem.value.idMenuItem || selectedMenuItem.value.id))
    if (selectedRecipeSize.value === size.idItemSize) selectedRecipeSize.value = BASE_RECIPE_KEY
  } catch (error) {
    toast.error(deleteErrorMessage(error, 'فشل إيقاف الحجم'))
    console.error(error)
  }
}

const resetSizeForm = () => {
  sizeForm.value = {
    sizeName: '',
    actualPrice: 0,
    priceAdjustment: 0,
    isDefault: false
  }
}

// Methods - Recipe Management
const loadAllRecipes = async (menuItemId) => {
  try {
    const response = await recipeAPI.getByMenuItem(menuItemId)
    
    // Group by sizeId; lines with sizeId NULL form the base recipe
    const grouped = {}
    response.data.forEach(r => {
      const sizeKey = r.sizeId ? r.sizeId : BASE_RECIPE_KEY
      if (!grouped[sizeKey]) {
        grouped[sizeKey] = []
      }
      
      // Convert inventory unit to recipe display unit
      const displayQuantity = convertToRecipeUnit(r.quantityNeeded, r.unit)
      const unitLower = String(r.unit || '').toLowerCase()
      const displayUnit = unitLower === 'kg' || unitLower === 'kilogram' ? 'g' :
                         unitLower === 'liter' || unitLower === 'l' ? 'ml' :
                         r.unit
      
      grouped[sizeKey].push({
        ingredientId: r.ingredientId,
        ingredientName: r.ingredientName,
        quantityNeeded: displayQuantity,
        unit: displayUnit,
        originalUnit: r.unit
      })
    })
    
    allRecipes.value = grouped
    recipesDirty.value = false
  } catch (error) {
    console.error('Failed to load recipes:', error)
    allRecipes.value = {}
    toast.error('تعذّر تحميل الوصفة الحالية — لا تحفظ قبل إعادة فتح الصنف حتى لا تُستبدل')
  }
}

const addRecipeIngredient = () => {
  if (!recipeForm.value.ingredientId || !recipeForm.value.quantityNeeded) {
    toast.error('اختر المكون والكمية')
    return
  }

  const ingredient = ingredients.value.find(i => i.idIngredient === recipeForm.value.ingredientId)
  if (!ingredient) return

  // Get current recipe for selected size
  const currentSizeKey = selectedRecipeSize.value
  if (!allRecipes.value[currentSizeKey]) {
    allRecipes.value[currentSizeKey] = []
  }

  // Check if already added
  if (allRecipes.value[currentSizeKey].find(r => r.ingredientId === ingredient.idIngredient)) {
    toast.warning(`المكون موجود بالفعل في ${selectedRecipeLabel.value}`)
    return
  }

  // Determine display unit (convert kg to g, liter to ml)
  const displayUnit = ingredient.unit.toLowerCase() === 'kg' || ingredient.unit.toLowerCase() === 'kilogram' ? 'g' :
                     ingredient.unit.toLowerCase() === 'liter' || ingredient.unit.toLowerCase() === 'l' ? 'ml' :
                     ingredient.unit

  allRecipes.value[currentSizeKey].push({
    ingredientId: ingredient.idIngredient,
    ingredientName: ingredient.ingredientName,
    quantityNeeded: recipeForm.value.quantityNeeded,
    unit: displayUnit,
    originalUnit: ingredient.unit
  })

  // Reset form
  recipeForm.value = {
    ingredientId: null,
    quantityNeeded: 0
  }

  recipesDirty.value = true
  toast.info('أُضيف — اضغط "حفظ الوصفات" لحفظ التغييرات')
}

const removeRecipeIngredient = (index) => {
  const currentSizeKey = selectedRecipeSize.value
  if (allRecipes.value[currentSizeKey]) {
    allRecipes.value[currentSizeKey].splice(index, 1)
    recipesDirty.value = true
  }
  toast.info('أُزيل — اضغط "حفظ الوصفات" لحفظ التغييرات')
}

const saveAllRecipes = async () => {
  const menuItemId = selectedMenuItem.value?.idMenuItem || selectedMenuItem.value?.id
  if (!menuItemId) {
    toast.error('خطأ: لم يتم تحديد الصنف')
    return
  }

  // The backend replaces the item's whole recipe set, so send base + every size together
  const totalRecipes = Object.values(allRecipes.value).flat().length
  if (totalRecipes === 0) {
    if (!window.confirm('لا توجد أي مكونات في الوصفة.\nسيتم حذف وصفة هذا الصنف بالكامل ولن يُخصم أي مخزون عند بيعه. هل تريد المتابعة؟')) return
  } else if (!hasBaseRecipe.value) {
    // Sizes without their own lines fall back to the base recipe; warn only if there is none
    const sizesWithoutRecipes = itemSizes.value.filter(size => !sizeHasOwnRecipe(size.idItemSize))
    if (sizesWithoutRecipes.length > 0) {
      const sizeNames = sizesWithoutRecipes.map(s => s.sizeName).join('، ')
      if (!window.confirm(`تحذير: الأحجام التالية ليس لها وصفة ولا توجد وصفة أساسية: ${sizeNames}\nلن يُخصم مخزون عند بيعها.\n\nهل تريد المتابعة؟`)) return
    }
  }

  saving.value = true
  try {
    const allRecipesData = []
    Object.keys(allRecipes.value).forEach(sizeKey => {
      allRecipes.value[sizeKey].forEach(r => {
        const ingredient = ingredients.value.find(i => i.idIngredient === r.ingredientId)
        const originalUnit = r.originalUnit || ingredient?.unit || r.unit
        allRecipesData.push({
          ingredientId: r.ingredientId,
          quantityNeeded: convertToInventoryUnit(r.quantityNeeded, originalUnit),
          sizeId: sizeKey === BASE_RECIPE_KEY ? null : Number(sizeKey)
        })
      })
    })

    await recipeAPI.bulkUpdate(menuItemId, allRecipesData)
    toast.success('✅ تم حفظ جميع الوصفات')
    recipesDirty.value = false
    closeAddDialog(true)
  } catch (error) {
    toast.error(error?.response?.data?.message || 'فشل حفظ الوصفات — لم يتغير شيء')
    console.error(error)
  } finally {
    saving.value = false
  }
}

const copyRecipe = () => {
  if (!copyFromSize.value) {
    toast.error('اختر الحجم المراد النسخ منه')
    return
  }
  
  const sourceRecipe = allRecipes.value[copyFromSize.value]
  if (!sourceRecipe || sourceRecipe.length === 0) {
    toast.error('المصدر المختار ليس فيه مكونات')
    return
  }
  
  // Copy recipe to current size
  allRecipes.value[selectedRecipeSize.value] = JSON.parse(JSON.stringify(sourceRecipe))
  recipesDirty.value = true
  toast.info('نُسخت الوصفة — اضغط "حفظ الوصفات" لحفظ التغييرات')
  showCopyRecipeDialog.value = false
  copyFromSize.value = null
}

// Initialize
onMounted(() => {
  loadCategories()
  loadMenuItems()
  loadIngredients()
})
</script>

<style scoped>
.menu-item-card {
  transition: all 0.3s ease;
  overflow: hidden;
}

.menu-item-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px var(--t-border-subtle) !important;
  border-color: #046375 !important;
}

.menu-item-card.unavailable {
  opacity: 0.6;
}

.image-container {
  position: relative;
}

.availability-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  font-weight: bold;
}

.bg-grey-lighten-4 {
  background-color: var(--t-surface-high);
}

/* Beautiful Dialog Headers */
.dialog-header {
  position: relative;
  padding: 30px;
  background: linear-gradient(135deg, #046375 0%, #1F7F90 100%);
  overflow: hidden;
}

.header-content {
  position: relative;
  z-index: 2;
}

.header-wave {
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 30px;
  background: var(--t-surface);
  clip-path: polygon(0 50%, 10% 30%, 20% 50%, 30% 30%, 40% 50%, 50% 30%, 60% 50%, 70% 30%, 80% 50%, 90% 30%, 100% 50%, 100% 100%, 0 100%);
}

/* Image Upload Section */
.image-upload-section {
  position: relative;
}

.image-preview-container {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 16px;
  overflow: hidden;
  background: linear-gradient(135deg, var(--t-surface-high) 0%, var(--t-border) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px dashed #046375;
  position: relative;
}

.image-preview {
  width: 100%;
  height: 100%;
}

.image-placeholder {
  text-align: center;
  padding: 20px;
}

/* Form Section Titles */
.form-section-title {
  display: flex;
  align-items: center;
  font-weight: bold;
  color: #046375;
  font-size: 0.95rem;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--t-border);
}

/* View Toggle Buttons */
.view-toggle-btn {
  color: white !important;
}

.view-toggle-btn.v-btn--active {
  background: rgba(255, 255, 255, 0.2) !important;
}

/* Beautiful Dialog Footer */
.dialog-footer {
  background: linear-gradient(to bottom, var(--t-surface) 0%, var(--t-surface-high) 100%);
  border-top: 1px solid var(--t-border);
}

/* Step Progress Indicator */
.step-indicator {
  position: relative;
}

.step-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--t-border);
  color: var(--t-text-faint);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin: 0 auto 8px;
  transition: all 0.3s ease;
}

.step-indicator.active .step-circle {
  background: #046375;
  color: white;
  transform: scale(1.15);
  box-shadow: 0 4px 12px rgba(4, 99, 117, 0.4);
}

.step-indicator.completed .step-circle {
  background: #84967A;
  color: white;
}

.step-label {
  font-size: 0.75rem;
  color: var(--t-text-faint);
  font-weight: 500;
}

.step-indicator.active .step-label {
  color: #046375;
  font-weight: bold;
}

.step-indicator.completed .step-label {
  color: #84967A;
}
</style>
