<script lang="ts" setup>
import { ref, onMounted } from "vue";
import { transferLogService, companyService } from "@/app/http/httpServiceProvider";
import { showSuccessAlert, showErrorAlert } from "@/app/services/alertService";

const props = defineProps<{
  modelValue: boolean;
  bovine: any | null;
}>();

const emit = defineEmits(["update:modelValue", "refresh"]);

const loading = ref(false);
const saving = ref(false);
const companies = ref<any[]>([]);
const formRef = ref(null);

const form = ref({
  idCompanyDestiny: "",
  comments: "",
});

const loadCompanies = async () => {
  try {
    loading.value = true;
    const res = await companyService.getCompanies();
    companies.value = (res.data?.data || []).map((c: any) => ({
      title: `${c.name} (${c.code})`,
      value: c.id,
    }));
  } catch {
    showErrorAlert("Error al cargar las empresas");
  } finally {
    loading.value = false;
  }
};

const handleSave = async () => {
  const { valid } = await (formRef.value as any).validate();
  if (!valid) return;

  try {
    saving.value = true;
    await transferLogService.createTransferLog({
      idBovine: props.bovine.id,
      idCompanyDestiny: form.value.idCompanyDestiny,
      comments: form.value.comments,
    });
    showSuccessAlert("Transferencia registrada correctamente");
    emit("refresh");
    emit("update:modelValue", false);
  } catch (error: any) {
    const msg = error?.response?.data?.message || "Error al registrar la transferencia";
    showErrorAlert(msg);
  } finally {
    saving.value = false;
  }
};

onMounted(loadCompanies);
</script>

<template>
  <v-dialog :model-value="modelValue" @update:model-value="v => emit('update:modelValue', v)" max-width="500px" persistent>
    <v-card class="rounded-lg">
      <v-card-title class="pa-4 bg-deep-purple-darken-1 text-white d-flex align-center">
        <v-icon icon="ph-arrows-left-right" class="mr-3" />
        <div>
          <div class="text-h6 font-weight-bold">Transferir a Otro Rancho</div>
          <div class="text-caption">{{ bovine?.name || bovine?.internalEarTag }}</div>
        </div>
        <v-spacer />
        <v-btn icon="ph-x" variant="text" color="white" @click="emit('update:modelValue', false)" />
      </v-card-title>

      <v-card-text class="pa-6">
        <div v-if="loading" class="text-center py-6">
          <v-progress-circular indeterminate color="deep-purple-darken-1" />
        </div>

        <v-form v-else ref="formRef" @submit.prevent="handleSave">
          <v-select
            v-model="form.idCompanyDestiny"
            :items="companies"
            label="Rancho / Empresa destino *"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="ph-buildings"
            :rules="[v => !!v || 'Selecciona el destino']"
            class="mb-4"
            no-data-text="Sin empresas registradas"
          />

          <v-textarea
            v-model="form.comments"
            label="Comentarios"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="ph-chat-text"
            rows="3"
            placeholder="Motivo de la transferencia, observaciones..."
          />
        </v-form>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" @click="emit('update:modelValue', false)">Cancelar</v-btn>
        <v-btn
          color="deep-purple-darken-1"
          variant="flat"
          :loading="saving"
          :disabled="loading"
          prepend-icon="ph-arrows-left-right"
          @click="handleSave"
        >
          Transferir
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
