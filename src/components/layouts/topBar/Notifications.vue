<script lang="ts" setup>
import { ref, computed, onMounted } from "vue";
import Notification from "@/components/layouts/topBar/Notification.vue";
import { userService } from "@/app/http/httpServiceProvider";
import { showErrorAlert, showSuccessAlert } from "@/app/services/alertService";
import { DIR } from "@/app/const";
import { useLayoutStore } from "@/store/app";
import { getBackendErrorMessage } from "@/app/services/errorService";

const state = useLayoutStore();
const notifications = ref([]);

const unreadMessages = computed(() =>
  notifications.value.filter((n) => !n.read)
);

const readMessages = computed(() =>
  notifications.value.filter((n) => !!n.read)
);

const isFooterVisible = computed(() =>
  notifications.value.some((n) => n.isSelected || !n.isRead)
);

const selectedMsg = computed(() =>
  notifications.value.filter((n) => n.isSelected).length
);

const isRtl = computed(() => state.dir === DIR.RTL);

const onRemove = () => {
  notifications.value = notifications.value.filter((n) => !n.isSelected);
};

// Obtener usuario desde localStorage/sessionStorage
const user = JSON.parse(
  localStorage.getItem("user") || sessionStorage.getItem("user") || "{}"
);
const uuid = user.uuid;

// Función para consultar las notificaciones del usuario
const getNotifications = async () => {
  try {
    if (!uuid) return;
    const res = await userService.getNotifications(uuid);
    const rawNotifications = res.data.data || [];

    notifications.value = rawNotifications.map((n: any) => {
      const kind = n.type.startsWith("WORK_ORDER") ? "suscription"
        : n.type.startsWith("SINISTER") ? "sinister"
          : "unknown";

      return {
        ...n,
        kind,
      };
    });
  } catch (error: any) {
    // const msg = getBackendErrorMessage(error, "Error al obtener notificaciones");
    // showErrorAlert(msg);
  }
};
// Marcar todas como leídas
const marcarTodoComoLeido = async () => {
  try {
    const pendientes = notifications.value.filter(n => !n.read);
    for (const noti of pendientes) {
      await userService.readNotification(noti.uuid);
      noti.read = true;
    }
    showSuccessAlert("Todas las notificaciones fueron marcadas como leídas.");
  } catch (error) {
    console.error("Error al marcar como leídas", error);
    const msg = getBackendErrorMessage(error, "No se pudieron marcar todas como leídas");
    showErrorAlert(msg);
  }
};

const marcarSeleccionadasComoLeidas = async () => {
  try {
    const seleccionadas = notifications.value.filter(n => n.isSelected && !n.read);
    for (const noti of seleccionadas) {
      await userService.readNotification(noti.uuid);
      noti.read = true;
    }
    showSuccessAlert("Notificaciones seleccionadas marcadas como leídas.");
  } catch (error) {
    console.error("Error al marcar seleccionadas como leídas", error);
    const msg = getBackendErrorMessage(error, "No se pudieron marcar las seleccionadas");
    showErrorAlert(msg);
  }
};


const noHayNotificaciones = computed(() => {
  return notifications.value.length === 0;
});

onMounted(() => {
  getNotifications();
});
</script>

<template>
  <v-menu :close-on-content-click="false">
    <template v-slot:activator="{ props }">
      <v-btn variant="text" v-bind="props" icon class="btn-ghost-dark">
        <v-badge color="danger" :content="unreadMessages.length" :location="isRtl ? 'left top' : 'end top'"
          offset-x="-3" offset-y="-7">
          <i class="ph-thin ph-bell ph-xl"></i>
        </v-badge>
      </v-btn>
    </template>

    <v-card width="320" style="overflow: hidden">
      <v-card-title>
        <h5>
          <div class="text-subtitle-2 font-weight-medium">ALERTAS DE VENCIMIENTO</div>
        </h5>
        <span class="font-weight-regular text-muted">
          Atender a la brevedad los siguientes folios
        </span>
      </v-card-title>

      <v-divider />

      <v-card-text data-simplebar style="max-height: 300px" class="px-2">
        <div v-if="noHayNotificaciones" class="text-center text-muted my-4">
          No existen alertas
        </div>

        <template v-else>
          <div v-for="notification in unreadMessages" :key="notification.id"
            class="notification-item d-block dropdown-item position-relative unread-message">
            <Notification :notification="notification" />
          </div>
        </template>
      </v-card-text>

      <v-divider />

      <v-card-actions v-if="isFooterVisible" class="d-flex flex-column text-muted text-caption py-1 px-2">
        <!-- <v-btn
          v-if="unreadMessages.length"
          variant="text"
          color="primary"
          class="mb-1"
          @click="marcarTodoComoLeido"
        >
          <i class="ph ph-check-circle me-1" />
          Marcar todo como leído
        </v-btn> -->

        <v-btn v-if="selectedMsg" variant="outlined" color="secondary" class="mb-1"
          @click="marcarSeleccionadasComoLeidas">
          <i class="ph ph-check-square me-1" />
          Marcar solo seleccionadas
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>
