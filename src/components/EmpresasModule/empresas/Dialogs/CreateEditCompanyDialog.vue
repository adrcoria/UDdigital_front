<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { companyService } from "@/app/http/httpServiceProvider";
import { showSuccessAlert, showErrorAlert } from "@/app/services/alertService";

const props = defineProps<{ modelValue: boolean; company: any | null }>();
const emit = defineEmits(["refresh", "update:modelValue"]);

const dialog = ref(false);
watch(() => props.modelValue, v => (dialog.value = v), { immediate: true });
watch(dialog, v => emit("update:modelValue", v));

/* ---------- Form State ---------- */
const form = ref({
  name: "",
  code: "",
  description: "",
});

const touched = ref({
  name: false,
  code: false,
  description: false,
});

const resetForm = () => {
  form.value = {
    name: "",
    code: "",
    description: "",
  };
  Object.keys(touched.value).forEach(k => touched.value[k as keyof typeof touched.value] = false);
};

/* ---------- Guardar State ---------- */
const loading = ref(false);
const isEdit = computed(() => !!props.company?.id);

/* ---------- Validaciones Estrictas ---------- */
const req = (v: any) => !!v || "Obligatorio";

// Regla para forzar exactamente 3 letras y que sean mayúsculas (vía regex)
const codeFormatRule = (v: string) => /^[A-Z]{3}$/.test(v) || "Deben ser exactamente 3 letras mayúsculas";

const nameRules = computed(() => touched.value.name ? [req] : []);
const codeRules = computed(() => touched.value.code ? [req, codeFormatRule] : []);
const descriptionRules = computed(() => touched.value.description ? [req] : []);

const isFormValid = computed(() => {
  return (
    !!form.value.name && 
    /^[A-Z]{3}$/.test(form.value.code) && // El código debe cumplir el patrón
    !!form.value.description
  );
});

/* ---------- Watcher para formateo automático ---------- */
watch(() => form.value.code, (newVal) => {
  if (newVal) {
    // Forzamos mayúsculas y limitamos a 3 caracteres mientras escribe
    form.value.code = newVal.toUpperCase().substring(0, 3).replace(/[^A-Z]/g, '');
  }
});

watch(() => props.company, (c) => {
  if (c) {
    form.value = {
      name: c.name || "",
      code: c.code || "",
      description: c.description || "",
    };
  } else {
    resetForm();
  }
}, { immediate: true });

/* ---------- Acciones ---------- */
const save = async () => {
  Object.keys(touched.value).forEach(k => touched.value[k as keyof typeof touched.value] = true);
  
  if (!isFormValid.value) return;

  try {
    loading.value = true;
    const payload = { ...form.value };

    if (isEdit.value) {
      await companyService.updateCompany(props.company.id, payload);
      showSuccessAlert("Empresa actualizada");
    } else {
      await companyService.createCompany(payload);
      showSuccessAlert("Empresa registrada");
    }

    emit("refresh");
    dialog.value = false;
    resetForm();
  } catch (error: any) {
    showErrorAlert(error.response?.data?.message || "Error al guardar");
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <v-dialog v-model="dialog" max-width="650px">
    <v-card>
      <v-card-title>{{ isEdit ? "Editar empresa" : "Registrar empresa" }}</v-card-title>

      <v-card-text>
        <div class="row">
          <v-text-field 
            v-model="form.name" 
            label="Nombre de la empresa *" 
            :rules="nameRules" 
            @blur="touched.name = true" 
            class="flex-1"
          />
          
          <v-text-field 
            v-model="form.code" 
            label="Código *" 
            placeholder="ABC"
            maxlength="3"
            counter="3"
            :rules="codeRules" 
            @blur="touched.code = true" 
            class="flex-1"
            hint="Exactamente 3 letras (ej. VAD)"
            persistent-hint
          />
        </div>

        <v-textarea 
          v-model="form.description" 
          label="Descripción *" 
          rows="3"
          :rules="descriptionRules" 
          @blur="touched.description = true"
        />
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="dialog = false" :disabled="loading">
          Cancelar
        </v-btn>
        <v-btn 
          color="primary" 
          :loading="loading" 
          :disabled="!isFormValid" 
          @click="save"
        >
          Guardar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.row {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
}
.flex-1 {
  flex: 1;
  min-width: 0;
}
</style>