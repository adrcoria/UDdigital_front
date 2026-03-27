<script lang="ts" setup>
import { ref, computed } from "vue";
import { bovineService } from "@/app/http/httpServiceProvider";
import { showSuccessAlert, showErrorAlert } from "@/app/services/alertService";

const props = defineProps<{ modelValue: boolean; bovine: any | null }>();
const emit = defineEmits(["update:modelValue", "refresh"]);

const formRef = ref<any>(null);
const saving = ref(false);

const changeInternal = ref(false);
const changeSiniiga = ref(false);

const form = ref({
  newInternalEarTag: "",
  newSiniigaEarTag: ""
});

const rules = {
  required: (v: any) => !!v || "Campo obligatorio",
  exact12: (v: any) => /^\d{12}$/.test(v) || "Debe tener exactamente 12 dígitos"
};

const noneSelected = computed(() => !changeInternal.value && !changeSiniiga.value);

const save = async () => {
  if (noneSelected.value) return showErrorAlert("Selecciona al menos un arete a cambiar");

  const { valid } = await formRef.value.validate();
  if (!valid) return;

  try {
    saving.value = true;

    const calls: Promise<any>[] = [];

    if (changeInternal.value) {
      calls.push(bovineService.deprecateInternalEarTag({
        internalEarTag: props.bovine.internalEarTag,
        newInternalEarTag: form.value.newInternalEarTag
      }));
    }

    if (changeSiniiga.value) {
      calls.push(bovineService.deprecateSiniigaEarTag({
        siniigaEarTag: props.bovine.siniigaEarTag,
        newSiniigaEarTag: form.value.newSiniigaEarTag
      }));
    }

    const results = await Promise.allSettled(calls);

    const anySuccess = results.some(r => r.status === "fulfilled");
    const failures = results.filter(r => r.status === "rejected") as PromiseRejectedResult[];

    if (anySuccess) {
      if (failures.length > 0) {
        const msg = failures[0].reason?.response?.data?.message;
        showErrorAlert(`Un arete no pudo actualizarse: ${Array.isArray(msg) ? msg[0] : msg || "error desconocido"}`);
      } else {
        showSuccessAlert("Arete(s) actualizado(s) correctamente");
      }
      emit("refresh");
      emit("update:modelValue", false);
    } else {
      const msg = failures[0].reason?.response?.data?.message;
      showErrorAlert(Array.isArray(msg) ? msg[0] : msg || "Error al cambiar el arete");
    }
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <v-dialog :model-value="modelValue" max-width="520" persistent @update:model-value="emit('update:modelValue', $event)">
    <v-card class="rounded-xl">
      <v-card-title class="pa-4 bg-primary text-white d-flex align-center">
        <v-icon class="mr-2">ph-tag</v-icon>
        <span class="text-h6 font-weight-bold">Cambio de Arete</span>
        <v-spacer />
        <v-btn icon="ph-x" variant="text" color="white" @click="emit('update:modelValue', false)" />
      </v-card-title>

      <v-card-text class="pa-6">
        <v-form ref="formRef">

          <!-- Selector de aretes -->
          <div class="text-caption font-weight-bold text-grey-darken-1 mb-3">¿QUÉ ARETE DESEA CAMBIAR?</div>
          <v-row dense class="mb-4">
            <v-col cols="6">
              <v-card
                :color="changeInternal ? 'primary' : undefined"
                :variant="changeInternal ? 'flat' : 'outlined'"
                class="pa-3 cursor-pointer rounded-lg"
                @click="changeInternal = !changeInternal"
              >
                <div class="d-flex align-center">
                  <v-icon :color="changeInternal ? 'white' : 'grey'" class="mr-2">ph-tag</v-icon>
                  <div>
                    <div :class="changeInternal ? 'text-white' : 'text-grey-darken-2'" class="text-caption font-weight-bold">ARETE INTERNO</div>
                    <div :class="changeInternal ? 'text-white' : 'text-body-2 font-weight-bold'">{{ bovine?.internalEarTag || 'N/A' }}</div>
                  </div>
                </div>
              </v-card>
            </v-col>
            <v-col cols="6">
              <v-card
                :color="changeSiniiga ? 'primary' : undefined"
                :variant="changeSiniiga ? 'flat' : 'outlined'"
                class="pa-3 cursor-pointer rounded-lg"
                @click="changeSiniiga = !changeSiniiga"
              >
                <div class="d-flex align-center">
                  <v-icon :color="changeSiniiga ? 'white' : 'grey'" class="mr-2">ph-tag</v-icon>
                  <div>
                    <div :class="changeSiniiga ? 'text-white' : 'text-grey-darken-2'" class="text-caption font-weight-bold">ARETE SINIIGA</div>
                    <div :class="changeSiniiga ? 'text-white' : 'text-body-2 font-weight-bold'">{{ bovine?.siniigaEarTag || 'N/A' }}</div>
                  </div>
                </div>
              </v-card>
            </v-col>
          </v-row>

          <!-- Campos según selección -->
          <v-text-field
            v-if="changeInternal"
            v-model="form.newInternalEarTag"
            label="Nuevo Arete Interno *"
            variant="outlined"
            :rules="[rules.required, rules.exact12]"
            maxlength="12"
            class="mb-2"
          />

          <v-text-field
            v-if="changeSiniiga"
            v-model="form.newSiniigaEarTag"
            label="Nuevo Arete Siniiga *"
            variant="outlined"
            :rules="[rules.required, rules.exact12]"
            maxlength="12"
          />

        </v-form>
      </v-card-text>

      <v-divider />
      <v-card-actions class="pa-4 bg-grey-lighten-4">
        <v-spacer />
        <v-btn variant="text" @click="emit('update:modelValue', false)">Cancelar</v-btn>
        <v-btn color="primary" variant="flat" class="px-6" :loading="saving" :disabled="noneSelected" @click="save">
          Guardar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.cursor-pointer { cursor: pointer; }
</style>
