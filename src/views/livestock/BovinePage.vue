<script lang="ts" setup>
import Breadcrumb from "@/app/common/components/Breadcrumb.vue";
import BovineIndex from "@/components/bovines/index.vue";
// Puedes definir los items del breadcrumb aquí o en utils
const breadcrumbItems = [
  { title: 'Ganadería', disabled: false, href: '#' },
  { title: 'Bovinos', disabled: true, href: '#' }
];
</script>

<template>
  <Breadcrumb title="Administración de Ganado" :items="breadcrumbItems" />
  <BovineIndex />
</template>