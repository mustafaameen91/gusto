<template>
  <AppLayout>
    <div class="pos">
      <!-- Daily Receipt Not Open Warning -->
      <div v-if="!isDailyReceiptOpen" class="pos-blocked">
        <div class="pos-blocked__card">
          <div class="pos-blocked__icon">
            <PhLockKeyOpen :size="40" weight="duotone" />
          </div>
          <h2 class="pos-blocked__title">الصندوق مغلق</h2>
          <p class="pos-blocked__desc">يجب فتح صندوق اليومية أولاً قبل البدء بالمبيعات</p>
          <router-link to="/daily-receipt" class="pos-blocked__btn">
            <PhLockKeyOpen :size="20" weight="bold" />
            فتح الصندوق
          </router-link>
        </div>
      </div>

      <template v-else>
        <!-- LEFT: Menu Panel -->
        <section class="pos-menu">
          <!-- Compact Header -->
          <header class="pos-menu__head">
            <h1 class="pos-menu__title">القائمة</h1>
            <div class="pos-menu__head-end">
              <span class="pos-menu__date">{{ currentDate }}</span>
              <button
                type="button"
                class="pos-waiter-btn"
                :class="{ 'pos-waiter-btn--has': waitingOrders.length > 0 }"
                :aria-label="`طلبات النادل: ${waitingOrders.length} بانتظار الكاشير`"
                @click="openWaiterOrders"
              >
                <PhBellRinging :size="20" weight="bold" />
                <span class="pos-waiter-btn__label">طلبات النادل</span>
                <span class="pos-waiter-btn__badge" aria-hidden="true">{{ waitingOrders.length }}</span>
              </button>
            </div>
          </header>

          <!-- Category Tabs -->
          <nav class="pos-cats">
            <button
              v-for="category in categoriesForDisplay"
              :key="category.idCategory"
              @click="selectedCategory = category.idCategory"
              class="pos-cat"
              :class="{ 'pos-cat--active': selectedCategory === category.idCategory }"
            >
              {{ category.categoryName }}
            </button>
          </nav>

          <!-- Items Grid -->
          <div class="pos-items">
            <template v-if="loading.menuItems">
              <div v-for="n in 8" :key="`skel-${n}`" class="pos-item pos-item--skeleton">
                <div class="pos-item__img"></div>
                <div class="pos-item__name" style="width: 60%; height: 14px; background: var(--t-border-soft); border-radius: 4px"></div>
                <div class="pos-item__price" style="width: 40%; height: 12px; background: var(--t-hover); border-radius: 4px; margin-top: 6px"></div>
              </div>
            </template>

            <button
              v-else
              v-for="item in filteredMenuItems"
              :key="item.idMenuItem"
              @click="addToCart(item)"
              :disabled="!item.isAvailable"
              class="pos-item"
              :class="{ 'pos-item--off': !item.isAvailable }"
            >
              <div class="pos-item__img" :class="{ 'pos-item__img--photo': item.imageUrl }">
                <img :src="item.imageUrl || logoImg" :alt="item.itemName" loading="lazy" decoding="async" @error="onItemImgError" />
              </div>
              <div class="pos-item__body">
                <span class="pos-item__name" style="text-align: center">{{ item.itemName }}</span>
                <span class="pos-item__price">{{ Number(item.basePrice).toLocaleString() }} د.ع</span>
              </div>
              <span v-if="!item.isAvailable" class="pos-item__badge">
                {{ item.kitchenStock === 0 ? "نفذت الكمية" : "غير متاح" }}
              </span>
            </button>

            <div v-if="filteredMenuItems.length === 0 && !loading.menuItems" class="pos-empty">
              <PhForkKnife :size="56" weight="thin" />
              <p>{{ menuItems.length === 0 ? "جاري تحميل القائمة..." : "لا توجد أصناف في هذا التصنيف" }}</p>
            </div>
          </div>
        </section>

        <!-- RIGHT: Cart Panel -->
        <aside class="pos-cart">
          <!-- Cart Header -->
          <header class="pos-cart__head">
            <div class="pos-cart__head-row">
              <h2 class="pos-cart__title">
                <PhReceipt :size="22" weight="duotone" />
                الطلب
              </h2>
              <span v-if="cart.length" class="pos-cart__count">{{ cart.length }}</span>
            </div>
            <div v-if="activeWaiterOrder" class="pos-waiter-chip" role="status">
              <PhUser :size="16" weight="bold" />
              <span class="pos-waiter-chip__text">طلب {{ activeWaiterOrder.waiterName }} — طاولة {{ activeWaiterOrder.tableNumber }}</span>
              <button type="button" class="pos-waiter-chip__x" aria-label="فك ارتباط السلة بطلب النادل" title="فك الارتباط (تبقى السلة كما هي)" @click="detachWaiterOrder">
                <PhX :size="16" weight="bold" />
              </button>
            </div>
            <div class="pos-cart__table">
              <PhMapPin :size="16" weight="bold" />
              <input v-model="tableNumber" type="text" placeholder="رقم الطاولة" class="pos-cart__table-input" />
            </div>
          </header>

          <!-- Cart Body -->
          <div class="pos-cart__body" v-if="cart.length > 0">
            <div v-for="(item, index) in cart" :key="index" class="pos-cart-item">
              <div class="pos-cart-item__info">
                <span class="pos-cart-item__name">{{ item.itemName }}</span>
                <div class="pos-cart-item__meta">
                  <span v-if="item.selectedSizeName" class="pos-cart-item__size">{{ item.selectedSizeName }}</span>
                  <span class="pos-cart-item__unit-price">{{ Number(item.basePrice).toLocaleString() }} د.ع</span>
                </div>
              </div>
              <div class="pos-cart-item__controls">
                <div class="pos-qty">
                  <button class="pos-qty__btn" @click="decrementQuantity(index)" aria-label="إنقاص الكمية" title="إنقاص الكمية">
                    <PhMinus :size="18" weight="bold" />
                  </button>
                  <span class="pos-qty__val">{{ item.quantity }}</span>
                  <button class="pos-qty__btn pos-qty__btn--plus" @click="incrementQuantity(index)" aria-label="زيادة الكمية" title="زيادة الكمية">
                    <PhPlus :size="18" weight="bold" />
                  </button>
                </div>
                <span class="pos-cart-item__total">{{ (Number(item.basePrice) * item.quantity).toLocaleString() }}</span>
                <button class="pos-cart-item__remove" @click="removeFromCart(index)" aria-label="حذف الصنف" title="حذف الصنف">
                  <PhTrash :size="18" weight="bold" />
                </button>
              </div>
            </div>
          </div>

          <!-- Empty Cart -->
          <div v-else class="pos-cart__empty">
            <PhShoppingCart :size="44" weight="thin" />
            <p>السلة فارغة</p>
            <span>اختر أصناف من القائمة</span>
          </div>

          <!-- Cart Footer -->
          <footer v-if="cart.length > 0" class="pos-cart__foot">
            <!-- Payment & Sale Type -->
            <div class="pos-pay-row">
              <div class="pos-toggle">
                <button class="pos-toggle__btn" :class="{ 'pos-toggle__btn--active': paymentMethod === 'cash' }" @click="paymentMethod = 'cash'"><PhMoney :size="16" weight="bold" /> نقداً</button>
                <button class="pos-toggle__btn" :class="{ 'pos-toggle__btn--active': paymentMethod === 'card' }" @click="paymentMethod = 'card'">
                  <PhCreditCard :size="16" weight="bold" /> بطاقة
                </button>
              </div>
              <div class="pos-toggle">
                <button
                  class="pos-toggle__btn"
                  :class="{ 'pos-toggle__btn--active': saleType === 'cash' }"
                  @click="
                    saleType = 'cash';
                    selectedCustomerId = null;
                  "
                >
                  بيع نقدي
                </button>
                <button class="pos-toggle__btn" :class="{ 'pos-toggle__btn--active': saleType === 'credit' }" @click="saleType = 'credit'">بيع آجل</button>
              </div>
            </div>

            <!-- Customer Select (credit) -->
            <div v-if="saleType === 'credit'" class="pos-field">
              <v-select
                v-model="selectedCustomerId"
                :items="customers"
                item-title="fullName"
                item-value="idCustomer"
                variant="outlined"
                density="compact"
                placeholder="اختر العميل"
                hide-details
                class="pos-select"
              />
            </div>

            <!-- Optional Customer Info (Loyalty) -->
            <button class="pos-loyalty-toggle" @click="showCustomerFields = !showCustomerFields">
              <PhReceipt :size="15" weight="bold" />
              {{ showCustomerFields ? "إخفاء بيانات العميل" : "إضافة عميل (اختياري)" }}
            </button>
            <div v-if="showCustomerFields" class="pos-loyalty">
              <input v-model="customerName" type="text" class="pos-loyalty__input" placeholder="اسم العميل" autocomplete="off" />
              <input v-model="customerPhone" type="tel" class="pos-loyalty__input" placeholder="رقم الهاتف" autocomplete="off" dir="ltr" />
            </div>

            <!-- Discount -->
            <div v-if="isSupervisor" class="pos-discount">
              <div class="pos-toggle pos-toggle--small">
                <button class="pos-toggle__btn" :class="{ 'pos-toggle__btn--active': discountType === 'amount' }" @click="discountType = 'amount'">مبلغ</button>
                <button class="pos-toggle__btn" :class="{ 'pos-toggle__btn--active': discountType === 'percentage' }" @click="discountType = 'percentage'">%</button>
              </div>
              <input v-model.number="discount" type="number" :placeholder="discountType === 'percentage' ? 'خصم %' : 'خصم د.ع'" class="pos-discount__input" />
            </div>

            <!-- Order Notes -->
            <div class="pos-order-notes">
              <textarea v-model="orderNotes" class="pos-order-notes__input" placeholder="ملاحظات الطلب (اختياري)" rows="2"></textarea>
            </div>

            <!-- Totals -->
            <div class="pos-totals">
              <div class="pos-totals__row">
                <span>المجموع</span>
                <span>{{ subtotal.toLocaleString() }} د.ع</span>
              </div>
              <div v-if="discount > 0" class="pos-totals__row pos-totals__row--discount">
                <span>الخصم</span>
                <span>- {{ calculatedDiscountAmount.toLocaleString() }} د.ع</span>
              </div>
              <div class="pos-totals__row pos-totals__row--total">
                <span>الإجمالي</span>
                <span>{{ total.toLocaleString() }} <small>د.ع</small></span>
              </div>
            </div>

            <!-- Action Buttons -->
            <button class="pos-checkout" @click="checkout" :disabled="processing">
              <PhCheckCircle :size="22" weight="bold" />
              <span v-if="!processing">تأكيد الطلب</span>
              <span v-else>جاري المعالجة...</span>
            </button>
            <button class="pos-clear" @click="clearCart">
              <PhX :size="16" weight="bold" />
              مسح السلة
            </button>
          </footer>
        </aside>
      </template>
    </div>

    <!-- Item Details Dialog -->
    <v-dialog v-model="showItemDialog" max-width="460">
      <div class="pos-dialog">
        <header class="pos-dialog__head">
          <h3>{{ selectedItem?.itemName }}</h3>
          <button @click="showItemDialog = false" class="pos-dialog__close">
            <PhX :size="20" weight="bold" />
          </button>
        </header>

        <div class="pos-dialog__body">
          <!-- Size Selection -->
          <div v-if="availableSizes.length > 0" class="pos-sizes">
            <p class="pos-sizes__label">اختر الحجم</p>
            <div class="pos-sizes__grid">
              <button v-for="size in availableSizes" :key="size.idItemSize" @click="itemSize = size.idItemSize" class="pos-size" :class="{ 'pos-size--active': itemSize === size.idItemSize }">
                <span class="pos-size__name">{{ size.sizeName }}</span>
                <span class="pos-size__price">{{ (Number(selectedItem?.basePrice) + Number(size.priceAdjustment)).toLocaleString() }} د.ع</span>
              </button>
            </div>
          </div>
          <div v-else class="pos-fixed-price">{{ Number(selectedItem?.basePrice).toLocaleString() }} د.ع</div>

          <!-- Special Instructions -->
          <textarea v-model="specialInstructions" placeholder="ملاحظات خاصة (اختياري)..." class="pos-notes" rows="2"></textarea>
        </div>

        <footer class="pos-dialog__foot">
          <button class="pos-dialog__add" @click="confirmAddToCart">
            <PhPlus :size="18" weight="bold" />
            إضافة للسلة
          </button>
        </footer>
      </div>
    </v-dialog>

    <!-- Waiter Orders List -->
    <v-dialog v-model="showWaiterOrders" max-width="600" scrollable>
      <div class="pos-dialog pos-wo">
        <header class="pos-dialog__head">
          <h3>طلبات النادل ({{ waitingOrders.length }})</h3>
          <div class="pos-wo__head-actions">
            <button type="button" class="pos-dialog__close" aria-label="تحديث القائمة" title="تحديث" :disabled="waiterOrdersLoading" @click="loadWaiterOrders()">
              <PhArrowsClockwise :size="20" weight="bold" :class="{ 'pos-wo__spin': waiterOrdersLoading }" />
            </button>
            <button type="button" class="pos-dialog__close" aria-label="إغلاق" @click="showWaiterOrders = false">
              <PhX :size="20" weight="bold" />
            </button>
          </div>
        </header>

        <div class="pos-wo__body">
          <p v-if="!socketConnected" class="pos-wo__notice">
            <PhWifiSlash :size="16" weight="bold" />
            الاتصال المباشر منقطع — تُحدَّث القائمة كل 30 ثانية
          </p>
          <p v-if="!isDailyReceiptOpen" class="pos-wo__notice pos-wo__notice--warn">
            <PhWarning :size="16" weight="bold" />
            الصندوق مغلق — افتح صندوق اليومية لتحميل الطلبات في السلة
          </p>

          <div v-if="waiterOrdersLoading && !waitingOrders.length" class="pos-wo__empty">
            <PhArrowsClockwise :size="36" weight="thin" class="pos-wo__spin" />
            <p>جاري تحميل الطلبات...</p>
          </div>
          <div v-else-if="!waitingOrders.length" class="pos-wo__empty">
            <PhCheckCircle :size="40" weight="thin" />
            <p>لا توجد طلبات بانتظار الكاشير</p>
          </div>

          <article
            v-for="wo in waitingOrders"
            :key="wo.idWaiterOrder"
            class="pos-wo-card"
            :class="{ 'pos-wo-card--active': activeWaiterOrder?.id === wo.idWaiterOrder }"
            :aria-label="`طلب طاولة ${wo.tableNumber} من ${wo.waiterName}`"
          >
            <header class="pos-wo-card__head">
              <div class="pos-wo-card__table">
                <span class="pos-wo-card__table-label">طاولة</span>
                <span class="pos-wo-card__table-num">{{ wo.tableNumber }}</span>
              </div>
              <div class="pos-wo-card__meta">
                <span class="pos-wo-card__waiter"><PhUser :size="15" weight="bold" /> {{ wo.waiterName || "نادل" }}</span>
                <span class="pos-wo-card__time"><PhClock :size="15" weight="bold" /> {{ timeAgo(wo.createdAt) }}</span>
              </div>
              <span v-if="activeWaiterOrder?.id === wo.idWaiterOrder" class="pos-wo-card__tag">في السلة الآن</span>
            </header>

            <ul class="pos-wo-card__lines">
              <li v-for="(line, i) in wo.items || []" :key="i" class="pos-wo-card__line">
                <div class="pos-wo-card__line-main">
                  <span class="pos-wo-card__qty">{{ line.quantity }} ×</span>
                  <span>{{ line.itemName }}<template v-if="line.sizeName"> ({{ line.sizeName }})</template></span>
                </div>
                <span v-if="line.specialInstructions" class="pos-wo-card__line-note"><PhNote :size="13" weight="bold" /> {{ line.specialInstructions }}</span>
              </li>
            </ul>

            <p v-if="wo.notes" class="pos-wo-card__notes"><PhNotePencil :size="15" weight="bold" /> {{ wo.notes }}</p>

            <footer class="pos-wo-card__foot">
              <span class="pos-wo-card__total">
                الإجمالي التقديري
                <strong>{{ Number(wo.total || 0).toLocaleString() }} د.ع</strong>
              </span>
              <div class="pos-wo-card__actions">
                <button type="button" class="pos-wo-btn pos-wo-btn--danger" @click="openReject(wo)">
                  <PhProhibit :size="18" weight="bold" />
                  رفض
                </button>
                <button
                  type="button"
                  class="pos-wo-btn pos-wo-btn--primary"
                  :disabled="!isDailyReceiptOpen || loadingWaiterOrderId !== null"
                  @click="loadWaiterOrder(wo)"
                >
                  <PhShoppingCart :size="18" weight="bold" />
                  {{ loadingWaiterOrderId === wo.idWaiterOrder ? "جاري التحميل..." : "تحميل في السلة" }}
                </button>
              </div>
            </footer>
          </article>
        </div>
      </div>
    </v-dialog>

    <!-- Replace cart confirmation -->
    <v-dialog v-model="showReplaceConfirm" max-width="420">
      <div class="pos-dialog">
        <header class="pos-dialog__head">
          <h3>استبدال محتوى السلة؟</h3>
          <button type="button" class="pos-dialog__close" aria-label="إلغاء" @click="cancelReplace">
            <PhX :size="20" weight="bold" />
          </button>
        </header>
        <div class="pos-dialog__body">
          <p class="pos-wo-confirm__text">
            السلة تحتوي على {{ cart.length }} صنف. سيتم حذفها وتحميل طلب طاولة <strong>{{ pendingReplace?.tableNumber }}</strong> من {{ pendingReplace?.waiterName }} بدلاً منها.
          </p>
        </div>
        <footer class="pos-dialog__foot pos-wo-confirm__foot">
          <button type="button" class="pos-wo-btn pos-wo-btn--ghost" @click="cancelReplace">إلغاء</button>
          <button type="button" class="pos-wo-btn pos-wo-btn--primary" @click="confirmReplace">
            <PhShoppingCart :size="18" weight="bold" />
            استبدال وتحميل
          </button>
        </footer>
      </div>
    </v-dialog>

    <!-- Reject waiter order -->
    <v-dialog v-model="showRejectDialog" max-width="440">
      <div class="pos-dialog">
        <header class="pos-dialog__head pos-dialog__head--danger">
          <h3>رفض طلب طاولة {{ rejectTarget?.tableNumber }}</h3>
          <button type="button" class="pos-dialog__close" aria-label="إلغاء" @click="showRejectDialog = false">
            <PhX :size="20" weight="bold" />
          </button>
        </header>
        <div class="pos-dialog__body">
          <p class="pos-sizes__label" id="pos-reject-label">سبب الرفض (اختياري) — سيظهر للنادل</p>
          <div class="pos-wo-reasons" role="group" aria-labelledby="pos-reject-label">
            <button
              v-for="r in rejectReasons"
              :key="r"
              type="button"
              class="pos-wo-reason"
              :class="{ 'pos-wo-reason--active': rejectReason === r }"
              :aria-pressed="rejectReason === r"
              @click="rejectReason = rejectReason === r ? '' : r"
            >
              {{ r }}
            </button>
          </div>
          <textarea v-model="rejectReason" class="pos-notes" rows="2" maxlength="200" placeholder="اكتب سبباً آخر..." aria-labelledby="pos-reject-label"></textarea>
        </div>
        <footer class="pos-dialog__foot pos-wo-confirm__foot">
          <button type="button" class="pos-wo-btn pos-wo-btn--ghost" @click="showRejectDialog = false">إلغاء</button>
          <button type="button" class="pos-wo-btn pos-wo-btn--danger-solid" :disabled="rejecting" @click="confirmReject">
            <PhProhibit :size="18" weight="bold" />
            {{ rejecting ? "جاري الرفض..." : "تأكيد الرفض" }}
          </button>
        </footer>
      </div>
    </v-dialog>
  </AppLayout>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { io } from "socket.io-client";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import AppLayout from "@/components/AppLayout.vue";
import { categoryAPI, menuAPI, orderAPI, customerAPI, kitchenStockAPI, waiterOrderAPI } from "@/services/api";
import { useToast } from "vue-toastification";
import logoPng from "@/assets/logo.png";
import { useThemeStore } from "@/stores/theme";
import { formatCurrentDateArabic } from "@/utils/dateFormatter";
import { PhShoppingCart, PhMinus, PhPlus, PhTrash, PhX, PhCheckCircle, PhLockKeyOpen, PhForkKnife, PhTag, PhMoney, PhCreditCard, PhReceipt, PhMapPin, PhBellRinging, PhUser, PhClock, PhNote, PhNotePencil, PhProhibit, PhWifiSlash, PhArrowsClockwise, PhWarning } from "@phosphor-icons/vue";
import { itemSizeAPI, dailyReceiptAPI } from "@/services/api";

const authStore = useAuthStore();
const themeStore = useThemeStore();
const toast = useToast();
const router = useRouter();

const logoImg = computed(() => logoPng);

// Broken/missing upload → fall back to the logo (once, to avoid an error loop)
const onItemImgError = (e) => {
  if (e?.target && e.target.src !== logoPng) e.target.src = logoPng;
};

const currentDate = computed(() => formatCurrentDateArabic());

const categories = ref([]);
const menuItems = ref([]);
const kitchenStock = ref([]);
const selectedCategory = ref(null);
const cart = ref([]);
const processing = ref(false);
const loading = ref({ menuItems: false, categories: false });
const showItemDialog = ref(false);
const selectedItem = ref(null);
const itemSize = ref(null);
const sizesCache = ref({});
const specialInstructions = ref("");
const availableSizes = ref([]);
const isDailyReceiptOpen = ref(false);
const discount = ref(0);
const discountType = ref("amount");
const paymentMethod = ref("cash");
const saleType = ref("cash");
const selectedCustomerId = ref(null);
const customers = ref([]);
const tableNumber = ref("");
const customerName = ref("");
const customerPhone = ref("");
const orderNotes = ref("");
const showCustomerFields = ref(false);

// ===== Waiter orders (sent from the waiters' tablets) =====
const waiterOrders = ref([]);
const waiterOrdersLoading = ref(false);
const showWaiterOrders = ref(false);
const activeWaiterOrder = ref(null); // { id, waiterName, tableNumber } while the cart holds a waiter order
const loadingWaiterOrderId = ref(null);
const showReplaceConfirm = ref(false);
const pendingReplace = ref(null);
const showRejectDialog = ref(false);
const rejectTarget = ref(null);
const rejectReason = ref("");
const rejecting = ref(false);
const rejectReasons = ["الطاولة غير صحيحة", "صنف غير متوفر", "طلب مكرر", "الزبون ألغى الطلب"];
const socketConnected = ref(false);
const nowTick = ref(Date.now());

const rules = { required: (value) => !!value || "مطلوب" };

const categoriesForDisplay = computed(() => {
  const list = categories.value || [];
  const menu = menuItems.value || [];
  // Show every category that has at least one active menu item (kitchen stock or not)
  return list.filter((cat) => menu.some((item) => item.categoryId === cat.idCategory));
});

const filteredMenuItems = computed(() => {
  if (!selectedCategory.value) return [];
  if (!Array.isArray(menuItems.value)) return [];
  const kitchenStockMap = new Map((kitchenStock.value || []).map((x) => [x.menuItemId, Number(x.quantity) || 0]));
  const selectedCat = (categories.value || []).find((c) => c.idCategory === selectedCategory.value);
  const isKitchenCategory = selectedCat && (selectedCat.isKitchen === 1 || selectedCat.isKitchen === true);
  return menuItems.value
    .filter((item) => {
      if (!item || !item.idMenuItem) return false;
      const categoryMatch = item.categoryId === selectedCategory.value;
      const isActive = Boolean(item.isActive === 1 || item.isActive === true || item.isActive === "1");
      return categoryMatch && isActive;
    })
    .map((item) => {
      // For kitchen-category items, mark as out-of-stock if not in kitchen storage
      // Only dishes added to the kitchen display are limited to their ready portions;
      // the rest are made to order and always sellable (same rule as the server).
      if (isKitchenCategory && kitchenStockMap.has(item.idMenuItem)) {
        const stock = kitchenStockMap.get(item.idMenuItem);
        return { ...item, isAvailable: item.isAvailable && stock > 0, kitchenStock: stock };
      }
      return { ...item, kitchenStock: null };
    });
});

const subtotal = computed(() => cart.value.reduce((t, i) => t + i.basePrice * i.quantity, 0));

const calculatedDiscountAmount = computed(() => {
  if (discountType.value === "percentage") return (subtotal.value * (Number(discount.value) || 0)) / 100;
  return Number(discount.value) || 0;
});

const total = computed(() => Math.max(0, subtotal.value - calculatedDiscountAmount.value));

// Live customer display updates (throttled to avoid lag on slow devices)
let _displayTimer = null;
watch(
  cart,
  (items) => {
    if (!window.electronAPI?.updateCustomerDisplay) return;
    if (_displayTimer) return;
    _displayTimer = setTimeout(() => {
      _displayTimer = null;
      try {
        window.electronAPI.updateCustomerDisplay({
          items: items.map((i) => ({
            name: i.itemName,
            size: i.selectedSizeName || null,
            quantity: i.quantity,
            price: i.basePrice,
          })),
          tableNumber: tableNumber.value || null,
        });
      } catch (_) {}
    }, 300);
  },
  { deep: true },
);

const isSupervisor = computed(() => {
  const role = authStore.user?.role;
  return role === "supervisor" || role === "admin";
});

const checkDailyReceipt = async () => {
  try {
    const response = await dailyReceiptAPI.getCurrent();
    isDailyReceiptOpen.value = response.data && !response.data.isClosed;
    if (!isDailyReceiptOpen.value) toast.error("⚠️ الصندوق مغلق - يجب فتح صندوق اليومية أولاً");
  } catch (error) {
    isDailyReceiptOpen.value = false;
    if (error.response?.status === 404) toast.warning("⚠️ لم يتم فتح صندوق اليومية اليوم");
  }
};

const loadCategories = async () => {
  loading.value.categories = true;
  try {
    const response = await categoryAPI.getAll();
    let data = [];
    if (response?.data) {
      if (Array.isArray(response.data)) data = response.data;
      else if (typeof response.data === "string" && response.data.startsWith("<!")) {
        toast.error("خطأ في الاتصال بالخادم");
        categories.value = [];
        return;
      }
    } else if (Array.isArray(response)) data = response;
    categories.value = data;
    // Select the first category that actually has items (tabs only show those)
    if (categories.value.length > 0) selectedCategory.value = categoriesForDisplay.value[0]?.idCategory ?? null;
    else toast.warning("لا توجد تصنيفات متاحة");
  } catch (error) {
    toast.error("فشل تحميل التصنيفات");
    categories.value = [];
  } finally {
    loading.value.categories = false;
  }
};

const loadKitchenStock = async () => {
  try {
    const res = await kitchenStockAPI.getMenu(true);
    kitchenStock.value = Array.isArray(res.data) ? res.data : res.data?.items || [];
  } catch (_) {
    kitchenStock.value = [];
  }
};

const loadMenu = async () => {
  loading.value.menuItems = true;
  try {
    const response = await menuAPI.getAll();
    let data = [];
    if (response?.data) {
      if (Array.isArray(response.data)) data = response.data;
      else if (typeof response.data === "string" && response.data.startsWith("<!")) {
        toast.error("خطأ في الاتصال بالخادم");
        menuItems.value = [];
        return;
      }
    } else if (Array.isArray(response)) data = response;
    menuItems.value = data.map((item) => ({
      ...item,
      isAvailable: Boolean(item.isAvailable === 1 || item.isAvailable === true || item.isAvailable === "1"),
      isActive: Boolean(item.isActive === 1 || item.isActive === true || item.isActive === "1"),
      itemName: item.itemName || "بدون اسم",
      basePrice: Number(item.basePrice) || 0,
      imageUrl: item.imageUrl || null,
    }));
    if (menuItems.value.length === 0) toast.warning("لا توجد أصناف في القائمة");
    // Pre-load item sizes in background after a short delay (don't block menu render)
    setTimeout(() => preloadAllSizes(), 1000);
  } catch (error) {
    toast.error("فشل تحميل القائمة");
    menuItems.value = [];
  } finally {
    loading.value.menuItems = false;
  }
};

const preloadAllSizes = async () => {
  const ids = menuItems.value.map((i) => i.idMenuItem);
  const batchSize = 10;
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (id) => {
        if (sizesCache.value[id]) return;
        try {
          const res = await itemSizeAPI.getByMenuItem(id);
          sizesCache.value[id] = res.data || [];
        } catch (_) {
          sizesCache.value[id] = [];
        }
      }),
    );
  }
};

const addToCart = (item) => {
  selectedItem.value = item;
  itemSize.value = null;
  specialInstructions.value = "";
  // Use cached sizes (instant) or fetch if not cached yet
  if (sizesCache.value[item.idMenuItem]) {
    availableSizes.value = sizesCache.value[item.idMenuItem];
    showItemDialog.value = true;
  } else {
    itemSizeAPI
      .getByMenuItem(item.idMenuItem)
      .then((res) => {
        sizesCache.value[item.idMenuItem] = res.data || [];
        availableSizes.value = sizesCache.value[item.idMenuItem];
      })
      .catch(() => {
        availableSizes.value = [];
      })
      .finally(() => {
        showItemDialog.value = true;
      });
  }
};

function isKitchenMenuItem(menuItemId) {
  // Limited only when the dish has ready portions tracked in kitchen stock
  if (!(kitchenStock.value || []).some((x) => x.menuItemId === menuItemId)) return false;
  const item = (menuItems.value || []).find((m) => m.idMenuItem === menuItemId);
  if (!item) return false;
  const cat = (categories.value || []).find((c) => c.idCategory === item.categoryId);
  return !!(cat && (cat.isKitchen === 1 || cat.isKitchen === true));
}

function getKitchenAvailable(menuItemId) {
  const s = (kitchenStock.value || []).find((x) => x.menuItemId === menuItemId);
  return s ? Number(s.quantity) : 0;
}

function cartQtyForMenuItem(menuItemId, excludeIndex = null) {
  return (cart.value || []).reduce((sum, item, idx) => (item.idMenuItem === menuItemId && idx !== excludeIndex ? sum + (Number(item.quantity) || 0) : sum), 0);
}

const confirmAddToCart = () => {
  if (!selectedItem.value) return;
  if (availableSizes.value.length > 0 && !itemSize.value) {
    toast.error("يجب اختيار الحجم");
    return;
  }
  const id = selectedItem.value.idMenuItem;
  let qty = 1;
  if (isKitchenMenuItem(id)) {
    const available = getKitchenAvailable(id) - cartQtyForMenuItem(id, null);
    if (available <= 0) {
      toast.error("لا توجد كمية متوفرة");
      return;
    }
    qty = Math.min(1, available);
  }
  const sizeObj = itemSize.value ? availableSizes.value.find((s) => s.idItemSize === itemSize.value) : null;
  const finalPrice = Number(selectedItem.value.basePrice) + (sizeObj ? Number(sizeObj.priceAdjustment) : 0);
  cart.value.push({
    ...selectedItem.value,
    quantity: qty,
    selectedSizeId: sizeObj ? sizeObj.idItemSize : null,
    selectedSizeName: sizeObj ? sizeObj.sizeName : null,
    basePrice: finalPrice,
    specialInstructions: (specialInstructions.value || "").trim(),
  });
  toast.success(`تمت إضافة ${selectedItem.value.itemName}${sizeObj ? " - " + sizeObj.sizeName : ""}`);
  showItemDialog.value = false;
  selectedItem.value = null;
  itemSize.value = null;
  specialInstructions.value = "";
  availableSizes.value = [];
};

const incrementQuantity = (index) => {
  const item = cart.value[index];
  if (!item) return;
  const id = item.idMenuItem;
  if (isKitchenMenuItem(id)) {
    const maxQty = getKitchenAvailable(id) - cartQtyForMenuItem(id, index);
    if (maxQty <= 0) return;
    const newQty = Math.min((Number(item.quantity) || 0) + 1, maxQty);
    if (newQty > (Number(item.quantity) || 0)) cart.value[index].quantity = newQty;
    if (newQty >= maxQty) toast.warning(`الحد الأقصى المتوفر: ${maxQty}`);
  } else {
    cart.value[index].quantity++;
  }
};

const decrementQuantity = (index) => {
  if (cart.value[index].quantity > 1) cart.value[index].quantity--;
  else removeFromCart(index);
};

const removeFromCart = (index) => {
  cart.value.splice(index, 1);
};

const clearCart = () => {
  cart.value = [];
  discount.value = 0;
  discountType.value = "amount";
  paymentMethod.value = "cash";
  saleType.value = "cash";
  selectedCustomerId.value = null;
  tableNumber.value = "";
  customerName.value = "";
  customerPhone.value = "";
  orderNotes.value = "";
  showCustomerFields.value = false;
  activeWaiterOrder.value = null;
};

const checkout = async () => {
  if (saleType.value === "credit" && !selectedCustomerId.value) {
    toast.error("اختر العميل (المدين) عند البيع آجل");
    return;
  }
  processing.value = true;
  try {
    const orderType = paymentMethod.value === "cash" ? "cashier" : "card";
    const orderData = {
      orderType,
      saleType: saleType.value || "cash",
      customerId: saleType.value === "credit" ? selectedCustomerId.value : null,
      tableNumber: tableNumber.value || null,
      customerName: customerName.value || null,
      customerPhone: customerPhone.value || null,
      notes: orderNotes.value || null,
      totalAmount: total.value,
      subtotal: subtotal.value,
      discount: discountType.value === "percentage" ? Number(discount.value) || 0 : calculatedDiscountAmount.value,
      discountType: discountType.value,
      waiterOrderId: activeWaiterOrder.value?.id || null,
      orderItems: cart.value.map((item) => ({
        menuItemId: item.idMenuItem,
        quantity: item.quantity,
        price: item.basePrice,
        itemSizeId: item.selectedSizeId || null,
        specialInstructions: item.specialInstructions || null,
      })),
    };
    const response = await orderAPI.create(orderData);
    const claimedWaiterOrderId = activeWaiterOrder.value?.id || null;
    toast.success(`تم إنشاء الطلب #${response.data.orderNumber} بنجاح!`);
    if (saleType.value === "credit" && selectedCustomerId.value && response.data?.orderNumber) {
      const id = selectedCustomerId.value;
      setTimeout(() => router.push(`/customers/${id}`), 800);
    }
    // The server re-prices every order: use its numbers, not the cart's
    const saved = response.data || {};
    const serverItems = Array.isArray(saved.items) ? saved.items : [];
    const lines = cart.value.map((item, i) => {
      const unitPrice = Number(serverItems[i]?.price ?? item.basePrice) || 0;
      const quantity = Number(serverItems[i]?.quantity ?? item.quantity) || 0;
      return { item, unitPrice, quantity, lineTotal: unitPrice * quantity };
    });
    const serverSubtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
    const serverDiscount = Number(saved.discount) || 0;
    const orderTotal = saved.totalAmount != null ? Number(saved.totalAmount) || 0 : Math.max(0, serverSubtotal - serverDiscount);
    if (window.electronAPI && window.electronAPI.showOrderOnDisplay) {
      try {
        await window.electronAPI.showOrderOnDisplay({
          orderNumber: saved.orderNumber,
          orderDate: new Date().toISOString(),
          totalAmount: orderTotal,
          totalPrice: orderTotal,
          orderItems: lines.map((l) => ({
            name: l.item.itemName,
            size: l.item.selectedSizeName || null,
            quantity: l.quantity,
            price: l.unitPrice,
            total: l.lineTotal,
          })),
        });
      } catch (_) {}
    }
    // Electron (POS): one order → cashier receipt (+ drawer for cash) and kitchen/grill tickets
    // at the same time, on the printers set up in this POS's printer settings.
    if (window.electronAPI?.printOrder) {
      const printJob = {
        orderId: saved.orderId ?? null, // short number printed large on tickets
        orderNumber: saved.orderNumber,
        createdAt: new Date().toISOString(),
        table: tableNumber.value || null,
        orderType,
        saleType: saleType.value,
        cashierName: authStore.user?.fullName || null,
        waiterName: activeWaiterOrder.value?.waiterName || null,
        customerName: customerName.value || null,
        customerPhone: customerPhone.value || null,
        notes: orderNotes.value || null,
        subtotal: serverSubtotal,
        discount: serverDiscount,
        total: orderTotal,
        items: lines.map((l) => ({
          name: l.item.itemName,
          size: l.item.selectedSizeName || null,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          lineTotal: l.lineTotal,
          notes: l.item.specialInstructions || "",
          categoryId: l.item.categoryId ?? null,
        })),
      };
      // Not awaited: the cashier can start the next order while the printers work
      window.electronAPI
        .printOrder(printJob)
        .then((res) => {
          const failed = (res?.results || []).filter((r) => r.status === "failed");
          failed.forEach((r) => notifyPrintFailure(printJob, r));
          if (!res?.results?.length) toast.warning("لا توجد طابعات مفعّلة في إعدادات هذا الجهاز");
        })
        .catch((e) => toast.error(`تعذّرت الطباعة للطلب #${saved.orderNumber}: ${e?.message || e}`));
    } else if (window.electronAPI && window.electronAPI.printReceipt) {
      try {
        const receiptHtml = buildReceiptHtml({
          orderNumber: saved.orderNumber,
          date: new Date().toLocaleString("ar-EG", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }),
          orderType,
          saleType: saleType.value,
          table: tableNumber.value || null,
          discount: serverDiscount,
          subtotal: serverSubtotal,
          total: orderTotal,
          customerName: customerName.value || null,
          customerPhone: customerPhone.value || null,
          orderNotes: orderNotes.value || null,
          items: lines.map((l) => ({
            name: l.item.itemName + (l.item.selectedSizeName ? ` (${l.item.selectedSizeName})` : ""),
            notes: l.item.specialInstructions || "",
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            lineTotal: l.lineTotal,
          })),
        });
        await window.electronAPI.printReceipt({ type: "html", html: receiptHtml });
      } catch (_) {}
    }
    if (claimedWaiterOrderId) removeWaiterOrder(claimedWaiterOrderId);
    clearCart();
    await loadKitchenStock();
  } catch (error) {
    // Cart is kept on every error so the cashier can fix and retry
    const code = error.response?.data?.code;
    const serverMsg = error.response?.data?.message;
    if (code === "INSUFFICIENT_KITCHEN_STOCK") {
      toast.error(serverMsg || "الكمية غير متوفرة");
      loadKitchenStock();
    } else if (code === "CREDIT_LIMIT_EXCEEDED") {
      toast.error(serverMsg || "تجاوز حد الائتمان للعميل");
    } else if (code === "DISCOUNT_NOT_ALLOWED") {
      toast.error(serverMsg || "الخصم مسموح للمشرف أو المدير فقط");
    } else if (code === "NO_OPEN_SHIFT") {
      toast.error(serverMsg || "يجب فتح الشفت أولاً");
    } else if (code === "WAITER_ORDER_TAKEN") {
      // Someone else took it (or the waiter cancelled): keep the cart, just unlink it
      toast.error(serverMsg || "طلب النادل لم يعد متاحاً");
      if (activeWaiterOrder.value) removeWaiterOrder(activeWaiterOrder.value.id);
      detachWaiterOrder();
      loadWaiterOrders();
    } else {
      toast.error(error.response?.data?.message || "فشل إنشاء الطلب");
    }
  } finally {
    processing.value = false;
  }
};

// A printer failed (no paper, unplugged, wrong IP): say which one and let a tap reprint on it alone
function notifyPrintFailure(printJob, failure) {
  toast.error(`لم تُطبع ورقة «${failure.name}» للطلب #${printJob.orderNumber}: ${failure.error} — اضغط هنا لإعادة الطباعة`, {
    timeout: false,
    closeOnClick: true,
    onClick: () =>
      window.electronAPI
        .printOrder(printJob, { onlyIds: [failure.id] })
        .then((res) => {
          const again = (res?.results || []).find((x) => x.id === failure.id);
          if (again?.status === "printed") toast.success(`طُبعت ورقة «${failure.name}» للطلب #${printJob.orderNumber}`);
          else notifyPrintFailure(printJob, again || failure);
        }),
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildReceiptHtml(data) {
  const logoSrc = window.__ELECTRON_LOGOS__?.logoPng || "";
  const paymentLabel = data.saleType === "credit" ? "آجل" : data.orderType === "card" ? "بطاقة" : "نقدي";

  const itemsHtml = data.items
    .map(
      (item) =>
        `<div class="item-row">
      <span class="item-name">${escapeHtml(item.name)}</span>
      <span class="item-dots"></span>
      <span class="item-price">${item.lineTotal.toLocaleString()} د.ع</span>
    </div>
    <div class="item-qty">x${item.quantity}  @${item.unitPrice.toLocaleString()}</div>
    ${item.notes ? `<div class="item-qty">📝 ${escapeHtml(item.notes)}</div>` : ""}`,
    )
    .join("");

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<style>
  @page { margin: 2mm 3mm; size: 72mm auto; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', 'Tahoma', 'Arial', sans-serif;
    font-size: 12px;
    width: 66mm;
    margin: 0 auto;
    padding: 2mm 0;
    color: #000;
    direction: rtl;
  }
  .header { text-align: center; padding-bottom: 8px; }
  .header img {
    width: 64px; height: 64px;
    border-radius: 50%;
    object-fit: cover;
    margin-bottom: 4px;
    filter: invert(1) contrast(1.5);
  }
  .header .stars { font-size: 14px; letter-spacing: 4px; margin: 2px 0; font-weight: bold; color: #000; }
  .header .cafe-name { font-size: 14px; font-weight: bold; margin: 2px 0; color: #000; }
  .header .cafe-name-en { font-size: 12px; font-weight: bold; color: #000; }
  .divider { border: none; border-top: 1px solid #000; margin: 6px 0; }
  .divider-dashed { border: none; border-top: 1px dashed #000; margin: 6px 0; }
  .info { font-size: 11px; line-height: 1.6; padding: 2px 0; color: #000; }
  .info div { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .item-row {
    display: flex; align-items: baseline;
    font-size: 12px; margin-top: 6px;
  }
  .item-name { flex-shrink: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #000; }
  .item-dots { flex: 1; border-bottom: 1px dotted #000; margin: 0 4px; min-width: 8px; position: relative; top: -3px; }
  .item-price { flex-shrink: 0; font-weight: bold; white-space: nowrap; color: #000; }
  .item-qty { font-size: 10px; color: #000; margin-bottom: 2px; }
  .order-notes-box { font-size: 11px; color: #000; font-style: italic; text-align: center; padding: 6px 8px; margin: 6px 0; border: 1px dashed #000; background: #f5f5f5; }
  .total-section { text-align: center; padding: 8px 0; }
  .total-label { font-size: 18px; font-weight: bold; letter-spacing: 1px; color: #000; }
  .footer { text-align: center; padding-top: 4px; font-size: 12px; line-height: 1.6; color: #000; }
  .footer .thank { font-weight: bold; font-size: 13px; }
  .customer-info { text-align: center; font-size: 10px; color: #000; margin-top: 4px; }
</style>
</head>
<body>
  <div class="header">
    ${logoSrc ? `<img src="${logoSrc}" alt="Logo">` : ""}
    <div class="stars">***</div>
    <div class="cafe-name">مطعم جوستو</div>
    <div class="cafe-name-en">Gusto Restaurant</div>
  </div>
  <hr class="divider">
  <div class="info">
    <div>رقم الطلب: <strong>${escapeHtml(data.orderNumber)}</strong></div>
    <div>التاريخ: ${data.date}</div>
    ${data.table ? `<div>الطاولة: ${escapeHtml(data.table)}</div>` : ""}
    <div>الدفع: ${paymentLabel}</div>
  </div>
  <hr class="divider">
  ${itemsHtml}
  <hr class="divider">
  ${
    data.discount > 0
      ? `
  <div style="display:flex;justify-content:space-between;font-size:11px;padding:2px 0;">
    <span>المجموع الفرعي</span>
    <span>${data.subtotal.toLocaleString()} د.ع</span>
  </div>
  <div style="display:flex;justify-content:space-between;font-size:11px;padding:2px 0;">
    <span>الخصم</span>
    <span>-${data.discount.toLocaleString()} د.ع</span>
  </div>
  <hr class="divider-dashed">
  `
      : ""
  }
  <div class="total-section">
    <div class="total-label">المجموع: ${data.total.toLocaleString()} د.ع</div>
  </div>
  ${data.customerName ? `<div class="customer-info">${escapeHtml(data.customerName)}${data.customerPhone ? " - " + escapeHtml(data.customerPhone) : ""}</div>` : ""}
  ${data.orderNotes ? `<div class="order-notes-box">📝 ${escapeHtml(data.orderNotes)}</div>` : ""}
  <hr class="divider">
  <div class="footer">
    <div class="thank" dir="rtl">شكراً لزيارتكم!</div>
    <div dir="rtl">نتمنى رؤيتكم مجدداً</div>
  </div>
</body>
</html>`;
}

function onSaleTypeChange() {
  if (saleType.value !== "credit") selectedCustomerId.value = null;
}

async function loadCustomers() {
  try {
    const res = await customerAPI.getAll();
    customers.value = res.data || [];
  } catch (_) {
    customers.value = [];
  }
}

watch(
  categoriesForDisplay,
  (list) => {
    if (!list.length) {
      selectedCategory.value = null;
      return;
    }
    if (!selectedCategory.value || !list.some((c) => c.idCategory === selectedCategory.value)) {
      selectedCategory.value = list[0].idCategory;
    }
  },
  { immediate: true },
);

// ===== Waiter orders =====
const waitingOrders = computed(() =>
  [...waiterOrders.value].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
);

function timeAgo(value) {
  const t = new Date(value).getTime();
  if (!t) return "";
  const mins = Math.max(0, Math.floor((nowTick.value - t) / 60000));
  if (mins < 1) return "الآن";
  if (mins < 60) return `منذ ${mins} د`;
  const hours = Math.floor(mins / 60);
  return `منذ ${hours} س${mins % 60 ? ` و${mins % 60} د` : ""}`;
}

async function loadWaiterOrders() {
  waiterOrdersLoading.value = true;
  try {
    const res = await waiterOrderAPI.pending();
    const rows = Array.isArray(res.data) ? res.data : [];
    waiterOrders.value = rows.filter((r) => !r.status || r.status === "pending");
  } catch (_) {
    // Keep the last list; polling / the socket will retry
  } finally {
    waiterOrdersLoading.value = false;
  }
}

function removeWaiterOrder(id) {
  waiterOrders.value = waiterOrders.value.filter((w) => w.idWaiterOrder !== id);
}

function upsertWaiterOrder(row) {
  const i = waiterOrders.value.findIndex((w) => w.idWaiterOrder === row.idWaiterOrder);
  if (i === -1) waiterOrders.value = [...waiterOrders.value, row];
  else waiterOrders.value.splice(i, 1, row);
}

function openWaiterOrders() {
  showWaiterOrders.value = true;
  loadWaiterOrders();
}

function detachWaiterOrder() {
  activeWaiterOrder.value = null;
}

// Short two-tone chime, synthesized (no audio file). Autoplay may be blocked until the
// cashier has interacted with the page — then it just stays silent.
let audioCtx = null;
function playChime() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!audioCtx) audioCtx = new Ctx();
    if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
    const start = audioCtx.currentTime;
    [880, 1320].forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const t0 = start + i * 0.16;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.25, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.14);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.15);
    });
  } catch (_) {}
}

async function getSizesFor(menuItemId) {
  if (sizesCache.value[menuItemId]) return sizesCache.value[menuItemId];
  try {
    const res = await itemSizeAPI.getByMenuItem(menuItemId);
    sizesCache.value[menuItemId] = res.data || [];
  } catch (_) {
    return [];
  }
  return sizesCache.value[menuItemId];
}

async function loadWaiterOrder(wo) {
  if (!wo || loadingWaiterOrderId.value !== null) return;
  if (cart.value.length > 0) {
    pendingReplace.value = wo;
    showReplaceConfirm.value = true;
    return;
  }
  loadingWaiterOrderId.value = wo.idWaiterOrder;
  try {
    await loadKitchenStock(); // fresh ready-portion counts before checking availability
    const entries = [];
    const skipped = [];
    const reduced = [];
    for (const line of wo.items || []) {
      const label = `${line.itemName || "صنف"}${line.sizeName ? ` (${line.sizeName})` : ""}`;
      const menuItem = (menuItems.value || []).find((m) => m.idMenuItem === Number(line.menuItemId));
      if (!menuItem || !menuItem.isActive || !menuItem.isAvailable) {
        skipped.push(label);
        continue;
      }
      let sizeObj = null;
      if (line.itemSizeId) {
        const sizes = await getSizesFor(menuItem.idMenuItem);
        sizeObj = sizes.find((s) => s.idItemSize === Number(line.itemSizeId)) || null;
        if (!sizeObj) {
          skipped.push(label);
          continue;
        }
      }
      let qty = Math.max(1, Number(line.quantity) || 1);
      const id = menuItem.idMenuItem;
      if (isKitchenMenuItem(id)) {
        const inEntries = entries.reduce((sum, e) => (e.idMenuItem === id ? sum + e.quantity : sum), 0);
        const available = getKitchenAvailable(id) - inEntries;
        if (available <= 0) {
          skipped.push(label);
          continue;
        }
        if (qty > available) {
          reduced.push(`${label}: ${available} من ${qty}`);
          qty = available;
        }
      }
      // Same shape confirmAddToCart pushes
      entries.push({
        ...menuItem,
        quantity: qty,
        selectedSizeId: sizeObj ? sizeObj.idItemSize : null,
        selectedSizeName: sizeObj ? sizeObj.sizeName : null,
        basePrice: Number(menuItem.basePrice) + (sizeObj ? Number(sizeObj.priceAdjustment) : 0),
        specialInstructions: (line.specialInstructions || "").trim(),
      });
    }

    if (!entries.length) {
      toast.error(`تعذّر تحميل طلب طاولة ${wo.tableNumber}: كل الأصناف غير متوفرة (${skipped.join("، ")})`, { timeout: 10000 });
      return;
    }

    clearCart();
    cart.value = entries;
    tableNumber.value = String(wo.tableNumber ?? "");
    orderNotes.value = wo.notes || "";
    activeWaiterOrder.value = { id: wo.idWaiterOrder, waiterName: wo.waiterName || "نادل", tableNumber: wo.tableNumber };
    showWaiterOrders.value = false;
    toast.success(`تم تحميل طلب طاولة ${wo.tableNumber} في السلة`);
    if (skipped.length) toast.warning(`لم تُضف أصناف غير متوفرة أو محذوفة من القائمة: ${skipped.join("، ")}`, { timeout: 10000 });
    if (reduced.length) toast.warning(`خُفّضت الكمية حسب المتوفر: ${reduced.join("، ")}`, { timeout: 10000 });
  } finally {
    loadingWaiterOrderId.value = null;
  }
}

function cancelReplace() {
  showReplaceConfirm.value = false;
  pendingReplace.value = null;
}

function confirmReplace() {
  const wo = pendingReplace.value;
  showReplaceConfirm.value = false;
  pendingReplace.value = null;
  if (!wo) return;
  cart.value = [];
  loadWaiterOrder(wo);
}

function openReject(wo) {
  rejectTarget.value = wo;
  rejectReason.value = "";
  showRejectDialog.value = true;
}

async function confirmReject() {
  const wo = rejectTarget.value;
  if (!wo || rejecting.value) return;
  rejecting.value = true;
  try {
    await waiterOrderAPI.reject(wo.idWaiterOrder, (rejectReason.value || "").trim() || null);
    removeWaiterOrder(wo.idWaiterOrder);
    if (activeWaiterOrder.value?.id === wo.idWaiterOrder) detachWaiterOrder();
    toast.success(`تم رفض طلب طاولة ${wo.tableNumber}`);
    showRejectDialog.value = false;
    rejectTarget.value = null;
  } catch (error) {
    toast.error(error.response?.data?.message || "تعذّر رفض الطلب");
    if (error.response?.status === 409) {
      showRejectDialog.value = false;
      loadWaiterOrders();
    }
  } finally {
    rejecting.value = false;
  }
}

let waiterSocket = null;
let waiterPollTimer = null;
let nowTimer = null;
const startWaiterPolling = () => {
  if (!waiterPollTimer) waiterPollTimer = setInterval(loadWaiterOrders, 30000);
};
const stopWaiterPolling = () => {
  if (waiterPollTimer) clearInterval(waiterPollTimer);
  waiterPollTimer = null;
};

function connectWaiterSocket() {
  const socketUrl = import.meta.env.VITE_API_URL || window.location.origin;
  waiterSocket = io(socketUrl, { transports: ["websocket", "polling"], auth: { token: localStorage.getItem("gusto_token") } });
  waiterSocket.on("connect", () => {
    socketConnected.value = true;
    stopWaiterPolling();
    waiterSocket.emit("join_cashier");
    loadWaiterOrders(); // catch anything sent while we were offline
  });
  const onDown = () => {
    socketConnected.value = false;
    startWaiterPolling();
  };
  waiterSocket.on("disconnect", onDown);
  waiterSocket.on("connect_error", onDown);
  waiterSocket.on("waiter_order_new", (row) => {
    if (!row?.idWaiterOrder || (row.status && row.status !== "pending")) return;
    const isNew = !waiterOrders.value.some((w) => w.idWaiterOrder === row.idWaiterOrder);
    upsertWaiterOrder(row);
    if (!isNew) return;
    playChime();
    toast.info(`طلب جديد من ${row.waiterName || "نادل"} — طاولة ${row.tableNumber}`, {
      closeOnClick: true,
      onClick: openWaiterOrders,
    });
  });
  waiterSocket.on("waiter_order_updated", (row) => {
    if (!row?.idWaiterOrder) return;
    if (row.status === "pending") {
      upsertWaiterOrder(row);
      return;
    }
    removeWaiterOrder(row.idWaiterOrder);
    // The order in this cart was cancelled / rejected / taken elsewhere (not by our own checkout in flight)
    if (activeWaiterOrder.value?.id === row.idWaiterOrder && !processing.value) {
      const t = row.tableNumber;
      const msg = row.status === "cancelled" ? `ألغى النادل طلب طاولة ${t}` : row.status === "rejected" ? `تم رفض طلب طاولة ${t}` : `استُلم طلب طاولة ${t} من جهاز آخر`;
      toast.warning(`${msg} — السلة لم تعد مرتبطة به`, { timeout: 10000 });
      detachWaiterOrder();
    }
  });
}

onMounted(async () => {
  // Load critical data first (what the cashier sees immediately)
  await Promise.all([loadCategories(), loadMenu(), loadKitchenStock()]);
  // Then load non-critical data in background
  checkDailyReceipt();
  loadCustomers();
  loadWaiterOrders();
  connectWaiterSocket();
  nowTimer = setInterval(() => (nowTick.value = Date.now()), 30000);
});

onBeforeUnmount(() => {
  stopWaiterPolling();
  if (nowTimer) clearInterval(nowTimer);
  if (waiterSocket) {
    waiterSocket.removeAllListeners();
    waiterSocket.disconnect();
    waiterSocket = null;
  }
  if (audioCtx) {
    audioCtx.close().catch(() => {});
    audioCtx = null;
  }
});
</script>

<style scoped>
.pos {
  display: grid;
  grid-template-columns: 1fr 380px;
  height: calc(100vh - 64px);
  overflow: hidden;
  background: var(--t-bg);
}

/* ===== BLOCKED STATE ===== */
.pos-blocked {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pos-blocked__card {
  text-align: center;
  padding: 48px;
}

.pos-blocked__icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(220, 38, 38, 0.1);
  color: #f87171;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
}

.pos-blocked__title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--t-text);
  margin: 0 0 8px;
}

.pos-blocked__desc {
  font-size: 0.9rem;
  color: var(--t-text-dim);
  margin: 0 0 24px;
}

.pos-blocked__btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 28px;
  border-radius: 12px;
  background: #dc2626;
  color: white;
  font-weight: 600;
  font-size: 1rem;
  text-decoration: none;
  transition: all 0.2s;
}

.pos-blocked__btn:hover {
  background: #b91c1c;
  transform: translateY(-1px);
}

/* ===== MENU PANEL ===== */
.pos-menu {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-left: 1px solid var(--t-border-subtle);
}

.pos-menu__head {
  padding: 16px 20px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.pos-menu__title {
  font-size: 30px !important;
  font-weight: 700;
  color: var(--t-text);
  margin: 0;
}

.pos-menu__date {
  font-size: 0.75rem;
  color: var(--t-text-faint);
}

/* Category Tabs */
.pos-cats {
  display: flex;
  gap: 6px;
  padding: 0 20px 14px;
  overflow-x: auto;
  scrollbar-width: none;
}

.pos-cats::-webkit-scrollbar {
  display: none;
}

.pos-cat {
  flex-shrink: 0;
  padding: 7px 16px;
  border-radius: 20px;
  border: 1px solid var(--t-border);
  background: transparent;
  color: var(--t-text-muted);
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.pos-cat:hover {
  border-color: rgba(4, 99, 117, 0.3);
  color: #1F7F90;
}

.pos-cat--active {
  background: #046375;
  border-color: #046375;
  color: white;
  font-weight: 600;
}

/* Items Grid */
.pos-items {
  flex: 1;
  overflow-y: auto;
  padding: 10px 20px 20px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
  align-content: start;
  scrollbar-width: thin;
  scrollbar-color: var(--t-border-soft) transparent;
}

.pos-item {
  display: flex;
  flex-direction: column;
  padding: 0;
  border-radius: 16px;
  border: 1px solid var(--t-border-subtle);
  background: var(--t-surface);
  cursor: pointer;
  transition: all 0.25s ease;
  position: relative;
  text-align: center;
  overflow: hidden;
}

.pos-item:hover {
  border-color: #046375;
  transform: translateY(-3px);
  box-shadow:
    0 8px 28px rgba(4, 99, 117, 0.18),
    0 2px 8px rgba(0, 0, 0, 0.2);
}

.pos-item:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.pos-item--off {
  opacity: 0.55;
  pointer-events: none;
  filter: grayscale(0.7);
  position: relative;
}
.pos-item--off::after {
  content: "";
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(0, 0, 0, 0.04) 8px, rgba(0, 0, 0, 0.04) 16px);
  border-radius: inherit;
  pointer-events: none;
}

.pos-item--skeleton {
  pointer-events: none;
  min-height: 180px;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.6;
  }
  50% {
    opacity: 0.3;
  }
}

.pos-item__img {
  width: 100%;
  aspect-ratio: 1;
  background: radial-gradient(circle at 50% 40%, rgba(4, 99, 117, 0.06) 0%, var(--t-hover) 70%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
}

.pos-item__img::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, transparent 50%, var(--t-surface) 100%);
  pointer-events: none;
}

.pos-item__img img {
  width: 60%;
  height: 60%;
  object-fit: contain;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15));
  transition: transform 0.3s ease;
}

.pos-item__img--photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: none;
}

.pos-item:hover .pos-item__img img {
  transform: scale(1.08);
}

.pos-item__body {
  padding: 0 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  position: relative;
  z-index: 1;
  margin-top: -8px;
}

.pos-item__name {
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--t-text);
  line-height: 1.3;
}

.pos-item__price {
  font-size: 0.875rem;
  font-weight: 800;
  color: #1F7F90;
  letter-spacing: -0.02em;
}

.pos-item__price small {
  font-weight: 500;
  font-size: 0.625rem;
  opacity: 0.6;
}

.pos-item__badge {
  position: absolute;
  top: 10px;
  left: 10px;
  font-size: 0.625rem;
  padding: 3px 8px;
  border-radius: 6px;
  background: rgba(220, 38, 38, 0.2);
  color: #f87171;
  font-weight: 700;
  backdrop-filter: blur(4px);
  z-index: 2;
}

.pos-empty {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 20px;
  color: var(--t-text-faint);
}

.pos-empty p {
  margin: 12px 0 0;
  font-size: 0.875rem;
  color: var(--t-text-faint);
}

/* ===== CART PANEL ===== */
.pos-cart {
  display: flex;
  flex-direction: column;
  background: var(--t-surface-alt);
  overflow: hidden;
}

.pos-cart__head {
  padding: 16px 18px 14px;
  border-bottom: 1px solid var(--t-border-subtle);
}

.pos-cart__head-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.pos-cart__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
  font-weight: 700;
  color: var(--t-text);
  margin: 0;
}

.pos-cart__title svg {
  color: #1F7F90;
}

.pos-cart__count {
  font-size: 0.75rem;
  font-weight: 700;
  color: white;
  background: #046375;
  padding: 2px 10px;
  border-radius: 10px;
}

.pos-cart__table {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 8px;
  background: var(--t-hover);
  border: 1px solid var(--t-border-subtle);
  color: var(--t-text-faint);
}

.pos-cart__table-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: var(--t-text);
  font-size: 0.8125rem;
}

.pos-cart__table-input::placeholder {
  color: var(--t-text-faint);
}

/* Cart Body */
.pos-cart__body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
  scrollbar-width: thin;
  scrollbar-color: var(--t-border-soft) transparent;
}

.pos-cart-item {
  padding: 10px 18px;
  transition: background 0.15s;
}

.pos-cart-item:hover {
  background: var(--t-hover);
}

.pos-cart-item__info {
  margin-bottom: 6px;
}

.pos-cart-item__name {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--t-text);
}

.pos-cart-item__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
}

.pos-cart-item__size {
  font-size: 0.6875rem;
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--t-border-subtle);
  color: var(--t-text-dim);
}

.pos-cart-item__unit-price {
  font-size: 0.6875rem;
  color: var(--t-text-faint);
}

.pos-cart-item__controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pos-qty {
  display: flex;
  align-items: center;
  border-radius: 8px;
  border: 1px solid var(--t-border-soft);
  overflow: hidden;
}

.pos-qty__btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--t-text-secondary);
  cursor: pointer;
  touch-action: manipulation;
  transition: all 0.15s;
}

.pos-qty__btn:hover {
  color: var(--t-text);
  background: var(--t-hover);
}

.pos-qty__btn--plus {
  color: #1F7F90;
}
.pos-qty__btn--plus:hover {
  background: rgba(4, 99, 117, 0.1);
}

.pos-qty__val {
  min-width: 28px;
  text-align: center;
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--t-text);
}

.pos-cart-item__total {
  flex: 1;
  text-align: left;
  font-size: 0.8125rem;
  font-weight: 700;
  color: #1F7F90;
}

.pos-cart-item__remove {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  border: none;
  background: none;
  color: var(--t-text-secondary);
  cursor: pointer;
  touch-action: manipulation;
  transition: all 0.15s;
}

.pos-cart-item__remove:hover {
  color: #f87171;
  background: rgba(220, 38, 38, 0.08);
}

/* Empty Cart */
.pos-cart__empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: var(--t-text-faint);
}

.pos-cart__empty p {
  margin: 8px 0 0;
  font-size: 0.875rem;
  color: var(--t-text-faint);
  font-weight: 500;
}

.pos-cart__empty span {
  font-size: 0.75rem;
  color: var(--t-text-faint);
}

/* Cart Footer */
.pos-cart__foot {
  border-top: 1px solid var(--t-border-subtle);
  padding: 14px 18px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Toggle Buttons */
.pos-pay-row {
  display: flex;
  gap: 8px;
}

.pos-toggle {
  display: flex;
  border-radius: 8px;
  border: 1px solid var(--t-border-soft);
  overflow: hidden;
  flex: 1;
}

.pos-toggle--small {
  flex: 0 0 auto;
}

.pos-toggle__btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px 10px;
  border: none;
  background: none;
  color: var(--t-text-faint);
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.pos-toggle__btn:hover {
  color: var(--t-text-muted);
}

.pos-toggle__btn--active {
  background: #046375;
  color: white;
  font-weight: 600;
}

.pos-field {
  margin-top: -4px;
}

.pos-select :deep(.v-field) {
  font-size: 0.8125rem !important;
}

/* Discount */
.pos-discount {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pos-discount__input {
  flex: 1;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid var(--t-border-soft);
  background: var(--t-hover);
  color: var(--t-text);
  font-size: 0.8125rem;
  outline: none;
}

.pos-discount__input:focus {
  border-color: rgba(4, 99, 117, 0.3);
}

.pos-discount__input::placeholder {
  color: var(--t-text-faint);
}

/* Totals */
.pos-totals {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pos-totals__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8125rem;
  color: var(--t-text-dim);
}

.pos-totals__row--discount span:last-child {
  color: #f87171;
}

.pos-totals__row--total {
  padding-top: 8px;
  border-top: 1px solid var(--t-border-subtle);
  margin-top: 4px;
}

.pos-totals__row--total span {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--t-text);
}

.pos-totals__row--total span:last-child {
  color: #1F7F90;
}

.pos-totals__row--total small {
  font-size: 0.75rem;
  font-weight: 400;
}

/* Checkout */
.pos-checkout {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #046375, #1F7F90);
  color: white;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 16px rgba(4, 99, 117, 0.25);
}

.pos-checkout:hover {
  box-shadow: 0 6px 24px rgba(4, 99, 117, 0.35);
  transform: translateY(-1px);
}

.pos-checkout:active {
  transform: translateY(0);
}

.pos-checkout:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.pos-clear {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 8px;
  border-radius: 8px;
  border: none;
  background: none;
  color: var(--t-text-faint);
  font-size: 0.8125rem;
  cursor: pointer;
  transition: color 0.15s;
}

.pos-clear:hover {
  color: #f87171;
}

/* ===== LOYALTY CUSTOMER ===== */
.pos-loyalty-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 6px;
  border-radius: 8px;
  border: 1px dashed var(--t-border-soft);
  background: none;
  color: var(--t-text-faint);
  font-size: 0.8rem;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
}
.pos-loyalty-toggle:hover {
  border-color: var(--t-primary);
  color: var(--t-primary);
}
.pos-loyalty {
  display: flex;
  gap: 6px;
  margin-top: 6px;
}
.pos-loyalty__input {
  flex: 1;
  padding: 7px 10px;
  border-radius: 8px;
  border: 1px solid var(--t-border-soft);
  background: var(--t-bg);
  color: var(--t-text);
  font-size: 0.8125rem;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s;
}
.pos-loyalty__input:focus {
  border-color: var(--t-primary);
}
.pos-loyalty__input::placeholder {
  color: var(--t-text-faint);
  opacity: 0.7;
}

.pos-order-notes {
  margin-top: 8px;
}
.pos-order-notes__input {
  width: 100%;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid var(--t-border-soft);
  background: var(--t-bg);
  color: var(--t-text);
  font-size: 0.8125rem;
  font-family: inherit;
  outline: none;
  resize: vertical;
  min-height: 38px;
  transition: border-color 0.15s;
}
.pos-order-notes__input:focus {
  border-color: var(--t-primary);
}
.pos-order-notes__input::placeholder {
  color: var(--t-text-faint);
  opacity: 0.7;
}

/* ===== DIALOG ===== */
.pos-dialog {
  background: var(--t-surface);
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--t-border-soft);
}

.pos-dialog__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  background: linear-gradient(135deg, #046375, #1F7F90);
}

.pos-dialog__head h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: white;
}

.pos-dialog__close {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: rgba(255, 255, 255, 0.15);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s;
}

.pos-dialog__close:hover {
  background: rgba(255, 255, 255, 0.25);
}

.pos-dialog__body {
  padding: 20px;
}

.pos-sizes__label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--t-text-muted);
  margin: 0 0 10px;
}

.pos-sizes__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
  margin-bottom: 16px;
}

.pos-size {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 14px 10px;
  border-radius: 12px;
  border: 2px solid var(--t-border-soft);
  background: var(--t-hover);
  cursor: pointer;
  transition: all 0.15s;
}

.pos-size:hover {
  border-color: rgba(4, 99, 117, 0.3);
}

.pos-size--active {
  border-color: #046375;
  background: rgba(4, 99, 117, 0.08);
}

.pos-size__name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--t-text);
}

.pos-size__price {
  font-size: 0.75rem;
  font-weight: 700;
  color: #1F7F90;
}

.pos-fixed-price {
  text-align: center;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1F7F90;
  padding: 16px 0;
  margin-bottom: 12px;
}

.pos-notes {
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--t-border-soft);
  background: var(--t-hover);
  color: var(--t-text);
  font-size: 0.8125rem;
  resize: none;
  outline: none;
  font-family: inherit;
}

.pos-notes:focus {
  border-color: rgba(4, 99, 117, 0.3);
}
.pos-notes::placeholder {
  color: var(--t-text-faint);
}

.pos-dialog__foot {
  padding: 16px 20px;
  border-top: 1px solid var(--t-border-subtle);
}

.pos-dialog__add {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #046375, #1F7F90);
  color: white;
  font-size: 0.9375rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.pos-dialog__add:hover {
  box-shadow: 0 4px 16px rgba(4, 99, 117, 0.25);
  transform: translateY(-1px);
}

/* ===== WAITER ORDERS ===== */
.pos-menu__head-end {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pos-waiter-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 14px;
  border-radius: 12px;
  border: 1px solid var(--t-border-medium);
  background: var(--t-surface);
  color: var(--t-text);
  font-size: 0.875rem;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.18s ease-out, border-color 0.18s ease-out;
}

.pos-waiter-btn svg {
  color: var(--t-primary);
}

.pos-waiter-btn:hover {
  background: var(--t-hover);
  border-color: var(--t-primary);
}

.pos-waiter-btn__badge {
  position: relative;
  isolation: isolate;
  min-width: 26px;
  height: 26px;
  padding: 0 7px;
  border-radius: 13px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8125rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  background: var(--t-surface-high);
  color: var(--t-text-dim);
}

.pos-waiter-btn--has {
  border-color: var(--t-primary);
}

.pos-waiter-btn--has .pos-waiter-btn__badge {
  background: var(--t-primary);
  color: #fff;
}

.pos-waiter-btn--has .pos-waiter-btn__badge::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: var(--t-primary);
  opacity: 0.45;
  z-index: -1;
  animation: pos-waiter-pulse 1.8s ease-out infinite;
}

@keyframes pos-waiter-pulse {
  0% { transform: scale(1); opacity: 0.45; }
  70%, 100% { transform: scale(1.7); opacity: 0; }
}

.pos-waiter-btn:focus-visible,
.pos-waiter-chip__x:focus-visible,
.pos-wo-btn:focus-visible,
.pos-wo-reason:focus-visible,
.pos-wo .pos-dialog__close:focus-visible,
.pos-dialog__close:focus-visible {
  outline: 2px solid var(--t-primary);
  outline-offset: 2px;
}

.pos-waiter-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  margin-bottom: 10px;
  padding-inline-start: 12px;
  padding-inline-end: 0;
  border-radius: 10px;
  border: 1px solid var(--t-primary);
  background: color-mix(in srgb, var(--t-primary) 10%, transparent);
  color: var(--t-text);
  font-size: 0.8125rem;
  font-weight: 700;
}

.pos-waiter-chip > svg {
  color: var(--t-primary);
  flex-shrink: 0;
}

.pos-waiter-chip__text {
  flex: 1;
  min-width: 0;
}

.pos-waiter-chip__x {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border: none;
  border-radius: 10px;
  background: none;
  color: var(--t-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s ease-out, color 0.15s ease-out;
}

.pos-waiter-chip__x:hover {
  background: var(--t-hover);
  color: var(--t-text);
}

.pos-wo {
  display: flex;
  flex-direction: column;
  max-height: 85vh;
}

.pos-wo__head-actions {
  display: flex;
  gap: 8px;
}

.pos-wo .pos-dialog__close {
  width: 44px;
  height: 44px;
}

.pos-wo .pos-dialog__close:disabled {
  opacity: 0.5;
  cursor: default;
}

.pos-wo__body {
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: var(--t-bg);
}

.pos-wo__notice {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 0.8125rem;
  font-weight: 600;
  background: var(--t-surface-high);
  color: var(--t-text-secondary);
}

.pos-wo__notice--warn {
  background: rgba(217, 119, 6, 0.12);
}

.pos-wo__notice--warn svg {
  color: #d97706;
}

.pos-wo__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px 16px;
  color: var(--t-text-faint);
}

.pos-wo__empty p {
  margin: 0;
  color: var(--t-text-dim);
  font-size: 0.9rem;
}

.pos-wo__spin {
  animation: pos-wo-spin 1s linear infinite;
}

@keyframes pos-wo-spin {
  to { transform: rotate(360deg); }
}

.pos-wo-card {
  background: var(--t-surface);
  border: 1px solid var(--t-border-medium);
  border-radius: 14px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pos-wo-card--active {
  border-color: var(--t-primary);
  box-shadow: 0 0 0 1px var(--t-primary);
}

.pos-wo-card__head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pos-wo-card__table {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 64px;
  padding: 6px 10px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--t-primary) 12%, transparent);
  color: var(--t-primary);
}

.pos-wo-card__table-label {
  font-size: 0.6875rem;
  font-weight: 700;
}

.pos-wo-card__table-num {
  font-size: 1.75rem;
  font-weight: 800;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}

.pos-wo-card__meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.pos-wo-card__waiter,
.pos-wo-card__time {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.pos-wo-card__waiter {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--t-text);
}

.pos-wo-card__time {
  font-size: 0.8125rem;
  color: var(--t-text-dim);
}

.pos-wo-card__tag {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 10px;
  background: var(--t-primary);
  color: #fff;
}

.pos-wo-card__lines {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  border-top: 1px solid var(--t-border-subtle);
  padding-top: 10px;
}

.pos-wo-card__line {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.pos-wo-card__line-main {
  display: flex;
  gap: 6px;
  font-size: 0.9rem;
  color: var(--t-text);
}

.pos-wo-card__qty {
  font-weight: 800;
  color: var(--t-primary);
  font-variant-numeric: tabular-nums;
}

.pos-wo-card__line-note {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8125rem;
  color: var(--t-text-muted);
  padding-inline-start: 22px;
}

.pos-wo-card__notes {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin: 0;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px dashed var(--t-border-strong);
  background: var(--t-hover);
  font-size: 0.8125rem;
  color: var(--t-text-secondary);
}

.pos-wo-card__notes svg {
  flex-shrink: 0;
  margin-top: 2px;
}

.pos-wo-card__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  border-top: 1px solid var(--t-border-subtle);
  padding-top: 10px;
}

.pos-wo-card__total {
  display: flex;
  flex-direction: column;
  font-size: 0.75rem;
  color: var(--t-text-dim);
}

.pos-wo-card__total strong {
  font-size: 1rem;
  color: var(--t-text);
  font-variant-numeric: tabular-nums;
}

.pos-wo-card__actions {
  display: flex;
  gap: 8px;
}

.pos-wo-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 44px;
  padding: 0 16px;
  border-radius: 12px;
  border: 1px solid transparent;
  font-size: 0.875rem;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.18s ease-out, box-shadow 0.18s ease-out, border-color 0.18s ease-out;
}

.pos-wo-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pos-wo-btn--primary {
  background: linear-gradient(135deg, #046375, #1F7F90);
  color: #fff;
}

.pos-wo-btn--primary:not(:disabled):hover {
  box-shadow: 0 4px 16px rgba(4, 99, 117, 0.25);
}

.pos-wo-btn--danger {
  background: none;
  border-color: rgba(220, 38, 38, 0.45);
  color: #dc2626;
}

.pos-wo-btn--danger:not(:disabled):hover {
  background: rgba(220, 38, 38, 0.08);
}

.pos-wo-btn--danger-solid {
  background: #dc2626;
  color: #fff;
}

.pos-wo-btn--danger-solid:not(:disabled):hover {
  background: #b91c1c;
}

.pos-wo-btn--ghost {
  background: var(--t-hover);
  border-color: var(--t-border-medium);
  color: var(--t-text);
}

.pos-wo-btn--ghost:hover {
  background: var(--t-surface-high);
}

.pos-dialog__head--danger {
  background: linear-gradient(135deg, #b91c1c, #dc2626);
}

.pos-wo-confirm__text {
  margin: 0;
  font-size: 0.9375rem;
  line-height: 1.7;
  color: var(--t-text);
}

.pos-wo-confirm__foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.pos-wo-reasons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.pos-wo-reason {
  min-height: 44px;
  padding: 0 14px;
  border-radius: 22px;
  border: 1px solid var(--t-border-medium);
  background: var(--t-hover);
  color: var(--t-text);
  font-size: 0.8125rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s ease-out, border-color 0.15s ease-out;
}

.pos-wo-reason--active {
  border-color: #dc2626;
  background: rgba(220, 38, 38, 0.1);
  color: var(--t-text);
}

@media (prefers-reduced-motion: reduce) {
  .pos-waiter-btn--has .pos-waiter-btn__badge::after,
  .pos-wo__spin {
    animation: none;
  }
  .pos-waiter-btn,
  .pos-waiter-chip__x,
  .pos-wo-btn,
  .pos-wo-reason {
    transition: none;
  }
}

@media (max-width: 600px) {
  .pos-waiter-btn__label {
    display: none;
  }
}

/* ===== RESPONSIVE ===== */
@media (max-width: 960px) {
  .pos {
    grid-template-columns: 1fr;
    height: auto;
    overflow: auto;
  }
  .pos-menu {
    max-height: 60vh;
  }
  .pos-cart {
    min-height: 50vh;
  }
  .pos-items {
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  }
}
</style>
