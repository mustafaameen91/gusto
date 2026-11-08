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
                    إدارة الموظفين والصلاحيات
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
              <v-list-item @click="loadStaff">
                <template v-slot:prepend>
                  <PhArrowClockwise :size="20" weight="bold" color="#046375" class="ml-2" />
                </template>
                <v-list-item-title>تحديث</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
          <v-btn
            @click="showAddDialog = true"
            color="#046375"
            variant="flat"
            size="large"
            style="border-radius: 12px;"
          >
            <PhUserPlus :size="20" weight="bold" class="ml-1" />
            إضافة موظف
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
                <PhUsersThree :size="24" weight="duotone" color="white" />
              </div>
            </div>
            <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">
              إجمالي الموظفين
            </p>
            <h2 class="text-h4 font-weight-bold mb-1" style="color: var(--t-text);">
              {{ staff.length }}
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
              نشط
            </p>
            <h2 class="text-h4 font-weight-bold mb-1" style="color: var(--t-text);">
              {{ activeCount }}
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
              <div style="width: 48px; height: 48px; border-radius: 10px; background: #FEE2E2; display: flex; align-items: center; justify-content: center;">
                <PhShield :size="24" weight="duotone" color="#DC2626" />
              </div>
            </div>
            <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">
              أدمن
            </p>
            <h2 class="text-h4 font-weight-bold mb-1" style="color: var(--t-text);">
              {{ roleCount('admin') }}
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
                <PhCashRegister :size="24" weight="duotone" color="white" />
              </div>
            </div>
            <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500;">
              كاشير
            </p>
            <h2 class="text-h4 font-weight-bold mb-1" style="color: var(--t-text);">
              {{ roleCount('cashier') }}
            </h2>
          </v-card>
        </v-col>
      </v-row>

      <!-- Staff Table -->
      <v-card
        elevation="0"
        style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;"
      >
        <v-card-text class="pa-4">
          <v-text-field
            v-model="search"
            label="بحث..."
            single-line
            hide-details
            variant="outlined"
            density="comfortable"
            style="max-width: 400px; margin-bottom: 16px;"
          >
            <template v-slot:prepend-inner>
              <PhMagnifyingGlass :size="20" weight="bold" color="#6B7280" />
            </template>
          </v-text-field>
        </v-card-text>
        <v-data-table
          :headers="headers"
          :items="staff"
          :search="search"
          :items-per-page="10"
          :loading="loading.staff"
          class="staff-table"
        >
            <template v-slot:item.role="{ item }">
              <v-chip :color="getRoleColor(item.role)" size="small">
                {{ getRoleText(item.role) }}
              </v-chip>
            </template>

            <template v-slot:item.isActive="{ item }">
              <v-chip :color="item.isActive ? 'success' : 'error'" size="small">
                {{ item.isActive ? 'نشط' : 'غير نشط' }}
              </v-chip>
            </template>

            <template v-slot:item.salary="{ item }">
              <span style="color: #046375; font-weight: 600;">
                {{ Number(item.salary || 0).toLocaleString() }} د.ع
              </span>
            </template>

            <template v-slot:item.hireDate="{ item }">
              {{ formatDate(item.hireDate) }}
            </template>

            <template v-slot:item.lastLogin="{ item }">
              {{ item.lastLogin ? formatDate(item.lastLogin) : '-' }}
            </template>

            <template v-slot:item.actions="{ item }">
              <v-btn
                icon
                size="small"
                variant="text"
                color="primary"
                @click="editStaff(item)"
                title="تعديل"
              >
                <PhPencilSimple :size="20" weight="bold" />
              </v-btn>
              <v-btn
                icon
                size="small"
                variant="text"
                color="error"
                @click="deleteStaff(item)"
                title="حذف"
              >
                <PhTrash :size="20" weight="bold" />
              </v-btn>
            </template>
          </v-data-table>
        </v-card>
    </v-container>

    <!-- Add/Edit Staff Dialog -->
    <v-dialog v-model="showAddDialog" max-width="700" persistent>
      <v-card elevation="0" style="border-radius: 16px; overflow: hidden;">
        <!-- Header -->
        <div style="background: #046375; padding: 24px;">
          <div class="d-flex align-center">
            <div style="width: 48px; height: 48px; border-radius: 10px; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; margin-left: 12px;">
              <PhUserCirclePlus v-if="!editingItem" :size="24" weight="bold" color="white" />
              <PhUserCircleGear v-else :size="24" weight="bold" color="white" />
            </div>
            <div>
              <h3 class="text-h6 font-weight-bold text-white mb-1">
                {{ editingItem ? 'تعديل موظف' : 'إضافة موظف جديد' }}
              </h3>
              <p class="text-body-2 text-white mb-0" style="opacity: 0.9;">
                {{ editingItem ? 'تحديث معلومات الموظف' : 'إضافة موظف جديد إلى النظام' }}
              </p>
            </div>
          </div>
        </div>

        <v-card-text class="pa-6" style="background: var(--t-surface);">
          <!-- Basic Information Section -->
          <div class="text-h6 font-weight-bold mb-4" style="color: var(--t-text);">
            المعلومات الشخصية
          </div>
          
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="staffForm.fullName"
                label="الاسم الكامل"
                variant="outlined"
                :rules="[rules.required]"
                density="comfortable"
                color="#046375"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="staffForm.email"
                label="البريد الإلكتروني"
                type="email"
                variant="outlined"
                :rules="[rules.required, rules.email]"
                density="comfortable"
                color="#046375"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="staffForm.phone"
                label="رقم الهاتف"
                variant="outlined"
                :rules="[rules.required]"
                density="comfortable"
                color="#046375"
              />
            </v-col>
          </v-row>

          <!-- Security Section -->
          <div class="text-h6 font-weight-bold mb-4 mt-6" style="color: var(--t-text);">
            الأمان والصلاحيات
          </div>
          
          <v-row>
            <v-col cols="12" md="6" v-if="!editingItem">
              <v-text-field
                v-model="staffForm.password"
                label="كلمة المرور"
                type="password"
                variant="outlined"
                :rules="[rules.required]"
                density="comfortable"
                color="#046375"
              />
            </v-col>
            <v-col cols="12" :md="editingItem ? 12 : 6">
              <v-select
                v-model="staffForm.role"
                :items="roles"
                label="الدور الوظيفي"
                variant="outlined"
                :rules="[rules.required]"
                density="comfortable"
                color="#046375"
              />
            </v-col>
          </v-row>

          <!-- Employment Details Section -->
          <div class="text-h6 font-weight-bold mb-4 mt-6" style="color: var(--t-text);">
            تفاصيل التوظيف
          </div>
          
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="staffForm.hireDate"
                label="تاريخ التوظيف"
                type="date"
                variant="outlined"
                density="comfortable"
                color="#046375"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="staffForm.salary"
                label="الراتب الشهري"
                type="number"
                step="1000"
                suffix="د.ع"
                variant="outlined"
                density="comfortable"
                color="#046375"
              />
            </v-col>
            <v-col cols="12">
              <v-switch
                v-model="staffForm.isActive"
                color="#046375"
                label="الموظف نشط"
                hide-details
                inset
              />
            </v-col>
          </v-row>
        </v-card-text>
        
        <v-divider />
        <v-card-actions class="pa-4" style="background: var(--t-surface-high);">
          <v-btn
            variant="text"
            size="large"
            @click="cancelDialog"
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
            @click="saveStaff"
            :loading="saving"
            style="border-radius: 8px;"
          >
            <PhFloppyDisk :size="20" weight="bold" class="ml-1" />
            {{ editingItem ? 'حفظ التعديلات' : 'إضافة الموظف' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { staffAPI, authAPI } from '@/services/api'
import { useToast } from 'vue-toastification'
import AppLayout from '@/components/AppLayout.vue'
import { 
  PhMagnifyingGlass, PhPencilSimple, PhTrash,
  PhUsersThree, PhCheckCircle, PhShield, PhCashRegister,
  PhUserPlus, PhDotsThreeVertical, PhDownload, PhPrinter, PhArrowClockwise,
  PhUserCirclePlus, PhUserCircleGear, PhX, PhFloppyDisk
} from '@phosphor-icons/vue'
import { formatDate } from '@/utils/dateFormatter'
import { useAuthStore } from '@/stores/auth'
import { formatCurrentDateArabic } from '@/utils/dateFormatter'
import logoImg from '@/assets/logo.png'

const toast = useToast()
const authStore = useAuthStore()

const currentDate = computed(() => {
  return formatCurrentDateArabic()
})

const staff = ref([])
const search = ref('')
const showAddDialog = ref(false)
const editingItem = ref(null)
const saving = ref(false)
const loading = ref({
  staff: false
})

const staffForm = ref({
  fullName: '',
  email: '',
  phone: '',
  password: '',
  role: 'cashier',
  hireDate: new Date().toISOString().split('T')[0],
  salary: 0,
  isActive: true
})

const roles = [
  { value: 'admin', title: 'أدمن' },
  { value: 'cashier', title: 'كاشير' },
  { value: 'kitchen', title: 'مطبخ' },
  { value: 'waiter', title: 'نادل' },
  { value: 'supervisor', title: 'مسؤول' },
  { value: 'bartender', title: 'البار' },
  { value: 'purchases', title: 'مشتريات' },
  { value: 'storage', title: 'مخزون' },
]

const headers = [
  { title: 'الاسم', key: 'fullName', align: 'start' },
  { title: 'البريد الإلكتروني', key: 'email' },
  { title: 'الهاتف', key: 'phone' },
  { title: 'الدور', key: 'role' },
  { title: 'الراتب', key: 'salary' },
  { title: 'تاريخ التوظيف', key: 'hireDate' },
  { title: 'آخر دخول', key: 'lastLogin' },
  { title: 'الحالة', key: 'isActive' },
  { title: 'إجراءات', key: 'actions', sortable: false }
]

const rules = {
  required: value => !!value || 'مطلوب',
  email: value => /.+@.+\..+/.test(value) || 'بريد إلكتروني غير صحيح'
}

const activeCount = computed(() => 
  staff.value.filter(s => s.isActive).length
)

const roleCount = (role) => {
  return staff.value.filter(s => s.role === role).length
}

const getRoleColor = (role) => {
  const colors = {
    admin: 'error',
    cashier: 'primary',
    kitchen: 'warning',
    waiter: 'info',
    purchases: 'success',
    storage: 'info'
  }
  return colors[role] || 'grey'
}

const getRoleText = (role) => {
  const texts = {
    admin: 'أدمن',
    supervisor: 'مشرف',
    cashier: 'كاشير',
    kitchen: 'مطبخ',
    waiter: 'نادل',
    purchases: 'مشتريات',
    storage: 'مخزون'
  }
  return texts[role] || role
}

// formatDate is now imported from utils/dateFormatter.js

const loadStaff = async () => {
  loading.value.staff = true
  try {
    const response = await staffAPI.getAll()
    staff.value = response.data
  } catch (error) {
    toast.error('فشل تحميل الموظفين')
    console.error(error)
  } finally {
    loading.value.staff = false
  }
}

const editStaff = (item) => {
  editingItem.value = item
  staffForm.value = { ...item }
  delete staffForm.value.password // Don't edit password here
  showAddDialog.value = true
}

const saveStaff = async () => {
  if (!staffForm.value.fullName || !staffForm.value.email) {
    toast.error('الاسم والبريد الإلكتروني مطلوبان')
    return
  }

  saving.value = true
  try {
    if (editingItem.value) {
      await staffAPI.update(editingItem.value.idStaff, staffForm.value)
      toast.success('تم تحديث الموظف')
    } else {
      if (!staffForm.value.password) {
        toast.error('كلمة المرور مطلوبة للموظف الجديد')
        saving.value = false
        return
      }
      await authAPI.register(staffForm.value)
      toast.success('تم إضافة الموظف')
    }
    await loadStaff()
    showAddDialog.value = false
    resetForm()
  } catch (error) {
    toast.error(error.response?.data?.message || 'فشل حفظ الموظف')
    console.error(error)
  } finally {
    saving.value = false
  }
}

const deleteStaff = async (item) => {
  if (!confirm(`حذف "${item.fullName}"?`)) return

  try {
    await staffAPI.delete(item.idStaff)
    toast.success('تم حذف الموظف')
    await loadStaff()
  } catch (error) {
    toast.error('فشل حذف الموظف')
    console.error(error)
  }
}

const resetForm = () => {
  staffForm.value = {
    fullName: '',
    email: '',
    phone: '',
    password: '',
    role: 'cashier',
    hireDate: new Date().toISOString().split('T')[0],
    salary: 0,
    isActive: true
  }
  editingItem.value = null
}

const cancelDialog = () => {
  showAddDialog.value = false
  resetForm()
}

// Header action methods
const exportToExcel = () => {
  toast.info('تصدير Excel - قريباً')
}

const printReport = () => {
  toast.info('طباعة القائمة - قريباً')
}

onMounted(() => {
  loadStaff()
})
</script>

<style scoped>
.staff-table :deep(.v-data-table__thead) {
  background: var(--t-surface-high);
}

.staff-table :deep(.v-data-table__thead th) {
  color: var(--t-text-dim) !important;
  font-weight: 600 !important;
  font-size: 0.875rem !important;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.staff-table :deep(.v-data-table__tbody tr) {
  border-bottom: 1px solid var(--t-border-subtle);
}

.staff-table :deep(.v-data-table__tbody tr:hover) {
  background: var(--t-surface-high) !important;
}
</style>
