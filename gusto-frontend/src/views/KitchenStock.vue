<template>
  <AppLayout>
    <v-container fluid class="pa-6">
      <!-- Header -->
      <v-row class="mb-6">
        <v-col cols="12">
          <v-card
            class="pa-6 page-banner"
            elevation="0"
          >
            <div style="position: absolute; top: -40px; right: -40px; width: 160px; height: 160px; border-radius: 50%; background: rgba(255,255,255,0.08);"></div>
            <div class="d-flex align-center flex-wrap" style="position: relative; z-index: 2;">
              <v-avatar size="80" class="ml-6 elevation-4" color="white" style="border-radius: 12px;">
                <img :src="logoImg" alt="جوستو" style="width: 100%; height: 100%; object-fit: contain; padding: 8px;" />
              </v-avatar>
              <div class="flex-grow-1">
                <h1 class="text-h4 font-weight-bold text-white mb-2">مخزن المطبخ (الميني)</h1>
                <p class="text-body-2 text-white" style="opacity: 0.9;">ما يُعرض للبيع اليوم — إضافة كميات وعرض المتبقي</p>
                <p class="text-body-2 text-white" style="opacity: 0.85;">{{ currentDate }}</p>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Add to kitchen -->
      <v-card elevation="0" class="mb-6" style="border: 1px solid var(--t-border); border-radius: 12px;">
        <v-card-title class="d-flex align-center" style="background: var(--t-surface-high); border-bottom: 1px solid var(--t-border-subtle);">
          <PhPlus :size="22" weight="bold" color="#046375" class="ml-2" />
          إضافة للعرض في المطبخ
        </v-card-title>
        <v-card-text class="pa-5">
          <v-row align="center">
            <v-col cols="12" md="5">
              <v-autocomplete
                v-model="addForm.menuItemId"
                :items="kitchenMenuItems"
                item-title="itemName"
                item-value="idMenuItem"
                label="بحث عن صنف..."
                density="comfortable"
                variant="outlined"
                hide-details
                clearable
                auto-select-first
                :loading="loading.menu"
              />
            </v-col>
            <v-col cols="12" md="3">
              <v-text-field
                v-model.number="addForm.quantity"
                type="number"
                min="1"
                label="الكمية"
                density="comfortable"
                variant="outlined"
                hide-details
              />
            </v-col>
            <v-col cols="12" md="2" class="d-flex align-center">
              <v-btn
                color="#046375"
                variant="flat"
                :loading="saving"
                :disabled="!addForm.menuItemId || !(addForm.quantity >= 1)"
                @click="submitAdd"
              >
                <PhPlus :size="20" weight="bold" class="ml-1" />
                إضافة
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Kitchen menu (what's available — quantity left) -->
      <v-card elevation="0" style="border: 1px solid var(--t-border); border-radius: 12px;">
        <v-card-title class="d-flex align-center justify-space-between" style="background: var(--t-surface-high); border-bottom: 1px solid var(--t-border-subtle);">
          <span class="d-flex align-center">
            <PhCookingPot :size="20" weight="bold" color="#046375" class="ml-2" />
            عرض المطبخ — المتبقي للبيع
          </span>
          <v-btn variant="text" size="small" @click="loadKitchenMenu">
            <PhArrowClockwise :size="18" weight="bold" />
          </v-btn>
        </v-card-title>
        <v-card-text class="pa-0">
          <p class="pa-3 text-body-2 text-medium-emphasis mb-0">
            يمكنك إضافة أصناف من الأعلى، وتعديل الكمية أو إزالة الصنف من العرض من الجدول.
          </p>
          <v-table v-if="kitchenMenu.length" density="comfortable">
            <thead>
              <tr style="background: var(--t-border-subtle);">
                <th class="text-right">الصنف</th>
                <th class="text-right">الفئة</th>
                <th class="text-center">المتبقي</th>
                <th class="text-center">السعر</th>
                <th class="text-center" style="width: 140px;">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in kitchenMenu" :key="row.menuItemId">
                <td class="text-right font-weight-medium">{{ row.itemName }}</td>
                <td class="text-right text-body-2">{{ row.categoryName || '—' }}</td>
                <td class="text-center">
                  <v-chip :color="row.quantity > 0 ? 'success' : 'default'" size="small" variant="tonal">
                    {{ row.quantity }}
                  </v-chip>
                </td>
                <td class="text-center">{{ Number(row.basePrice || 0).toLocaleString() }} د.ع</td>
                <td class="text-center">
                  <v-btn
                    icon
                    size="small"
                    variant="text"
                    color="primary"
                    title="تعديل الكمية أو إزالة"
                    @click="openSetQuantity(row)"
                  >
                    <PhPencilSimple :size="18" weight="bold" />
                  </v-btn>
                  <v-btn
                    v-if="row.quantity > 0"
                    icon
                    size="small"
                    variant="text"
                    color="error"
                    title="إزالة من العرض (تصفير)"
                    @click="removeFromKitchen(row)"
                  >
                    <PhTrash :size="18" weight="bold" />
                  </v-btn>
                </td>
              </tr>
            </tbody>
          </v-table>
          <v-progress-linear v-else-if="loading.kitchen" indeterminate color="#046375" class="ma-4" />
          <p v-else class="pa-4 text-center text-medium-emphasis">لم يُضف أي صنف للمطبخ بعد. أضف أصنافاً من القائمة أعلاه.</p>
        </v-card-text>
      </v-card>

      <!-- Set quantity dialog -->
      <v-dialog v-model="showSetDialog" max-width="400" persistent>
        <v-card elevation="0" style="border-radius: 12px;">
          <v-card-title class="d-flex align-center" style="background: var(--t-surface-high); border-bottom: 1px solid var(--t-border-subtle);">
            <PhPencilSimple :size="20" weight="bold" color="#046375" class="ml-2" />
            تعديل الكمية — {{ setRow?.itemName }}
          </v-card-title>
          <v-card-text class="pa-5">
            <v-text-field
              v-model.number="setForm.quantity"
              type="number"
              min="0"
              label="الكمية الجديدة (0 = إزالة من العرض)"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </v-card-text>
          <v-card-actions class="pa-4 pt-0">
            <v-spacer />
            <v-btn variant="text" @click="showSetDialog = false">إلغاء</v-btn>
            <v-btn color="#046375" variant="flat" :loading="savingSet" @click="submitSetQuantity">
              حفظ
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { kitchenStockAPI, menuAPI } from '@/services/api'
import { useToast } from 'vue-toastification'
import { formatCurrentDateArabic } from '@/utils/dateFormatter'
import logoImg from '@/assets/logo.png'
import AppLayout from '@/components/AppLayout.vue'
import { PhPlus, PhCookingPot, PhArrowClockwise, PhPencilSimple, PhTrash } from '@phosphor-icons/vue'

const toast = useToast()
const currentDate = ref(formatCurrentDateArabic())

const kitchenMenuItems = ref([])
const kitchenMenu = ref([])
const loading = ref({ menu: false, kitchen: false })
const saving = ref(false)

const addForm = ref({ menuItemId: null, quantity: 10 })
const showSetDialog = ref(false)
const setRow = ref(null)
const setForm = ref({ quantity: 0 })
const savingSet = ref(false)

async function loadMenuItems() {
  loading.value.menu = true
  try {
    const res = await menuAPI.getAll()
    kitchenMenuItems.value = Array.isArray(res.data) ? res.data : []
  } catch (e) {
    kitchenMenuItems.value = []
    toast.error('فشل تحميل القائمة')
  } finally {
    loading.value.menu = false
  }
}

async function loadKitchenMenu() {
  loading.value.kitchen = true
  try {
    const res = await kitchenStockAPI.getMenu(true)
    kitchenMenu.value = Array.isArray(res.data) ? res.data : []
  } catch (e) {
    kitchenMenu.value = []
    toast.error('فشل تحميل عرض المطبخ')
  } finally {
    loading.value.kitchen = false
  }
}

async function submitAdd() {
  const id = addForm.value.menuItemId
  const qty = Math.max(1, parseInt(addForm.value.quantity, 10))
  if (!id) {
    toast.error('اختر صنفاً')
    return
  }
  saving.value = true
  try {
    await kitchenStockAPI.add({ menuItemId: id, quantity: qty })
    toast.success('تمت الإضافة')
    addForm.value = { menuItemId: null, quantity: 10 }
    await loadKitchenMenu()
  } catch (e) {
    toast.error(e.response?.data?.message || 'فشل الإضافة')
  } finally {
    saving.value = false
  }
}

function openSetQuantity(row) {
  setRow.value = row
  setForm.value = { quantity: Math.max(0, parseInt(row.quantity, 10) || 0) }
  showSetDialog.value = true
}

async function submitSetQuantity() {
  if (setRow.value == null) return
  const qty = Math.max(0, parseInt(setForm.value.quantity, 10) || 0)
  savingSet.value = true
  try {
    await kitchenStockAPI.setQuantity({ menuItemId: setRow.value.menuItemId, quantity: qty })
    toast.success(qty === 0 ? 'تمت إزالة الصنف من العرض' : 'تم تحديث الكمية')
    showSetDialog.value = false
    setRow.value = null
    await loadKitchenMenu()
  } catch (e) {
    toast.error(e.response?.data?.message || 'فشل التحديث')
  } finally {
    savingSet.value = false
  }
}

async function removeFromKitchen(row) {
  if (!confirm(`إزالة "${row.itemName}" من عرض المطبخ؟ (تصفير الكمية)`)) return
  savingSet.value = true
  try {
    await kitchenStockAPI.setQuantity({ menuItemId: row.menuItemId, quantity: 0 })
    toast.success('تمت الإزالة من العرض')
    await loadKitchenMenu()
  } catch (e) {
    toast.error(e.response?.data?.message || 'فشل الإزالة')
  } finally {
    savingSet.value = false
  }
}

onMounted(() => {
  loadMenuItems()
  loadKitchenMenu()
})
</script>
