<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { liveStockService } from "@/app/http/httpServiceProvider";
import { showSuccessAlert, showErrorAlert } from "@/app/services/alertService";

const props = defineProps<{
  modelValue: boolean;
  item: any | null;
  catalog: string;
}>();

const emit = defineEmits(["refresh", "update:modelValue"]);

const dialog = ref(false);
const loading = ref(false);

const form = ref({
  name: "",
  phone: ""
});

const touched = ref({
  name: false,
  phone: false
});

const req = (v: any) => !!v || "Obligatorio";

const nameRules = computed(() =>
  touched.value.name ? [req] : []
);

const phoneRules = computed(() =>
  props.catalog === "livestock-owner" && touched.value.phone ? [req] : []
);

watch(
  () => props.modelValue,
  (v) => {
    dialog.value = v;

    if (v && props.item) {
      form.value = {
        name: props.item.name,
        phone: props.item.phone || ""
      };
    } else if (v) {
      form.value = { name: "", phone: "" };
      touched.value = { name: false, phone: false };
    }
  },
  { immediate: true }
);

watch(dialog, (v) => emit("update:modelValue", v));

const isFormValid = computed(() => {
  if (props.catalog === "livestock-owner") {
    return !!form.value.name && !!form.value.phone;
  }
  return !!form.value.name;
});

const save = async () => {
  touched.value.name = true;
  if (props.catalog === "livestock-owner") {
    touched.value.phone = true;
  }

  if (!isFormValid.value) return;

  try {
    loading.value = true;

    const payload: any = {
      name: form.value.name.toUpperCase()
    };

    if (props.catalog === "livestock-owner") {
      payload.phone = form.value.phone;
    }

    if (props.item?.id) {
      await liveStockService.updateItem(props.catalog, props.item.id, payload);
      showSuccessAlert("Actualizado");
    } else {
      await liveStockService.createItem(props.catalog, payload);
      showSuccessAlert("Guardado");
    }

    emit("refresh");
    dialog.value = false;
  } catch {
    showErrorAlert("Error al guardar");
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <v-dialog v-model="dialog" max-width="450px">
    <v-card>
      <v-card-title class="pa-4 text-h6 font-weight-bold">
        {{ props.item ? "Editar Registro" : "Registrar Registro" }}
      </v-card-title>

      <v-card-text>

        <v-text-field
          label="Nombre *"
          v-model="form.name"
          :rules="nameRules"
          @blur="touched.name = true"
          variant="outlined"
          density="comfortable"
          clearable
          class="text-uppercase"
        />

        <v-text-field
          v-if="catalog === 'livestock-owner'"
          label="Teléfono *"
          v-model="form.phone"
          :rules="phoneRules"
          @blur="touched.phone = true"
          variant="outlined"
          density="comfortable"
          clearable
          class="text-uppercase mt-2"
        />

      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" @click="dialog = false">
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
:deep(.v-field__input),
:deep(.v-field__input input) {
  text-transform: uppercase !important;
}

.text-uppercase {
  text-transform: uppercase;
}
</style>
