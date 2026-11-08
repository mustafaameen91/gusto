<template>
  <AppLayout>
    <v-container fluid class="pa-6">
      <v-row class="mb-6">
        <v-col cols="12">
          <v-card
            class="pa-6 page-banner"
            elevation="0"
          >
            <div class="d-flex align-center justify-space-between flex-wrap" style="position: relative; z-index: 2;">
              <div>
                <h1 class="text-h4 font-weight-bold text-white mb-2">العملاء (المدينون)</h1>
                <p class="text-body-1 text-white" style="opacity: 0.95;">العملاء الذين يشترون آجل — ما يستحق علينا منهم</p>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <div class="d-flex align-center justify-space-between mb-6 flex-wrap">
        <v-btn
          color="#046375"
          variant="flat"
          size="large"
          style="border-radius: 12px;"
          @click="openAddDialog"
        >
          <PhPlus :size="20" weight="bold" class="ml-1" />
          إضافة عميل
        </v-btn>
      </div>

      <v-card elevation="0" style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px;">
        <v-card-title class="pa-4" style="border-bottom: 1px solid var(--t-border-subtle);">
          <div class="d-flex align-center justify-space-between flex-wrap ga-3">
            <div class="text-h6 font-weight-bold" style="color: var(--t-text);">قائمة العملاء</div>
            <v-text-field
              v-model="search"
              placeholder="البحث بالاسم أو الهاتف..."
              variant="outlined"
              density="compact"
              hide-details
              clearable
              style="max-width: 280px;"
            >
              <template v-slot:prepend-inner>
                <PhMagnifyingGlass :size="20" weight="bold" color="var(--t-text-dim)" />
              </template>
            </v-text-field>
          </div>
        </v-card-title>
        <v-data-table
          :headers="headers"
          :items="filteredCustomers"
          :items-per-page="15"
          :loading="loading"
          density="comfortable"
        >
          <template v-slot:item.balance="{ item }">
            <span :style="{ color: Number(item.balance || 0) > 0 ? '#EF4444' : 'var(--t-text)', fontWeight: 600 }">
              {{ Number(item.balance || 0).toLocaleString() }} د.ع
            </span>
          </template>
          <template v-slot:item.actions="{ item }">
            <v-btn
              icon
              variant="text"
              size="small"
              color="#046375"
              @click="goToProfile(item.idCustomer)"
              aria-label="عرض ملف العميل"
              title="عرض ملف العميل"
            >
              <PhEye :size="18" weight="bold" />
            </v-btn>
          </template>
        </v-data-table>
      </v-card>

      <v-dialog v-model="addDialog" max-width="500" persistent>
        <v-card>
          <v-card-title class="pa-5" style="border-bottom: 1px solid var(--t-border-subtle);">إضافة عميل</v-card-title>
          <v-card-text class="pa-5">
            <v-form ref="formRef" v-model="valid">
              <v-text-field
                v-model="form.fullName"
                label="الاسم *"
                variant="outlined"
                density="comfortable"
                :rules="[v => !!v || 'الاسم مطلوب']"
              />
              <v-text-field
                v-model="form.phone"
                label="الهاتف"
                variant="outlined"
                density="comfortable"
              />
              <v-text-field
                v-model.number="form.creditLimit"
                label="حد الائتمان (د.ع)"
                type="number"
                variant="outlined"
                density="comfortable"
              />
              <v-textarea
                v-model="form.notes"
                label="ملاحظات"
                variant="outlined"
                density="comfortable"
                rows="2"
              />
            </v-form>
          </v-card-text>
          <v-card-actions class="pa-5">
            <v-spacer />
            <v-btn variant="text" @click="addDialog = false">إلغاء</v-btn>
            <v-btn color="#046375" variant="flat" :disabled="!valid" @click="saveCustomer">حفظ</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import AppLayout from '@/components/AppLayout.vue'
import { customerAPI } from '@/services/api'
import { PhPlus, PhEye, PhMagnifyingGlass } from '@phosphor-icons/vue'

const toast = useToast()
const router = useRouter()

const customers = ref([])
const loading = ref(false)
const search = ref('')
const addDialog = ref(false)
const formRef = ref(null)
const valid = ref(false)

const form = ref({
  fullName: '',
  phone: '',
  creditLimit: 0,
  notes: ''
})

const headers = [
  { title: 'الاسم', key: 'fullName', sortable: true },
  { title: 'الهاتف', key: 'phone' },
  { title: 'حد الائتمان', key: 'creditLimit', sortable: true },
  { title: 'المستحق علينا (رصيد)', key: 'balance', sortable: true },
  { title: 'الإجراءات', key: 'actions', sortable: false, width: '80px' }
]

const filteredCustomers = computed(() => {
  const list = customers.value || []
  const q = (search.value || '').trim().toLowerCase()
  if (!q) return list
  return list.filter(
    (c) =>
      (c.fullName || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q)
  )
})

function goToProfile(id) {
  router.push(`/customers/${id}`)
}

function openAddDialog() {
  form.value = { fullName: '', phone: '', creditLimit: 0, notes: '' }
  addDialog.value = true
}

async function saveCustomer() {
  const { valid: v } = await formRef.value.validate()
  if (!v) return
  try {
    await customerAPI.create(form.value)
    toast.success('تم إضافة العميل')
    addDialog.value = false
    loadCustomers()
  } catch (e) {
    toast.error(e.response?.data?.message || 'فشل إضافة العميل')
  }
}

async function loadCustomers() {
  loading.value = true
  try {
    const res = await customerAPI.getAll({ withBalance: true })
    customers.value = res.data || []
  } catch (e) {
    customers.value = []
    toast.error(e.response?.data?.message || 'فشل تحميل العملاء')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadCustomers()
})
</script>
