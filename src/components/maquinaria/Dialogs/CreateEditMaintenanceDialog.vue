<script lang="ts" setup>
import { ref, watch, computed } from "vue";
import { machineryMaintenanceService } from "@/app/http/httpServiceProvider";
import { showSuccessAlert, showErrorAlert } from "@/app/services/alertService";
import { localDateStr } from "@/app/utils/date";
import { MAINTENANCE_TYPES, WORKSHOP_TYPES } from "../types";

const props = defineProps<{
  modelValue: boolean;
  item: any | null;
  machineryId: string;
}>();
const emit = defineEmits(["update:modelValue", "refresh"]);

const dialog = ref(false);
watch(() => props.modelValue, (v) => (dialog.value = v), { immediate: true });
watch(dialog, (v) => emit("update:modelValue", v));

const isEdit = computed(() => !!props.item?.id);
const loading = ref(false);
const today = computed(() => localDateStr());

/* ──────────────── Form ──────────────── */
const initialForm = () => ({
  type: "PREVENTIVO",
  programedDate: "",
  doneDate: "",
  odometer: 0,
  jobDescription: "",
  sparePartsUsed: "",
  workshop: "INTERNO",
  totalCost: 0,
  nextMaintenance: "",
  notes: "",
});

const form = ref<any>(initialForm());
const touched = ref<Record<string, boolean>>({});

const req = (v: any) => !!v || "Obligatorio";
const typeRules = computed(() => (touched.value.type ? [req] : []));
const jobRules  = computed(() => (touched.value.jobDescription ? [req] : []));

const isFormValid = computed(() =>
  !!form.value.type && !!form.value.jobDescription?.trim()
);

/* ──────────────── Watchers ──────────────── */
watch(
  () => props.item,
  (it) => {
    if (it) {
      form.value = {
        type: it.type || "PREVENTIVO",
        programedDate: it.programedDate || "",
        doneDate: it.doneDate || "",
        odometer: typeof it.odometer === "string"
          ? parseFloat(it.odometer.replace(/,/g, "")) || 0
          : it.odometer || 0,
        jobDescription: it.jobDescription || "",
        sparePartsUsed: it.sparePartsUsed || "",
        workshop: it.workshop || "INTERNO",
        totalCost: typeof it.totalCost === "string"
          ? parseFloat(it.totalCost.replace(/,/g, "")) || 0
          : it.totalCost || 0,
        nextMaintenance: it.nextMaintenance || "",
        notes: it.notes || "",
      };
    } else {
      form.value = initialForm();
    }
    touched.value = {};
  },
  { immediate: true }
);

/* ──────────────── Save ──────────────── */
const save = async () => {
  Object.keys(form.value).forEach((k) => (touched.value[k] = true));
  if (!isFormValid.value) {
    showErrorAlert("Completa los campos obligatorios");
    return;
  }
  try {
    loading.value = true;
    const payload: any = {
      type: form.value.type,
      programedDate: form.value.programedDate || null,
      doneDate: form.value.doneDate || null,
      odometer: Number(form.value.odometer) || 0,
      jobDescription: form.value.jobDescription.trim(),
      sparePartsUsed: form.value.sparePartsUsed || undefined,
      workshop: form.value.workshop || undefined,
      totalCost: Number(form.value.totalCost) || 0,
      nextMaintenance: form.value.nextMaintenance || null,
      notes: form.value.notes || undefined,
      idMachinery: props.machineryId,
    };

    if (isEdit.value) {
      await machineryMaintenanceService.updateMaintenance(props.item.id, payload);
      showSuccessAlert("Mantenimiento actualizado");
    } else {
      await machineryMaintenanceService.createMaintenance(payload);
      showSuccessAlert("Mantenimiento registrado");
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
  <v-dialog v-model="dialog" max-width="850" persistent scrollable>
    <v-card>
      <v-card-title class="pa-4 bg-primary text-white d-flex align-center">
        <v-icon icon="ph-wrench" class="mr-2" />
        {{ isEdit ? "Editar mantenimiento" : "Registrar mantenimiento" }}
        <v-spacer />
        <v-btn icon="ph-x" variant="text" color="white" @click="dialog = false" :disabled="loading" />
      </v-card-title>

      <v-card-text class="pa-4">
        <!-- ── Clasificación ── -->
        <div class="text-subtitle-2 font-weight-bold mb-2 text-primary">Clasificación</div>
        <v-row dense>
          <v-col cols="12" md="4">
            <v-select
              v-model="form.type"
              :items="MAINTENANCE_TYPES"
              item-title="label"
              item-value="value"
              label="Tipo *"
              :rules="typeRules"
              @blur="touched.type = true"
              variant="outlined"
              density="compact"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-select
              v-model="form.workshop"
              :items="WORKSHOP_TYPES"
              item-title="label"
              item-value="value"
              label="Taller"
              variant="outlined"
              density="compact"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model.number="form.odometer"
              type="number"
              min="0"
              step="1"
              label="Odómetro al servicio"
              variant="outlined"
              density="compact"
            />
          </v-col>
        </v-row>

        <!-- ── Fechas ── -->
        <div class="text-subtitle-2 font-weight-bold mb-2 mt-3 text-primary">Fechas</div>
        <v-row dense>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="form.programedDate"
              type="date"
              label="Fecha programada"
              variant="outlined"
              density="compact"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="form.doneDate"
              type="date"
              label="Fecha realizada"
              variant="outlined"
              density="compact"
              :max="today"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="form.nextMaintenance"
              type="date"
              label="Próximo mantenimiento"
              variant="outlined"
              density="compact"
            />
          </v-col>
        </v-row>

        <!-- ── Trabajo ── -->
        <div class="text-subtitle-2 font-weight-bold mb-2 mt-3 text-primary">Detalle del trabajo</div>
        <v-textarea
          v-model="form.jobDescription"
          label="Descripción del trabajo *"
          :rules="jobRules"
          @blur="touched.jobDescription = true"
          variant="outlined"
          density="compact"
          rows="2"
          auto-grow
        />
        <v-textarea
          v-model="form.sparePartsUsed"
          label="Refacciones utilizadas"
          variant="outlined"
          density="compact"
          rows="2"
          auto-grow
        />

        <!-- ── Costo / notas ── -->
        <v-row dense>
          <v-col cols="12" md="4">
            <v-text-field
              v-model.number="form.totalCost"
              type="number"
              min="0"
              step="0.01"
              prefix="$"
              label="Costo total"
              variant="outlined"
              density="compact"
            />
          </v-col>
          <v-col cols="12" md="8">
            <v-text-field
              v-model="form.notes"
              label="Notas / observaciones"
              variant="outlined"
              density="compact"
            />
          </v-col>
        </v-row>
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
