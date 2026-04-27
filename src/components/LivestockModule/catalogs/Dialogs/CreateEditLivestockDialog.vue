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

/* ------------------ State ------------------ */
const dialog = ref(false);
const loading = ref(false);
const loadingSex = ref(false);
const sexList = ref<any[]>([]);

const form = ref({
  name: "",
  phone: "",
  months: 0,
  sexId: null as string | null,
  idDeathCause: null as string | null,
});

const touched = ref({
  name: false,
  phone: false,
  months: false,
  sexId: false,
  idDeathCause: false,
});

const deathCauseList = ref<any[]>([]);

/* ------------------ Validations ------------------ */
const req = (v: any) => !!v || "Obligatorio";
const pos = (v: any) => Number(v) > 0 || "Debe ser mayor a 0";

const nameRules = computed(() => touched.value.name ? [req] : []);
const phoneRules = computed(() => (props.catalog === "livestock-owner" && touched.value.phone) ? [req] : []);
const sexRules = computed(() => (props.catalog === "bovine-type" && touched.value.sexId) ? [req] : []);
const monthRules = computed(() => (props.catalog === "bovine-type" && touched.value.months) ? [pos] : []);
const deathCauseRules = computed(() => (props.catalog === "death-sub-cause" && touched.value.idDeathCause) ? [req] : []);

/* ------------------ Logic ------------------ */
const fetchSexCatalog = async () => {
  if (props.catalog !== 'bovine-type') return;
  try {
    loadingSex.value = true;
    const res = await liveStockService.getItems('sex', { page: 1, limit: 100 });
    sexList.value = res.data?.data?.data || res.data?.data || [];
  } catch (error) {
    console.error("Error cargando sexos:", error);
  } finally {
    loadingSex.value = false;
  }
};

const fetchDeathCauses = async () => {
  if (props.catalog !== 'death-sub-cause') return;
  try {
    const res = await liveStockService.getItems('death-cause', { page: 1, limit: 100 });
    deathCauseList.value = res.data?.data?.data || res.data?.data || [];
  } catch {
    console.error("Error cargando causas de muerte");
  }
};

watch(
  () => props.modelValue,
  async (v) => {
    dialog.value = v;
    if (v) {
      await Promise.all([fetchSexCatalog(), fetchDeathCauses()]);
      if (props.item) {
        form.value = {
          name: props.item.name,
          phone: props.item.phone || "",
          months: props.item.months || 0,
          sexId: props.item.sexId || props.item.sex?.id || null,
          idDeathCause: props.item.idDeathCause || props.item.deathCause?.id || null,
        };
      } else {
        form.value = { name: "", phone: "", months: 0, sexId: null, idDeathCause: null };
        touched.value = { name: false, phone: false, months: false, sexId: false, idDeathCause: false };
      }
    }
  },
  { immediate: true }
);

watch(dialog, (v) => emit("update:modelValue", v));

const isFormValid = computed(() => {
  const baseValid = !!form.value.name;
  if (props.catalog === "livestock-owner") return baseValid && !!form.value.phone;
  if (props.catalog === "bovine-type") return baseValid && !!form.value.sexId && Number(form.value.months) > 0;
  if (props.catalog === "death-sub-cause") return baseValid && !!form.value.idDeathCause;
  return baseValid;
});

const save = async () => {
  touched.value.name = true;
  if (props.catalog === "livestock-owner") touched.value.phone = true;
  if (props.catalog === "bovine-type") { touched.value.sexId = true; touched.value.months = true; }
  if (props.catalog === "death-sub-cause") touched.value.idDeathCause = true;

  if (!isFormValid.value) return;

  try {
    loading.value = true;
    const payload: any = {
      name: form.value.name.toUpperCase()
    };

    if (props.catalog === "livestock-owner") {
      payload.phone = form.value.phone;
    }

    if (props.catalog === "bovine-type") {
      payload.months = Number(form.value.months);
      payload.sexId = form.value.sexId;
    }

    if (props.catalog === "death-sub-cause") {
      payload.idDeathCause = form.value.idDeathCause;
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
  } catch (error) {
    showErrorAlert("Error al guardar");
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <v-dialog v-model="dialog" max-width="450px" persistent>
    <v-card>
      <v-card-title class="pa-4 text-h6 font-weight-bold bg-grey-lighten-4">
        {{ props.item ? "Editar " : "Registrar " }} Registro
      </v-card-title>

      <v-card-text class="mt-2">
        <v-text-field
          label="Nombre *"
          v-model="form.name"
          :rules="nameRules"
          @blur="touched.name = true"
          variant="outlined"
          density="comfortable"
          class="text-uppercase"
        />

        <template v-if="catalog === 'bovine-type'">
          <v-autocomplete
            label="Sexo Aplicable *"
            v-model="form.sexId"
            :items="sexList"
            item-title="name"
            item-value="id"
            :rules="sexRules"
            :loading="loadingSex"
            @blur="touched.sexId = true"
            variant="outlined"
            density="comfortable"
            class="mt-2"
          />
          <v-text-field
            label="Meses sugeridos *"
            v-model="form.months"
            type="number"
            :rules="monthRules"
            @blur="touched.months = true"
            variant="outlined"
            density="comfortable"
            class="mt-2"
          />
        </template>

        <v-text-field
          v-if="catalog === 'livestock-owner'"
          label="Teléfono *"
          v-model="form.phone"
          :rules="phoneRules"
          @blur="touched.phone = true"
          variant="outlined"
          density="comfortable"
          class="mt-2"
        />

        <v-autocomplete
          v-if="catalog === 'death-sub-cause'"
          label="Causa de Muerte Principal *"
          v-model="form.idDeathCause"
          :items="deathCauseList"
          item-title="name"
          item-value="id"
          :rules="deathCauseRules"
          @blur="touched.idDeathCause = true"
          variant="outlined"
          density="comfortable"
          class="mt-2"
          no-data-text="Sin causas registradas"
        />
      </v-card-text>

      <v-divider />
      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="plain" @click="dialog = false">Cancelar</v-btn>
        <v-btn
          color="primary"
          variant="flat"
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