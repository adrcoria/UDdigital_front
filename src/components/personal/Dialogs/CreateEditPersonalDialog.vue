<script lang="ts" setup>
import { ref, watch, computed, onMounted } from "vue";
import { personalService, positionService } from "@/app/http/httpServiceProvider";
import { showSuccessAlert, showErrorAlert } from "@/app/services/alertService";
import { localDateStr } from "@/app/utils/date";
import { SEX_OPTIONS, CONTRACT_TYPES, ESCOLARITY_OPTIONS } from "../types";

const props = defineProps<{ modelValue: boolean; item: any | null }>();
const emit = defineEmits(["update:modelValue", "refresh"]);

const dialog = ref(false);
watch(() => props.modelValue, (v) => (dialog.value = v), { immediate: true });
watch(dialog, (v) => emit("update:modelValue", v));

const isEdit = computed(() => !!props.item?.id);
const loading = ref(false);
const today = computed(() => localDateStr());
const maxBirthDate = computed(() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return localDateStr(d);
});

/* ──────────────── Form ──────────────── */
const initialForm = () => ({
  name: "",
  lastName: "",
  secondLastName: "",
  address: "",
  phone: "",
  curp: "",
  sex: "",
  idPosition: "",
  birthDate: "",
  age: 0,
  salary: 0,
  entryDate: "",
  contractType: "FIJO",
  escolarity: "",
});

const form = ref<any>(initialForm());
const touched = ref<Record<string, boolean>>({});

/* ──────────────── Catálogo Puestos ──────────────── */
const positions = ref<any[]>([]);
const loadingPositions = ref(false);

const loadPositions = async () => {
  try {
    loadingPositions.value = true;
    const res = await positionService.getPositions();
    positions.value = res.data?.data || [];
  } finally {
    loadingPositions.value = false;
  }
};

/* ──────────────── Reglas ──────────────── */
const req = (v: any) => !!v || "Obligatorio";
const phoneRule = (v: string) => {
  if (!v) return true;
  const digits = (v || "").replace(/\D/g, "");
  return digits.length === 10 || "Deben ser 10 dígitos";
};
const curpRule = (v: string) => {
  if (!v) return true;
  return /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/i.test(v) || "CURP inválida";
};

const nameRules     = computed(() => (touched.value.name        ? [req] : []));
const lastNameRules = computed(() => (touched.value.lastName    ? [req] : []));
const phoneRules    = computed(() => (touched.value.phone       ? [phoneRule] : []));
const curpRules     = computed(() => (touched.value.curp        ? [curpRule] : []));
const positionRules = computed(() => (touched.value.idPosition  ? [req] : []));

const isFormValid = computed(() => {
  const phoneDigits = (form.value.phone || "").replace(/\D/g, "");
  return !!form.value.name?.trim()
    && !!form.value.lastName?.trim()
    && !!form.value.idPosition
    && (!form.value.phone || phoneDigits.length === 10);
});

/* ──────────────── Helpers ──────────────── */
const calcAge = (birthDate: string): number => {
  if (!birthDate) return 0;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return Math.max(0, age);
};

watch(() => form.value.birthDate, (val) => {
  if (val) form.value.age = calcAge(val);
});

/* ──────────────── Watchers ──────────────── */
watch(
  () => props.item,
  (it) => {
    if (it) {
      form.value = {
        name: it.name || "",
        lastName: it.lastName || "",
        secondLastName: it.secondLastName || "",
        address: it.address || "",
        phone: (it.phone || "").replace(/\D/g, "").slice(0, 10),
        curp: it.curp || "",
        sex: it.sex || "",
        idPosition: it.position?.id || it.idPosition || "",
        birthDate: it.birthDate || "",
        age: it.age || 0,
        salary: typeof it.salary === "string"
          ? parseFloat(it.salary.replace(/,/g, "")) || 0
          : it.salary || 0,
        entryDate: it.entryDate || "",
        contractType: it.contractType || "FIJO",
        escolarity: it.escolarity || "",
      };
    } else {
      form.value = initialForm();
    }
    touched.value = {};
  },
  { immediate: true }
);

onMounted(loadPositions);

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
      name: form.value.name.trim(),
      lastName: form.value.lastName.trim(),
      secondLastName: form.value.secondLastName?.trim() || undefined,
      address: form.value.address || undefined,
      phone: form.value.phone ? form.value.phone.replace(/\D/g, "") : undefined,
      curp: form.value.curp?.toUpperCase() || undefined,
      sex: form.value.sex || undefined,
      idPosition: form.value.idPosition,
      birthDate: form.value.birthDate || undefined,
      age: Number(form.value.age) || undefined,
      salary: Number(form.value.salary) || 0,
      entryDate: form.value.entryDate || undefined,
      contractType: form.value.contractType || undefined,
      escolarity: form.value.escolarity || undefined,
    };

    if (isEdit.value) {
      await personalService.updatePersonal(props.item.id, payload);
      showSuccessAlert("Personal actualizado");
    } else {
      await personalService.createPersonal(payload);
      showSuccessAlert("Personal registrado");
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
  <v-dialog v-model="dialog" max-width="950" persistent scrollable>
    <v-card>
      <v-card-title class="pa-4 bg-primary text-white d-flex align-center">
        <v-icon icon="ph-user" class="mr-2" />
        {{ isEdit ? "Editar personal" : "Registrar personal" }}
        <v-spacer />
        <v-btn icon="ph-x" variant="text" color="white" @click="dialog = false" :disabled="loading" />
      </v-card-title>

      <v-card-text class="pa-4">
        <!-- ── Datos personales ── -->
        <div class="text-subtitle-2 font-weight-bold mb-2 text-primary">Datos personales</div>
        <v-row dense>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="form.name"
              label="Nombre(s) *"
              :rules="nameRules"
              @blur="touched.name = true"
              variant="outlined"
              density="compact"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="form.lastName"
              label="Apellido paterno *"
              :rules="lastNameRules"
              @blur="touched.lastName = true"
              variant="outlined"
              density="compact"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="form.secondLastName"
              label="Apellido materno"
              variant="outlined"
              density="compact"
            />
          </v-col>
        </v-row>

        <v-row dense>
          <v-col cols="12" md="3">
            <v-select
              v-model="form.sex"
              :items="SEX_OPTIONS"
              item-title="label"
              item-value="value"
              label="Sexo"
              variant="outlined"
              density="compact"
              clearable
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="form.birthDate"
              type="date"
              label="Fecha de nacimiento"
              variant="outlined"
              density="compact"
              :max="maxBirthDate"
              hint="Debe tener mínimo 18 años"
              persistent-hint
            />
          </v-col>
          <v-col cols="12" md="2">
            <v-text-field
              :model-value="form.age"
              label="Edad"
              variant="outlined"
              density="compact"
              readonly
              bg-color="grey-lighten-4"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              :model-value="form.curp"
              @update:model-value="(val: string) => form.curp = (val || '').toUpperCase()"
              label="CURP"
              :rules="curpRules"
              @blur="touched.curp = true"
              variant="outlined"
              density="compact"
              maxlength="18"
            />
          </v-col>
        </v-row>

        <!-- ── Contacto ── -->
        <div class="text-subtitle-2 font-weight-bold mb-2 mt-3 text-primary">Contacto</div>
        <v-row dense>
          <v-col cols="12" md="4">
            <v-text-field
              :model-value="form.phone"
              @update:model-value="(val: string) => form.phone = (val || '').replace(/\D/g, '').slice(0, 10)"
              label="Teléfono"
              :rules="phoneRules"
              @blur="touched.phone = true"
              placeholder="10 dígitos"
              variant="outlined"
              density="compact"
              maxlength="10"
            />
          </v-col>
          <v-col cols="12" md="8">
            <v-text-field
              v-model="form.address"
              label="Dirección"
              variant="outlined"
              density="compact"
            />
          </v-col>
        </v-row>

        <!-- ── Datos laborales ── -->
        <div class="text-subtitle-2 font-weight-bold mb-2 mt-3 text-primary">Datos laborales</div>
        <v-row dense>
          <v-col cols="12" md="4">
            <v-autocomplete
              v-model="form.idPosition"
              :items="positions"
              item-title="name"
              item-value="id"
              label="Puesto *"
              :rules="positionRules"
              @blur="touched.idPosition = true"
              :loading="loadingPositions"
              variant="outlined"
              density="compact"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-select
              v-model="form.contractType"
              :items="CONTRACT_TYPES"
              item-title="label"
              item-value="value"
              label="Tipo de contrato"
              variant="outlined"
              density="compact"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-select
              v-model="form.escolarity"
              :items="ESCOLARITY_OPTIONS"
              item-title="label"
              item-value="value"
              label="Escolaridad"
              variant="outlined"
              density="compact"
              clearable
            />
          </v-col>
        </v-row>

        <v-row dense>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="form.entryDate"
              type="date"
              label="Fecha de ingreso"
              variant="outlined"
              density="compact"
              :max="today"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model.number="form.salary"
              type="number"
              min="0"
              step="0.01"
              prefix="$"
              label="Salario"
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
