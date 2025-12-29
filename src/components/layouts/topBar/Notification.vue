<script lang="ts" setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { DIR } from "@/app/const";
import { useLayoutStore } from "@/store/app";

const state = useLayoutStore();
const router = useRouter();

const props = defineProps({
  notification: {
    type: Object,
    required: true,
  },
  displayMode: {
    type: String,
    default: "card", // card | table
  },
});

/* =========================
 * BASE
 * ========================= */
const notification = computed(() => props.notification);
const isRtl = computed(() => state.dir === DIR.RTL);

/* =========================
 * DATOS DIRECTOS (BACKEND)
 * ========================= */
const title = computed(() => notification.value.title || "—");
const message = computed(() => notification.value.description || "—");
const subscriptionFolio = computed(() => notification.value.subscriptionFolio || "—");
const farmerName = computed(() => notification.value.farmerName || "—");
const subscriptionType = computed(() => notification.value.subscriptionType || "—");

/* =========================
 * TIPO DE ALERTA (DESDE type)
 * ========================= */
const alertTypeLabel = computed(() => {
  const type = notification.value.type || "";

  if (type.includes("HARVEST")) return "Aviso de cosecha";
  if (type.includes("SINISTER")) return "Siniestro";
  if (type.includes("WORK_ORDER")) return "Orden de trabajo";

  return "General";
});

const alertTypeColor = computed(() => {
  const type = notification.value.type || "";

  if (type.includes("HARVEST")) return "green";
  if (type.includes("SINISTER")) return "red";
  if (type.includes("WORK_ORDER")) return "primary";

  return "grey";
});

/* =========================
 * NAVEGACIÓN (AJUSTABLE)
 * ========================= */
function goToDetail() {
  const type = notification.value.type || "";
  const uuid = notification.value.uuid;
  if (!uuid) return;
  if (type.includes("HARVEST")) {
    router.push({ name: "avisoDetail", params: { uuid } });
    return;
  }

  if (type.includes("SINISTER")) {
    router.push({ name: "siniestroDetail", params: { uuid } });
    return;
  }

  router.push({ name: "suscriptionDetail", params: { uuid } });
}

</script>

<template>
  <!-- =========================
       MODO CARD
  ========================== -->
  <div v-if="displayMode === 'card'" class="d-flex">
    <div class="flex-grow-1">
      <!-- TÍTULO -->
      <h6 class="mt-0 mb-1 text-subtitle-2 font-weight-bold">
        {{ title }}
      </h6>

      <!-- MENSAJE -->
      <p class="mb-2" style="cursor: pointer; text-decoration: underline;" @click="goToDetail">
        {{ message }}
      </p>

      <!-- CHIP TIPO SUSCRIPCIÓN -->
      <v-chip small color="green-lighten-1" class="me-1">
        {{ subscriptionType }}
      </v-chip>

      <!-- CHIP TIPO ALERTA -->
      <v-chip small :color="alertTypeColor" class="me-1">
        {{ alertTypeLabel }}
      </v-chip>

      <!-- FOLIO -->
      <p class="mb-0 text-muted" style="font-size: 0.75rem;">
        Folio: <b>{{ subscriptionFolio }}</b>
      </p>

      <!-- PRODUCTOR -->
      <p class="mb-0 text-muted" style="font-size: 0.75rem;">
        Productor: <b>{{ farmerName }}</b>
      </p>
    </div>
  </div>

  <!-- =========================
       MODO TABLA
  ========================== -->
  <tr v-else class="hover-row" style="cursor: pointer;" @click="goToDetail">
    <td>{{ subscriptionType }}</td>
    <td>{{ title }}</td>
    <td>{{ message }}</td>
    <td>{{ subscriptionFolio }}</td>
    <td>{{ farmerName }}</td>
    <td>
      <v-chip small :color="alertTypeColor">
        {{ alertTypeLabel }}
      </v-chip>
    </td>
  </tr>
</template>

<style scoped>
.hover-row:hover {
  background-color: #f9f9f9;
  border-left: 3px solid #ff9800;
  transition: all 0.2s;
}

td {
  padding: 8px 12px;
  font-size: 0.85rem;
  vertical-align: middle;
}
</style>
