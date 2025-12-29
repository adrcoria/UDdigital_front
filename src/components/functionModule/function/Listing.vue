<script lang="ts" setup>
import { ref, watch, computed, onMounted } from "vue";
import {
  headers,
  actions,
} from "@/components/functionModule/function/utils";

import Table from "@/app/common/components/Table.vue";
import { FunctionType } from "@/components/functionModule/function/types";
import CreateEditDialogObj from "@/components/functionModule/function/CreateEditDialog.vue";
import RemoveItemConfirmationDialog from "@/app/common/components/RemoveItemConfirmationDialog.vue";
import { specieService } from "@/app/http/httpServiceProvider";
import { showErrorAlert, showSuccessAlert } from "@/app/services/alertService";
import { getBackendErrorMessage } from "@/app/services/errorService";
const prop = defineProps({
  filters: {
    type: Object,
    default: () => { },
  },
});

const createEditDialog = ref(false);
const selectedDetail = ref<FunctionType | null>(null);

const confirmationDialog = ref(false);
const confirmationObj = ref<FunctionType | null>(null);

const isAllChecked = ref(false);

const filtered = ref<FunctionType[]>([]);
const finalData = ref<FunctionType[]>(filtered.value);

const page = ref(1);
const noOfItems = computed(() => {
  return finalData.value.length;
});
const tableData = ref<FunctionType[]>([]);
const loading = ref(false);
const loadingModal = ref(false);

const config = ref({
  page: page.value,
  start: 0,
  end: 0,
  noOfItems: noOfItems.value,
  itemsPerPage: 50,
});

const getPaginatedData = () => {
  const { itemsPerPage, page } = config.value;
  const start = (page - 1) * itemsPerPage;
  let end = start + itemsPerPage;
  end = end <= noOfItems.value ? end : noOfItems.value;

  config.value = {
    ...config.value,
    start,
    end,
  };
  const data = filtered.value.slice(config.value.start, config.value.end);
  loading.value = true;
  tableData.value = [];
  setTimeout(() => {
    tableData.value = data;
    loading.value = false;
  }, 200);
};

onMounted(() => {
  get();
});


const get = async () => {
  try {
    loading.value = true;
    const response = await specieService.getAllFunctions(); // Llamada al servicio
    let dataresponse = response.data.data;

    dataresponse = dataresponse.sort((a: FunctionType, b: FunctionType) => a.name.localeCompare(b.name));
    filtered.value = dataresponse; // Guardamos los usuarios obtenidos
    finalData.value = dataresponse;
    updateTableData(dataresponse);
  } catch (error) {
    // console.error(error);
    // const msg = getBackendErrorMessage(error, "Error al obtener funciones");
    // showErrorAlert(msg);
  } finally {
    loading.value = false;
  }
};


watch(page, (newPage: number) => {
  config.value.page = newPage;
  getPaginatedData();
});

const query = computed(() => prop.filters.query);

//para buscadar por nombre
watch(query, (newQuery: string) => {
  const val = newQuery.toLowerCase();
  filtered.value = finalData.value.filter((o) =>
    o.name.toLowerCase().includes(val) ||
    o.code.toLowerCase().includes(val)
  );
  filtered.value.sort((a, b) => a.name.localeCompare(b.name))
  page.value = 1;
  updateTableData(filtered.value);
});

const onSelectAll = () => {
  isAllChecked.value = !isAllChecked.value;
  filtered.value = filtered.value.map((value) => ({
    ...value,
    isChecked: isAllChecked.value,
  }));
};

const onSelect = (option: string, data: FunctionType) => {
  if (option === "edit") {
    selectedDetail.value = data;
    createEditDialog.value = true;
  } else if (option === "remove") {
    confirmationDialog.value = true;
    confirmationObj.value = data;
  }
};

watch(createEditDialog, (dialog: boolean) => {
  if (!dialog) selectedDetail.value = null;
});

watch(confirmationDialog, (dialog: boolean) => {
  if (!dialog) confirmationObj.value = null;
});

const onUpdate = async (updatedVal: any) => {
  try {

    loading.value = true;
    const payload = {
      name: updatedVal.name,
      code: updatedVal.code,
    };
    // esperar a que sabdi defina como mandar el ID
    const response = await specieService.updateFunction(updatedVal, updatedVal.uuid);

    if ([200, 201].includes(response.data.statusCode)) {
      showSuccessAlert("Actualización realizada con exito");
      filtered.value = filtered.value.map((obj) =>
        obj.uuid === updatedVal.uuid ? { ...obj, ...updatedVal } : obj
      );
      finalData.value = filtered.value;
      updateTableData(filtered.value);
      get();
    }
    else {
      showErrorAlert('(' + response.data.data + ')');
    }
  } catch (error) {
    const msg = getBackendErrorMessage(error, "Error al actualizar función");
    showErrorAlert(msg);
  }
  finally {
    loading.value = false;
    createEditDialog.value = false;
  }

};

const onCreate = async (newVal: any) => {
  try {

    loading.value = true;
    const payload = {
      name: newVal.name,
      code: newVal.code,
    };
    const response = await specieService.createFunction(payload, newVal.uuid_specie);
    if ([200, 201].includes(response.data.statusCode)) {
      showSuccessAlert("La operación se realizó con éxito");
      filtered.value.unshift(newVal);
      finalData.value = filtered.value;
      updateTableData(filtered.value);
      get();
    }
    else {
      showErrorAlert('(' + response.data.data + ')');
    }
  } catch (error) {
    const msg = getBackendErrorMessage(error, "Error al crear función");
    showErrorAlert(msg);
  }
  finally {
    loading.value = false;
    createEditDialog.value = false;
  }
}


const onConfirmDelete = async () => {
  try {

    loading.value = true;
    const response = await specieService.deleteFunction(confirmationObj.value?.uuid ?? "");
    if ([200, 201].includes(response.data.statusCode)) {
      showSuccessAlert("Se ha eliminado con éxito");
      filtered.value = filtered.value.filter(
        (obj) => obj.uuid !== confirmationObj.value?.uuid
      );
      updateTableData(filtered.value);
      get();
    }
    else {
      showErrorAlert('(' + response.data.data + ')');
    }
  } catch (error) {
    const msg = getBackendErrorMessage(error, "Error al eliminar función");
    showErrorAlert(msg);
  }
  finally {
    loading.value = false;
    confirmationDialog.value = false;
  }


};

const updateTableData = (newVal: FunctionType[]) => {
  loading.value = true;
  const { itemsPerPage, page } = config.value;

  const start = (page - 1) * itemsPerPage; // Calcular el inicio correcto
  let end = start + itemsPerPage;
  end = end <= newVal.length ? end : newVal.length;

  setTimeout(() => {
    tableData.value = newVal.slice(start, end); // Mostrar solo la página actual
    config.value = {
      ...config.value,
      start,
      end,
      noOfItems: newVal.length, // Actualizar total de elementos
    };
    loading.value = false;
  }, 200);
};


const onAddUserClick = () => {
  selectedDetail.value = {
    uuid: "",
    name: "",
    code: "",
    specie: {
      uuid: "",
      name: "",
    },
  };
  createEditDialog.value = true;
};
</script>

<template>
  <v-card>
    <v-card-title class="text-subtitle-1 font-weight-bold d-flex justify-space-between align-center">
      <div>Modalidad</div>
      <v-btn color="primary" elevation="0" class="mt-2" @click="onAddUserClick()">
        <i class="ph-plus-circle mx-1" /> Agregar función
      </v-btn>
    </v-card-title>
    <v-card-text>
      <Table v-model="page" :config="config" :headerItems="headers" is-pagination :loading="loading"
        @onSelectAll="onSelectAll">
        <template #body>
          <tr v-for="item in tableData" :key="item.uuid">
            <td>
              <div class="d-flex align-center">
                <span class="font-weight-bold">{{ item.name }}</span>
              </div>
            </td>
            <td>
              {{ item.code }}
            </td>
            <td>
              {{ item?.specie?.name }}
            </td>
            <td>
              <ListMenuWithIcon :menuItems="actions" @onSelect="onSelect($event, item)" />
            </td>
          </tr>
        </template>
      </Table>
      <div v-if="!filtered.length" class="text-center pa-7">
        <v-avatar color="primary" variant="tonal" size="x-large">
          <i class="ph-magnifying-glass ph-lg"></i>
        </v-avatar>
        <div class="text-subtitle-1 font-weight-bold">¡No se encontraron!</div>
      </div>
    </v-card-text>
  </v-card>
  <CreateEditDialogObj v-if="selectedDetail" v-model="createEditDialog" :selectedDetail="selectedDetail"
    :loading="loadingModal" @onUpdate="onUpdate" @onCreate="onCreate" />
  <RemoveItemConfirmationDialog v-if="confirmationObj" v-model="confirmationDialog" @onConfirm="onConfirmDelete" />
</template>
