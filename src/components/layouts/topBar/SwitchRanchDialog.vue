<script lang="ts" setup>
import { ref, computed, watch } from "vue";
import { accountService, companyService } from "@/app/http/httpServiceProvider";
import { showSuccessAlert, showErrorAlert } from "@/app/services/alertService";
import { useSessionStore } from "@/store/session";

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits(["update:modelValue"]);

const session = useSessionStore();

const loading = ref(false);
const switching = ref(false);
const companies = ref<any[]>([]);
const selectedCompanyId = ref<string>("");
const formRef = ref(null);

// Desde el store: así el encabezado refleja el rancho activo sin recargar
const currentCompany = computed(() => session.companyLabel);

const getRefreshToken = () =>
  localStorage.getItem("refreshToken") || sessionStorage.getItem("refreshToken") || "";

const loadCompanies = async () => {
  try {
    loading.value = true;
    const res = await companyService.getCompanies();
    companies.value = (res.data?.data || [])
      .filter((c: any) => c.id !== session.companyId)
      .map((c: any) => ({ title: `${c.name} (${c.code})`, value: c.id, raw: c }));
  } catch {
    showErrorAlert("Error al cargar los ranchos");
  } finally {
    loading.value = false;
  }
};

const handleSwitch = async () => {
  const { valid } = await (formRef.value as any).validate();
  if (!valid) return;

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    showErrorAlert("Sesión expirada. Por favor inicia sesión de nuevo.");
    return;
  }

  try {
    switching.value = true;
    const response = await accountService.switchCompany(refreshToken, selectedCompanyId.value);
    const { data } = response.data;

    const usedLocalStorage = !!localStorage.getItem("accessToken");
    const existingUser = JSON.parse(
      localStorage.getItem("user") || sessionStorage.getItem("user") || "null"
    );

    const selectedCompanyData = companies.value.find(c => c.value === selectedCompanyId.value);
    const updatedUser = existingUser
      ? { ...existingUser, company: selectedCompanyData?.raw ?? existingUser.company }
      : null;

    localStorage.clear();
    sessionStorage.clear();

    const storage = usedLocalStorage ? localStorage : sessionStorage;
    storage.setItem("accessToken", data.accessToken);
    storage.setItem("refreshToken", data.refreshToken);
    if (updatedUser) storage.setItem("user", JSON.stringify(updatedUser));

    // Cambiar la empresa del store remonta la vista actual: la pantalla en la
    // que está el usuario vuelve a pedir sus datos con el token nuevo, sin
    // recargar la página ni perder la navegación.
    session.setCompany(selectedCompanyData?.raw ?? null);

    showSuccessAlert(`Rancho cambiado a ${session.companyLabel}`);
    emit("update:modelValue", false);
  } catch {
    showErrorAlert("No se pudo cambiar el rancho");
  } finally {
    switching.value = false;
  }
};

const close = () => {
  selectedCompanyId.value = "";
  emit("update:modelValue", false);
};

watch(() => props.modelValue, (val) => {
  if (val) {
    selectedCompanyId.value = "";
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
            v-model="selectedCompanyId"
            :items="companies"
            label="Rancho destino *"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="ph-buildings"
            :rules="[v => !!v || 'Selecciona el rancho destino']"
            no-data-text="Sin otros ranchos registrados"
          />
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
