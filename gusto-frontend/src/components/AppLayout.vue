<template>
  <v-app>
    <!-- Mobile Top Bar -->
    <header v-if="isMobile" class="mobile-topbar">
      <button class="mobile-topbar__menu" :aria-label="drawerOpen ? 'إغلاق القائمة' : 'فتح القائمة'" :title="drawerOpen ? 'إغلاق القائمة' : 'فتح القائمة'" @click="drawerOpen = !drawerOpen">
        <PhList :size="22" weight="bold" />
      </button>
      <div class="mobile-topbar__brand">
        <v-avatar size="32" rounded="lg" style="background: rgba(255,255,255,0.95);">
          <img :src="logoImg" alt="جوستو" style="width:100%;height:100%;object-fit:contain;padding:3px;" />
        </v-avatar>
        <span class="mobile-topbar__name">جوستو</span>
      </div>
      <button class="mobile-topbar__action" :aria-label="themeStore.isDark ? 'الوضع الفاتح' : 'الوضع الداكن'" :title="themeStore.isDark ? 'الوضع الفاتح' : 'الوضع الداكن'" @click="themeStore.toggle()">
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
        <button v-if="isMobile" class="nav-close" aria-label="إغلاق القائمة" title="إغلاق القائمة" @click="drawerOpen = false">
          <PhX :size="18" weight="bold" />
        </button>
        <button v-else class="nav-theme-toggle" @click="themeStore.toggle()" :title="themeStore.isDark ? 'الوضع الفاتح' : 'الوضع الداكن'" :aria-label="themeStore.isDark ? 'الوضع الفاتح' : 'الوضع الداكن'">
          <PhMoon v-if="themeStore.isDark" :size="18" weight="duotone" />
          <PhSun v-else :size="18" weight="duotone" />
        </button>
      </div>

      <!-- Menu -->
      <nav ref="navMenu" class="nav-menu">
        <!-- الرئيسية -->
        <router-link
          :to="homeFor(authStore.user?.role)"
          class="nav-item"
          :class="{ 'nav-item--active': $route.path === '/dashboard' || $route.path === '/storage-dashboard' }"
          @click="closeMobile"
        >
          <span class="nav-item__icon"><PhHouse :size="18" weight="duotone" /></span>
          <span class="nav-item__label">الرئيسية</span>
        </router-link>

        <!-- Groups and links come from config/navigation.js (same rules as the router) -->
        <template v-for="group in visibleGroups" :key="group.title">
          <div class="nav-group">{{ group.title }}</div>
          <router-link
            v-for="item in group.items"
            :key="item.to"
            :to="item.to"
            class="nav-item"
            :class="{ 'nav-item--active': item.prefix ? $route.path.startsWith(item.to) : $route.path === item.to }"
            @click="closeMobile"
          >
            <span class="nav-item__icon"><component :is="navIcons[item.icon]" :size="18" weight="duotone" /></span>
            <span class="nav-item__label">{{ item.label }}</span>
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
              <span class="nav-user__role">{{ ROLE_LABELS[authStore.user?.role] || authStore.user?.role }}</span>
            </div>
          </div>
          <button class="nav-user__logout" aria-label="تسجيل الخروج" title="تسجيل الخروج" @click="logout">
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
import { useRoute, useRouter } from 'vue-router'
import { NAV_GROUPS, ROLE_LABELS, canOpen, homeFor } from '@/config/navigation'
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
const router = useRouter()

const navIcons = {
  PhCurrencyDollar, PhChefHat, PhCoffee, PhForkKnife, PhPackage, PhShoppingCart, PhUsers, PhReceipt,
  PhChartLine, PhWallet, PhStorefront, PhMoney, PhListBullets, PhGear, PhArrowRight, PhCookingPot, PhArrowUUpLeft,
}
// Only groups with at least one page this role may open
const visibleGroups = computed(() =>
  NAV_GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => canOpen(authStore.user?.role, i.to)) })).filter((g) => g.items.length)
)

function logout() {
  authStore.logout()
  router.push('/login')
}

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
