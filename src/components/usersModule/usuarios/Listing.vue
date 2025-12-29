<script lang="ts" setup>
import { ref, watch, computed, onMounted } from "vue";
import {
  users,
  usersHeader,
  userAction,
} from "@/components/usersModule/usuarios/utils";

import Table from "@/app/common/components/Table.vue";
import { UserType } from "@/components/usersModule/usuarios/types";
import CreateEditUsuarioDialog from "@/components/usersModule/usuarios/CreateEditUsuarioDialog.vue";
import ResetPasswordDialog from "@/components/usersModule/usuarios/PasswordDialog.vue";
import RemoveItemConfirmationDialog from "@/app/common/components/RemoveItemConfirmationDialog.vue";
import { userService } from "@/app/http/httpServiceProvider";
import { showErrorAlert, showSuccessAlert } from "@/app/services/alertService";

const prop = defineProps({
  filters: {
    type: Object,
    default: () => { },
  },
});

import { toCamelCase, formatPhoneMX } from "@/app/common/types/stringUtils";

const createEditDialog = ref(false);
const selectedDetail = ref<UserType | null>(null);

const confirmationDialog = ref(false);
const confirmationUser = ref<UserType | null>(null);

const isAllChecked = ref(false);
const mappedUsers = users.map((data) => {
  return {
    ...data,
    isChecked: false,
  };
});

const filteredUsers = ref<UserType[]>(mappedUsers);
const finalData = ref<UserType[]>(filteredUsers.value);

const page = ref(1);
const noOfItems = computed(() => {
  return finalData.value.length;
});
const tableData = ref<UserType[]>([]);
const loading = ref(false);
const loadingModal = ref(false);
const showResetDialog = ref(false);
const userToReset = ref<UserType | null>(null);

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

  const data = filteredUsers.value.slice(config.value.start, config.value.end);

  loading.value = true;
  tableData.value = [];

  setTimeout(() => {
    tableData.value = data;
    loading.value = false;
  }, 200);
};

onMounted(() => {
  getUsers();
});


const getUsers = async () => {
  try {
    loading.value = true;
    const response = await userService.getUsers(); // Llamada al servicio
    let usuariosResponse = response.data.data;
    filteredUsers.value = usuariosResponse; // Guardamos los usuarios obtenidos
    finalData.value = usuariosResponse;
    updateTableData(usuariosResponse);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
  } finally {
    loading.value = false;
  }
};


watch(page, (newPage: number) => {
  config.value.page = newPage;
  getPaginatedData();
});

const query = computed(() => prop.filters.query);

watch(query, (newQuery: string) => {
  const val = newQuery.toLowerCase();
  filteredUsers.value = finalData.value.filter((user) =>
    user.name.toLowerCase().includes(val) ||
    user.last_name.toLowerCase().includes(val) ||
    user.mail.toLowerCase().includes(val)
  );
  updateTableData(filteredUsers.value);
});

const onSelectAll = () => {
  isAllChecked.value = !isAllChecked.value;
  filteredUsers.value = filteredUsers.value.map((value) => ({
    ...value,
    isChecked: isAllChecked.value,
  }));
};

const onSelect = (option: string, data: UserType) => {
  if (option === "edit") {
    selectedDetail.value = data;
    createEditDialog.value = true;
  } else if (option === "remove") {
    confirmationDialog.value = true;
    confirmationUser.value = data;
  }
  else if (option === "password") {
    showResetDialog.value = true;
    confirmationUser.value = data;
  }
};

watch(createEditDialog, (dialog: boolean) => {
  if (!dialog) selectedDetail.value = null;
});

watch(confirmationDialog, (dialog: boolean) => {
  if (!dialog) confirmationUser.value = null;
});

const onUpdate = async (updatedVal: UserType) => {
  try {

    loading.value = true;
    const response = await userService.updateUser(updatedVal, updatedVal.uuid);

    if ([200, 201].includes(response.data.statusCode)) {
      showSuccessAlert("Usuario actualizado con éxito");
      filteredUsers.value = filteredUsers.value.map((user) =>
        user.uuid === updatedVal.uuid ? { ...user, ...updatedVal } : user
      );
      finalData.value = filteredUsers.value;
      updateTableData(filteredUsers.value);
      getUsers();
    }
    else {
      showErrorAlert('(' + response.data.data + ')', 1);
    }
  } catch (error) {
    showErrorAlert('¡Error!' + error, 2);
  }
  finally {
    loading.value = false;
    createEditDialog.value = false;
  }

};

const onCreate = async (newVal: UserType) => {
  try {

    loading.value = true;
    const response = await userService.createUser(newVal);
    if ([200, 201].includes(response.data.statusCode)) {
      showSuccessAlert("Usuario agregado con éxito");
      filteredUsers.value.unshift(newVal);
      finalData.value = filteredUsers.value;
      updateTableData(filteredUsers.value);
      getUsers();
    }
    else {
      showErrorAlert('(' + response.data.data + ')', 3);
    }
  } catch (error) {
    showErrorAlert('¡Error!' + error, 4);
  }
  finally {
    loading.value = false;
    createEditDialog.value = false;
  }
}




const onConfirmDelete = async () => {
  try {

    loading.value = true;
    const response = await userService.deleteUser(confirmationUser?.value?.uuid);
    if ([200, 201].includes(response.data.statusCode)) {
      showSuccessAlert("Usuario eliminado con éxito");
      filteredUsers.value = filteredUsers.value.filter(
        (user) => user.uuid !== confirmationUser.value?.uuid
      );
      updateTableData(filteredUsers.value);
      getUsers();
    }
    else {
      showErrorAlert('(' + response.data.data + ')', 5);
    }
  } catch (error) {
    showErrorAlert('¡Error!' + error, 6);
  }
  finally {
    loading.value = false;
    confirmationDialog.value = false;
  }


};

const resetPassword = async (params: any) => {
  try {

    const response = await userService.resetPassword(params.password, params.userId);
    if ([200, 201].includes(response.data.statusCode)) {
      showSuccessAlert("Contraseña restablecida con éxito");
    } else {
      showErrorAlert("Error: " + response.data.data, 7);
    }
  } catch (e) {
    showErrorAlert("Error al restablecer contraseña", 8);
  }
};

const updateTableData = (newVal: UserType[]) => {
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
    last_name: "",
    phone: "",
    uuidRol: "",
    mail: "",
    password: "",
    nameRol: "",
    role: {
      uuid: "",
      name: ""
    }
  };
  createEditDialog.value = true;
};
</script>

<template>
  <v-card>
    <v-card-title class="text-subtitle-1 font-weight-bold d-flex justify-space-between align-center">
      <div>Usuarios</div>
      <v-btn color="primary" elevation="0" class="mt-2" @click="onAddUserClick()">
        <i class="ph-plus-circle mx-1" /> Agregar Usuario
      </v-btn>
    </v-card-title>
    <v-card-text>
      <Table v-model="page" :config="config" :headerItems="usersHeader" is-pagination :loading="loading"
        @onSelectAll="onSelectAll">
        <template #body>
          <tr v-for="item in tableData" :key="item.uuid">
            <td>
              <div class="d-flex align-center">
                <span class="font-weight-bold">{{ item?.role?.name }}</span>
              </div>
            </td>

            <td>
              <div class="d-flex align-center">
                {{ item.name }}
              </div>
            </td>
            <td>{{ item?.last_name }}</td>
            <td>{{ formatPhoneMX(item?.phone) }}</td>
            <td>{{ item?.mail }}</td>
            <td>
              <ListMenuWithIcon :menuItems="userAction" @onSelect="onSelect($event, item)" />
            </td>
          </tr>
        </template>
      </Table>
      <div v-if="!filteredUsers.length" class="text-center pa-7">
        <v-avatar color="primary" variant="tonal" size="x-large">
          <i class="ph-magnifying-glass ph-lg"></i>
        </v-avatar>
        <div class="text-subtitle-1 font-weight-bold">¡No se encontraron resultados!</div>
      </div>
    </v-card-text>
  </v-card>
  <CreateEditUsuarioDialog v-if="selectedDetail" v-model="createEditDialog" :userDetail="selectedDetail"
    :loading="loadingModal" @onUpdate="onUpdate" @onCreate="onCreate" />
  <RemoveItemConfirmationDialog v-if="confirmationUser" v-model="confirmationDialog" @onConfirm="onConfirmDelete" />
  <ResetPasswordDialog v-if="confirmationUser" v-model="showResetDialog" :userId="confirmationUser.uuid"
    @onConfirm="resetPassword" />
</template>
