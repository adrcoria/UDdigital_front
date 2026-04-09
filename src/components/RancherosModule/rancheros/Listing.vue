<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import Table from "@/app/common/components/Table.vue";
import RemoveItemConfirmationDialog from "@/app/common/components/RemoveItemConfirmationDialog.vue";
import ListMenuWithIcon from "@/app/common/components/ListMenuWithIcon.vue";
import CreateEditRancherDialog from "./Dialogs/CreateEditRancherDialog.vue";
import { showSuccessAlert, showErrorAlert } from "@/app/services/alertService";
import { ranchersService } from "@/app/http/httpServiceProvider";

const props = defineProps<{
  filters: {
    query: string;
  };
}>();

const ranchers = ref<any[]>([]);
const loading = ref(false);
const deleting = ref(false);
const page = ref(1);

const config = ref({
  page: page.value,
  start: 0,
  end: 0,
  noOfItems: 0,
  itemsPerPage: 10,
});

const createDialog = ref(false);
const confirmationDialog = ref(false);
const selectedRancher = ref<any | null>(null);
const rancherToDelete = ref<any | null>(null);

const headers = [
  { title: "Nombre" },
  { title: "Empresa" },
  { title: "Acciones", align: "center" },
];

const actionMenu = [
  { title: "Editar", icon: "ph-pencil", value: "edit" },
  { title: "Eliminar", icon: "ph-trash", value: "delete" },
];

const tableData = computed(() => {
  const query = props.filters.query?.toLowerCase().trim();
  if (!query) return ranchers.value;
  return ranchers.value.filter((r) =>
    r.name?.toLowerCase().includes(query) ||
    r.companyName?.toLowerCase().includes(query)
  );
});

const getRanchers = async () => {
  try {
    loading.value = true;
    const res = await ranchersService.getRanchers();
    const payload = res.data.data;
    ranchers.value = payload.map((r: any) => ({
      ...r,
      companyName: r.company?.name || "N/A",
    }));
    config.value.noOfItems = ranchers.value.length;
  } catch {
    showErrorAlert("No se pudieron cargar los rancheros");
  } finally {
    loading.value = false;
  }
};

const onCreate = () => {
  selectedRancher.value = null;
  createDialog.value = true;
};

const onSelectAction = (action: string, item: any) => {
  if (action === "edit") {
    selectedRancher.value = item;
    createDialog.value = true;
  } else if (action === "delete") {
    rancherToDelete.value = item;
    confirmationDialog.value = true;
  }
};

const confirmDelete = async () => {
  if (!rancherToDelete.value) return;
  try {
    deleting.value = true;
    await ranchersService.deleteRancher(rancherToDelete.value.id);
    showSuccessAlert("Ranchero eliminado correctamente");
    await getRanchers();
  } catch (error: any) {
    showErrorAlert(error.response?.data?.message || "Error al eliminar el ranchero");
  } finally {
    deleting.value = false;
    confirmationDialog.value = false;
    rancherToDelete.value = null;
  }
};

onMounted(async () => {
  await getRanchers();
});
</script>

<template>
  <v-card>
    <v-card-title class="py-4">
      <v-row class="w-100" align="center" no-gutters>
        <v-col cols="12" sm="auto">
          <div class="text-h6">Gestión de Rancheros</div>
        </v-col>
        <v-spacer></v-spacer>
        <v-col cols="12" sm="auto" class="mt-2 mt-sm-0">
          <v-btn color="primary" prepend-icon="ph-user-plus" @click="onCreate">
            Nuevo Ranchero
          </v-btn>
        </v-col>
      </v-row>
    </v-card-title>

    <v-card-text>
      <Table v-model="page" :config="config" :headerItems="headers" :loading="loading" is-pagination>
        <template #body>
          <tr v-for="item in tableData" :key="item.id">
            <td>
              <div class="font-weight-bold">{{ item.name }}</div>
            </td>
            <td>{{ item.companyName }}</td>
            <td class="text-center">
              <ListMenuWithIcon :menuItems="actionMenu" @onSelect="onSelectAction($event, item)" />
            </td>
          </tr>

          <tr v-if="!loading && tableData.length === 0">
            <td :colspan="headers.length" class="text-center py-4 text-muted">
              No se encontraron rancheros que coincidan con la búsqueda
            </td>
          </tr>
        </template>
      </Table>
    </v-card-text>
  </v-card>

  <CreateEditRancherDialog
    v-if="createDialog"
    v-model="createDialog"
    :rancher="selectedRancher"
    @refresh="getRanchers"
  />

  <RemoveItemConfirmationDialog
    v-model="confirmationDialog"
    :loading="deleting"
    title="¿Eliminar ranchero?"
    message="Esta acción no se puede deshacer."
    @onConfirm="confirmDelete"
  />
</template>

<style scoped>
th,
td {
  text-align: left !important;
  vertical-align: middle;
}
</style>
