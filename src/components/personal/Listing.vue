<script lang="ts" setup>
import { ref, watch, onMounted } from "vue";
import Table from "@/app/common/components/Table.vue";
import ListMenuWithIcon from "@/app/common/components/ListMenuWithIcon.vue";
import RemoveItemConfirmationDialog from "@/app/common/components/RemoveItemConfirmationDialog.vue";
import CreateEditPersonalDialog from "./Dialogs/CreateEditPersonalDialog.vue";
import PersonalPhotoDialog from "./Dialogs/PersonalPhotoDialog.vue";
import { personalService } from "@/app/http/httpServiceProvider";
import { showErrorAlert, showSuccessAlert } from "@/app/services/alertService";
import { formatDate } from "@/app/utils/date";
import { CONTRACT_TYPES, ESCOLARITY_OPTIONS } from "./types";

const props = defineProps({
  filters: { type: Object, default: () => ({ query: "" }) },
});

/* ──────────────── Estado ──────────────── */
const tableData = ref<any[]>([]);
const loading = ref(false);
const page = ref(1);
const expandedRows = ref<string[]>([]);
const config = ref({
  page: 1,
  start: 0,
  end: 0,
  noOfItems: 0,
  itemsPerPage: 10,
});

const createEditDialog = ref(false);
const photoDialog = ref(false);
const confirmationDialog = ref(false);
const selectedItem = ref<any | null>(null);
const itemToDelete = ref<any | null>(null);
const deleting = ref(false);

const headers = [
  { title: "" },
  { title: "Foto" },
  { title: "Nombre completo" },
  { title: "Puesto" },
  { title: "Contrato" },
  { title: "Teléfono" },
  { title: "Salario", align: "end" },
  { title: "Acciones", align: "center" },
];

/* ──────────────── Helpers ──────────────── */
const fullName = (p: any) =>
  [p.name, p.lastName, p.secondLastName].filter(Boolean).join(" ");

const getContractInfo = (val: string) =>
  CONTRACT_TYPES.find((c) => c.value === val) || { value: val, label: val || "—", color: "grey" };

const getEscolarityLabel = (val: string) =>
  ESCOLARITY_OPTIONS.find((e) => e.value === val)?.label || val || "—";

const formatSalary = (salary: any) => {
  if (salary == null || salary === "") return "—";
  const num = typeof salary === "string" ? parseFloat(salary.replace(/,/g, "")) : Number(salary);
  if (!Number.isFinite(num)) return "—";
  return num.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
};

const formatPhoneDisplay = (phone: string) => {
  if (!phone) return "—";
  const d = phone.replace(/\D/g, "");
  if (d.length !== 10) return phone;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 10)}`;
};

const initials = (p: any) => {
  const n = (p.name || "").charAt(0);
  const l = (p.lastName || "").charAt(0);
  return (n + l).toUpperCase() || "?";
};

const toggleExpand = (id: string) => {
  const idx = expandedRows.value.indexOf(id);
  if (idx > -1) expandedRows.value.splice(idx, 1);
  else expandedRows.value.push(id);
};

const getActionMenu = () => [
  { title: "Editar", icon: "ph-pencil", value: "edit" },
  { title: "Foto", icon: "ph-camera", value: "photo" },
  { title: "Eliminar", icon: "ph-trash", value: "delete" },
];

const onSelectAction = (option: string, item: any) => {
  selectedItem.value = item;
  if (option === "edit") createEditDialog.value = true;
  else if (option === "photo") photoDialog.value = true;
  else if (option === "delete") {
    itemToDelete.value = item;
    confirmationDialog.value = true;
  }
};

/* ──────────────── Carga ──────────────── */
const getPersonal = async () => {
  try {
    loading.value = true;
    const response = await personalService.getPersonal({
      page: page.value,
      limit: config.value.itemsPerPage,
      search: props.filters?.query || "",
    });
    tableData.value = response.data.data.list || [];
    config.value.noOfItems = response.data.data.total || 0;
    config.value.end = tableData.value.length;
    config.value.start = tableData.value.length > 0 ? 1 : 0;
  } catch {
    showErrorAlert("No se pudo cargar el listado de personal");
  } finally {
    loading.value = false;
  }
};

/* ──────────────── Eliminar ──────────────── */
const onConfirmDelete = async () => {
  if (!itemToDelete.value) return;
  try {
    deleting.value = true;
    await personalService.deletePersonal(itemToDelete.value.id);
    showSuccessAlert("Personal eliminado");
    confirmationDialog.value = false;
    itemToDelete.value = null;
    await getPersonal();
  } catch {
    showErrorAlert("No se pudo eliminar el registro");
  } finally {
    deleting.value = false;
  }
};

const openCreate = () => {
  selectedItem.value = null;
  createEditDialog.value = true;
};

defineExpose({ openCreate, refresh: getPersonal });

onMounted(getPersonal);
watch([page, () => config.value.itemsPerPage, () => props.filters.query], getPersonal);
</script>

<template>
  <Table
    :header-items="headers"
    :is-pagination="true"
    v-model="page"
    :config="config"
    :loading="loading"
  >
    <template #body>
      <template v-if="tableData.length === 0 && !loading">
        <tr>
          <td :colspan="headers.length" class="text-center py-8 text-medium-emphasis">
            <v-icon icon="ph-users" size="40" class="mb-2" color="grey-lighten-1" />
            <div>Sin personal registrado</div>
          </td>
        </tr>
      </template>

      <template v-for="p in tableData" :key="p.id">
        <tr :class="{ 'bg-blue-grey-lighten-5': expandedRows.includes(p.id) }">
          <td>
            <v-btn
              variant="text"
              size="small"
              :icon="expandedRows.includes(p.id) ? 'ph-caret-up' : 'ph-caret-down'"
              @click="toggleExpand(p.id)"
            />
          </td>
          <td>
            <v-avatar size="40" color="grey-lighten-2">
              <v-img v-if="p.photo" :src="p.photo" cover />
              <span v-else class="text-caption font-weight-bold">{{ initials(p) }}</span>
            </v-avatar>
          </td>
          <td>
            <div class="font-weight-medium">{{ fullName(p) }}</div>
            <div class="text-caption text-medium-emphasis">{{ p.curp || "—" }}</div>
          </td>
          <td>{{ p.position?.name || "—" }}</td>
          <td>
            <v-chip
              :color="getContractInfo(p.contractType).color"
              size="small"
              variant="tonal"
              label
            >
              {{ getContractInfo(p.contractType).label }}
            </v-chip>
          </td>
          <td>{{ formatPhoneDisplay(p.phone) }}</td>
          <td class="text-end font-weight-medium">{{ formatSalary(p.salary) }}</td>
          <td class="text-center">
            <ListMenuWithIcon
              icon="ph-dots-three-vertical"
              :menu-items="getActionMenu()"
              variant="text"
              color="primary"
              @on-select="(opt) => onSelectAction(opt, p)"
            />
          </td>
        </tr>

        <!-- ── Fila expandida ── -->
        <tr v-if="expandedRows.includes(p.id)">
          <td :colspan="headers.length" class="pa-0">
            <v-expand-transition>
              <div class="pa-5 bg-grey-lighten-5 border-b">
                <v-row>
                  <!-- Datos personales -->
                  <v-col cols="12" md="3">
                    <div class="d-flex align-center mb-2">
                      <v-icon size="18" color="primary" class="mr-2">ph-user</v-icon>
                      <span class="text-subtitle-2 font-weight-bold">Datos personales</span>
                    </div>
                    <div class="pl-7">
                      <div class="text-caption text-grey">Sexo</div>
                      <div class="text-body-2 mb-1">{{ p.sex || "—" }}</div>

                      <div class="text-caption text-grey">Fecha de nacimiento</div>
                      <div class="text-body-2 mb-1">{{ formatDate(p.birthDate) }}</div>

                      <div class="text-caption text-grey">Edad</div>
                      <div class="text-body-2">{{ p.age != null ? `${p.age} años` : "—" }}</div>
                    </div>
                  </v-col>

                  <!-- Datos laborales -->
                  <v-col cols="12" md="3">
                    <div class="d-flex align-center mb-2">
                      <v-icon size="18" color="primary" class="mr-2">ph-briefcase</v-icon>
                      <span class="text-subtitle-2 font-weight-bold">Datos laborales</span>
                    </div>
                    <div class="pl-7">
                      <div class="text-caption text-grey">Fecha de ingreso</div>
                      <div class="text-body-2 mb-1">{{ formatDate(p.entryDate) }}</div>

                      <div class="text-caption text-grey">Escolaridad</div>
                      <div class="text-body-2 mb-1">{{ getEscolarityLabel(p.escolarity) }}</div>

                      <div class="text-caption text-grey">Empresa</div>
                      <div class="text-body-2">{{ p.company?.name || "—" }}</div>
                    </div>
                  </v-col>

                  <!-- Contacto -->
                  <v-col cols="12" md="3">
                    <div class="d-flex align-center mb-2">
                      <v-icon size="18" color="primary" class="mr-2">ph-phone</v-icon>
                      <span class="text-subtitle-2 font-weight-bold">Contacto</span>
                    </div>
                    <div class="pl-7">
                      <div class="text-caption text-grey">Teléfono</div>
                      <div class="text-body-2 mb-1">{{ formatPhoneDisplay(p.phone) }}</div>

                      <div class="text-caption text-grey">Dirección</div>
                      <div class="text-body-2" style="white-space: pre-wrap;">{{ p.address || "—" }}</div>
                    </div>
                  </v-col>

                  <!-- Sistema -->
                  <v-col cols="12" md="3">
                    <div class="d-flex align-center mb-2">
                      <v-icon size="18" color="primary" class="mr-2">ph-clock</v-icon>
                      <span class="text-subtitle-2 font-weight-bold">Sistema</span>
                    </div>
                    <div class="pl-7">
                      <div class="text-caption text-grey">Registrado</div>
                      <div class="text-body-2 mb-1">{{ formatDate(p.createdAt) }}</div>

                      <div class="text-caption text-grey">Actualizado</div>
                      <div class="text-body-2">{{ formatDate(p.updatedAt) }}</div>
                    </div>
                  </v-col>
                </v-row>
              </div>
            </v-expand-transition>
          </td>
        </tr>
      </template>
    </template>
  </Table>

  <CreateEditPersonalDialog
    v-model="createEditDialog"
    :item="selectedItem"
    @refresh="getPersonal"
  />

  <PersonalPhotoDialog
    v-model="photoDialog"
    :item="selectedItem"
    @refresh="getPersonal"
  />

  <RemoveItemConfirmationDialog
    v-if="confirmationDialog"
    v-model="confirmationDialog"
    :loading="deleting"
    title="Eliminar personal"
    @on-confirm="onConfirmDelete"
  >
    <template #text>
      ¿Eliminar al personal <strong>{{ fullName(itemToDelete) }}</strong>?
      Esta acción no se puede deshacer.
    </template>
  </RemoveItemConfirmationDialog>
</template>
