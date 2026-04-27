<script lang="ts" setup>
import Breadcrumb from "@/app/common/components/Breadcrumb.vue";
import VentaGanadoIndex from "@/components/ventaGanado/index.vue";

const breadcrumbItems = [
  { title: "Ganadería", disabled: false, href: "#" },
  { title: "Venta de Ganado", disabled: true, href: "#" },
];
</script>

<template>
  <Breadcrumb title="Venta de Ganado" :items="breadcrumbItems" />
  <VentaGanadoIndex />
</template>
