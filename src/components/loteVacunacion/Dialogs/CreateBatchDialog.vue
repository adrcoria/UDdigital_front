<script lang="ts" setup>
import { ref, watch } from "vue";
import { batchService } from "@/app/http/httpServiceProvider";
import { showSuccessAlert, showErrorAlert } from "@/app/services/alertService";

const props = defineProps<{
  modelValue: boolean;
  batchTypeId: string;
}>();

const emit = defineEmits(["update:modelValue", "refresh"]);
const loading = ref(false);
const formRef = ref(null);
const form = ref({ name: "" });

const save = async () => {
  const { valid } = await (formRef.value as any).validate();
  if (!valid) return;

  try {
    loading.value = true;
    await batchService.createBatch({
      name: form.value.name.toUpperCase(),
      idBatchType: props.batchTypeId,
      idBovines: [],
    });
    showSuccessAlert("Campaña de vacunación creada correctamente");
    emit("refresh");
    emit("update:modelValue", false);
  } catch {
    showErrorAlert("Error al crear la campaña");
  } finally {
    loading.value = false;
  }
};

watch(() => props.modelValue, (val) => { if (val) form.value.name = ""; });
</script>

<template>
  <v-dialog v-model="props.modelValue" max-width="450px" persistent>
    <v-card class="rounded-lg">
      <v-card-title class="pa-4 bg-teal-darken-1 text-white d-flex align-center">
        <v-icon icon="ph-syringe" class="mr-3" />
        <span class="text-h6 font-weight-bold">Nueva Campaña de Vacunación</span>
      </v-card-title>
      <v-card-text class="pa-6">
        <v-form ref="formRef" @submit.prevent="save">
          <v-text-field
            v-model="form.name"
            label="Nombre de la Campaña *"
            variant="outlined"
            density="comfortable"
            :rules="[v => !!v || 'Requerido']"
            prepend-inner-icon="ph-pencil"
            class="text-uppercase"
          />
        </v-form>
      </v-card-text>
      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" @click="emit('update:modelValue', false)">Cancelar</v-btn>
        <v-btn color="teal-darken-1" variant="flat" :loading="loading" @click="save">Guardar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
