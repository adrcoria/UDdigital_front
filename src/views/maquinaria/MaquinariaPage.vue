<script lang="ts" setup>
import Breadcrumb from "@/app/common/components/Breadcrumb.vue";
import MaquinariaIndex from "@/components/maquinaria/index.vue";

const breadcrumbItems = [
  { title: "Operación", disabled: false, href: "#" },
  { title: "Maquinaria", disabled: true, href: "#" },
];
</script>

<template>
  <Breadcrumb title="Gestión de Maquinaria" :items="breadcrumbItems" />
  <MaquinariaIndex />
</template>
