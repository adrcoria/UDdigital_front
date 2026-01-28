<script lang="ts" setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { accountService } from "@/app/http/httpServiceProvider";
import { showErrorAlert, showSuccessAlert } from "@/app/services/alertService";
import CryptoJS from "crypto-js";

/**
 * ESTADO Y CONFIGURACIÓN
 */
const router = useRouter();
const SESSION_EXPIRED_FLAG = "sessionExpired";
const SECRET_KEY = "UGDigital2025$$";

const loading = ref(false);
const isRemember = ref(false);
const errorMsg = ref("");
const formData = ref({
  companyCode: { value: "", isValid: true },
  mail: { value: "", isValid: true },
  password: { value: "", isValid: true },
});
const formRef = ref(null);

const emailRules = [v => !!v || 'El usuario es requerido'];
const passwordRules = [v => !!v || 'La contraseña es requerida'];
const companyCodeRules = [v => !!v || 'El código de empresa es requerido'];

/**
 * LÓGICA DE INICIO DE SESIÓN
 */
const onSignIn = async () => {
  const { valid } = await formRef?.value?.validate();
  if (!valid) return;

  try {
    loading.value = true;
    errorMsg.value = "";

    const payload = {
      companyCode: formData.value.companyCode.value,
      mail: formData.value.mail.value,
      password: formData.value.password.value,
    };
    
    const response = await accountService.login(payload);
    const { data } = response.data;

    if ([200, 201].includes(response.data.statusCode)) {
      localStorage.clear(); 
      sessionStorage.clear();

      const storage = isRemember.value ? localStorage : sessionStorage;
      storage.setItem("accessToken", data.accessToken);
      storage.setItem("user", JSON.stringify(data.user));
      storage.setItem("refreshToken", data.refreshToken);

      if (isRemember.value) {
        const encryptedMail = CryptoJS.AES.encrypt(payload.mail, SECRET_KEY).toString();
        const encryptedPass = CryptoJS.AES.encrypt(payload.password, SECRET_KEY).toString();
        const encryptedCode = CryptoJS.AES.encrypt(payload.companyCode, SECRET_KEY).toString();

        localStorage.setItem("mail", encryptedMail);
        localStorage.setItem("password", encryptedPass);
        localStorage.setItem("companyCode", encryptedCode);
      }

      showSuccessAlert(`¡Bienvenido!`);
      router.push({ path: "/" });
    }
  } catch (error: any) {
    errorMsg.value = "Credenciales incorrectas";
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  const encryptedMail = localStorage.getItem("mail");
  const encryptedPassword = localStorage.getItem("password");
  const encryptedCompanyCode = localStorage.getItem("companyCode");

  if (encryptedMail && encryptedPassword && encryptedCompanyCode) {
    try {
      formData.value.mail.value = CryptoJS.AES.decrypt(encryptedMail, SECRET_KEY).toString(CryptoJS.enc.Utf8);
      formData.value.password.value = CryptoJS.AES.decrypt(encryptedPassword, SECRET_KEY).toString(CryptoJS.enc.Utf8);
      formData.value.companyCode.value = CryptoJS.AES.decrypt(encryptedCompanyCode, SECRET_KEY).toString(CryptoJS.enc.Utf8);
      isRemember.value = true;
    } catch (e) {
      console.error("Error al restaurar credenciales");
    }
  }

  if (sessionStorage.getItem(SESSION_EXPIRED_FLAG) === "true") {
    showErrorAlert();
  }
});
</script>

<template>
  <div class="auth-viewport">
    <div class="login-grid">
      
      <div class="visual-side">
        <div class="gradient-overlay"></div>
        <div class="dots-overlay"></div>
        
        <div class="text-center z-10 px-6">
          <h1 class="text-h2 font-weight-bold mb-2 title-shadow">BIENVENIDOS</h1>
          <p class="text-h5 opacity-70">Plataforma Digital "El Arteaguense"</p>
        </div>

        <div class="visual-footer">
          <small>
            <a href="https://leonix.com.mx" target="_blank" class="text-white text-decoration-none">
              © 2025. Desarrollado por <b class="brand-green">Leonix</b>
            </a>
          </small>
        </div>
      </div>

      <div class="form-side">
        <div class="form-inner">
          <div class="text-center mb-10">
            <h2 class="text-h3 font-weight-bold color-primary">¡Hola!</h2>
            <p class="text-body-1 text-grey-darken-1">Captura tus credenciales para iniciar sesión</p>
          </div>

          <v-form ref="formRef" @submit.prevent="onSignIn" class="w-100">
            <v-alert v-if="errorMsg" class="mb-5" type="error" variant="tonal" density="compact">
              {{ errorMsg }}
            </v-alert>

            <div class="field-group">
              <label>Email</label>
              <v-text-field v-model="formData.mail.value" :rules="emailRules" variant="outlined" placeholder="administrador@gmail.com" prepend-inner-icon="ph-envelope" color="primary" />
            </div>

            <div class="field-group mt-4">
              <label>Código de Empresa</label>
              <v-text-field v-model="formData.companyCode.value" :rules="companyCodeRules" variant="outlined" placeholder="Ej: ART" prepend-inner-icon="ph-buildings" color="primary" />
            </div>

            <div class="field-group mt-4">
              <label>Contraseña</label>
              <v-text-field v-model="formData.password.value" :rules="passwordRules" variant="outlined" type="password" placeholder="••••••••" prepend-inner-icon="ph-lock" color="primary" />
            </div>

            <v-checkbox v-model="isRemember" label="Recordarme" color="primary" hide-details density="compact" class="mt-2" />

            <v-btn color="primary" block size="x-large" class="mt-6 font-weight-bold text-none login-btn" elevation="4" :loading="loading" type="submit">
              Iniciar sesión
            </v-btn>

            <div class="version-info">Versión 1.1.0</div>
          </v-form>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* RESET TOTAL PARA MATAR MÁRGENES DE VUETIFY */
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
  margin: 0;
}

/* LADO VISUAL */
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

/* LADO FORMULARIO */
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

.field-group label {
  display: block;
  font-weight: 700;
  margin-bottom: 5px;
  font-size: 0.85rem;
  color: #333;
}

.color-primary { color: #1976D2; }
.brand-green { color: #00c853; }
.title-shadow { text-shadow: 0 4px 15px rgba(0,0,0,0.6); }
.z-10 { z-index: 10; }
.visual-footer { position: absolute; bottom: 25px; z-index: 10; opacity: 0.8; }
.version-info { text-align: center; margin-top: 45px; color: #bbb; font-size: 0.75rem; }

/* RESPONSIVIDAD MÓVIL (Blindado contra espacios blancos) */
@media (max-width: 960px) {
  .auth-viewport {
    position: relative;
    height: auto;
    min-height: 100vh;
    width: 100%;
    overflow-x: hidden;
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
    min-height: 300px;
  }

  .form-side {
    width: 100%;
    padding: 40px 24px;
    background: white;
  }

  .text-h2 { font-size: 2.25rem !important; }
  .text-h3 { font-size: 1.85rem !important; }

  .visual-footer {
    position: relative;
    bottom: 0;
    margin-top: 30px;
  }
}
</style>