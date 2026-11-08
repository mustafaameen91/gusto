<template>
  <AppLayout>
    <v-container fluid class="pa-6">
      <!-- Header -->
      <v-row class="mb-6">
        <v-col cols="12">
          <v-card
            elevation="0"
            class="pa-6 page-banner"
          >
            <div style="position: absolute; top: -40px; right: -40px; width: 160px; height: 160px; border-radius: 50%; background: rgba(255,255,255,0.08);"></div>
            <div style="position: relative; z-index: 1;">
              <h1 class="text-h4 font-weight-bold text-white mb-1">دليل الحسابات</h1>
              <p class="text-white mb-0" style="opacity: 0.9;">إدارة الحسابات المحاسبية — أصول، التزامات، إيرادات، مصروفات</p>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Toolbar -->
      <div class="d-flex justify-space-between align-center flex-wrap gap-3 mb-4">
        <v-text-field
          v-model="search"
          label="بحث برمز الحساب أو الاسم"
          variant="outlined"
          density="compact"
          hide-details
          clearable
          style="max-width: 320px; border-radius: 10px;"
          color="#046375"
        />
        <v-btn
          color="#046375"
          variant="flat"
          size="large"
          style="border-radius: 10px;"
          @click="openAdd"
        >
          <PhPlus :size="20" weight="bold" class="ml-1" />
          إضافة حساب
        </v-btn>
      </div>

      <!-- Table card -->
      <v-card
        elevation="0"
        style="border: 1px solid var(--t-border); border-radius: 12px; overflow: hidden;"
      >
        <v-data-table
          :headers="headers"
          :items="filteredAccounts"
          :search="search"
          :loading="loading"
          density="comfortable"
          class="accounts-table"
          :items-per-page="15"
          :items-per-page-options="[10, 15, 25, 50]"
          locale="ar"
          no-data-text="لا توجد حسابات. اضغط «إضافة حساب» للبدء."
          loading-text="جاري التحميل..."
        >
          <template v-slot:item.accountCode="{ item }">
            <span class="font-weight-medium" style="color: var(--t-text);">{{ item.accountCode || '—' }}</span>
          </template>
          <template v-slot:item.accountName="{ item }">
            <span style="color: #ffffff;">{{ item.accountName || '—' }}</span>
          </template>
          <template v-slot:item.accountType="{ item }">
            <v-chip
              :color="accountTypeColor(item.accountType)"
              size="small"
              variant="tonal"
            >
              {{ accountTypeLabel(item.accountType) }}
            </v-chip>
          </template>
          <template v-slot:item.actions="{ item }">
            <v-btn
              icon
              variant="text"
              size="small"
              color="#046375"
              @click="openEdit(item)"
              title="تعديل"
            >
              <PhPencilSimple :size="18" />
            </v-btn>
            <v-btn
              icon
              variant="text"
              size="small"
              color="error"
              @click="confirmDelete(item)"
              title="حذف"
            >
              <PhTrash :size="18" />
            </v-btn>
          </template>
        </v-data-table>
      </v-card>

      <!-- Add/Edit dialog -->
      <v-dialog v-model="showDialog" max-width="520" persistent content-class="accounts-dialog">
        <v-card elevation="0" style="border-radius: 16px; overflow: hidden;">
          <div class="pa-5" style="background: linear-gradient(135deg, #046375 0%, #1F7F90 100%);">
            <h2 class="text-h6 font-weight-bold text-white mb-0">
              {{ editId ? 'تعديل الحساب' : 'إضافة حساب جديد' }}
            </h2>
          </div>
          <v-card-text class="pa-5">
            <v-text-field
              v-model="form.accountCode"
              label="رمز الحساب"
              variant="outlined"
              density="comfortable"
              class="mb-4"
              color="#046375"
              hide-details="auto"
              style="border-radius: 10px;"
            />
            <v-text-field
              v-model="form.accountName"
              label="اسم الحساب"
              variant="outlined"
              density="comfortable"
              class="mb-4"
              color="#046375"
              hide-details="auto"
              style="border-radius: 10px;"
            />
            <v-select
              v-model="form.accountType"
              :items="accountTypeOptions"
              item-title="label"
              item-value="value"
              label="نوع الحساب"
              variant="outlined"
              density="comfortable"
              clearable
              color="#046375"
              hide-details="auto"
              style="border-radius: 10px;"
            />
          </v-card-text>
          <v-divider />
          <v-card-actions class="pa-5" style="background: var(--t-surface-high);">
            <v-btn variant="text" size="large" @click="showDialog = false" style="color: var(--t-text-dim);">
              إلغاء
            </v-btn>
            <v-spacer />
            <v-btn
              color="#046375"
              variant="flat"
              size="large"
              :loading="saving"
              style="border-radius: 10px;"
              @click="save"
            >
              حفظ
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Delete confirm dialog -->
      <v-dialog v-model="showDeleteDialog" max-width="420" persistent>
        <v-card elevation="0" style="border-radius: 16px;">
          <v-card-title class="pa-5 text-h6">حذف الحساب</v-card-title>
          <v-card-text class="pa-5 pt-0">
            هل أنت متأكد من حذف الحساب «<strong>{{ accountToDelete?.accountName }}</strong>»؟ لا يمكن التراجع.
          </v-card-text>
          <v-divider />
          <v-card-actions class="pa-5" style="background: var(--t-surface-high);">
            <v-spacer />
            <v-btn variant="text" @click="showDeleteDialog = false" style="color: var(--t-text-dim);">إلغاء</v-btn>
            <v-btn color="error" variant="flat" :loading="saving" style="border-radius: 10px;" @click="doDelete">
              حذف
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import AppLayout from '@/components/AppLayout.vue'
import { accountAPI } from '@/services/api'
import { PhPencilSimple, PhTrash, PhPlus } from '@phosphor-icons/vue'

const toast = useToast()
const loading = ref(false)
const saving = ref(false)
const search = ref('')
const accounts = ref([])
const showDialog = ref(false)
const showDeleteDialog = ref(false)
const editId = ref(null)
const accountToDelete = ref(null)
const form = ref({ accountCode: '', accountName: '', accountType: '' })

// ترجمة نوع الحساب للإنجليزية في القاعدة إلى عربي في الواجهة
const accountTypeMap = {
  ASSET: 'أصول',
  LIABILITY: 'التزامات',
  EQUITY: 'حقوق ملكية',
  REVENUE: 'إيرادات',
  EXPENSE: 'مصروفات',
  COST: 'تكلفة'
}
const accountTypeOptions = [
  { value: 'ASSET', label: 'أصول' },
  { value: 'LIABILITY', label: 'التزامات' },
  { value: 'EQUITY', label: 'حقوق ملكية' },
  { value: 'REVENUE', label: 'إيرادات' },
  { value: 'EXPENSE', label: 'مصروفات' },
  { value: 'COST', label: 'تكلفة' }
]
function accountTypeLabel(value) {
  if (!value) return '—'
  return accountTypeMap[value] || value
}
function accountTypeColor(value) {
  const colors = { ASSET: 'blue', LIABILITY: 'orange', EQUITY: 'green', REVENUE: 'teal', EXPENSE: 'red', COST: 'purple' }
  return colors[value] || 'grey'
}

const headers = [
  { title: 'رمز الحساب', key: 'accountCode', sortable: true },
  { title: 'اسم الحساب', key: 'accountName', sortable: true },
  { title: 'نوع الحساب', key: 'accountType' },
  { title: 'إجراءات', key: 'actions', sortable: false, align: 'start' }
]

const filteredAccounts = computed(() => {
  const s = (search.value || '').toLowerCase()
  if (!s) return accounts.value
  return accounts.value.filter(
    (a) =>
      (a.accountCode || '').toLowerCase().includes(s) ||
      (a.accountName || '').toLowerCase().includes(s)
  )
})

async function load() {
  loading.value = true
  try {
    const res = await accountAPI.getAll()
    accounts.value = Array.isArray(res.data) ? res.data : []
  } catch (e) {
    toast.error(e.response?.data?.message || 'فشل تحميل الحسابات')
  } finally {
    loading.value = false
  }
}

function openAdd() {
  editId.value = null
  form.value = { accountCode: '', accountName: '', accountType: '' }
  showDialog.value = true
}

function openEdit(item) {
  editId.value = item.idAccount
  form.value = {
    accountCode: item.accountCode || '',
    accountName: item.accountName || '',
    accountType: item.accountType || ''
  }
  showDialog.value = true
}

async function save() {
  if (!form.value.accountCode?.trim() || !form.value.accountName?.trim()) {
    toast.error('رمز الحساب واسم الحساب مطلوبان')
    return
  }
  saving.value = true
  try {
    if (editId.value) {
      await accountAPI.update(editId.value, form.value)
      toast.success('تم تحديث الحساب')
    } else {
      await accountAPI.create(form.value)
      toast.success('تم إضافة الحساب')
    }
    showDialog.value = false
    await load()
  } catch (e) {
    toast.error(e.response?.data?.message || 'فشل الحفظ')
  } finally {
    saving.value = false
  }
}

function confirmDelete(item) {
  accountToDelete.value = item
  showDeleteDialog.value = true
}

async function doDelete() {
  if (!accountToDelete.value) return
  saving.value = true
  try {
    await accountAPI.delete(accountToDelete.value.idAccount)
    toast.success('تم حذف الحساب')
    showDeleteDialog.value = false
    accountToDelete.value = null
    await load()
  } catch (e) {
    toast.error(e.response?.data?.message || 'فشل الحذف')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.accounts-table :deep(.v-data-table__thead) {
  background: var(--t-surface-high);
}
.accounts-table :deep(.v-data-table__thead th) {
  color: var(--t-text-dim) !important;
  font-weight: 600 !important;
  font-size: 0.875rem !important;
}
.accounts-table :deep(.v-data-table__tbody tr:hover) {
  background: var(--t-surface-high) !important;
}
.accounts-table :deep(.v-data-table__tbody tr) {
  border-bottom: 1px solid var(--t-border-subtle);
}
</style>
