<template>
  <v-app>
    <router-view />
  </v-app>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { useTheme } from 'vuetify'

const authStore = useAuthStore()
const themeStore = useThemeStore()
const vuetifyTheme = useTheme()

onMounted(() => {
  authStore.checkAuth()
  themeStore.init(vuetifyTheme)
})
</script>

<style>
/* ===== Theme CSS Variables ===== */
html, :root {
  --t-bg: #16191b;
  --t-surface: #1f2427;
  --t-surface-alt: #1b2023;
  --t-surface-high: #283034;
  --t-primary: #3FA7B9;
  --t-text: #e8e4df;
  --t-text-secondary: rgba(232,228,223,0.8);
  --t-text-muted: rgba(232,228,223,0.6);
  --t-text-dim: rgba(232,228,223,0.5);
  --t-text-faint: rgba(232,228,223,0.4);
  --t-label: rgba(232,228,223,0.55);
  --t-sage: rgba(163,179,150,0.7);
  --t-sage-soft: rgba(163,179,150,0.6);
  --t-sage-muted: rgba(163,179,150,0.5);
  --t-border: rgba(110,150,158,0.12);
  --t-border-subtle: rgba(110,150,158,0.08);
  --t-border-soft: rgba(110,150,158,0.1);
  --t-border-medium: rgba(110,150,158,0.15);
  --t-border-strong: rgba(110,150,158,0.2);
  --t-border-field: rgba(110,150,158,0.4);
  --t-hover: rgba(110,150,158,0.06);
  --t-scrollbar: rgba(110,150,158,0.2);
  --t-scrollbar-hover: rgba(4, 99, 117,0.35);
  --t-shadow: rgba(0,0,0,0.15);
}

html[data-theme="light"] {
  --t-bg: #f5f2ed;
  --t-surface: #ffffff;
  --t-primary: #046375;
  --t-surface-alt: #fafaf7;
  --t-surface-high: #f0ede8;
  --t-text: #2c2419;
  --t-text-secondary: rgba(44,36,25,0.75);
  --t-text-muted: rgba(44,36,25,0.55);
  --t-text-dim: rgba(44,36,25,0.4);
  --t-text-faint: rgba(44,36,25,0.25);
  --t-label: rgba(44,36,25,0.45);
  --t-sage: rgba(80,100,70,0.85);
  --t-sage-soft: rgba(80,100,70,0.65);
  --t-sage-muted: rgba(80,100,70,0.5);
  --t-border: rgba(110,150,158,0.2);
  --t-border-subtle: rgba(110,150,158,0.12);
  --t-border-soft: rgba(110,150,158,0.15);
  --t-border-medium: rgba(110,150,158,0.25);
  --t-border-strong: rgba(110,150,158,0.35);
  --t-border-field: rgba(110,150,158,0.5);
  --t-hover: rgba(110,150,158,0.06);
  --t-scrollbar: rgba(110,150,158,0.3);
  --t-scrollbar-hover: rgba(4, 99, 117,0.4);
  --t-shadow: rgba(0,0,0,0.06);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Tajawal', 'Roboto', sans-serif !important;
}

body {
  font-family: 'Tajawal', 'Roboto', sans-serif !important;
  background: var(--t-bg) !important;
  color: var(--t-text) !important;
}

.v-application {
  font-family: 'Tajawal', 'Roboto', sans-serif !important;
  background: var(--t-bg) !important;
  color: var(--t-text) !important;
}

/* ===== Global Theme Overrides ===== */

/* Page Banner (gradient header cards) */
.v-card.page-banner {
  background: linear-gradient(135deg, #046375 0%, #1F7F90 100%) !important;
  border-radius: 16px !important;
  position: relative;
  overflow: hidden;
  border: none !important;
}
.page-banner,
.page-banner .v-card-title,
.page-banner .v-card-subtitle,
.page-banner .v-card-text,
.page-banner h1, .page-banner h2, .page-banner h3,
.page-banner p, .page-banner span {
  color: white !important;
}

/* Cards */
.v-card {
  background: var(--t-surface) !important;
  color: var(--t-text) !important;
  border-color: var(--t-border) !important;
}
.v-card-title,
.v-card-subtitle {
  color: var(--t-text) !important;
}
.v-card-text {
  color: var(--t-text-secondary) !important;
}

/* Data tables */
.v-data-table {
  background: transparent !important;
  color: var(--t-text) !important;
}
.v-data-table__thead,
.v-table > .v-table__wrapper > table > thead {
  background: var(--t-surface-high) !important;
}
.v-data-table__thead th,
.v-table > .v-table__wrapper > table > thead > tr > th {
  color: var(--t-sage) !important;
  border-bottom-color: var(--t-border) !important;
}
.v-data-table__tbody td,
.v-table > .v-table__wrapper > table > tbody > tr > td {
  color: var(--t-text-secondary) !important;
  border-bottom-color: var(--t-border-subtle) !important;
}
.v-data-table__tbody tr:hover td,
.v-table > .v-table__wrapper > table > tbody > tr:hover > td {
  background: var(--t-hover) !important;
}
.v-data-table-footer {
  color: var(--t-text-dim) !important;
}

/* Tabs */
.v-tabs {
  background: var(--t-surface) !important;
}
.v-tab {
  color: var(--t-text-muted) !important;
}
.v-tab--selected {
  color: #1F7F90 !important;
}
.v-tabs .v-tab-slider {
  color: #046375 !important;
}

/* Text fields & selects */
.v-field {
  color: var(--t-text) !important;
}
.v-field__outline {
  --v-field-border-opacity: 0.15;
  color: var(--t-border-field) !important;
}
.v-field--focused .v-field__outline {
  color: #046375 !important;
}
.v-label {
  color: var(--t-label) !important;
}
.v-field__input {
  color: var(--t-text) !important;
}
.v-field--variant-outlined .v-field__outline__notch::before,
.v-field--variant-outlined .v-field__outline__notch::after,
.v-field--variant-outlined .v-field__outline__start,
.v-field--variant-outlined .v-field__outline__end {
  border-color: var(--t-border-strong) !important;
}

/* Lists and menus */
.v-list {
  background: var(--t-surface) !important;
  color: var(--t-text) !important;
}
.v-list-item-title {
  color: var(--t-text) !important;
}
.v-list-item-subtitle {
  color: var(--t-text-dim) !important;
}
.v-list-item:hover {
  background: var(--t-hover) !important;
}

/* Dialogs */
.v-overlay__content > .v-card {
  background: var(--t-surface) !important;
}

/* Dividers */
.v-divider {
  border-color: var(--t-border-soft) !important;
}

/* Pagination */
.v-pagination__item {
  color: var(--t-text) !important;
}

/* Skeleton loaders */
.v-skeleton-loader {
  background: var(--t-surface) !important;
}
.v-skeleton-loader__bone {
  background: var(--t-border-soft) !important;
}

/* Alerts */
.v-alert--variant-tonal {
  background-opacity: 0.15;
}

/* Switches */
.v-switch .v-label {
  color: var(--t-text-muted) !important;
}

/* Chips */
.v-chip--variant-tonal {
  color: var(--t-text-secondary) !important;
}

/* Btn-toggle */
.v-btn-toggle {
  background: var(--t-surface) !important;
}

/* Scrollbar */
html {
  overflow-y: auto;
  scrollbar-color: var(--t-scrollbar) transparent;
}
html::-webkit-scrollbar {
  width: 6px;
}
html::-webkit-scrollbar-track {
  background: transparent;
}
html::-webkit-scrollbar-thumb {
  background: var(--t-scrollbar);
  border-radius: 3px;
}
html::-webkit-scrollbar-thumb:hover {
  background: var(--t-scrollbar-hover);
}

/* ===== Mobile Responsive ===== */
@media (max-width: 959px) {
  .v-container.pa-6 {
    padding: 16px !important;
  }
  .page-banner {
    border-radius: 12px !important;
  }
  .page-banner .text-h4 {
    font-size: 1.25rem !important;
  }
  .page-banner .v-avatar {
    display: none !important;
  }
  .v-dialog > .v-overlay__content {
    max-width: 95vw !important;
    margin: 8px !important;
  }
  .v-data-table {
    font-size: 0.8125rem !important;
  }
  .v-table > .v-table__wrapper {
    overflow-x: auto !important;
  }
}

@media (max-width: 599px) {
  .v-container.pa-6 {
    padding: 10px !important;
  }
  .v-row {
    margin: -4px !important;
  }
  .v-row > .v-col,
  .v-row > [class*="v-col-"] {
    padding: 4px !important;
  }
  .page-banner {
    padding: 16px !important;
  }
}
</style>
