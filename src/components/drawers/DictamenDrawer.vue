<template>
  <v-navigation-drawer v-model="internalDrawer" temporary width="400" :location="isRtl ? 'start' : 'end'"
    class="right-sidebar-drawer">
    <div class="d-flex align-center pa-3 right-sidebar-header justify-space-between" style="background-color: #3862eb;">
      <div>
        <h3 class="mb-1 text-white">Dictamina la suscripción</h3>
        <p class="text-white mb-0 right-sidebar-subtitle">
          Revisa la información y complementa los datos.
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
          <v-alert v-if="alertaSuperficie" type="warning" variant="tonal" class="mb-4" title="Advertencia"
            :text="isPecuario 
  ? 'El número de cabezas a asegurar es mayor que las cabezas solicitadas.' 
  : 'La superficie a asegurar es mayor que la superficie solicitada.'" density="compact" />

          <v-row>
            <v-col cols="12">
              <v-text-field label="Folio de constancia" v-model="form.insurance_certificate_number" variant="outlined"
                density="compact" :rules="[...requiredRule]" class="mb-2 custom-label" />
            </v-col>
            <v-col cols="12">
              <v-text-field :label="isPecuario ? 'Cabezas solicitadas' : 'Superficie solicitada'" v-model="surfaceSecuredSolicitada" variant="outlined"
                density="compact" :rules="requiredRule" readonly class="mb-2 custom-label" />
            </v-col>

            <v-col cols="12">
              <v-text-field :label="isPecuario ? '¡Cabezas a asegurar!' : '¡Superficie a asegurar!'" v-model="form.surfaceSecured" variant="outlined"
                density="compact" :rules="[
                  ...requiredRule,
                  (v) => Number(v) <= surfaceSecuredSolicitada ? true : `No puede exceder la superficie solicitada (${surfaceSecuredSolicitada})`
                ]" class="mb-2 custom-label" />
            </v-col>



            <v-col cols="12">
              <v-text-field label="Suma asegurada por unidad" readonly type="number"
                v-model="form.single_amount_secured" variant="outlined" density="compact" :rules="requiredRule"
                class="mb-2 custom-label" />
            </v-col>

            <v-col cols="12">
              <v-text-field label="Monto asegurado total" readonly v-model="form.total_amount_secured"
                variant="outlined" density="compact" :rules="requiredRule" class="mb-2 custom-label" />
            </v-col>

            <v-col cols="12">
              <v-text-field label="Prima por unidad" readonly v-model="form.single_prima_amount" variant="outlined"
                density="compact" :rules="requiredRule" class="mb-2 custom-label" />
            </v-col>

            <v-col cols="12">
              <v-text-field label="Prima total" readonly v-model="form.total_prima_amount" variant="outlined"
                density="compact" :rules="requiredRule" class="mb-2 custom-label" />
            </v-col>

            <!-- RADIO BUTTONS -->
            <v-col cols="12">
              <v-radio-group v-model="formDictamen.tipoDictamen" :rules="[v => !!v || 'Debes seleccionar una opción']"
                label="¿En base a la información previamente recabada ACEPTA o RECHAZA la solicitud?"
                class="mb-2 custom-label" density="compact">
                <v-radio label="Aceptar solicitud" value="ACEPTADO" />
                <v-radio label="Rechazar solicitud" value="RECHAZADO" />
              </v-radio-group>
            </v-col>

            <!-- Comentarios (si eligió algo) -->
            <v-col cols="12" v-if="formDictamen.tipoDictamen">
              <v-textarea label="Comentarios" v-model="form.comments" variant="outlined" density="compact"
                class="mb-2 custom-label" :rules="[v => !!v || 'Comentarios requeridos']" />
            </v-col>

            <!-- Motivo (solo si RECHAZA) -->
            <v-col cols="12" v-if="formDictamen.tipoDictamen === 'RECHAZADO'">
              <v-select v-model="formRechazo.delete_motives" :loading="loadMotives" :items="motives" item-text="title"
                item-value="value" :rules="requiredOnlyRule" label="Seleccione motivo de rechazo" variant="outlined"
                density="compact" class="mb-2 custom-label" />
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions class="d-flex justify-end px-5 pb-3">
          <v-btn color="primary" @click="formDictamen.tipoDictamen === 'ACEPTADO' ? submit() : submitRechazo()"
            :loading="loading">
            Enviar Dictamen
          </v-btn>
        </v-card-actions>
      </v-form>
    </div>
  </v-navigation-drawer>
</template>

<script lang="ts" setup>
import { ref, watch, defineProps, defineEmits, reactive, computed, onMounted } from "vue";
import { suscriptionService } from "@/app/http/httpServiceProvider";

const loadMotives = ref(false);
const motives = ref<any[]>([]);

const props = defineProps<{
  visible: boolean;
  subscription: any;
}>();

const emits = defineEmits<{
  (e: "update:visible", value: boolean): void;
  (e: "submit-dictamen", formData: any): void;
  (e: "submit-rechazo", payload: any): void;
}>();

const isRtl = ref(false);
const internalDrawer = ref(props.visible);
const loading = ref(false);
const alertaSuperficie = ref(false);

const isPecuario = computed(() =>
  props.subscription?.subscription_type?.name?.toLowerCase().includes("pecuario")
);

watch(() => props.visible, (newVal) => {
  internalDrawer.value = newVal;
  if (!newVal) resetForm();
});

watch(internalDrawer, (newVal) => {
  emits("update:visible", newVal);
});

const requiredRule = [
  (v: any) =>
    (v !== null && v !== undefined && v !== "" && !isNaN(Number(v))) ||
    "Este campo es requerido y solo se aceptan números",
];

const requiredOnlyRule = [
  (v: any) => !!v || "Este campo es requerido"
];

const folioLengthRule = [
  (v: string) =>
    v.replace(/[^0-9]/g, "").length === 9 ||
    "El folio debe tener exactamente 9 dígitos",
];


const surfaceLimitRule = [
  (v: any) => {
    if (v === null || v === '' || isNaN(Number(v))) return 'Campo requerido y debe ser numérico';
    if (Number(v) > surfaceSecuredSolicitada.value) return 'No puede exceder la superficie solicitada';
    return true;
  }
];

const form = reactive({
  insurance_certificate_number: "",
  single_amount_secured: null as number | null,
  surfaceSecured: null as number | null,
  total_amount_secured: null as number | null,
  single_prima_amount: null as number | null,
  total_prima_amount: null as number | null,
  comments: "",
});

const formDictamen = reactive({
  tipoDictamen: "", // ACEPTADO o RECHAZADO
});

const formRechazo = reactive({
  delete_motives: "",
});

const formRef = ref();

const surfaceSecured = computed(() => {
  const detail = props.subscription?.subscription_detail;
  return Number(detail?.surface_secured || detail?.heads_secured || 0);
});

const surfaceSecuredSolicitada = computed(() => {
  const detail = props.subscription?.subscription_detail;
  return Number(detail?.surface_requested || detail?.heads_requested || 0);
});

watch(
  () => form.surfaceSecured,
  (nuevaSuperficie) => {
    const solicitada = surfaceSecuredSolicitada.value;
    alertaSuperficie.value = nuevaSuperficie !== null && nuevaSuperficie > solicitada;
  }
);

watch(
  () => props.subscription,
  (val) => {
    if (val) {
      form.insurance_certificate_number = val.insurance_certificate_number || "";
      form.single_amount_secured = val.single_amount_secured
        ? Number(Number(val.single_amount_secured).toFixed(2))
        : null;
      form.single_prima_amount = val.single_prima_amount
        ? Number(Number(val.single_prima_amount).toFixed(2))
        : null;

      calcularTotalAmountSecured();
      calcularTotalPrimaAmount();
    }
  },
  { immediate: true }
);

watch([() => form.single_amount_secured, surfaceSecured], calcularTotalAmountSecured);
watch([() => form.single_prima_amount, surfaceSecured], calcularTotalPrimaAmount);

watch(() => form.surfaceSecured, () => {
  calcularTotalAmountSecured();
  calcularTotalPrimaAmount();
});


function calcularTotalAmountSecured() {
  const surface = Number(form.surfaceSecured || 0);
  const singleAmount = Number(form.single_amount_secured);
  const calculated = singleAmount * surface;
  form.total_amount_secured = isNaN(calculated) ? null : Number(calculated.toFixed(2));
}

function calcularTotalPrimaAmount() {
  const surface = Number(form.surfaceSecured || 0);
  const singlePrima = Number(form.single_prima_amount);
  const calculated = singlePrima * surface;
  form.total_prima_amount = isNaN(calculated) ? null : Number(calculated.toFixed(2));
}


function submit() {
  if (formRef.value) {
    formRef.value.validate().then((result: any) => {
      if (result.valid) {
        loading.value = true;
        emits("submit-dictamen", form);
      }
    });
  }
}

function submitRechazo() {
  if (!formRechazo.delete_motives || !form.comments) return;

  const payload = {
    uuid: props.subscription.uuid,
    delete_motives: formRechazo.delete_motives,
    comments: form.comments,
  };
  loading.value = true;
  console.log('params rechazo',payload)
  emits("submit-rechazo", payload);
  //internalDrawer.value = false;
}

onMounted(() => {
  form.surfaceSecured = surfaceSecured.value;
  
  getMotives();
});

const getMotives = async () => {
  loadMotives.value = true;
  try {
    const response = await suscriptionService.deteleMotives(props.subscription.subscription_type.name);
    motives.value = response.data.data.map((motivo: string) => ({
      value: motivo,
      title: motivo,
    }));
  } catch (error) {
    // console.error("Error al obtener motivos de rechazo:", error);
  } finally {
    loadMotives.value = false;
  }
};


function close() {
  internalDrawer.value = false;
}

function resetForm() {
  form.insurance_certificate_number = "";
  form.single_amount_secured = null;
  form.total_amount_secured = null;
  form.single_prima_amount = null;
  form.total_prima_amount = null;
  form.comments = "";
  form.surfaceSecured = null;
  formDictamen.tipoDictamen = "";
  formRechazo.delete_motives = "";
}
</script>

<style scoped>
::v-deep .custom-label:not(.v-text-field--is-focused) .v-label {
  color: #9e9e9e !important;
  font-size: 12px !important;
}

::v-deep(.v-text-field input[readonly]) {
  background-color: #f5f5f5 !important;
  /* gris claro */
  color: #9e9e9e !important;
  /* texto gris */
  pointer-events: none;
  /* evita selección de texto */
  cursor: not-allowed;
  /* cursor de deshabilitado */
  font-weight: bold;
}

::v-deep(.v-text-field--readonly .v-field__overlay) {
  background-color: transparent !important;
  /* evita sobrecolorear */
}
</style>
