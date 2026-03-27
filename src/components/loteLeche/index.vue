<script lang="ts" setup>
import { ref } from "vue";
import TopFilters from "./TopFilters.vue";
import Listing from "./Listing.vue";

/**
 * ID estático obtenido del response de tipos de lote.
 * Asegura que este módulo solo gestione lotes de LECHE.
 */
const BATCH_TYPE_LECHE = "e5c750ea-b81d-46e3-92fb-5237df6f4418";

const filters = ref({
  query: "",
  companyId: null,
  batchTypeId: BATCH_TYPE_LECHE,
  status: "ACTIVO",
});
</script>

<template>
  <div class="pa-4 flex-grow-1">
    <div class="d-flex align-center mb-6">
      <v-avatar color="blue-darken-2" variant="tonal" class="mr-4" size="48">
        <v-icon size="28">ph-drop</v-icon>
      </v-avatar>
      <div>
        <div class="text-h5 font-weight-black text-uppercase tracking-tight">Módulo de Producción de Leche</div>
        <div class="text-caption text-grey-darken-1">Gestión de lotes, asignación de ganado y control de producción diaria</div>
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
