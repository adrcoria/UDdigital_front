<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { conceptCategoryService } from "@/app/http/httpServiceProvider";
import { showSuccessAlert, showErrorAlert } from "@/app/services/alertService";

const props = defineProps<{ modelValue: boolean; category: any | null }>();
const emit = defineEmits(["update:modelValue", "refresh"]);

const dialog = computed({
  get: () => props.modelValue,
  set: v => emit("update:modelValue", v),
});

const form = ref({ name: "", description: "" });
const loading = ref(false);


watch(
  () => props.category,
  c => {
    if (c) {
      form.value = {
        name: c.name ?? "",
        description: c.description ?? "",
      };
    } else {
      form.value = { name: "", description: "" };
    }
  },
  { immediate: true }
);

const save = async () => {
  try {
    loading.value = true;
    if (props.category) {
      await conceptCategoryService.updateConceptCategory(props.category.id, form.value);
      showSuccessAlert("Categoría actualizada");
    } else {
      await conceptCategoryService.createConceptCategory(form.value);
      showSuccessAlert("Categoría creada");
    }
    emit("refresh");
    emit("update:modelValue", false);
  } catch {
    showErrorAlert("Error al guardar categoría");
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <v-dialog v-model="dialog" max-width="450px">
    <v-card>
      <v-card-title>{{ props.category ? "Editar categoría" : "Nueva categoría" }}</v-card-title>
      <v-card-text>
        <v-text-field label="Nombre" v-model="form.name" />
        <v-text-field label="Descripción" v-model="form.description" />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="dialog = false">Cancelar</v-btn>
        <v-btn color="primary" :loading="loading" @click="save">Guardar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
