<script lang="ts" setup>
import { ref, watch, computed, onMounted } from "vue";
import { machineryService, usuariosService } from "@/app/http/httpServiceProvider";
import { showSuccessAlert, showErrorAlert } from "@/app/services/alertService";
import { localDateStr } from "@/app/utils/date";
import {
  MACHINERY_STATUS,
  TRANSMISSION_TYPES,
  FUEL_TYPES,
} from "../types";

const props = defineProps<{ modelValue: boolean; item: any | null }>();
const emit = defineEmits(["update:modelValue", "refresh"]);

const dialog = ref(false);
watch(() => props.modelValue, (v) => (dialog.value = v), { immediate: true });
watch(dialog, (v) => emit("update:modelValue", v));

const isEdit = computed(() => !!props.item?.id);
const loading = ref(false);
const today = computed(() => localDateStr());

/* ──────────────── Formulario ──────────────── */
const initialForm = () => ({
  name: "",
  brand: "",
  model: "",
  transmission: "",
  type: "",
  serialNumber: "",
  acquisitionDate: "",
  acquisitionCost: 0,
  odometer: 0,
  idResponsible: "",
  status: "OPERATIVA",
  notes: "",
  fuelType: "",
  provider: "",
});

const form = ref<any>(initialForm());

const touched = ref<Record<string, boolean>>({});

/* ──────────────── Catálogos ──────────────── */
const users = ref<any[]>([]);
const loadingUsers = ref(false);

const loadUsers = async () => {
  try {
    loadingUsers.value = true;
    const res = await usuariosService.getUsers();
    const list = res.data.data?.list ?? res.data.data ?? res.data ?? [];
    users.value = list.map((u: any) => ({
      ...u,
      fullName: `${u.name} ${u.lastName}`.trim(),
    }));
  } finally {
    loadingUsers.value = false;
  }
};

/* ──────────────── Reglas ──────────────── */
const req = (v: any) => !!v || "Obligatorio";
const nameRules     = computed(() => (touched.value.name        ? [req] : []));
const brandRules    = computed(() => (touched.value.brand       ? [req] : []));
const modelRules    = computed(() => (touched.value.model       ? [req] : []));
const statusRules   = computed(() => (touched.value.status      ? [req] : []));

const isFormValid = computed(() =>
  !!form.value.name?.trim() &&
  !!form.value.brand?.trim() &&
  !!form.value.model?.trim() &&
  !!form.value.status
);

/* ──────────────── Watchers ──────────────── */
watch(
  () => props.item,
  (it) => {
    if (it) {
      form.value = {
        name: it.name || "",
        brand: it.brand || "",
        model: it.model || "",
        transmission: it.transmission || "",
        type: it.type || "",
        serialNumber: it.serialNumber || "",
        acquisitionDate: it.acquisitionDate || "",
        acquisitionCost: typeof it.acquisitionCost === "string"
          ? parseFloat(it.acquisitionCost.replace(/,/g, "")) || 0
          : it.acquisitionCost || 0,
        odometer: typeof it.odometer === "string"
          ? parseFloat(it.odometer.replace(/,/g, "")) || 0
          : it.odometer || 0,
        idResponsible: it.responsible?.id || it.idResponsible || "",
        status: it.status || "OPERATIVA",
        notes: it.notes || "",
        fuelType: it.fuelType || "",
        provider: it.provider || "",
      };
    } else {
      form.value = initialForm();
    }
    touched.value = {};
  },
  { immediate: true }
);

onMounted(loadUsers);

/* ──────────────── Guardar ──────────────── */
const save = async () => {
  Object.keys(form.value).forEach((k) => (touched.value[k] = true));
  if (!isFormValid.value) {
    showErrorAlert("Completa los campos obligatorios");
    return;
  }
  try {
    loading.value = true;
    const payload: any = {
      name: form.value.name.trim(),
      brand: form.value.brand.trim(),
      model: form.value.model.trim(),
      transmission: form.value.transmission || undefined,
      type: form.value.type || undefined,
      serialNumber: form.value.serialNumber || undefined,
      acquisitionDate: form.value.acquisitionDate || undefined,
      acquisitionCost: Number(form.value.acquisitionCost) || 0,
      odometer: Number(form.value.odometer) || 0,
      idResponsible: form.value.idResponsible || undefined,
      status: form.value.status,
      notes: form.value.notes || undefined,
      fuelType: form.value.fuelType || undefined,
      provider: form.value.provider || undefined,
    };

    if (isEdit.value) {
      await machineryService.updateMachinery(props.item.id, payload);
      showSuccessAlert("Maquinaria actualizada");
    } else {
      await machineryService.createMachinery(payload);
      showSuccessAlert("Maquinaria registrada");
    }
    emit("refresh");
    dialog.value = false;
  } catch (error: any) {
    showErrorAlert(error.response?.data?.message || "Error al guardar");
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <v-dialog v-model="dialog" max-width="900" persistent scrollable>
    <v-card>
      <v-card-title class="pa-4 bg-primary text-white d-flex align-center">
        <v-icon icon="ph-tractor" class="mr-2" />
        {{ isEdit ? "Editar maquinaria" : "Registrar maquinaria" }}
        <v-spacer />
        <v-btn icon="ph-x" variant="text" color="white" @click="dialog = false" />
      </v-card-title>

      <v-card-text class="pa-4">
        <!-- ── Identificación ── -->
        <div class="text-subtitle-2 font-weight-bold mb-2 text-primary">Identificación</div>
        <v-row dense>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="form.name"
              label="Nombre *"
              :rules="nameRules"
              @blur="touched.name = true"
              variant="outlined"
              density="compact"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="form.serialNumber"
              label="Núm. de serie"
              variant="outlined"
              density="compact"
            />
          </v-col>
        </v-row>

        <v-row dense>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="form.brand"
              label="Marca *"
              :rules="brandRules"
              @blur="touched.brand = true"
              variant="outlined"
              density="compact"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="form.model"
              label="Modelo *"
              :rules="modelRules"
              @blur="touched.model = true"
              variant="outlined"
              density="compact"
            />
          </v-col>
        </v-row>

        <!-- ── Características técnicas ── -->
        <div class="text-subtitle-2 font-weight-bold mb-2 mt-3 text-primary">Características técnicas</div>
        <v-row dense>
          <v-col cols="12" md="3">
            <v-select
              v-model="form.transmission"
              :items="TRANSMISSION_TYPES"
              item-title="label"
              item-value="value"
              label="Transmisión"
              variant="outlined"
              density="compact"
              clearable
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="form.fuelType"
              :items="FUEL_TYPES"
              item-title="label"
              item-value="value"
              label="Combustible"
              variant="outlined"
              density="compact"
              clearable
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="form.type"
              label="Tipo / subtipo"
              variant="outlined"
              density="compact"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="form.status"
              :items="MACHINERY_STATUS"
              item-title="label"
              item-value="value"
              label="Estado *"
              :rules="statusRules"
              @blur="touched.status = true"
              variant="outlined"
              density="compact"
            />
          </v-col>
        </v-row>

        <!-- ── Operación ── -->
        <div class="text-subtitle-2 font-weight-bold mb-2 mt-3 text-primary">Operación y costos</div>
        <v-row dense>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="form.acquisitionDate"
              type="date"
              label="Fecha de adquisición"
              variant="outlined"
              density="compact"
              :max="today"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field
              v-model.number="form.acquisitionCost"
              type="number"
              min="0"
              step="0.01"
              prefix="$"
              label="Costo de adquisición"
              variant="outlined"
              density="compact"
            />
          </v-col>
          <v-col cols="12" md="2">
            <v-text-field
              v-model.number="form.odometer"
              type="number"
              min="0"
              step="1"
              label="Odómetro"
              variant="outlined"
              density="compact"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-autocomplete
              v-model="form.idResponsible"
              :items="users"
              item-title="fullName"
              item-value="id"
              label="Responsable"
              :loading="loadingUsers"
              variant="outlined"
              density="compact"
              clearable
            />
          </v-col>
        </v-row>

        <!-- ── Proveedor / notas ── -->
        <v-row dense>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="form.provider"
              label="Proveedor"
              variant="outlined"
              density="compact"
            />
          </v-col>
        </v-row>

        <v-textarea
          v-model="form.notes"
          label="Notas / observaciones"
          variant="outlined"
          density="compact"
          rows="2"
          auto-grow
        />
      </v-card-text>

      <v-divider />
      <v-card-actions class="pa-4 bg-grey-lighten-4">
        <v-spacer />
        <v-btn variant="text" @click="dialog = false" :disabled="loading">Cancelar</v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          :loading="loading"
          :disabled="!isFormValid"
          @click="save"
        >
          {{ isEdit ? "Actualizar" : "Guardar" }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
