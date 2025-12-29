<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import Table from "@/app/common/components/Table.vue";
import CreateEditOperationDialog from "./Dialogs/CreateEditOperationDialog.vue";
import RemoveItemConfirmationDialog from "@/app/common/components/RemoveItemConfirmationDialog.vue";
import ListMenuWithIcon from "@/app/common/components/ListMenuWithIcon.vue";
import { operationsService } from "@/app/http/httpServiceProvider";
import { showSuccessAlert, showErrorAlert } from "@/app/services/alertService";

/* ------------------ Props ------------------ */
const props = defineProps<{
  filters: {
    query: string;
  };
}>();

const formatMoney = (value: number | string) => {
  const num = Number(value || 0);
  return num.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  });
};

/* ------------------ State ------------------ */
const operations = ref<any[]>([]);
const tableData = ref<any[]>([]);
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
const selectedOperation = ref<any | null>(null);
const confirmation = ref<any | null>(null);

/* ------------------ Table ------------------ */
const headers = [
  { title: "Cuenta" },
  { title: "Categoría" },
  { title: "Concepto" },
  { title: "Operación" },
  { title: "Cantidad" },
  { title: "Monto" },
  { title: "Total" },
  { title: "Acciones" },
];

const actionMenu = [
  { title: "Editar", icon: "ph-pencil", value: "edit" },
  { title: "Eliminar", icon: "ph-trash", value: "delete" },
];

/* ------------------ Filtering ------------------ */
const filteredOperations = computed(() => {
  const q = props.filters.query?.trim().toLowerCase();
  if (!q) return operations.value;

  return operations.value.filter(op => {
    const fields = [
      op.accountName,
      op.categoryName,
      op.conceptName,
      op.description,
      String(op.amount),
      String(op.total),
    ];

    return fields.some(f => f && f.toString().toLowerCase().includes(q));
  });
});

/* ------------------ Pagination ------------------ */
const paginate = () => {
  const list = filteredOperations.value;
  const { itemsPerPage } = config.value;
  const start = (page.value - 1) * itemsPerPage;
  const end = Math.min(start + itemsPerPage, list.length);

  config.value = {
    ...config.value,
    start,
    end,
    noOfItems: list.length,
  };

  tableData.value = list.slice(start, end);
};

/* ------------------ Data ------------------ */
const getOperations = async () => {
  try {
    loading.value = true;
    const res = await operationsService.getOperations();

    operations.value = res.data.data.map((op: any) => {
      const quantity = Number(op.quantity || 1);
      const amount = Number(op.amount || 0);
      const polarity = Number(op.concept?.polarity || 1);

      return {
        ...op,
        accountName: op.account?.name || "",
        categoryName: op.concept?.conceptCategory?.name || "",
        conceptName: op.concept?.name || "",
        quantity,
        amount,
        total: (amount * quantity * polarity).toFixed(2),
      };
    });

    paginate();
  } catch {
    showErrorAlert("No se pudieron cargar las operaciones");
  } finally {
    loading.value = false;
  }
};

onMounted(getOperations);

/* ------------------ Watches ------------------ */
watch(page, paginate);
watch(() => props.filters.query, () => {
  page.value = 1;
  paginate();
});

/* ------------------ Actions ------------------ */
const onCreate = () => {
  selectedOperation.value = null;
  createDialog.value = true;
};

const onSelectAction = (action: string, item: any) => {
  if (action === "edit") {
    selectedOperation.value = item;
    createDialog.value = true;
  } else if (action === "delete") {
    confirmation.value = item;
    confirmationDialog.value = true;
  }
};

const confirmDelete = async () => {
  try {
    deleting.value = true;
    await operationsService.deleteOperation(confirmation.value.id);
    showSuccessAlert("Operación eliminada");
    await getOperations();
  } catch {
    showErrorAlert("No se pudo eliminar la operación");
  } finally {
    deleting.value = false;
    confirmationDialog.value = false;
  }
};
</script>

<template>
  <v-card>
    <v-card-title class="d-flex justify-space-between">
      Operaciones del día
      <v-btn color="primary" @click="onCreate">
        Registrar operación
      </v-btn>
    </v-card-title>

    <v-card-text>
      <Table v-model="page" :config="config" :headerItems="headers" :loading="loading" is-pagination>
        <template #body>
          <tr v-for="item in tableData" :key="item.id">
            <td>{{ item.accountName }}</td>
            <td>{{ item.categoryName }}</td>
            <td>{{ item.conceptName }}</td>
            <td>{{ item.description }}</td>
            <td class="text-end">{{ item.quantity }}</td>
            <td class="text-end">{{ formatMoney(item.amount) }}</td>
            <td class="text-end">{{ formatMoney(item.total) }}</td>

            <td class="text-center">
              <ListMenuWithIcon :menuItems="actionMenu" @onSelect="onSelectAction($event, item)" />
            </td>
          </tr>

          <tr v-if="!loading && tableData.length === 0">
            <td :colspan="headers.length" class="text-center py-4 text-muted">
              No hay operaciones para mostrar
            </td>
          </tr>
        </template>
      </Table>
    </v-card-text>
  </v-card>

  <CreateEditOperationDialog v-if="createDialog" v-model="createDialog" :operation="selectedOperation"
    @refresh="getOperations" />

  <RemoveItemConfirmationDialog v-model="confirmationDialog" :loading="deleting" @onConfirm="confirmDelete" />
</template>
