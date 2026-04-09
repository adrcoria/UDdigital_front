<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { inventoryService } from "@/app/http/httpServiceProvider";
import { showSuccessAlert, showErrorAlert } from "@/app/services/alertService";

const props = defineProps<{
  modelValue: boolean;
  item: any | null;
  type: "add" | "subtract";
}>();

const emit = defineEmits(["update:modelValue", "refresh"]);

const dialog = ref(false);
const loading = ref(false);
const formRef = ref(null);

const form = ref({
  units: null as number | null,
  purpose: "",
});

const rules = {
  required: (v: any) => !!v || "Este campo es obligatorio",
  positive: (v: any) => Number(v) > 0 || "Debe ser mayor a 0",
};

const title = computed(() => props.type === "add" ? "Entrada de Existencias" : "Salida de Existencias");
const color = computed(() => props.type === "add" ? "success" : "error");
const icon = computed(() => props.type === "add" ? "ph-arrow-circle-down" : "ph-arrow-circle-up");

watch(() => props.modelValue, (val) => {
  dialog.value = val;
  if (val) {
    form.value = { units: null, purpose: "" };
  }
}, { immediate: true });

watch(dialog, (v) => emit("update:modelValue", v));

const save = async () => {
  const { valid } = await (formRef.value as any).validate();
  if (!valid) return;

  try {
    loading.value = true;
    await inventoryService.adjustInventory(props.item.id, {
      units: Number(form.value.units),
      type: props.type,
      purpose: form.value.purpose,
    });
    showSuccessAlert(props.type === "add" ? "Entrada registrada" : "Salida registrada");
    emit("refresh");
    dialog.value = false;
  } catch {
    showErrorAlert("Error al registrar el movimiento");
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <v-dialog v-model="dialog" max-width="480px" persistent>
    <v-card>
      <v-card-title class="pa-4 text-h6 font-weight-bold bg-grey-lighten-4 d-flex align-center gap-2">
        <i :class="`${icon} ph-lg`" />
        {{ title }}
      </v-card-title>

      <v-card-text class="pt-4">
        <div class="text-body-2 text-medium-emphasis mb-4">
          Producto: <strong>{{ item?.product?.name }}</strong> &nbsp;|&nbsp;
          Existencias actuales:
          <v-chip size="x-small" :color="color" variant="flat" label class="font-weight-black ml-1">
            {{ item?.units ?? 0 }}
          </v-chip>
        </div>

        <v-form ref="formRef">
          <v-text-field
            label="Cantidad *"
            v-model.number="form.units"
            type="number"
            :rules="[rules.required, rules.positive]"
            variant="outlined"
            density="comfortable"
            :color="color"
            min="1"
          />

          <v-textarea
            label="Motivo / Propósito *"
            v-model="form.purpose"
            :rules="[rules.required]"
            variant="outlined"
            density="comfortable"
            rows="3"
            class="mt-3"
          />
        </v-form>
      </v-card-text>

      <v-divider />
      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="plain" @click="dialog = false">Cancelar</v-btn>
        <v-btn :color="color" variant="flat" :loading="loading" @click="save">
          {{ type === "add" ? "Registrar Entrada" : "Registrar Salida" }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
