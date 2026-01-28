<script lang="ts" setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { accountService } from "@/app/http/httpServiceProvider";
import { showErrorAlert, showSuccessAlert } from "@/app/services/alertService";

import CryptoJS from "crypto-js";

const router = useRouter();
const SESSION_EXPIRED_FLAG = "sessionExpired";

const loading = ref(false);
const isSubmitted = ref(false);
const isRemember = ref(false);
const errorMsg = ref("");
const formData = ref({
  companyCode: { value: "", isValid: true },
  mail: { value: "", isValid: true },
  password: { value: "", isValid: true },
});
const formRef = ref(null);

const emailRules = [
  v => !!v || 'El usuario es requerido'
];

const passwordRules = [
  v => !!v || 'La contraseña es requerida',
];

const companyCodeRules = [
  v => !!v || 'El código de empresa es requerido',
];

const SECRET_KEY = "UGDigital2025$$";


const onSignIn = async () => {
  isSubmitted.value = true;
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
      if (data.isRequiredChangePassword) {
        router.push({ path: `/pass-reset/${payload.mail}` });
        return;
      }

      const { accessToken, refreshToken, user } = data;

      // 1. Limpieza Preventiva: Borramos todo antes de setear lo nuevo
      // Esto evita que queden residuos de usuarios anteriores
      localStorage.clear(); 
      sessionStorage.clear();

      // 2. Definir el storage destino
      const storage = isRemember.value ? localStorage : sessionStorage;

      // 3. Guardar sesión técnica
      storage.setItem("accessToken", accessToken);
      storage.setItem("user", JSON.stringify(user));
      storage.setItem("refreshToken", refreshToken);

      // 3.1 Limpiar banderas de expiración de sesión
      sessionStorage.removeItem("sessionExpired");
      sessionStorage.removeItem("sessionExpiredAlertShown");
      localStorage.removeItem("sessionExpired");
      localStorage.removeItem("sessionExpiredAlertShown");

      // 4. Lógica de "Recordarme" (Credenciales)
      if (isRemember.value) {
        const encryptedMail = CryptoJS.AES.encrypt(payload.mail, SECRET_KEY).toString();
        const encryptedPass = CryptoJS.AES.encrypt(payload.password, SECRET_KEY).toString();
        const encryptedCode = CryptoJS.AES.encrypt(payload.companyCode, SECRET_KEY).toString();

        localStorage.setItem("mail", encryptedMail);
        localStorage.setItem("password", encryptedPass);
        localStorage.setItem("companyCode", encryptedCode);
      }

      showSuccessAlert(`¡Bienvenido, ${user.name}!`);
      router.push({ path: "/" });
    }
  } catch (error: any) {
    errorMsg.value = error.status === 401 ? "Credenciales incorrectas" : error.message;
  } finally {
    loading.value = false;
  }
};



onMounted(() => {
  const encryptedMail = localStorage.getItem("mail");
  const encryptedPassword = localStorage.getItem("password");
  const encryptedCompanyCode = localStorage.getItem("companyCode");

  if (encryptedMail) {
    formData.value.mail.value = CryptoJS.AES.decrypt(
      encryptedMail,
      SECRET_KEY
    ).toString(CryptoJS.enc.Utf8);
  }

  if (encryptedPassword) {
    formData.value.password.value = CryptoJS.AES.decrypt(
      encryptedPassword,
      SECRET_KEY
    ).toString(CryptoJS.enc.Utf8);
  }

  if (encryptedCompanyCode) {
    formData.value.companyCode.value = CryptoJS.AES.decrypt(
      encryptedCompanyCode,
      SECRET_KEY
    ).toString(CryptoJS.enc.Utf8);
  }

  isRemember.value = !!(
    encryptedMail &&
    encryptedPassword &&
    encryptedCompanyCode
  );

  if (sessionStorage.getItem(SESSION_EXPIRED_FLAG) === "true") {
    showErrorAlert();
  }
});

</script>
<template>
  <div class="h-100 d-flex align-center justify-center">
    <div class="w-100">
      <v-card-title class="text-center">
        <h5 class="text-h6 font-weight-bold mt-10">¡Hola!</h5>
        <div class="text-muted font-weight-regular">
          Captura tus credenciales para iniciar sesión
        </div>
      </v-card-title>
      <v-card-text class="mt-5">
        <v-row justify="center" class="align-center">
          <v-col cols="12" lg="8">
            <v-alert v-if="errorMsg" class="mb-3" color="danger" variant="tonal" density="compact">
              {{ errorMsg }}
            </v-alert>
            <v-form ref="formRef" @submit.prevent="onSignIn">
              <div class="font-weight-medium mb-1">
                Captura de email <i class="ph-asterisk ph-xs text-danger" />
              </div>
              <v-text-field id="email-field" variant="solo" density="compact" v-model="formData.mail.value"
                :rules="emailRules" placeholder="Ingresa tu usuario" />
              <div class="font-weight-medium mb-1">
                Código de empresa <i class="ph-asterisk ph-xs text-danger" />
              </div>

              <v-text-field id="company-code-field" variant="solo" density="compact"
                v-model="formData.companyCode.value" :rules="companyCodeRules"
                placeholder="Ingresa el código de empresa" />
              <div class="d-flex justify-space-between align-center mt-4">
                <div class="font-weight-medium">
                  Captura tu contraseña <i class="ph-asterisk ph-xs text-danger" />
                </div>
                <!-- <v-btn variant="plain" class="px-0 font-weight-regular" to="/pass-reset">
                  ¿Olvidaste tu contraseña?
                </v-btn> -->
              </div>
              <v-text-field id="password-field" variant="solo" density="compact" v-model="formData.password.value"
                :rules="passwordRules" placeholder="Ingresa tu contraseña" type="password" />
              <v-checkbox v-model="isRemember" color="primary" class="my-1">
                <template #label>
                  <span>Recordarme</span>
                </template>
              </v-checkbox>
              <v-btn color="primary" block class="mt-2" :loading="loading" @click="onSignIn">
                Iniciar sesión
              </v-btn>
            </v-form>
          </v-col>
        </v-row>
        <v-row justify="center" class="mt-4">
          <v-col cols="12" lg="8" class="text-center">
            <span class="text-muted">
              Versión 1.1.0
            </span>
          </v-col>
        </v-row>
      </v-card-text>
    </div>
  </div>
</template>
