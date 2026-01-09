<script setup lang="ts">
import { ref, watch, computed, onMounted } from "vue";
import { conceptCategoryService } from "@/app/http/httpServiceProvider";
import { showSuccessAlert, showErrorAlert } from "@/app/services/alertService";



const props = defineProps<{
  modelValue: boolean;
  category: any | null;
  accountId: string;
}>();

const emit = defineEmits(["update:modelValue", "refresh"]);

const dialog = computed({
  get: () => props.modelValue,
  set: v => emit("update:modelValue", v),
});

const form = ref({ name: "", description: "" });
const loading = ref(false);
const resetForm = () => {
  form.value = {
    name: "",
    description: "",
  };
};
onMounted(() => {

});

watch(
  () => props.category,
  (c) => {
    if (c) {
      // EDITAR
      form.value = {
        name: c.name ?? "",
        description: c.description ?? "",
      };
    } else {
      // NUEVA
      resetForm();
    }
  },
  { immediate: true }
);

watch(
  () => props.modelValue,
  (open) => {
    if (!open) {
      resetForm();
    }
  }
);

const save = async () => {
  try {
    loading.value = true;

    if (props.category) {
      await conceptCategoryService.updateConceptCategory(
        props.category.id,
        form.value
      );
      showSuccessAlert("Categoría actualizada");
    } else {
      const requestData = {
        ...form.value,
        accountId: props.accountId,
      };
      await conceptCategoryService.createConceptCategory(requestData);
      showSuccessAlert("Categoría creada");
    }

    // 🔥 ORDEN CORRECTO
    emit("update:modelValue", false);

    // ⏱️ deja que Vue cierre el dialog
    setTimeout(() => {
      emit("refresh", props.accountId);
    }, 0);

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
