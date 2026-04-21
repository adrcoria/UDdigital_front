<script lang="ts" setup>
import { ref, watch } from "vue";
import { bovineService, liveStockService } from "@/app/http/httpServiceProvider";
import { showSuccessAlert, showErrorAlert } from "@/app/services/alertService";
import { localDateStr } from "@/app/utils/date";

const props = defineProps<{ modelValue: boolean; bovine: any | null }>();
const emit = defineEmits(["update:modelValue", "refresh"]);

const formRef = ref<any>(null);
const saving = ref(false);
const deathCauses = ref<any[]>([]);

const today = localDateStr();

const form = ref({
  deathDate: today,
  deathCauseId: null as string | null,
  deathComments: ""
});

const rules = {
  required: (v: any) => !!v || "Campo obligatorio",
  noFuture: (v: any) => !v || v <= today || "No se permiten fechas futuras"
};

const loadCauses = async () => {
  try {
    const res = await liveStockService.getItems("death-cause", { page: 1, limit: 1000 });
    deathCauses.value = res.data?.data || [];
  } catch {
    showErrorAlert("No se pudieron cargar las causas de muerte");
  }
};

watch(() => props.modelValue, (val) => {
  if (val) {
    form.value = { deathDate: today, deathCauseId: null, deathComments: "" };
    loadCauses();
  }
}, { immediate: true });

const save = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  try {
    saving.value = true;
    await bovineService.killBovine(props.bovine.id, {
      deathDate: form.value.deathDate,
      deathCauseId: form.value.deathCauseId!,
      deathComments: form.value.deathComments
    });
    showSuccessAlert("Registro de defunción guardado");
    emit("refresh");
    emit("update:modelValue", false);
  } catch (error: any) {
    const msg = error.response?.data?.message;
    showErrorAlert(Array.isArray(msg) ? msg[0] : msg || "Error al registrar la defunción");
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <v-dialog :model-value="modelValue" max-width="500" persistent @update:model-value="emit('update:modelValue', $event)">
    <v-card class="rounded-xl">
      <v-card-title class="pa-4 bg-error text-white d-flex align-center">
        <v-icon class="mr-2">ph-skull</v-icon>
        <span class="text-h6 font-weight-bold">Registrar Defunción</span>
        <v-spacer />
        <v-btn icon="ph-x" variant="text" color="white" @click="emit('update:modelValue', false)" />
      </v-card-title>

      <v-card-text class="pa-6">
        <v-alert type="warning" variant="tonal" density="compact" class="mb-4">
          Esta acción registrará a <strong>{{ bovine?.name }}</strong> como fallecido. No podrá revertirse.
        </v-alert>

        <v-form ref="formRef">
          <v-text-field
            v-model="form.deathDate"
            type="date"
            label="Fecha de Defunción *"
            variant="outlined"
            :max="today"
            :rules="[rules.required, rules.noFuture]"
            class="mb-2"
          />

          <v-autocomplete
            v-model="form.deathCauseId"
            :items="deathCauses"
            item-title="name"
            item-value="id"
            label="Causa de Muerte *"
            variant="outlined"
            :rules="[rules.required]"
            class="mb-2"
          />

          <v-text-field
            v-model="form.deathComments"
            label="Comentarios *"
            variant="outlined"
            :rules="[rules.required]"
          />
        </v-form>
      </v-card-text>

      <v-divider />
      <v-card-actions class="pa-4 bg-grey-lighten-4">
        <v-spacer />
        <v-btn variant="text" @click="emit('update:modelValue', false)">Cancelar</v-btn>
        <v-btn color="error" variant="flat" class="px-6" :loading="saving" @click="save">
          Confirmar Defunción
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
