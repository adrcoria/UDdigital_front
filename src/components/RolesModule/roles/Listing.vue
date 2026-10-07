<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import Table from "@/app/common/components/Table.vue";
import RemoveItemConfirmationDialog from "@/app/common/components/RemoveItemConfirmationDialog.vue";
import CreateEditRoleDialog from "./Dialogs/CreateEditRoleDialog.vue";
import { roleService } from "@/app/http/httpServiceProvider";
import { showSuccessAlert, showErrorAlert } from "@/app/services/alertService";
import { esRolDelSistema, type Role } from "./utils";

const props = defineProps<{ filters: { query: string } }>();

const roles = ref<Role[]>([]);
const loading = ref(false);
const deleting = ref(false);
const toggling = ref<string | null>(null);

const editDialog = ref(false);
const confirmDialog = ref(false);
const seleccionado = ref<Role | null>(null);
const porEliminar = ref<Role | null>(null);

const headers = [
  { title: "Rol" },
  { title: "Descripción" },
  { title: "Estado" },
  { title: "Acciones", align: "center" },
];

const config = ref({ page: 1, start: 0, end: 0, noOfItems: 0, itemsPerPage: 50 });

const tableData = computed(() => {
  const query = props.filters?.query?.toLowerCase().trim();
  if (!query) return roles.value;

  return roles.value.filter(
    (r) =>
      r.name?.toLowerCase().includes(query) ||
      r.description?.toLowerCase().includes(query)
  );
});

const cargar = async () => {
  try {
    loading.value = true;
    const res = await roleService.getRoles();
    const payload = res.data?.data ?? res.data ?? [];
    roles.value = Array.isArray(payload) ? payload : payload.list ?? [];
    config.value.noOfItems = roles.value.length;
  } catch {
    showErrorAlert("No se pudieron cargar los roles");
  } finally {
    loading.value = false;
  }
};

const nuevo = () => {
  seleccionado.value = null;
  editDialog.value = true;
};

const editar = (item: Role) => {
  seleccionado.value = item;
  editDialog.value = true;
};

const alternarEstado = async (item: Role) => {
  try {
    toggling.value = item.id;
    await roleService.toggleRoleStatus(item.id);
    showSuccessAlert(item.isActive ? "Rol desactivado" : "Rol activado");
    await cargar();
  } catch (error: any) {
    const msg = error.response?.data?.message;
    showErrorAlert(Array.isArray(msg) ? msg[0] : msg || "No se pudo cambiar el estado del rol");
  } finally {
    toggling.value = null;
  }
};

const pedirBaja = (item: Role) => {
  porEliminar.value = item;
  confirmDialog.value = true;
};

const confirmarBaja = async () => {
  if (!porEliminar.value) return;

  try {
    deleting.value = true;
    await roleService.deleteRole(porEliminar.value.id);
    showSuccessAlert("Rol eliminado");
    await cargar();
  } catch (error: any) {
    const msg = error.response?.data?.message;
    showErrorAlert(
      Array.isArray(msg)
        ? msg[0]
        : msg || "No se pudo eliminar el rol. Revisa que no tenga usuarios asignados."
    );
  } finally {
    deleting.value = false;
    confirmDialog.value = false;
    porEliminar.value = null;
  }
};

onMounted(cargar);
</script>

<template>
  <v-card>
    <v-card-title class="py-4">
      <v-row class="w-100" align="center" no-gutters>
        <v-col cols="12" sm="auto">
          <div class="text-h6">Roles del sistema</div>
          <div class="text-caption text-medium-emphasis">
            Las secciones que ve cada rol se asignan en Configuraciones → Permisos
          </div>
        </v-col>

        <v-spacer />

        <v-col cols="12" sm="auto" class="d-flex ga-2 mt-2 mt-sm-0">
          <v-btn variant="tonal" prepend-icon="ph-arrow-clockwise" :loading="loading" @click="cargar">
            Actualizar
          </v-btn>
          <v-btn color="primary" prepend-icon="ph-plus" @click="nuevo">
            Nuevo rol
          </v-btn>
        </v-col>
      </v-row>
    </v-card-title>

    <v-card-text>
      <Table :config="config" :headerItems="headers" :loading="loading">
        <template #body>
          <tr v-for="item in tableData" :key="item.id">
            <td>
              <div class="d-flex align-center ga-2">
                <span class="font-weight-bold">{{ item.name }}</span>
                <v-chip v-if="esRolDelSistema(item.id)" size="x-small" variant="tonal" color="info">
                  Del sistema
                </v-chip>
              </div>
            </td>

            <td class="text-muted">{{ item.description || "—" }}</td>

            <td>
              <v-chip
                size="small"
                :color="item.isActive ? 'success' : 'grey'"
                variant="tonal"
                :class="esRolDelSistema(item.id) ? '' : 'cursor-pointer'"
                :disabled="toggling === item.id"
                @click="esRolDelSistema(item.id) ? null : alternarEstado(item)"
              >
                {{ item.isActive ? "Activo" : "Inactivo" }}
              </v-chip>
            </td>

            <td class="text-center">
              <v-btn
                icon="ph-pencil"
                size="small"
                variant="text"
                color="primary"
                title="Editar"
                @click="editar(item)"
              />

              <v-tooltip
                v-if="esRolDelSistema(item.id)"
                text="Es un rol del sistema: no se puede eliminar"
                location="top"
              >
                <template #activator="{ props }">
                  <span v-bind="props">
                    <v-btn icon="ph-trash" size="small" variant="text" disabled />
                  </span>
                </template>
              </v-tooltip>

              <v-btn
                v-else
                icon="ph-trash"
                size="small"
                variant="text"
                color="error"
                title="Eliminar"
                @click="pedirBaja(item)"
              />
            </td>
          </tr>

          <tr v-if="!loading && tableData.length === 0">
            <td :colspan="headers.length" class="text-center py-6 text-muted">
              No se encontraron roles
            </td>
          </tr>
        </template>
      </Table>
    </v-card-text>
  </v-card>

  <CreateEditRoleDialog
    v-if="editDialog"
    v-model="editDialog"
    :role="seleccionado"
    @refresh="cargar"
  />

  <RemoveItemConfirmationDialog
    v-model="confirmDialog"
    :loading="deleting"
    title="¿Eliminar rol?"
    message="Se eliminará el rol y los permisos que tenga asignados. Los usuarios con este rol quedarán sin él."
    @onConfirm="confirmarBaja"
  />
</template>

<style scoped>
th,
td {
  text-align: left !important;
  vertical-align: middle;
}

.cursor-pointer {
  cursor: pointer;
}
</style>
