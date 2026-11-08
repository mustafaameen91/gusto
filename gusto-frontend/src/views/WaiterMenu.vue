<template>
  <AppLayout>
    <div class="wm" :class="{ 'wm--wide': wide, 'wm--mobile': mobileShell }">
      <!-- ===================== MAIN COLUMN ===================== -->
      <section class="wm-main" aria-label="قائمة الطعام">
        <header class="wm-top">
          <button
            type="button"
            class="wm-table"
            :class="{ 'wm-table--empty': !tableNumber, 'wm-table--attention': tableAttention }"
            :aria-label="tableNumber ? `الطاولة ${tableNumber} — اضغط للتغيير` : 'اختر رقم الطاولة'"
            @click="openTablePicker"
          >
            <span class="wm-table__icon"><PhChair :size="26" weight="duotone" /></span>
            <span class="wm-table__text">
              <span class="wm-table__label">الطاولة</span>
              <span class="wm-table__value">{{ tableNumber || "اختر" }}</span>
            </span>
          </button>

          <div class="wm-seg" role="tablist" aria-label="عرض">
            <button
              type="button"
              role="tab"
              class="wm-seg__btn"
              :class="{ 'wm-seg__btn--active': view === 'menu' }"
              :aria-selected="view === 'menu'"
              @click="view = 'menu'"
            >
              <PhForkKnife :size="20" weight="duotone" />
              <span>القائمة</span>
            </button>
            <button
              type="button"
              role="tab"
              class="wm-seg__btn"
              :class="{ 'wm-seg__btn--active': view === 'orders' }"
              :aria-selected="view === 'orders'"
              @click="openMyOrders"
            >
              <PhListChecks :size="20" weight="duotone" />
              <span>طلباتي</span>
              <span v-if="pendingMineCount" class="wm-seg__badge" :aria-label="`${pendingMineCount} بانتظار الكاشير`">{{ pendingMineCount }}</span>
            </button>
          </div>
        </header>

        <p v-if="!socketConnected" class="wm-offline" role="status">
          <PhWifiSlash :size="18" weight="bold" />
          <span>التحديث المباشر متوقف — تُحدَّث حالة طلباتك كل 30 ثانية</span>
        </p>

        <!-- ===================== MENU VIEW ===================== -->
        <template v-if="view === 'menu'">
          <div class="wm-filters">
            <label class="wm-search">
              <span class="wm-sr">ابحث في القائمة</span>
              <PhMagnifyingGlass :size="22" class="wm-search__icon" aria-hidden="true" />
              <input v-model="search" type="search" class="wm-search__input" placeholder="ابحث عن طبق…" autocomplete="off" enterkeyhint="search" />
              <button v-if="search" type="button" class="wm-search__clear" aria-label="مسح البحث" title="مسح البحث" @click="search = ''">
                <PhX :size="20" weight="bold" />
              </button>
            </label>

            <nav v-if="!loadingMenu && visibleCategories.length" class="wm-cats" aria-label="التصنيفات">
              <button
                v-for="cat in visibleCategories"
                :key="cat.idCategory"
                type="button"
                class="wm-cat"
                :class="{ 'wm-cat--active': !searching && selectedCategory === cat.idCategory }"
                :aria-pressed="!searching && selectedCategory === cat.idCategory"
                @click="selectCategory(cat.idCategory)"
              >
                {{ cat.categoryName || cat.name }}
                <span class="wm-cat__count">{{ categoryCounts[cat.idCategory] || 0 }}</span>
              </button>
            </nav>
            <div v-else-if="loadingMenu" class="wm-cats" aria-hidden="true">
              <span v-for="n in 5" :key="`cat-skel-${n}`" class="wm-cat wm-cat--skel wm-shimmer" />
            </div>
          </div>

          <div ref="gridScroll" class="wm-scroll">
            <!-- loading -->
            <div v-if="loadingMenu" class="wm-grid" aria-busy="true" aria-label="جارٍ تحميل القائمة">
              <div v-for="n in 8" :key="`dish-skel-${n}`" class="wm-dish wm-dish--skel">
                <div class="wm-dish__img wm-shimmer" />
                <div class="wm-dish__body">
                  <span class="wm-skel-line wm-shimmer" style="width: 70%" />
                  <span class="wm-skel-line wm-skel-line--sm wm-shimmer" style="width: 90%" />
                  <span class="wm-skel-line wm-skel-line--sm wm-shimmer" style="width: 40%" />
                </div>
              </div>
            </div>

            <!-- load error -->
            <div v-else-if="menuError" class="wm-empty" role="alert">
              <PhBowlFood :size="56" weight="duotone" class="wm-empty__icon" />
              <h2 class="wm-empty__title">تعذّر تحميل القائمة</h2>
              <p class="wm-empty__text">{{ menuError }}</p>
              <button type="button" class="wm-btn wm-btn--primary" @click="loadAll">
                <PhArrowClockwise :size="20" weight="bold" />
                إعادة المحاولة
              </button>
            </div>

            <!-- empty / no results -->
            <div v-else-if="!shownDishes.length" class="wm-empty">
              <PhMagnifyingGlass v-if="searching" :size="56" weight="duotone" class="wm-empty__icon" />
              <PhBowlFood v-else :size="56" weight="duotone" class="wm-empty__icon" />
              <h2 class="wm-empty__title">{{ searching ? `لا نتائج لـ «${search.trim()}»` : "لا توجد أطباق بعد" }}</h2>
              <p class="wm-empty__text">
                {{ searching ? "جرّب كلمة أقصر أو تحقق من الإملاء." : "لم تُضف أطباق إلى القائمة. اطلب من المدير إضافتها من صفحة القائمة." }}
              </p>
              <button v-if="searching" type="button" class="wm-btn wm-btn--ghost" @click="search = ''">مسح البحث</button>
            </div>

            <template v-else>
              <p v-if="searching" class="wm-results" aria-live="polite">{{ shownDishes.length }} نتيجة</p>
              <div class="wm-grid">
                <article
                  v-for="dish in shownDishes"
                  :key="dish.idMenuItem"
                  class="wm-dish"
                  :class="{
                    'wm-dish--off': dish.blocked,
                    'wm-dish--in': qtyByItem[dish.idMenuItem] > 0,
                    'wm-dish--pulse': pulseId === dish.idMenuItem,
                  }"
                >
                  <button
                    type="button"
                    class="wm-dish__main"
                    :disabled="dish.blocked || loadingSizesFor === dish.idMenuItem"
                    :aria-label="dishAria(dish)"
                    @click="tapDish(dish)"
                  >
                    <div class="wm-dish__img" :class="{ 'wm-dish__img--logo': !dish.imageUrl }">
                      <img :src="dish.imageUrl || logoPng" :alt="dish.itemName" loading="lazy" decoding="async" @error="onItemImgError" />
                      <span v-if="qtyByItem[dish.idMenuItem]" class="wm-dish__badge" aria-hidden="true">{{ qtyByItem[dish.idMenuItem] }}</span>
                      <span v-if="dish.blocked" class="wm-dish__out">
                        <PhProhibit :size="18" weight="bold" />
                        {{ dish.soldOut ? "نفذت الكمية" : "غير متاح" }}
                      </span>
                      <span v-else-if="dish.stockLeft !== null && dish.stockLeft <= 5" class="wm-dish__left">متبقٍ {{ dish.stockLeft }}</span>
                      <span v-if="loadingSizesFor === dish.idMenuItem" class="wm-dish__loading"><v-progress-circular indeterminate size="28" width="3" /></span>
                    </div>
                    <div class="wm-dish__body">
                      <h3 class="wm-dish__name">{{ dish.itemName }}</h3>
                      <p v-if="dish.description" class="wm-dish__desc">{{ dish.description }}</p>
                      <div class="wm-dish__foot">
                        <span class="wm-dish__price">
                          <small v-if="dish.sizeCount > 1">من</small>
                          {{ money(dish.fromPrice) }}
                        </span>
                        <span v-if="dish.sizeCount > 0" class="wm-dish__sizes">{{ dish.sizeCount }} أحجام</span>
                      </div>
                    </div>
                  </button>

                  <div v-if="qtyByItem[dish.idMenuItem] && dish.sizeCount === 0 && quickLine(dish)" class="wm-dish__stepper">
                    <button type="button" class="wm-step" :aria-label="`إنقاص ${dish.itemName}`" :title="`إنقاص ${dish.itemName}`" @click="decLine(quickLine(dish))">
                      <PhTrash v-if="quickLine(dish).quantity === 1" :size="20" weight="bold" />
                      <PhMinus v-else :size="20" weight="bold" />
                    </button>
                    <span class="wm-step__qty" aria-live="polite">{{ quickLine(dish).quantity }}</span>
                    <button
                      type="button"
                      class="wm-step wm-step--plus"
                      :disabled="dish.blocked"
                      :aria-label="`زيادة ${dish.itemName}`"
                      :title="`زيادة ${dish.itemName}`"
                      @click="incLine(quickLine(dish))"
                    >
                      <PhPlus :size="20" weight="bold" />
                    </button>
                  </div>
                </article>
              </div>
            </template>
          </div>
        </template>

        <!-- ===================== MY ORDERS VIEW ===================== -->
        <div v-else class="wm-scroll wm-orders">
          <div class="wm-orders__head">
            <h2 class="wm-orders__title">طلباتي اليوم</h2>
            <button type="button" class="wm-btn wm-btn--ghost" :disabled="loadingMine" @click="loadMine(true)">
              <PhArrowClockwise :size="20" weight="bold" :class="{ 'wm-spin': loadingMine }" />
              تحديث
            </button>
          </div>

          <div v-if="loadingMine && !myOrders.length" class="wm-orders__list" aria-busy="true">
            <div v-for="n in 3" :key="`ord-skel-${n}`" class="wm-ord wm-ord--skel">
              <span class="wm-skel-line wm-shimmer" style="width: 40%" />
              <span class="wm-skel-line wm-skel-line--sm wm-shimmer" style="width: 80%" />
              <span class="wm-skel-line wm-skel-line--sm wm-shimmer" style="width: 60%" />
            </div>
          </div>

          <div v-else-if="!myOrders.length" class="wm-empty">
            <PhReceipt :size="56" weight="duotone" class="wm-empty__icon" />
            <h2 class="wm-empty__title">لم ترسل أي طلب بعد</h2>
            <p class="wm-empty__text">اختر الطاولة، أضف الأطباق من القائمة ثم اضغط «إرسال إلى الكاشير». ستظهر طلباتك هنا مع حالتها.</p>
            <button type="button" class="wm-btn wm-btn--primary" @click="view = 'menu'">
              <PhForkKnife :size="20" weight="bold" />
              فتح القائمة
            </button>
          </div>

          <ul v-else class="wm-orders__list">
            <li v-for="o in myOrders" :key="o.idWaiterOrder" class="wm-ord" :class="`wm-ord--${o.status}`">
              <div class="wm-ord__head">
                <span class="wm-ord__table"><PhChair :size="20" weight="duotone" /> طاولة {{ o.tableNumber }}</span>
                <span class="wm-ord__time"><PhClock :size="16" /> {{ timeOf(o.createdAt) }}</span>
              </div>
              <p class="wm-status" :class="`wm-status--${o.status}`">
                <component :is="statusMeta(o).icon" :size="20" weight="bold" aria-hidden="true" />
                <span>{{ statusMeta(o).text }}</span>
              </p>
              <ul class="wm-ord__items">
                <li v-for="(it, idx) in o.items || []" :key="`${o.idWaiterOrder}-${idx}`">
                  <span class="wm-ord__qty">{{ it.quantity }}×</span>
                  <span>{{ it.itemName }}<template v-if="it.sizeName"> ({{ it.sizeName }})</template></span>
                  <span v-if="it.specialInstructions" class="wm-ord__note">— {{ it.specialInstructions }}</span>
                </li>
              </ul>
              <p v-if="o.notes" class="wm-ord__notes"><PhNotePencil :size="16" /> {{ o.notes }}</p>
              <div class="wm-ord__foot">
                <span class="wm-ord__total">{{ money(o.total) }}</span>
                <button
                  v-if="o.status === 'pending'"
                  type="button"
                  class="wm-btn wm-btn--danger-ghost"
                  :disabled="cancellingId === o.idWaiterOrder"
                  @click="askCancel(o)"
                >
                  <v-progress-circular v-if="cancellingId === o.idWaiterOrder" indeterminate size="18" width="2" />
                  <PhXCircle v-else :size="20" weight="bold" />
                  إلغاء
                </button>
              </div>
            </li>
          </ul>
        </div>

        <!-- Narrow screens: sticky bar that opens the order sheet -->
        <div v-if="!wide" class="wm-bar">
          <button type="button" class="wm-bar__btn" :class="{ 'wm-bar__btn--empty': !lineCount }" :aria-expanded="sheetOpen" @click="openSheet">
            <PhCaretUp :size="22" weight="bold" />
            <span class="wm-bar__label">عرض الطلب ({{ lineCount }})</span>
            <span class="wm-bar__total">{{ money(total) }}</span>
          </button>
        </div>
      </section>

      <!-- ===================== ORDER PANEL / SHEET ===================== -->
      <div v-if="!wide && sheetOpen" class="wm-scrim" aria-hidden="true" @click="sheetOpen = false" />
      <aside
        v-show="wide || sheetVisible"
        ref="orderPanel"
        class="wm-order"
        :class="{ 'wm-order--sheet': !wide, 'wm-order--open': wide || sheetOpen }"
        :role="wide ? null : 'dialog'"
        :aria-modal="wide ? null : 'true'"
        aria-labelledby="wm-order-title"
        @keydown.esc="!wide && (sheetOpen = false)"
        @transitionend="onSheetTransitionEnd"
      >
        <div v-if="!wide" class="wm-order__grip" aria-hidden="true" />
        <header class="wm-order__head">
          <div>
            <h2 id="wm-order-title" class="wm-order__title">الطلب</h2>
            <button type="button" class="wm-order__table" @click="openTablePicker">
              <PhChair :size="18" weight="duotone" />
              {{ tableNumber ? `طاولة ${tableNumber}` : "لم تُختر طاولة" }}
            </button>
          </div>
          <button v-if="!wide" ref="sheetClose" type="button" class="wm-icon-btn" aria-label="إغلاق الطلب" title="إغلاق الطلب" @click="sheetOpen = false">
            <PhX :size="24" weight="bold" />
          </button>
          <button v-else-if="lines.length" type="button" class="wm-btn wm-btn--danger-ghost wm-btn--sm" @click="askClear">
            <PhTrash :size="18" weight="bold" />
            تفريغ
          </button>
        </header>

        <div class="wm-order__lines">
          <div v-if="!lines.length" class="wm-empty wm-empty--compact">
            <PhShoppingBagOpen :size="48" weight="duotone" class="wm-empty__icon" />
            <h3 class="wm-empty__title">الطلب فارغ</h3>
            <p class="wm-empty__text">اضغط على أي طبق لإضافته. الأطباق ذات الأحجام تطلب منك اختيار الحجم.</p>
          </div>
          <ul v-else class="wm-lines">
            <li v-for="line in lines" :key="line.key" class="wm-line">
              <div class="wm-line__info">
                <span class="wm-line__name">
                  {{ line.itemName }}<template v-if="line.sizeName"> <span class="wm-line__size">({{ line.sizeName }})</span></template>
                </span>
                <button type="button" class="wm-line__note" :class="{ 'wm-line__note--empty': !line.note }" @click="openNoteEditor(line)">
                  <PhNotePencil :size="16" weight="bold" />
                  <span>{{ line.note || "إضافة ملاحظة للمطبخ" }}</span>
                </button>
              </div>
              <div class="wm-line__ctrl">
                <div class="wm-line__stepper">
                  <button type="button" class="wm-step" :aria-label="`إنقاص ${line.itemName}`" :title="`إنقاص ${line.itemName}`" @click="decLine(line)">
                    <PhTrash v-if="line.quantity === 1" :size="20" weight="bold" />
                    <PhMinus v-else :size="20" weight="bold" />
                  </button>
                  <span class="wm-step__qty">{{ line.quantity }}</span>
                  <button type="button" class="wm-step wm-step--plus" :aria-label="`زيادة ${line.itemName}`" :title="`زيادة ${line.itemName}`" @click="incLine(line)">
                    <PhPlus :size="20" weight="bold" />
                  </button>
                </div>
                <span class="wm-line__total">{{ money(line.unitPrice * line.quantity) }}</span>
              </div>
            </li>
          </ul>
        </div>

        <footer class="wm-order__foot">
          <label class="wm-field">
            <span class="wm-field__label">ملاحظة على الطلب</span>
            <textarea v-model="orderNote" class="wm-field__input" rows="2" maxlength="500" placeholder="مثال: الزبون مستعجل، قدّم المقبلات أولاً" />
          </label>
          <div class="wm-sum">
            <span class="wm-sum__label">الإجمالي التقريبي</span>
            <span class="wm-sum__value">{{ money(total) }}</span>
          </div>
          <p class="wm-sum__hint">السعر النهائي يحسبه الكاشير عند البيع.</p>
          <button type="button" class="wm-send" :disabled="sending || !lines.length" :aria-busy="sending" @click="send">
            <v-progress-circular v-if="sending" indeterminate size="24" width="3" />
            <template v-else>
              <PhChair v-if="lines.length && !tableNumber" :size="24" weight="bold" />
              <PhPaperPlaneTilt v-else :size="24" weight="bold" />
            </template>
            <span>{{ sendLabel }}</span>
          </button>
        </footer>
      </aside>

      <!-- screen-reader announcements for quick adds -->
      <p class="wm-sr" aria-live="polite">{{ announce }}</p>
    </div>

    <!-- ===================== TABLE PICKER ===================== -->
    <v-dialog v-model="tableDialog" max-width="620" scrollable>
      <div class="wm-dlg" role="document">
        <header class="wm-dlg__head">
          <h2 class="wm-dlg__title"><PhChair :size="26" weight="duotone" /> اختر الطاولة</h2>
          <button type="button" class="wm-icon-btn" aria-label="إغلاق" title="إغلاق" @click="tableDialog = false"><PhX :size="24" weight="bold" /></button>
        </header>
        <div class="wm-dlg__body">
          <div class="wm-keypad" role="group" aria-label="أرقام الطاولات">
            <button
              v-for="n in 30"
              :key="`t-${n}`"
              type="button"
              class="wm-key"
              :class="{ 'wm-key--active': tableNumber === String(n) }"
              :aria-pressed="tableNumber === String(n)"
              @click="pickTable(String(n))"
            >
              {{ n }}
            </button>
          </div>
          <form class="wm-custom-table" @submit.prevent="pickTable(customTable)">
            <label class="wm-field wm-field--grow">
              <span class="wm-field__label">رقم أو اسم آخر</span>
              <input v-model="customTable" class="wm-field__input" maxlength="20" placeholder="مثال: سفري، VIP 2، 45" />
            </label>
            <button type="submit" class="wm-btn wm-btn--primary" :disabled="!customTable.trim()">تأكيد</button>
          </form>
          <div class="wm-quick-tables">
            <button type="button" class="wm-chip" @click="pickTable('سفري')">سفري</button>
            <button v-if="tableNumber" type="button" class="wm-chip wm-chip--danger" @click="pickTable('')">إزالة الطاولة</button>
          </div>
        </div>
      </div>
    </v-dialog>

    <!-- ===================== DISH OPTIONS (sizes) ===================== -->
    <v-dialog v-model="dishDialog" max-width="560" scrollable>
      <div v-if="dishDraft.dish" class="wm-dlg">
        <div class="wm-dlg__hero" :class="{ 'wm-dlg__hero--logo': !dishDraft.dish.imageUrl }">
          <img :src="dishDraft.dish.imageUrl || logoPng" :alt="dishDraft.dish.itemName" @error="onItemImgError" />
          <button type="button" class="wm-icon-btn wm-icon-btn--float" aria-label="إغلاق" title="إغلاق" @click="dishDialog = false"><PhX :size="24" weight="bold" /></button>
        </div>
        <div class="wm-dlg__body">
          <h2 class="wm-dlg__title">{{ dishDraft.dish.itemName }}</h2>
          <p v-if="dishDraft.dish.description" class="wm-dlg__desc">{{ dishDraft.dish.description }}</p>

          <fieldset class="wm-fieldset">
            <legend class="wm-field__label">الحجم</legend>
            <div class="wm-sizes" role="radiogroup" aria-label="الحجم">
              <button
                v-for="s in dishDraft.sizes"
                :key="s.idItemSize"
                type="button"
                role="radio"
                class="wm-size"
                :class="{ 'wm-size--active': dishDraft.sizeId === s.idItemSize }"
                :aria-checked="dishDraft.sizeId === s.idItemSize"
                @click="dishDraft.sizeId = s.idItemSize"
              >
                <PhCheckCircle v-if="dishDraft.sizeId === s.idItemSize" :size="20" weight="fill" class="wm-size__check" />
                <span class="wm-size__name">{{ s.sizeName }}</span>
                <span class="wm-size__price">{{ money(sizePrice(dishDraft.dish, s)) }}</span>
              </button>
            </div>
          </fieldset>

          <div class="wm-qty-row">
            <span class="wm-field__label">الكمية</span>
            <div class="wm-line__stepper wm-line__stepper--lg">
              <button type="button" class="wm-step" aria-label="إنقاص الكمية" title="إنقاص الكمية" :disabled="dishDraft.qty <= 1" @click="dishDraft.qty--">
                <PhMinus :size="22" weight="bold" />
              </button>
              <span class="wm-step__qty">{{ dishDraft.qty }}</span>
              <button type="button" class="wm-step wm-step--plus" aria-label="زيادة الكمية" title="زيادة الكمية" @click="dishDraft.qty++">
                <PhPlus :size="22" weight="bold" />
              </button>
            </div>
          </div>

          <label class="wm-field">
            <span class="wm-field__label">ملاحظة للمطبخ <small>(اختياري)</small></span>
            <input v-model="dishDraft.note" class="wm-field__input" maxlength="255" placeholder="مثال: بدون بصل" />
          </label>
          <div class="wm-quick-notes" role="group" aria-label="ملاحظات سريعة">
            <button v-for="q in quickNotes" :key="q" type="button" class="wm-chip" @click="dishDraft.note = appendNote(dishDraft.note, q)">{{ q }}</button>
          </div>
        </div>
        <footer class="wm-dlg__foot">
          <button type="button" class="wm-send" :disabled="!dishDraft.sizeId" @click="confirmDish">
            <PhPlus :size="22" weight="bold" />
            <span>إضافة — {{ money(dishDraftTotal) }}</span>
          </button>
        </footer>
      </div>
    </v-dialog>

    <!-- ===================== LINE NOTE EDITOR ===================== -->
    <v-dialog v-model="noteDialog" max-width="520">
      <div class="wm-dlg">
        <header class="wm-dlg__head">
          <h2 class="wm-dlg__title"><PhNotePencil :size="24" weight="duotone" /> ملاحظة للمطبخ</h2>
          <button type="button" class="wm-icon-btn" aria-label="إغلاق" title="إغلاق" @click="noteDialog = false"><PhX :size="24" weight="bold" /></button>
        </header>
        <div class="wm-dlg__body">
          <p class="wm-dlg__desc">{{ noteDraft.label }}</p>
          <label class="wm-field">
            <span class="wm-field__label">الملاحظة</span>
            <input v-model="noteDraft.text" class="wm-field__input" maxlength="255" placeholder="مثال: بدون بصل" @keydown.enter.prevent="saveNote" />
          </label>
          <div class="wm-quick-notes" role="group" aria-label="ملاحظات سريعة">
            <button v-for="q in quickNotes" :key="q" type="button" class="wm-chip" @click="noteDraft.text = appendNote(noteDraft.text, q)">{{ q }}</button>
          </div>
        </div>
        <footer class="wm-dlg__foot wm-dlg__foot--row">
          <button type="button" class="wm-btn wm-btn--ghost" @click="noteDialog = false">إلغاء</button>
          <button type="button" class="wm-btn wm-btn--primary" @click="saveNote">حفظ</button>
        </footer>
      </div>
    </v-dialog>

    <!-- ===================== CONFIRM ===================== -->
    <v-dialog v-model="confirm.open" max-width="440">
      <div class="wm-dlg" role="alertdialog" aria-labelledby="wm-confirm-title">
        <div class="wm-dlg__body">
          <h2 id="wm-confirm-title" class="wm-dlg__title">{{ confirm.title }}</h2>
          <p class="wm-dlg__desc">{{ confirm.text }}</p>
        </div>
        <footer class="wm-dlg__foot wm-dlg__foot--row">
          <button type="button" class="wm-btn wm-btn--ghost" @click="confirm.open = false">تراجع</button>
          <button type="button" class="wm-btn wm-btn--danger" @click="runConfirm">{{ confirm.action }}</button>
        </footer>
      </div>
    </v-dialog>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";
import { useToast } from "vue-toastification";
import AppLayout from "@/components/AppLayout.vue";
import { useAuthStore } from "@/stores/auth";
import { categoryAPI, menuAPI, itemSizeAPI, kitchenStockAPI, waiterOrderAPI } from "@/services/api";
import logoPng from "@/assets/logo.png";
import {
  PhChair,
  PhMagnifyingGlass,
  PhX,
  PhPlus,
  PhMinus,
  PhTrash,
  PhPaperPlaneTilt,
  PhNotePencil,
  PhClock,
  PhCheckCircle,
  PhXCircle,
  PhProhibit,
  PhReceipt,
  PhForkKnife,
  PhWifiSlash,
  PhCaretUp,
  PhArrowClockwise,
  PhBowlFood,
  PhHourglassMedium,
  PhListChecks,
  PhShoppingBagOpen,
} from "@phosphor-icons/vue";

const toast = useToast();
const authStore = useAuthStore();

const DRAFT_KEY = "gusto_waiter_draft";
const WIDE_QUERY = "(min-width: 1100px)";
const quickNotes = ["بدون بصل", "بدون مايونيز", "حار", "بدون ملح", "استواء كامل", "صوص جانبي"];

// ───────────────────────── helpers ─────────────────────────
const money = (v) => (Number(v) || 0).toLocaleString() + " د.ع";
const truthy = (v) => v === 1 || v === true || v === "1";
const onItemImgError = (e) => {
  if (e?.target && !e.target.src.endsWith(logoPng)) e.target.src = logoPng;
};
const normalize = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[ً-ْـ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .trim();
const appendNote = (cur, add) => {
  const c = String(cur || "").trim();
  if (!c) return add;
  if (c.includes(add)) return c;
  return `${c}، ${add}`.slice(0, 255);
};
const timeOf = (d) => {
  try {
    return new Date(d).toLocaleTimeString("ar-IQ-u-nu-latn", { hour: "2-digit", minute: "2-digit" });
  } catch (_) {
    return "";
  }
};
const myId = computed(() => {
  if (authStore.user?.id != null) return Number(authStore.user.id);
  try {
    const u = JSON.parse(localStorage.getItem("gusto_user") || "null");
    return u?.id != null ? Number(u.id) : null;
  } catch (_) {
    return null;
  }
});

// ───────────────────────── layout ─────────────────────────
const wide = ref(false);
const mobileShell = ref(false); // AppLayout shows its 56px top bar below 960px
let mql = null;
const onWideChange = () => {
  wide.value = !!mql?.matches;
  if (wide.value) {
    sheetOpen.value = false;
    sheetVisible.value = false;
  }
};
const onResize = () => {
  mobileShell.value = window.innerWidth < 960;
};

const view = ref("menu");
const sheetOpen = ref(false);
const sheetVisible = ref(false); // stays true while the close transition runs
const sheetClose = ref(null);
const orderPanel = ref(null);
const gridScroll = ref(null);
const reduceMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const openSheet = async () => {
  sheetVisible.value = true;
  await nextTick();
  requestAnimationFrame(() => {
    sheetOpen.value = true;
    nextTick(() => sheetClose.value?.focus());
  });
};
const onSheetTransitionEnd = (e) => {
  if (e.target === orderPanel.value && !sheetOpen.value) sheetVisible.value = false;
};
watch(sheetOpen, (open) => {
  if (!open && reduceMotion()) sheetVisible.value = false;
});

// ───────────────────────── menu data ─────────────────────────
const categories = ref([]);
const menuItems = ref([]);
const kitchenStock = ref([]);
const sizesCache = ref({});
const loadingMenu = ref(true);
const menuError = ref("");
const selectedCategory = ref(null);
const search = ref("");
const loadingSizesFor = ref(null);

const loadKitchenStock = async () => {
  try {
    const res = await kitchenStockAPI.getMenu(true);
    kitchenStock.value = Array.isArray(res.data) ? res.data : res.data?.items || [];
  } catch (_) {
    kitchenStock.value = [];
  }
};

const loadAll = async () => {
  loadingMenu.value = true;
  menuError.value = "";
  try {
    const [catRes, menuRes] = await Promise.all([categoryAPI.getAll(), menuAPI.getAll(), loadKitchenStock()]);
    const cats = Array.isArray(catRes?.data) ? catRes.data : [];
    const items = Array.isArray(menuRes?.data) ? menuRes.data : [];
    if (typeof catRes?.data === "string" || typeof menuRes?.data === "string") throw new Error("خطأ في الاتصال بالخادم");
    categories.value = cats;
    menuItems.value = items.map((item) => ({
      ...item,
      isAvailable: truthy(item.isAvailable),
      isActive: truthy(item.isActive),
      itemName: item.itemName || "بدون اسم",
      basePrice: Number(item.basePrice) || 0,
      imageUrl: item.imageUrl || null,
      description: (item.description || "").trim(),
    }));
    if (!visibleCategories.value.some((c) => c.idCategory === selectedCategory.value)) {
      selectedCategory.value = visibleCategories.value[0]?.idCategory ?? null;
    }
    setTimeout(preloadAllSizes, 600);
  } catch (e) {
    menuError.value = e?.response?.data?.message || e?.message || "تحقق من الاتصال بالشبكة ثم أعد المحاولة.";
  } finally {
    loadingMenu.value = false;
  }
};

const fetchSizes = async (id) => {
  if (sizesCache.value[id]) return sizesCache.value[id];
  try {
    const res = await itemSizeAPI.getByMenuItem(id);
    sizesCache.value[id] = Array.isArray(res.data) ? res.data : [];
  } catch (_) {
    sizesCache.value[id] = [];
  }
  return sizesCache.value[id];
};
const preloadAllSizes = async () => {
  const ids = menuItems.value.filter((i) => i.isActive).map((i) => i.idMenuItem);
  for (let i = 0; i < ids.length; i += 10) {
    await Promise.all(ids.slice(i, i + 10).filter((id) => !sizesCache.value[id]).map(fetchSizes));
  }
};

const activeItems = computed(() => menuItems.value.filter((i) => i && i.idMenuItem && i.isActive));
const visibleCategories = computed(() => categories.value.filter((c) => activeItems.value.some((i) => i.categoryId === c.idCategory)));
const categoryCounts = computed(() => {
  const m = {};
  for (const i of activeItems.value) m[i.categoryId] = (m[i.categoryId] || 0) + 1;
  return m;
});
const kitchenCatIds = computed(() => new Set(categories.value.filter((c) => truthy(c.isKitchen)).map((c) => c.idCategory)));
const stockMap = computed(() => new Map((kitchenStock.value || []).map((x) => [x.menuItemId, Number(x.quantity) || 0])));

// Same rule as Cashier: only dishes in a kitchen category that have a stock row are limited
const stockOf = (menuItemId, categoryId) => {
  if (!kitchenCatIds.value.has(categoryId) || !stockMap.value.has(menuItemId)) return null;
  return stockMap.value.get(menuItemId);
};
const sizePrice = (dish, s) => Number(dish.basePrice) + (Number(s.priceAdjustment) || 0);

const decorate = (item) => {
  const stock = stockOf(item.idMenuItem, item.categoryId);
  const sizes = sizesCache.value[item.idMenuItem] || [];
  const soldOut = stock !== null && stock <= 0;
  const stockLeft = stock === null ? null : Math.max(0, stock - (qtyByItem.value[item.idMenuItem] || 0));
  return {
    ...item,
    soldOut,
    blocked: soldOut || !item.isAvailable,
    stockLeft,
    sizeCount: sizes.length,
    fromPrice: sizes.length ? Math.min(...sizes.map((s) => sizePrice(item, s))) : item.basePrice,
  };
};

const searching = computed(() => normalize(search.value).length > 0);
const shownDishes = computed(() => {
  const q = normalize(search.value);
  const list = q
    ? activeItems.value.filter((i) => normalize(i.itemName).includes(q) || normalize(i.description).includes(q))
    : activeItems.value.filter((i) => i.categoryId === selectedCategory.value);
  return list.map(decorate);
});

const selectCategory = (id) => {
  search.value = "";
  selectedCategory.value = id;
  gridScroll.value?.scrollTo?.({ top: 0, behavior: reduceMotion() ? "auto" : "smooth" });
};

const dishAria = (d) => {
  if (d.blocked) return `${d.itemName} — ${d.soldOut ? "نفذت الكمية" : "غير متاح"}`;
  const q = qtyByItem.value[d.idMenuItem];
  return `${d.itemName}، ${money(d.fromPrice)}${d.sizeCount ? "، اختر الحجم" : "، اضغط للإضافة"}${q ? `، في الطلب ${q}` : ""}`;
};

// ───────────────────────── cart ─────────────────────────
const tableNumber = ref("");
const lines = ref([]);
const orderNote = ref("");
const announce = ref("");
const pulseId = ref(null);
let pulseTimer = null;

const lineKey = (menuItemId, sizeId, note) => `${menuItemId}|${sizeId || 0}|${String(note || "").trim()}`;
const qtyByItem = computed(() => {
  const m = {};
  for (const l of lines.value) m[l.menuItemId] = (m[l.menuItemId] || 0) + l.quantity;
  return m;
});
const lineCount = computed(() => lines.value.reduce((t, l) => t + l.quantity, 0));
const total = computed(() => lines.value.reduce((t, l) => t + l.unitPrice * l.quantity, 0));
const quickLine = (dish) => lines.value.find((l) => l.key === lineKey(dish.idMenuItem, null, "")) || [...lines.value].reverse().find((l) => l.menuItemId === dish.idMenuItem);

// Remaining portions for kitchen-tracked dishes (null = unlimited)
const roomFor = (menuItemId) => {
  const item = menuItems.value.find((m) => m.idMenuItem === menuItemId);
  if (!item) return Infinity;
  const stock = stockOf(menuItemId, item.categoryId);
  if (stock === null) return Infinity;
  return stock - (qtyByItem.value[menuItemId] || 0);
};
const warnStock = (menuItemId) => {
  const item = menuItems.value.find((m) => m.idMenuItem === menuItemId);
  const stock = item ? stockOf(menuItemId, item.categoryId) : null;
  toast.warning(stock > 0 ? `المتبقي من ${item.itemName} ${stock} فقط` : `نفذت كمية ${item?.itemName || "الطبق"}`);
};

const addLine = ({ dish, size, qty, note }) => {
  const room = roomFor(dish.idMenuItem);
  if (room <= 0) return warnStock(dish.idMenuItem);
  const quantity = Math.min(qty, room);
  if (quantity < qty) warnStock(dish.idMenuItem);
  const cleanNote = String(note || "").trim().slice(0, 255);
  const key = lineKey(dish.idMenuItem, size?.idItemSize, cleanNote);
  const existing = lines.value.find((l) => l.key === key);
  if (existing) existing.quantity += quantity;
  else
    lines.value.push({
      key,
      menuItemId: dish.idMenuItem,
      itemSizeId: size?.idItemSize ?? null,
      itemName: dish.itemName,
      sizeName: size?.sizeName || "",
      unitPrice: size ? sizePrice(dish, size) : Number(dish.basePrice) || 0,
      quantity,
      note: cleanNote,
    });
  announce.value = `أُضيف ${quantity} ${dish.itemName}${size ? ` (${size.sizeName})` : ""}`;
  if (!reduceMotion()) {
    clearTimeout(pulseTimer);
    pulseId.value = null;
    requestAnimationFrame(() => {
      pulseId.value = dish.idMenuItem;
      pulseTimer = setTimeout(() => (pulseId.value = null), 260);
    });
  }
};

const incLine = (line) => {
  if (roomFor(line.menuItemId) <= 0) return warnStock(line.menuItemId);
  line.quantity++;
};
const removeLine = (line) => {
  lines.value = lines.value.filter((l) => l.key !== line.key);
};
const decLine = (line) => {
  if (!line) return;
  if (line.quantity > 1) {
    line.quantity--;
    return;
  }
  askConfirm({
    title: "حذف الصنف؟",
    text: `سيُحذف «${line.itemName}${line.sizeName ? ` (${line.sizeName})` : ""}» من الطلب.`,
    action: "حذف",
    run: () => removeLine(line),
  });
};
const askClear = () =>
  askConfirm({
    title: "تفريغ الطلب؟",
    text: "ستُحذف كل الأصناف والملاحظة من الطلب الحالي.",
    action: "تفريغ",
    run: () => {
      lines.value = [];
      orderNote.value = "";
    },
  });

// ───────────────────────── dish dialog ─────────────────────────
const dishDialog = ref(false);
const dishDraft = reactive({ dish: null, sizes: [], sizeId: null, qty: 1, note: "" });
const dishDraftTotal = computed(() => {
  const s = dishDraft.sizes.find((x) => x.idItemSize === dishDraft.sizeId);
  return dishDraft.dish && s ? sizePrice(dishDraft.dish, s) * dishDraft.qty : 0;
});

const tapDish = async (dish) => {
  if (dish.blocked) return;
  let sizes = sizesCache.value[dish.idMenuItem];
  if (!sizes) {
    loadingSizesFor.value = dish.idMenuItem;
    sizes = await fetchSizes(dish.idMenuItem);
    loadingSizesFor.value = null;
  }
  if (!sizes.length) return addLine({ dish, size: null, qty: 1, note: "" });
  if (roomFor(dish.idMenuItem) <= 0) return warnStock(dish.idMenuItem);
  dishDraft.dish = dish;
  dishDraft.sizes = sizes;
  dishDraft.sizeId = (sizes.find((s) => truthy(s.isDefault)) || sizes[0]).idItemSize;
  dishDraft.qty = 1;
  dishDraft.note = "";
  dishDialog.value = true;
};
const confirmDish = () => {
  const size = dishDraft.sizes.find((s) => s.idItemSize === dishDraft.sizeId);
  if (!dishDraft.dish || !size) return;
  addLine({ dish: dishDraft.dish, size, qty: Math.max(1, dishDraft.qty), note: dishDraft.note });
  dishDialog.value = false;
};

// ───────────────────────── note editor ─────────────────────────
const noteDialog = ref(false);
const noteDraft = reactive({ key: "", text: "", label: "" });
const openNoteEditor = (line) => {
  noteDraft.key = line.key;
  noteDraft.text = line.note;
  noteDraft.label = `${line.itemName}${line.sizeName ? ` (${line.sizeName})` : ""} × ${line.quantity}`;
  noteDialog.value = true;
};
const saveNote = () => {
  const line = lines.value.find((l) => l.key === noteDraft.key);
  noteDialog.value = false;
  if (!line) return;
  const note = String(noteDraft.text || "").trim().slice(0, 255);
  const key = lineKey(line.menuItemId, line.itemSizeId, note);
  if (key === line.key) return;
  const twin = lines.value.find((l) => l.key === key);
  if (twin) {
    twin.quantity += line.quantity; // same dish + size + note → merge
    removeLine(line);
  } else {
    line.note = note;
    line.key = key;
  }
};

// ───────────────────────── confirm ─────────────────────────
const confirm = reactive({ open: false, title: "", text: "", action: "", run: null });
const askConfirm = ({ title, text, action, run }) => Object.assign(confirm, { open: true, title, text, action, run });
const runConfirm = () => {
  const fn = confirm.run;
  confirm.open = false;
  confirm.run = null;
  fn?.();
};

// ───────────────────────── table picker ─────────────────────────
const tableDialog = ref(false);
const customTable = ref("");
const tableAttention = ref(false);
const openTablePicker = () => {
  const t = tableNumber.value;
  customTable.value = t && !/^([1-9]|[12]\d|30)$/.test(t) ? t : "";
  tableDialog.value = true;
};
const pickTable = (v) => {
  tableNumber.value = String(v || "").trim().slice(0, 20);
  tableDialog.value = false;
  tableAttention.value = false;
};

// ───────────────────────── send ─────────────────────────
const sending = ref(false);
const sendLabel = computed(() => {
  if (sending.value) return "جارٍ الإرسال…";
  if (!lines.value.length) return "أضف أطباقاً أولاً";
  if (!tableNumber.value) return "اختر رقم الطاولة";
  return "إرسال إلى الكاشير";
});

const send = async () => {
  if (sending.value || !lines.value.length) return;
  if (!tableNumber.value) {
    tableAttention.value = true;
    toast.info("اختر رقم الطاولة");
    openTablePicker();
    return;
  }
  sending.value = true;
  const table = tableNumber.value;
  try {
    const res = await waiterOrderAPI.send({
      tableNumber: table,
      notes: orderNote.value.trim(),
      items: lines.value.map((l) => ({
        menuItemId: l.menuItemId,
        itemSizeId: l.itemSizeId || null,
        quantity: l.quantity,
        specialInstructions: l.note || "",
      })),
    });
    toast.success(`أُرسل طلب طاولة ${table} إلى الكاشير`);
    if (res?.data?.idWaiterOrder) upsertOrder(res.data, false);
    lines.value = [];
    orderNote.value = "";
    tableNumber.value = "";
    sheetOpen.value = false;
  } catch (e) {
    toast.error(e?.response?.data?.message || "تعذّر إرسال الطلب، تحقق من الاتصال وأعد المحاولة");
  } finally {
    sending.value = false;
  }
};

// ───────────────────────── draft persistence ─────────────────────────
const restoreDraft = () => {
  try {
    const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
    if (!d || typeof d !== "object") return;
    tableNumber.value = typeof d.tableNumber === "string" ? d.tableNumber.slice(0, 20) : "";
    orderNote.value = typeof d.orderNote === "string" ? d.orderNote : "";
    lines.value = (Array.isArray(d.lines) ? d.lines : [])
      .filter((l) => l && l.menuItemId && Number(l.quantity) > 0)
      .map((l) => ({
        key: lineKey(l.menuItemId, l.itemSizeId, l.note),
        menuItemId: l.menuItemId,
        itemSizeId: l.itemSizeId ?? null,
        itemName: String(l.itemName || ""),
        sizeName: String(l.sizeName || ""),
        unitPrice: Number(l.unitPrice) || 0,
        quantity: Math.floor(Number(l.quantity)),
        note: String(l.note || ""),
      }));
  } catch (_) {
    /* corrupted or blocked storage — start empty */
  }
};
watch(
  [tableNumber, lines, orderNote],
  () => {
    try {
      if (!tableNumber.value && !lines.value.length && !orderNote.value) localStorage.removeItem(DRAFT_KEY);
      else localStorage.setItem(DRAFT_KEY, JSON.stringify({ tableNumber: tableNumber.value, orderNote: orderNote.value, lines: lines.value }));
    } catch (_) {
      /* storage unavailable — draft just won't survive a refresh */
    }
  },
  { deep: true },
);

// ───────────────────────── my orders ─────────────────────────
const myOrders = ref([]);
const loadingMine = ref(false);
const cancellingId = ref(null);
const pendingMineCount = computed(() => myOrders.value.filter((o) => o.status === "pending").length);

const statusMeta = (o) => {
  switch (o.status) {
    case "accepted":
      return { icon: PhCheckCircle, text: o.orderNumber ? `استلمه الكاشير — طلب #${o.orderNumber}` : "استلمه الكاشير" };
    case "rejected":
      return { icon: PhXCircle, text: `مرفوض — ${o.rejectReason || "بدون سبب"}` };
    case "cancelled":
      return { icon: PhProhibit, text: "ملغى" };
    default:
      return { icon: PhHourglassMedium, text: "بانتظار الكاشير" };
  }
};

const notifyChange = (prev, row) => {
  if (!prev || prev.status === row.status) return;
  if (row.status === "accepted") toast.success(`استلم الكاشير طلب طاولة ${row.tableNumber}${row.orderNumber ? ` — طلب #${row.orderNumber}` : ""}`);
  else if (row.status === "rejected") toast.error(`رُفض طلب طاولة ${row.tableNumber}: ${row.rejectReason || "بدون سبب"}`, { timeout: 8000 });
};
const upsertOrder = (row, notify = true) => {
  if (!row?.idWaiterOrder) return;
  const idx = myOrders.value.findIndex((o) => o.idWaiterOrder === row.idWaiterOrder);
  if (idx >= 0) {
    if (notify) notifyChange(myOrders.value[idx], row);
    myOrders.value.splice(idx, 1, row);
  } else {
    myOrders.value.unshift(row);
  }
  myOrders.value.sort((a, b) => b.idWaiterOrder - a.idWaiterOrder);
};
let mineLoadedOnce = false;
const loadMine = async (manual = false) => {
  loadingMine.value = true;
  try {
    const res = await waiterOrderAPI.mine();
    const rows = Array.isArray(res.data) ? res.data : [];
    if (mineLoadedOnce) {
      const prev = new Map(myOrders.value.map((o) => [o.idWaiterOrder, o]));
      rows.forEach((r) => notifyChange(prev.get(r.idWaiterOrder), r));
    }
    myOrders.value = rows;
    mineLoadedOnce = true;
  } catch (e) {
    if (manual) toast.error(e?.response?.data?.message || "تعذّر تحميل طلباتك");
  } finally {
    loadingMine.value = false;
  }
};
const openMyOrders = () => {
  view.value = "orders";
  loadMine();
};
const askCancel = (o) =>
  askConfirm({
    title: `إلغاء طلب طاولة ${o.tableNumber}؟`,
    text: "لن يصل الطلب إلى الكاشير بعد الإلغاء.",
    action: "إلغاء الطلب",
    run: async () => {
      cancellingId.value = o.idWaiterOrder;
      try {
        const res = await waiterOrderAPI.cancel(o.idWaiterOrder);
        upsertOrder(res?.data?.idWaiterOrder ? res.data : { ...o, status: "cancelled" }, false);
        toast.info(`أُلغي طلب طاولة ${o.tableNumber}`);
      } catch (e) {
        toast.error(e?.response?.data?.message || "تعذّر إلغاء الطلب");
        loadMine();
      } finally {
        cancellingId.value = null;
      }
    },
  });

// ───────────────────────── live updates ─────────────────────────
const socketConnected = ref(true);
let socket = null;
let pollTimer = null;
let stockTimer = null;
const startPolling = () => {
  if (!pollTimer) pollTimer = setInterval(() => loadMine(), 30000);
};
const stopPolling = () => {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;
};
const isMine = (row) => row && myId.value != null && Number(row.waiterId) === myId.value;

onMounted(() => {
  restoreDraft();
  mql = window.matchMedia(WIDE_QUERY);
  onWideChange();
  mql.addEventListener?.("change", onWideChange);
  onResize();
  window.addEventListener("resize", onResize, { passive: true });

  loadAll();
  loadMine();
  stockTimer = setInterval(loadKitchenStock, 60000);

  const socketUrl = import.meta.env.VITE_API_URL || window.location.origin;
  socket = io(socketUrl, { transports: ["websocket", "polling"], auth: { token: localStorage.getItem("gusto_token") } });
  socket.on("connect", () => {
    socketConnected.value = true;
    stopPolling();
    socket.emit("join_waiter");
    loadMine();
  });
  socket.on("disconnect", () => {
    socketConnected.value = false;
    startPolling();
  });
  socket.on("connect_error", () => {
    socketConnected.value = false;
    startPolling();
  });
  socket.on("waiter_order_updated", (row) => {
    if (isMine(row)) upsertOrder(row, true);
  });
  socket.on("waiter_order_new", (row) => {
    if (isMine(row)) upsertOrder(row, false);
  });
});

onUnmounted(() => {
  stopPolling();
  clearInterval(stockTimer);
  clearTimeout(pulseTimer);
  mql?.removeEventListener?.("change", onWideChange);
  window.removeEventListener("resize", onResize);
  if (socket) socket.disconnect();
  socket = null;
});
</script>

<!-- Page-level colour tokens the global set lacks (status colours, text on primary).
     Unscoped so they also reach Vuetify dialogs, which teleport outside the page. -->
<style>
:root {
  --wm-on-primary: #0b2328;
  --wm-primary-soft: rgba(63, 167, 185, 0.16);
  --wm-danger: #f2a097;
  --wm-danger-soft: rgba(242, 160, 151, 0.14);
  --wm-success: #86d6a6;
  --wm-success-soft: rgba(134, 214, 166, 0.14);
  --wm-warning: #f0c36b;
  --wm-warning-soft: rgba(240, 195, 107, 0.14);
  --wm-scrim: rgba(0, 0, 0, 0.55);
}
html[data-theme="light"] {
  --wm-on-primary: #ffffff;
  --wm-primary-soft: rgba(4, 99, 117, 0.1);
  --wm-danger: #b3261e;
  --wm-danger-soft: rgba(179, 38, 30, 0.08);
  --wm-success: #1d7044;
  --wm-success-soft: rgba(29, 112, 68, 0.1);
  --wm-warning: #8a5a00;
  --wm-warning-soft: rgba(138, 90, 0, 0.1);
  --wm-scrim: rgba(0, 0, 0, 0.45);
}
</style>

<style scoped>
/* ───────── shell ───────── */
.wm {
  --wm-radius: 18px;
  --wm-ease: cubic-bezier(0.2, 0.8, 0.2, 1);
  display: grid;
  grid-template-columns: 1fr;
  height: 100dvh;
  overflow: hidden;
  background: var(--t-bg);
  color: var(--t-text);
  font-size: 16px;
}
.wm--mobile {
  height: calc(100dvh - 56px);
}
.wm--wide {
  grid-template-columns: minmax(0, 1fr) 400px;
}
.wm button,
.wm input,
.wm textarea,
.wm-dlg button,
.wm-dlg input {
  touch-action: manipulation;
  font-family: inherit;
}
.wm button,
.wm-dlg button {
  cursor: pointer;
}
.wm button:disabled,
.wm-dlg button:disabled {
  cursor: not-allowed;
}
.wm :focus-visible,
.wm-dlg :focus-visible {
  outline: 3px solid var(--t-primary);
  outline-offset: 2px;
}
.wm-sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.wm-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

/* ───────── top bar ───────── */
.wm-top {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px 8px;
  flex-wrap: wrap;
}
.wm-table {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 64px;
  padding: 8px 20px 8px 24px;
  border-radius: var(--wm-radius);
  border: 2px solid var(--t-primary);
  background: var(--t-primary);
  color: var(--wm-on-primary);
  transition: transform 150ms var(--wm-ease), background-color 150ms ease;
}
.wm-table:active {
  transform: scale(0.97);
}
.wm-table--empty {
  background: var(--wm-primary-soft);
  color: var(--t-primary);
  border-style: dashed;
}
.wm-table--attention {
  border-color: var(--wm-danger);
  border-style: solid;
  color: var(--wm-danger);
  background: var(--wm-danger-soft);
}
.wm-table__icon {
  display: grid;
  place-items: center;
}
.wm-table__text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.15;
}
.wm-table__label {
  font-size: 0.875rem;
  font-weight: 600;
  opacity: 0.9;
}
.wm-table__value {
  font-size: 1.5rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.wm-seg {
  display: flex;
  gap: 4px;
  padding: 4px;
  margin-inline-start: auto;
  border-radius: 16px;
  background: var(--t-surface);
  border: 1px solid var(--t-border);
}
.wm-seg__btn {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 52px;
  padding: 0 20px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: var(--t-text-secondary);
  font-size: 1rem;
  font-weight: 600;
  transition: background-color 150ms ease, color 150ms ease;
}
.wm-seg__btn--active {
  background: var(--t-primary);
  color: var(--wm-on-primary);
}
.wm-seg__badge {
  min-width: 24px;
  height: 24px;
  padding: 0 6px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  font-size: 0.8125rem;
  font-weight: 800;
  background: var(--wm-warning);
  color: #1b1405;
}

.wm-offline {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 20px 8px;
  padding: 8px 14px;
  border-radius: 12px;
  font-size: 0.9375rem;
  color: var(--wm-warning);
  background: var(--wm-warning-soft);
}

/* ───────── filters ───────── */
.wm-filters {
  padding: 4px 20px 0;
  border-bottom: 1px solid var(--t-border-soft);
  background: var(--t-bg);
}
.wm-search {
  position: relative;
  display: flex;
  align-items: center;
}
.wm-search__icon {
  position: absolute;
  inset-inline-start: 16px;
  color: var(--t-text-dim);
  pointer-events: none;
}
.wm-search__input {
  width: 100%;
  min-height: 52px;
  padding: 0 52px;
  border-radius: 14px;
  border: 1px solid var(--t-border-field);
  background: var(--t-surface);
  color: var(--t-text);
  font-size: 1rem;
  outline: none;
}
.wm-search__input::placeholder {
  color: var(--t-text-dim);
}
.wm-search__input:focus-visible {
  border-color: var(--t-primary);
  outline: 3px solid var(--wm-primary-soft);
  outline-offset: 0;
}
.wm-search__input::-webkit-search-cancel-button {
  display: none;
}
.wm-search__clear {
  position: absolute;
  inset-inline-end: 2px;
  width: 48px;
  height: 48px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: var(--t-text-secondary);
  display: grid;
  place-items: center;
}

.wm-cats {
  display: flex;
  gap: 8px;
  padding: 12px 0;
  overflow-x: auto;
  overscroll-behavior: contain;
  scrollbar-width: none;
}
.wm-cats::-webkit-scrollbar {
  display: none;
}
.wm-cat {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 52px;
  padding: 0 20px;
  border-radius: 26px;
  border: 1px solid var(--t-border-medium);
  background: var(--t-surface);
  color: var(--t-text-secondary);
  font-size: 1.0625rem;
  font-weight: 600;
  white-space: nowrap;
  transition: background-color 150ms ease, color 150ms ease, border-color 150ms ease;
}
.wm-cat__count {
  min-width: 24px;
  padding: 0 6px;
  border-radius: 12px;
  font-size: 0.8125rem;
  line-height: 22px;
  background: var(--t-hover);
  color: var(--t-text-dim);
}
.wm-cat--active {
  background: var(--t-primary);
  border-color: var(--t-primary);
  color: var(--wm-on-primary);
}
.wm-cat--active .wm-cat__count {
  background: rgba(255, 255, 255, 0.22);
  color: inherit;
}
.wm-cat--skel {
  width: 110px;
  border: 0;
  background: var(--t-surface-high);
}

/* ───────── grid ───────── */
.wm-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 16px 20px 24px;
  scrollbar-width: thin;
  scrollbar-color: var(--t-scrollbar) transparent;
}
.wm-results {
  margin: 0 0 12px;
  color: var(--t-text-dim);
  font-size: 0.9375rem;
}
.wm-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 16px;
}
@media (max-width: 599px) {
  .wm-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }
}

.wm-dish {
  position: relative;
  display: flex;
  flex-direction: column;
  border-radius: var(--wm-radius);
  background: var(--t-surface);
  border: 1px solid var(--t-border-subtle);
  box-shadow: 0 1px 3px var(--t-shadow);
  overflow: hidden;
  transition: border-color 150ms ease, box-shadow 200ms ease, transform 200ms var(--wm-ease);
}
.wm-dish--in {
  border-color: var(--t-primary);
  box-shadow: 0 0 0 1px var(--t-primary), 0 6px 18px var(--t-shadow);
}
.wm-dish--pulse {
  animation: wm-pulse 220ms var(--wm-ease);
}
@keyframes wm-pulse {
  50% {
    transform: scale(1.03);
  }
}
.wm-dish__main {
  display: flex;
  flex-direction: column;
  flex: 1;
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  text-align: start;
}
.wm-dish__main:active:not(:disabled) .wm-dish__img img {
  transform: scale(1.04);
}
.wm-dish__img {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: var(--t-surface-high);
}
.wm-dish__img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 200ms var(--wm-ease);
}
.wm-dish__img--logo img {
  object-fit: contain;
  padding: 18%;
  opacity: 0.55;
}
.wm-dish__badge {
  position: absolute;
  top: 10px;
  inset-inline-start: 10px;
  min-width: 36px;
  height: 36px;
  padding: 0 10px;
  border-radius: 18px;
  display: grid;
  place-items: center;
  font-size: 1.125rem;
  font-weight: 800;
  background: var(--t-primary);
  color: var(--wm-on-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
}
.wm-dish__out {
  position: absolute;
  inset: auto 0 0 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px;
  font-size: 1rem;
  font-weight: 800;
  background: rgba(20, 20, 20, 0.78);
  color: #fff;
}
.wm-dish__left {
  position: absolute;
  bottom: 10px;
  inset-inline-end: 10px;
  padding: 4px 10px;
  border-radius: 10px;
  font-size: 0.8125rem;
  font-weight: 700;
  background: rgba(20, 20, 20, 0.72);
  color: #fff;
}
.wm-dish__loading {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.35);
  color: #fff;
}
.wm-dish--off .wm-dish__img img {
  filter: grayscale(0.85);
  opacity: 0.6;
}
.wm-dish--off .wm-dish__body {
  opacity: 0.6;
}
.wm-dish__body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  padding: 12px 14px 14px;
}
.wm-dish__name {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  line-height: 1.35;
  color: var(--t-text);
}
.wm-dish__desc {
  margin: 0;
  font-size: 0.9375rem;
  line-height: 1.45;
  color: var(--t-text-dim);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.wm-dish__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: auto;
  padding-top: 6px;
}
.wm-dish__price {
  font-size: 1.125rem;
  font-weight: 800;
  color: var(--t-primary);
  font-variant-numeric: tabular-nums;
}
.wm-dish__price small {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--t-text-dim);
}
.wm-dish__sizes {
  font-size: 0.8125rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 10px;
  background: var(--wm-primary-soft);
  color: var(--t-primary);
}
.wm-dish__stepper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 0 10px 10px;
}
.wm-dish--skel {
  pointer-events: none;
}
.wm-skel-line {
  display: block;
  height: 16px;
  border-radius: 8px;
  background: var(--t-surface-high);
  margin-bottom: 8px;
}
.wm-skel-line--sm {
  height: 12px;
}
.wm-shimmer {
  animation: wm-shimmer 1.4s ease-in-out infinite;
}
@keyframes wm-shimmer {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.45;
  }
}

/* ───────── steppers & buttons ───────── */
.wm-step {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  border-radius: 14px;
  border: 1px solid var(--t-border-strong);
  background: var(--t-surface-alt);
  color: var(--t-text);
  display: grid;
  place-items: center;
  transition: background-color 150ms ease, transform 150ms var(--wm-ease);
}
.wm-step:active:not(:disabled) {
  transform: scale(0.92);
}
.wm-step:disabled {
  opacity: 0.4;
}
.wm-step--plus {
  background: var(--t-primary);
  border-color: var(--t-primary);
  color: var(--wm-on-primary);
}
.wm-step__qty {
  min-width: 32px;
  text-align: center;
  font-size: 1.25rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.wm-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 48px;
  padding: 0 20px;
  border-radius: 14px;
  border: 1px solid transparent;
  font-size: 1rem;
  font-weight: 700;
  transition: background-color 150ms ease, opacity 150ms ease;
}
.wm-btn:disabled {
  opacity: 0.45;
}
.wm-btn--sm {
  padding: 0 14px;
  font-size: 0.9375rem;
}
.wm-btn--primary {
  background: var(--t-primary);
  color: var(--wm-on-primary);
}
.wm-btn--ghost {
  background: transparent;
  border-color: var(--t-border-strong);
  color: var(--t-text);
}
.wm-btn--danger {
  background: var(--wm-danger);
  color: var(--t-bg);
}
.wm-btn--danger-ghost {
  background: var(--wm-danger-soft);
  color: var(--wm-danger);
}
.wm-icon-btn {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  border-radius: 14px;
  border: 0;
  background: var(--t-hover);
  color: var(--t-text);
  display: grid;
  place-items: center;
}
.wm-icon-btn--float {
  position: absolute;
  top: 12px;
  inset-inline-end: 12px;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
}
.wm-chip {
  min-height: 48px;
  padding: 0 16px;
  border-radius: 24px;
  border: 1px solid var(--t-border-medium);
  background: var(--t-surface-alt);
  color: var(--t-text-secondary);
  font-size: 0.9375rem;
  font-weight: 600;
}
.wm-chip--danger {
  color: var(--wm-danger);
  border-color: var(--wm-danger);
  background: var(--wm-danger-soft);
}

/* ───────── empty states ───────── */
.wm-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;
  padding: 48px 24px;
  max-width: 440px;
  margin: 0 auto;
}
.wm-empty--compact {
  padding: 32px 16px;
}
.wm-empty__icon {
  color: var(--t-primary);
  opacity: 0.8;
  margin-bottom: 4px;
}
.wm-empty__title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
}
.wm-empty__text {
  margin: 0 0 8px;
  font-size: 1rem;
  line-height: 1.6;
  color: var(--t-text-dim);
}

/* ───────── narrow bottom bar ───────── */
.wm-bar {
  padding: 10px 16px calc(10px + env(safe-area-inset-bottom));
  border-top: 1px solid var(--t-border);
  background: var(--t-surface);
}
.wm-bar__btn {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 60px;
  padding: 0 20px;
  border: 0;
  border-radius: 16px;
  background: var(--t-primary);
  color: var(--wm-on-primary);
  font-size: 1.125rem;
  font-weight: 700;
}
.wm-bar__btn--empty {
  background: var(--t-surface-high);
  color: var(--t-text-secondary);
}
.wm-bar__total {
  margin-inline-start: auto;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

/* ───────── order panel ───────── */
.wm-order {
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--t-surface);
  border-inline-start: 1px solid var(--t-border);
}
.wm-order--sheet {
  position: fixed;
  inset: auto 0 0 0;
  z-index: 1010;
  max-height: 88dvh;
  border-inline-start: 0;
  border-radius: 24px 24px 0 0;
  box-shadow: 0 -12px 40px rgba(0, 0, 0, 0.3);
  transform: translateY(100%);
  transition: transform 220ms var(--wm-ease);
}
.wm-order--sheet.wm-order--open {
  transform: translateY(0);
}
.wm-scrim {
  position: fixed;
  inset: 0;
  z-index: 1009;
  background: var(--wm-scrim);
}
.wm-order__grip {
  width: 44px;
  height: 5px;
  border-radius: 3px;
  margin: 10px auto 0;
  background: var(--t-border-strong);
}
.wm-order__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px 12px;
  border-bottom: 1px solid var(--t-border-soft);
}
.wm-order__title {
  margin: 0;
  font-size: 1.375rem;
  font-weight: 800;
}
.wm-order__table {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 48px;
  margin-top: 2px;
  padding: 0 4px;
  border: 0;
  background: transparent;
  color: var(--t-primary);
  font-size: 1rem;
  font-weight: 700;
}
.wm-order__lines {
  flex: 1;
  min-height: 120px;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 8px 16px;
}
.wm-lines {
  list-style: none;
  margin: 0;
  padding: 0;
}
.wm-line {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 4px;
  border-bottom: 1px solid var(--t-border-subtle);
}
.wm-line:last-child {
  border-bottom: 0;
}
.wm-line__name {
  font-size: 1.0625rem;
  font-weight: 700;
  line-height: 1.4;
}
.wm-line__size {
  font-weight: 500;
  color: var(--t-text-secondary);
}
.wm-line__note {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  max-width: 100%;
  padding: 0 12px;
  margin-top: 4px;
  border-radius: 12px;
  border: 1px solid var(--t-border-medium);
  background: var(--wm-warning-soft);
  color: var(--t-text);
  font-size: 0.9375rem;
  text-align: start;
}
.wm-line__note--empty {
  background: transparent;
  border-style: dashed;
  color: var(--t-text-dim);
}
.wm-line__ctrl {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.wm-line__stepper {
  display: flex;
  align-items: center;
  gap: 8px;
}
.wm-line__total {
  font-size: 1.0625rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}
.wm-order__foot {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 20px calc(16px + env(safe-area-inset-bottom));
  border-top: 1px solid var(--t-border);
  background: var(--t-surface-alt);
}
.wm-sum {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}
.wm-sum__label {
  font-size: 1rem;
  font-weight: 600;
  color: var(--t-text-secondary);
}
.wm-sum__value {
  font-size: 1.5rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}
.wm-sum__hint {
  margin: -6px 0 0;
  font-size: 0.875rem;
  color: var(--t-text-dim);
}
.wm-send {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  min-height: 60px;
  border: 0;
  border-radius: 16px;
  background: var(--t-primary);
  color: var(--wm-on-primary);
  font-size: 1.1875rem;
  font-weight: 800;
  transition: opacity 150ms ease, transform 150ms var(--wm-ease);
}
.wm-send:active:not(:disabled) {
  transform: scale(0.98);
}
.wm-send:disabled {
  opacity: 0.5;
}

/* ───────── fields ───────── */
.wm-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.wm-field--grow {
  flex: 1;
}
.wm-field__label {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--t-text-secondary);
}
.wm-field__label small {
  font-weight: 500;
  color: var(--t-text-dim);
}
.wm-field__input {
  width: 100%;
  min-height: 52px;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid var(--t-border-field);
  background: var(--t-surface);
  color: var(--t-text);
  font-size: 1rem;
  line-height: 1.5;
  resize: vertical;
  outline: none;
}
.wm-field__input::placeholder {
  color: var(--t-text-dim);
}
.wm-field__input:focus-visible {
  border-color: var(--t-primary);
  outline: 3px solid var(--wm-primary-soft);
  outline-offset: 0;
}
.wm-fieldset {
  border: 0;
  padding: 0;
  margin: 0;
}

/* ───────── my orders ───────── */
.wm-orders__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}
.wm-orders__title {
  margin: 0;
  font-size: 1.375rem;
  font-weight: 800;
}
.wm-orders__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}
.wm-ord {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  border-radius: var(--wm-radius);
  background: var(--t-surface);
  border: 1px solid var(--t-border);
  border-inline-start: 5px solid var(--t-border-strong);
}
.wm-ord--pending {
  border-inline-start-color: var(--wm-warning);
}
.wm-ord--accepted {
  border-inline-start-color: var(--wm-success);
}
.wm-ord--rejected {
  border-inline-start-color: var(--wm-danger);
}
.wm-ord--cancelled {
  opacity: 0.75;
}
.wm-ord__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.wm-ord__table {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 1.125rem;
  font-weight: 800;
}
.wm-ord__time {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.9375rem;
  color: var(--t-text-dim);
  font-variant-numeric: tabular-nums;
}
.wm-status {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.4;
}
.wm-status--pending {
  color: var(--wm-warning);
  background: var(--wm-warning-soft);
}
.wm-status--accepted {
  color: var(--wm-success);
  background: var(--wm-success-soft);
}
.wm-status--rejected {
  color: var(--wm-danger);
  background: var(--wm-danger-soft);
}
.wm-status--cancelled {
  color: var(--t-text-secondary);
  background: var(--t-hover);
}
.wm-ord__items {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 1rem;
  line-height: 1.5;
}
.wm-ord__qty {
  font-weight: 800;
  margin-inline-end: 4px;
  font-variant-numeric: tabular-nums;
}
.wm-ord__note {
  color: var(--t-text-dim);
  font-size: 0.9375rem;
}
.wm-ord__notes {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-size: 0.9375rem;
  color: var(--t-text-secondary);
}
.wm-ord__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: auto;
  padding-top: 6px;
  border-top: 1px solid var(--t-border-subtle);
}
.wm-ord__total {
  font-size: 1.125rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}
.wm-ord--skel {
  min-height: 160px;
}
.wm-spin {
  animation: wm-spin 0.9s linear infinite;
}
@keyframes wm-spin {
  to {
    transform: rotate(360deg);
  }
}

/* ───────── dialogs (teleported; scoped attrs still apply) ───────── */
.wm-dlg {
  position: relative;
  display: flex;
  flex-direction: column;
  max-height: 90dvh;
  overflow: hidden;
  border-radius: 24px;
  background: var(--t-surface);
  color: var(--t-text);
  font-size: 16px;
}
.wm-dlg__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--t-border-soft);
}
.wm-dlg__title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  font-size: 1.375rem;
  font-weight: 800;
  line-height: 1.35;
}
.wm-dlg__desc {
  margin: 4px 0 0;
  font-size: 1rem;
  line-height: 1.6;
  color: var(--t-text-dim);
}
.wm-dlg__body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  overflow-y: auto;
  overscroll-behavior: contain;
}
.wm-dlg__foot {
  padding: 12px 20px 20px;
  border-top: 1px solid var(--t-border-soft);
}
.wm-dlg__foot--row {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  border-top: 0;
}
.wm-dlg__hero {
  position: relative;
  aspect-ratio: 16 / 9;
  max-height: 240px;
  width: 100%;
  flex-shrink: 0;
  background: var(--t-surface-high);
}
.wm-dlg__hero img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.wm-dlg__hero--logo img {
  object-fit: contain;
  padding: 10%;
  opacity: 0.55;
}

.wm-keypad {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 10px;
}
@media (max-width: 520px) {
  .wm-keypad {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}
.wm-key {
  min-height: 64px;
  border-radius: 16px;
  border: 1px solid var(--t-border-medium);
  background: var(--t-surface-alt);
  color: var(--t-text);
  font-size: 1.5rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  transition: background-color 150ms ease, transform 150ms var(--wm-ease);
}
.wm-key:active {
  transform: scale(0.94);
}
.wm-key--active {
  background: var(--t-primary);
  border-color: var(--t-primary);
  color: var(--wm-on-primary);
}
.wm-custom-table {
  display: flex;
  align-items: flex-end;
  gap: 12px;
}
.wm-custom-table .wm-btn {
  min-height: 52px;
}
.wm-quick-tables,
.wm-quick-notes {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.wm-sizes {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
  margin-top: 8px;
}
.wm-size {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  min-height: 72px;
  padding: 12px 14px;
  border-radius: 16px;
  border: 2px solid var(--t-border-medium);
  background: var(--t-surface-alt);
  color: var(--t-text);
  text-align: start;
  transition: border-color 150ms ease, background-color 150ms ease;
}
.wm-size--active {
  border-color: var(--t-primary);
  background: var(--wm-primary-soft);
}
.wm-size__check {
  position: absolute;
  top: 10px;
  inset-inline-end: 10px;
  color: var(--t-primary);
}
.wm-size__name {
  font-size: 1.0625rem;
  font-weight: 700;
}
.wm-size__price {
  font-size: 1rem;
  font-weight: 800;
  color: var(--t-primary);
  font-variant-numeric: tabular-nums;
}
.wm-qty-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.wm-line__stepper--lg .wm-step {
  width: 56px;
  height: 56px;
}
.wm-line__stepper--lg .wm-step__qty {
  min-width: 44px;
  font-size: 1.5rem;
}

/* ───────── portrait tablet tweaks ───────── */
@media (max-width: 700px) {
  .wm-top {
    padding: 12px 16px 8px;
  }
  .wm-seg {
    margin-inline-start: 0;
    flex: 1;
  }
  .wm-seg__btn {
    flex: 1;
    justify-content: center;
    padding: 0 12px;
  }
  .wm-filters,
  .wm-scroll {
    padding-inline: 16px;
  }
  .wm-offline {
    margin-inline: 16px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .wm *,
  .wm-dlg * {
    transition: none !important;
    animation: none !important;
  }
  .wm-order--sheet {
    transition: none;
  }
}
</style>
