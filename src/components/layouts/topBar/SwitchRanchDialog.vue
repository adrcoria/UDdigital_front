<script lang="ts" setup>
import { ref, computed, watch } from "vue";
import { useRouter } from "vue-router";
import CryptoJS from "crypto-js";
import { accountService, companyService } from "@/app/http/httpServiceProvider";
import { showSuccessAlert, showErrorAlert } from "@/app/services/alertService";

const SECRET_KEY = "UGDigital2025$$";

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits(["update:modelValue"]);

const router = useRouter();

const loading = ref(false);
const switching = ref(false);
const companies = ref<any[]>([]);
const selectedCompany = ref<string>("");
const password = ref("");
const showPassword = ref(false);
const formRef = ref(null);

const sessionUser = (() => {
  try { return JSON.parse(sessionStorage.getItem("user") || localStorage.getItem("user") || "{}"); }
  catch { return {}; }
})();

const currentCompany = computed(() =>
  sessionUser?.company?.name
    ? `${sessionUser.company.name}${sessionUser.company.code ? ` (${sessionUser.company.code})` : ""}`
    : "Sin empresa"
);

const hasSavedCredentials = computed(() =>
  !!(localStorage.getItem("mail") && localStorage.getItem("password"))
);

const loadCompanies = async () => {
  try {
    loading.value = true;
    const res = await companyService.getCompanies();
    companies.value = (res.data?.data || [])
      .filter((c: any) => c.id !== sessionUser?.company?.id)
      .map((c: any) => ({ title: `${c.name} (${c.code})`, value: c.code }));
  } catch {
    showErrorAlert("Error al cargar los ranchos");
  } finally {
    loading.value = false;
  }
};

const handleSwitch = async () => {
  const { valid } = await (formRef.value as any).validate();
  if (!valid) return;

  try {
    switching.value = true;

    let mail = "";
    let pass = "";

    if (hasSavedCredentials.value) {
      mail = CryptoJS.AES.decrypt(localStorage.getItem("mail")!, SECRET_KEY).toString(CryptoJS.enc.Utf8);
      pass = CryptoJS.AES.decrypt(localStorage.getItem("password")!, SECRET_KEY).toString(CryptoJS.enc.Utf8);
    } else {
      const encMail = localStorage.getItem("mail") || sessionStorage.getItem("mail");
      mail = encMail
        ? CryptoJS.AES.decrypt(encMail, SECRET_KEY).toString(CryptoJS.enc.Utf8)
        : "";
      pass = password.value;
    }

    if (!mail) {
      showErrorAlert("No se encontraron credenciales guardadas. Por favor inicia sesión de nuevo.");
      return;
    }

    const response = await accountService.login({
      companyCode: selectedCompany.value,
      mail,
      password: pass || password.value,
    });

    const { data } = response.data;
    if ([200, 201].includes(response.data.statusCode)) {
      const usedLocalStorage = !!localStorage.getItem("accessToken");
      localStorage.clear();
      sessionStorage.clear();

      const storage = usedLocalStorage ? localStorage : sessionStorage;
      storage.setItem("accessToken", data.accessToken);
      storage.setItem("user", JSON.stringify(data.user));
      storage.setItem("refreshToken", data.refreshToken);

      if (usedLocalStorage) {
        localStorage.setItem("mail", CryptoJS.AES.encrypt(mail, SECRET_KEY).toString());
        localStorage.setItem("password", CryptoJS.AES.encrypt(pass || password.value, SECRET_KEY).toString());
        localStorage.setItem("companyCode", CryptoJS.AES.encrypt(selectedCompany.value, SECRET_KEY).toString());
      }

      showSuccessAlert(`Rancho cambiado correctamente`);
      emit("update:modelValue", false);
      router.push({ path: "/" });
      window.location.reload();
    }
  } catch {
    showErrorAlert("No se pudo cambiar el rancho. Verifica tu contraseña.");
  } finally {
    switching.value = false;
  }
};

const close = () => {
  selectedCompany.value = "";
  password.value = "";
  emit("update:modelValue", false);
};

watch(() => props.modelValue, (val) => {
  if (val) {
    selectedCompany.value = "";
    password.value = "";
    loadCompanies();
  }
});
</script>

<template>
  <v-dialog :model-value="modelValue" @update:model-value="v => emit('update:modelValue', v)" max-width="460px" persistent>
    <v-card class="rounded-lg">
      <v-card-title class="pa-4 bg-teal-darken-2 text-white d-flex align-center">
        <v-icon icon="ph-swap" class="mr-3" />
        <div>
          <div class="text-h6 font-weight-bold">Cambiar Rancho</div>
          <div class="text-caption opacity-80">Sesión activa: {{ currentCompany }}</div>
        </div>
        <v-spacer />
        <v-btn icon="ph-x" variant="text" color="white" @click="close" />
      </v-card-title>

      <v-card-text class="pa-6">
        <div v-if="loading" class="text-center py-6">
          <v-progress-circular indeterminate color="teal-darken-2" />
        </div>

        <v-form v-else ref="formRef" @submit.prevent="handleSwitch">
          <v-text-field
            :model-value="currentCompany"
            label="Rancho actual"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="ph-house"
            readonly
            bg-color="grey-lighten-4"
            class="mb-4"
          />

          <v-select
            v-model="selectedCompany"
            :items="companies"
            label="Rancho destino *"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="ph-buildings"
            :rules="[v => !!v || 'Selecciona el rancho destino']"
            no-data-text="Sin otros ranchos registrados"
            class="mb-4"
          />

          <v-text-field
            v-if="!hasSavedCredentials"
            v-model="password"
            label="Contraseña *"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="ph-lock"
            :type="showPassword ? 'text' : 'password'"
            :append-inner-icon="showPassword ? 'ph-eye-slash' : 'ph-eye'"
            @click:append-inner="showPassword = !showPassword"
            :rules="[v => !!v || 'La contraseña es requerida']"
            placeholder="••••••••"
          />

          <v-alert v-if="hasSavedCredentials" type="info" variant="tonal" density="compact" class="mt-2">
            Se usarán tus credenciales guardadas para acceder al rancho seleccionado.
          </v-alert>
        </v-form>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" @click="close">Cancelar</v-btn>
        <v-btn
          color="teal-darken-2"
          variant="flat"
          :loading="switching"
          :disabled="loading"
          prepend-icon="ph-swap"
          @click="handleSwitch"
        >
          Cambiar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
