<script lang="ts" setup>
import { ref, reactive, shallowRef, onMounted, computed } from "vue";
import { verifyService } from "@/app/http/httpServiceProvider";
import { showSuccessAlert } from "@/app/services/alertService";
import router from "@/router";
import { useRoute } from "vue-router";

const route = useRoute();

const isFirstLogin = computed(() => !!route.params.mail);

const errorMsg = ref("");
const loading = ref(false);
const step = ref(1);
const otp = shallowRef('');
const showPassword = ref(false);
const showPasswordConfirm = ref(false);

const formData = reactive({
  email: "",
  password: "",
  passwordConfirm: "",
  token: "",
});

const emailRules = [
  (v: string) => !!v || 'El correo es requerido',
  (v: string) => /.+@.+\..+/.test(v) || 'El correo debe ser válido',
];

const otpRules = [
  (v: string) => !!v || 'El código es requerido',
  (v: string) => (v && v.length === 6) || 'El código debe tener 6 dígitos',
];

const passwordRules = [
  (v: string) => !!v || 'La contraseña es requerida',
  (v: string) => v.length >= 8 || 'Debe tener al menos 8 caracteres',
  (v: string) =>
    /^(?=.*[A-Z])(?=.*\d)/.test(v) ||
    'Debe incluir al menos una mayúscula y un número',
];

const passwordConfirmRules = [
  (v: string) => !!v || 'La confirmación es requerida',
  (v: string) => v === formData.password || 'Las contraseñas no coinciden',
];

const formEmailRef = ref<any>(null);
const formOtpRef = ref<any>(null);
const formPasswordRef = ref<any>(null);

const onReset = async () => {
  if (formEmailRef.value) {
    const { valid } = await formEmailRef.value.validate();
    if (!valid) return;
  }
  try {
    loading.value = true;
    errorMsg.value = "";
    const response = await verifyService.sendOtp(formData.email);
    if ([200, 201].includes(response.status ?? response.data?.statusCode)) {
      step.value = 2;
    } else {
      errorMsg.value = response.data?.message || "Error al enviar el código";
    }
  } catch (error: any) {
    errorMsg.value = error.response?.data?.message || error.message || "Error al enviar el código";
  } finally {
    loading.value = false;
  }
};

const onValidarOtp = async () => {
  if (!otp.value || otp.value.length !== 6) {
    errorMsg.value = "El código debe tener 6 dígitos";
    return;
  }
  try {
    loading.value = true;
    errorMsg.value = "";
    const response = await verifyService.validateOtp(formData.email, otp.value);
    if ([200, 201].includes(response.status ?? response.data?.statusCode)) {
      formData.token = response.data?.data?.resetToken ?? response.data?.data ?? response.data?.resetToken;
      step.value = 3;
    } else {
      errorMsg.value = response.data?.message || "Código inválido o expirado";
    }
  } catch (error: any) {
    errorMsg.value = error.response?.data?.message || error.message || "Código inválido o expirado";
  } finally {
    loading.value = false;
  }
};

const onResetPassword = async () => {
  if (formPasswordRef.value) {
    const { valid } = await formPasswordRef.value.validate();
    if (!valid) return;
  }
  try {
    loading.value = true;
    errorMsg.value = "";
    const response = await verifyService.resetPassword(formData.token, formData.password);
    if ([200, 201].includes(response.status ?? response.data?.statusCode)) {
      showSuccessAlert("Contraseña establecida con éxito");
      localStorage.clear();
      sessionStorage.clear();
      router.push({ path: "/signin" });
    } else {
      errorMsg.value = response.data?.message || "Error al restablecer la contraseña";
    }
  } catch (error: any) {
    errorMsg.value = error.response?.data?.message || error.message || "Error al restablecer la contraseña";
  } finally {
    loading.value = false;
  }
};

onMounted(() => {});
</script>

<template>
  <div class="auth-viewport">
    <div class="login-grid">

      <!-- Lado visual -->
      <div class="visual-side">
        <div class="gradient-overlay"></div>
        <div class="dots-overlay"></div>

        <div class="text-center z-10 px-6">
          <v-icon :icon="step === 3 ? 'ph-lock-key' : step === 2 ? 'ph-shield-check' : 'ph-envelope'" size="64"
            color="white" class="mb-5 opacity-80" />
          <h1 class="text-h4 font-weight-bold mb-3 title-shadow">
            {{ step === 1
              ? (isFirstLogin ? 'Primer inicio de sesión' : 'Recupera tu acceso')
              : step === 2 ? 'Verifica tu identidad'
              : (isFirstLogin ? 'Crea tu contraseña' : 'Nueva contraseña') }}
          </h1>
          <p class="text-body-1 opacity-70 px-4">
            {{ step === 1
              ? (isFirstLogin
                  ? 'Te enviaremos un código para que puedas establecer tu contraseña personal'
                  : 'Te enviaremos un código de verificación a tu correo electrónico')
              : step === 2
                ? 'Ingresa el código que recibiste en tu bandeja de entrada'
                : (isFirstLogin
                    ? 'Elige una contraseña segura para activar tu acceso al sistema'
                    : 'Crea una contraseña segura para proteger tu cuenta') }}
          </p>

          <div class="step-dots mt-8">
            <span :class="['dot', step >= 1 ? 'active' : '']"></span>
            <span :class="['dot', step >= 2 ? 'active' : '']"></span>
            <span :class="['dot', step >= 3 ? 'active' : '']"></span>
          </div>
        </div>

        <div class="visual-footer">
          <small>
            <a href="https://leonix.com.mx" target="_blank" class="text-white text-decoration-none">
              © 2025. Desarrollado por <b class="brand-green">Leonix</b>
            </a>
          </small>
        </div>
      </div>

      <!-- Lado formulario -->
      <div class="form-side">
        <div class="form-inner">

          <!-- Step 1: Email -->
          <template v-if="step === 1">
            <div class="text-center mb-8">
              <h2 class="text-h4 font-weight-bold color-primary">
                {{ isFirstLogin ? '¡Bienvenido al sistema!' : '¿Olvidaste tu contraseña?' }}
              </h2>
              <p class="text-body-2 text-grey-darken-1 mt-2">
                {{ isFirstLogin
                  ? 'Es tu primer acceso. Te enviaremos un código para establecer tu contraseña'
                  : 'Ingresa tu correo vinculado al sistema' }}
              </p>
            </div>
            <v-alert v-if="errorMsg" type="error" variant="tonal" density="compact" class="mb-4">{{ errorMsg
              }}</v-alert>
            <v-form ref="formEmailRef">
              <label class="field-label">Email <span class="text-error">*</span></label>
              <v-text-field v-model="formData.email" :rules="emailRules" variant="outlined"
                placeholder="correo@ejemplo.com" prepend-inner-icon="ph-envelope" color="primary" />
              <v-btn color="primary" :loading="loading" block size="x-large"
                class="mt-4 font-weight-bold text-none login-btn" elevation="4" @click="onReset">
                Enviar código
              </v-btn>
            </v-form>
            <div class="text-center mt-6">
              <span class="text-grey-darken-1 text-body-2">Ya recuerdo mi contraseña... </span>
              <v-btn to="/signin" variant="text" color="primary" size="small" class="font-weight-bold pa-0 text-none">
                Regresar
              </v-btn>
            </div>
          </template>

          <!-- Step 2: OTP -->
          <template v-if="step === 2">
            <div class="text-center mb-8">
              <h2 class="text-h4 font-weight-bold color-primary">Código de verificación</h2>
              <p class="text-body-2 text-grey-darken-1 mt-2">
                Enviamos un código a <b>{{ formData.email }}</b>
              </p>
            </div>
            <v-alert v-if="errorMsg" type="error" variant="tonal" density="compact" class="mb-4">{{ errorMsg
              }}</v-alert>
            <v-form ref="formOtpRef">
              <label class="field-label">Código <span class="text-error">*</span></label>
              <v-otp-input v-model="otp" variant="outlined" :rules="otpRules" />
              <v-btn color="primary" :loading="loading" block size="x-large"
                class="mt-6 font-weight-bold text-none login-btn" elevation="4" @click="onValidarOtp">
                Verificar código
              </v-btn>
            </v-form>
            <div class="text-center mt-6">
              <span class="text-grey-darken-1 text-body-2">¿No recibiste el código? </span>
              <v-btn variant="text" color="primary" size="small" class="font-weight-bold pa-0 text-none"
                @click="onReset" :loading="loading">
                Reenviar
              </v-btn>
            </div>
          </template>

          <!-- Step 3: Nueva contraseña -->
          <template v-if="step === 3">
            <div class="text-center mb-8">
              <h2 class="text-h4 font-weight-bold color-primary">
                {{ isFirstLogin ? 'Activa tu cuenta' : 'Nueva contraseña' }}
              </h2>
              <p class="text-body-2 text-grey-darken-1 mt-2">
                {{ isFirstLogin
                  ? 'Crea tu contraseña personal. Mínimo 8 caracteres, una mayúscula, un número y un símbolo'
                  : 'Mínimo 8 caracteres, una mayúscula, un número y un símbolo' }}
              </p>
            </div>
            <v-alert v-if="errorMsg" type="error" variant="tonal" density="compact" class="mb-4">{{ errorMsg
              }}</v-alert>
            <v-form ref="formPasswordRef">
              <label class="field-label">Nueva contraseña <span class="text-error">*</span></label>
              <v-text-field v-model="formData.password" :rules="passwordRules" variant="outlined"
                :type="showPassword ? 'text' : 'password'" placeholder="••••••••" prepend-inner-icon="ph-lock"
                :append-inner-icon="showPassword ? 'ph-eye-slash' : 'ph-eye'"
                @click:append-inner="showPassword = !showPassword" color="primary" />
              <label class="field-label">Confirmar contraseña <span class="text-error">*</span></label>
              <v-text-field v-model="formData.passwordConfirm" :rules="passwordConfirmRules" variant="outlined"
                :type="showPasswordConfirm ? 'text' : 'password'" placeholder="••••••••" prepend-inner-icon="ph-lock"
                :append-inner-icon="showPasswordConfirm ? 'ph-eye-slash' : 'ph-eye'"
                @click:append-inner="showPasswordConfirm = !showPasswordConfirm" color="primary" />
              <v-btn :loading="loading" color="primary" block size="x-large"
                class="mt-2 font-weight-bold text-none login-btn" elevation="4" @click="onResetPassword">
                Guardar contraseña
              </v-btn>
            </v-form>
          </template>

        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.auth-viewport {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  background-color: white;
  z-index: 9999;
}

.login-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  width: 100%;
  height: 100%;
}

.visual-side {
  position: relative;
  background-color: #0d0d0d;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  overflow: hidden;
}

.gradient-overlay {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 15% 15%, rgba(25, 118, 210, 0.3) 0%, transparent 55%),
    radial-gradient(circle at 85% 85%, rgba(0, 200, 83, 0.1) 0%, transparent 55%),
    linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
}

.dots-overlay {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(255, 255, 255, 0.05) 1.5px, transparent 1.5px);
  background-size: 35px 35px;
  z-index: 1;
}

.form-side {
  background: white;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
}

.form-inner {
  width: 100%;
  max-width: 420px;
}

.field-label {
  display: block;
  font-weight: 700;
  margin-bottom: 5px;
  font-size: 0.85rem;
  color: #333;
}

.step-dots {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transition: background 0.3s;
}

.dot.active {
  background: white;
}

.color-primary {
  color: #1976D2;
}

.brand-green {
  color: #00c853;
}

.title-shadow {
  text-shadow: 0 4px 15px rgba(0, 0, 0, 0.6);
}

.z-10 {
  z-index: 10;
}

.visual-footer {
  position: absolute;
  bottom: 25px;
  z-index: 10;
  opacity: 0.8;
}

.login-btn {
  border-radius: 10px;
  letter-spacing: 0.5px;
}

@media (max-width: 960px) {
  .auth-viewport {
    position: relative;
    height: auto;
    min-height: 100vh;
  }

  .login-grid {
    grid-template-columns: 1fr;
    display: flex;
    flex-direction: column;
  }

  .visual-side {
    width: 100%;
    padding: 60px 20px;
    height: auto;
    min-height: 260px;
  }

  .form-side {
    width: 100%;
    padding: 40px 24px;
  }

  .visual-footer {
    position: relative;
    bottom: 0;
    margin-top: 30px;
  }
}
</style>
