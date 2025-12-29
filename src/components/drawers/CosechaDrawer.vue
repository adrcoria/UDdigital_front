<template>
  <v-navigation-drawer
    v-model="internalDrawer"
    temporary
    width="400"
    :location="isRtl ? 'start' : 'end'"
    class="right-sidebar-drawer"
  >
    <div class="d-flex align-center pa-3 right-sidebar-header justify-space-between" style="background-color: #3862eb;">
      <div>
        <h3 class="mb-1 text-white">Dictaminar Cosecha</h3>
        <p class="text-white mb-0 right-sidebar-subtitle">
          Revisa y dictamina la orden de trabajo de cosecha.
        </p>
      </div>
      <v-btn icon variant="plain" class="text-white" @click.stop="close">
        <i class="ph ph-x ph-lg"></i>
      </v-btn>
    </div>
    <v-divider />
    <div class="pa-5 right-sidebar-content" data-simplebar>
      <v-form ref="formRef" lazy-validation>
        <v-card-text data-simplebar>
          <v-row>
            <v-col cols="12">
              <v-radio-group
                v-model="formDictamen.tipoDictamen"
                :rules="[v => !!v || 'Debes seleccionar una opción']"
                label="¿Deseas Aprobar o Rechazar?"
                density="compact"
                class="mb-2 custom-label"
              >
                <v-radio label="🟢 Aprobar" value="APROBADO" />
                <v-radio label="🔴 Rechazar" value="RECHAZADO" />
              </v-radio-group>
            </v-col>

            <template v-if="formDictamen.tipoDictamen === 'APROBADO'">
              <v-col cols="12">
                <v-text-field
                  label="Precio unitario"
                  v-model.number="form.priceUnit"
                  type="number"
                  variant="outlined"
                  density="compact"
                  :rules="numberRules"
                  class="mb-2 custom-label"
                  prefix="$"
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  label="Volumen cosechado"
                  v-model.number="form.salvageValueHarvest"
                  type="number"
                  variant="outlined"
                  density="compact"
                  :rules="numberRules"
                  class="mb-2 custom-label"
                  prefix="$"
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  label="Monto a pagar"
                  v-model.number="form.amountToPaid"
                  type="number"
                  variant="outlined"
                  density="compact"
                  :rules="numberRules"
                  class="mb-2 custom-label"
                  prefix="$"
                />
              </v-col>
            </template>

            <v-col cols="12" v-if="formDictamen.tipoDictamen">
              <v-textarea
                label="Comentarios"
                v-model="form.comments"
                variant="outlined"
                density="compact"
                :rules="[v => !!v || 'El comentario es requerido']"
                class="mb-2 custom-label"
                rows="3"
              />
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions class="d-flex justify-end px-5 pb-3">
          <v-btn
            color="success"
            v-if="formDictamen.tipoDictamen === 'APROBADO'"
            @click="submitAprobar"
            :loading="loading"
          >
            Aprobar
          </v-btn>
          <v-btn
            color="error"
            v-if="formDictamen.tipoDictamen === 'RECHAZADO'"
            @click="submitRechazar"
            :loading="loading"
          >
            Rechazar
          </v-btn>
          <v-btn class="ms-2" @click="close" :disabled="loading">
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-form>
    </div>
  </v-navigation-drawer>
</template>

<script lang="ts" setup>
import { ref, reactive, watch } from 'vue';

const props = defineProps<{ visible: boolean; cosecha: any }>();
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'submit-aprobar-cosecha', payload: { comments: string; priceUnit: number; salvageValueHarvest: number; amountToPaid: number }, uuid: string): void;
  (e: 'submit-rechazar-cosecha', payload: { comments: string }, uuid: string): void;
}>();

const internalDrawer = ref(props.visible);
const loading = ref(false);
const formRef = ref<any>(null);
const isRtl = ref(false);

const form = reactive({
  comments: '',
  priceUnit: props.cosecha.price_unit ?? null as number | null,
  salvageValueHarvest: props.cosecha.salvage_value_harvest ?? null as number | null,
  amountToPaid: null as number | null,
});
const formDictamen = reactive({ tipoDictamen: '' });

const numberRules = [
  (v: number) => v !== null && v !== undefined || 'Requerido',
  (v: number) => !isNaN(v) || 'Debe ser un número válido',
  (v: number) => v >= 0 || 'No puede ser negativo',
];

const submitAprobar = async () => {
  const valid = await formRef.value.validate();
  if (!valid) return;
  loading.value = true;
  emit('submit-aprobar-cosecha', {
    comments: form.comments,
    priceUnit: form.priceUnit!,
    salvageValueHarvest: form.salvageValueHarvest!,
    amountToPaid: form.amountToPaid!,
  }, props.cosecha.uuid);
  loading.value = false;
};

const submitRechazar = async () => {
  const valid = await formRef.value.validate();
  if (!valid) return;
  loading.value = true;
  emit('submit-rechazar-cosecha', { comments: form.comments }, props.cosecha.uuid);
  loading.value = false;
};

function close() {
  internalDrawer.value = false;
}

watch(() => props.visible, val => internalDrawer.value = val);
watch(internalDrawer, val => emit('update:visible', val));
</script>

<style scoped>
::v-deep .custom-label:not(.v-text-field--is-focused) .v-label {
  color: #9e9e9e !important;
  font-size: 12px !important;
}

::v-deep(.v-text-field input[readonly]) {
  background-color: #f5f5f5 !important;
  color: #9e9e9e !important;
  pointer-events: none;
  cursor: not-allowed;
  font-weight: bold;
}

::v-deep(.v-text-field--readonly .v-field__overlay) {
  background-color: transparent !important;
}
</style>
