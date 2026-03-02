<script lang="ts" setup>
import { ref } from "vue";
import TopFilters from "./TopFilters.vue";
import Listing from "./Listing.vue";

/** * ID estático obtenido del response de tipos de lote.
 * Esto asegura que este módulo solo gestione ENGORDA.
 */
const BATCH_TYPE_ENGORDA = "5ed37fc4-28a6-4e21-9541-0ab072b8186e";

const filters = ref({
  query: "",
  companyId: null,
  batchTypeId: BATCH_TYPE_ENGORDA, // Forzado para Engorda
  status: "ACTIVO",
});
</script>

<template>
  <div class="pa-4 flex-grow-1">
    <div class="d-flex align-center mb-6">
      <v-avatar color="primary" variant="tonal" class="mr-4" size="48">
        <v-icon size="28">ph-chart-line-up</v-icon>
      </v-avatar>
      <div>
        <div class="text-h5 font-weight-black text-uppercase tracking-tight">Módulo de Engorda</div>
        <div class="text-caption text-grey-darken-1">Gestión de lotes, asignación de ganado y control de peso diario</div>
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