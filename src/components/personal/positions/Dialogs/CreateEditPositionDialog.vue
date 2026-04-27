<script lang="ts" setup>
import { ref, watch, computed } from "vue";
import { positionService } from "@/app/http/httpServiceProvider";
import { showSuccessAlert, showErrorAlert } from "@/app/services/alertService";

const props = defineProps<{ modelValue: boolean; item: any | null }>();
const emit = defineEmits(["update:modelValue", "refresh"]);

const dialog = ref(false);
watch(() => props.modelValue, (v) => (dialog.value = v), { immediate: true });
watch(dialog, (v) => emit("update:modelValue", v));

const isEdit = computed(() => !!props.item?.id);
const loading = ref(false);

const form = ref({ name: "" });
const touched = ref({ name: false });

const req = (v: any) => !!v || "Obligatorio";
const nameRules = computed(() => (touched.value.name ? [req] : []));
const isFormValid = computed(() => !!form.value.name?.trim());

watch(
  () => props.item,
  (it) => {
    form.value = { name: it?.name || "" };
    touched.value = { name: false };
  },
  { immediate: true }
);

const save = async () => {
  touched.value.name = true;
  if (!isFormValid.value) return;
  try {
    loading.value = true;
    const payload = { name: form.value.name.trim() };
    if (isEdit.value) {
      await positionService.updatePosition(props.item.id, payload);
      showSuccessAlert("Puesto actualizado");
    } else {
      await positionService.createPosition(payload);
      showSuccessAlert("Puesto registrado");
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
  <v-dialog v-model="dialog" max-width="500" persistent>
    <v-card>
      <v-card-title class="pa-4 bg-primary text-white d-flex align-center">
        <v-icon icon="ph-briefcase" class="mr-2" />
        {{ isEdit ? "Editar puesto" : "Registrar puesto" }}
        <v-spacer />
        <v-btn icon="ph-x" variant="text" color="white" @click="dialog = false" :disabled="loading" />
      </v-card-title>

      <v-card-text class="pa-4 pt-5">
        <v-text-field
          v-model="form.name"
          label="Nombre del puesto *"
          :rules="nameRules"
          @blur="touched.name = true"
          variant="outlined"
          density="comfortable"
          autofocus
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
