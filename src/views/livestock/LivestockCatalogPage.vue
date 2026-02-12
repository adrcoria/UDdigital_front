<script lang="ts" setup>
import Breadcrumb from "@/app/common/components/Breadcrumb.vue"; // Ajusta ruta si es necesario
import Catalogs from "@/components/LivestockModule/catalogs/index.vue";
// Nota: Aquí podrías importar un livestockBreadcrumb desde sus utils
</script>

<template>
  <Breadcrumb title="Administración de Ganado" :items="[]" />
  <Catalogs />
</template>