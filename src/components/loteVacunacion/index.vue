<script lang="ts" setup>
import { ref } from "vue";
import TopFilters from "./TopFilters.vue";
import Listing from "./Listing.vue";
import { BATCH_TYPE_IDS } from "@/app/livestock.constants";

const filters = ref({
  query: "",
  batchTypeId: BATCH_TYPE_IDS.VACUNACION,
  status: "ACTIVO",
});
</script>

<template>
  <div class="pa-4 flex-grow-1">
    <div class="d-flex align-center mb-6">
      <v-avatar color="teal-darken-1" variant="tonal" class="mr-4" size="48">
        <v-icon size="28">ph-syringe</v-icon>
      </v-avatar>
      <div>
        <div class="text-h5 font-weight-black text-uppercase tracking-tight">Módulo de Vacunación</div>
        <div class="text-caption text-grey-darken-1">Gestión de campañas de vacunación y aplicación de vacunas al ganado</div>
      </div>
    </div>

    <TopFilters v-model="filters" />

    <v-divider class="my-6 border-opacity-25"></v-divider>

    <Listing :filters="filters" />
  </div>
</template>

<style scoped>
.tracking-tight {
  letter-spacing: -0.02em;
}
</style>
