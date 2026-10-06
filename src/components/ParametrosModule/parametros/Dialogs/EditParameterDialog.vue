<script lang="ts" setup>
import { ref, computed, watch } from "vue";
import { parameterService } from "@/app/http/httpServiceProvider";
import { showSuccessAlert, showErrorAlert } from "@/app/services/alertService";
import { getParameterMeta, type Parameter } from "../utils";

const props = defineProps<{ modelValue: boolean; parameter: Parameter | null }>();
const emit = defineEmits(["update:modelValue", "refresh"]);

const dialog = ref(false);
watch(() => props.modelValue, (v) => (dialog.value = v), { immediate: true });
watch(dialog, (v) => emit("update:modelValue", v));

const saving = ref(false);
const value = ref<number | null>(null);
const touched = ref(false);

const meta = computed(() => getParameterMeta(props.parameter?.name ?? ""));

watch(
  () => props.parameter,
  (p) => {
    value.value = p ? Number(p.value) : null;
    touched.value = false;
  },
  { immediate: true }
);

/* ── Validación ──────────────────────────────────────────────────────────── */
const error = computed(() => {
  const v = value.value;

  if (v === null || v === undefined || (v as any) === "" || Number.isNaN(Number(v))) {
    return "Captura un valor";
  }

  const num = Number(v);
  if (!meta.value.decimals && !Number.isInteger(num)) return "Debe ser un número entero";
  if (meta.value.min !== undefined && num < meta.value.min) {
    return `No puede ser menor a ${meta.value.min}`;
  }
  if (meta.value.max !== undefined && num > meta.value.max) {
    return `No puede ser mayor a ${meta.value.max}`;
  }

  return "";
});

const isValid = computed(() => !error.value);
const hasChanged = computed(() => String(value.value) !== String(props.parameter?.value ?? ""));

const save = async () => {
  touched.value = true;
  if (!isValid.value || !props.parameter) return;

  try {
    saving.value = true;
    // El API guarda el valor como texto
    await parameterService.updateParameter({
      name: props.parameter.name,
      value: String(value.value),
    });

    showSuccessAlert("Parámetro actualizado");
    emit("refresh");
    dialog.value = false;
  } catch (err: any) {
    const msg = err.response?.data?.message;
    showErrorAlert(Array.isArray(msg) ? msg[0] : msg || "No se pudo actualizar el parámetro");
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <v-dialog v-model="dialog" max-width="480" persistent>
    <v-card class="rounded-lg">
      <v-card-title class="pa-4 bg-primary text-white d-flex align-center">
        <v-icon class="mr-2">ph-sliders</v-icon>
        <span class="text-subtitle-1 font-weight-bold">Editar parámetro</span>
        <v-spacer />
        <v-btn icon="ph-x" variant="text" color="white" size="small" @click="dialog = false" />
      </v-card-title>

      <v-card-text class="pa-5">
        <div class="text-subtitle-2 font-weight-bold">{{ meta.label }}</div>
        <div v-if="meta.description" class="text-caption text-medium-emphasis mb-1">
          {{ meta.description }}
        </div>
        <div class="text-caption text-medium-emphasis mb-4">
          Clave del sistema: <strong>{{ parameter?.name }}</strong>
        </div>

        <v-text-field
          v-model.number="value"
          label="Valor *"
          type="number"
          :step="meta.decimals ? 'any' : '1'"
          :min="meta.min"
          :max="meta.max"
          :suffix="meta.unit"
          variant="outlined"
          density="comfortable"
          autofocus
          :error-messages="touched && error ? [error] : []"
          @blur="touched = true"
        />

        <v-alert type="info" variant="tonal" density="compact" class="text-caption">
          Este valor es global: aplica a todo el sistema en cuanto se guarda.
        </v-alert>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" @click="dialog = false">Cancelar</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          class="px-6"
          :loading="saving"
          :disabled="!isValid || !hasChanged"
          @click="save"
        >
          Guardar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
