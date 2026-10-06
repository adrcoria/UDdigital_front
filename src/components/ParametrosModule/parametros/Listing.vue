<script setup lang="ts">
import { ref, onMounted } from "vue";
import Table from "@/app/common/components/Table.vue";
import EditParameterDialog from "./Dialogs/EditParameterDialog.vue";
import { parameterService } from "@/app/http/httpServiceProvider";
import { showErrorAlert } from "@/app/services/alertService";
import { getParameterMeta, type Parameter } from "./utils";

/* ------------------ State ------------------ */
const parameters = ref<Parameter[]>([]);
const loading = ref(false);
const page = ref(1);

const config = ref({
  page: 1,
  start: 0,
  end: 0,
  noOfItems: 0,
  itemsPerPage: 25,
});

const editDialog = ref(false);
const selectedParameter = ref<Parameter | null>(null);

/* ------------------ Table ------------------ */
const headers = [
  { title: "Parámetro" },
  { title: "Descripción" },
  { title: "Valor" },
  { title: "Acciones", align: "center" },
];

/* ------------------ Data ------------------ */
const getParameters = async () => {
  try {
    loading.value = true;
    const res = await parameterService.getParameters();
    // El endpoint responde { statusCode, message, data: [{ name, value }] }
    const payload = res.data?.data ?? res.data ?? [];
    parameters.value = Array.isArray(payload) ? payload : payload.list ?? [];
    config.value.noOfItems = parameters.value.length;
  } catch {
    showErrorAlert("No se pudieron cargar los parámetros");
  } finally {
    loading.value = false;
  }
};

const onEdit = (item: Parameter) => {
  selectedParameter.value = item;
  editDialog.value = true;
};

const displayValue = (item: Parameter) => {
  const meta = getParameterMeta(item.name);
  return meta.unit ? `${item.value} ${meta.unit}` : item.value;
};

onMounted(getParameters);
</script>

<template>
  <v-card>
    <v-card-title class="py-4">
      <v-row class="w-100" align="center" no-gutters>
        <v-col cols="12" sm="auto">
          <div class="text-h6">Parámetros generales</div>
          <div class="text-caption text-medium-emphasis">
            Valores globales que usa el sistema para sus cálculos
          </div>
        </v-col>

        <v-spacer />

        <v-col cols="12" sm="auto" class="mt-2 mt-sm-0">
          <v-btn
            variant="tonal"
            prepend-icon="ph-arrow-clockwise"
            :loading="loading"
            @click="getParameters"
          >
            Actualizar
          </v-btn>
        </v-col>
      </v-row>
    </v-card-title>

    <v-card-text>
      <Table :config="config" :headerItems="headers" :loading="loading">
        <template #body>
          <tr v-for="item in parameters" :key="item.name">
            <td class="font-weight-bold">
              {{ getParameterMeta(item.name).label }}
              <div class="text-caption text-medium-emphasis font-weight-regular">
                {{ item.name }}
              </div>
            </td>
            <td class="text-muted">
              {{ getParameterMeta(item.name).description || "—" }}
            </td>
            <td>
              <v-chip size="small" color="primary" variant="tonal" class="font-weight-bold">
                {{ displayValue(item) }}
              </v-chip>
            </td>
            <td class="text-center">
              <v-btn
                icon="ph-pencil"
                size="small"
                variant="text"
                color="primary"
                title="Editar valor"
                @click="onEdit(item)"
              />
            </td>
          </tr>

          <tr v-if="!loading && parameters.length === 0">
            <td :colspan="headers.length" class="text-center py-6 text-muted">
              No hay parámetros configurados
            </td>
          </tr>
        </template>
      </Table>
    </v-card-text>
  </v-card>

  <EditParameterDialog
    v-if="editDialog"
    v-model="editDialog"
    :parameter="selectedParameter"
    @refresh="getParameters"
  />
</template>

<style scoped>
th,
td {
  text-align: left !important;
  vertical-align: middle;
}
</style>
