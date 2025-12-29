<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { conceptService } from "@/app/http/httpServiceProvider";
import { showSuccessAlert, showErrorAlert } from "@/app/services/alertService";

const props = defineProps<{
  modelValue: boolean;
  concept: any | null;
  categoryId: string;
}>();

const emit = defineEmits(["update:modelValue", "refresh"]);

const dialog = computed({
  get: () => props.modelValue,
  set: v => emit("update:modelValue", v),
});

const form = ref({
  name: "",
  description: "",
  type: "gasto" as "ingreso" | "gasto",
});

const loading = ref(false);

watch(
  () => props.concept,
  c => {
    if (c) {
      form.value = {
        name: c.name,
        description: c.description,
        type: c.polarity === 1 ? "ingreso" : "gasto",
      };
    } else {
      form.value = { name: "", description: "", type: "gasto" };
    }
  },
  { immediate: true }
);

const save = async () => {
  if (!props.categoryId) {
    showErrorAlert("Debes seleccionar una categoría antes de crear un concepto.");
    return;
  }

  try {
    loading.value = true;

    const payload = {
      name: form.value.name,
      description: form.value.description,
      polarity: form.value.type === "ingreso" ? 1 : -1,
      idConceptCategory: props.categoryId,
    };

    if (props.concept) {
      await conceptService.updateConcept(props.concept.id, payload);
      showSuccessAlert("Concepto actualizado");
    } else {
      await conceptService.createConcept(payload);
      showSuccessAlert("Concepto creado");
    }

    emit("refresh");
    emit("update:modelValue", false);
  } catch {
    showErrorAlert("Error al guardar concepto");
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <v-dialog v-model="dialog" max-width="450px">
    <v-card>
      <v-card-title>
        {{ props.concept ? "Editar concepto" : "Nuevo concepto" }}
      </v-card-title>

      <v-card-text>
        <v-text-field label="Nombre" v-model="form.name" />
        <v-text-field label="Descripción" v-model="form.description" />

        <v-select
          label="Tipo"
          :items="[
            { title: 'Ingreso', value: 'ingreso' },
            { title: 'Gasto', value: 'gasto' }
          ]"
          v-model="form.type"
        />
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="dialog = false">Cancelar</v-btn>
        <v-btn color="primary" :loading="loading" @click="save">Guardar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
