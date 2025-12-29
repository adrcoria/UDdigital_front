<template>
  <v-navigation-drawer v-model="internalDrawer" temporary width="400" :location="isRtl ? 'start' : 'end'"
    class="right-sidebar-drawer">
    <div class="d-flex align-center pa-3 right-sidebar-header justify-space-between" style="background-color: #3862eb;">
      <div>
        <h3 class="mb-1 text-white">Dictaminar Siniestro</h3>
        <p class="text-white mb-0 right-sidebar-subtitle">
          Revisa la información del siniestro para aprobar o rechazar.
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
          <v-alert v-if="requiereAvisoCosecha" type="warning" variant="tonal" density="comfortable"
            title="Aviso de cosecha requerido" text="Existe un aviso de cosecha solicitado en esta orden de trabajo."
            class="mb-4" />
          <v-row>
            <v-col cols="12">
              <v-radio-group v-model="formDictamen.tipoDictamen" :rules="radioGroupRules"
                label="¿Deseas Aprobar o Rechazar el siniestro?" class="mb-2 custom-label" density="compact">
                <!-- Si está en espera de aprobación, solo muestra Aprobar/Rechazar -->
                <template v-if="soloAprobarRechazar">
                  <v-radio label="🟢 Aprobar" value="APROBADO" />
                  <v-radio label="🔴 Rechazar siniestro" value="RECHAZADO" />
                </template>
                <!-- Si NO, muestra también la opción de aviso de cosecha si aplica -->
                <template v-else>
                  <v-radio v-if="requiereAvisoCosecha" label="✅ Se habilita aviso de cosecha"
                    value="APROBAR_CON_AVISO" />
                  <v-radio label="🟢 Perdida total" value="APROBADO" />
                  <v-radio label="🔴 Rechazar siniestro" value="RECHAZADO" />
                </template>
              </v-radio-group>

            </v-col>

            <v-col cols="12" v-if="formDictamen.tipoDictamen === 'APROBADO'">
              <p class="text-grey mb-2" style="font-size: 12px; text-align: center;">
                💡 Monto calculado por administración (Operaciones):
                {{ currencyFormatter.format(Number(props.siniestro.amount_to_paid_pending) || 0) }}
              </p>

              <!-- 💡 Sugerencia 2: monto máximo protegido (afectado) -->
              <p v-if="montoSugeridoAfectado > 0" class="text-grey mb-2" style="font-size: 12px; text-align: center;">
                💡 Sugerencia: Monto máximo protegido por superficie/cabezas afectadas:
                {{ currencyFormatter.format(montoSugeridoAfectado) }}
              </p>

              <br />
              <v-text-field label="Monto a Pagar" v-model="form.amountToPaid" variant="outlined" density="compact"
                type="number" :rules="amountToPaidRules" class="mb-2 custom-label" prefix="$" autocomplete="off" />
              <v-alert v-if="montoDifiere" type="info" variant="tonal" density="comfortable"
                title="Monto diferente al asegurado"
                :text="`El monto capturado (${currencyFormatter.format(Number(form.amountToPaid) || 0)}) es diferente al monto asegurado (${currencyFormatter.format(Number(props.siniestro.subscription?.total_amount_secured) || 0)}). Se solicitará visto bueno.`"
                class="mb-4" />
            </v-col>

            <v-col cols="12" v-if="formDictamen.tipoDictamen">
              <v-textarea label="Comentarios" v-model="form.comments" variant="outlined" density="compact"
                :rules="requiredRule" class="mb-2 custom-label" />
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions class="d-flex justify-end px-5 pb-3">
          <v-btn color="success"
            v-if="formDictamen.tipoDictamen === 'APROBADO' || formDictamen.tipoDictamen == 'APROBAR_CON_AVISO'"
            @click="submitAprobar" :loading="loading">

            <span v-if="montoDifiere">
              Solicitar Visto Bueno
            </span>
            <span v-else>
              Aprobar Siniestro
            </span>
          </v-btn>
          <v-btn color="error" v-if="formDictamen.tipoDictamen === 'RECHAZADO'" @click="submitRechazar"
            :loading="loading">
            Rechazar Siniestro
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
import { ref, watch, defineProps, defineEmits, reactive, computed, onMounted } from "vue";


const originalAmount = ref(0);


// Props y emits
const props = defineProps<{
  visible: boolean;
  siniestro: any;
}>();

const emits = defineEmits<{
  (e: "submit-aprobar-siniestro", payload: { comments: string; amountToPaid: number; immediateApprove?: boolean }, uuidSiniestro: string): void;
  (e: "submit-rechazar-siniestro", payload: { comments: string }, uuidSiniestro: string): void;
  (e: "submit-visto-bueno", payload: { comments: string; amountToPaid: number; totalAmountSecured: number; uuidSiniestro: string }): void;
  (e: "update:visible", value: boolean): void;
}>();

const isRtl = ref(false);
const internalDrawer = ref(props.visible);
const loading = ref(false);

const enEsperaDeAprobacion = computed(() => {
  const estatus = props.siniestro.sinisterStatus?.name?.toLowerCase?.() || "";
  return estatus === "en espera de aprobacion";
});

// Validaciones
const requiredRule = [(v: any) => !!v || "Este campo es requerido"];
const radioGroupRules = [(v: any) => !!v || "Debes seleccionar una opción"];
const amountToPaidRules = computed(() => {
  if (
    formDictamen.tipoDictamen === "APROBADO" ||
    formDictamen.tipoDictamen === "APROBAR_CON_AVISO"
  ) {
    return [
      (v: any) =>
        v !== null && v !== undefined && v !== "" ||
        "El monto a pagar es requerido al aprobar.",
      (v: any) => !isNaN(Number(v)) || "Debe ser un número válido.",
      (v: number) => v >= 0 || "El monto no puede ser negativo.",
      (v: number) => {
        const asegurado = Number(props.siniestro.subscription?.total_amount_secured || 0);

        if (enEsperaDeAprobacion.value && v > asegurado) {
          return `El monto no puede ser mayor al asegurado (${currencyFormatter.format(asegurado)}).`;
        }
        return true;
      }
    ];
  }
  return [];
});


// Form data
const form = reactive({
  comments: "",
  amountToPaid: null as number | null,
  immediateApprove: false,
});

const formDictamen = reactive({
  tipoDictamen: "",
});

const formRef = ref<HTMLFormElement | null>(null);

// Utils
const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
});

const montoSugeridoAfectado = computed(() => {
  if (!props.siniestro) return 0;

  const isPecuario =
    props.siniestro.subscription?.subscription_type?.name === "PECUARIO";

  if (isPecuario) {
    // Suma recovery_amount de los animales afectados
    return (
      props.siniestro.workOrders?.reduce((sumOrders, order) => {
        const sumAnimals =
          order.sinisterWorkOrderAnimals?.reduce(
            (sumA, animal) => sumA + Number(animal.recovery_amount || 0),
            0
          ) || 0;
        return sumOrders + sumAnimals;
      }, 0) || 0
    );
  } else {
    // Si es agrícola → superficie afectada × monto por ha
    const superficieAfectada = Number(props.siniestro.affected_surface || 0);
    const montoPorHa = Number(props.siniestro.subscription?.amount_per_unit || 0);
    return superficieAfectada * montoPorHa;
  }
});


// Detecta si el monto difiere
const montoDifiere = computed(() => {
  if (formDictamen.tipoDictamen !== "APROBADO") return false;
  const estatus = props.siniestro.sinisterStatus?.name?.toLowerCase?.() || "";
  if (estatus === "en espera de aprobacion") return false;

  const montoCapturado = Number(form.amountToPaid) || 0;
  const montoAsegurado = Number(props.siniestro.subscription?.total_amount_secured || 0);

  // Normalizamos a 2 decimales
  const capturadoFixed = Number(montoCapturado.toFixed(2));
  const aseguradoFixed = Number(montoAsegurado.toFixed(2));

  return capturadoFixed !== aseguradoFixed;
});



const soloAprobarRechazar = computed(() => {
  const status = props.siniestro?.sinisterStatus?.name?.toLowerCase?.() || "";
  return status === "en espera de aprobacion";
});

// Lógica para mostrar aviso de cosecha
const requiereAvisoCosecha = computed(() => {
  return Array.isArray(props.siniestro?.workOrders)
    ? props.siniestro.workOrders.some(
      (order) => order.is_harvest_notice_needed === true
    )
    : false;
});

// Métodos principales
const submitAprobar = async () => {
  if (!formRef.value) return;

  const { valid } = await formRef.value.validate();
  if (
    valid &&
    (formDictamen.tipoDictamen === "APROBADO" ||
      formDictamen.tipoDictamen === "APROBAR_CON_AVISO")
  ) {
    loading.value = true;

    const montoCapturado = Number(form.amountToPaid);
    const montoAsegurado = Number(props.siniestro.subscription?.total_amount_secured || 0);
    const estatus = props.siniestro.sinisterStatus?.name?.toLowerCase?.() || "";

    if (estatus === "en espera de aprobacion") {
      emits("submit-aprobar-siniestro", {
        comments: form.comments,
        amountToPaid: montoCapturado,
        immediateApprove: form.immediateApprove
      }, props.siniestro.uuid);
      loading.value = false;
      return;
    }

    console.log("montoCapturado", montoCapturado);
    console.log("montoAsegurado", montoAsegurado);

    if (montoCapturado !== montoAsegurado && montoCapturado > 0) {
      emits("submit-visto-bueno", {
        comments: form.comments,
        amountToPaid: montoCapturado,
        totalAmountSecured: montoAsegurado,
        uuidSiniestro: props.siniestro.uuid,
      });
      loading.value = false;
      return;
    }

    // Si NO está en espera de aprobación y NO cambió el monto => aprobar directo
    emits("submit-aprobar-siniestro", {
      comments: form.comments,
      amountToPaid: montoCapturado,
      immediateApprove: form.immediateApprove,
    }, props.siniestro.uuid);
    loading.value = false;
  }
};


const submitRechazar = async () => {
  if (!formRef.value) return;

  const { valid } = await formRef.value.validate();
  if (valid && formDictamen.tipoDictamen === "RECHAZADO") {
    loading.value = true;

    const payload = {
      comments: form.comments,
    };

    emits("submit-rechazar-siniestro", payload, props.siniestro.uuid);
    loading.value = false;
  }
};

function close() {
  internalDrawer.value = false;
}

function resetForm() {
  form.comments = "";
  form.amountToPaid = null;
  formDictamen.tipoDictamen = "";
  if (formRef.value) {
    formRef.value.resetValidation();
  }
}

// Sincronizar drawer y limpiar form
watch(
  () => props.visible,
  (newVal) => {
    internalDrawer.value = newVal;
    if (!newVal) resetForm();
  }
);

watch(internalDrawer, (newVal) => {
  emits("update:visible", newVal);
});

// Cargar el monto si ya existe al abrir
watch(
  () => props.siniestro,
  (newSiniestro) => {
    if (!newSiniestro) return;

    const isPecuario =
      newSiniestro.subscription?.subscription_type?.name === "PECUARIO";

    if (isPecuario) {
      const totalRecovery =
        newSiniestro.workOrders?.reduce((sumOrders, order) => {
          const sumAnimals =
            order.sinisterWorkOrderAnimals?.reduce(
              (sumA, animal) => sumA + Number(animal.recovery_amount || 0),
              0
            ) || 0;
          return sumOrders + sumAnimals;
        }, 0) || 0;

      originalAmount.value = totalRecovery;
    } else {
      originalAmount.value = newSiniestro.amount_to_paid_pending ?? 0;
    }

    // 👇 ahora el valor inicial de Monto a Pagar es siempre el pending
    form.amountToPaid = newSiniestro.amount_to_paid_pending ?? null;
  },
  { immediate: true }
);
watch(
  () => props.siniestro,
  (newSiniestro) => {
    if (!newSiniestro) return;

    const isPecuario =
      newSiniestro.subscription?.subscription_type?.name === "PECUARIO";

    if (isPecuario) {
      const totalRecovery =
        newSiniestro.workOrders?.reduce((sumOrders, order) => {
          const sumAnimals =
            order.sinisterWorkOrderAnimals?.reduce(
              (sumA, animal) => sumA + Number(animal.recovery_amount || 0),
              0
            ) || 0;
          return sumOrders + sumAnimals;
        }, 0) || 0;

      originalAmount.value = totalRecovery;
    } else {
      originalAmount.value = newSiniestro.amount_to_paid_pending ?? 0;
    }

    // 👇 ahora el valor inicial de Monto a Pagar es siempre el pending
    form.amountToPaid = newSiniestro.amount_to_paid_pending ?? null;
  },
  { immediate: true }
);

onMounted(() => {
  const isPecuario =
    props.siniestro.subscription?.subscription_type?.name === "PECUARIO";

  if (isPecuario) {
    const totalRecovery =
      props.siniestro.workOrders?.reduce((sumOrders, order) => {
        const sumAnimals =
          order.sinisterWorkOrderAnimals?.reduce(
            (sumA, animal) => sumA + Number(animal.recovery_amount || 0),
            0
          ) || 0;
        return sumOrders + sumAnimals;
      }, 0) || 0;

    originalAmount.value = totalRecovery;
  } else {
    originalAmount.value = props.siniestro?.amount_to_paid_pending ?? 0;
  }

  form.amountToPaid = props.siniestro?.amount_to_paid_pending ?? null;
});




watch(() => formDictamen.tipoDictamen, (val) => {
  if (val === "APROBAR_CON_AVISO") {
    form.immediateApprove = false;
  } else if (val === "APROBADO") {
    form.immediateApprove = true;
    const asegurado = Number(props.siniestro.subscription?.total_amount_secured || 0);
    form.amountToPaid = Number(asegurado.toFixed(2)); // 👈 siempre redondeado
  } else {
    form.amountToPaid = null;
  }
});


onMounted(() => {
  const isPecuario =
    props.siniestro.subscription?.subscription_type?.name === "PECUARIO";

  if (isPecuario) {
    // Suma recovery_amount de todos los animales en todas las órdenes de trabajo
    const totalRecovery = props.siniestro.workOrders?.reduce((sumOrders, order) => {
      const sumAnimals = order.sinisterWorkOrderAnimals?.reduce(
        (sumA, animal) => sumA + Number(animal.recovery_amount || 0),
        0
      ) || 0;
      return sumOrders + sumAnimals;
    }, 0) || 0;

    originalAmount.value = totalRecovery;
  } else {
    originalAmount.value = props.siniestro?.amount_to_paid ?? 0;
  }
});
</script>

<style scoped>
::v-deep .custom-label:not(.v-text-field--is-focused) .v-label {
  color: #9e9e9e !important;
  font-size: 12px !important;
}

::v-deep(.v-text-field input) {
  font-weight: bold;
}

::v-deep(.v-text-field input::placeholder) {
  font-weight: normal;
}
</style>
