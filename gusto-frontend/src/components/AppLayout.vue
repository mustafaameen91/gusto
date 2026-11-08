<template>
  <v-app>
    <!-- Mobile Top Bar -->
    <header v-if="isMobile" class="mobile-topbar">
      <button class="mobile-topbar__menu" @click="drawerOpen = !drawerOpen">
        <PhList :size="22" weight="bold" />
      </button>
      <div class="mobile-topbar__brand">
        <v-avatar size="32" rounded="lg" style="background: rgba(255,255,255,0.95);">
          <img :src="logoImg" alt="جوستو" style="width:100%;height:100%;object-fit:contain;padding:3px;" />
        </v-avatar>
        <span class="mobile-topbar__name">جوستو</span>
      </div>
      <button class="mobile-topbar__action" @click="themeStore.toggle()">
        <PhMoon v-if="themeStore.isDark" :size="18" weight="duotone" />
        <PhSun v-else :size="18" weight="duotone" />
      </button>
    </header>

    <!-- Overlay for mobile drawer -->
    <Transition name="fade">
      <div v-if="isMobile && drawerOpen" class="mobile-overlay" @click="drawerOpen = false" />
    </Transition>

    <v-navigation-drawer
      v-model="drawerOpen"
      :permanent="!isMobile"
      :temporary="isMobile"
      app
      width="260"
      class="nav-drawer"
    >
      <!-- Logo -->
      <div class="nav-logo">
        <v-avatar size="44" rounded="lg" class="nav-logo__avatar">
          <img :src="logoImg" alt="جوستو" />
        </v-avatar>
        <div class="nav-logo__text">
          <span class="nav-logo__name">جوستو</span>
          <span class="nav-logo__sub">Gusto Restaurant</span>
        </div>
        <button v-if="isMobile" class="nav-close" @click="drawerOpen = false">
          <PhX :size="18" weight="bold" />
        </button>
        <button v-else class="nav-theme-toggle" @click="themeStore.toggle()" :title="themeStore.isDark ? 'الوضع الفاتح' : 'الوضع الداكن'">
          <PhMoon v-if="themeStore.isDark" :size="18" weight="duotone" />
          <PhSun v-else :size="18" weight="duotone" />
        </button>
      </div>

      <!-- Menu -->
      <nav ref="navMenu" class="nav-menu">
        <!-- الرئيسية -->
        <router-link
          :to="authStore.user?.role === 'storage' ? '/storage-dashboard' : '/dashboard'"
          class="nav-item"
          :class="{ 'nav-item--active': $route.path === '/dashboard' || $route.path === '/storage-dashboard' }"
          @click="closeMobile"
        >
          <span class="nav-item__icon"><PhHouse :size="18" weight="duotone" /></span>
          <span class="nav-item__label">الرئيسية</span>
        </router-link>

        <!-- نقطة البيع والعمليات -->
        <template v-if="hasRole(['admin']) || hasRole(['cashier']) || hasRole(['kitchen']) || hasRole(['barista'])">
          <div class="nav-group">نقطة البيع والعمليات</div>
          <router-link v-if="hasRole(['admin', 'cashier'])" to="/cashier" class="nav-item" :class="{ 'nav-item--active': $route.path === '/cashier' }" @click="closeMobile">
            <span class="nav-item__icon"><PhCurrencyDollar :size="18" weight="duotone" /></span>
            <span class="nav-item__label">نقطة البيع</span>
          </router-link>
          <router-link v-if="hasRole(['admin', 'kitchen'])" to="/kitchen" class="nav-item" :class="{ 'nav-item--active': $route.path === '/kitchen' }" @click="closeMobile">
            <span class="nav-item__icon"><PhChefHat :size="18" weight="duotone" /></span>
            <span class="nav-item__label">شاشة المطبخ</span>
          </router-link>
          <router-link v-if="hasRole(['kitchen']) && !hasRole(['admin'])" to="/kitchen-stock" class="nav-item" :class="{ 'nav-item--active': $route.path === '/kitchen-stock' }" @click="closeMobile">
            <span class="nav-item__icon"><PhCookingPot :size="18" weight="duotone" /></span>
            <span class="nav-item__label">مخزن المطبخ</span>
          </router-link>
          <router-link v-if="hasRole(['admin', 'kitchen', 'barista'])" to="/barista" class="nav-item" :class="{ 'nav-item--active': $route.path === '/barista' }" @click="closeMobile">
            <span class="nav-item__icon"><PhCoffee :size="18" weight="duotone" /></span>
            <span class="nav-item__label">شاشة المشروبات</span>
          </router-link>
          <router-link v-if="hasRole(['admin', 'cashier'])" to="/daily-receipt" class="nav-item" :class="{ 'nav-item--active': $route.path === '/daily-receipt' }" @click="closeMobile">
            <span class="nav-item__icon"><PhReceipt :size="18" weight="duotone" /></span>
            <span class="nav-item__label">صندوق اليومية</span>
          </router-link>
        </template>

        <!-- القائمة والمخزون -->
        <template v-if="hasRole(['admin']) || hasRole(['storage'])">
          <div class="nav-group">القائمة والمخزون</div>
          <template v-if="hasRole(['admin'])">
            <router-link to="/menu" class="nav-item" :class="{ 'nav-item--active': $route.path === '/menu' }" @click="closeMobile">
              <span class="nav-item__icon"><PhForkKnife :size="18" weight="duotone" /></span>
              <span class="nav-item__label">إدارة القائمة</span>
            </router-link>
            <router-link to="/inventory" class="nav-item" :class="{ 'nav-item--active': $route.path === '/inventory' }" @click="closeMobile">
              <span class="nav-item__icon"><PhPackage :size="18" weight="duotone" /></span>
              <span class="nav-item__label">المخزون</span>
            </router-link>
            <router-link to="/purchases" class="nav-item" :class="{ 'nav-item--active': $route.path === '/purchases' }" @click="closeMobile">
              <span class="nav-item__icon"><PhShoppingCart :size="18" weight="duotone" /></span>
              <span class="nav-item__label">المشتريات</span>
            </router-link>
            <router-link to="/receiving" class="nav-item" :class="{ 'nav-item--active': $route.path === '/receiving' }" @click="closeMobile">
              <span class="nav-item__icon"><PhPackage :size="18" weight="duotone" /></span>
              <span class="nav-item__label">الاستلام</span>
            </router-link>
            <router-link to="/transfers" class="nav-item" :class="{ 'nav-item--active': $route.path === '/transfers' }" @click="closeMobile">
              <span class="nav-item__icon"><PhArrowRight :size="18" weight="duotone" /></span>
              <span class="nav-item__label">نقل للمخزن الداخلي</span>
            </router-link>
            <router-link to="/kitchen-stock" class="nav-item" :class="{ 'nav-item--active': $route.path === '/kitchen-stock' }" @click="closeMobile">
              <span class="nav-item__icon"><PhCookingPot :size="18" weight="duotone" /></span>
              <span class="nav-item__label">مخزن المطبخ</span>
            </router-link>
          </template>
          <template v-if="hasRole(['storage']) && !hasRole(['admin'])">
            <router-link to="/inventory" class="nav-item" :class="{ 'nav-item--active': $route.path === '/inventory' }" @click="closeMobile">
              <span class="nav-item__icon"><PhPackage :size="18" weight="duotone" /></span>
              <span class="nav-item__label">المخزون</span>
            </router-link>
            <router-link to="/receiving" class="nav-item" :class="{ 'nav-item--active': $route.path === '/receiving' }" @click="closeMobile">
              <span class="nav-item__icon"><PhPackage :size="18" weight="duotone" /></span>
              <span class="nav-item__label">الاستلام</span>
            </router-link>
            <router-link to="/transfers" class="nav-item" :class="{ 'nav-item--active': $route.path === '/transfers' }" @click="closeMobile">
              <span class="nav-item__icon"><PhArrowRight :size="18" weight="duotone" /></span>
              <span class="nav-item__label">نقل للمخزن الداخلي</span>
            </router-link>
            <router-link to="/kitchen-stock" class="nav-item" :class="{ 'nav-item--active': $route.path === '/kitchen-stock' }" @click="closeMobile">
              <span class="nav-item__icon"><PhCookingPot :size="18" weight="duotone" /></span>
              <span class="nav-item__label">مخزن المطبخ</span>
            </router-link>
          </template>
        </template>

        <!-- المالية -->
        <template v-if="hasRole(['admin'])">
          <div class="nav-group">المالية</div>
          <router-link to="/accounts" class="nav-item" :class="{ 'nav-item--active': $route.path === '/accounts' }" @click="closeMobile">
            <span class="nav-item__icon"><PhListBullets :size="18" weight="duotone" /></span>
            <span class="nav-item__label">دليل الحسابات</span>
          </router-link>
          <router-link to="/posting-settings" class="nav-item" :class="{ 'nav-item--active': $route.path === '/posting-settings' }" @click="closeMobile">
            <span class="nav-item__icon"><PhGear :size="18" weight="duotone" /></span>
            <span class="nav-item__label">إعدادات الترحيل</span>
          </router-link>
          <router-link to="/posting-entries" class="nav-item" :class="{ 'nav-item--active': $route.path === '/posting-entries' }" @click="closeMobile">
            <span class="nav-item__icon"><PhListBullets :size="18" weight="duotone" /></span>
            <span class="nav-item__label">قيود الترحيل</span>
          </router-link>
          <router-link to="/order-payments" class="nav-item" :class="{ 'nav-item--active': $route.path === '/order-payments' }" @click="closeMobile">
            <span class="nav-item__icon"><PhReceipt :size="18" weight="duotone" /></span>
            <span class="nav-item__label">دفعات الطلبات</span>
          </router-link>
          <router-link to="/expenses" class="nav-item" :class="{ 'nav-item--active': $route.path === '/expenses' }" @click="closeMobile">
            <span class="nav-item__icon"><PhReceipt :size="18" weight="duotone" /></span>
            <span class="nav-item__label">المصروفات</span>
          </router-link>
          <router-link to="/outer-incomes" class="nav-item" :class="{ 'nav-item--active': $route.path === '/outer-incomes' }" @click="closeMobile">
            <span class="nav-item__icon"><PhMoney :size="18" weight="duotone" /></span>
            <span class="nav-item__label">إيرادات خارجية</span>
          </router-link>
          <router-link to="/customers" class="nav-item" :class="{ 'nav-item--active': $route.path.startsWith('/customers') }" @click="closeMobile">
            <span class="nav-item__icon"><PhUsers :size="18" weight="duotone" /></span>
            <span class="nav-item__label">العملاء (آجل)</span>
          </router-link>
          <router-link to="/suppliers" class="nav-item" :class="{ 'nav-item--active': $route.path.startsWith('/suppliers') }" @click="closeMobile">
            <span class="nav-item__icon"><PhStorefront :size="18" weight="duotone" /></span>
            <span class="nav-item__label">الموردون</span>
          </router-link>
          <router-link to="/tips" class="nav-item" :class="{ 'nav-item--active': $route.path === '/tips' }" @click="closeMobile">
            <span class="nav-item__icon"><PhMoney :size="18" weight="duotone" /></span>
            <span class="nav-item__label">البقشيش</span>
          </router-link>
          <router-link to="/box" class="nav-item" :class="{ 'nav-item--active': $route.path === '/box' }" @click="closeMobile">
            <span class="nav-item__icon"><PhWallet :size="18" weight="duotone" /></span>
            <span class="nav-item__label">الصندوق</span>
          </router-link>
        </template>

        <!-- الإدارة -->
        <template v-if="hasRole(['admin', 'supervisor'])">
          <div class="nav-group">الإدارة</div>
          <router-link v-if="hasRole(['admin'])" to="/staff" class="nav-item" :class="{ 'nav-item--active': $route.path === '/staff' }" @click="closeMobile">
            <span class="nav-item__icon"><PhUsers :size="18" weight="duotone" /></span>
            <span class="nav-item__label">الموظفين</span>
          </router-link>
          <router-link v-if="hasRole(['admin'])" to="/orders" class="nav-item" :class="{ 'nav-item--active': $route.path === '/orders' }" @click="closeMobile">
            <span class="nav-item__icon"><PhReceipt :size="18" weight="duotone" /></span>
            <span class="nav-item__label">الطلبات</span>
          </router-link>
          <router-link to="/returns" class="nav-item" :class="{ 'nav-item--active': $route.path === '/returns' }" @click="closeMobile">
            <span class="nav-item__icon"><PhArrowUUpLeft :size="18" weight="duotone" /></span>
            <span class="nav-item__label">المرتجعات والهدر</span>
          </router-link>
          <router-link v-if="hasRole(['admin'])" to="/reports" class="nav-item" :class="{ 'nav-item--active': $route.path === '/reports' }" @click="closeMobile">
            <span class="nav-item__icon"><PhChartLine :size="18" weight="duotone" /></span>
            <span class="nav-item__label">التقارير</span>
          </router-link>
        </template>
      </nav>

      <!-- User footer -->
      <template v-slot:append>
        <div class="nav-user">
          <div class="nav-user__info">
            <div class="nav-user__avatar">{{ userInitial }}</div>
            <div class="nav-user__meta">
              <span class="nav-user__name">{{ authStore.user?.fullName }}</span>
              <span class="nav-user__role">{{
                authStore.user?.role === 'admin' ? 'مدير' :
                authStore.user?.role === 'supervisor' ? 'مشرف' :
                authStore.user?.role === 'cashier' ? 'كاشير' :
                authStore.user?.role === 'kitchen' ? 'مطبخ' :
                authStore.user?.role === 'barista' ? 'البار' :
                authStore.user?.role === 'purchases' ? 'مشتريات' :
                authStore.user?.role === 'storage' ? 'مخزون' :
                authStore.user?.role
              }}</span>
            </div>
          </div>
          <button class="nav-user__logout" @click="authStore.logout">
            <PhSignOut :size="16" weight="bold" />
            <span>خروج</span>
          </button>
        </div>
      </template>
    </v-navigation-drawer>

    <v-main class="app-main" :class="{ 'app-main--mobile': isMobile }">
      <slot />
    </v-main>
  </v-app>
</template>

<script>
// Each page renders its own AppLayout, so the sidebar is re-created on every
// navigation. Keep its scroll position here (shared by all instances) so it
// doesn't jump back to the top.
let savedNavScrollTop = 0
</script>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { useRoute } from 'vue-router'
import logoImg from '@/assets/logo.png'
import {
  PhHouse, PhCurrencyDollar, PhChefHat, PhCoffee, PhForkKnife,
  PhPackage, PhShoppingCart, PhUsers, PhReceipt, PhChartLine,
  PhSignOut, PhWallet, PhStorefront, PhMoney, PhListBullets, PhGear,
  PhArrowRight, PhCookingPot, PhMoon, PhSun, PhList, PhX, PhArrowUUpLeft
} from '@phosphor-icons/vue'

const authStore = useAuthStore()
const themeStore = useThemeStore()
const route = useRoute()

const MOBILE_BREAKPOINT = 960
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1200)
const isMobile = computed(() => windowWidth.value < MOBILE_BREAKPOINT)
const drawerOpen = ref(!isMobile.value)

function onResize() {
  windowWidth.value = window.innerWidth
  if (!isMobile.value) {
    drawerOpen.value = true
  }
}

function closeMobile() {
  if (isMobile.value) {
    drawerOpen.value = false
  }
}

const navMenu = ref(null)
let navScrollEl = null

function onNavScroll() {
  savedNavScrollTop = navScrollEl.scrollTop
}

onMounted(async () => {
  window.addEventListener('resize', onResize)
  await nextTick()
  navScrollEl = navMenu.value?.closest('.v-navigation-drawer__content')
  if (!navScrollEl) return
  // 'instant' so the app's smooth-scroll CSS doesn't animate from the top
  navScrollEl.scrollTo({ top: savedNavScrollTop, behavior: 'instant' })
  // If the active page is still out of view (e.g. first load), bring it in
  const active = navScrollEl.querySelector('.nav-item--active')
  if (active) {
    const box = navScrollEl.getBoundingClientRect()
    const item = active.getBoundingClientRect()
    if (item.top < box.top || item.bottom > box.bottom) {
      active.scrollIntoView({ block: 'nearest', behavior: 'instant' })
    }
  }
  navScrollEl.addEventListener('scroll', onNavScroll, { passive: true })
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  navScrollEl?.removeEventListener('scroll', onNavScroll)
})

const hasRole = (roles) => {
  return roles.includes(authStore.user?.role)
}

const userInitial = computed(() => {
  const name = authStore.user?.fullName || ''
  return name.charAt(0).toUpperCase()
})
</script>

<style scoped>
.nav-drawer {
  /* Pages nest their own v-app, which makes Vuetify position the drawer
     absolute (as tall as the page). Pin it to the viewport so it scrolls on
     its own instead of with the page. */
  position: fixed !important;
  top: 0 !important;
  height: 100dvh !important;
  background: var(--t-bg) !important;
  border-left: 1px solid var(--t-border-soft) !important;
  border-right: none !important;
  z-index: 1010 !important;
}

.nav-drawer :deep(.v-navigation-drawer__content) {
  overflow-y: auto !important;
  overflow-x: hidden !important;
  scrollbar-width: thin;
  scrollbar-color: var(--t-border-medium) transparent;
}
.nav-drawer :deep(.v-navigation-drawer__content)::-webkit-scrollbar {
  width: 4px;
}
.nav-drawer :deep(.v-navigation-drawer__content)::-webkit-scrollbar-thumb {
  background: var(--t-border-medium);
  border-radius: 2px;
}

.app-main {
  background: var(--t-bg) !important;
}
.app-main--mobile {
  padding-top: 56px !important;
}

/* ===== Mobile Top Bar ===== */
.mobile-topbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: var(--t-bg);
  border-bottom: 1px solid var(--t-border-soft);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  z-index: 1005;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.mobile-topbar__menu,
.mobile-topbar__action {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid var(--t-border);
  background: var(--t-hover);
  color: var(--t-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
}
.mobile-topbar__menu:active,
.mobile-topbar__action:active {
  background: var(--t-border-subtle);
  transform: scale(0.95);
}

.mobile-topbar__brand {
  display: flex;
  align-items: center;
  gap: 8px;
}
.mobile-topbar__name {
  font-size: 1rem;
  font-weight: 700;
  color: var(--t-text);
}

/* Mobile Overlay */
.mobile-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1008;
  backdrop-filter: blur(2px);
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* Close button inside drawer on mobile */
.nav-close {
  margin-inline-start: auto;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: none;
  background: var(--t-border-subtle);
  color: var(--t-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
}
.nav-close:active {
  background: rgba(4, 99, 117,0.15);
  color: #1F7F90;
}

/* ===== Logo ===== */
.nav-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 18px 16px;
  border-bottom: 1px solid var(--t-border-soft);
}

.nav-logo__avatar {
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.95) !important;
  box-shadow: 0 2px 12px var(--t-shadow);
}
.nav-logo__avatar img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 4px;
}

.nav-logo__text {
  display: flex;
  flex-direction: column;
}

.nav-logo__name {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--t-text);
  letter-spacing: 0.02em;
}

.nav-logo__sub {
  font-size: 0.625rem;
  color: var(--t-text-faint);
  letter-spacing: 0.04em;
}

/* Theme Toggle (desktop only) */
.nav-theme-toggle {
  margin-inline-start: auto;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid var(--t-border);
  background: var(--t-hover);
  color: var(--t-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.25s ease;
  flex-shrink: 0;
}
.nav-theme-toggle:hover {
  background: var(--t-border-subtle);
  color: #1F7F90;
  border-color: rgba(4, 99, 117,0.3);
  transform: rotate(15deg);
}

/* ===== Menu ===== */
.nav-menu {
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-group {
  font-size: 0.625rem;
  font-weight: 600;
  color: var(--t-sage-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 14px 10px 6px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.15s ease;
  position: relative;
}

.nav-item__icon {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: var(--t-border-subtle);
  color: var(--t-sage-soft);
  transition: all 0.15s ease;
}

.nav-item__label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--t-text-muted);
  transition: color 0.15s ease;
}

.nav-item:hover {
  background: var(--t-border-subtle);
}
.nav-item:hover .nav-item__icon {
  background: rgba(4, 99, 117, 0.12);
  color: #1F7F90;
}
.nav-item:hover .nav-item__label {
  color: var(--t-text);
}

.nav-item--active {
  background: rgba(4, 99, 117, 0.1);
}
.nav-item--active::before {
  content: '';
  position: absolute;
  right: 0;
  top: 6px;
  bottom: 6px;
  width: 3px;
  border-radius: 3px 0 0 3px;
  background: #046375;
}
.nav-item--active .nav-item__icon {
  background: rgba(4, 99, 117, 0.18);
  color: #1F7F90;
}
.nav-item--active .nav-item__label {
  color: var(--t-text);
  font-weight: 600;
}

/* ===== User footer ===== */
.nav-user {
  padding: 14px 14px;
  border-top: 1px solid var(--t-border-soft);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.nav-user__info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.nav-user__avatar {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: rgba(4, 99, 117, 0.15);
  color: #1F7F90;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8125rem;
  font-weight: 700;
  flex-shrink: 0;
}

.nav-user__meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.nav-user__name {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--t-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-user__role {
  font-size: 0.625rem;
  color: var(--t-sage-muted);
}

.nav-user__logout {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 7px 0;
  border-radius: 8px;
  border: 1px solid var(--t-border);
  background: transparent;
  color: var(--t-text-dim);
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  width: 100%;
}
.nav-user__logout:hover {
  border-color: rgba(4, 99, 117, 0.4);
  background: rgba(4, 99, 117, 0.08);
  color: #1F7F90;
}

/* ===== Mobile Responsive Tweaks ===== */
@media (max-width: 959px) {
  .nav-item {
    padding: 10px 14px;
  }
  .nav-item__label {
    font-size: 0.875rem;
  }
  .nav-item__icon {
    width: 32px;
    height: 32px;
  }
}
</style>
