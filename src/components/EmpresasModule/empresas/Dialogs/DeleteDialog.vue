<script setup lang="ts">
import { computed, ref, reactive, onMounted } from "vue";
import { defineProps, defineEmits } from "vue";
import { userService } from "@/app/http/httpServiceProvider";

// Recibe suscripciones para generar órdenes en lote
const emit = defineEmits(["update:modelValue", "onUpdateOrder"]);
const props = defineProps<{
  modelValue: boolean;
  suscripciones: any[];
  loading: boolean;
  bandeja: string;
}>();

const dialogValue = computed({
  get: () => props.modelValue,
  set: val => emit("update:modelValue", val),
});

const loadingPrincipal = ref(false);

// Formulario único
const form = reactive({
  uuid_user: "",
  work_order_type: props.bandeja == "AGENDADA"
    ? "EXTRAORDINARY"
    : "ORDINARY",
  folio: "",
});

const users = ref<{ value: string; title: string }[]>([]);
const loadingUser = ref(false);
const workOrderOptions = [
  { value: "ORDINARY", title: "Ordinaria" },
  { value: "EXTRAORDINARY", title: "Extraordinaria" },
];

// Carga técnicos
const getUsers = async () => {
  loadingUser.value = true;
  try {
    const { data } = await userService.getUsers();
    users.value = data.data
      .filter((u: any) => u.role.name === "TECNICO")
      .map((u: any) => ({ value: u.uuid, title: u.name }));
  } finally {
    loadingUser.value = false;
  }
};

// Limpia el formulario
function limpiarFormulario() {
  form.uuid_user = "";
  form.work_order_type = props.bandeja == "AGENDADA"
    ? "EXTRAORDINARY"
    : "ORDINARY";
  form.folio = "";
}

onMounted(() => {
  limpiarFormulario();
  getUsers();
});


const requiredRule = [(v: string) => !!v || "Este campo es requerido"];
const formRef = ref();

const onCreateUpdate = async () => {

  const res = await formRef.value.validate();
  if (!res.valid) {
    return
  }
  loadingPrincipal.value = true;

  // Construir arreglo de órdenes
  const orders = props.suscripciones.map(s => ({
    uuid_subscription: s.uuid,
    uuid_user: form.uuid_user,
    work_order_type: form.work_order_type,
    folio: form.folio,
  }));

  emit(
    "onUpdateOrder",
    { orders },
    () => (loadingPrincipal.value = false)
  );
};
</script>

<template>
  <v-dialog v-model="dialogValue" scrollable max-width="800">
    <Card title="Crear órdenes de trabajo" title-class="bg-light text-center">
      <template #title-action>
        <v-btn icon="ph-x" variant="plain" density="compact" @click="dialogValue = false" />
      </template>

      <v-form ref="formRef" lazy-validation>
        <v-card-text data-simplebar>
          <v-row class="mb-4" style="border-bottom: 1px solid #eee;">
            <v-col cols="12" class="font-weight-bold">
              Se crearán {{ props.suscripciones.length }} órdenes
            </v-col>
            <v-col cols="6">
              <v-select v-model="form.uuid_user" :items="users" :rules="requiredRule" label="Usuario técnico"
                density="compact" variant="outlined" :loading="loadingUser" />
            </v-col>
            <v-col cols="6">
              <v-select v-model="form.work_order_type" :items="workOrderOptions" item-text="title" item-value="value"
                :rules="requiredRule" label="Tipo de Orden" density="compact" variant="outlined" readonly
                class="custom-label" />
            </v-col>
            <v-col cols="6">

              <v-text-field v-model="form.folio" :rules="requiredRule" label="Folio" density="compact"
                class="custom-label" variant="outlined" />
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions class="d-flex justify-end px-5 pb-3">
          <v-btn color="light" variant="elevated" @click="dialogValue = false">Cerrar</v-btn>
          <v-btn :loading="loadingPrincipal" color="success" variant="elevated" @click="onCreateUpdate">
            Asignar {{ props.suscripciones.length }} órdenes
          </v-btn>
        </v-card-actions>
      </v-form>
    </Card>
  </v-dialog>
</template>

<style scoped>
.custom-label:not(.v-text-field--is-focused) .v-label {
  color: #9e9e9e !important;
  font-size: 12px !important;
}
</style>
