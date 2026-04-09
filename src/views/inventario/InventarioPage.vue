<script lang="ts" setup>
import Breadcrumb from "@/app/common/components/Breadcrumb.vue";
import InventarioCatalogs from "@/components/inventario/catalogs/index.vue";

const breadcrumbItems = [
  { title: "Inventarios", disabled: false, href: "#" },
  { title: "Catálogos", disabled: true, href: "#" },
];
</script>

<template>
  <Breadcrumb title="Módulo de Inventarios" :items="breadcrumbItems" />
  <div class="pa-4 flex-grow-1">
    <div class="d-flex align-center mb-6">
      <v-avatar color="primary" variant="tonal" class="mr-4" size="48">
        <v-icon size="28">ph-package</v-icon>
      </v-avatar>
      <div>
        <div class="text-h5 font-weight-black text-uppercase tracking-tight">Módulo de Inventarios</div>
        <div class="text-caption text-grey-darken-1">Gestión de productos, marcas y subcategorías</div>
      </div>
    </div>
    <InventarioCatalogs />
  </div>
</template>

<style scoped>
.tracking-tight { letter-spacing: -0.02em; }
</style>
