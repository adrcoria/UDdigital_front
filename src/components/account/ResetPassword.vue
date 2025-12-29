<script lang="ts" setup>
import { ref, reactive, shallowRef, onMounted } from "vue";
import { email } from "@/assets/images/auth/utils";
import { verifyService, userService } from "@/app/http/httpServiceProvider";
import { showErrorAlert, showSuccessAlert } from "@/app/services/alertService";
import router from "@/router";
import { useRoute } from "vue-router";
import { on } from "events";
const route = useRoute();

// Estado general
const errorMsg = ref("");
const successMsg = ref("");
const loading = ref(false);
const isSubmitted = ref(false);
const step = ref(1);
const otp = shallowRef('');

// Datos del formulario
const formData = reactive({
  email: "",
  password: "",
  passwordConfirm: "",
  token: "",
});

// Reglas de validación
const emailRules = [
  (v: string) => !!v || 'El correo es requerido',
  (v: string) => /.+@.+\..+/.test(v) || 'El correo debe ser válido',
];

const otpRules = [
  (v: string) => {
    console.log("Validando OTP - Regla requerido, valor:", v);
    return !!v || 'El código es requerido';
  },
  (v: string) => {
    console.log("Validando OTP - Regla longitud, valor:", v);
    return (v && v.length === 6) || 'El código debe tener 6 dígitos';
  },
];


const passwordConfirmRules = [
  (v: string) => !!v || 'La confirmación de la contraseña es requerida',
  (v: string) => v === formData.password || 'Las contraseñas no coinciden',
];

// Referencias a los formularios
const formEmailRef = ref<any>(null);
const formOtpRef = ref<any>(null);
const formPasswordRef = ref<any>(null);

// Función para enviar el email (Step 1)
const onReset = async () => {
  if (formEmailRef.value) {
    const validationResult = await formEmailRef.value.validate();
    if (!validationResult.valid) {
      console.log('El formulario de email no es válido. No se avanza.');
      return;
    }
  }
  try {
    loading.value = true;
    errorMsg.value = "";
    successMsg.value = "";
    isSubmitted.value = true;
    const response = await verifyService.generateOtp({
      media: formData.email,
      type: "MAIL"
    });
    console.log(response);
    if ([200, 201].includes(response.data.statusCode)) {
      step.value = 2;
    }
    else {
      showErrorAlert(response.data.data, 123);
    }
  } catch (error: any) {
    errorMsg.value = error.message;
  } finally {
    loading.value = false;
  }
};



// Función para validar el OTP (Step 2)
const onValidarOtp = async () => {
  console.log("Valor actual de OTP:", otp.value);
  // Validación manual para OTP
  if (!otp.value || otp.value.length !== 6) {
    errorMsg.value = "El código debe tener 6 dígitos";
    return;
  }
  if (formOtpRef.value) {
    const validationResult = await formOtpRef.value.validate();
    if (!validationResult.valid) {
      return;
    }
  }
  try {
    loading.value = true;
    errorMsg.value = "";
    successMsg.value = "";
    isSubmitted.value = true;
    const response = await verifyService.validateOtp({
      otp: otp.value,
      media: formData.email,
      type: "MAIL"
    });
    if ([200, 201].includes(response.data.statusCode)) {
      step.value = 3;
      formData.token = response.data.data;
    }
    else {
      showErrorAlert(response.data.data, 124);
    }
  } catch (error: any) {
    errorMsg.value = error.message;
  } finally {
    loading.value = false;
  }
};


// Función para restablecer la contraseña (Step 3)
const onResetPassword = async () => {
  if (formPasswordRef.value) {
    const validationResult = await formPasswordRef.value.validate();
    console.log('Resultado de validación contraseña:', validationResult);
    if (!validationResult.valid) {
      console.log('El formulario de contraseña no es válido. No se procede.');
      return;
    }
  }
  try {
    loading.value = true;
    errorMsg.value = "";
    successMsg.value = "";
    isSubmitted.value = true;
    // Lógica final para restablecer la contraseña
    const response = await userService.resetPassword({
      password: formData.password,
      token: formData.token,
    });
    if ([200, 201].includes(response.data.statusCode)) {
      showSuccessAlert("Contraseña restablecida con éxito");
      localStorage.clear();
      sessionStorage.clear();
      router.push({ path: "/signin" });
    }
    else {
      showErrorAlert(response.data.data, 125);
    }
  } catch (error: any) {
    errorMsg.value = error.message;
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  if (route.params.mail) {
    formData.email = route.params.mail as string;
    onReset();
  }
});

const passwordRules = [
  (v: string) => !!v || 'La contraseña es requerida',
  (v: string) => v.length >= 8 || 'Debe tener al menos 8 caracteres',
  (v: string) =>
    /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/.test(v) ||
    'Debe incluir al menos una mayúscula, un número y un carácter especial',
];


</script>

<template>
  <div class="h-100 d-flex align-center justify-center">
    <div class="w-100">
      <v-card-title class="text-center">
        <h5 class="text-h6 font-weight-bold">¿Olvidaste tu contraseña?</h5>
        <div class="text-muted mt-1 font-weight-regular">
          No te preocupes, te ayudaremos a recuperarla
        </div>
      </v-card-title>
      <v-card-text class="mt-5">
        <v-row justify="center" class="align-center">
          <!-- Step 1: Email -->
          <v-col cols="12" lg="8" v-if="step === 1">
            <v-img :src="email" alt="" height="80" />
            <v-alert v-if="successMsg" class="my-3" color="success" variant="tonal" density="compact">
              {{ successMsg }}
            </v-alert>
            <v-alert v-if="errorMsg" class="mb-3" color="danger" variant="tonal" density="compact">
              {{ errorMsg }}
            </v-alert>
            <v-alert color="warning" variant="tonal" class="my-4 ps-8">
              Ingresa tu correo electrónico vinculado al sistema
            </v-alert>
            <v-form ref="formEmailRef">
              <div class="font-weight-medium mb-1">
                Email <i class="ph-asterisk ph-xs text-danger" />
              </div>
              <v-text-field id="email-field" variant="solo" density="compact" v-model="formData.email"
                :rules="emailRules" placeholder="Ingresa tu correo" />
              <v-btn color="primary" :loading="loading" block class="mt-4" @click="onReset" small>
                Recuperar contraseña
              </v-btn>
            </v-form>
            <div class="text-center mt-5 d-flex align-center justify-center">
              Olvídalo, ya recuerdo mi contraseña...
              <v-btn to="/signin" variant="text" color="primary"
                class="font-weight-bold text-decoration-underline pa-0">
                Regresar
              </v-btn>
            </div>
          </v-col>

          <!-- Step 2: OTP -->
          <v-col cols="12" lg="8" v-if="step === 2">
            <v-alert color="warning" variant="tonal" class="my-4 ps-8">
              Ingresa el código que hemos enviado a tu correo
            </v-alert>
            <!-- Alerta para mostrar errores en OTP -->
            <v-alert v-if="errorMsg" class="mb-3" color="danger" variant="tonal" density="compact">
              {{ errorMsg }}
            </v-alert>
            <v-form ref="formOtpRef">
              <div class="font-weight-medium mb-1">
                Código <i class="ph-asterisk ph-xs text-danger" />
              </div>
              <v-otp-input v-model="otp" type="password" variant="solo" :rules="otpRules" />
              <v-btn color="primary" :loading="loading" block class="mt-4" @click="onValidarOtp" small>
                Validar
              </v-btn>
            </v-form>
            <div class="text-center mt-5 d-flex align-center justify-center">
              ¿No recibiste el código?
              <v-btn variant="text" color="primary" class="font-weight-bold text-decoration-underline pa-0"
                @click="onReset">
                Reenviar
              </v-btn>
            </div>
          </v-col>

          <!-- Step 3: Nueva contraseña -->
          <v-col cols="12" lg="8" v-if="step === 3">
            <v-alert color="warning" variant="tonal" class="my-4 ps-8">
              Define tu nueva contraseña
            </v-alert>
            <v-form ref="formPasswordRef">
              <div class="font-weight-medium mb-1">
                Nueva contraseña <i class="ph-asterisk ph-xs text-danger" />
              </div>
              <v-text-field id="password-field" variant="solo" density="compact" v-model="formData.password"
                :rules="passwordRules" type="password" placeholder="Ingresa tu contraseña" />
              <div class="font-weight-medium mb-1">
                Confirmar contraseña <i class="ph-asterisk ph-xs text-danger" />
              </div>
              <v-text-field id="password-confirm-field" variant="solo" density="compact"
                v-model="formData.passwordConfirm" :rules="passwordConfirmRules" type="password"
                placeholder="Confirma tu contraseña" />
              <v-btn :loading="loading" color="primary" block class="mt-4" @click="onResetPassword" small>
                Recuperar contraseña
              </v-btn>
            </v-form>
          </v-col>
        </v-row>
      </v-card-text>
    </div>
  </div>
</template>
