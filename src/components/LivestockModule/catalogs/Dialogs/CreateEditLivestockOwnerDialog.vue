<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { liveStockService, companyService } from "@/app/http/httpServiceProvider";
import { showSuccessAlert, showErrorAlert } from "@/app/services/alertService";

const props = defineProps<{ modelValue: boolean; item: any | null }>();
const emit = defineEmits(["refresh", "update:modelValue"]);

const dialog = ref(false);
const loading = ref(false);
const loadingCompanies = ref(false);

const companies = ref<any[]>([]);
const form = ref({
  firstName: "",
  lastName: "",
  companyId: "",
});

const req = (v: any) => !!v || "Obligatorio";

const loadCompanies = async () => {
  try {
    loadingCompanies.value = true;
    const res = await companyService.getCompanies();
    companies.value = res.data.data;
  } catch (error) {
    showErrorAlert("No se pudieron cargar las empresas");
  } finally {
    loadingCompanies.value = false;
  }
};

watch(() => props.modelValue, (v) => {
  dialog.value = v;
  if (v) {
    loadCompanies();
    if (props.item) {
      form.value = {
        firstName: props.item.firstName || "",
        lastName: props.item.lastName || "",
        companyId: props.item.company?.id || ""
      };
    } else {
      form.value = { firstName: "", lastName: "", companyId: "" };
    }
  }
}, { immediate: true });

watch(dialog, (v) => emit("update:modelValue", v));

const isFormValid = computed(() => !!form.value.firstName && !!form.value.companyId);

const save = async () => {
  if (!isFormValid.value) return;

  try {
    loading.value = true;
    const payload = { ...form.value };
    let response;

    if (props.item?.id) {
      response = await liveStockService.updateItem('livestock-owner', props.item.id, payload);
    } else {
      response = await liveStockService.createItem('livestock-owner', payload);
    }

    // ANALIZAMOS LA RESPUESTA (Aunque sea éxito HTTP 200)
    const resData = response.data || {};

    // Si el backend manda un statusCode de error o un mensaje de restricción
    if (resData.statusCode >= 400 || (resData.message && resData.message.toLowerCase().includes('associated'))) {
      handleCustomError(resData);
      return;
    }

    showSuccessAlert(props.item?.id ? "Propietario actualizado" : "Propietario registrado");
    emit("refresh");
    dialog.value = false;

  } catch (error: any) {
    // Si Axios detecta error de red (400, 409, 500)
    const errorData = error.response?.data || {};
    handleCustomError(errorData);
  } finally {
    loading.value = false;
  }
};

// Función para centralizar el mensaje de error que solicitaste
const handleCustomError = (errorSource: any) => {
  console.log("Error detectado en respuesta:", errorSource);
  const status = errorSource.statusCode || errorSource.status;

  if (status === 400) {
    showErrorAlert("No es posible actualizar este registro, se encontraron registros asociados");
  } else {
    showErrorAlert(msg || "Error al procesar la solicitud");
  }
};

</script>

<template>
  <v-dialog v-model="dialog" max-width="550px">
    <v-card>
      <v-card-title class="pa-4">
        {{ item ? 'Editar' : 'Nuevo' }} Propietario
      </v-card-title>

      <v-card-text>
        <v-row dense>
          <v-col cols="12" sm="6">
            <v-text-field label="Nombre(s) *" v-model="form.firstName" :rules="[req]" variant="outlined" />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field label="Apellidos" v-model="form.lastName" variant="outlined" />
          </v-col>
          <v-col cols="12">
            <v-autocomplete label="Empresa *" v-model="form.companyId" :items="companies" item-title="name"
              item-value="id" :loading="loadingCompanies" :rules="[req]" variant="outlined" clearable />
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" @click="dialog = false">Cancelar</v-btn>
        <v-btn color="primary" :loading="loading" :disabled="!isFormValid" @click="save">
          Guardar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>