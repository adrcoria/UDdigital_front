<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import Table from "@/app/common/components/Table.vue";
import CreateEditCompanyDialog from "./Dialogs/CreateEditCompanyDialog.vue";
import RemoveItemConfirmationDialog from "@/app/common/components/RemoveItemConfirmationDialog.vue";
import ListMenuWithIcon from "@/app/common/components/ListMenuWithIcon.vue";
import { showSuccessAlert, showErrorAlert } from "@/app/services/alertService";
import { isSuperUser } from "@/app/utils/authHelper";
import { companyService } from "@/app/http/httpServiceProvider";

/* ------------------ Props ------------------ */
// Recibe el objeto de filtros desde el componente QuerySearch (padre)
const props = defineProps<{
  filters: {
    query: string;
  };
}>();

/* ------------------ State ------------------ */
const companies = ref<any[]>([]);
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
const selectedCompany = ref<any | null>(null);
const companyToDelete = ref<any | null>(null);

/* ------------------ Table Config ------------------ */
const headers = [
  { title: "Nombre" },
  { title: "Código" },
  { title: "Descripción" },
  { title: "Acciones", align: 'center' },
];

const getActionMenu = () => {
  return [
    { title: "Editar", icon: "ph-pencil", value: "edit" },
    { title: "Eliminar", icon: "ph-trash", value: "delete" },
  ];
};

/* ------------------ Computed (Buscador Local) ------------------ */
// Filtra en tiempo real sobre la lista cargada en 'companies'
const tableData = computed(() => {
  const query = props.filters.query?.toLowerCase().trim();
  
  if (!query) return companies.value;

  return companies.value.filter((item) => {
    return (
      item.name?.toLowerCase().includes(query) ||
      item.code?.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query)
    );
  });
});

/* ------------------ Data Loading ------------------ */
const getCompanies = async () => {
  try {
    loading.value = true;
    const res = await companyService.getCompanies();
    
    // Acceso a res.data.data según el contrato de AG Digital API
    const payload = res.data.data;
    companies.value = payload;

    config.value.noOfItems = companies.value.length;
  } catch (error) {
    showErrorAlert("No se pudieron cargar las empresas");
  } finally {
    loading.value = false;
  }
};

/* ------------------ Actions ------------------ */
const onCreate = () => {
  selectedCompany.value = null;
  createDialog.value = true;
};

const onSelectAction = (action: string, item: any) => {
  if (action === "edit") {
    selectedCompany.value = item;
    createDialog.value = true;
  } else if (action === "delete") {
    companyToDelete.value = item;
    confirmationDialog.value = true;
  }
};

const confirmDelete = async () => {
  if (!companyToDelete.value?.id) return;
  
  try {
    deleting.value = true;
    await companyService.deleteCompany(companyToDelete.value.id);
    showSuccessAlert("Empresa eliminada correctamente");
    await getCompanies();
  } catch (error) {
    showErrorAlert("No se pudo eliminar la empresa");
  } finally {
    deleting.value = false;
    confirmationDialog.value = false;
    companyToDelete.value = null;
  }
};

/* ------------------ Lifecycle & Watchers ------------------ */
onMounted(async () => {
  await getCompanies();
});

watch(page, () => getCompanies());

watch(
  () => config.value.itemsPerPage,
  () => {
    page.value = 1;
    getCompanies();
  }
);
</script>

<template>
  <v-card>
    <v-card-title class="py-4">
      <v-row class="w-100" align="center" no-gutters>
        <v-col cols="12" sm="auto">
          <div class="text-h6">Listado de Empresas</div>
        </v-col>

        <v-spacer></v-spacer>

        <v-col cols="12" sm="auto" class="mt-2 mt-sm-0">
          <v-btn 
            v-if="isSuperUser()" 
            color="primary" 
            prepend-icon="ph-plus" 
            @click="onCreate"
          >
            Nueva Empresa
          </v-btn>
        </v-col>
      </v-row>
    </v-card-title>

    <v-card-text>
      <Table 
        v-model="page" 
        :config="config" 
        :headerItems="headers" 
        :loading="loading" 
        is-pagination
      >
        <template #body>
          <tr v-for="item in tableData" :key="item.id">
            <td class="font-weight-bold">{{ item.name }}</td>
            <td>
              <v-chip size="small" variant="tonal" color="secondary">
                {{ item.code }}
              </v-chip>
            </td>
            <td class="text-muted">{{ item.description || 'Sin descripción' }}</td>

            <td class="text-center">
              <ListMenuWithIcon 
                v-if="isSuperUser()"
                :menuItems="getActionMenu()" 
                @onSelect="onSelectAction($event, item)" 
              />
              <v-icon v-else color="grey-lighten-1">mdi-lock</v-icon>
            </td>
          </tr>

          <tr v-if="!loading && tableData.length === 0">
            <td :colspan="headers.length" class="text-center py-4 text-muted">
              No se encontraron empresas que coincidan con la búsqueda
            </td>
          </tr>
        </template>
      </Table>
    </v-card-text>
  </v-card>

  <CreateEditCompanyDialog 
    v-if="createDialog" 
    v-model="createDialog" 
    :company="selectedCompany"
    @refresh="getCompanies" 
  />

  <RemoveItemConfirmationDialog 
    v-model="confirmationDialog" 
    :loading="deleting" 
    title="¿Eliminar empresa?"
    message="Esta acción eliminará la empresa y sus datos vinculados de forma permanente."
    @onConfirm="confirmDelete" 
  />
</template>

<style scoped>
th, td {
  text-align: left !important;
  vertical-align: middle;
}
</style>