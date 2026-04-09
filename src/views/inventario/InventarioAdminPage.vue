<script lang="ts" setup>
import Breadcrumb from "@/app/common/components/Breadcrumb.vue";
import InventarioAdmin from "@/components/inventario/admin/index.vue";

const breadcrumbItems = [
  { title: "Inventarios", disabled: false, href: "#" },
  { title: "Administrar", disabled: true, href: "#" },
];
</script>

<template>
  <Breadcrumb title="Administrar Inventario" :items="breadcrumbItems" />
  <div class="pa-4 flex-grow-1">
    <div class="d-flex align-center mb-6">
      <v-avatar color="teal-darken-1" variant="tonal" class="mr-4" size="48">
        <v-icon size="28">ph-warehouse</v-icon>
      </v-avatar>
      <div>
        <div class="text-h5 font-weight-black text-uppercase tracking-tight">Administrar Inventario</div>
        <div class="text-caption text-grey-darken-1">Control de existencias por producto</div>
      </div>
    </div>
    <InventarioAdmin />
  </div>
</template>

<style scoped>
.tracking-tight { letter-spacing: -0.02em; }
</style>
