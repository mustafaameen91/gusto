<template>
  <AppLayout>
    <v-container fluid class="pa-6">
      <v-row class="mb-6">
        <v-col cols="12">
          <v-card elevation="0" class="pa-6 page-banner">
            <h1 class="text-h4 font-weight-bold text-white mb-1">إعدادات الترحيل</h1>
            <p class="text-white mb-0" style="opacity: 0.9;">ربط الحسابات بالمحاسبة (نقدي، مبيعات، مخزون، إلخ)</p>
          </v-card>
        </v-col>
      </v-row>
      <v-card elevation="0" style="border: 1px solid var(--t-border); border-radius: 12px;" class="pa-6">
        <v-alert v-if="!accounts.length" type="info" class="mb-4">
          أضف حسابات من «دليل الحسابات» أولاً ثم اختر الحساب المناسب لكل دور.
        </v-alert>
        <v-form v-else>
          <p class="text-overline mb-3" style="color: var(--t-text-dim); font-weight: 600;">أصول (نقدية وبنك)</p>
          <v-select
            v-model="settings.cashAccountId"
            :items="accounts"
            item-title="accountName"
            item-value="idAccount"
            label="حساب النقدية (صندوق)"
            variant="outlined"
            class="mb-4"
            clearable
          />
          <v-select
            v-model="settings.bankAccountId"
            :items="accounts"
            item-title="accountName"
            item-value="idAccount"
            label="حساب البنك"
            variant="outlined"
            class="mb-4"
            clearable
          />
          <p class="text-overline mb-3 mt-4" style="color: var(--t-text-dim); font-weight: 600;">مدينون ودائنون</p>
          <v-select
            v-model="settings.arAccountId"
            :items="accounts"
            item-title="accountName"
            item-value="idAccount"
            label="حساب المدينين (AR — مبيعات آجلة)"
            variant="outlined"
            class="mb-4"
            clearable
          />
          <v-select
            v-model="settings.apAccountId"
            :items="accounts"
            item-title="accountName"
            item-value="idAccount"
            label="حساب الدائنين (AP — مشتريات آجلة / موردين)"
            variant="outlined"
            class="mb-4"
            clearable
          />
          <p class="text-overline mb-3 mt-4" style="color: var(--t-text-dim); font-weight: 600;">إيرادات ومبيعات</p>
          <v-select
            v-model="settings.salesBeveragesAccountId"
            :items="accounts"
            item-title="accountName"
            item-value="idAccount"
            label="حساب مبيعات المشروبات"
            variant="outlined"
            class="mb-4"
            clearable
          />
          <v-select
            v-model="settings.salesDessertsAccountId"
            :items="accounts"
            item-title="accountName"
            item-value="idAccount"
            label="حساب مبيعات المأكولات (اختياري)"
            variant="outlined"
            class="mb-4"
            clearable
          />
          <v-select
            v-model="settings.otherIncomeAccountId"
            :items="accounts"
            item-title="accountName"
            item-value="idAccount"
            label="حساب إيرادات خارجية (افتراضي اختياري)"
            variant="outlined"
            class="mb-4"
            clearable
          />
          <p class="text-overline mb-3 mt-4" style="color: var(--t-text-dim); font-weight: 600;">تكلفة ومخزون</p>
          <v-select
            v-model="settings.cogsAccountId"
            :items="accounts"
            item-title="accountName"
            item-value="idAccount"
            label="حساب تكلفة المبيعات (COGS)"
            variant="outlined"
            class="mb-4"
            clearable
          />
          <v-select
            v-model="settings.inventoryAccountId"
            :items="accounts"
            item-title="accountName"
            item-value="idAccount"
            label="حساب المخزون"
            variant="outlined"
            class="mb-4"
            clearable
          />
          <v-select
            v-model="settings.wastageAccountId"
            :items="accounts"
            item-title="accountName"
            item-value="idAccount"
            label="حساب الهالك (اختياري)"
            variant="outlined"
            class="mb-4"
            clearable
          />
          <p class="text-overline mb-3 mt-4" style="color: var(--t-text-dim); font-weight: 600;">إكراميات</p>
          <v-select
            v-model="settings.tipsAccountId"
            :items="accounts"
            item-title="accountName"
            item-value="idAccount"
            label="حساب الإكراميات (اختياري)"
            variant="outlined"
            class="mb-4"
            clearable
          />
          <v-btn color="#046375" variant="flat" :loading="saving" @click="save">
            حفظ الإعدادات
          </v-btn>
        </v-form>
      </v-card>
    </v-container>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import AppLayout from '@/components/AppLayout.vue'
import { accountAPI, postingSettingsAPI } from '@/services/api'

const toast = useToast()
const loading = ref(false)
const saving = ref(false)
const accounts = ref([])
const settings = ref({
  cashAccountId: null,
  bankAccountId: null,
  arAccountId: null,
  apAccountId: null,
  salesBeveragesAccountId: null,
  salesDessertsAccountId: null,
  cogsAccountId: null,
  inventoryAccountId: null,
  wastageAccountId: null,
  tipsAccountId: null,
  otherIncomeAccountId: null
})

async function loadAccounts() {
  try {
    const res = await accountAPI.getAll()
    accounts.value = Array.isArray(res.data) ? res.data : []
  } catch (e) {
    toast.error('فشل تحميل الحسابات')
  }
}

async function loadSettings() {
  loading.value = true
  try {
    const res = await postingSettingsAPI.get()
    const data = res.data
    if (data) {
      settings.value = {
        cashAccountId: data.cashAccountId ?? null,
        bankAccountId: data.bankAccountId ?? null,
        arAccountId: data.arAccountId ?? null,
        apAccountId: data.apAccountId ?? null,
        salesBeveragesAccountId: data.salesBeveragesAccountId ?? null,
        salesDessertsAccountId: data.salesDessertsAccountId ?? null,
        cogsAccountId: data.cogsAccountId ?? null,
        inventoryAccountId: data.inventoryAccountId ?? null,
        wastageAccountId: data.wastageAccountId ?? null,
        tipsAccountId: data.tipsAccountId ?? null,
        otherIncomeAccountId: data.otherIncomeAccountId ?? null
      }
    }
  } catch (e) {
    if (e.response?.status !== 404) toast.error('فشل تحميل إعدادات الترحيل')
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  try {
    await postingSettingsAPI.update(settings.value)
    toast.success('تم حفظ إعدادات الترحيل')
  } catch (e) {
    toast.error(e.response?.data?.message || 'فشل الحفظ')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadAccounts()
  loadSettings()
})
</script>
