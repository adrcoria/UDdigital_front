<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import Table from "@/app/common/components/Table.vue";
import RemoveItemConfirmationDialog from "@/app/common/components/RemoveItemConfirmationDialog.vue";
import ListMenuWithIcon from "@/app/common/components/ListMenuWithIcon.vue";
import CreateEditUserDialog from "./Dialogs/CreateEditUserDialog.vue";
import { showSuccessAlert, showErrorAlert } from "@/app/services/alertService";

// Importamos solo lo necesario para Usuarios
import { usuariosService } from "@/app/http/httpServiceProvider";
import { getLoggedUserId, isSuperUser, ROLES } from "@/app/utils/authHelper";

/* ------------------ Props ------------------ */
// Recibe el objeto de filtros desde el padre (donde está el QuerySearch)
const props = defineProps<{
  filters: {
    query: string;
  };
}>();

/* ------------------ State ------------------ */
const users = ref<any[]>([]);
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
const selectedUser = ref<any | null>(null);
const userToDelete = ref<any | null>(null);

/* ------------------ Table Config ------------------ */
const headers = [
  { title: "Nombre Completo" },
  { title: "Correo" },
  { title: "Teléfono" },
  { title: "Empresa" },
  { title: "Rol" },
  { title: "Acciones", align: 'center' },
];

const getActionMenu = (item: any) => {
  const menu = [{ title: "Editar", icon: "ph-pencil", value: "edit" }];

  const isTargetSuperUser = item.roleId === ROLES.SUPER_USER; // O item.role?.id
  const iAmSuperUser = isSuperUser(); // Usando tu helper
  const isMe = item.id === getLoggedUserId();
  if (!isMe) {
    if (!isTargetSuperUser || iAmSuperUser) {
      menu.push({ title: "Eliminar", icon: "ph-trash", value: "delete" });
    }
  }

  return menu;
};

/* ------------------ Computed (Buscador Local) ------------------ */
// Esta función filtra la tabla automáticamente cuando cambia props.filters.query
const tableData = computed(() => {
  const query = props.filters.query?.toLowerCase().trim();

  if (!query) return users.value;

  return users.value.filter((user) => {
    return (
      user.fullName?.toLowerCase().includes(query) ||
      user.mail?.toLowerCase().includes(query) ||
      user.phone?.toLowerCase().includes(query) ||
      user.companyName?.toLowerCase().includes(query) ||
      user.roleName?.toLowerCase().includes(query)
    );
  });
});

/* ------------------ Data Loading ------------------ */
const getUsers = async () => {
  try {
    loading.value = true;
    const res = await usuariosService.getUsers();

    // Suponiendo estructura res.data.data según tus contratos previos
    const payload = res.data.data;

    users.value = payload.map((u: any) => ({
      ...u,
      fullName: `${u.name} ${u.lastName}`,
      companyName: u.company?.name || "N/A",
      roleName: u.role?.name || "Sin Rol"
    }));

    config.value.noOfItems = users.value.length;
  } catch (error) {
    showErrorAlert("No se pudieron cargar los usuarios");
  } finally {
    loading.value = false;
  }
};

/* ------------------ Actions ------------------ */
const onCreate = () => {
  selectedUser.value = null;
  createDialog.value = true;
};

const onSelectAction = (action: string, item: any) => {
  if (action === "edit") {
    selectedUser.value = item;
    createDialog.value = true;
  } else if (action === "delete") {
    userToDelete.value = item;
    confirmationDialog.value = true;
  }
};

const confirmDelete = async () => {
  if (!userToDelete.value) return;

  const currentUserId = getLoggedUserId();
  const targetUserId = userToDelete.value.id;
  const targetIsSuperUser = userToDelete.value.role?.id === ROLES.SUPER_USER;

  if (targetUserId === currentUserId) {
    showErrorAlert("No puedes eliminar tu propia cuenta.");
    confirmationDialog.value = false;
    return;
  }

  if (targetIsSuperUser && !isSuperUser()) {
    showErrorAlert("No tienes permisos para eliminar a un Super Usuario.");
    confirmationDialog.value = false;
    return;
  }

  try {
    deleting.value = true;

    await usuariosService.deleteUser(targetUserId);

    showSuccessAlert("Usuario eliminado correctamente");

    await getUsers();

  } catch (error: any) {
    console.error("Error al eliminar usuario:", error);
    showErrorAlert(error.message || "Ocurrió un error al intentar eliminar el usuario");
  } finally {
    deleting.value = false;
    confirmationDialog.value = false;
    userToDelete.value = null;
  }
};

/* ------------------ Lifecycle & Watchers ------------------ */
onMounted(async () => {
  await getUsers();
});

watch(page, () => getUsers());
</script>

<template>
  <v-card>
    <v-card-title class="py-4">
      <v-row class="w-100" align="center" no-gutters>
        <v-col cols="12" sm="auto">
          <div class="text-h6">Gestión de Usuarios</div>
        </v-col>

        <v-spacer></v-spacer>

        <v-col cols="12" sm="auto" class="mt-2 mt-sm-0">
          <v-btn color="primary" prepend-icon="ph-user-plus" @click="onCreate">
            Nuevo Usuario
          </v-btn>
        </v-col>
      </v-row>
    </v-card-title>

    <v-card-text>
      <Table v-model="page" :config="config" :headerItems="headers" :loading="loading" is-pagination>
        <template #body>
          <tr v-for="item in tableData" :key="item.id">
            <td>
              <div class="font-weight-bold">{{ item.fullName }}</div>
            </td>
            <td>{{ item.mail }}</td>
            <td>{{ item.phone }}</td>
            <td>{{ item.companyName }}</td>
            <td>
              <v-chip size="small" color="primary" variant="flat">
                {{ item.roleName }}
              </v-chip>
            </td>
            <td class="text-center">
              <ListMenuWithIcon :menuItems="getActionMenu(item)" @onSelect="onSelectAction($event, item)" />
            </td>
          </tr>

          <tr v-if="!loading && tableData.length === 0">
            <td :colspan="headers.length" class="text-center py-4 text-muted">
              No se encontraron usuarios que coincidan con la búsqueda
            </td>
          </tr>
        </template>
      </Table>
    </v-card-text>
  </v-card>

  <CreateEditUserDialog v-if="createDialog" v-model="createDialog" :user="selectedUser" @refresh="getUsers" />

  <RemoveItemConfirmationDialog v-model="confirmationDialog" :loading="deleting" title="¿Eliminar usuario?"
    message="Esta acción no se puede deshacer." @onConfirm="confirmDelete" />
</template>

<style scoped>
th,
td {
  text-align: left !important;
  vertical-align: middle;
}
</style>