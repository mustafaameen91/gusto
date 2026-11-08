<template>
  <AppLayout>
    <v-container fluid class="pa-6">
      <!-- Elegant Welcome Banner -->
      <v-row class="mb-6">
        <v-col cols="12">
          <v-card class="pa-6 page-banner" elevation="0">
            <!-- Subtle decorative elements -->
            <div style="position: absolute; top: -40px; right: -40px; width: 160px; height: 160px; border-radius: 50%; background: rgba(255, 255, 255, 0.08)"></div>
            <div style="position: absolute; bottom: -30px; left: -30px; width: 120px; height: 120px; border-radius: 50%; background: rgba(255, 255, 255, 0.08)"></div>

            <div class="d-flex align-center justify-space-between flex-wrap" style="position: relative; z-index: 2">
              <div class="d-flex align-center flex-wrap">
                <v-avatar size="80" class="ml-6 elevation-4" color="white" style="border-radius: 12px">
                  <img :src="logoImg" alt="جوستو" style="width: 100%; height: 100%; object-fit: contain; padding: 8px" />
                </v-avatar>
                <div class="flex-grow-1">
                  <h1 class="text-h4 font-weight-bold text-white mb-2" style="letter-spacing: -0.5px">إدارة المصروفات</h1>
                  <p class="text-body-1 text-white mb-1" style="opacity: 0.95">تسجيل ومتابعة جميع المصروفات اليومية</p>
                  <p class="text-body-2 text-white" style="opacity: 0.85">
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
          <v-btn @click="openAddDialog" color="#046375" variant="flat" size="large" style="border-radius: 12px">
            <PhPlus :size="20" weight="bold" class="ml-1" />
            إضافة مصروف جديد
          </v-btn>
        </div>
        <div class="d-flex ga-2">
          <v-text-field v-model="filters.startDate" label="من" type="date" variant="outlined" density="comfortable" style="min-width: 220px" @update:model-value="loadExpenses" />
          <v-text-field v-model="filters.endDate" label="إلى" type="date" variant="outlined" density="comfortable" style="min-width: 220px" @update:model-value="loadExpenses" />
          <v-select
            v-model="filters.category"
            :items="categoryOptions"
            item-title="displayName"
            item-value="name"
            label="الفئة"
            variant="outlined"
            density="comfortable"
            clearable
            style="min-width: 250px"
            @update:model-value="loadExpenses"
          />
          <v-autocomplete
            v-model="filters.supplierId"
            :items="suppliers"
            item-title="supplierName"
            item-value="idSupplier"
            label="المورد"
            variant="outlined"
            density="comfortable"
            clearable
            style="min-width: 220px"
            @update:model-value="loadExpenses"
          />
        </div>
      </div>

      <!-- Stats Cards -->
      <v-row class="mb-6">
        <v-col cols="12" sm="6" lg="3">
          <v-card elevation="0" style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px" class="pa-5">
            <div class="d-flex align-center justify-space-between mb-4">
              <div style="width: 48px; height: 48px; border-radius: 10px; background: #ef4444; display: flex; align-items: center; justify-content: center">
                <PhReceipt :size="24" weight="duotone" color="white" />
              </div>
            </div>
            <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500">إجمالي المصروفات</p>
            <h2 v-if="!loading.stats" class="text-h4 font-weight-bold mb-1" style="color: var(--t-text)">{{ Number(stats.totalExpenses || 0).toLocaleString() }} د.ع</h2>
            <v-skeleton-loader v-else type="text" width="120" />
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" lg="3">
          <v-card elevation="0" style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px" class="pa-5">
            <div class="d-flex align-center justify-space-between mb-4">
              <div style="width: 48px; height: 48px; border-radius: 10px; background: #046375; display: flex; align-items: center; justify-content: center">
                <PhList :size="24" weight="duotone" color="white" />
              </div>
            </div>
            <p class="text-body-2 mb-2" style="color: var(--t-text-dim); font-weight: 500">عدد المصروفات</p>
            <h2 v-if="!loading.stats" class="text-h4 font-weight-bold mb-1" style="color: var(--t-text)">
              {{ expenses.length }}
            </h2>
            <v-skeleton-loader v-else type="text" width="60" />
          </v-card>
        </v-col>
      </v-row>

      <!-- Expenses Table -->
      <v-card elevation="0" style="background: var(--t-surface); border: 1px solid var(--t-border); border-radius: 12px">
        <v-card-title class="pa-4" style="border-bottom: 1px solid var(--t-border-subtle)">
          <div class="text-h6 font-weight-bold" style="color: var(--t-text)">قائمة المصروفات</div>
        </v-card-title>
        <v-data-table :headers="headers" :items="expenses" :items-per-page="15" :loading="loading.expenses" density="comfortable" class="expenses-table">
          <template v-slot:item.expenseDate="{ item }">
            <span style="color: var(--t-text-dim)">
              {{ formatDate(item.expenseDate) }}
            </span>
          </template>
          <template v-slot:item.category="{ item }">
            <v-chip :color="getCategoryColor(item.category)" size="small" variant="flat" style="font-weight: 500">
              {{ categoryNameToArabic(item.category) || item.category }}
            </v-chip>
          </template>
          <template v-slot:item.paidFromAccountName="{ item }">
            <span style="color: var(--t-text-dim)">
              {{ item.paidFromAccountName ? `${item.paidFromAccountCode || ""} - ${item.paidFromAccountName}` : "—" }}
            </span>
          </template>
          <template v-slot:item.supplierName="{ item }">
            <span style="color: var(--t-text-dim)">{{ getSupplierName(item.supplierId) || "—" }}</span>
          </template>
          <template v-slot:item.amount="{ item }">
            <span style="color: #ef4444; font-weight: 600"> {{ Number(item.amount || 0).toLocaleString() }} د.ع </span>
          </template>
          <template v-slot:item.photoUrl="{ item }">
            <v-avatar v-if="item.photoUrl" size="60" rounded="lg" @click="viewPhoto(item.photoUrl)" style="cursor: pointer">
              <v-img :src="getImageUrl(item.photoUrl)" cover />
            </v-avatar>
            <span v-else style="color: #9ca3af">-</span>
          </template>
          <template v-slot:item.actions="{ item }">
            <div class="d-flex ga-2">
              <v-tooltip text="رفع صورة" location="top">
                <template v-slot:activator="{ props }">
                  <v-btn v-bind="props" icon size="small" variant="text" @click="openPhotoUploadDialog(item)" aria-label="رفع صورة الإيصال">
                    <PhCamera :size="18" weight="bold" color="#6B7280" />
                  </v-btn>
                </template>
              </v-tooltip>
              <v-tooltip text="تعديل" location="top">
                <template v-slot:activator="{ props }">
                  <v-btn v-bind="props" icon size="small" variant="text" @click="editExpense(item)" aria-label="تعديل المصروف">
                    <PhPencilSimple :size="18" weight="bold" color="#046375" />
                  </v-btn>
                </template>
              </v-tooltip>
              <v-tooltip text="حذف" location="top">
                <template v-slot:activator="{ props }">
                  <v-btn v-bind="props" icon size="small" variant="text" @click="deleteExpense(item)" aria-label="حذف المصروف">
                    <PhTrash :size="18" weight="bold" color="#EF4444" />
                  </v-btn>
                </template>
              </v-tooltip>
            </div>
          </template>
        </v-data-table>
      </v-card>

      <!-- Add/Edit Dialog - Redesigned -->
      <v-dialog v-model="dialog" max-width="560px" persistent content-class="expense-dialog" transition="dialog-bottom-transition">
        <v-card class="overflow-hidden" style="border-radius: 20px; box-shadow: 0 24px 48px rgba(0, 0, 0, 0.12)">
          <!-- Header with gradient -->
          <div class="expense-dialog-header pa-6" style="background: linear-gradient(135deg, #046375 0%, #1F7F90 100%); position: relative">
            <div style="position: absolute; top: -20px; right: -20px; width: 100px; height: 100px; border-radius: 50%; background: rgba(255, 255, 255, 0.08)"></div>
            <div class="d-flex align-center gap-3" style="position: relative; z-index: 1">
              <div style="width: 56px; height: 56px; border-radius: 16px; background: rgba(255, 255, 255, 0.2); display: flex; align-items: center; justify-content: center">
                <PhReceipt :size="28" weight="duotone" color="white" />
              </div>
              <div>
                <h2 class="text-h5 font-weight-bold text-white mb-0">
                  {{ editingExpense ? "تعديل مصروف" : "إضافة مصروف جديد" }}
                </h2>
                <p class="text-body-2 text-white mb-0" style="opacity: 0.9">
                  {{ editingExpense ? "تحديث تفاصيل المصروف" : "سجّل مصروفاً وربطه بالحسابات" }}
                </p>
              </div>
            </div>
          </div>
          <v-card-text class="pa-6 pt-5">
            <v-form ref="formRef">
              <!-- Section: التاريخ والفئة -->
              <div class="mb-5">
                <p class="text-overline mb-3" style="color: var(--t-text-dim); font-weight: 600; letter-spacing: 0.5px">التاريخ والفئة</p>
                <v-row dense>
                  <v-col cols="12" sm="6">
                    <v-text-field
                      v-model="expenseForm.expenseDate"
                      label="تاريخ المصروف"
                      type="date"
                      variant="outlined"
                      density="comfortable"
                      hide-details="auto"
                      :rules="[(v) => !!v || 'تاريخ المصروف مطلوب']"
                      required
                      style="border-radius: 12px"
                      class="expense-field"
                    />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <div class="d-flex align-center gap-2">
                      <v-select
                        v-model="expenseForm.expenseCategoryId"
                        :items="categoryOptionsWithId"
                        item-title="displayName"
                        item-value="idExpenseCategory"
                        label="فئة المصروف"
                        variant="outlined"
                        density="comfortable"
                        hide-details="auto"
                        :rules="[(v) => (v != null && v !== '') || 'فئة المصروف مطلوبة']"
                        required
                        class="flex-grow-1 expense-field"
                        style="border-radius: 12px"
                        @update:model-value="onExpenseCategorySelect"
                      />
                      <v-btn variant="tonal" size="small" color="#046375" style="border-radius: 10px; min-width: 44px" @click="showAddCategoryDialog = true" icon aria-label="إضافة فئة مصروف" title="إضافة فئة مصروف">
                        <PhPlus :size="20" weight="bold" />
                      </v-btn>
                    </div>
                  </v-col>
                </v-row>
              </div>
              <!-- Section: المبلغ والدفع -->
              <div class="mb-5">
                <p class="text-overline mb-3" style="color: var(--t-text-dim); font-weight: 600; letter-spacing: 0.5px">المبلغ وطريقة الدفع</p>
                <v-row dense>
                  <v-col cols="12" sm="6">
                    <v-text-field
                      v-model.number="expenseForm.amount"
                      label="المبلغ (د.ع)"
                      type="number"
                      min="0"
                      step="0.01"
                      variant="outlined"
                      density="comfortable"
                      hide-details="auto"
                      :rules="[(v) => !!v || 'المبلغ مطلوب', (v) => v > 0 || 'المبلغ يجب أن يكون أكبر من صفر']"
                      required
                      class="expense-field"
                      style="border-radius: 12px"
                    />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-select
                      v-model="expenseForm.paidFromAccountId"
                      :items="paidFromAccountOptions"
                      item-title="label"
                      item-value="idAccount"
                      label="الدفع من حساب"
                      variant="outlined"
                      density="comfortable"
                      hide-details="auto"
                      :rules="[(v) => (v != null && v !== '') || 'حساب الدفع مطلوب']"
                      required
                      class="expense-field"
                      style="border-radius: 12px"
                    />
                  </v-col>
                </v-row>
              </div>
              <!-- Section: تفاصيل إضافية -->
              <div class="mb-4">
                <p class="text-overline mb-3" style="color: var(--t-text-dim); font-weight: 600; letter-spacing: 0.5px">تفاصيل إضافية</p>
                <v-row dense>
                  <v-col cols="12">
                    <v-autocomplete
                      v-model="expenseForm.supplierId"
                      :items="suppliers"
                      item-title="supplierName"
                      item-value="idSupplier"
                      label="المورد (لدفعة لمورد)"
                      variant="outlined"
                      density="comfortable"
                      clearable
                      hide-details
                      style="border-radius: 12px"
                    />
                  </v-col>
                  <v-col cols="12">
                    <v-text-field v-model="expenseForm.receiptNumber" label="رقم الإيصال (اختياري)" variant="outlined" density="comfortable" hide-details style="border-radius: 12px" />
                  </v-col>
                  <v-col cols="12">
                    <v-textarea v-model="expenseForm.description" label="الوصف أو الملاحظات" variant="outlined" density="comfortable" rows="2" hide-details style="border-radius: 12px" />
                  </v-col>
                </v-row>
              </div>
            </v-form>
          </v-card-text>
          <v-divider class="mx-6" />
          <v-card-actions class="pa-6">
            <v-spacer />
            <v-btn variant="text" size="large" style="color: var(--t-text-dim); font-weight: 600" @click="closeDialog"> إلغاء </v-btn>
            <v-btn color="#046375" variant="flat" size="large" style="border-radius: 12px; padding-inline: 24px; font-weight: 600" @click="saveExpense">
              {{ editingExpense ? "حفظ التعديلات" : "إضافة المصروف" }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Photo Upload Dialog -->
      <v-dialog v-model="showPhotoDialog" max-width="500px" persistent>
        <v-card>
          <v-card-title class="pa-5" style="border-bottom: 1px solid var(--t-border-subtle)">
            <span class="text-h6 font-weight-bold" style="color: var(--t-text)">
              {{ selectedExpenseForPhoto ? "إضافة/تحديث صورة الإيصال" : "إضافة صورة الإيصال" }}
            </span>
          </v-card-title>
          <v-card-text class="pa-5">
            <div class="text-center mb-4">
              <v-avatar v-if="imagePreview" size="200" rounded="lg" class="mb-4">
                <v-img :src="imagePreview" cover />
              </v-avatar>
              <div
                v-else
                class="mb-4"
                style="height: 200px; display: flex; align-items: center; justify-content: center; border: 2px dashed #e5e7eb; border-radius: 12px; background: var(--t-surface-high)"
              >
                <div>
                  <PhCamera :size="48" weight="light" color="#9CA3AF" />
                  <p class="text-body-2 text-grey mt-2">لا توجد صورة</p>
                </div>
              </div>
            </div>
            <v-file-input
              v-model="photoForm.imageFile"
              accept="image/*"
              variant="outlined"
              density="comfortable"
              prepend-icon=""
              @update:model-value="onPhotoSelect"
              hide-details
              rounded
              label="اختر صورة الإيصال"
            >
              <template v-slot:prepend>
                <PhCamera :size="20" weight="bold" color="#046375" />
              </template>
            </v-file-input>
            <div v-if="imagePreview" class="mt-3 text-center">
              <v-btn @click="clearPhoto" size="small" variant="text" color="error">
                <PhX :size="16" weight="bold" class="ml-1" />
                إزالة الصورة
              </v-btn>
            </div>
          </v-card-text>
          <v-card-actions class="pa-5">
            <v-spacer />
            <v-btn variant="text" @click="skipPhoto"> تخطي </v-btn>
            <v-btn color="#046375" variant="flat" @click="savePhoto" :disabled="!photoForm.imageFile"> حفظ </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Add new expense category (requires default GL account) -->
      <v-dialog v-model="showAddCategoryDialog" max-width="480" persistent>
        <v-card>
          <v-card-title>إضافة فئة مصروف جديدة</v-card-title>
          <v-card-text>
            <v-text-field v-model="newCategoryName" label="اسم الفئة" variant="outlined" class="mb-3" autofocus @keydown.enter="saveNewCategory" />
            <v-select
              v-model="newCategoryDefaultAccountId"
              :items="accountOptionsForCategory"
              item-title="label"
              item-value="idAccount"
              label="حساب المصروف الافتراضي (دليل الحسابات)"
              variant="outlined"
              :rules="[(v) => (v != null && v !== '') || 'حساب المصروف الافتراضي مطلوب']"
            />
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="showAddCategoryDialog = false">إلغاء</v-btn>
            <v-btn color="#046375" variant="flat" :loading="savingCategory" @click="saveNewCategory">إضافة</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useToast } from "vue-toastification";
import AppLayout from "@/components/AppLayout.vue";
import logoImg from "@/assets/logo.png";
import { expenseAPI, expenseCategoryAPI, accountAPI, supplierAPI } from "@/services/api";
import { formatDate, formatCurrentDateArabic, todayBusinessDate, dateInputValue } from "@/utils/dateFormatter";
import { PhPlus, PhReceipt, PhList, PhPencilSimple, PhTrash, PhCamera, PhX } from "@phosphor-icons/vue";

const toast = useToast();
const route = useRoute();
const authStore = useAuthStore();

const currentDate = computed(() => {
  return formatCurrentDateArabic();
});

const expenses = ref([]);
const dialog = ref(false);
const showPhotoDialog = ref(false);
const editingExpense = ref(null);
const selectedExpenseForPhoto = ref(null);
const formRef = ref(null);
const loading = ref({
  expenses: false,
  stats: false,
});

const defaultCategoryNames = ["مستلزمات", "مرافق", "صيانة", "إيجار", "رواتب", "أخرى"];
const expenseCategories = ref([...defaultCategoryNames]);
const accounts = ref([]);

const categoryOptions = computed(() => {
  const list = expenseCategories.value || [];
  if (Array.isArray(list) && list.length > 0) {
    const first = list[0];
    if (typeof first === "object" && first?.name) {
      return list.map((c) => ({ ...c, displayName: categoryNameToArabic(c.name) || c.name }));
    }
  }
  return list.map((c) => ({ name: c, displayName: typeof c === "object" ? categoryNameToArabic(c?.name) || c?.name || c : c, idExpenseCategory: null }));
});

// Only categories from API (with idExpenseCategory) for GL posting; display name in Arabic
const categoryOptionsWithId = computed(() => {
  const list = expenseCategories.value || [];
  if (!Array.isArray(list) || list.length === 0) return [];
  const first = list[0];
  if (typeof first !== "object" || !first?.idExpenseCategory) return [];
  return list.map((c) => ({
    ...c,
    name: c.name,
    displayName: categoryNameToArabic(c.name) || c.name,
  }));
});

// Map account type to Arabic for display
const accountTypeToArabic = (type) => {
  const map = { ASSET: "أصول", LIABILITY: "التزامات", EQUITY: "حقوق ملكية", REVENUE: "إيرادات", EXPENSE: "مصروفات", COST: "تكلفة" };
  return type ? map[String(type).toUpperCase()] || type : "";
};

// Accounts for "paid from" (cash/bank) - prefer ASSET
const paidFromAccountOptions = computed(() => {
  const list = accounts.value || [];
  const asset = list.filter((a) => (a.accountType || "").toUpperCase() === "ASSET");
  return (asset.length ? asset : list).map((a) => {
    const typeAr = accountTypeToArabic(a.accountType);
    const namePart = `${a.accountCode || ""} - ${a.accountName || a.name || ""}`.trim() || String(a.idAccount);
    const label = typeAr ? `${typeAr}: ${namePart}` : namePart;
    return { idAccount: a.idAccount, label };
  });
});

// Accounts for expense category default account (EXPENSE type)
const accountOptionsForCategory = computed(() => {
  const list = accounts.value || [];
  return list.map((a) => {
    const typeAr = accountTypeToArabic(a.accountType);
    const namePart = `${a.accountCode || ""} - ${a.accountName || a.name || ""}`.trim() || String(a.idAccount);
    const label = typeAr ? `${typeAr}: ${namePart}` : namePart;
    return { idAccount: a.idAccount, label };
  });
});

const showAddCategoryDialog = ref(false);
const newCategoryName = ref("");
const newCategoryDefaultAccountId = ref(null);
const savingCategory = ref(false);

function onExpenseCategorySelect(id) {
  const item = categoryOptionsWithId.value.find((c) => c.idExpenseCategory === id);
  if (item?.name) expenseForm.value.category = item.name;
}

async function loadExpenseCategories() {
  try {
    const res = await expenseCategoryAPI.getAll();
    const list = res.data || [];
    if (Array.isArray(list) && list.length > 0) {
      expenseCategories.value = list;
      return;
    }
  } catch (_) {
    // no table or API error: keep default names
  }
  expenseCategories.value = defaultCategoryNames.map((c) => ({ name: c, idExpenseCategory: null }));
}

async function loadAccounts() {
  try {
    const res = await accountAPI.getAll();
    accounts.value = res.data || [];
  } catch (_) {
    accounts.value = [];
  }
}

async function saveNewCategory() {
  const name = (newCategoryName.value || "").trim();
  if (!name) {
    toast.error("أدخل اسم الفئة");
    return;
  }
  if (newCategoryDefaultAccountId.value == null || newCategoryDefaultAccountId.value === "") {
    toast.error("اختر حساب المصروف الافتراضي من دليل الحسابات");
    return;
  }
  savingCategory.value = true;
  try {
    await expenseCategoryAPI.create({ name, defaultAccountId: newCategoryDefaultAccountId.value });
    toast.success("تمت إضافة الفئة");
    await loadExpenseCategories();
    const newCat = expenseCategories.value.find((c) => c.name === name);
    if (newCat?.idExpenseCategory) {
      expenseForm.value.expenseCategoryId = newCat.idExpenseCategory;
      expenseForm.value.category = name;
    }
    showAddCategoryDialog.value = false;
    newCategoryName.value = "";
    newCategoryDefaultAccountId.value = null;
  } catch (e) {
    toast.error(e.response?.data?.message || "فشل إضافة الفئة");
  } finally {
    savingCategory.value = false;
  }
}

const filters = ref({
  startDate: todayBusinessDate(),
  endDate: todayBusinessDate(),
  category: null,
  supplierId: null,
});
const suppliers = ref([]);

const stats = ref({
  totalExpenses: 0,
});

const expenseForm = ref({
  expenseDate: todayBusinessDate(),
  category: "",
  expenseCategoryId: null,
  paidFromAccountId: null,
  supplierId: null,
  amount: 0,
  description: "",
  receiptNumber: "",
});

const photoForm = ref({
  imageFile: null,
});

const imagePreview = ref(null);

const headers = [
  { title: "التاريخ", key: "expenseDate", align: "start" },
  { title: "الفئة", key: "category" },
  { title: "حساب الدفع", key: "paidFromAccountName" },
  { title: "المورد", key: "supplierName", sortable: false },
  { title: "المبلغ", key: "amount" },
  { title: "الوصف", key: "description" },
  { title: "رقم الإيصال", key: "receiptNumber" },
  { title: "الصورة", key: "photoUrl", sortable: false, align: "center", width: "100px" },
  { title: "سجل بواسطة", key: "recordedByName" },
  { title: "الإجراءات", key: "actions", sortable: false },
];

const getSupplierName = (supplierId) => {
  if (supplierId == null) return "";
  const s = suppliers.value.find((x) => x.idSupplier === supplierId);
  return s ? s.supplierName || "" : "";
};

// Display category name in Arabic (map common English backend names if any)
const categoryNameToArabic = (name) => {
  const map = {
    Supplies: "مستلزمات",
    Utilities: "مرافق",
    Maintenance: "صيانة",
    Rent: "إيجار",
    Salaries: "رواتب",
    Other: "أخرى",
    Miscellaneous: "أخرى",
    Expenses: "مصروفات",
  };
  return name ? map[String(name)] || name : "";
};

const getCategoryColor = (category) => {
  const colors = {
    مستلزمات: "blue",
    مرافق: "orange",
    صيانة: "red",
    إيجار: "purple",
    رواتب: "green",
    أخرى: "grey",
    Supplies: "blue",
    Utilities: "orange",
    Maintenance: "red",
    Rent: "purple",
    Salaries: "green",
    Other: "grey",
  };
  return colors[category] || "grey";
};

const getImageUrl = (photoUrl) => {
  if (!photoUrl) return null;
  if (photoUrl.startsWith("http")) return photoUrl;
  // Images are served from backend at /uploads
  // Same origin in development (Vite proxies /uploads) and production
  const apiBase = import.meta.env.VITE_API_URL || window.location.origin;
  // Remove /api from base URL since /uploads is served directly
  const base = apiBase.replace("/api", "");
  return `${base}${photoUrl}`;
};

const viewPhoto = (photoUrl) => {
  if (!photoUrl) return;
  const fullUrl = getImageUrl(photoUrl);
  window.open(fullUrl, "_blank");
};

const loadSuppliers = async () => {
  try {
    const res = await supplierAPI.getAll();
    suppliers.value = res.data || [];
  } catch {
    suppliers.value = [];
  }
};

const loadExpenses = async () => {
  loading.value.expenses = true;
  loading.value.stats = true;
  try {
    const params = {
      startDate: filters.value.startDate,
      endDate: filters.value.endDate,
    };
    if (filters.value.category) params.category = filters.value.category;
    if (filters.value.supplierId) params.supplierId = filters.value.supplierId;

    const response = await expenseAPI.getAll(params);
    expenses.value = response.data || [];

    // Calculate total
    stats.value.totalExpenses = expenses.value.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
  } catch (error) {
    toast.error(error.response?.data?.message || "فشل تحميل المصروفات");
    console.error(error);
  } finally {
    loading.value.expenses = false;
    loading.value.stats = false;
  }
};

const openAddDialog = () => {
  editingExpense.value = null;
  const supplierId = route.query.supplierId ? Number(route.query.supplierId) : null;
  expenseForm.value = {
    expenseDate: todayBusinessDate(),
    category: "",
    expenseCategoryId: null,
    paidFromAccountId: null,
    supplierId: supplierId || null,
    amount: 0,
    description: "",
    receiptNumber: "",
  };
  dialog.value = true;
};

const editExpense = (expense) => {
  editingExpense.value = expense;
  expenseForm.value = {
    expenseDate: dateInputValue(expense.expenseDate),
    category: expense.category || "",
    expenseCategoryId: expense.expenseCategoryId ?? null,
    paidFromAccountId: expense.paidFromAccountId ?? null,
    supplierId: expense.supplierId ?? null,
    amount: expense.amount,
    description: expense.description || "",
    receiptNumber: expense.receiptNumber || "",
  };
  dialog.value = true;
};

const closeDialog = () => {
  dialog.value = false;
  editingExpense.value = null;
  formRef.value?.reset();
};

const onPhotoSelect = (fileInput) => {
  if (!fileInput) {
    imagePreview.value = null;
    return;
  }

  let file = null;
  if (fileInput instanceof File) {
    file = fileInput;
  } else if (Array.isArray(fileInput) && fileInput.length > 0) {
    file = fileInput[0];
  } else {
    return;
  }

  // Validate file type
  if (!file.type.startsWith("image/")) {
    toast.error("يرجى اختيار ملف صورة");
    photoForm.value.imageFile = null;
    return;
  }

  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    toast.error("حجم الصورة كبير جداً (الحد الأقصى 5MB)");
    photoForm.value.imageFile = null;
    return;
  }

  // Create preview
  const reader = new FileReader();
  reader.onload = (e) => {
    imagePreview.value = e.target.result;
  };
  reader.onerror = () => {
    toast.error("فشل قراءة الصورة");
  };
  reader.readAsDataURL(file);
};

const clearPhoto = () => {
  photoForm.value.imageFile = null;
  imagePreview.value = null;
};

const openPhotoUploadDialog = (expense) => {
  // Use expense directly from table to preserve original date format (like editExpense does)
  selectedExpenseForPhoto.value = { ...expense };
  // Ensure expenseDate is in YYYY-MM-DD format (extract first 10 chars if needed)
  selectedExpenseForPhoto.value.expenseDate = dateInputValue(selectedExpenseForPhoto.value.expenseDate);
  // Set preview to existing photo if available
  if (expense.photoUrl) {
    imagePreview.value = getImageUrl(expense.photoUrl);
  } else {
    imagePreview.value = null;
  }
  photoForm.value.imageFile = null;
  showPhotoDialog.value = true;
};

const skipPhoto = () => {
  showPhotoDialog.value = false;
  selectedExpenseForPhoto.value = null;
  photoForm.value.imageFile = null;
  imagePreview.value = null;
  loadExpenses();
};

const savePhoto = async () => {
  if (!selectedExpenseForPhoto.value) {
    skipPhoto();
    return;
  }

  if (!photoForm.value.imageFile) {
    skipPhoto();
    return;
  }

  try {
    const formData = new FormData();
    const file = photoForm.value.imageFile instanceof File ? photoForm.value.imageFile : Array.isArray(photoForm.value.imageFile) ? photoForm.value.imageFile[0] : null;

    if (!file) {
      skipPhoto();
      return;
    }

    formData.append("image", file);
    const uploadResponse = await expenseAPI.uploadImage(formData);
    const photoUrl = uploadResponse.data.imageUrl;

    // Update the expense with the photo URL
    // Ensure amount is a number and date is in YYYY-MM-DD format
    const expenseId = selectedExpenseForPhoto.value.idExpense || selectedExpenseForPhoto.value.id;
    // Use the expenseDate as-is (should already be in YYYY-MM-DD format from openPhotoUploadDialog)
    // Just ensure it's a string and take first 10 chars if needed
    const expenseDate = dateInputValue(selectedExpenseForPhoto.value.expenseDate);

    await expenseAPI.update(expenseId, {
      expenseDate: expenseDate,
      category: selectedExpenseForPhoto.value.category,
      amount: parseFloat(selectedExpenseForPhoto.value.amount) || 0,
      expenseCategoryId: selectedExpenseForPhoto.value.expenseCategoryId ?? null,
      paidFromAccountId: selectedExpenseForPhoto.value.paidFromAccountId ?? null,
      description: selectedExpenseForPhoto.value.description || null,
      receiptNumber: selectedExpenseForPhoto.value.receiptNumber || null,
      photoUrl: photoUrl,
      dailyReceiptId: selectedExpenseForPhoto.value.dailyReceiptId || null,
    });

    toast.success("تم إضافة الصورة بنجاح");
    skipPhoto();
  } catch (error) {
    toast.error(error.response?.data?.message || "فشل رفع الصورة");
    console.error("Error updating expense with photo:", error);
    console.error("Error response:", error.response?.data);
    console.error("Selected expense:", selectedExpenseForPhoto.value);
  }
};

const saveExpense = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  if (expenseForm.value.expenseCategoryId == null || expenseForm.value.paidFromAccountId == null) {
    toast.error("فئة المصروف وحساب الدفع مطلوبان للترحيل المحاسبي");
    return;
  }
  if (!expenseForm.value.category || !expenseForm.value.category.trim()) {
    toast.error("اسم الفئة مطلوب");
    return;
  }

  try {
    const expenseData = {
      expenseDate: expenseForm.value.expenseDate,
      category: expenseForm.value.category.trim(),
      expenseCategoryId: expenseForm.value.expenseCategoryId,
      paidFromAccountId: expenseForm.value.paidFromAccountId,
      amount: expenseForm.value.amount,
      description: expenseForm.value.description || "",
      receiptNumber: expenseForm.value.receiptNumber || "",
    };
    if (editingExpense.value?.dailyReceiptId != null) expenseData.dailyReceiptId = editingExpense.value.dailyReceiptId;
    if (expenseForm.value.supplierId != null) expenseData.supplierId = expenseForm.value.supplierId;

    if (editingExpense.value) {
      expenseData.photoUrl = editingExpense.value.photoUrl || null;
      await expenseAPI.update(editingExpense.value.idExpense, expenseData);
      toast.success("تم تحديث المصروف بنجاح");
      closeDialog();
      loadExpenses();
    } else {
      await expenseAPI.create(expenseData);
      toast.success("تم إضافة المصروف بنجاح");
      closeDialog();
      loadExpenses();
    }
  } catch (error) {
    toast.error(error.response?.data?.message || (editingExpense.value ? "فشل تحديث المصروف" : "فشل إضافة المصروف"));
    console.error(error);
  }
};

const deleteExpense = async (expense) => {
  if (!confirm(`هل أنت متأكد من حذف هذا المصروف؟`)) return;

  try {
    await expenseAPI.delete(expense.idExpense);
    toast.success("تم حذف المصروف بنجاح");
    loadExpenses();
  } catch (error) {
    toast.error(error.response?.data?.message || "فشل حذف المصروف");
    console.error(error);
  }
};

onMounted(async () => {
  loadExpenseCategories();
  loadAccounts();
  await loadSuppliers();
  const q = route.query.supplierId;
  if (q) {
    const id = Number(q);
    if (!Number.isNaN(id)) {
      filters.value.supplierId = id;
      await loadExpenses();
      openAddDialog();
      return;
    }
  }
  loadExpenses();
});
</script>

<style scoped>
.expenses-table :deep(.v-data-table__thead) {
  background: var(--t-surface-high);
}

.expenses-table :deep(.v-data-table__thead th) {
  color: var(--t-text-dim) !important;
  font-weight: 600 !important;
  font-size: 0.875rem !important;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.expenses-table :deep(.v-data-table__tbody tr) {
  border-bottom: 1px solid var(--t-border-subtle);
}

.expenses-table :deep(.v-data-table__tbody tr:hover) {
  background: var(--t-surface-high) !important;
}
</style>
