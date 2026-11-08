<template>
  <v-container fluid class="fill-height login-container animated-bg pa-0">
    <v-row justify="center" align="center" class="fill-height">
      <v-col cols="12" sm="10" md="8" lg="5" xl="4">
        <!-- Beautiful Login Card -->
        <v-card elevation="24" class="login-card fade-in card-shadow-lg" style="border-radius: 24px; overflow: hidden">
          <!-- Header with Gradient - Centered Logo and Text -->
          <div class="login-hero pa-10 text-center d-flex flex-column align-center justify-center" :style="{ backgroundImage: `url(${headerBg})` }" style="position: relative; min-height: 350px">
            <div style="position: relative; z-index: 1" class="d-flex flex-column align-center">
              <v-avatar size="140" color="white" class="mb-6 elevation-12">
                <v-img :src="logoImg" alt="جوستو" contain class="ma-3"></v-img>
              </v-avatar>
              <h1 class="text-h3 font-weight-bold text-white text-shadow mb-3">مطعم جوستو</h1>
              <p class="text-h5 text-white mb-4" style="opacity: 0.95">Gusto Restaurant</p>
              <p class="text-h6 text-white" style="opacity: 0.9">مرحباً بك! سجل الدخول للمتابعة</p>
            </div>
            <!-- Decorative circles -->
            <div style="position: absolute; top: -50px; right: -50px; width: 200px; height: 200px; background: rgba(255, 255, 255, 0.1); border-radius: 50%"></div>
            <div style="position: absolute; bottom: -30px; left: -30px; width: 150px; height: 150px; background: rgba(255, 255, 255, 0.08); border-radius: 50%"></div>
          </div>

          <!-- Form Section -->
          <v-card-text class="pa-8">
            <v-form @submit.prevent="handleLogin" ref="loginForm">
              <div class="mb-6">
                <v-text-field
                  v-model="credentials.email"
                  label="البريد الإلكتروني"
                  type="email"
                  variant="outlined"
                  :rules="[rules.required, rules.email]"
                  class="modern-input"
                  color="primary"
                  density="comfortable"
                  style="border-radius: 12px"
                >
                  <template v-slot:prepend-inner>
                    <PhEnvelopeSimple :size="24" weight="regular" />
                  </template>
                </v-text-field>
              </div>

              <div class="mb-6">
                <v-text-field
                  v-model="credentials.password"
                  label="كلمة المرور"
                  :type="showPassword ? 'text' : 'password'"
                  variant="outlined"
                  :rules="[rules.required]"
                  class="modern-input"
                  color="primary"
                  density="comfortable"
                  style="border-radius: 12px"
                >
                  <template v-slot:prepend-inner>
                    <PhLock :size="24" weight="regular" />
                  </template>
                  <template v-slot:append-inner>
                    <div @click="showPassword = !showPassword" style="cursor: pointer">
                      <PhEye v-if="!showPassword" :size="24" weight="regular" />
                      <PhEyeSlash v-else :size="24" weight="regular" />
                    </div>
                  </template>
                </v-text-field>
              </div>

              <v-btn
                type="submit"
                size="x-large"
                block
                :loading="loading"
                class="btn-modern gradient-primary text-white mt-2"
                elevation="8"
                style="border-radius: 12px; text-transform: none; font-size: 18px; letter-spacing: 1px"
              >
                <PhSignIn :size="24" weight="bold" class="ml-2" />
                تسجيل الدخول
              </v-btn>
            </v-form>

            <!-- Additional Info -->
            <div class="text-center mt-6">
              <p class="text-caption text-medium-emphasis d-flex align-center justify-center">
                <PhShieldCheck :size="20" weight="regular" class="ml-1" />
                تسجيل الدخول آمن ومشفر
              </p>
            </div>
          </v-card-text>
        </v-card>

        <!-- Footer Text -->
        <div class="text-center mt-6">
          <p class="text-white text-shadow d-flex align-center justify-center">
            <PhCopyright :size="20" weight="regular" class="ml-1" />
            2026 مطعم جوستو - جميع الحقوق محفوظة
          </p>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { homeFor } from "@/config/navigation";
import logoImg from "@/assets/logo.png";
import headerBg from "@/assets/header-bg.jpeg";
import { useToast } from "vue-toastification";
import { PhEnvelopeSimple, PhLock, PhEye, PhEyeSlash, PhSignIn, PhShieldCheck, PhCopyright } from "@phosphor-icons/vue";

const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();

const credentials = ref({
  email: "",
  password: "",
});

const showPassword = ref(false);
const loading = ref(false);
const loginForm = ref(null);

const rules = {
  required: (value) => !!value || "مطلوب",
  email: (value) => /.+@.+\..+/.test(value) || "بريد إلكتروني غير صحيح",
};

const handleLogin = async () => {
  const { valid } = await loginForm.value.validate();

  if (!valid) return;

  loading.value = true;
  const result = await authStore.login(credentials.value);
  loading.value = false;

  if (result.success) {
    toast.success("تم تسجيل الدخول بنجاح!");
    router.push(homeFor(authStore.user?.role));
  } else {
    toast.error(result.message);
  }
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

.login-hero {
  background-size: cover;
  background-position: center;
}

/* Dark teal scrim keeps white text readable over the photo */
.login-hero::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(160deg, rgba(2, 63, 75, 0.82) 0%, rgba(5, 9, 10, 0.72) 100%);
}

.text-shadow {
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.login-card :deep(.v-card-text) {
  background: var(--t-surface) !important;
}

.login-card :deep(.v-field) {
  background: var(--t-hover) !important;
}
</style>
