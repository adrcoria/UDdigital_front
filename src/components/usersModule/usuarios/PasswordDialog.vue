<script setup lang="ts">
import { computed } from "vue";

const emit = defineEmits(["update:modelValue", "onConfirm"]);
const prop = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  width: {
    type: Number,
    default: 550,
  },
  userId: {
    type: String,
    required: true,
  },
});

const dialogValue = computed({
  get: () => prop.modelValue,
  set: (val: boolean) => emit("update:modelValue", val),
});

const confirmReset = () => {
  emit("onConfirm", {
    userId: prop.userId,
    password: "T12345678w",
  });
  dialogValue.value = false;
};
</script>

<template>
  <v-dialog :width="width" v-model="dialogValue">
    <v-card>
      <v-card-title> Restablecer contraseña </v-card-title>
      <v-btn variant="text" class="confirm-close-icon" icon="ph-x" @click="dialogValue = false" />

      <v-card-text class="text-center ma-md-5">
        <div class="text-warning">
          <i class="ph ph-lock-key ph-4x" />
        </div>
        <div class="mt-4">
          <h4 class="text-h6 font-weight-bold">
            Confirmación requerida
          </h4>
          <p class="text-muted mx-4 mb-0 text-subtitle-1">
            ¿Deseas restablecer la contraseña del usuario?<br />
            Se asignará la contraseña predeterminada:
            <strong class="text-primary">"T12345678w"</strong>
          </p>
        </div>
      </v-card-text>

      <v-card-actions class="d-flex justify-center mt-4 mb-7">
        <v-btn @click="dialogValue = false" class="me-2" flat variant="tonal">
          Cancelar
        </v-btn>
        <v-btn color="primary" flat variant="elevated" @click="confirmReset">
          Sí, restablecer
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
