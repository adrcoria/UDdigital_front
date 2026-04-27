<script lang="ts" setup>
import Breadcrumb from "@/app/common/components/Breadcrumb.vue";
import PositionsIndex from "@/components/personal/positions/index.vue";

const breadcrumbItems = [
  { title: "Personal", disabled: false, href: "#" },
  { title: "Puestos", disabled: true, href: "#" },
];
</script>

<template>
  <Breadcrumb title="Catálogo de Puestos" :items="breadcrumbItems" />
  <PositionsIndex />
</template>
