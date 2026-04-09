<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { ranchersService } from "@/app/http/httpServiceProvider";
import { showSuccessAlert, showErrorAlert } from "@/app/services/alertService";

const props = defineProps<{ modelValue: boolean; rancher: any | null }>();
const emit = defineEmits(["refresh", "update:modelValue"]);

const dialog = ref(false);
watch(() => props.modelValue, v => (dialog.value = v), { immediate: true });
watch(dialog, v => emit("update:modelValue", v));

const form = ref({ name: "" });
const touched = ref({ name: false });
const loading = ref(false);

const isEdit = computed(() => !!props.rancher?.id);

const resetForm = () => {
  form.value = { name: "" };
  touched.value = { name: false };
};

watch(() => props.rancher, (r) => {
  if (r) {
    form.value = { name: r.name || "" };
  } else {
    resetForm();
  }
}, { immediate: true });

const req = (v: any) => !!v?.trim() || "Obligatorio";
const nameRules = computed(() => touched.value.name ? [req] : []);

const isFormValid = computed(() => !!form.value.name?.trim());

const save = async () => {
  touched.value.name = true;
  if (!isFormValid.value) return;

  try {
    loading.value = true;
    const payload = { name: form.value.name.trim() };

    if (isEdit.value) {
      await ranchersService.updateRancher(props.rancher.id, payload);
      showSuccessAlert("Ranchero actualizado");
    } else {
      await ranchersService.createRancher(payload);
      showSuccessAlert("Ranchero registrado");
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
  <v-dialog v-model="dialog" max-width="500px" persistent>
    <v-card>
      <v-card-title class="pa-4 font-weight-bold">
        {{ isEdit ? "Editar ranchero" : "Registrar ranchero" }}
      </v-card-title>

      <v-card-text>
        <v-text-field
          v-model="form.name"
          label="Nombre *"
          :rules="nameRules"
          @blur="touched.name = true"
          variant="filled"
        />
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" @click="dialog = false">Cancelar</v-btn>
        <v-btn color="primary" :loading="loading" :disabled="!isFormValid" @click="save" variant="elevated">
          Guardar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
